import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, ConfigProvider, Layout, Result, Space, Spin, Typography } from "antd";
import useTranslation from "next-translate/useTranslation";
import {
  checkParentPayLink,
  getParentPayLink,
  payParentPayLink,
} from "~/utils/pepuApi";

const { Title, Text, Paragraph } = Typography;

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

  return (
    <ConfigProvider
      direction={dir}
      theme={{
        token: {
          fontFamily: "vazirlight, rabar, sans-serif",
          colorPrimary: PURPLE,
          borderRadius: 10,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: "#f7f7f7" }} dir={dir}>
        <Head>
          <title>{t("payPageTitle")}</title>
          {/* a personal payment link: never index it */}
          <meta name="robots" content="noindex,nofollow" />
          <meta name="referrer" content="no-referrer" />
        </Head>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src="/assets/papu.svg" alt="Pepu" style={{ height: 56 }}
                 onError={(e) => (e.currentTarget.style.display = "none")} />
            <Title level={3} style={{ marginTop: 8, fontFamily: "rabar, vazirlight, sans-serif" }}>
              {t("payPageTitle")}
            </Title>
          </div>

          {status === "loading" && (
            <Card style={{ textAlign: "center" }}><Spin /></Card>
          )}

          {status === "missing" && (
            <Result status="warning" title={t("payNotFound")} />
          )}

          {status === "ready" && info && info.state === "expired" && (
            <Result status="warning" title={t("payExpired")} />
          )}

          {status === "ready" && info && info.state === "active" && (
            <Result status="success" title={t("payActive")} />
          )}

          {status === "ready" && info && info.state === "open" && (
            <Card>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Title level={4} style={{ margin: 0, fontFamily: "rabar, vazirlight, sans-serif" }}>
                  {headline}
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>{t(isCredits ? "payWhatIsCredits" : "payWhatIs")}</Paragraph>
                <div style={{ background: "#f4ecff", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <Text type="secondary">{t(isCredits ? "payPack" : "payPlan")}</Text>
                    <Text strong>{isCredits ? t("payCredits", { credits: fmt(info.credits) }) : info.planName}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
                    <Text type="secondary">{t("payAmount")}</Text>
                    <Text strong style={{ fontSize: 20, color: PURPLE }}>{fmt(info.amount)} {t("iqd")}</Text>
                  </div>
                </div>
                {failed && <Text type="danger">{t("genericError")}</Text>}
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={busy}
                  onClick={pay}
                  style={{ background: "#13877C" }}
                >
                  {t("payWithFib")}
                </Button>
              </Space>
            </Card>
          )}

          {status === "paying" && fib && (
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
                <Button onClick={check}>{t("fibCheckNow")}</Button>
              </Space>
            </Card>
          )}

          {status === "done" && (
            <Result
              status="success"
              title={t(isCredits ? "payDoneCreditsTitle" : "payDoneTitle")}
              subTitle={t(isCredits ? "payDoneCreditsHint" : "payDoneHint")}
            />
          )}
        </div>
      </Layout>
    </ConfigProvider>
  );
}
