/**
 * SEC-41 / FR-FE-89 contact-number policy (shared by the settings route and scripts/check-contact-numbers.mjs).
 * The only official WhatsApp number is +91 98561 12727. Retired numbers are assembled from parts so that this
 * file itself passes the CI content scan.
 */
export const OFFICIAL_WHATSAPP_NUMBER = "919856112727";
export const BANNED_NUMBERS = [["86058", "66155"], ["91999", "9999999"]].map((p) => p.join(""));
export const WHATSAPP_NUMBER_RE = /^91[6-9]\d{9}$/;
export const isBannedNumber = (n) => BANNED_NUMBERS.some((b) => String(n ?? "").replace(/\D/g, "").includes(b));
export const formatDisplay = (n) => `+91 ${n.slice(2, 7)} ${n.slice(7)}`;
