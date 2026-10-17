import Script from "next/script";
import { ConfigProvider } from "antd";
import useTranslation from "next-translate/useTranslation";
import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import useWindowAvailable from "../utils/useWindows";
import MessengerButton from "../components/MessengerButton";
import { signInFromHandoff } from "../utils/handoff";

function App({ Component, pageProps }) {
  const { isWindowAvailable } = useWindowAvailable();
  const { lang } = useTranslation("general");
  const router = useRouter();

  // The app's checkout ad may land on any page: sign in from its handoff code
  // in the background so /subscribe opens as the app's account. /subscribe
  // runs the sign-in itself, holding its spinner until it's done.
  useEffect(() => {
    if (router.pathname !== "/subscribe") signInFromHandoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isWindowAvailable && lang) {
      const element = document.getElementsByTagName("html")[0];

      if (lang === "en") {
        element.setAttribute("dir", "ltr");
      } else {
        element.setAttribute("dir", "rtl");
      }
    }
  }, [isWindowAvailable, lang]);
  return (
    <>
      {/* Microsoft Clarity — session recordings & heatmaps. afterInteractive
          rather than lazyOnload so the recording starts before the visitor
          begins interacting; the whole point is watching /subscribe sessions
          from their first moment. */}
      <Script
        strategy="afterInteractive"
        id="ms-clarity"
        dangerouslySetInnerHTML={{
          __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "ycet54o0sd");`,
        }}
      />
      <Script
        strategy="lazyOnload"
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
                                    function gtag() {dataLayer.push(arguments); }
                                    gtag('js', new Date());

                                    gtag('config', 'G-KVSEKXR4NP');`,
        }}
      />
      <ConfigProvider   theme={{
      token: {
        colorPrimary: '#9241FE',
        borderRadius: 2,
      },
    }}>
        <Component {...pageProps} />
        <MessengerButton />
      </ConfigProvider>
    </>
  );
}

export default App;
