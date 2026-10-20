import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider, message } from "antd";
import useTranslation from "next-translate/useTranslation";
import C from "~/styles/checkout.module.css";
import { BoltIcon, Btn, LockIcon, UsersIcon } from "~/components/CheckoutUi";
import {
  checkParentPayLink,
  getParentPayLink,
  payParentPayLink,
} from "~/utils/pepuApi";

const PURPLE = "#9241FE";

/**
 * The page a parent opens from a student's "send to a parent" link
 * (/pay#<token>, see ParentPayLink on the API). No sign-in: the link itself
 * names the student and the plan, and paying runs the same FIB payment the
 * student's own checkout does, so the subscription switches on the same way.
 */
export default function Pay() {
  const { t, lang } = useTranslation("subscribe");
  const [linkToken, setLinkToken] = useState(null);
  const [info, setInfo] = useState(null); // {studentName, planName, amount, state}
  const [status, setStatus] = useState("loading"); // loading | missing | ready | paying | done
  const [fib, setFib] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // _document's inline script has already moved the token out of the URL
  useEffect(() => {
    const fromHash = window.location.hash.length > 1 ? window.location.hash.slice(1) : null;
    const value = window.__pepuPayLink || fromHash;
    if (!value) {
      setStatus("missing");
      return;
    }
    setLinkToken(value);
  }, []);

  const load = useCallback(async () => {
    if (!linkToken) return;
    try {
      const res = await getParentPayLink(linkToken);
      if (!res.ok) {
        setStatus("missing");
        return;
      }
      setInfo(res.data);
      setStatus(res.data.state === "paid" ? "done" : "ready");
    } catch {
      setFailed(true);
      setStatus("ready");
    }
  }, [linkToken]);

  useEffect(() => {
    load();
  }, [load]);

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await payParentPayLink(linkToken);
      if (res.status === 409) {
        setInfo((old) => ({ ...old, state: res.data?.state }));
        if (res.data?.state === "paid") setStatus("done");
        return;
      }
      if (!res.ok) {
        setFailed(true);
        return;
      }
      if (res.data?.transactionState === "completed") {
        setStatus("done");
        return;
      }
      if (res.data?.fib) {
        setFib(res.data.fib);
        setStatus("paying");
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const check = useCallback(async () => {
    if (!linkToken) return false;
    const res = await checkParentPayLink(linkToken);
    if (res.ok) {
      setStatus("done");
      return true;
    }
    return false;
  }, [linkToken]);

  useEffect(() => {
    if (status !== "paying") return;
    const timer = setInterval(check, 4000);
    return () => clearInterval(timer);
  }, [status, check]);

  const fmt = (n) => new Intl.NumberFormat("en-US").format(n ?? 0);
  const dir = lang === "en" ? "ltr" : "rtl";

  const qrSrc = useMemo(() => {
    if (!fib?.qrCode) return null;
    return fib.qrCode.startsWith("data:") ? fib.qrCode : `data:image/png;base64,${fib.qrCode}`;
  }, [fib]);

  const isCredits = info?.kind === "credits";
  const headline = isCredits
    ? (info?.studentName ? t("payForCredits", { name: info.studentName }) : t("payForCreditsNoName"))
    : (info?.studentName ? t("payFor", { name: info.studentName }) : t("payForNoName"));

  const home = lang === "ku" ? "/" : `/${lang}`;
  const copyCode = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(t("copied"));
    } catch { /* blocked: the code is on screen */ }
  };

  // a state card: the owl, one line, nothing to do
  const notice = (owl, text) => (
    <div className={`${C.card} ${C.success}`}>
      <img className={C.successOwl} src={`/assets/pepu/${owl}.webp`} alt="" />
      <p className={C.successTitle} style={{ fontSize: 21 }}>{text}</p>
    </div>
  );

  return (
    <ConfigProvider
      direction={dir}
      theme={{ token: { fontFamily: "vazirlight, rabar, sans-serif", colorPrimary: PURPLE, borderRadius: 14 } }}
    >
      <div className={C.page} dir={dir}>
        <Head>
          <title>{t("payPageTitle")}</title>
          {/* a personal payment link: never index it */}
          <meta name="robots" content="noindex,nofollow" />
          <meta name="referrer" content="no-referrer" />
          <meta name="theme-color" content="#fbf8ff" />
        </Head>

        <main className={C.wrap}>

          {status === "loading" && (
            <div className={`${C.card} ${C.loadingCard}`}>
              <img src="/assets/pepu/waiting.webp" alt="" />
            </div>
          )}

          {status === "missing" && notice("help", t("payNotFound"))}
          {status === "ready" && info?.state === "expired" && notice("waiting", t("payExpired"))}
          {status === "ready" && info?.state === "active" && notice("understood", t("payActive"))}

          {status === "ready" && info?.state === "open" && (
            // one card: the owl on its corner, who's asking, what it is, the price, pay
            <div className={`${C.card} ${C.cardWithOwl}`}>
              <a href={home} className={`${C.heroHome} ${C.statusOwl}`} aria-label="Pepu">
                <img className={C.heroOwl} src="/assets/pepu/hello.webp" alt="" />
              </a>
              <div className={C.statusHead}>
                <h1 className={C.heroTitle}>{t("payPageTitle")}</h1>
                <p className={C.heroSub}>{headline}</p>
              </div>
              <p className={C.muted} style={{ margin: "12px 0 14px" }}>{t(isCredits ? "payWhatIsCredits" : "payWhatIs")}</p>
              <div className={C.priceBanner} style={{ marginBottom: 16 }}>
                <div>
                  <div className={C.payLabel}>{t(isCredits ? "payPack" : "payPlan")}</div>
                  <div className={C.optionName} style={{ fontSize: 18 }}>
                    {isCredits ? t("payCredits", { credits: fmt(info.credits) }) : info.planName}
                  </div>
                </div>
                <span className={C.packPrice} style={{ fontSize: 17, marginTop: 0 }}>{fmt(info.amount)} {t("iqd")}</span>
              </div>
              {failed && <p style={{ color: "#c0392b", fontWeight: 700, marginBottom: 10 }}>{t("genericError")}</p>}
              <Btn variant="fib" loading={busy} onClick={pay}>{t("payWithFib")}</Btn>
              <div className={C.payFoot}><LockIcon /> {t("secureFoot")}</div>
              <div className={C.trustLine} style={{ marginTop: 12, paddingTop: 12, borderTop: "2px dashed #eee8f7" }}>
                <span><UsersIcon /> {t("trustStudents")}</span>
                <span><BoltIcon /> {t("trustInstant")}</span>
              </div>
            </div>
          )}

          {status === "paying" && fib && (
            <div className={`${C.card} ${C.cardWithOwl}`}>
              <span className={C.statusOwl}><img className={C.heroOwl} src="/assets/pepu/waiting.webp" alt="" /></span>
              <div className={C.fibHead}>
                <div>
                  <div className={C.payLabel}>{t("payAmount")}</div>
                  <div className={C.fibAmount}>{fmt(info?.amount)} <small style={{ fontSize: 15 }}>{t("iqd")}</small></div>
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
                          <button type="button" className={C.copyBtn} onClick={() => copyCode(fib.readableCode)}>{t("copy")}</button>
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
              <Btn variant="ghost" onClick={check}>{t("fibCheckNow")}</Btn>
            </div>
          )}

          {status === "done" && (
            <div className={`${C.card} ${C.success}`}>
              <img className={C.successOwl} src="/assets/pepu/celebrate.webp" alt="" />
              <div className={C.successTitle}>{t(isCredits ? "payDoneCreditsTitle" : "payDoneTitle")}</div>
              <p className={C.muted} style={{ marginTop: 6 }}>{t(isCredits ? "payDoneCreditsHint" : "payDoneHint")}</p>
            </div>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}
