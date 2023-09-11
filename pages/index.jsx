import { Layout, Row, Col, Typography } from "antd";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import { DownOutlined, UserOutlined, GlobalOutlined } from "@ant-design/icons";
import Faq from "../src/components/Faq";
import Testimonial from "../src/components/Testimonial";
import Features from "../src/components/Features";
import Style from "../styles/index.module.css";
import Head from "next/head";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useMemo } from "react";
import useWindowAvailable from "~/utils/useWindows";
import RightAngle from "~/icons/RightAngle";
import { LANGUAGES } from "~/utils/constants";
import { Button, Dropdown, message, Space, Tooltip, Menu } from "antd";
import { handleLanguageChange } from "~/utils/general";

export default function Home() {
  const { t, lang } = useTranslation("general");
  const isWindowAvailable = useWindowAvailable();

  const getCurrentLang = useMemo(() => {
    let currentLanguage;
    LANGUAGES.map((item) => {
      if (item.slug === lang) return (currentLanguage = item.name);
    });

    return t(currentLanguage);
  }, [lang, t]);

  const handleMenuClick = (e) => {
    handleLanguageChange(e.key);
  };

  const languageOptions = LANGUAGES.map(({ slug, name }) => {
    if (slug !== lang)
      return {
        key: `${slug}`,
        label: `${t(name)}`,
      };
  });
  const menuStyle = {
    fontSize: "16px",
  };

  const buttonStyle = {
    paddingInline: "18px",
    height: "45px",
    borderRadius: "1000px",
    alignItems: "center",
    justifyContent: "center",
  };

  const menuProps = {
    items: languageOptions,
    onClick: handleMenuClick,
  };

  return (
    <>
      <Head>
        <title>{t("meta_title")}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no"
        />
      </Head>

      <Layout style={{ backgroundColor: "white" }}>
        <Layout.Content className="main-container">
          {/* Header */}
          <Dropdown
            menu={menuProps}
            menuStyle={menuStyle}
            id="menu-dropdown"
            className="dropdown-style"
          >
            <Button style={buttonStyle}>
              <Space style={menuStyle}>
                {getCurrentLang}
                <GlobalOutlined />
              </Space>
            </Button>
          </Dropdown>

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
                  <h1 className={Style.pepu__header}>{t("header.title")}</h1>
                </Col>
                <Col span={24}>
                  <Typography.Paragraph className="pepu-desc">
                    {t("header.description")}
                  </Typography.Paragraph>
                </Col>
                <Col span={24}>
                  <Row justify="center" align="middle" gutter={[10, 10]}>
                    <Col style={{ textAlign: "center" }} xs={24} md={8} sm={12}>
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
                    <Col style={{ textAlign: "center" }} xs={24} md={8} sm={12}>
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
            <Col
              span={10}
              xs={{ span: 24 }}
              md={{ span: 12 }}
              style={{ textAlign: "center" }}
            >
              <img
                style={{
                  height: "75vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                }}
                src="/assets/papu.svg"
                alt="Pepu App img"
              />
            </Col>
          </Row>
          {/* Testimonial */}
          <Testimonial />
          {/* About Section */}
          <Features />
          {/* Faq Section */}
          <Faq />
          {/* Footer */}
          <Row justify={"center"} align="middle" className={Style.footer}>
            <Col span={24}>
              <img
                src="/assets/papu.svg"
                alt="Pepu Logo"
                className={Style.pepu__logo}
              />
            </Col>
            <Col span={24} className="footer-title">
              <span>{t("footer.title")}</span>
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
                <span>{t("footer.privacy")}</span>
              </div>
            </Col>
          </Row>
        </Layout.Content>
      </Layout>
    </>
  );
}

export const runtime = "edge";
