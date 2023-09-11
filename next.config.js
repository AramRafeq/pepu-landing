const nextTranslate = require("next-translate-plugin");

/** @type {import('next').NextConfig} */
module.exports = nextTranslate({
  reactStrictMode: false,
  publicRuntimeConfig: {
    useCookie: true,
  },
});
