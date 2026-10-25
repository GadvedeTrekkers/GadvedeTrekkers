/**
 * Public trip allowlist for Gadvede Trekkers.
 * Home, /treks, and /trips render only these slugs, whether the row is
 * stored as a trek or as camping. Sample cards never substitute.
 */

export const PUBLIC_TRIP_SLUGS = [
  "vasota-fort-trek",
  "harishchandragad-trek",
  "kalsubai-peak-trek",
  "new-year-beach-side-camping",
];

export const PUBLIC_TRIP_PHOTOS = {
  "vasota-fort-trek": "/trips/vasota.jpg",
  "harishchandragad-trek": "/trips/harishchandragad.jpg",
  "kalsubai-peak-trek": "/trips/kalsubai.jpg",
  "new-year-beach-side-camping": "/trips/nye-beach.jpg",
};

const SLUG_SET = new Set(PUBLIC_TRIP_SLUGS);

export function isPublicTripSlug(slug) {
  return SLUG_SET.has(String(slug || ""));
}

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
  if (isPublicTripSlug(slug)) return `/treks/${slug}`;
  const type = String(item.productType || item.product_type || "").toLowerCase();
  if (type === "camping") return `/camping/${slug}`;
  if (type === "tour") return `/tours/${slug}`;
  return `/treks/${slug}`;
}

export function sortPublicTrips(items = []) {
  return [...items].sort(
    (a, b) => PUBLIC_TRIP_SLUGS.indexOf(a.slug) - PUBLIC_TRIP_SLUGS.indexOf(b.slug)
  );
}

/** Keep the four public trips, de-duplicated, in catalog order. */
export function selectPublicTrips(items = []) {
  const bySlug = new Map();
  for (const item of items) {
    if (!item || item.active === false) continue;
    const slug = item.slug || "";
    if (!isPublicTripSlug(slug) || bySlug.has(slug)) continue;
    bySlug.set(slug, { ...item, slug, image: publicTripImage(item) });
  }
  return sortPublicTrips([...bySlug.values()]);
}
