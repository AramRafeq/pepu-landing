/* eslint-disable @next/next/no-title-in-document-head */
import Script from 'next/script';
import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
class PepuDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }

    render() {
        return (
            <Html>
                <Head>
                    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                    <meta name="title" content="پەپوو | هاوڕێی خوێندنت" />
                    <meta name="keywords" content="poli12, poli 12, wizary, nishtmani 2022, pepu, papu, pepu.krd, papu.krd, خوێندن, پۆلی شەش, پۆلی ١٢, تاقیکردنەوەی ویزاری," />
                    <meta name="description" content="پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر. قوتابیان بە پارەیەکی کەم دەتوانن بۆ ماوەی ساڵیک پلاتفۆڕمەکە بەکاربێنن و لە خزمەتگوزارییەکانمان سوودمەند بن." />
                    <meta property="article:author" content="https://www.facebook.com/pepu.krd" />
                    <meta property="og:locale" content="en_EN" />
                    <meta property="og:site_name" content="پەپوو" />
                    <meta property="og:description" content="پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر. قوتابیان بە پارەیەکی کەم دەتوانن بۆ ماوەی ساڵیک پلاتفۆڕمەکە بەکاربێنن و لە خزمەتگوزارییەکانمان سوودمەند بن." />
                    <meta property="og:type" content="website" />
                    <meta property="og:title" content="پەپوو | هاوڕێی خوێندنت" />

                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content="http://onelink.to/hv2tk3" />
                    <meta property="twitter:title" content="پەپوو | هاوڕێی خوێندنت" />
                    <meta property="twitter:description" content="پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر." />
                    <meta property="twitter:image" content="https://static.pepu.krd/cover.png" />

                    <meta property="og:image" content="https://static.pepu.krd/cover.png" />
                    <Script async="" src="https://www.googletagmanager.com/gtag/js?id=G-KVSEKXR4NP"></Script>

                </Head>
                <body>
                    <div id="fb-root"></div>
                    <div id="fb-customer-chat" class="fb-customerchat"></div>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default PepuDocument;