import React from "react";
import styles from "../../styles/Main.module.css";
import Image from "next/image";
import herosection from "../assets/herosectionillustrations.png";
import appstore from "../assets/appstore.svg";
import googleplay from "../assets/gplay.svg";
import { Row, Col } from "antd";

const Main = () => {
  return (
    <Row
      style={{ minHeight: "100vh" }}
      align={"middle"}
      justify={"space-between"}
      gutter={8}
    >
      <Col span={12} xs={24} md={12}>
        <h1 className={styles.pepu__header}>پەپوو</h1>
        <p className={styles.pepu__desc}>
          پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە
          بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر.
        </p>
        <div className={styles.pepu__download}>
          <a
            href="https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812"
            className={styles.applestore}
          >
            <Image
              className={styles.applestore}
              src={appstore}
              alt="Download on Apple Store"
            />
          </a>
          <a href="https://play.google.com/store/apps/details?id=io.hesta.pepu">
            <Image
              className={styles.googleplay}
              src={googleplay}
              alt="Download on Google Play"
            />
          </a>
        </div>
      </Col>
      <Col span={10} xs={{ span: 24 }} md={{ span: 12 }}>
        <Image
          style={{ height: "75vh", maxWidth: "90vw", objectFit: "contain" }}
          src={herosection}
          alt="Pepu App Image"
        />
      </Col>
    </Row>
  );
};

export default Main;
