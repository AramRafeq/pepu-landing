import React from "react";
import { Col, Row, Typography } from "antd";
import {
  BsBarChartLine,
  BsBell,
  BsCameraVideo,
  BsLightningCharge,
  BsPatchQuestion,
  BsArrowRepeat,
} from "react-icons/bs";
import useTranslation from "next-translate/useTranslation";
import Style from "../../styles/features.module.css";

/* Icon per translation key — the copy stays in locales, untouched. */
const FEATURES = [
  { key: "features_1", Icon: BsPatchQuestion },
  { key: "features_2", Icon: BsCameraVideo },
  { key: "features_3", Icon: BsArrowRepeat },
  { key: "features_4", Icon: BsLightningCharge },
  { key: "features_5", Icon: BsBarChartLine },
  { key: "features_6", Icon: BsBell },
];

const Features = () => {
  const { t } = useTranslation("general");

  return (
    <section aria-labelledby="features-heading">
      <Typography id="features-heading" className="sub-header">
        {t("header.features")}
      </Typography>

      <Row gutter={[16, 16]} align="stretch">
        {FEATURES.map(({ key, Icon }) => (
          <Col key={key} xs={24} sm={12} lg={8}>
            <div className={Style.card}>
              <span className={Style.icon} aria-hidden="true">
                <Icon />
              </span>
              <p>{t(`header.${key}`)}</p>
            </div>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default Features;
