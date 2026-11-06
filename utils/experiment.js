/**
 * Which checkout flow /subscribe shows.
 *
 *   wizard  — the default for everyone (Aram, 2026-11-06): one question per
 *             screen (grade, who pays), then the account, then a single
 *             "your plan" card that pays the way they said; "someone else
 *             pays" opens ParentSheet (hand the phone over, QR, or a link)
 *   classic — the previous /subscribe, kept intact so we can revert:
 *             set DEFAULT_CHECKOUT_FLOW back to "classic"
 *
 * `?flow=classic|wizard` forces a flow in that browser (it sticks), for
 * testing or links we hand out on purpose. The server still records the
 * first flow each signed-in student saw (experiment_assignments), so payments
 * before and after a switch can be told apart.
 */
import { assignExperiment } from "./pepuApi";

export const CHECKOUT_EXPERIMENT = "checkout-flow";
export const CHECKOUT_ARMS = ["classic", "wizard"];
const KEY = "pepu-checkout-flow";

/** Set before a student hands the phone to a parent, so /pay can offer the way back. */
export const HANDOVER_KEY = "pepu-handover";

const safeGet = () => {
  try { return window.localStorage.getItem(KEY); } catch { return null; }
};
const safeSet = (v) => {
  try { window.localStorage.setItem(KEY, v); } catch { /* private mode: arm lives for this page only */ }
};

/** The flow everyone gets unless a link forces another. Revert = "classic". */
export const DEFAULT_CHECKOUT_FLOW = "wizard";

/** This browser's flow: forced by ?flow= (and remembered), else the default. */
export function pickCheckoutFlow() {
  if (typeof window === "undefined") return DEFAULT_CHECKOUT_FLOW;
  const forced = new URLSearchParams(window.location.search).get("flow");
  if (CHECKOUT_ARMS.includes(forced)) {
    safeSet(forced);
    return forced;
  }
  const kept = safeGet();
  return CHECKOUT_ARMS.includes(kept) ? kept : DEFAULT_CHECKOUT_FLOW;
}

/** Marks analytics (GA event, Clarity tag) so recordings and reports split by arm. */
export function tagCheckoutFlow(flow) {
  if (typeof window === "undefined") return;
  if (typeof window.clarity === "function") window.clarity("set", "checkout_flow", flow);
  trackCheckout("checkout_flow", { flow });
}

/** A checkout milestone for GA; the server-side numbers are the source of truth. */
export function trackCheckout(event, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", event, { ...params, flow: params.flow ?? safeGet() ?? undefined });
  } catch { /* analytics never breaks the checkout */ }
}

/**
 * Records the arm for a signed-in student, once. Never throws, never blocks:
 * the checkout works the same if this fails.
 */
export async function recordCheckoutFlow(token, flow) {
  if (!token || !flow) return;
  try {
    await assignExperiment(token, CHECKOUT_EXPERIMENT, flow);
  } catch { /* measured a little less, that's all */ }
}
