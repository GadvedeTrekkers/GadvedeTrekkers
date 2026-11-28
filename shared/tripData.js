/**
 * Small, dependency-free helpers for reading product records from /api/products.
 * Shared by the SEO code (src/seo/publicSeo.js), the destination hubs and the sitemap script.
 */

/** JSON columns arrive either parsed or as strings. */
export function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Positive number from a number or a string like "₹1,399"; otherwise null. */
export function positiveNumber(value) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Today's date in India (YYYY-MM-DD), so a batch stays "upcoming" for the whole IST day. */
export const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

/** Bookable batches from today on (not cancelled/closed), earliest first, one per date. */
export function upcomingBatches(item) {
  const batches = parseJson(item?.trekDateBatches ?? item?.tourDateBatches, []);
  if (!Array.isArray(batches)) return [];
  const today = todayIST();
  const seen = new Set();
  return batches
    .filter((b) => b?.date && b.date >= today && b.status !== "CANCELLED" && b.status !== "CLOSED")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .filter((b) => (seen.has(b.date) ? false : seen.add(b.date)));
}
