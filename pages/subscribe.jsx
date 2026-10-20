import Head from "next/head";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ConfigProvider,
  Input,
  message,
  Modal,
  Select,
} from "antd";
import useTranslation from "next-translate/useTranslation";
import C from "~/styles/checkout.module.css";
import { BoltIcon, Btn, CheckIcon, CloseIcon, LockIcon, UsersIcon } from "~/components/CheckoutUi";
import {
  cancelFibPayment,
  checkFibPayment,
  createParentPayLink,
  parentPayUrl,
  createSubscription,
  getCities,
  getMe,
  getMySubscriptions,
  getPlans,
  getPrograms,
  getCreditPacks,
  purchaseCreditPack,
  checkCreditPackPayment,
  apiErrorCode,
  normalizeDigits,
  toLocalPhone,
  paySubscription,
  checkProgramPayment,
  previewPromo,
  purchaseProgram,
  registerProfile,
  requestOtp,
  verifyOtp,
} from "~/utils/pepuApi";
import { FIREBASE_CONFIG, HANDOFF_WAIT_MS, startHandoff } from "~/utils/handoff";


/**
 * The web storefront for iOS students: the app can no longer sell there
 * (App Store guideline 3.1.1, no link-out on the Iraqi storefront), so this
 * page owns the whole loop — same phone OTP as the app, same plans, FIB
 * payment, instant server-side activation. The app just works afterwards.
 */


const PURPLE = "#9241FE";

/** How long the page waits on Firebase's custom-token sign-in before showing the login screen. */
const SIGN_IN_WAIT_MS = 20000;

/** The ceiling on loading a signed-in student's account (profile + shop). */
const RESTORE_WAIT_MS = 25000;

/** The share glyph on the "send to a parent" button (inline: no icon package). */
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ verticalAlign: "-3px", marginInlineEnd: 8 }}>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

