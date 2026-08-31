import { Button, Dropdown, Space } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import Head from "next/head";
import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";
import Faq from "../src/components/Faq";
import Features from "../src/components/Features";
import Testimonial from "../src/components/Testimonial";
import Style from "../styles/index.module.css";
import { LANGUAGES } from "~/utils/constants";
import { handleLanguageChange } from "~/utils/general";

const APP_STORE_URL =
  "https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=io.hesta.pepu_2";

/* Verified against the production database on 2026-08-27 — see Stats.jsx
   for the sourcing notes. Rounded down so the claims stay true. */
const STATS = [
  { key: "students", value: "145,000+" },
  { key: "questions", value: "19,000,000+" },
  { key: "exams", value: "1,500,000+" },
  { key: "rating", value: "4.2 ★" },
];

export default function Home() {
  const { t, lang } = useTranslation("general");

  const currentLanguage = useMemo(() => {
    const match = LANGUAGES.find((item) => item.slug === lang);
    return match ? t(match.name) : "";
  }, [lang, t]);

  const languageOptions = LANGUAGES.filter(({ slug }) => slug !== lang).map(
    ({ slug, name }) => ({ key: slug, label: t(name) })
  );

  return (
    <>
      <Head>
        <title>{t("meta_title")}</title>
        {/* user-scalable=no was blocking pinch-zoom, which fails WCAG 1.4.4
            and hurts most on the small phones this audience actually uses. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="robots" content="index,follow" />
        <meta name="theme-color" content="#9241FE" />
        <meta name="description" content={t("header.description")} />
        {/* SoftwareApplication structured data — richer app result in search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MobileApplication",
              name: "Pepu",
              alternateName: "پەپوو",
              applicationCategory: "EducationalApplication",
              operatingSystem: "iOS, Android",
              inLanguage: ["ckb", "ar", "en"],
              url: "https://pepu.krd/",
              description: t("header.description"),
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "IQD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.2",
                ratingCount: "117",
              },
              author: {
                "@type": "Organization",
                name: "Hesta For Information Technology LTD",
                url: "https://pepu.krd/",
              },
            }),
          }}
        />
      </Head>

      {/* ---- quiet header: wordmark, language, one CTA ---- */}
      <header className={Style.header}>
        <a href="/" className={Style.brand}>
          <img src="/assets/papu.svg" alt="" />
          <span>پەپوو</span>
        </a>
        <div className={Style.headerActions}>
          <Dropdown
            menu={{
              items: languageOptions,
              onClick: (e) => handleLanguageChange(e.key),
            }}
          >
            <Button type="text" className={Style.langButton}>
              <Space size={6}>
                {currentLanguage}
                <GlobalOutlined />
              </Space>
            </Button>
          </Dropdown>
          <Button type="primary" href="/subscribe" className={Style.headerCta}>
            {t("subscribeCta")}
          </Button>
        </div>
      </header>

      <main className={Style.page}>
        {/* ---- two-column hero: copy on one side, the owl on the other ---- */}
        <section className={Style.hero}>
          <div className={Style.heroGrid}>
            <div className={Style.heroCopy}>
              <p className={Style.kicker}>{t("header.title")}</p>
              <h1 className={Style.heroTitle}>{t("footer.title")}</h1>
              <p className={Style.heroDescription}>{t("header.description")}</p>
              <div className={Style.heroCtas}>
                <a href={APP_STORE_URL} className={Style.badge}>
                  <img src="/assets/appstore.svg" alt="App Store" />
                </a>
                <a href={PLAY_STORE_URL} className={Style.badge}>
                  <img src="/assets/gplay.svg" alt="Google Play" />
                </a>
              </div>
            </div>
            <div className={Style.heroArt}>
              <span className={Style.heroBlob} aria-hidden="true" />
              <img src="/assets/characters/pepu_saying_hi.svg" alt="" />
            </div>
          </div>

          <dl className={Style.statsRow}>
            {STATS.map(({ key, value }) => (
              <div key={key} className={Style.stat}>
                <dt>{t(`stats.${key}`)}</dt>
                <dd dir="ltr">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className={Style.container}>
          <Testimonial />
          <Features />
          <Faq />
          <div className={Style.closingCharacter}>
            <img src="/assets/characters/pepu_standing_on_books.svg" alt="" />
          </div>
        </div>
      </main>

      {/* ---- minimal footer: one hairline, one row ---- */}
      <footer className={Style.footer}>
        <div className={Style.footerRow}>
          <a href="/" className={Style.brand}>
            <img src="/assets/papu.svg" alt="" />
            <span>پەپوو</span>
          </a>
          <div className={Style.footerBadges}>
            <a href={APP_STORE_URL} className={Style.badge}>
              <img src="/assets/appstore.svg" alt="App Store" />
            </a>
            <a href={PLAY_STORE_URL} className={Style.badge}>
              <img src="/assets/gplay.svg" alt="Google Play" />
            </a>
          </div>
          <div className={Style.socials}>
            <a href="https://instagram.com/pepu.krd" aria-label="Instagram">
              <BsInstagram />
            </a>
            <a href="https://facebook.com/pepu.krd" aria-label="Facebook">
              <BsFacebook />
            </a>
          </div>
        </div>
        <p className={Style.copyright}>{t("footer.privacy")}</p>
      </footer>
    </>
  );
}
