import { Collapse } from "antd";
import React from "react";
import { Row, Col, Typography } from "antd";
const { Panel } = Collapse;

const data = [
  {
    title: "پەپوو چییە؟",
    content:
      "پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر.",
  },
  {
    title: "پەپوو چییە؟",
    content:
      "پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر.",
  },
  {
    title: "پەپوو چییە؟",
    content:
      "پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر.",
  },
  {
    title: "پەپوو چییە؟",
    content:
      "پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر.",
  },
];

const Faq = () => (
  <>
    <div>
      <Typography className="faq-header">پرسیارە باوەکان</Typography>
      <Typography className="faq-paragraph">
        لێرە هەوڵدەدەین وەڵامی پرسیارە گشتیەکانتان بدەینەوە لە ئەگەری هەبوونی
        پرسیاری زیاتر پەیوەندیمان پێوە بکەن
      </Typography>
      <Row justify={"space-around"} style={{ padding: "10px" }}>
        <Col span={10} xs={24} md={10}>
          {data.map((item) => (
            <Collapse accordion>
              <Panel header={item.title} key="1">
                <p>{item.content}</p>
              </Panel>
            </Collapse>
          ))}
        </Col>
        <Col span={10} xs={24} md={10}>
          {data.map((item) => (
            <Collapse accordion>
              <Panel header={item.title} key="1">
                <p>{item.content}</p>
              </Panel>
            </Collapse>
          ))}
        </Col>
      </Row>
    </div>
  </>
);
export default Faq;
