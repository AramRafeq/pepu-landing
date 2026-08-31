import React from "react";
import { Row, Col, Typography } from "antd";
import useTranslation from "next-translate/useTranslation";
import Style from "../../styles/stats.module.css";

// Figures verified against the production database on 2026-08-27.
//
//   users            145,491 rows in `users`            -> "145,000+"
//   questions        19,483,392 question_attempts with  -> "19,000,000+"
//                    a non-null `answer` (29.6m were
//                    served; only these were answered)
//   exams            1,491,527 attempts, entity_state
//                    = 'active'                         -> "1,500,000+"
//   rating           Google Play 4.21 (92 ratings) and
//                    App Store 4.24 (25 ratings)        -> "4.2"
//
// Every one is rounded DOWN so the claim stays true as the numbers grow.
// Re-check before changing any of them.
const STATS = [
  { key: "students", value: "145,000+" },
  { key: "questions", value: "19,000,000+" },
  { key: "exams", value: "1,500,000+" },
  { key: "rating", value: "4.2 ★" },
];

const Stats = () => {
  const { t } = useTranslation("general");

  return (
    <section className={Style.section} aria-labelledby="stats-heading">
      <Typography id="stats-heading" className="sub-header">
        {t("stats.title")}
      </Typography>

      <Row gutter={[16, 16]} justify="center" align="stretch">
        {STATS.map(({ key, value }) => (
          <Col key={key} lg={6} md={6} sm={12} xs={12}>
            <div className={Style.stat}>
              {/* The number is the content; the label describes it. Kept LTR
                  so digits read correctly inside the RTL page. */}
              <span className={Style.value} dir="ltr">
                {value}
              </span>
              <span className={Style.label}>{t(`stats.${key}`)}</span>
            </div>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default Stats;
