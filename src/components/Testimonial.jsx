import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { testimonials } from "~/src/data/testimonials";
import H from "../../styles/home.module.css";

// Latin-script Kurdish and English reviews stay left-aligned even though the
// page itself is RTL; an Arabic-script review follows the page. Judged on the
// first strong character, so a review written in Kurmanji Latin is not reversed.
const isRtlText = (s) => /[؀-ۿݐ-ݿ]/.test((s || "").trim().charAt(0));

const INITIAL_COUNT = 6;
const TONES = ["#9241fe", "#ff8e06", "#1fb6ff", "#22c55e", "#ff5a8a", "#7c5cff"];
const BUBBLES = ["#f3e9ff", "#fff1dd", "#e6f7ff", "#eafbe9", "#fff0f6", "#ece9ff"];

/** Student reviews as speech-bubble cards in the home page's style. */
const Testimonial = () => {
  const { t } = useTranslation("general");
  const [expanded, setExpanded] = useState({});
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? testimonials : testimonials.slice(0, INITIAL_COUNT);

  return (
    <section className={H.section} aria-labelledby="testimonials-heading">
      <div className={`${H.faqHead} ${H.reveal}`}>
        <img src="/assets/pepu/laughing.webp" alt="" loading="lazy" />
        <div>
          <h2 id="testimonials-heading" className={H.sectionTitle}>
            {t("header.pepuUsers")}
          </h2>
          <p className={H.faqSub}>{t("testimonials.source")}</p>
        </div>
      </div>

      <div className={H.reviews}>
        {visible.map((d, i) => {
          const rtl = isRtlText(d.text);
          const isLong = d.text.length > 150;
          const isOpen = expanded[i];
          const tone = TONES[i % TONES.length];
          return (
            <article key={`${d.name}-${i}`} className={H.review}>
              {/* Speech bubble first, the student under it — like a quote. */}
              <div className={H.reviewBubble} style={{ background: BUBBLES[i % BUBBLES.length] }}>
                <div className={H.reviewStars} aria-label={`${d.rating} / 5`}>
                  {"★".repeat(Math.round(d.rating))}
                  <span>{"★".repeat(5 - Math.round(d.rating))}</span>
                </div>
                <p
                  className={`${H.reviewText} ${!isOpen && isLong ? H.clamped : ""}`}
                  dir={rtl ? "rtl" : "ltr"}
                  style={{ textAlign: rtl ? "right" : "left" }}
                >
                  {d.text}
                </p>
                {isLong && (
                  <button
                    type="button"
                    className={H.reviewMore}
                    onClick={() => setExpanded((s) => ({ ...s, [i]: !s[i] }))}
                    aria-expanded={!!isOpen}
                  >
                    {isOpen ? t("testimonials.less") : t("testimonials.more")}
                  </button>
                )}
              </div>
              <div className={H.reviewWho}>
                {/* a coloured initial, not the Google avatar URL: those 404
                    over time and leak a request to Google */}
                <span className={H.reviewAvatar} style={{ background: tone }}>
                  {d.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
                </span>
                <span className={H.reviewName}>
                  <b dir="auto">{d.name}</b>
                  <small>{d.date}</small>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {!showAll && testimonials.length > INITIAL_COUNT && (
        <div className={H.reviewsMore}>
          <button type="button" className={H.ghostBtn} onClick={() => setShowAll(true)}>
            {t("testimonials.showAll")}
          </button>
        </div>
      )}
    </section>
  );
};

export default Testimonial;
