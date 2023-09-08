import Script from "next/script";
import { ConfigProvider } from "antd";
import useTranslation from "next-translate/useTranslation";
import { useEffect } from "react";
import "../styles/globals.css";
import useWindowAvailable from "../utils/useWindows";

function App({ Component, pageProps }) {
  const { isWindowAvailable } = useWindowAvailable();
  const { lang } = useTranslation("general");

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
      <Script
        id="fb-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
              var chatbox = document.getElementById('fb-customer-chat');
              chatbox.setAttribute("page_id", "102162639123374");
              chatbox.setAttribute("attribution", "biz_inbox");
          `,
        }}
      />
      <Script
        strategy="lazyOnload"
        id="fb-script"
        dangerouslySetInnerHTML={{
          __html: `
                             window.fbAsyncInit = function() {
                                FB.init({
                                  xfbml            : true,
                                  version          : 'v15.0'
                                });
                              };
                        
                              (function(d, s, id) {
                                var js, fjs = d.getElementsByTagName(s)[0];
                                if (d.getElementById(id)) return;
                                js = d.createElement(s); js.id = id;
                                js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
                                fjs.parentNode.insertBefore(js, fjs);
                              }(document, 'script', 'facebook-jssdk'));
                            `,
        }}
      />
      <ConfigProvider   theme={{
      token: {
        colorPrimary: '#9241FE',
        borderRadius: 2,
      },
    }}>
        <div id="fb-root"></div>
        <div id="fb-customer-chat" className="fb-customerchat"></div>
        <Component {...pageProps} />
      </ConfigProvider>
    </>
  );
}

export default App;
