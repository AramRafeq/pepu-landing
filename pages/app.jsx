import { useEffect, useState } from "react";

/**
 * pepu.krd/app — the door from a link into the app.
 *
 * With Pepu installed the OS opens the app straight from the https link and
 * this page is never seen. Without it, the page tries the custom scheme,
 * then sends the visitor to the store.
 *
 * `?invite=K7Q2MX` is a friend's invite (docs/friends-and-chat.md). The
 * scheme redirect carries the whole query so an installed app still gets the
 * code, and the page shows it in large letters so a student installing Pepu
 * for the first time can type it in afterwards — the low-tech alternative to
 * a deferred deep-link service.
 */
export default function App() {
  const [invite, setInvite] = useState("");

  useEffect(() => {
    const query = window.location.search || "";
    const code = new URLSearchParams(query).get("invite");
    if (code) setInvite(code.toUpperCase());

    window.location.replace("pepu://app/" + query);
    setTimeout(function () {
      // Only fires if the deep link fails: Pepu is not installed.
      window.location = "https://onelink.to/pepu";
    }, 5000);
  }, []);

  if (!invite) {
    return (
      <>
        <span></span>
      </>
    );
  }

  return (
    <main style={styles.page} dir="rtl">
      <p style={styles.lead}>هاوڕێکەت بانگهێشتی کردوویت بۆ پەپوو</p>
      <p style={styles.hint}>دوای دامەزراندنی پەپوو، ئەم کۆدە لە بەشی هاوڕێکان بنووسە:</p>
      <div style={styles.code} dir="ltr">
        {invite}
      </div>
      <a style={styles.button} href="https://onelink.to/pepu">
        دامەزراندنی پەپوو
      </a>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    fontFamily: "'Noto Kufi Arabic', system-ui, sans-serif",
    background: "linear-gradient(#f6f1ff, #ffffff 55%)",
    color: "#1a0638",
    textAlign: "center",
  },
  lead: { fontSize: 20, fontWeight: 700, margin: "0 0 8px" },
  hint: { fontSize: 15, color: "#6e6786", margin: "0 0 24px", maxWidth: 360 },
  code: {
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: 8,
    color: "#9241fe",
    background: "#ffffff",
    border: "1px solid #e9e2f7",
    borderRadius: 16,
    padding: "16px 28px",
    marginBottom: 28,
  },
  button: {
    background: "#9241fe",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 16,
    padding: "14px 32px",
    borderRadius: 14,
  },
};
