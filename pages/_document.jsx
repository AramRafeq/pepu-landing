/* eslint-disable @next/next/no-title-in-document-head */
import Script from 'next/script';
import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
class PepuDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx);
        // next-translate builds one static page per locale and exposes which
        // one on ctx.locale. Reading the NEXT_LOCALE cookie here does not work:
        // these pages are statically generated, so there is no request.
        const locale = ctx?.locale || 'ku';
        return { ...initialProps, locale };
    }

    render() {
        // `lang` was hardcoded to Kurdish for every visitor, so an English or
        // Arabic page still announced itself as Kurdish to search engines and
        // screen readers. `dir` stays rtl for now: the stylesheet hardcodes
        // right-alignment in several places, so flipping it needs a visual
        // pass rather than a one-line change.
        const locale = this.props.locale || 'ku';
        const ogLocale = { ku: 'ckb_IQ', ar: 'ar_IQ', en: 'en_US' }[locale] || 'ckb_IQ';
        return (
            <Html lang={locale} dir="rtl">
                <Head>
                    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                    <meta name="title" content="پەپوو | هاوڕێی خوێندنت" />
                    <meta name="keywords" content="poli12, poli 12, wizary, nishtmani 2022, pepu, papu, pepu.krd, papu.krd, خوێندن, پۆلی شەش, پۆلی ١٢, تاقیکردنەوەی ویزاری," />
                    <meta name="description" content="پەپوو پلاتفۆڕمێکی پەروەردەیی نوێیە ئامانج تێیدا یارمەتیدانی قوتابیانە بۆ تێگەیشتنی باشتر و بەدەستهێنانی نمرەی بەرزتر. قوتابیان بە پارەیەکی کەم دەتوانن بۆ ماوەی ساڵیک پلاتفۆڕمەکە بەکاربێنن و لە خزمەتگوزارییەکانمان سوودمەند بن." />
                    <meta property="article:author" content="https://www.facebook.com/pepu.krd" />
                    {/* was "en_EN", which is not a valid locale code, on a
                        site whose default language is Kurdish. */}
                    <meta property="og:locale" content={ogLocale} />
                    <link rel="canonical" href="https://pepu.krd/" />
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
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default PepuDocument;