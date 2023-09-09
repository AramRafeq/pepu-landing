import React from "react";
import { Row, Col, Typography } from "antd";
import Style from "../../styles/index.module.css";
import useTranslation from "next-translate/useTranslation";

const Features = () => {
  const { t, lang } = useTranslation("general");
  return <>
    <Typography className="sub-header">{t(
      "header.features"
    )}</Typography>
    <Row
      align={"middle"}
      justify={"space-between"}
      style={{ marginBottom: "30px" }}
    >
      <Col md={8} xs={24} style={{ maxWidth: "93%" }}>
        <div className={Style.about__desc}>
          <div className={Style.boxs}/>
          <p>{t("header.features_1")}</p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>{t("header.features_2")}</p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>{t("header.features_3")}</p>
        </div>
      </Col>
      <Col md={5} xs={24} style={{ textAlign: "center" }}>
        <img
          src="/assets/pepuscreenshoot.svg"
          alt="Pepu Screen"
          height={"700"}
          style={{
            maxWidth: "80vw",
            maxHeight: "70%",
            objectFit: "contain",

          }}
        />
      </Col>
      <Col md={8} xs={24} style={{ maxWidth: "93%" }}>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>
          {t("header.features_4")}
          </p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>{t("header.features_5")}</p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>
          {t("header.features_6")}
          </p>
        </div>
      </Col>
    </Row>
  </>
};
export default Features;
