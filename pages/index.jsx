import { Layout, Row, Col, Typography } from "antd";
import { BsFacebook, BsInstagram } from "react-icons/bs";

import Faq from "../src/components/Faq";
import Style from "../styles/index.module.css";

import Head from "next/head";
export default function Home() {
  return (
    <>
      <Head>
        <title>پەپوو | هاوڕێی خوێندنت</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
      </Head>

      <Layout style={{ backgroundColor: "white" }}>
        <Layout.Content
          className="main-container"
        >
          {/* Main Section */}
          <Row
            style={{ minHeight: "100vh" }}
            align={"middle"}
            justify={"space-between"}
            gutter={8}
          >
            <Col span={12} xs={24} md={12}>
              <Row>
                <Col span={24}>
                  <h1 className={Style.pepu__header}>
                    پەپوو
                  </h1>
                </Col>
                <Col span={24}>
                  <Typography.Paragraph className={Style.pepu__desc}>
                    پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە
                    بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر.
                  </Typography.Paragraph>
                </Col>
                <Col span={24}>
                  <Row justify="center" align="middle" gutter={[10, 10]}>
                    <Col style={{ textAlign: 'center' }} xs={24} md={8} sm={12}>
                      <a
                        href="https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812"
                        className={Style.applestore}
                      >
                        <img
                          className={Style.applestore}
                          src="/assets/appstore.svg"
                          alt="Download on Apple Store"
                        />
                      </a>
                    </Col>
                    <Col style={{ textAlign: 'center' }} xs={24} md={8} sm={12}>
                      <a href="https://play.google.com/store/apps/details?id=io.hesta.pepu">
                        <img
                          className={Style.googleplay}
                          src="/assets/gplay.svg"
                          alt="Download on Google Play"
                        />
                      </a>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col span={10} xs={{ span: 24 }} md={{ span: 12 }} style={{ textAlign: 'center' }}>
              <img
                style={{ height: "75vh", maxWidth: "90vw", objectFit: "contain" }}
                src="/assets/herosectionillustrations.png"
                alt="Pepu App img"
              />
            </Col>
          </Row>
          {/* About Section */}
          <Row
            align={"middle"}
            justify={"space-between"}
            style={{ marginBottom: "30px" }}
          >
            <Col md={8} xs={24} style={{ maxWidth: "93%" }}>
              <div className={Style.about__desc}>
                <div className={Style.boxs} />
                <p>
                  سوودمەند دەبی لە هەزاران پرسیاری
                  تایبەت و وزاری
                </p>
              </div>
              <div className={Style.about__desc}>
                <div className={Style.boxs} />
                <p>
                  شەیرکردنی پرسیار لەگەڵ هاوڕێیانت
                </p>
              </div>
              <div className={Style.about__desc}>
                <div className={Style.boxs} />
                <p>
                  دووبارەکردنەوەی ئەو تاقیکردنەوە بۆ باشترکردنی ئاستت
                </p>
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
                <p>وەرگرتنی ئاگادارکردنەوەی بۆ ڕێنمایی خوێندن کە تایبەتە بە هەژمارەکەت</p>
              </div>
            </Col>
          </Row>
          {/* Faq Section */}
          <Faq />
          {/* Footer */}
          <Row justify={"center"} align="middle" className={Style.footer} >
            <Col span={24}>
              <img src="/assets/papu.svg" alt="Pepu Logo" className={Style.pepu__logo} />
            </Col>
            <Col span={24}>
              <span>کێشەی خوێندن چارەسەر بکە بە یەک کلیک</span>
            </Col>
            <Col span={24}>
              <div className={Style.downloads}>
                <a href="https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812">
                  <img src="/assets/appstore.svg" alt="Apple Store" />
                </a>
                <a href="https://play.google.com/store/apps/details?id=io.hesta.pepu">
                  <img src="assets/gplay.svg" alt="Google Play" />
                </a>
              </div>

              <div className={Style.copyright}>
                <div>
                  <a href="https://instagram.com/pepu.krd">
                    <BsInstagram />
                  </a>
                  <a href="https://facebook.com/pepu.krd">
                    <BsFacebook />
                  </a>
                </div>
                <span>هەموو مافەکان پارێزراوە بۆ پەپوو</span>
              </div>
            </Col>
          </Row>
        </Layout.Content>
      </Layout>
    </>
  );
}
