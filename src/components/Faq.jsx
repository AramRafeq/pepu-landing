import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import H from "../../styles/home.module.css";

const COUNT = 12;

// The two walkthrough videos stay as their own answers.
const VIDEOS = [
  { titleKey: "faq.title_10", src: "https://www.youtube.com/embed/DIrCREsDaE4" },
  { titleKey: "faq.title_11", src: "https://www.youtube.com/embed/PeEXAqyqazQ" },
];

/** Chunky accordion cards in the home page's style; one open at a time. */
const Faq = () => {
  const { t } = useTranslation("general");
  const [open, setOpen] = useState(0);

  const items = [
    ...Array.from({ length: COUNT }, (_, i) => ({
      q: t(`faq2.q${i + 1}`),
      a: <p>{t(`faq2.a${i + 1}`)}</p>,
    })),
    ...VIDEOS.map(({ titleKey, src }) => ({
      q: t(titleKey),
      a: (
        <div className={H.video}>
          <iframe
            src={src}
            title={t(titleKey)}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ),
    })),
  ];

  return (
    <section className={H.section} id="faq">
      <div className={`${H.faqHead} ${H.reveal}`}>
        <img src="/assets/pepu/help.webp" alt="" loading="lazy" />
        <div>
          <h2 className={H.sectionTitle}>{t("faq2.title")}</h2>
          <p className={H.faqSub}>{t("faq2.sub")}</p>
        </div>
      </div>
      <div className={H.faqList}>
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={`${H.faqItem} ${isOpen ? H.faqOpen : ""}`}>
              <button
                type="button"
                className={H.faqQ}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{item.q}</span>
                <span className={H.faqIcon} aria-hidden="true">+</span>
              </button>
              <div className={H.faqA}>
                <div>{item.a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Faq;
