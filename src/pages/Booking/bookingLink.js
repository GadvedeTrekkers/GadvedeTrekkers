/* Pure helpers for the /book landing page (FIX-08). No React, no network, node-testable. */

const slugify = (value = "") =>
  String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** `?trekId=`, `?slug=` or `?trekName=` → the catalogue slug to look up; `?ref=` → referral code. */
export function readBookParams(search = "") {
  const params = new URLSearchParams(search);
  const slug = slugify(params.get("trekId") || params.get("slug") || params.get("trekName") || "");
  const ref = String(params.get("ref") || "").trim().slice(0, 40);
  return { slug, ref };
}

/** Detail page for a catalogue product (where dates and batches can be picked). */
export function productDetailPath(product = {}, slug = "") {
  const type = String(product.productType || product.type || product.category || "").toLowerCase();
  const s = slug || product.slug || "";
  if (!s) return "/treks";
  if (type.includes("camp")) return `/camping/${s}`;
  if (type.includes("tour")) return `/tours/${s}`;
  if (type.includes("heritage")) return `/heritage/${s}`;
  if (type.includes("rental") || type.includes("gear")) return `/rentals/${s}`;
  if (type.includes("villa")) return "/villas";
  return `/treks/${s}`;
}

/** A date label that is still in the future, or "" (we never put a past date in a booking message). */
export function futureDateLabel(value, now = new Date()) {
  if (!value) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return parsed >= today ? String(value) : "";
}

/** The object `buildBookingWhatsAppUrl` expects, with past dates dropped and the referral code attached. */
export function bookingSubject(product = {}, { ref = "", now = new Date() } = {}) {
  const subject = { ...product, nextDate: futureDateLabel(product.nextDate || product.date, now), date: "" };
  if (ref) subject.referralCode = ref;
  return subject;
}
