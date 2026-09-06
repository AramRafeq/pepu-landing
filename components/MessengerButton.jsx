import useTranslation from "next-translate/useTranslation";

/// Floating "talk to us on Messenger" button.
///
/// This replaces Meta's Customer Chat plugin, which used to sit in _app.jsx.
/// That plugin is discontinued — its SDK (xfbml.customerchat.js) now answers
/// HTTP 500 with an empty body — so for some time the site has shipped the
/// markup and the loader for a widget that could never render, and visitors
/// had no way to reach a human from any page.
///
/// A plain m.me link needs no SDK and cannot break the same way: it is the
/// same destination the mobile app hands stuck students (see
/// payment_help_sheet.dart), so both surfaces land in the same inbox.
const MESSENGER_URL = "https://m.me/pepu.krd";

export default function MessengerButton() {
  const { t } = useTranslation("general");

  // next-translate hands back the key itself when the namespace was not
  // loaded for a route — which is the case on the 404 and 500 pages, where
  // this would otherwise announce itself as "contactMessenger". Those are
  // exactly the pages where a lost visitor most wants a human.
  const translated = t("contactMessenger");
  const label = translated === "contactMessenger" ? "Messenger" : translated;

  return (
    <a
      href={MESSENGER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="pepu-messenger"
      aria-label={label}
      title={label}
    >
      {/* Inline so it renders even before any network request settles —
          a contact button that waits on an asset is the failure we are
          replacing. */}
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 2C6.24 2 2 6.31 2 11.85c0 3.16 1.4 5.98 3.6 7.83V24l3.3-1.81c.99.27 2.04.42 3.1.42 5.76 0 10-4.31 10-9.85S17.76 2 12 2zm1.03 13.13l-2.58-2.75-5.03 2.75 5.53-5.87 2.64 2.75 4.97-2.75-5.53 5.87z"
        />
      </svg>

      <style jsx>{`
        .pepu-messenger {
          position: fixed;
          /* Logical inset: bottom-right in English, bottom-left once the
             page flips to RTL for Kurdish and Arabic, with no extra rules. */
          inset-inline-end: 20px;
          bottom: calc(20px + env(safe-area-inset-bottom, 0px));

          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;

          background: linear-gradient(135deg, #00b2ff 0%, #006aff 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(0, 106, 255, 0.4);

          /* Under antd's overlays (Modal 1000, message 1010) so a dialog is
             never fighting a chat bubble, but above ordinary page content. */
          z-index: 900;

          -webkit-tap-highlight-color: transparent;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .pepu-messenger:hover,
        .pepu-messenger:focus-visible {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(0, 106, 255, 0.5);
        }

        .pepu-messenger:focus-visible {
          outline: 3px solid #9241fe;
          outline-offset: 3px;
        }

        .pepu-messenger:active {
          transform: scale(0.97);
        }

        @media (prefers-reduced-motion: reduce) {
          .pepu-messenger {
            transition: none;
          }
          .pepu-messenger:hover,
          .pepu-messenger:focus-visible,
          .pepu-messenger:active {
            transform: none;
          }
        }

        /* Thumbs sit lower on phones and the subscribe flow ends in a
           full-width button; keep clear of it. */
        @media (max-width: 480px) {
          .pepu-messenger {
            width: 52px;
            height: 52px;
            inset-inline-end: 14px;
            bottom: calc(14px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </a>
  );
}
