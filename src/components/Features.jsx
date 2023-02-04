import React from "react";
import { Row, Col, Typography } from "antd";
import Style from "../../styles/index.module.css";

const Features = () => (
  <>
    <Typography className="sub-header">تایبەتمەندیەکان</Typography>
    <Row
      align={"middle"}
      justify={"space-between"}
      style={{ marginBottom: "30px" }}
    >
      <Col md={8} xs={24} style={{ maxWidth: "93%" }}>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>سوودمەند دەبی لە هەزاران پرسیاری تایبەت و وزاری</p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>شیکاری ڤیدیۆیی</p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>دووبارەکردنەوەی ئەو تاقیکردنەوە بۆ باشترکردنی ئاستت</p>
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
            direction: "ltr",
          }}
        />
      </Col>
      <Col md={8} xs={24} style={{ maxWidth: "93%" }}>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>
            خێرا لە کارکردن و ئاسان لە بەکارهێنان بە کەمترین کات زۆرترین پرسیار
            شیکار بکە
          </p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>زانینی کۆمەڵێک زانیاری لەسەر ئاستی خوێندنت</p>
        </div>
        <div className={Style.about__desc}>
          <div className={Style.boxs} />
          <p>
            وەرگرتنی ئاگادارکردنەوەی بۆ ڕێنمایی خوێندن کە تایبەتە بە هەژمارەکەت
          </p>
        </div>
      </Col>
    </Row>
  </>
);
export default Features;
