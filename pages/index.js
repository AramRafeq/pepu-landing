import Main from "../src/components/Main";
import About from "../src/components/About";
import Footer from "../src/components/Footer";
import Faq from "../src/components/Faq";
import ChatMessenger from "../src/components/ChatMessenger";
import { ConfigProvider } from "antd";
import { Layout } from "antd";

const { Content } = Layout;

export default function Home() {
  return (
    <ConfigProvider direction="rtl">
      <Layout break style={{ backgroundColor: "white" }}>
        <Content
          style={{
            padding: "2rem",
          }}
        >
          <Main />
        </Content>

        <ChatMessenger />
        <About />
        <Faq />
        <Layout.Footer style={{ backgroundColor: "white" }}>
          <Footer />
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  );
}
