/**
 * Public trip listing rules for Gadvede Trekkers (t129u: no hard-coded trip list).
 * Home, /treks and /trips show every catalogue product that Admin has switched ON (active), in the
 * admin's sort order. Nothing is added or removed in code: switch a trip OFF in Admin to hide it.
 * Duplicate URLs that permanently redirect elsewhere (shared/seoRedirects.js) are not listed twice.
 */
import { SEO_REDIRECTS } from "./seoRedirects.js";

/** Bundled photos used ONLY when a product row has no image of its own (files in /public/trips). */
export const PUBLIC_TRIP_PHOTOS = {
  "vasota-fort-trek": "/trips/vasota.jpg",
  "harishchandragad-trek": "/trips/harishchandragad.jpg",
  "kalsubai-peak-trek": "/trips/kalsubai.jpg",
  "new-year-beach-side-camping": "/trips/nye-beach.jpg",
};

const REDIRECTED_SLUGS = new Set(Object.keys(SEO_REDIRECTS).map((p) => p.split("/").pop()));

export function publicTripPhoto(slug) {
  return PUBLIC_TRIP_PHOTOS[String(slug || "")] || "";
}

export function publicTripImage(item = {}) {
  const raw = typeof item.image === "string" ? item.image.trim() : "";
  const usable = raw && !/^data:/i.test(raw) && raw.length <= 4000 ? raw : "";
  return usable || publicTripPhoto(item.slug);
}

export function tripDetailPath(item = {}) {
  const slug = item.slug || "";
  const type = String(item.productType || item.product_type || "").toLowerCase();
  if (type === "camping") return `/camping/${slug}`;
  if (type === "tour") return `/tours/${slug}`;
  return `/treks/${slug}`;
}

/** Admin sort order first (sortOrder, lower first), then name. */
export function sortPublicTrips(items = []) {
  return [...items].sort((a, b) =>
    (Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999)) || String(a.name || "").localeCompare(String(b.name || "")));
}

/** Active catalogue products, de-duplicated by slug, without redirected duplicate URLs, in admin order. */
export function selectPublicTrips(items = []) {
  const bySlug = new Map();
  for (const item of items) {
    if (!item || item.active === false) continue;
    const slug = item.slug || "";
    if (!slug || REDIRECTED_SLUGS.has(slug) || bySlug.has(slug)) continue;
    bySlug.set(slug, { ...item, slug, image: publicTripImage(item) });
  }
  return sortPublicTrips([...bySlug.values()]);
}
