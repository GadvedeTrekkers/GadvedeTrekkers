/**
 * registrationOptions.js — one normaliser for the "Already paid? Register your payment" form.
 * Shared by the backend (GET /api/payment-registrations/events + server-side validation of a submission)
 * and the frontend, so the price, date and pickup choices a customer sees are exactly the ones the server accepts.
 *
 * Input: a public product item as returned by GET /api/products (productItemFromRow + batches + departurePlans).
 * Output: { slug, name, type, typeLabel, priceOptions[], dates[], pickupsByOption{} }.
 *
 * Price options, first source that has data wins:
 *   1. departurePlans  {"Pune": {price, pickupPoints}}   → one option per departure city
 *   2. pricingOptions  "Label|price|description" lines   → one option per line (tours)
 *   3. base price                                         → "Per person"
 * Pickup points per option: departurePlans[city].pickupPoints → legacy pickupPoints map → pickup_points strings
 * that start with the option label → otherwise every pickup listed on the trip. A "reach directly / other" choice
 * is always added so a customer is never blocked.
 * Dates: open batches from 3 days ago onwards (status not CANCELLED/CLOSED), filtered to the option's city when the
 * batch has one. "Other date" (OTHER_DATE) is always allowed; the customer then types the date.
 */

export const OTHER_DATE = "__other__";
export const OTHER_PICKUP = "I will reach directly / other (mention in notes)";
export const REGISTRATION_EVENT_TYPES = ["trek", "tour", "camping", "industrial"];
const TYPE_LABELS = { trek: "Trek", tour: "Tour", camping: "Camping", industrial: "Industrial visit" };

function parseJsonish(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function cleanText(value) {
  return String(value ?? "").replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim();
}

function positivePrice(value) {
  const n = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function pickupList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry === "string") return cleanText(entry);
      if (entry && typeof entry === "object") {
        const location = cleanText(entry.location || entry.name || "");
        const time = cleanText(entry.time || entry.pickup_time || "");
        if (!location) return "";
        return time ? `${location} (${time})` : location;
      }
      return "";
    })
    .filter(Boolean);
}

