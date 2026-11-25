/**
 * whatsappSetting.js — FR-FE-89 / SEC-41
 * Every WhatsApp CTA on the site must read ONE admin-managed setting.
 *  - Default/fallback: the official number +91 98561 12727 (SEC-41: the only official number).
 *  - Runtime value: GET {VITE_API_BASE_URL}/api/settings/contact (changed only by Super Admin, audit-logged).
 * Use waBase() / waUrl(message) / getWhatsappNumber() — never hard-code a wa.me number.
 * Never append ?text= to waBase(): wa.me's redirect turns emoji into "�". Use waUrl(message) / waSendUrl(message, phone).
 */
export const OFFICIAL_WHATSAPP_NUMBER = "919856112727";

const VALID = /^91[6-9]\d{9}$/;
let current = OFFICIAL_WHATSAPP_NUMBER;
const listeners = new Set();

export const getWhatsappNumber = () => current;
export const waBase = () => `https://wa.me/${current}`;

/* Drop unpaired UTF-16 surrogates (e.g. from slicing a string mid-emoji) so encodeURIComponent never throws. */
export const toWellFormedText = (s = "") =>
  String(s).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");

/**
 * Click-to-chat URL WITH a prefilled message.
 * Uses api.whatsapp.com/send directly, NOT wa.me: wa.me's 302 redirect re-encodes the text and
 * replaces every 4-byte UTF-8 character (all emoji, e.g. 👋 📍 📅) with U+FFFD "�" while 3-byte
 * characters like ₹ survive. Verified 25 Nov 2026:
 *   wa.me/91…?text=Hi%20%F0%9F%91%8B  ->  Location: api.whatsapp.com/send/?phone=91…&text=Hi+%EF%BF%BD
 * The text is encoded exactly once with encodeURIComponent. Pass phone "" for a share link (no recipient).
 */
export const waSendUrl = (message = "", phone = current) => {
  const params = [];
  if (phone) params.push(`phone=${String(phone).replace(/\D/g, "")}`);
  if (message) params.push(`text=${encodeURIComponent(toWellFormedText(message))}`);
  return `https://api.whatsapp.com/send${params.length ? `?${params.join("&")}` : ""}`;
};

/** Official-number chat link; with a message it goes through waSendUrl (emoji-safe), without one it stays wa.me. */
export const waUrl = (message = "") => (message ? waSendUrl(message) : waBase());
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
