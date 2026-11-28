/**
 * tripFacts.js — the ONLY trip information the AI is given: real admin/DB data for one trip.
 * Built from the same public product item GET /api/products returns (productItemFromRow + batches + departure plans),
 * normalised by shared/registrationOptions.js so prices, dates and pickups match the payment-registration form.
 * Never includes WhatsApp group links, seat counts or internal notes.
 */
import { registrationOptionsFor, OTHER_PICKUP } from "../../../../shared/registrationOptions.js";
import { tripDetailPath } from "../../../../shared/publicTrips.js";
import { parseJson } from "../../../../shared/tripData.js";

export const AI_TRIP_TYPES = ["trek", "tour", "camping", "heritage", "industrial", "villa", "rental"];
const SITE = "https://www.gadvede.com";

const text = (v, max = 400) => String(v ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
function list(v, max = 12) {
  const arr = Array.isArray(v) ? v : parseJson(v, null);
  const items = Array.isArray(arr) ? arr : String(v ?? "").split(/\n|•/);
  return items.map((x) => text(typeof x === "object" ? (x?.title || x?.name || x?.text || "") : x, 160)).filter(Boolean).slice(0, max);
}
const LISTING_PATHS = { villa: "/villas", industrial: "/industrial-visits", heritage: "/heritage", rental: "/rentals" };
const pagePath = (item) => LISTING_PATHS[String(item.productType || "").toLowerCase()] || tripDetailPath(item);
const norm = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

/** Short trip list for the admin picker. */
export function tripChoices(items = []) {
  return items
    .filter((i) => i && i.active !== false && i.slug && AI_TRIP_TYPES.includes(String(i.productType || "").toLowerCase()))
    .map((i) => ({ slug: i.slug, name: text(i.name || i.title, 120), type: String(i.productType).toLowerCase() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Find the trip an enquiry is about: exact slug, then exact name, then the best word overlap ("Kalsubai trek" → Kalsubai Peak Trek). */
export function findTrip(items = [], { slug, name } = {}) {
  const active = items.filter((i) => i && i.active !== false && i.slug);
  if (slug) {
    const hit = active.find((i) => i.slug === String(slug).trim().toLowerCase());
    if (hit) return hit;
  }
  const want = norm(name);
  if (!want) return null;
  const exact = active.find((i) => norm(i.name) === want);
  if (exact) return exact;
  const stop = new Set(["trek", "tour", "camping", "camp", "the", "and", "with", "from", "to", "pune", "mumbai", "trip", "fort", "night", "package", "a", "of"]);
  const words = want.split(" ").filter((w) => w.length > 2 && !stop.has(w));
  if (!words.length) return null;
  let best = null;
  let bestScore = 0;
  for (const i of active) {
    const hay = new Set(norm(`${i.name} ${i.slug.replace(/-/g, " ")}`).split(" "));
    const score = words.filter((w) => hay.has(w)).length / words.length;
    if (score > bestScore) { best = i; bestScore = score; }
  }
  return bestScore >= 0.5 ? best : null;
}

/** Real facts for one trip. Missing data stays missing — the prompt tells the AI to say "we'll confirm". */
export function tripFactsFor(item, { now = new Date() } = {}) {
  if (!item) return null;
  const o = registrationOptionsFor(item, { now });
  const pickups = {};
  for (const [k, v] of Object.entries(o.pickupsByOption || {})) {
    const real = v.filter((p) => p !== OTHER_PICKUP);
    if (real.length) pickups[k] = real.slice(0, 8);
  }
  const isStay = ["villa", "rental"].includes(String(item.productType || "").toLowerCase());
  // the shared normaliser labels a single base price "Per person"; for a villa/rental that is the listing price
  const prices = o.priceOptions.map((p) => ({ label: isStay && p.label === "Per person" ? "Listing price (see the page for what it covers)" : p.label, price: p.price }));
  const dates = o.dates.slice(0, 10).map((d) => ({ date: d.date, endDate: d.endDate || "", city: d.city || "", label: d.label }));
  return {
    slug: item.slug,
    name: text(item.name || item.title, 140),
    type: String(item.productType || "").toLowerCase(),
    url: `${SITE}${pagePath(item)}`,
    location: text(item.location || item.destination || item.region, 120),
    duration: text(item.duration, 80),
    difficulty: text(item.difficulty, 40),
    altitude: text(item.altitude, 40),
    summary: text(item.shortDescription || item.subtitle || item.description || item.about, 500),
    prices,
    upcomingDates: dates,
    pickups,
    inclusions: list(item.includedItems ?? item.included),
    exclusions: list(item.excludedItems ?? item.notIncluded),
    thingsToCarry: list(item.thingsToCarry, 15),
    highlights: list(item.highlights, 8),
  };
}

/** Numbers + dates the guard checks drafts against. */
export const guardFacts = (facts) => ({
  prices: (facts?.prices || []).map((p) => p.price),
  dates: (facts?.upcomingDates || []).flatMap((d) => [d.date, d.endDate].filter(Boolean)),
});
