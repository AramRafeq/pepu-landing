import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { testimonials } from "~/src/data/testimonials";
import H from "../../styles/home.module.css";

const isRtlText = (s) => /[؀-ۿݐ-ݿ]/.test((s || "").trim().charAt(0));
// the review cards' colours, so the hero bubbles match the section below
const TONES = ["#9241fe", "#ff8e06", "#1fb6ff", "#22c55e", "#ff5a8a", "#7c5cff"];
const BUBBLES = ["#f3e9ff", "#fff1dd", "#e6f7ff", "#eafbe9", "#fff0f6", "#ece9ff"];

// Short enough to read at a glance, and none that calls Pepu free: it has
// not been since September 2026.
const FREE = /free|خۆڕای|بێبەرامبەر|بەخۆڕایی|مجان/i;
const short = testimonials.filter((d) => d.text.length <= 130 && !FREE.test(d.text));
// the reviews section right below opens with the first six; lead with the rest
const POOL = [...short.filter((d) => testimonials.indexOf(d) >= 6), ...short.filter((d) => testimonials.indexOf(d) < 6)];

const initial = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

/** One student's words as a speech bubble beside Pepu. */
const Quote = ({ i, slot }) => {
  const d = POOL[i];
  const rtl = isRtlText(d.text);
  return (
    <figure className={`${H.heroQuote} ${slot}`} style={{ "--fill": BUBBLES[i % BUBBLES.length] }}>
      <blockquote dir={rtl ? "rtl" : "ltr"} style={{ textAlign: rtl ? "right" : "left" }}>
        {d.text}
      </blockquote>
      <figcaption dir="auto">
        <span style={{ background: TONES[i % TONES.length] }}>{initial(d.name)}</span>
        {d.name}
      </figcaption>
    </figure>
  );
};

/**
 * Two real reviews around the hero Pepu. They take turns changing, one every
 * few seconds, so there is always one steady to read, and the two never show
 * the same review.
 */
export const HeroQuotes = () => {
  const [shown, setShown] = useState({ a: 0, b: 1, next: 2, turn: 0 });

  useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still || POOL.length < 3) return undefined;
    const id = setInterval(
      () =>
        setShown(({ a, b, next, turn }) => {
          const other = turn === 0 ? b : a;
          const pick = next === other ? (next + 1) % POOL.length : next;
          return {
            a: turn === 0 ? pick : a,
            b: turn === 0 ? b : pick,
            next: (pick + 1) % POOL.length,
            turn: 1 - turn,
          };
        }),
      4200
    );
    return () => clearInterval(id);
  }, []);

  if (POOL.length < 2) return null;
  // keyed by review so each change remounts the bubble and plays its pop-in
  return (
    <>
      <Quote key={`a${shown.a}`} i={shown.a} slot={H.hq1} />
      <Quote key={`b${shown.b}`} i={shown.b} slot={H.hq2} />
    </>
  );
};

/** Under the hero's buttons: the reviewers' initials, five stars, and a link down to them. */
export const HeroProof = () => {
  const { t } = useTranslation("general");
  return (
    <a href="#reviews" className={H.proof}>
      <span className={H.proofFaces} aria-hidden="true">
        {POOL.slice(0, 5).map((d, i) => (
          <span key={d.name} style={{ background: TONES[i % TONES.length] }}>{initial(d.name)}</span>
        ))}
      </span>
      <span className={H.proofText}>
        <b aria-hidden="true">★★★★★</b>
        {t("home.proof")}
      </span>
    </a>
  );
};
