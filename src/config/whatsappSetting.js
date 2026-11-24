/**
 * whatsappSetting.js — FR-FE-89 / SEC-41
 * Every WhatsApp CTA on the site must read ONE admin-managed setting.
 *  - Default/fallback: the official number +91 98561 12727 (SEC-41: the only official number).
 *  - Runtime value: GET {VITE_API_BASE_URL}/api/settings/contact (changed only by Super Admin, audit-logged).
 * Use waBase() / waUrl(message) / getWhatsappNumber() — never hard-code a wa.me number.
 */
export const OFFICIAL_WHATSAPP_NUMBER = "919856112727";

const VALID = /^91[6-9]\d{9}$/;
let current = OFFICIAL_WHATSAPP_NUMBER;
const listeners = new Set();

export const getWhatsappNumber = () => current;
export const waBase = () => `https://wa.me/${current}`;
export const waUrl = (message = "") => `${waBase()}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
export const formatWhatsappDisplay = (n = current) => `+91 ${n.slice(2, 7)} ${n.slice(7)}`;

export function setWhatsappNumber(n) {
  if (typeof n !== "string" || !VALID.test(n) || n === current) return false;
  current = n;
  listeners.forEach((fn) => fn(n));
  return true;
}
export const subscribeWhatsappNumber = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Fetch the admin setting once at startup. Falls back silently to the official number. */
export async function loadWhatsappSetting({ apiBase = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, ""), fetchImpl = globalThis.fetch, timeoutMs = 4000 } = {}) {
  if (!apiBase || !fetchImpl) return current;
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const r = await fetchImpl(`${apiBase}/api/settings/contact`, { signal: ctrl?.signal });
    if (r.ok) setWhatsappNumber((await r.json())?.data?.whatsappNumber);
  } catch { /* keep default */ } finally { if (t) clearTimeout(t); }
  return current;
}
