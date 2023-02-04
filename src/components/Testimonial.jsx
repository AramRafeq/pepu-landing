import { Avatar, Collapse } from "antd";
import React from "react";
import { Row, Col, Typography, Card, Tooltip } from "antd";
import { AiOutlineUser } from "react-icons/ai";
const { Panel } = Collapse;

const data = [
  {
    profile: "",
    title: "sana A. osman",
    feedback:
      "Bajdi zor istfadam le krd pesh wzari bardawam prsyarakanm 7al dakrd way krd ka siqa baxom bkam u darajaki zor bashishm hina zor supas nmunatan zorbi ❤️👏🏻",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WCmstlPK023SzD6X_alcDecTbx9Wz1UmFzPsiBlUjQ",
    title: "Ahmad Qadir",
    feedback:
      "بەڕاستی ئاپێکی دەرەجە یەکە زۆر ئیسفادەم لێ بینیوە و بۆ کەس و کار و نزیکەکانم دامناون ، بژی پەپوو",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a/AEdFTp4LF6tz62bVVxGSZ3bq0GR8XSCLybEWq4PPiwzE=mo",
    title: "Darya Yuns",
    feedback:
      "باشترین باشترین ئەپە کە کورد داینابێ بە جدی زۆر بەسودە، هەر کات ئیمتیحانێکم هەبێ 25 پرسیار دیاری دەکەم و حلی دەکەم دوور لە پرسیاری سەقەتی ماموستایان وزاری و پرسیاری ڕێک و پێک شیکارەکەشی بەردەستە هەندەک جار کێشەی تێدەکەوت زۆربەی ئەپەکان وان سەبر سەبر باشتر دەکرێن و چاک دەکرێن بەس ئەوە ئاساییە دڵنیام لە داهاتوو زۆر سەرکەوتوو تر دەبن وە سەبارەت بەو نرخەی کە تازە دانراوە ئەوە کەمترین بڕە بەرامبەر ماندووبوونتان زۆر ئەپی تر هەن کە تەنها ڤیدیۆی تۆمارکراوە بۆ هەر وانەیەک 75 هەزارە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WCnO57YaesERR4_2s-dqu33-Ig2rru-x1yDBkMr9",
    title: "kura sha13",
    feedback: "دەست خۆش وەڵا شازی بەرنامەیە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WCmp0RjigVa2zdgrtlS1KR0A9H2iTT7PWTSp6oiv",
    title: "zayed kurdy0",
    feedback: "بـــــــــــــژیت پــــەپوو",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WClwkf8_JOjTODMSmJot1RZPY-7vaAJyr3iyHdMb",
    title: "hema hashim",
    feedback:
      "بەراستی ئاپێکی سەرنجڕاکێشە خۆم ئێستا پۆلی 12م و لە یەکەم تاقیکردنەوەمەوە ئەم ئاپەم کردۆتە هاوڕێی خوێندنم تەنیا تێبینیم لەسەری ئەوەیە پرسیاری وا لە تاقیکردنەوەکان دادەنێن کە پەیوەندی بەم بابەتەی تۆوە نییە کە هەڵتبژاردووە واتا دوای فلتەر کردنی بابەتەکانیش بابەتی زیادی تێدایە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a/AEdFTp5ZAvA9OKOZZ6DML8VXvKKtW1IhIvI-zvQvUiBp=mo",
    title: "seraj jassim",
    feedback: "دەستان خۆش کارێکی زۆر جوانە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WClfgHpjhOfFfxoG-BamG5LqHU0XOHuwoJ4kN2wd",
    title: "Baryz Bahyz",
    feedback:
      "Bashtrin barnama bo xwendkaran bataybati poli 12 sudeki zor zori haya pashiman nabnawa la download krdni dllniabn dubara spasiki zor bo drustkary am apka❤ bas xozga nabubaya ba para",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WCkEBdR6-Me7zFWLtqcXAn4VDqofZ5DXTqgLaSoy",
    title: "Seraj Jasm",
    feedback: "بەرنامەیێکی زۆر بەسوودە پەپوو زۆر سودملێ بینیوە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WClF8ndyY8918UjD9LOZ2VZaEPHEKN-aJCLdcu3VBw",
    title: "Rebin Barzani",
    feedback:
      "بەرنامەیێکی زۆر بەسوودە، بێکێشەیە و وەڵامەکانی تاوەکو ئێستا راستن. دەستان خۆشبێت خودا پاداشتی خێرتان بداتەوە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WClKQOmh7ViZzosEaJslpkKhxssKRhnAIk2R-Kn4dQ",
    title: "sahand asad",
    feedback: "I LIKE THIS APP",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WCmImEWkLjoiwxhh5i8GIB1Cnp6IYA0YzIImWvkPjw",
    title: "taylor 177",
    feedback: "باشترینە",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a/AEdFTp4RFWAy8POfkCSOaFvKqwd3ZFb1WJF_M98vKXUR=mo",
    title: "kd dragon01",
    feedback: "شایەنی پێنج زیاترن",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a/AEdFTp61-ETwaLedSCqIuTXLzzBDLNEi882gLZBYqT1Z=mo",
    title: "Mohammed Mohammed",
    feedback: "زۆۆۆۆۆۆر ناوازەیە دەستتان خۆش",
  },
  {
    profile:
      "https://lh3.googleusercontent.com/a-/AD5-WCkYngtb9O8l0YvNEeSn-JUfQ53MDZzIlnINQ42u",
    title: "Marden Muhammad",
    feedback:
      "زۆر ناوازایە بەس پرسیاری نیشتیمانی ئەوساڵیش زیادبکەن، هەڵەی بچوک هەیە بەڵام چارە دەکرێ ❤️❤️",
  },
  {
    profile: "",
    title: "bawan.bawan",
    feedback:
      "Hiwadarm agar bkret barnamaiak drust bkan taibat ba mamostakani poli 12 ba nrxeki zor gunjaw videoy wanakani mamostakani tia dabnen barasti zor naiab darachet. Dubara dastan xosh bo am barnama nawazaia.",
  },
  {
    profile: "",
    title: "Rrrorrrr ",
    feedback: "baraste dastan xosh be zor zor appeke bashu basuda ❤️ ",
  },
];

const Testimonial = () => (
  <>
    <Typography className="sub-header">بەکارهێنەرانی پەپوو</Typography>
    <Row
      gutter={[10, 10]}
      align="middle"
      justify="center"
      style={{ padding: "10px" }}
    >
      {data.map((d) => {
        return (
          <Col key={d.title} lg={6} md={6} sm={12} xs={24}>
            <Card style={{ background: "white" }}>
              <Card.Meta
                title={d.title}
                description={
                  <Typography.Paragraph ellipsis={{ rows: 3 }}>
                    <Tooltip title={d.feedback}>{d.feedback}</Tooltip>
                  </Typography.Paragraph>
                }
                avatar={
                  <Avatar
                    icon={<AiOutlineUser />}
                    src={d.profile ? d.profile : undefined}
                  />
                }
              />
            </Card>
          </Col>
        );
      })}
    </Row>
  </>
);
export default Testimonial;
