import { ConfigProvider } from "antd";
import "antd/dist/antd.css";
import "../styles/globals.css";

function App({ Component, pageProps }) {
  return (
    <ConfigProvider direction="rtl">

      <Component {...pageProps} />
    </ConfigProvider>
  );

}

export default App;
