import { redeemHandoff } from "~/utils/pepuApi";

/**
 * The app's checkout ad can land on any pepu.krd page with a one-time sign-in
 * code. The inline script in _document has already lifted it out of the URL,
 * before any analytics could record it, into `window.__pepuHandoff`.
 *
 * On /subscribe the page drives the sign-in itself (it has to hold its spinner
 * until the right account is in). On every other page _app calls
 * signInFromHandoff() in the background, so Firebase already holds the app's
 * account (persisted in localStorage) by the time the student reaches
 * /subscribe — by a link or a fresh load. The code is single-use, so whichever
 * runs first owns it; the other waits on `handoff.signedIn`.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBMNis-ERCX9mgPK5zIlgXeC7WB6tJ5pGA",
  appId: "1:230091316087:web:99868c59b8e8e57cdf1f72",
  messagingSenderId: "230091316087",
  projectId: "pepu-platform",
  authDomain: "pepu-platform.firebaseapp.com",
  storageBucket: "pepu-platform.firebasestorage.app",
};

export const FIREBASE_SDK = [
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
];

/**
 * Redeemed at once rather than when Firebase is ready, and abandoned after
 * HANDOFF_WAIT_MS so a late answer can't switch accounts under a page that has
 * moved on.
 */
export const HANDOFF_WAIT_MS = 8000;

// { token: Promise<string|null>, deadline: number, used: boolean, signedIn?: Promise<void> }
let handoff = null;

export const startHandoff = () => {
  if (handoff || typeof window === "undefined" || !window.__pepuHandoff) return handoff;
  const code = window.__pepuHandoff;
  delete window.__pepuHandoff;
  handoff = {
    deadline: Date.now() + HANDOFF_WAIT_MS,
    used: false,
    token: redeemHandoff(code)
      .then((res) => (res.ok && res.data?.customToken) || null)
      .catch(() => null),
  };
  return handoff;
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false; // auth-compat needs app-compat first
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });

/** Loads the Firebase compat SDK (once) and initialises the app. */
export const ensureFirebase = async () => {
  if (!window.firebase?.auth) {
    await Promise.all(FIREBASE_SDK.map(loadScript));
  }
  if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
  return window.firebase;
};

/**
 * Background sign-in for pages other than /subscribe. Never throws; resolves
 * when the app's account is signed in or the attempt is given up.
 */
export const signInFromHandoff = () => {
  const pending = startHandoff();
  if (!pending || pending.used) return pending?.signedIn || Promise.resolve();
  pending.used = true;

  const attempt = (async () => {
    const [customToken, firebase] = await Promise.all([pending.token, ensureFirebase()]);
    if (!customToken || Date.now() > pending.deadline) return;
    await firebase.auth().signInWithCustomToken(customToken);
  })().catch(() => {});

  // capped: a stalled request must not hold /subscribe's spinner forever
  pending.signedIn = Promise.race([
    attempt,
    new Promise((resolve) => setTimeout(resolve, Math.max(0, pending.deadline - Date.now()))),
  ]);
  return pending.signedIn;
};
