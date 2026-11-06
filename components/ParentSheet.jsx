import { useEffect, useState } from "react";
import { message, Modal } from "antd";
import useTranslation from "next-translate/useTranslation";
import QRCode from "qrcode";
import C from "~/styles/checkout.module.css";
import { Btn } from "~/components/CheckoutUi";
import { HANDOVER_KEY, trackCheckout } from "~/utils/experiment";

/**
 * "My parent pays" for the experiment arms (classic keeps its own modal).
 *
 * The 7 parent links paid by 2026-11-06 were all paid within minutes of
 * being made: the parent is usually in the room, not on WhatsApp. So the
 * first and biggest way is handing this phone over (it opens the parent's
 * page right here), then a QR the parent scans with their own phone, and
 * only then sending the link.
 *
 * `link` is `{ url, text }` from shareWithParent; null closes the sheet.
 */
export default function ParentSheet({ link, onClose }) {
  const { t } = useTranslation("subscribe");
  const [qr, setQr] = useState(null);

  useEffect(() => {
    setQr(null);
    if (!link?.url) return;
    let live = true;
    QRCode.toDataURL(link.url, { margin: 1, width: 360, color: { dark: "#1d1530", light: "#ffffff" } })
      .then((src) => live && setQr(src))
      .catch(() => {});
    return () => { live = false; };
  }, [link?.url]);

  const handOver = () => {
    trackCheckout("parent_handover");
    try { window.sessionStorage.setItem(HANDOVER_KEY, "1"); } catch { /* the page still works, just no way back */ }
    window.location.href = link.url;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      message.success(t("parentCopied"));
      trackCheckout("parent_copy");
    } catch {
      message.error(t("genericError"));
    }
  };

  const shareText = link ? `${link.text}\n${link.url}` : "";

  return (
    <Modal
      open={!!link}
      onCancel={onClose}
      footer={null}
      centered
      title={<span style={{ fontFamily: "rabar, vazirlight, sans-serif", fontSize: 19 }}>{t("xParentTitle")}</span>}
    >
      {link && (
        <div className={C.stack}>
          <div className={C.handover}>
            <div className={C.handoverHead}>
              <img src="/assets/pepu/help.webp" alt="" className={C.handoverOwl} />
              <div>
                <div className={C.handoverTitle}>{t("xHandoverTitle")}</div>
                <p className={C.muted} style={{ fontSize: 13.5, margin: "2px 0 0" }}>{t("xHandoverHint")}</p>
              </div>
            </div>
            <Btn variant="primary" onClick={handOver}>{t("xHandoverButton")}</Btn>
          </div>

          <div className={C.orLine}><span>{t("xOr")}</span></div>

          <div className={C.qrBlock}>
            <div className={C.handoverTitle}>{t("xQrTitle")}</div>
            <p className={C.muted} style={{ fontSize: 13.5, margin: "2px 0 8px" }}>{t("xQrHint")}</p>
            {qr ? <img className={C.qr} src={qr} alt="QR" /> : <div className={C.qrPlaceholder} />}
          </div>

          <div className={C.orLine}><span>{t("xOrSend")}</span></div>

          <div className={C.row2}>
            <Btn variant="whatsapp" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                 target="_blank" rel="noopener noreferrer" onClick={() => trackCheckout("parent_whatsapp")}>
              WhatsApp
            </Btn>
            <Btn variant="viber" href={`viber://forward?text=${encodeURIComponent(shareText)}`}
                 onClick={() => trackCheckout("parent_viber")}>
              Viber
            </Btn>
          </div>
          <Btn variant="ghost" onClick={copy}>{t("parentCopy")}</Btn>
          <p className={C.muted} style={{ fontSize: 12.5 }}>{t("parentLinkValid")} {t("parentAfter")}</p>
        </div>
      )}
    </Modal>
  );
}