export default function Subscribe() {
  const { t, lang } = useTranslation("subscribe");

  // ---- firebase bootstrap (compat SDK from the CDN) ----
  const [fbReady, setFbReady] = useState(false);
  const fbStarted = useRef(false);

  // Script onLoad only fires the FIRST time a script enters the page — after
  // a hot-reload or client-side navigation the scripts already exist and the
  // page would spin forever. bootFirebase is idempotent and reachable from
  // both script readiness and an on-mount check.
  const bootFirebase = () => {
    if (fbStarted.current) return;
    if (typeof window === "undefined") return;
    if (!window.firebase?.auth || !window.firebase?.initializeApp) return;
    fbStarted.current = true;

    if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    setFbReady(true);
    // Firebase persists the session in localStorage; on refresh this fires
    // with the surviving user and we re-enter without asking anything
    const listen = () =>
      window.firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
          setRestoring(false);
          return;
        }
        enterWithUser(user);
      });

    // Arriving from the app's checkout ad: sign in with the handoff BEFORE
    // listening, so a different account left over in this browser can't win
    // the race. Any failure just falls through to the session/login we'd
    // show anyway.
    const pending = startHandoff();
    if (!pending) {
      listen();
      return;
    }
    if (pending.used) {
      // Another page (see utils/handoff) already started the sign-in; wait
      // for it, capped, so this page enters as the app's account.
      (pending.signedIn || Promise.resolve()).then(listen);
      return;
    }
    pending.used = true;

    let settled = false;
    const giveUp = () => {
      if (settled) return;
      settled = true;
      listen();
    };
    // Capped so a stalled request can't hold the spinner, but counted from
    // HERE, once Firebase has loaded: counted from page load, a slow CDN
    // download used up the wait and a student who was signing in fine was
    // shown the login screen (and was signed in on refresh).
    const timer = setTimeout(giveUp, HANDOFF_WAIT_MS);

    pending.token.then((customToken) => {
      // Too late: the page has already moved on.
      if (settled) return;
      clearTimeout(timer);
      if (!customToken) {
        giveUp();
        return;
      }
      // Signing in: wait for it rather than show the login screen meanwhile.
      const cap = setTimeout(giveUp, SIGN_IN_WAIT_MS);
      window.firebase
        .auth()
        .signInWithCustomToken(customToken)
        .then(() => {
          // Landed after the cap. With nobody entered yet the listener picks
          // it up; if another account was entered meanwhile, start over as
          // the account Firebase now has, so the page never shows one
          // student and pays as another.
          if (settled && enteredRef.current) window.location.reload();
        })
        .catch(() => {})
        .finally(() => {
          clearTimeout(cap);
          giveUp();
        });
    });
  };

  useEffect(() => {
    // Mark this session for Clarity: "flow=subscribe" makes these sessions
    // filterable in the dashboard, and upgrade() tells Clarity to keep the
    // full recording even under sampling — the checkout is exactly the flow
    // worth watching end to end.
    if (typeof window !== "undefined" && typeof window.clarity === "function") {
      window.clarity("set", "flow", "subscribe");
      window.clarity("upgrade", "subscribe-flow");
    }
  }, []);

  useEffect(() => {
    // redeem now, in parallel with the Firebase CDN download
    startHandoff();
    bootFirebase();
    // belt-and-braces: if script events are missed entirely, poll briefly
    const timer = setInterval(() => {
      bootFirebase();
      if (fbStarted.current) clearInterval(timer);
    }, 300);
    const stop = setTimeout(() => {
      clearInterval(timer);
      // CDN unreachable — stop the spinner so the page can at least explain
      if (!fbStarted.current) setRestoring(false);
    }, 15000);
    return () => { clearInterval(timer); clearTimeout(stop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- flow state ----
  const [step, setStep] = useState(0); // 0 phone, 1 otp, 2 plans, 3 pay, 4 done
  const [busy, setBusy] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [token, setToken] = useState(null);
  const [plans, setPlans] = useState(null);
  const [plan, setPlan] = useState(null);
  const [promo, setPromo] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  // the grade button tapped in the shop (a plan's sections show under it)
  const [pickedGrade, setPickedGrade] = useState(undefined);
  // a tap on the price banner (it isn't a button) points at the grade buttons
  const gradesRef = useRef(null);
  const [nudgeGrades, setNudgeGrades] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [fib, setFib] = useState(null);
  // what the open FIB payment is for: {kind:"subscription"|"program"|"pack", id}
  const [fibTarget, setFibTarget] = useState(null);
  // the "send to a parent" link for the picked plan: {url, text}
  const [parentLink, setParentLink] = useState(null);
  const [parentBusy, setParentBusy] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [buyingProgramId, setBuyingProgramId] = useState(null);
  // companion credit packs, sold apart from the course plans
  const [packs, setPacks] = useState([]);
  const [credits, setCredits] = useState(0);
  const [buyingPackId, setBuyingPackId] = useState(null);
  // the credit pack picked on the credits tab (paid from the same bar as plans)
  const [pack, setPack] = useState(null);
  const [shopTab, setShopTab] = useState("plans");
  const idempotencyKey = useRef(null);

  const [me, setMe] = useState(null);
  const [mySubs, setMySubs] = useState([]);
  // true until Firebase resolves whether a previous session survives refresh
  const [restoring, setRestoring] = useState(true);
  // signed in, but the account didn't load (slow or failed): offer a retry,
  // not the login screen, since the student IS signed in
  const [restoreFailed, setRestoreFailed] = useState(false);
  const enteredRef = useRef(false);

  // ---- registration (accounts born on the checkout, like app onboarding) ----
  const [registering, setRegistering] = useState(false);
  const [cities, setCities] = useState([]);
  const [regName, setRegName] = useState("");
  const [regGender, setRegGender] = useState("male");
  const [regCityId, setRegCityId] = useState(null);
  const [regSchool, setRegSchool] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const pendingToken = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const errorKey = (data) =>
    ({
      invalid_phone_number: "invalidPhone",
      invalid_code: "invalidCode",
      code_expired: "codeExpired",
      code_not_found: "codeExpired",
      too_many_attempts: "tooManyAttempts",
    }[data?.error] || "genericError");

  /// Turns a rejected registration into something the student can act on.
  ///
  /// The most common rejection is a number that already belongs to an account:
  /// students who first signed up with Google or Apple in the app still own
  /// their phone number, so signing in here by OTP creates a second identity
  /// and the profile they try to create collides with the account they already
  /// have. Telling them "something went wrong" left them retrying the same
  /// form; telling them which door to use gets them in.
  const registrationErrorText = (res) => {
    const { code } = apiErrorCode(res.data);

    if (code === "duplicate_phone_number") return t("phoneAlreadyRegistered");
    if (res.status === 401 || res.status === 403) return t("sessionExpired");
    if (res.status >= 500) return t("serverError");

    // An unmapped validation code is still better shown than swallowed.
    return code ? t("genericErrorWithCode", { code }) : t("genericError");
  };

  // ---- step 0 → 1: request the OTP ----
  const sendCode = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    try {
      const res = await requestOtp(phone.trim());
      if (!res.ok) {
        message.error(t(errorKey(res.data)));
        return;
      }
      setNormalizedPhone(res.data?.phoneNumber || phone.trim());
      setResendIn(res.data?.resendAfterSeconds ?? 60);
      setCode("");
      setStep(1);
    } catch {
      message.error(t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  // ---- step 1 → 2: verify, exchange for a Firebase ID token, load plans ----
  const verify = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await verifyOtp(normalizedPhone, code.trim());
      if (!res.ok) {
        message.error(t(errorKey(res.data)));
        return;
      }
      // isNewUser is a hint, not a gate: verify mints a usable custom token
      // either way. Signing in regardless lets enterWithUser find no profile
      // and open the same registration form Google sign-ups already get —
      // turning away a student who just proved they own the number, and
      // telling them to go install the app, lost the sale outright.
      const cred = await window.firebase
        .auth()
        .signInWithCustomToken(res.data.customToken);
      await enterWithUser(cred.user);
    } catch {
      message.error(t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  // ---- common landing point for every sign-in method ----
  // idempotent: both the explicit sign-in calls and the persistence listener
  // land here, whichever wins runs once
  const enterWithUser = async (user) => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setRestoreFailed(false);
    setRestoring(true);

    // Everything here can stall in the app's in-app browser — getIdToken hits
    // Firebase, getMe hits our API, and an embedded webview drops connections
    // a real browser keeps. Any stall used to leave the spinner on forever and
    // the login buttons dead, because the restore never finished OR failed. A
    // hard ceiling turns "hang" into "fall back to the login screen".
    try {
      const restore = (async () => {
        const idToken = await user.getIdToken();

        // a brand-new identity (any provider) has no Pepu profile yet —
        // onboard right here with the same PUT /users/me the app uses
        const meRes = await getMe(idToken);
        if (meRes.status === 404) {
          pendingToken.current = idToken;
          // the OTP flow holds E.164; the form below validates 07-prefixed
          // local numbers, so hand it back in the shape it accepts
          setRegPhone(toLocalPhone(normalizedPhone));
          const citiesRes = await getCities(idToken);
          const cityList = citiesRes.data?.items ?? citiesRes.data ?? [];
          setCities(Array.isArray(cityList) ? cityList : []);
          setRegistering(true);
          return;
        }
        if (!meRes.ok) {
          throw new Error("getMe failed");
        }

        setMe(meRes.data);
        setToken(idToken);
        if (!(await loadCatalog(idToken))) {
          throw new Error("catalog failed");
        }
        setStep(2);
        // a load that outlasted the ceiling still lands: clear the retry card
        setRestoreFailed(false);
      })();

      await Promise.race([
        restore,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("restore_timeout")), RESTORE_WAIT_MS)),
      ]);
    } catch (err) {
      // Release the latch so a retry (or another sign-in) can enter again.
      enteredRef.current = false;
      if (window.firebase?.auth?.().currentUser) {
        // still signed in: the login screen would be wrong, offer a retry
        setRestoreFailed(true);
      } else if (String(err?.message).includes("timeout")) {
        message.warning(t("restoreTimedOut"));
      } else {
        message.error(t("genericError"));
      }
    } finally {
      setRestoring(false);
    }
  };

  /** Plans + owned subscriptions + marketplace programs, in one place so
   * every entry path (sign-in, restore, registration) shows the same shop. */
  const loadCatalog = async (idToken) => {
    // in parallel: one after another, four round trips from a phone in Iraq
    // could outlast the restore ceiling and drop a signed-in student at login
    const [subsRes, plansRes, programsRes, packsRes] = await Promise.all([
      getMySubscriptions(idToken),
      getPlans(idToken),
      getPrograms(idToken),
      // companion credits are extra: if they can't load (older API, a blip), the shop still works without them
      getCreditPacks(idToken).catch(() => null),
    ]);
    const subs = subsRes.data?.items ?? [];
    setMySubs(Array.isArray(subs) ? subs.filter((x) => x.isValid) : []);

    if (!plansRes.ok) {
      message.error(t("genericError"));
      return false;
    }
    const list = plansRes.data?.items ?? plansRes.data?.data ?? plansRes.data;
    // free plans are granted in the app; the checkout only sells
    setPlans(
      Array.isArray(list)
        ? list.filter((p) => (p.finalPrice ?? p.fullPrice ?? 0) > 0)
        : []
    );

    const programList = programsRes.data?.items ?? [];
    setPrograms(Array.isArray(programList) ? programList : []);

    const packList = Array.isArray(packsRes?.data?.packs) ? packsRes.data.packs : [];
    if (packsRes) setCredits(packsRes.data?.balance ?? 0);
    setPacks(packList);
    // a picked pack that's gone or already claimed is unpicked
    setPack((picked) => (picked && packList.some((x) => x.id === picked.id && !x.claimed)
      ? packList.find((x) => x.id === picked.id) : null));
    // a tab that has nothing to show any more falls back to the plans
    if (packList.length === 0) setShopTab((tab) => (tab === "credits" ? "plans" : tab));
    return true;
  };

  const logout = async () => {
    try {
      await window.firebase.auth().signOut();
    } catch { /* already signed out */ }
    enteredRef.current = false;
    pendingToken.current = null;
    setRestoreFailed(false);
    setMe(null);
    setMySubs([]);
    setToken(null);
    setPlans(null);
    setPlan(null);
    setPromo("");
    setPromoResult(null);
    setSubscriptionId(null);
    setFib(null);
    setFibTarget(null);
    setPrograms([]);
    setBuyingProgramId(null);
    setPacks([]);
    setCredits(0);
    setBuyingPackId(null);
    setPack(null);
    setShopTab("plans");
    setRegistering(false);
    setPhone("");
    setCode("");
    setStep(0);
  };

  const submitRegistration = async () => {
    // the app's onboarding rules: name non-empty (≤255), city picked, phone
    // digits-only and exactly 11 starting 07 (Arabic numerals normalized)
    const cleanName = regName.trim();
    const cleanPhone = normalizeDigits(regPhone).replace(/\D/g, "");
    if (!cleanName) {
      message.warning(t("nameRequired"));
      return;
    }
    if (!regCityId) {
      message.warning(t("fillRequired"));
      return;
    }
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("07")) {
      message.warning(t("invalidPhoneFormat"));
      return;
    }

    setBusy(true);
    try {
      const res = await registerProfile(pendingToken.current, {
        fullName: cleanName.slice(0, 255),
        gender: regGender,
        cityId: regCityId,
        schoolName: regSchool.trim(),
        phoneNumber: cleanPhone,
      });
      if (!res.ok) {
        message.error(registrationErrorText(res), 8);
        return;
      }

      setRegistering(false);
      const meRes = await getMe(pendingToken.current);
      if (meRes.ok) setMe(meRes.data);
      setToken(pendingToken.current);
      if (!(await loadCatalog(pendingToken.current))) {
        return;
      }
      setStep(2);
    } catch {
      message.error(t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  // ---- Google / Apple, same Firebase identities the app signs in with ----
  const oauthSignIn = async (providerId) => {
    setBusy(true);
    try {
      const provider =
        providerId === "google"
          ? new window.firebase.auth.GoogleAuthProvider()
          : new window.firebase.auth.OAuthProvider("apple.com");
      const cred = await window.firebase.auth().signInWithPopup(provider);
      await enterWithUser(cred.user);
    } catch (e) {
      if (e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request") {
        message.info(t("popupBlocked"));
      } else {
        message.error(`${t("genericError")}${e?.code ? ` (${e.code})` : ""}`);
      }
    } finally {
      setBusy(false);
    }
  };

  // ---- promo preview (server computes; page never does its own math) ----
  const applyPromo = async () => {
    if (!promo.trim() || !plan) return;
    setPromoBusy(true);
    try {
      const res = await previewPromo(token, plan.id, promo.trim());
      // A rejected code still comes back 200 — the endpoint has no error path,
      // and BillingEngine returns a result whose every amount is left at its
      // default 0. Trusting `ok` alone showed "applied, you pay 0 IQD" for an
      // expired code, then the server refused the same code at pay time.
      // `status` is the discriminator.
      if (!res.ok || res.data?.status !== "success") {
        setPromoResult(null);
        message.error(t("promoInvalid"));
        return;
      }
      setPromoResult(res.data);
      message.success(
        t("promoApplied", { amount: fmt(res.data?.paidAmount ?? 0) })
      );
    } catch {
      // try/finally with no catch left a network failure as an unhandled
      // rejection: the button stopped spinning and said nothing at all
      setPromoResult(null);
      message.error(t("genericError"));
    } finally {
      setPromoBusy(false);
    }
  };

  // ---- step 2 → 3: create draft + open the FIB payment ----
  const pay = async () => {
    if (!plan) return;
    setBusy(true);
    idempotencyKey.current = crypto.randomUUID();
    try {
      const buyRes = await createSubscription(token, idempotencyKey.current, plan.id);
      if (!buyRes.ok || buyRes.data?.state !== "draft") {
        message.error(t("genericError"));
        return;
      }
      const subId = plan.ownedSubscriptionId ?? buyRes.data.id;
      setSubscriptionId(subId);

      const payRes = await paySubscription(
        token,
        idempotencyKey.current,
        subId,
        promoResult ? promo.trim() : null
      );
      if (!payRes.ok) {
        message.error(t("genericError"));
        return;
      }
      // `transactionState`, not `state` — PaySubscriptionResponse is the one
      // payment DTO that names it that way, and reading the wrong key made
      // this branch dead: a full-discount promo settles server-side (the
      // subscription is activated and the purchase notification sent) while
      // the page fell through and reported a generic failure. The mobile app
      // reads transactionState and was never affected.
      if (payRes.data?.transactionState === "completed") {
        setStep(4);
        return;
      }
      if (payRes.data?.fib) {
        setFib(payRes.data.fib);
        setFibTarget({ kind: "subscription", id: subId });
        setStep(3);
      } else {
        message.error(t("genericError"));
      }
    } catch {
      message.error(t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  // ---- video-program purchase (same FIB panel, its own check) ----
  const buyProgram = async (program) => {
    if (buyingProgramId) return;
    setBuyingProgramId(program.id);
    try {
      const res = await purchaseProgram(token, program.id);
      if (!res.ok) {
        const already = JSON.stringify(res.data?.errors ?? "").includes("already_owned");
        message.error(already ? t("programOwned") : t("genericError"));
        return;
      }
      if (res.data?.state === "completed") {
        message.success(t("programPaid"));
        await loadCatalog(token);
        return;
      }
      if (res.data?.fib) {
        setFib(res.data.fib);
        setFibTarget({ kind: "program", id: program.id });
        setStep(3);
      } else {
        message.error(t("genericError"));
      }
    } catch {
      message.error(t("genericError"));
    } finally {
      setBuyingProgramId(null);
    }
  };

  // ---- companion credit pack (same FIB panel, its own check) ----
  const buyPack = async (pack) => {
    if (buyingPackId) return;
    setBuyingPackId(pack.id);
    try {
      const res = await purchaseCreditPack(token, pack.id);
      // a free pack is claimed at once, once per student
      if (res.ok && res.data?.state === "completed") {
        message.success(t("creditsPaid"));
        await loadCatalog(token);
        return;
      }
      if (!res.ok && JSON.stringify(res.data?.errors ?? "").includes("already_owned")) {
        message.info(t("creditsFreeClaimed"));
        await loadCatalog(token);
        return;
      }
      if (res.ok && res.data?.fib) {
        setFib(res.data.fib);
        setFibTarget({ kind: "pack", id: pack.id });
        setStep(3);
      } else {
        message.error(t("genericError"));
      }
    } catch {
      message.error(t("genericError"));
    } finally {
      setBuyingPackId(null);
    }
  };

  // ---- step 3: poll until FIB confirms ----
  const checkPayment = useCallback(async () => {
    if (!fibTarget || !token) return false;
    const res = fibTarget.kind === "program"
      ? await checkProgramPayment(token, fibTarget.id)
      : fibTarget.kind === "pack"
        ? await checkCreditPackPayment(token, fibTarget.id)
        : await checkFibPayment(token, fibTarget.id);
    if (res.ok) {
      setStep(4);
      return true;
    }
    return false;
  }, [fibTarget, token]);

  useEffect(() => {
    if (step !== 3) return;
    const timer = setInterval(checkPayment, 4000);
    return () => clearInterval(timer);
  }, [step, checkPayment]);

  const cancelPay = async () => {
    if (fibTarget?.kind === "subscription" && subscriptionId) {
      await cancelFibPayment(token, subscriptionId);
    }

    // programs and packs have no cancel endpoint — the FIB payment just expires
    setFib(null);
    setFibTarget(null);
    setStep(2);
    await loadCatalog(token);
  };

  const fmt = (n) => new Intl.NumberFormat("en-US").format(n ?? 0);

  // ---- "send to a parent": a link they pay through on their own phone ----
  // `kind` is "plan" or "pack" (a companion credit pack)
  const shareWithParent = async (item, kind = "plan") => {
    if (!item || parentBusy) return;
    setParentBusy(true);
    try {
      const res = await createParentPayLink(
        token,
        kind === "pack" ? { creditPackId: item.id } : { planId: item.id }
      );
      if (!res.ok || !res.data?.token) {
        message.error(t("genericError"));
        return;
      }
      const url = parentPayUrl(res.data.token, lang);
      const text = kind === "pack"
        ? t("parentShareMessageCredits", { credits: fmt(item.credits), amount: fmt(item.price) })
        : t("parentShareMessage", {
            plan: item.nameKurdish,
            amount: fmt(item.finalPrice ?? item.fullPrice),
          });
      setParentLink({ url, text });
    } catch {
      message.error(t("genericError"));
    } finally {
      setParentBusy(false);
    }
  };

  const copyParentLink = async () => {
    try {
      // the link alone: pasted after the message text it didn't open cleanly
      await navigator.clipboard.writeText(parentLink.url);
      message.success(t("parentCopied"));
    } catch {
      message.error(t("genericError"));
    }
  };
  const dir = lang === "en" ? "ltr" : "rtl";

  const amountDue = useMemo(() => {
    if (promoResult) return promoResult.paidAmount;
    return plan?.finalPrice ?? plan?.fullPrice ?? 0;
  }, [plan, promoResult]);

  const qrSrc = useMemo(() => {
    if (!fib?.qrCode) return null;
    return fib.qrCode.startsWith("data:")
      ? fib.qrCode
      : `data:image/png;base64,${fib.qrCode}`;
  }, [fib]);

  // The pay button used to live under the last plan card, below the fold on
  // a phone — Clarity caught a student picking a plan and leaving without
  // ever seeing it. Once a plan is picked it rides pinned to the bottom.
  // one pay bar for both tabs: the picked plan, or the picked credit pack
  const payingPack = shopTab === "credits" && !!pack;
  const showPayBar = step === 2 && !registering &&
    ((shopTab === "plans" && !!plan) || payingPack);

  // the site-wide Messenger button would sit on top of the pay button
  useEffect(() => {
    document.body.classList.toggle("pepu-paybar-open", showPayBar);
    return () => document.body.classList.remove("pepu-paybar-open");
  }, [showPayBar]);

  // the video tab is for buying: free courses are taken in the app, so it lists paid ones only
  const paidPrograms = programs.filter((x) => (x.price ?? 0) > 0);

  // 0–1 account, 2 plan, 3 pay, 4 all done
  const activeStep = step <= 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;
  const stepLabels = [t("stepPhone"), t("stepPlan"), t("stepPay")];
  const monthly = (p) => Math.round((p.finalPrice ?? p.fullPrice ?? 0) / Math.max(1, (p.standardDays || 365) / 30.4));
  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(t("copied"));
    } catch { /* clipboard blocked: the text is selectable */ }
  };

  return (
    <ConfigProvider
      direction={dir}
      theme={{
        token: {
          // match the main site: vazirlight body, Pepu purple, ink outlines
          fontFamily: "vazirlight, rabar, sans-serif",
          colorPrimary: PURPLE,
          colorText: "#1d1530",
          borderRadius: 14,
          controlHeightLG: 52,
          fontSizeLG: 17,
          colorBorder: "#d8cdef",
          lineWidth: 2,
        },
      }}
    >
    <div className={C.page} dir={dir}>
      <Head>
        <title>{t("metaTitle")}</title>
        {/* account + checkout: keep it out of search indexes */}
        <meta name="robots" content="noindex,nofollow" />
        <meta name="theme-color" content="#fbf8ff" />
      </Head>
      <Script
        src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
        onReady={bootFirebase}
      />
      <Script
        src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"
        onReady={bootFirebase}
      />


      <main className={C.wrap} style={{
        // room for the pinned pay bar so it never covers the last card
        paddingBottom: showPayBar ? "calc(250px + env(safe-area-inset-bottom))" : 40,
      }}>



        {/* one card instead of three: who's signed in, where they are, why it's safe */}
        {(!registering || me) && (
          <section className={`${C.status} ${step <= 2 && !registering ? C.statusWithOwl : ""}`}>
            {/* the pitch lives in this card: the owl peeks over its corner and goes home */}
            {step <= 2 && !registering && (
              <>
                <a href={lang === "ku" ? "/" : `/${lang}`} className={`${C.heroHome} ${C.statusOwl}`}
                   aria-label={lang === "en" ? "Pepu home" : lang === "ar" ? "الصفحة الرئيسية لبيبو" : "سەرەکیی پەپوو"}>
                  <img className={C.heroOwl} src="/assets/pepu/hello.webp" alt="" />
                </a>
                <div className={C.statusHead}>
                  <h1 className={C.heroTitle} dangerouslySetInnerHTML={{ __html: t("heroTitle") }} />
                  {step < 2 && <p className={C.heroSub}>{t("heroSub")}</p>}
                </div>
              </>
            )}
            {me && (
              <div className={C.statusAccount}>
                <span className={C.avatarSm}>{(me.fullName || "?").trim().charAt(0)}</span>
                <span className={C.accountText}>
                  <span className={C.accountName}>{me.fullName}</span>
                  {me.phoneNumber && <span className={C.accountMeta} dir="ltr">{me.phoneNumber}</span>}
                </span>
                <button type="button" className={C.codeTag} onClick={() => copyText(String(me.id))}>
                  {t("accountCode")} #{me.id}
                </button>
                <button type="button" className={C.smallLink} onClick={logout}>{t("logout")}</button>
              </div>
            )}
            {!registering && (
              <ol className={C.progress} aria-label={t("stepPay")}>
                {stepLabels.map((label, i) => (
                  <li key={label}
                      className={`${C.progressStep} ${i === activeStep ? C.progressActive : ""} ${i < activeStep ? C.progressDone : ""}`}>
                    <span className={C.progressDot}>{i < activeStep ? <CheckIcon /> : i + 1}</span>
                    <span className={C.progressLabel}>{label}</span>
                  </li>
                ))}
              </ol>
            )}
            {step <= 2 && !registering && (
              <div className={C.trustLine}>
                <span><UsersIcon /> {t("trustStudents")}</span>
                <span><LockIcon /> {t("trustSecure")}</span>
                <span><BoltIcon /> {t("trustInstant")}</span>
              </div>
            )}
          </section>
        )}

        {restoring && (
          <div className={`${C.card} ${C.loadingCard}`}>
            <img src="/assets/pepu/waiting.webp" alt="" />
            {t("restoring")}
          </div>
        )}

        {/* ---- registration for accounts that don't exist yet ---- */}
        {!restoring && registering && (
          <div className={C.card}>
            <div className={C.cardTitle}>{t("registerTitle")}</div>
            <p className={C.muted} style={{ marginBottom: 14 }}>{t("registerHint")}</p>
            <div className={C.stack}>
              <div className={C.field}>
                <label>{t("fullName")} *</label>
                <Input size="large" value={regName} onChange={(e) => setRegName(e.target.value)} />
              </div>
              <div className={C.field}>
                <label>{t("gender")} *</label>
                <div className={C.row2}>
                  <button type="button" className={`${C.btn} ${regGender === "male" ? C.btnPrimary : C.btnGhost}`}
                          onClick={() => setRegGender("male")}>{t("male")}</button>
                  <button type="button" className={`${C.btn} ${regGender === "female" ? C.btnPrimary : C.btnGhost}`}
                          onClick={() => setRegGender("female")}>{t("female")}</button>
                </div>
              </div>
              <div className={C.field}>
                <label>{t("city")} *</label>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  value={regCityId}
                  onChange={setRegCityId}
                  showSearch
                  optionFilterProp="label"
                  options={cities.map((c) => ({ value: c.id, label: c.nameKurdish ?? c.name }))}
                />
              </div>
              <div className={C.field}>
                <label>{t("phoneForAccount")} *</label>
                <Input size="large" inputMode="tel" value={regPhone} maxLength={11}
                       placeholder="07XXXXXXXXX"
                       onChange={(e) =>
                         setRegPhone(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
                       style={{ direction: "ltr", textAlign: "left" }} />
              </div>
              <div className={C.field}>
                <label>{t("school")}</label>
                <Input size="large" value={regSchool} onChange={(e) => setRegSchool(e.target.value)} />
              </div>
              <Btn variant="primary" loading={busy} onClick={submitRegistration}>{t("createAccount")}</Btn>
              <button type="button" className={C.btnLink} onClick={logout}>{t("logout")}</button>
            </div>
          </div>
        )}

        {/* ---- signed in, but the account didn't load: retry, not login ---- */}
        {!restoring && restoreFailed && (
          <div className={`${C.card} ${C.center}`}>
            <p className={C.muted} style={{ marginBottom: 14 }}>{t("restoreFailed")}</p>
            <div className={C.stack}>
              <Btn variant="primary" onClick={() => {
                const user = window.firebase?.auth?.().currentUser;
                if (user) enterWithUser(user);
                else setRestoreFailed(false);
              }}>
                {t("tryAgain")}
              </Btn>
              <Btn variant="ghost" onClick={logout}>{t("otherAccount")}</Btn>
            </div>
          </div>
        )}

        {/* ---- step 0: sign in ---- */}
        {!restoring && !restoreFailed && !registering && step === 0 && (
          <div className={C.card}>
            <div className={C.cardTitle}>{t("loginTitle")}</div>
            <p className={C.muted} style={{ marginBottom: 16 }}>{t("loginSub")}</p>
            {/* Google / Apple first and full-size; phone login is a quiet link
                below that opens the phone form. Apple sign-in works in any browser. */}
            <div className={C.stack}>
              <Btn variant="ghost" disabled={!fbReady || busy} onClick={() => oauthSignIn("google")}>
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {t("continueGoogle")}
              </Btn>
              <Btn variant="apple" disabled={!fbReady || busy} onClick={() => oauthSignIn("apple")}>
                <svg width="17" height="20" viewBox="0 0 814 1000" aria-hidden="true" fill="#fff">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
                {t("continueApple")}
              </Btn>
            </div>
            <div className={C.center} style={{ marginTop: 10 }}>
              <button type="button" className={C.btnLink} onClick={() => setShowPhone((v) => !v)}>
                {t("usePhone")} {showPhone ? "▴" : "▾"}
              </button>
            </div>
            {showPhone && (
              <div className={C.stack} style={{ marginTop: 6 }}>
                <p className={C.muted}>{t("phoneHint")}</p>
                <Input
                  size="large"
                  inputMode="tel"
                  placeholder={t("phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(normalizeDigits(e.target.value))}
                  onPressEnter={sendCode}
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                <Btn variant="primary" loading={busy} disabled={!fbReady} onClick={sendCode}>{t("sendCode")}</Btn>
              </div>
            )}
          </div>
        )}

        {/* ---- step 1: otp ---- */}
        {!restoring && !registering && step === 1 && (
          <div className={C.card}>
            <div className={C.cardTitle}>{t("verify")}</div>
            <p className={C.muted} style={{ marginBottom: 14 }}>{t("codeHint", { phone: normalizedPhone })}</p>
            <div dir="ltr">
              <Input
                size="large"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(normalizeDigits(e.target.value).replace(/\D/g, ""))}
                onPressEnter={verify}
                style={{ direction: "ltr", textAlign: "center", fontSize: 26, letterSpacing: 10, fontWeight: 800 }}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn variant="primary" loading={busy} onClick={verify}>{t("verify")}</Btn>
            </div>
            <div className={C.center} style={{ marginTop: 8 }}>
              {resendIn > 0 ? (
                <span className={C.muted}>{t("resendIn", { seconds: resendIn })}</span>
              ) : (
                <button type="button" className={C.btnLink} onClick={sendCode}>{t("resend")}</button>
              )}
              <button type="button" className={C.btnLink} onClick={() => setStep(0)}>{t("back")}</button>
            </div>
          </div>
        )}

        {/* ---- step 2: the shop — packages, video programs, credits ---- */}
        {step === 2 && (
          plans === null ? (
            <div className={`${C.card} ${C.loadingCard}`}>
              <img src="/assets/pepu/waiting.webp" alt="" />
              {t("loadingPlans")}
            </div>
          ) : (
            <>
              {mySubs.length > 0 && (
                <div className={C.owned}>
                  <div style={{ fontWeight: 800, color: "#1f7a3b", marginBottom: 6 }}>{t("mySubscriptions")}</div>
                  {mySubs.map((sub) => (
                    <div key={sub.id} className={C.ownedRow}>
                      <b>{sub.nameKurdish}</b>
                      <span className={C.muted} style={{ fontSize: 13 }}>
                        {t("validUntil")} <span dir="ltr">{new Date(sub.validTo).toLocaleDateString("en-GB")}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(paidPrograms.length > 0 || packs.length > 0) && (
                <div className={C.tabs} role="tablist">
                  {[
                    { key: "plans", label: t("plansTab") },
                    ...(packs.length > 0 ? [{ key: "credits", label: t("creditsTitle") }] : []),
                    ...(paidPrograms.length > 0 ? [{ key: "programs", label: t("programsTitle") }] : []),
                  ].map((tab) => (
                    <button key={tab.key} type="button" role="tab" aria-selected={shopTab === tab.key}
                            className={`${C.tab} ${shopTab === tab.key ? C.tabActive : ""}`}
                            onClick={() => setShopTab(tab.key)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {shopTab === "plans" && (
                <section>
                  {/* Twelve plans as twelve tall cards was a long scroll on a
                      phone. They share one price, so it's shown once, and the
                      grade is picked first; only that grade's sections follow. */}
                  {(() => {
                    const ownedPlan = (p) => !!p.ownedSubscriptionValidTo && new Date(p.ownedSubscriptionValidTo) > new Date();
                    const prices = new Set(plans.map((p) => p.finalPrice));
                    const samePrice = prices.size === 1;
                    const ref = plans[0];
                    const grades = [...new Set(plans.map(gradeOf))].sort((a, b) => (b ?? -1) - (a ?? -1));
                    // undefined = nothing picked yet (null is the "other" group)
                    const shownGrade = pickedGrade !== undefined ? pickedGrade : (plan ? gradeOf(plan) : undefined);
                    const tracks = shownGrade === undefined ? [] : plans.filter((p) => gradeOf(p) === shownGrade);
                    const pickGrade = (g) => {
                      if (shownGrade === g) { setPickedGrade(undefined); setPlan(null); return; }
                      setPickedGrade(g);
                      const inGrade = plans.filter((p) => gradeOf(p) === g);
                      const buyable = inGrade.filter((p) => !ownedPlan(p));
                      // one section: that's the plan, straight to the pay bar
                      if (inGrade.length === 1 && buyable.length === 1) { setPlan(buyable[0]); setPromoResult(null); }
                      else if (!plan || gradeOf(plan) !== g) setPlan(null);
                    };
                    return (
                      <>
                        {samePrice && ref && (
                          <div className={C.priceBanner} role="note"
                               onClick={() => {
                                 gradesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                                 setNudgeGrades(true);
                                 setTimeout(() => setNudgeGrades(false), 1200);
                               }}>
                            <div>
                              {ref.fullPrice !== ref.finalPrice && <div className={C.strike}>{fmt(ref.fullPrice)} {t("iqd")}</div>}
                              <div className={C.price} style={{ fontSize: 30 }}>{fmt(ref.finalPrice)} <small>{t("iqd")}</small></div>
                              <div className={C.perMonth}>{t("forDays", { days: ref.standardDays })} · {t("perMonth", { amount: fmt(monthly(ref)) })}</div>
                            </div>
                            <div className={C.bannerSide}>
                              {ref.fullPrice !== ref.finalPrice && (
                                <span className={C.sticker} style={{ position: "static", transform: "rotate(3deg)" }}>
                                  {t("discount")} {fmt(ref.fullPrice - ref.finalPrice)} {t("iqd")}
                                </span>
                              )}
                              <div className={C.perMonth} style={{ marginTop: 6 }}>{t("samePrice")}</div>
                            </div>
                          </div>
                        )}

                        <div className={C.cardTitle} style={{ fontSize: 18 }}>{t("pickGrade")}</div>
                        <div ref={gradesRef} className={`${C.grades} ${nudgeGrades ? C.gradesNudge : ""}`}>
                          {grades.map((g) => {
                            const inGrade = plans.filter((p) => gradeOf(p) === g);
                            const allOwned = inGrade.every(ownedPlan);
                            return (
                              <button key={String(g)} type="button" aria-pressed={shownGrade === g}
                                      className={`${C.grade} ${shownGrade === g ? C.gradeActive : ""} ${allOwned ? C.gradeOwned : ""}`}
                                      onClick={() => pickGrade(g)}>
                                {g === null ? <span className={C.gradeOther}>{t("otherPlans")}</span> : (
                                  <>
                                    <span className={C.gradeWord}>{t("gradeWord")}</span>
                                    <span className={C.gradeNum}>{fmtGrade(g, lang)}</span>
                                  </>
                                )}
                                {/* the price as a pill, like the credit cards; "from" when its sections differ */}
                                {!allOwned && (() => {
                                  const gp = inGrade.filter((x) => !ownedPlan(x)).map((x) => x.finalPrice);
                                  const low = fmt(Math.min(...gp));
                                  return (
                                    <span className={`${C.packPrice} ${C.gradePrice}`}>
                                      {new Set(gp).size > 1 ? t("fromPrice", { amount: low }) : low} {t("iqd")}
                                    </span>
                                  );
                                })()}
                                {allOwned && <span className={C.gradeTick}><CheckIcon /></span>}
                              </button>
                            );
                          })}
                        </div>

                        {tracks.length > 1 && (
                          <>
                            <div className={C.trackTitle}>{t("pickTrack")}</div>
                            {tracks.map((p) => {
                              const owned = ownedPlan(p);
                              const selected = plan?.id === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  aria-pressed={selected}
                                  disabled={owned}
                                  onClick={() => { if (!owned) { setPlan(selected ? null : p); setPromoResult(null); } }}
                                  className={`${C.option} ${C.optionCompact} ${selected ? C.optionSelected : ""} ${owned ? C.optionOwned : ""}`}
                                >
                                  <span className={C.radio}>{(selected || owned) && <CheckIcon />}</span>
                                  <span className={C.optionBody}>
                                    <div className={C.optionName} style={{ fontSize: 17 }}>{trackOf(p)}</div>
                                    {owned && (
                                      <div className={C.optionDesc}>
                                        {t("owned")} · {t("validUntil")} <span dir="ltr">{new Date(p.ownedSubscriptionValidTo).toLocaleDateString("en-GB")}</span>
                                      </div>
                                    )}
                                  </span>
                                  {!samePrice && !owned && (
                                    <span className={C.optionPrice}>
                                      {p.fullPrice !== p.finalPrice && <div className={C.strike}>{fmt(p.fullPrice)}</div>}
                                      <div className={C.price} style={{ fontSize: 19 }}>{fmt(p.finalPrice)} <small>{t("iqd")}</small></div>
                                      <div className={C.perMonth}>{t("perMonth", { amount: fmt(monthly(p)) })}</div>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </>
                        )}

                        {tracks.length === 1 && ownedPlan(tracks[0]) && (
                          <div className={C.owned} style={{ marginTop: 12 }}>
                            <b>{tracks[0].nameKurdish}</b> · {t("owned")} · {t("validUntil")}{" "}
                            <span dir="ltr">{new Date(tracks[0].ownedSubscriptionValidTo).toLocaleDateString("en-GB")}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {plan && (
                    <div className={C.promo}>
                      {!showPromo && !promoResult ? (
                        <button type="button" className={C.btnLink} style={{ padding: 0 }} onClick={() => setShowPromo(true)}>
                          {t("promoToggle")}
                        </button>
                      ) : (
                        <>
                          <div className={C.field}><label>{t("promoLabel")}</label></div>
                          <div className={C.promoRow} dir="ltr">
                            <Input
                              size="large"
                              value={promo}
                              onChange={(e) => { setPromo(e.target.value); setPromoResult(null); }}
                              placeholder="xyz"
                            />
                            <Btn variant="ghost" loading={promoBusy} onClick={applyPromo}>{t("promoApply")}</Btn>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </section>
              )}

              {shopTab === "programs" && paidPrograms.length > 0 && (
                <section>
                  {paidPrograms.map((program) => (
                    <div key={program.id} className={C.program}>
                      {program.coverUrl && <img className={C.programCover} src={program.coverUrl} alt="" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800 }}>{program.title}</div>
                        <div className={C.muted} style={{ fontSize: 12.5 }}>{t("byLecturer")} {program.lecturerName}</div>
                      </div>
                      <div style={{ flex: "none" }}>
                        {program.isOwned ? (
                          <span className={`${C.sticker} ${C.stickerGreen}`} style={{ position: "static", transform: "none" }}>{t("programOwned")}</span>
                        ) : (
                          <Btn variant="fib" className={C.programBuy}
                               loading={buyingProgramId === program.id}
                               onClick={() => buyProgram(program)}>
                            {fmt(program.price)} {t("iqd")}
                          </Btn>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {shopTab === "credits" && packs.length > 0 && (
                <section>
                  <p className={C.muted} style={{ marginBottom: 6 }}>{t("creditsExplain")}</p>
                  <div className={C.chip} style={{ marginBottom: 14 }}>
                    {t("creditsBalance")}: <b style={{ color: PURPLE }}>{fmt(credits)}</b>
                  </div>
                  {/* square cards, like the grade picker: the credits are the headline */}
                  {(() => {
                    const paid = packs.filter((x) => (x.price ?? 0) > 0 && x.credits > 0);
                    const bestId = paid.length > 1
                      ? paid.reduce((a, b) => (b.price / b.credits < a.price / a.credits ? b : a)).id
                      : null;
                    return (
                      <div className={C.packs}>
                        {packs.map((p) => {
                          const selected = pack?.id === p.id;
                          const free = (p.price ?? 0) <= 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              aria-pressed={selected}
                              disabled={p.claimed}
                              onClick={() => { if (!p.claimed) setPack(selected ? null : p); }}
                              className={`${C.grade} ${C.packCard} ${selected ? C.gradeActive : ""} ${p.claimed ? C.optionDim : ""}`}
                            >
                              {bestId === p.id && !p.claimed && <span className={C.sticker}>{t("bestValue")}</span>}
                              <span className={C.gradeNum}>{fmtGrade(p.credits, lang)}</span>
                              <span className={C.gradeWord}>{t("creditsUnit")}</span>
                              <span className={C.packPrice}>
                                {p.claimed ? t("creditsFreeClaimed") : free ? t("creditsFree") : `${fmt(p.price)} ${t("iqd")}`}
                              </span>
                              {p.claimed && <span className={C.gradeTick}><CheckIcon /></span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <div className={C.perMonth} style={{ textAlign: "center", marginTop: 10 }}>{t("creditsNeverExpire")}</div>
                </section>
              )}
            </>
          )
        )}

        {/* ---- step 3: FIB ---- */}
        {step === 3 && fib && (
          <div className={C.card}>
            <div className={C.fibHead}>
              <img className={C.fibOwl} src="/assets/pepu/waiting.webp" alt="" />
              <div>
                <div className={C.payLabel}>{t("payAmount")}</div>
                <div className={C.fibAmount}>
                  {fmt(fibTarget?.kind === "pack" ? pack?.price : fibTarget?.kind === "program"
                    ? programs.find((x) => x.id === fibTarget.id)?.price : amountDue)} <small style={{ fontSize: 15 }}>{t("iqd")}</small>
                </div>
              </div>
            </div>
            <ol className={C.fibSteps}>
              <li className={C.fibStep}>
                <span className={C.fibNum}>1</span>
                <div className={C.fibStepBody}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>{t("fibStepOpen")}</div>
                  {(fib.personalAppLink || fib.businessAppLink) && (
                    <Btn variant="fib" href={fib.personalAppLink || fib.businessAppLink}>{t("fibOpenApp")}</Btn>
                  )}
                </div>
              </li>
              {(qrSrc || fib.readableCode) && (
                <li className={C.fibStep}>
                  <span className={C.fibNum}>2</span>
                  <div className={C.fibStepBody}>
                    <div style={{ fontWeight: 800 }}>{t("fibStepOr")}</div>
                    {qrSrc && <img className={C.qr} src={qrSrc} alt="FIB QR" />}
                    {fib.readableCode && (
                      <div className={C.codeBox}>
                        <span className={C.codeText}>{fib.readableCode}</span>
                        <button type="button" className={C.copyBtn} onClick={() => copyText(fib.readableCode)}>{t("copy")}</button>
                      </div>
                    )}
                  </div>
                </li>
              )}
              <li className={C.fibStep}>
                <span className={C.fibNum}>{qrSrc || fib.readableCode ? 3 : 2}</span>
                <div className={C.fibStepBody} style={{ fontWeight: 800, paddingTop: 3 }}>{t("fibStepDone")}</div>
              </li>
            </ol>
            <div className={C.waiting}><span className={C.spinner} /> {t("fibWaiting")}</div>
            <div className={C.row2}>
              <Btn variant="ghost" onClick={checkPayment}>{t("fibCheckNow")}</Btn>
              <Btn variant="danger" onClick={cancelPay}>{t("cancel")}</Btn>
            </div>
            {((fibTarget?.kind === "subscription" && plan) || (fibTarget?.kind === "pack" && pack)) && (
              <div className={C.parentBox}>
                <div className={C.parentBoxTitle}>{t("parentNoFib")}</div>
                <p className={C.muted} style={{ fontSize: 13.5, margin: "4px 0 12px" }}>{t("parentShareHint")}</p>
                <Btn variant="primary" loading={parentBusy}
                     onClick={() => (fibTarget?.kind === "pack" ? shareWithParent(pack, "pack") : shareWithParent(plan))}>
                  {!parentBusy && <ShareIcon />}
                  {t("parentShare")}
                </Btn>
              </div>
            )}
          </div>
        )}

        {/* ---- step 4: done ---- */}
        {step === 4 && (
          <div className={`${C.card} ${C.success}`}>
            <img className={C.successOwl} src="/assets/pepu/celebrate.webp" alt="" />
            <div className={C.successTitle}>
              {fibTarget?.kind === "program" ? t("programPaid") : fibTarget?.kind === "pack" ? t("creditsPaid") : t("paid")}
            </div>
            <p className={C.muted} style={{ marginTop: 6 }}>{t("paidHint")}</p>
          </div>
        )}

        {/* ---- getting back into the app, always in sight once signed in ---- */}
        {(step === 2 || step === 4) && !registering && (
          <div className={C.card} style={{ marginTop: 18 }}>
            <div className={C.cardTitle} style={{ fontSize: 18 }}>{t("backToApp")}</div>
            <ol className={C.appSteps}>
              <li>{t("backToAppStep1")}</li>
              <li>{t("backToAppStep2")}</li>
              <li>{t("backToAppStep3")}</li>
            </ol>
            <div className={C.stores}>
              <a href="https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812">
                <img src="/assets/appstore.svg" alt="App Store" />
              </a>
              <a href="https://play.google.com/store/apps/details?id=io.hesta.pepu_2">
                <img src="/assets/gplay.svg" alt="Google Play" />
              </a>
            </div>
          </div>
        )}
      </main>

      {showPayBar && (
        <div className={C.payBar}>
          <div className={C.payBarInner}>
            <button type="button" className={C.payClose} aria-label={t("cancel")}
                    onClick={() => (payingPack ? setPack(null) : setPlan(null))}>
              <CloseIcon />
            </button>
            <div className={C.payRow}>
              <div className={C.payWhat}>
                <div className={C.payLabel}>{t("payAmount")}</div>
                <div className={C.payName}>{payingPack ? pack.name : plan.nameKurdish}</div>
              </div>
              <div className={C.payTotal}>
                {payingPack && (pack.price ?? 0) <= 0
                  ? t("creditsFree")
                  : <>{fmt(payingPack ? pack.price : amountDue)} <small>{t("iqd")}</small></>}
              </div>
            </div>
            <Btn
              variant={payingPack && (pack.price ?? 0) <= 0 ? "primary" : "fib"}
              loading={payingPack ? buyingPackId === pack.id : busy}
              onClick={payingPack ? () => buyPack(pack) : pay}
            >
              {payingPack && (pack.price ?? 0) <= 0 ? t("creditsClaimFree") : t("payWithFib")}
            </Btn>
            {(payingPack ? (pack.price ?? 0) > 0 : amountDue > 0) && (
              <div className={C.parentRow}>
                <div className={C.parentHint}>{t("parentNoFib")}</div>
                <Btn variant="parent" loading={parentBusy}
                     onClick={() => (payingPack ? shareWithParent(pack, "pack") : shareWithParent(plan))}>
                  {!parentBusy && <ShareIcon />}
                  {t("parentShare")}
                </Btn>
              </div>
            )}
            <div className={C.payFoot}><LockIcon /> {t("secureFoot")}</div>
          </div>
        </div>
      )}

      <Modal
        open={!!parentLink}
        onCancel={() => setParentLink(null)}
        footer={null}
        title={<span style={{ fontFamily: "rabar, vazirlight, sans-serif", fontSize: 19 }}>{t("parentLinkTitle")}</span>}
        centered
      >
        {parentLink && (
          <div className={C.stack}>
            <p className={C.muted}>{t("parentShareHint")}</p>
            <div className={C.linkBox}>{parentLink.url}</div>
            <Btn variant="primary" onClick={copyParentLink}>{t("parentCopy")}</Btn>
            <Btn
              variant="whatsapp"
              href={`https://wa.me/?text=${encodeURIComponent(`${parentLink.text}\n${parentLink.url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("parentWhatsapp")}
            </Btn>
            <p className={C.muted} style={{ fontSize: 12.5 }}>{t("parentLinkValid")} {t("parentAfter")}</p>
          </div>
        )}
      </Modal>
    </div>
    </ConfigProvider>
  );
}

// "پۆلی ١٢ی زانستی" → 12, "12th Grade - English System" → 12; null when no grade is in the name
const latinDigits = (v) => (v || "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
function gradeOf(plan) {
  const m = latinDigits(plan?.nameKurdish).match(/\b(\d{1,2})/) || latinDigits(plan?.nameKurdish).match(/(\d{1,2})/);
  return m ? Number(m[1]) : null;
}

// the section within a grade: "پۆلی ١٢ی زانستی بادینی" → "زانستی بادینی"; a name with no grade prefix stays whole
function trackOf(plan) {
  const name = (plan?.nameKurdish || "").trim();
  const rest = name.replace(/^پۆلی\s*[٠-٩0-9]+\s*(ی\s*)?/, "").trim();
  return rest && rest !== name ? rest : name;
}

const fmtGrade = (g, lang) => (lang === "en" ? String(g) : String(g).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]));
