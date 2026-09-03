/**
 * Thin client for the Pepu API, used by the /subscribe checkout.
 *
 * Auth mirrors the mobile app: our API sends the OTP and returns a Firebase
 * custom token; Firebase (compat SDK, loaded from the CDN in subscribe.jsx)
 * exchanges it for the ID token every call carries as a Bearer.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_PEPU_API || "https://api.pepu.krd/v1";

async function request(path, { method = "GET", token, body, idempotencyKey } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* 200-with-no-body endpoints (fib/check) land here */
  }

  return { ok: res.ok, status: res.status, data };
}

export const requestOtp = (phoneNumber) =>
  request("/auth/phone/request", { method: "POST", body: { phoneNumber } });

export const verifyOtp = (phoneNumber, code) =>
  request("/auth/phone/verify", { method: "POST", body: { phoneNumber, code } });

/** 200 = existing account, 404 = never onboarded (offer registration). */
export const getMe = (token) => request("/users/me", { token });

export const getCities = (token) => request("/cities", { token });

/** Same contract as the app's onboarding screen. */
export const registerProfile = (token, profile) =>
  request("/users/me", { method: "PUT", token, body: profile });

/** Paginated: the body is {items, totalCount, offset}. */
export const getPlans = (token) => request("/subscription-plans?pageSize=100", { token });

/** The account's currently valid subscriptions. */
export const getMySubscriptions = (token) =>
  request("/subscriptions?state=valid&pageSize=100", { token });

/** Latin-izes Arabic-Indic (٠-٩) and Farsi (۰-۹) digits so validation and
 * the API see one numeral system, whatever keyboard the student uses. */
export const normalizeDigits = (value) =>
  (value || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/**
 * E.164 back to the local form people actually type: +9647504843513 → 07504843513.
 *
 * The OTP endpoints speak E.164, but the registration form validates the way
 * the app does — 11 digits starting 07 — so handing its own normalised number
 * straight back would fail that check on a number we just texted successfully.
 * Anything that isn't an Iraqi number comes back digits-only and unchanged.
 */
export const toLocalPhone = (value) => {
  const digits = normalizeDigits(value).replace(/\D/g, "");
  if (!digits) return "";

  const national = digits.startsWith("964") ? digits.slice(3) : digits;

  return national.startsWith("0") ? national : `0${national}`;
};

export const previewPromo = (token, planId, code) =>
  request(`/subscription-plans/${planId}/apply-promo/${encodeURIComponent(code)}`, { token });

export const createSubscription = (token, idempotencyKey, planId) =>
  request("/subscriptions", {
    method: "POST",
    token,
    idempotencyKey,
    body: { planId, type: "standard" },
  });

export const paySubscription = (token, idempotencyKey, subscriptionId, promoCode) =>
  request("/subscriptions/pay", {
    method: "PUT",
    token,
    idempotencyKey,
    body: {
      subscriptionId,
      paymentMethodId: "fib",
      promoCode: promoCode || null,
      note: "",
    },
  });

/** 200 = paid, 404 = not yet — the API asks FIB itself. */
export const checkFibPayment = (token, subscriptionId) =>
  request(`/fib/check/${subscriptionId}`, { method: "POST", token });

/** Video-marketplace programs (paginated {items}). */
export const getPrograms = (token) => request("/programs?pageSize=50", { token });

/** Free → {state:"completed"}; paid → {state:…, fib:{…}}. */
export const purchaseProgram = (token, programId) =>
  request(`/programs/${programId}/purchase`, { method: "POST", token });

/** 200 once FIB confirms and the entitlement is granted. */
export const checkProgramPayment = (token, programId) =>
  request(`/fib/check-program/${programId}`, { method: "POST", token });

export const cancelFibPayment = (token, subscriptionId) =>
  request(`/fib/cancel/${subscriptionId}`, { method: "POST", token });
