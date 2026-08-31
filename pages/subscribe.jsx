import Head from "next/head";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Input,
  Layout,
  message,
  Result,
  Select,
  Space,
  Spin,
  Steps,
  Tabs,
  Tag,
  Typography,
} from "antd";
import useTranslation from "next-translate/useTranslation";
import {
  cancelFibPayment,
  checkFibPayment,
  createSubscription,
  getCities,
  getMe,
  getMySubscriptions,
  getPlans,
  getPrograms,
  normalizeDigits,
  paySubscription,
  checkProgramPayment,
  previewPromo,
  purchaseProgram,
  registerProfile,
  requestOtp,
  verifyOtp,
} from "~/utils/pepuApi";

const { Title, Text, Paragraph } = Typography;

/**
 * The web storefront for iOS students: the app can no longer sell there
 * (App Store guideline 3.1.1, no link-out on the Iraqi storefront), so this
 * page owns the whole loop — same phone OTP as the app, same plans, FIB
 * payment, instant server-side activation. The app just works afterwards.
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBMNis-ERCX9mgPK5zIlgXeC7WB6tJ5pGA",
  appId: "1:230091316087:web:99868c59b8e8e57cdf1f72",
  messagingSenderId: "230091316087",
  projectId: "pepu-platform",
  authDomain: "pepu-platform.firebaseapp.com",
  storageBucket: "pepu-platform.firebasestorage.app",
};

const PURPLE = "#9241FE";

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
    window.firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        setRestoring(false);
        return;
      }
      enterWithUser(user);
    });
  };

  useEffect(() => {
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
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [fib, setFib] = useState(null);
  // what the open FIB payment is for: {kind:"subscription"|"program", id}
  const [fibTarget, setFibTarget] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [buyingProgramId, setBuyingProgramId] = useState(null);
  const idempotencyKey = useRef(null);

  const [me, setMe] = useState(null);
  const [mySubs, setMySubs] = useState([]);
  // true until Firebase resolves whether a previous session survives refresh
  const [restoring, setRestoring] = useState(true);
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
      if (res.data?.isNewUser) {
        // onboarding lives in the app; the checkout only serves existing accounts
        message.warning(t("newUser"), 8);
        return;
      }
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
    const idToken = await user.getIdToken();

    // a brand-new identity (any provider) has no Pepu profile yet —
    // onboard right here with the same PUT /users/me the app uses
    try {
      const meRes = await getMe(idToken);
      if (meRes.status === 404) {
        pendingToken.current = idToken;
        setRegPhone(normalizedPhone || "");
        const citiesRes = await getCities(idToken);
        const cityList = citiesRes.data?.items ?? citiesRes.data ?? [];
        setCities(Array.isArray(cityList) ? cityList : []);
        setRegistering(true);
        return;
      }
      if (!meRes.ok) {
        enteredRef.current = false;
        message.error(t("genericError"));
        return;
      }

      setMe(meRes.data);
      setToken(idToken);
      if (!(await loadCatalog(idToken))) {
        return;
      }
      setStep(2);
    } finally {
      setRestoring(false);
    }
  };

  /** Plans + owned subscriptions + marketplace programs, in one place so
   * every entry path (sign-in, restore, registration) shows the same shop. */
  const loadCatalog = async (idToken) => {
    const subsRes = await getMySubscriptions(idToken);
    const subs = subsRes.data?.items ?? [];
    setMySubs(Array.isArray(subs) ? subs.filter((x) => x.isValid) : []);

    const plansRes = await getPlans(idToken);
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

    const programsRes = await getPrograms(idToken);
    const programList = programsRes.data?.items ?? [];
    setPrograms(Array.isArray(programList) ? programList : []);
    return true;
  };

  const logout = async () => {
    try {
      await window.firebase.auth().signOut();
    } catch { /* already signed out */ }
    enteredRef.current = false;
    pendingToken.current = null;
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
        message.error(t("genericError"));
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
      if (!res.ok) {
        setPromoResult(null);
        message.error(t("promoInvalid"));
        return;
      }
      setPromoResult(res.data);
      message.success(
        t("promoApplied", { amount: fmt(res.data?.paidAmount ?? 0) })
      );
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
      if (payRes.data?.state === "completed") {
        // a full-discount promo settles without FIB ever opening
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

  // ---- step 3: poll until FIB confirms ----
  const checkPayment = useCallback(async () => {
    if (!fibTarget || !token) return false;
    const res = fibTarget.kind === "program"
      ? await checkProgramPayment(token, fibTarget.id)
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

    // programs have no cancel endpoint — the FIB payment just expires
    setFib(null);
    setFibTarget(null);
    setStep(2);
    await loadCatalog(token);
  };

  const fmt = (n) => new Intl.NumberFormat("en-US").format(n ?? 0);
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

  return (
    <ConfigProvider
      direction={dir}
      theme={{
        token: {
          // match the main site: vazirlight body, Pepu purple
          fontFamily: "vazirlight, rabar, sans-serif",
          colorPrimary: PURPLE,
          borderRadius: 10,
        },
      }}
    >
    <Layout style={{ minHeight: "100vh", background: "#f7f7f7" }} dir={dir}>
      <Head>
        <title>{t("metaTitle")}</title>
        {/* account + checkout: keep it out of search indexes */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <Script
        src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
        onReady={bootFirebase}
      />
      <Script
        src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"
        onReady={bootFirebase}
      />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/assets/papu.svg" alt="Pepu" style={{ height: 56 }}
               onError={(e) => (e.currentTarget.style.display = "none")} />
          <Title level={3} style={{ marginTop: 8, fontFamily: "rabar, vazirlight, sans-serif" }}>{t("title")}</Title>
        </div>

        {me && (
          <Card size="small" style={{ marginBottom: 16 }} bodyStyle={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "#f4ecff",
                  color: PURPLE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  flex: "none",
                }}
              >
                {(me.fullName || "?").trim().charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>
                <div>
                  <Text strong style={{ fontSize: 15 }}>{me.fullName}</Text>
                </div>
                {me.phoneNumber && (
                  <Text type="secondary" style={{ direction: "ltr", display: "inline-block", fontSize: 13 }}>
                    {me.phoneNumber}
                  </Text>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flex: "none" }}>
                <Tag color="purple" style={{ margin: 0 }}>
                  <Text copyable={{ text: String(me.id) }} style={{ color: "inherit", fontSize: 13 }}>
                    {t("accountCode")} #{me.id}
                  </Text>
                </Tag>
                <Button size="small" onClick={logout}>{t("logout")}</Button>
              </div>
            </div>
          </Card>
        )}

        {restoring && (
          <Card style={{ textAlign: "center" }}>
            <Spin /> <Text type="secondary">{t("restoring")}</Text>
          </Card>
        )}

        <Steps
          size="small"
          current={Math.min(step, 3)}
          items={[
            { title: t("stepPhone") },
            { title: t("stepPlan") },
            { title: t("stepPay") },
          ]}
          style={{ marginBottom: 24 }}
          responsive={false}
        />

        {/* ---- registration for accounts that don't exist yet ---- */}
        {!restoring && registering && (
          <Card>
            <Title level={5}>{t("registerTitle")}</Title>
            <Paragraph type="secondary">{t("registerHint")}</Paragraph>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              <div>
                <Text>{t("fullName")} *</Text>
                <Input size="large" value={regName}
                       onChange={(e) => setRegName(e.target.value)} />
              </div>
              <div>
                <Text>{t("gender")} *</Text>
                <div>
                  <Button.Group style={{ width: "100%" }}>
                    <Button size="large" block
                            type={regGender === "male" ? "primary" : "default"}
                            onClick={() => setRegGender("male")}>{t("male")}</Button>
                    <Button size="large" block
                            type={regGender === "female" ? "primary" : "default"}
                            onClick={() => setRegGender("female")}>{t("female")}</Button>
                  </Button.Group>
                </div>
              </div>
              <div>
                <Text>{t("city")} *</Text>
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
              <div>
                <Text>{t("phoneForAccount")} *</Text>
                <Input size="large" inputMode="tel" value={regPhone} maxLength={11}
                       placeholder="07XXXXXXXXX"
                       onChange={(e) =>
                         setRegPhone(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
                       style={{ direction: "ltr", textAlign: "left" }} />
              </div>
              <div>
                <Text>{t("school")}</Text>
                <Input size="large" value={regSchool}
                       onChange={(e) => setRegSchool(e.target.value)} />
              </div>
              <Button type="primary" size="large" block loading={busy}
                      onClick={submitRegistration} style={{ background: PURPLE }}>
                {t("createAccount")}
              </Button>
              <Button type="link" block onClick={logout}>{t("logout")}</Button>
            </Space>
          </Card>
        )}

        {/* ---- step 0: phone ---- */}
        {!restoring && !registering && step === 0 && (
          <Card>
            <Paragraph>{t("phoneHint")}</Paragraph>
            <Input
              size="large"
              inputMode="tel"
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(normalizeDigits(e.target.value))}
              onPressEnter={sendCode}
              style={{ direction: "ltr", textAlign: "left" }}
            />
            <Button
              type="primary"
              size="large"
              block
              loading={busy}
              disabled={!fbReady}
              onClick={sendCode}
              style={{ marginTop: 16, background: PURPLE }}
            >
              {t("sendCode")}
            </Button>
            <div style={{ textAlign: "center", margin: "16px 0 8px" }}>
              <Text type="secondary">{t("orContinueWith")}</Text>
            </div>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              {/* standard provider designs: Google white + official G, Apple black + logo */}
              <Button size="large" block disabled={!fbReady || busy}
                      onClick={() => oauthSignIn("google")}
                      style={{
                        background: "#fff",
                        border: "1px solid #dadce0",
                        color: "#3c4043",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                      }}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {t("continueGoogle")}
              </Button>
              <Button size="large" block disabled={!fbReady || busy}
                      onClick={() => oauthSignIn("apple")}
                      style={{
                        background: "#000",
                        borderColor: "#000",
                        color: "#fff",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                      }}>
                <svg width="16" height="19" viewBox="0 0 814 1000" aria-hidden="true" fill="#fff">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
                {t("continueApple")}
              </Button>
            </Space>
          </Card>
        )}

        {/* ---- step 1: otp ---- */}
        {!restoring && !registering && step === 1 && (
          <Card>
            <Paragraph>{t("codeHint", { phone: normalizedPhone })}</Paragraph>
            <div dir="ltr">
              <Input
                size="large"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(normalizeDigits(e.target.value).replace(/\D/g, ""))}
                onPressEnter={verify}
                style={{ direction: "ltr", textAlign: "left", fontSize: 22, letterSpacing: 8 }}
              />
            </div>
            <Button
              type="primary"
              size="large"
              block
              loading={busy}
              onClick={verify}
              style={{ marginTop: 16, background: PURPLE }}
            >
              {t("verify")}
            </Button>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              {resendIn > 0 ? (
                <Text type="secondary">{t("resendIn", { seconds: resendIn })}</Text>
              ) : (
                <Button type="link" onClick={sendCode}>{t("resend")}</Button>
              )}
              <Button type="link" onClick={() => setStep(0)}>{t("back")}</Button>
            </div>
          </Card>
        )}

        {/* ---- step 2: the shop — packages and video programs, tabbed ---- */}
        {step === 2 && (
          plans === null ? (
            <Card style={{ textAlign: "center" }}><Spin /> {t("loadingPlans")}</Card>
          ) : (
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {mySubs.length > 0 && (
                <Card size="small" title={t("mySubscriptions")}
                      headStyle={{ color: "#389e0d" }}
                      style={{ borderColor: "#b7eb8f", background: "#f6ffed" }}>
                  <Space direction="vertical" style={{ width: "100%" }} size={6}>
                    {mySubs.map((sub) => (
                      <div key={sub.id}
                           style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <Text strong>{sub.nameKurdish}</Text>
                        <Text type="secondary">
                          {t("validUntil")}{" "}
                          <span dir="ltr">{new Date(sub.validTo).toLocaleDateString("en-GB")}</span>
                        </Text>
                      </div>
                    ))}
                  </Space>
                </Card>
              )}

              <Tabs
                centered
                items={[
                  {
                    key: "plans",
                    label: t("plansTab"),
                    children: (
                      <Space direction="vertical" style={{ width: "100%" }} size={12}>
                        <Alert type="info" showIcon message={t("trialNote")} />
                        {plans.map((p) => {
                          const owned = !!p.ownedSubscriptionValidTo &&
                            new Date(p.ownedSubscriptionValidTo) > new Date();
                          const selected = plan?.id === p.id;
                          return (
                            <Card
                              key={p.id}
                              hoverable={!owned}
                              onClick={() => { if (!owned) { setPlan(p); setPromoResult(null); } }}
                              style={{
                                borderColor: owned ? "#52c41a" : selected ? PURPLE : undefined,
                                borderWidth: selected || owned ? 2 : 1,
                              }}
                            >
                              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                <Space wrap>
                                  <Text strong style={{ fontSize: 16 }}>{p.nameKurdish}</Text>
                                  {owned && <Tag color="green">{t("owned")}</Tag>}
                                  {!owned && p.fullPrice !== p.finalPrice && (
                                    <Tag color="green">
                                      {t("discount")} {fmt(p.fullPrice - p.finalPrice)} {t("iqd")}
                                    </Tag>
                                  )}
                                </Space>
                                <Text type="secondary">{p.descriptionKurdish}</Text>
                                {owned ? (
                                  <Text type="secondary">
                                    {t("validUntil")}{" "}
                                    {new Date(p.ownedSubscriptionValidTo).toLocaleDateString("en-GB")}
                                  </Text>
                                ) : (
                                  <Text strong style={{ color: PURPLE, fontSize: 18 }}>
                                    {fmt(p.finalPrice)} {t("iqd")}{" "}
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                      {t("forDays", { days: p.standardDays })}
                                    </Text>
                                  </Text>
                                )}
                              </Space>
                            </Card>
                          );
                        })}

                        {plan && (
                          <Card>
                            <Text>{t("promoLabel")}</Text>
                            <Space.Compact style={{ width: "100%", marginTop: 8 }} dir="ltr">
                              <Input
                                value={promo}
                                onChange={(e) => { setPromo(e.target.value); setPromoResult(null); }}
                                placeholder="xyz"
                              />
                              <Button loading={promoBusy} onClick={applyPromo}>
                                {t("promoApply")}
                              </Button>
                            </Space.Compact>
                            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Text strong>{t("payAmount")}</Text>
                              <Text strong style={{ fontSize: 20, color: PURPLE }}>
                                {fmt(amountDue)} {t("iqd")}
                              </Text>
                            </div>
                            <Button
                              type="primary"
                              size="large"
                              block
                              loading={busy}
                              onClick={pay}
                              style={{ marginTop: 12, background: "#13877C" }}
                            >
                              {t("payWithFib")}
                            </Button>
                          </Card>
                        )}
                      </Space>
                    ),
                  },
                  ...(programs.length > 0 ? [{
                    key: "programs",
                    label: t("programsTitle"),
                    children: (
                      <Space direction="vertical" style={{ width: "100%" }} size={12}>
                        {programs.map((program) => (
                          <Card key={program.id} size="small">
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              {program.coverUrl && (
                                <img src={program.coverUrl} alt=""
                                     style={{ width: 84, height: 56, objectFit: "cover", borderRadius: 8, flex: "none" }} />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong>{program.title}</Text>
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t("byLecturer")} {program.lecturerName}
                                  </Text>
                                </div>
                              </div>
                              <div style={{ flex: "none", textAlign: "start" }}>
                                {program.isOwned ? (
                                  <Tag color="green" style={{ margin: 0 }}>{t("programOwned")}</Tag>
                                ) : (program.price ?? 0) <= 0 ? (
                                  <Text type="secondary" style={{ fontSize: 12 }}>{t("programFree")}</Text>
                                ) : (
                                  <Button
                                    type="primary"
                                    size="small"
                                    loading={buyingProgramId === program.id}
                                    onClick={() => buyProgram(program)}
                                    style={{ background: "#13877C", borderColor: "#13877C" }}
                                  >
                                    {t("buyProgram")} · {fmt(program.price)} {t("iqd")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </Space>
                    ),
                  }] : []),
                ]}
              />
            </Space>
          )
        )}

        {/* ---- step 3: FIB ---- */}
        {step === 3 && fib && (
          <Card>
            <Paragraph strong>{t("fibExplain")}</Paragraph>
            <Space direction="vertical" style={{ width: "100%", textAlign: "center" }} size={16}>
              {(fib.personalAppLink || fib.businessAppLink) && (
                <Button
                  type="primary"
                  size="large"
                  block
                  href={fib.personalAppLink || fib.businessAppLink}
                  style={{ background: "#13877C" }}
                >
                  {t("fibOpenApp")}
                </Button>
              )}
              {qrSrc && (
                <div>
                  <Text type="secondary">{t("fibScanQr")}</Text>
                  <div><img src={qrSrc} alt="FIB QR" style={{ width: 200, marginTop: 8 }} /></div>
                </div>
              )}
              {fib.readableCode && (
                <div>
                  <Text type="secondary">{t("fibTypeCode")}</Text>
                  <div dir="ltr">
                    <Text copyable strong style={{ fontSize: 22, letterSpacing: 2 }}>
                      {fib.readableCode}
                    </Text>
                  </div>
                </div>
              )}
              <Spin /> <Text type="secondary">{t("fibWaiting")}</Text>
              <Space>
                <Button onClick={checkPayment}>{t("fibCheckNow")}</Button>
                <Button danger onClick={cancelPay}>{t("cancel")}</Button>
              </Space>
            </Space>
          </Card>
        )}

        {/* ---- step 4: done ---- */}
        {step === 4 && (
          <Result
            status="success"
            title={fibTarget?.kind === "program" ? t("programPaid") : t("paid")}
            subTitle={t("paidHint")}
          />
        )}

        {/* ---- getting back into the app, always in sight once signed in ---- */}
        {(step === 2 || step === 4) && !registering && (
          <Card size="small" title={t("backToApp")} style={{ marginTop: 16 }}>
            <ol style={{ margin: 0, paddingInlineStart: 20, lineHeight: 2 }}>
              <li>{t("backToAppStep1")}</li>
              <li>{t("backToAppStep2")}</li>
              <li>{t("backToAppStep3")}</li>
            </ol>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812">
                <img src="/assets/appstore.svg" alt="App Store" style={{ height: 40 }} />
              </a>
              <a href="https://play.google.com/store/apps/details?id=io.hesta.pepu_2">
                <img src="/assets/gplay.svg" alt="Google Play" style={{ height: 40 }} />
              </a>
            </div>
          </Card>
        )}
      </div>
    </Layout>
    </ConfigProvider>
  );
}
