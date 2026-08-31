import React, { useState } from "react";
import { Row, Col, Typography, Card, Avatar, Rate, Button } from "antd";
import useTranslation from "next-translate/useTranslation";
import { testimonials } from "~/src/data/testimonials";
import Style from "../../styles/testimonial.module.css";

// Latin-script Kurdish and English reviews stay left-aligned even though the
// page itself is RTL; an Arabic-script review follows the page. Judged on the
// first strong character rather than the page direction, so a review written
// in Kurmanji Latin does not come out reversed.
const isRtlText = (s) => /[؀-ۿݐ-ݿ]/.test((s || "").trim().charAt(0));

const INITIAL_COUNT = 8;

const Testimonial = () => {
  const { t } = useTranslation("general");
  const [expanded, setExpanded] = useState({});
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? testimonials : testimonials.slice(0, INITIAL_COUNT);

  return (
    <section className={Style.section} aria-labelledby="testimonials-heading">
      <Typography id="testimonials-heading" className="sub-header">
        {t("header.pepuUsers")}
      </Typography>

      <Typography.Paragraph className={Style.sourceNote}>
        {t("testimonials.source")}
      </Typography.Paragraph>

      <Row gutter={[24, 24]} justify="center" align="stretch">
        {visible.map((d, i) => {
          const rtl = isRtlText(d.text);
          const isLong = d.text.length > 150;
          const isOpen = expanded[i];
          return (
            <Col key={`${d.name}-${i}`} lg={8} md={12} sm={24} xs={24}>
              <Card className={Style.card} bordered={false}>
                <div className={Style.head}>
                  {/* colored initial, not the Google avatar URL: those
                      googleusercontent images 404 over time and leak a
                      request to Google — the initial is uniform and reliable */}
                  <Avatar size={48} className={Style.avatar}>
                    {d.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>
                  <div className={Style.meta}>
                    <span className={Style.name}>{d.name}</span>
                    <span className={Style.date}>{d.date}</span>
                  </div>
                </div>

                <Rate
                  disabled
                  value={d.rating}
                  className={Style.stars}
                  aria-label={`${d.rating} / 5`}
                />

                {/* Truncation is done with real state, not a Tooltip: a
                    tooltip needs hover, and most of this traffic is phones,
                    where the full text was unreachable. */}
                <p
                  className={`${Style.text} ${!isOpen && isLong ? Style.clamped : ""}`}
                  dir={rtl ? "rtl" : "ltr"}
                  style={{ textAlign: rtl ? "right" : "left" }}
                >
                  {d.text}
                </p>

                {isLong && (
                  <Button
                    type="link"
                    size="small"
                    className={Style.more}
                    onClick={() => setExpanded((s) => ({ ...s, [i]: !s[i] }))}
                    aria-expanded={!!isOpen}
                  >
                    {isOpen ? t("testimonials.less") : t("testimonials.more")}
                  </Button>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {!showAll && testimonials.length > INITIAL_COUNT && (
        <div className={Style.showAllWrap}>
          <Button onClick={() => setShowAll(true)} className={Style.showAll}>
            {t("testimonials.showAll")}
          </Button>
        </div>
      )}
    </section>
  );
};

export default Testimonial;