function sameKey(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function parsePricingOptionLines(value) {
  const lines = Array.isArray(value) ? value : String(value || "").split("\n");
  const seen = new Set();
  return lines
    .map((line) => (typeof line === "string" ? line : [line?.label, line?.price, line?.description].join("|")))
    .map((line) => line.split("|").map((part) => cleanText(part)))
    .map(([label, price, description]) => ({ label, price: positivePrice(price), description: description || "" }))
    .filter((opt) => opt.label && opt.price)
    .filter((opt) => (seen.has(opt.label.toLowerCase()) ? false : seen.add(opt.label.toLowerCase())));
}

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function istToday(now = new Date()) {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

function shiftDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function registrationOptionsFor(item = {}, { now = new Date() } = {}) {
  const plans = parseJsonish(item.departurePlans, {});
  const planEntries = plans && typeof plans === "object" && !Array.isArray(plans) ? Object.entries(plans) : [];
  const legacyPickups = parseJsonish(item.pickupPoints, {});
  const legacyMap = legacyPickups && typeof legacyPickups === "object" && !Array.isArray(legacyPickups) ? legacyPickups : {};
  const flatPickups = pickupList(Array.isArray(item.pickup_points) ? item.pickup_points : parseJsonish(item.pickup_points, []));

  let priceOptions = planEntries
    .map(([city, plan]) => ({ key: cleanText(city), label: `From ${cleanText(city)}`, price: positivePrice(plan?.price) }))
    .filter((opt) => opt.key && opt.price);
  if (!priceOptions.length) {
    priceOptions = parsePricingOptionLines(item.pricingOptions).map((opt) => ({
      key: opt.label,
      label: !opt.description || sameKey(opt.description, opt.label)
        ? opt.label
        : opt.description.toLowerCase().startsWith(opt.label.toLowerCase())
          ? opt.description
          : `${opt.label} — ${opt.description}`,
      price: opt.price,
    }));
  }
  if (!priceOptions.length) {
    const base = positivePrice(item.price ?? item.base_price);
    if (base) priceOptions = [{ key: "Per person", label: "Per person", price: base }];
  }

  const everyPickup = [
    ...planEntries.flatMap(([, plan]) => pickupList(plan?.pickupPoints)),
    ...Object.values(legacyMap).flatMap((list) => pickupList(list)),
    ...flatPickups,
  ];
  if (!everyPickup.length && cleanText(item.pickupPointLabel)) everyPickup.push(cleanText(item.pickupPointLabel));
  const uniq = (list) => [...new Set(list)];
  const pickupsByOption = {};
  priceOptions.forEach((opt) => {
    const planKey = planEntries.find(([city]) => sameKey(city, opt.key));
    const legacyKey = Object.keys(legacyMap).find((city) => sameKey(city, opt.key));
    let list = planKey ? pickupList(planKey[1]?.pickupPoints) : [];
    if (!list.length && legacyKey) list = pickupList(legacyMap[legacyKey]);
    if (!list.length && flatPickups.length) {
      const prefix = opt.key.toLowerCase();
      const matched = flatPickups.filter((p) => p.toLowerCase().startsWith(prefix));
      list = matched.length ? matched : [];
    }
    if (!list.length && !planKey && !legacyKey && !/self|direct|base village|to\s/i.test(opt.key)) list = everyPickup;
    pickupsByOption[opt.key] = uniq([...list, OTHER_PICKUP]);
  });

  const since = shiftDays(istToday(now), -3);
  const batches = parseJsonish(item.trekDateBatches ?? item.tourDateBatches, []);
  const seen = new Set();
  const dates = (Array.isArray(batches) ? batches : [])
    .filter((b) => b && /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) && b.date >= since)
    .filter((b) => !["CANCELLED", "CLOSED"].includes(String(b.status || "").toUpperCase()))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((b) => {
      const city = cleanText(b.departureCity || b.departure_city || "");
      const end = /^\d{4}-\d{2}-\d{2}$/.test(String(b.endDate || "")) && b.endDate !== b.date ? b.endDate : "";
      const value = city ? `${b.date}|${city}` : b.date;
      return { value, date: b.date, endDate: end, city, label: `${formatDay(b.date)}${end ? ` – ${formatDay(end)}` : ""}${city ? ` · ${city}` : ""}` };
    })
    .filter((d) => (seen.has(d.value) ? false : seen.add(d.value)));

  const type = String(item.productType || item.product_type || "").toLowerCase();
  return {
    slug: String(item.slug || ""),
    name: cleanText(item.name || item.title || ""),
    type,
    typeLabel: TYPE_LABELS[type] || "Event",
    priceOptions,
    dates,
    pickupsByOption,
  };
}

/** Dates that apply to one price option: batches with no city, or with the option's city. When none match, all. */
export function datesForOption(options, optionKey) {
  const all = options?.dates || [];
  const cities = new Set(all.map((d) => d.city.toLowerCase()).filter(Boolean));
  if (!optionKey || !cities.has(String(optionKey).toLowerCase())) return all;
  return all.filter((d) => !d.city || sameKey(d.city, optionKey));
}

export function isRegistrableEvent(item = {}) {
  const type = String(item.productType || item.product_type || "").toLowerCase();
  return REGISTRATION_EVENT_TYPES.includes(type) && item.active !== false && item.is_active !== false;
}

export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
/** "+91 98561-12727", "098561 12727" → "9856112727"; anything else → the digits as typed (fails the regex). */
export function normalizeIndianMobile(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export const PAYMENT_MODES = ["UPI", "NEFT", "IMPS", "Bank transfer", "Cash"];
export const GENDERS = ["Male", "Female", "Other"];
export const MAX_PARTICIPANTS = 20;
export const REGISTRATION_STATUSES = ["pending_verification", "verified", "rejected"];
