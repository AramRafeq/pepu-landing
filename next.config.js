const nextTranslate = require("next-translate-plugin");

/** @type {import('next').NextConfig} */
module.exports = nextTranslate({
  reactStrictMode: false,
  publicRuntimeConfig: {
    useCookie: true,
  },

  async headers() {
    // Non-breaking hardening: HSTS, MIME-sniff off, clickjacking off, tight
    // referrer, and a permissive-but-present CSP (frame-ancestors/object/base
    // + https upgrade only — it deliberately does NOT restrict script/style/
    // connect, so GA, Firebase and the FB widget keep working).
    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests" },
    ];
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
      { source: "/(.*)", headers: securityHeaders },
    ];
  },
});
