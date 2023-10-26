import { Collapse } from "antd";
import React from "react";
import { Row, Col, Typography } from "antd";
import useTranslation from "next-translate/useTranslation";
const { Panel } = Collapse;

const getFaqData = (t) => {
  return [
    {
      title: t("faq.title_1"),
      content: t("faq.content_1"),
    },
    {
      title: t("faq.title_2"),
      content: t("faq.content_2"),
    },
    // {
    //   title: t("faq.title_3"),
    //   content:  t("faq.content_3"),
    // },
    // {
    //   title: t("faq.title_4"),
    //   content:  t("faq.content_4"),
    // },
    // {
    //   title: t("faq.title_5"),
    //   content:  t("faq.content_5"),
    // },
    // {
    //   title: t("faq.title_6"),
    //   content: (
    //     <>
    //       <p style={{ textDecoration: "underline" }}>
    //        {t("faq.title_6")}
    //       </p>
    //       <ul>
    //         <li>
    //         {t("faq.content_6.point1")}
    //         </li>
    //         <li>{t("faq.content_6.point2")}</li>
    //         <li>{t("faq.content_6.point3")}</li>
    //         <li>
    //         {t("faq.content_6.point4")}
    //         </li>
    //         <li>{t("faq.content_6.point5")}</li>
    //         <li>{t("faq.content_6.point6")}</li>
    //       </ul>
    //       <p style={{ textDecoration: "underline" }}>
    //       {t("faq.content_6.upgradeBenefits.title")}
    //       </p>
    //       <ul>
    //         <li> {t("faq.content_6.upgradeBenefits.point1")}</li>
    //         <li>{t("faq.content_6.upgradeBenefits.point2")}</li>
    //         <li>
    //         {t("faq.content_6.upgradeBenefits.point3")}
    //         </li>
    //         <li>{t("faq.content_6.upgradeBenefits.point4")}</li>
    //         <li>
    //         {t("faq.content_6.upgradeBenefits.point5")}
    //         </li>
    //       </ul>
    //     </>
    //   ),
    // },
    {
      title: t("faq.title_7"),
      content: t("faq.content_7"),
    },
    {
      title: t("faq.title_8"),
      content: t("faq.content_8"),
    },
    {
      title: t("faq.title_9"),
      content: t("faq.content_9"),
    },
    {
      title: t("faq.title_10"),
      content: (
        <>
          <iframe
            width="100%"
            height="415"
            src="https://www.youtube.com/embed/DIrCREsDaE4"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </>
      ),
    },
    {
      title: t("faq.title_11"),
      content: (
        <>
          <iframe
            width="100%"
            height="415"
            src="https://www.youtube.com/embed/PeEXAqyqazQ"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </>
      ),
    },
    // {
    //   title: t("faq.title_12"),
    //   content: (
    //     <>
    //       <iframe
    //         width="100%"
    //         height="415"
    //         src="https://www.youtube.com/embed/TNri2w_tFSg"
    //         title="YouTube video player"
    //         frameborder="0"
    //         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    //         allowfullscreen
    //       ></iframe>
    //     </>
    //   ),
    // },
  ];
}



const Faq = () => {
  const { t, lang } = useTranslation("general");
  let data = getFaqData(t);
  return <>
    <Typography className="sub-header">{t("faq.faq_title")}</Typography>
    <Typography className="faq-paragraph">
      {t("faq.paragraph")}
    </Typography>
    <Row align="middle" justify="center" style={{ padding: "10px" }}>
      <Col lg={18} md={18} sm={24} xs={24}>
        <Collapse
          bordered={false}
          style={{ background: "white", fontSize: "1.1rem" }}
          accordion
        >
          {data.map((item, index) => (
            <Panel key={index + 1} header={item.title}>
              <p>{item.content}</p>
            </Panel>
          ))}
        </Collapse>
      </Col>
    </Row>
  </>
};
export default Faq;
