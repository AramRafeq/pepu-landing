import Image from "next/image";
import React from "react";
import styles from "../../styles/About.module.css";
import pepuscreen from "../assets/pepuscreenshoot.svg";
import { Row, Col } from "antd";

const About = () => {
  return (
    <Row
      align={"middle"}
      justify={"space-between"}
      style={{ marginBottom: "30px" }}
    >
      <Col md={8} xs={24} style={{ maxWidth: "93%" }}>
        <div className={styles.about__desc}>
          <div className={styles.boxs} />
          <p>
            بە بەشداری کردن لە پلاتفۆڕمی پەپوو سوودمەند دەبی لە سەدان پرسیاری
            تایبەت و وزاری
          </p>
        </div>
        <div className={styles.about__desc}>
          <div className={styles.boxs} />
          <p>
            بە ئاسانترین و کاراماترین ڕێگا ئاستی خۆت تاقیبکەرەوە بۆ بەدەستهێنانی
            ئەزموونی تاقیکردنەوەی وزاری و بەدەستهێنانی نمرەی بەرزتر.
          </p>
        </div>
      </Col>
      <Col md={5} xs={24} style={{ textAlign: "center" }}>
        <Image
          src={pepuscreen}
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
        <div className={styles.about__desc}>
          <div className={styles.boxs} />
          <p>
            خێرا لە کارکردن و ئاسان لە بەکارهێنان بە کەمترین کات زۆرترین پرسیار
            شیکار بکە لە پلاتفۆڕمی پەپوو
          </p>
        </div>
        <div className={styles.about__desc}>
          <div className={styles.boxs} />
          <p>ئێستا بەردەستە بۆ دابەزاندن و بەکارهێنان.</p>
        </div>
      </Col>
    </Row>
  );
};

export default About;
