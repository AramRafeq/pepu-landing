const nextTranslate = require("next-translate-plugin");

/** @type {import('next').NextConfig} */
module.exports = nextTranslate({
  reactStrictMode: false,
  publicRuntimeConfig: {
    useCookie: true,
  },

  async headers() {
    return [
      {
        // Apple refuses an association file that isn't served as JSON, and the
        // file has no extension so Next falls back to octet-stream — which is
        // why iOS Universal Links never verified.
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          // Both platforms re-fetch these on install; a stale cached copy is
          // the classic reason a fingerprint fix appears not to take.
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
});
