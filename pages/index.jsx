import { Dropdown } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import Faq from "../src/components/Faq";
import Testimonial from "../src/components/Testimonial";
import StoreBadges from "../src/components/StoreBadges";
import Style from "../styles/index.module.css";
import H from "../styles/home.module.css";
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

const FEATURES = [
  { key: "exams", art: "focus", tone: H.c1 },
  { key: "tutor", art: "help", tone: H.c2 },
  { key: "companion", art: "detective", tone: H.c3 },
  { key: "cards", art: "understood", tone: H.c4 },
  { key: "focus", art: "lets_start", tone: H.c5 },
  { key: "streak", art: "celebrate", tone: H.c6 },
  { key: "friends", art: "laughing", tone: H.c7, wide: true },
];

const MOODS = ["hello", "laughing", "listening", "thanks", "rest", "encourage"];

/** Adds `shown` to anything with the reveal class once it scrolls into view. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(`.${H.reveal}`);
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add(H.shown));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(H.shown);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** A Pepu that does a squishy boing when poked. */
function Mood({ name }) {
  const [poked, setPoked] = useState(false);
  const timer = useRef();
  return (
    <button
      type="button"
      className={`${H.mood} ${poked ? H.poked : ""}`}
      onClick={() => {
        setPoked(false);
        clearTimeout(timer.current);
        requestAnimationFrame(() => setPoked(true));
        timer.current = setTimeout(() => setPoked(false), 650);
      }}
      aria-label="Pepu"
    >
      <img src={`/assets/pepu/${name}.webp`} alt="" loading="lazy" />
    </button>
  );
}

export default function Home() {
  const { t, lang } = useTranslation("general");
  useReveal();
  const title = t("home.title");
  const accent = t("home.titleAccent");
  const [before, after] = title.includes(accent) ? title.split(accent) : [title, ""];
  const subjects = t("home.subjects");

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

      {/* ---- header: floating pill bar, Pepu wordmark, language, one CTA ---- */}
      <header className={H.topbar}>
        <div className={H.topbarInner}>
          <a href="/" className={H.logo}>
            <img src="/assets/pepu/hello.webp" alt="" />
            <span>پەپوو</span>
          </a>
          <div className={H.topActions}>
            <Dropdown
              menu={{
                items: languageOptions,
                onClick: (e) => handleLanguageChange(e.key),
              }}
            >
              <button type="button" className={H.langPill} aria-label={currentLanguage}>
                <GlobalOutlined />
                <span className={H.langText}>{currentLanguage}</span>
              </button>
            </Dropdown>
            <a href="/subscribe" className={H.topCta}>
              <span className={H.ctaLong}>{t("subscribeCta")}</span>
              <span className={H.ctaShort}>{t("home.subscribeShort")}</span>
            </a>
          </div>
        </div>
      </header>

      <main className={`${Style.page} ${H.clip}`}>
        {/* ---- hero: big headline, waving Pepu on a morphing blob, stickers ---- */}
        <section className={H.hero}>
          <div className={H.heroInner}>
            <div>
              <span className={H.kicker}>🦉 {t("home.kicker")}</span>
              <h1 className={H.title}>
                {before}
                {after !== "" || title.includes(accent) ? <span className={H.accent}>{accent}</span> : null}
                {after}
              </h1>
              <p className={H.sub}>{t("home.sub")}</p>
              <div className={H.ctas}>
                <a href="/subscribe" className={H.bigCta}>{t("subscribeCta")}</a>
                <StoreBadges />
              </div>
            </div>
            <div className={H.art}>
              <span className={H.blob} aria-hidden="true" />
              <img className={H.heroPepu} src="/assets/pepu/hello.webp" alt="Pepu" />
              <span className={H.bubble}>{t("home.hi")}</span>
              <span className={`${H.sticker} ${H.s1}`} aria-hidden="true">⭐</span>
              <span className={`${H.sticker} ${H.s2}`} aria-hidden="true">📚</span>
              <span className={`${H.sticker} ${H.s3}`} aria-hidden="true">✏️</span>
              <span className={`${H.sticker} ${H.s4}`} aria-hidden="true">🔥</span>
              <span className={`${H.sticker} ${H.s5}`} aria-hidden="true">🧪</span>
            </div>
          </div>

          <dl className={H.stats}>
            {STATS.map(({ key, value }) => (
              <div key={key} className={H.stat}>
                <dd dir="ltr">{value}</dd>
                <dt>{t(`stats.${key}`)}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- subject ticker ---- */}
        <div className={H.ticker} aria-hidden="true">
          <div className={H.track}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>{subjects} •</span>
            ))}
          </div>
        </div>

        {/* ---- what Pepu does: one card per feature, each with its own Pepu ---- */}
        <section className={H.section}>
          <h2 className={`${H.sectionTitle} ${H.reveal}`}>{t("home.featuresTitle")}</h2>
          <p className={`${H.sectionSub} ${H.reveal}`}>{t("home.featuresSub")}</p>
          <div className={H.cards}>
            {FEATURES.map(({ key, art, tone, wide }) => (
              <article key={key} className={`${H.card} ${tone} ${wide ? H.wide : ""} ${H.reveal}`}>
                <div>
                  <h3>{t(`home.f_${key}_title`)}</h3>
                  <p>{t(`home.f_${key}_text`)}</p>
                </div>
                <img className={H.cardArt} src={`/assets/pepu/${art}.webp`} alt="" loading="lazy" />
              </article>
            ))}
          </div>
        </section>

        <Testimonial />

        {/* ---- a Pepu for every mood: poke them ---- */}
        <section className={H.section}>
          <h2 className={`${H.sectionTitle} ${H.reveal}`}>{t("home.moodsTitle")}</h2>
          <p className={`${H.sectionSub} ${H.reveal}`}>{t("home.moodsSub")}</p>
          <div className={`${H.moods} ${H.reveal}`}>
            {MOODS.map((m) => (
              <Mood key={m} name={m} />
            ))}
          </div>
        </section>

        <Faq />

        {/* ---- closing call to action ---- */}
        <section className={`${H.cta} ${H.reveal}`}>
          <div className={H.ctaBox}>
            <div>
              <h2>{t("home.ctaTitle")}</h2>
              <p>{t("home.ctaSub")}</p>
              <div className={H.ctas}>
                <a href="/subscribe" className={H.bigCta}>{t("subscribeCta")}</a>
                <StoreBadges />
              </div>
            </div>
            <img className={H.ctaPepu} src="/assets/pepu/celebrate.webp" alt="" loading="lazy" />
            <span className={H.confetti} style={{ top: "12%", insetInlineEnd: "8%" }} aria-hidden="true">🎉</span>
            <span className={H.confetti} style={{ top: "8%", insetInlineStart: "8%", animationDelay: "-2s" }} aria-hidden="true">✨</span>
          </div>
        </section>
      </main>

      {/* ---- minimal footer: one hairline, one row ---- */}
      <footer className={Style.footer}>
        <div className={Style.footerRow}>
          <a href="/" className={Style.brand}>
            <img src="/assets/pepu/hello.webp" alt="" style={{ height: 36 }} />
            <span>پەپوو</span>
          </a>
          <StoreBadges />
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
