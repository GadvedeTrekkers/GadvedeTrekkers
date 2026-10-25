/**
 * Catalog hubs for Gadvede Trekkers.
 * These slugs are the information architecture: city weekends, regions,
 * camping, backpacking, and seasonal departures.
 * Keep this list in sync with supabase/migrations/013_catalog_hubs.sql.
 */

export const CATALOG_HUBS = [
  {
    slug: "pune-weekend",
    name: "Pune Weekend",
    kind: "city",
    description: "Saturday and Sunday departures that start in Pune.",
    sortOrder: 10,
  },
  {
    slug: "mumbai-weekend",
    name: "Mumbai Weekend",
    kind: "city",
    description: "Weekend batches that leave from Mumbai.",
    sortOrder: 20,
  },
  {
    slug: "himachal",
    name: "Himachal",
    kind: "region",
    description: "Mountain trips across Himachal Pradesh.",
    sortOrder: 30,
  },
  {
    slug: "uttarakhand",
    name: "Uttarakhand",
    kind: "region",
    description: "River camps and Himalayan trails in Uttarakhand.",
    sortOrder: 40,
  },
  {
    slug: "rajasthan",
    name: "Rajasthan",
    kind: "region",
    description: "Desert nights and fort circuits in Rajasthan.",
    sortOrder: 50,
  },
  {
    slug: "kerala-south",
    name: "Kerala & South",
    kind: "region",
    description: "Forest stays and southern circuits, including Kerala.",
    sortOrder: 60,
  },
  {
    slug: "camping",
    name: "Camping",
    kind: "experience",
    description: "Lakeside, ridge, and forest camps run by Gadvede Trekkers.",
    sortOrder: 70,
  },
  {
    slug: "backpacking",
    name: "Backpacking",
    kind: "experience",
    description: "Multi-day trips with a shared stay and a light pack.",
    sortOrder: 80,
  },
  {
    slug: "seasonal-nye",
    name: "Seasonal & New Year",
    kind: "seasonal",
    description: "Festival weekends and New Year batches.",
    sortOrder: 90,
  },
];

const HUBS_BY_SLUG = new Map(CATALOG_HUBS.map((hub) => [hub.slug, hub]));

export function hubBySlug(slug) {
  return HUBS_BY_SLUG.get(String(slug || "")) || null;
}

export function isCatalogHubSlug(slug) {
  return HUBS_BY_SLUG.has(String(slug || ""));
}

const TOUR_REGION_HUB = {
  himachal: "himachal",
  uttarakhand: "uttarakhand",
  rajasthan: "rajasthan",
  kerala: "kerala-south",
  southindia: "kerala-south",
};

/**
 * Best-effort hub for listings saved before hub_slug existed.
 * An explicit hubSlug always wins over this guess.
 */
export function inferHubSlug(item = {}) {
  const explicit = item.hubSlug || item.hub_slug;
  if (explicit && isCatalogHubSlug(explicit)) return explicit;

  const type = String(item.productType || item.product_type || "").toLowerCase();
  const region = String(item.region || "").toLowerCase();
  const location = String(item.location || item.destination || "").toLowerCase();
  const seasonal = String(item.seasonalTag || item.category || "").toLowerCase();

  if (seasonal.includes("new year") || seasonal.includes("nye")) return "seasonal-nye";
  if (type === "camping") return "camping";
  if (TOUR_REGION_HUB[region]) return TOUR_REGION_HUB[region];
  if (region === "pune" || location.includes("pune") || location.includes("lonavala")) return "pune-weekend";
  if (region === "mumbai" || location.includes("mumbai")) return "mumbai-weekend";
  return "";
}

const MAX_PUBLIC_CARD_IMAGE_LENGTH = 4000;

/**
 * Cover art for a list card. Inline data URLs and other oversized values
 * are dropped so a trip list never carries multi-megabyte image blobs.
 * A normal https URL is returned unchanged.
 */
export function publicCardImage(value) {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url || url.length > MAX_PUBLIC_CARD_IMAGE_LENGTH) return "";
  if (/^data:/i.test(url)) return "";
  return url;
}

function publicCardMedia(item) {
  return (Array.isArray(item.media) ? item.media : [])
    .map((entry) => {
      const url = publicCardImage(typeof entry === "string" ? entry : entry?.url);
      if (!url) return null;
      return {
        url,
        alt: (typeof entry === "object" && entry?.alt) || item.name || item.title || "",
        kind: (typeof entry === "object" && entry?.kind) || "image",
      };
    })
    .filter(Boolean);
}

export function toPublicTripCard(item = {}) {
  const batches = parseBatches(item.trekDateBatches ?? item.tourDateBatches);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = batches
    .filter((batch) => batch.date && batch.date >= today && batch.status !== "CANCELLED" && batch.status !== "CLOSED")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const next = upcoming[0] || null;
  const media = publicCardMedia(item);
  const hubSlug = item.hubSlug || inferHubSlug(item);

  return {
    id: item.id || null,
    slug: item.slug || "",
    name: item.name || item.title || "Untitled trip",
    productType: item.productType || item.product_type || "trek",
    hubSlug,
    hubName: hubBySlug(hubSlug)?.name || item.category || "",
    destination: item.destination || item.location || "",
    category: item.category || hubBySlug(hubSlug)?.name || "",
    location: item.location || item.destination || "",
    duration: item.duration || "",
    difficulty: item.difficulty || "",
    price: item.price ?? null,
    image: publicCardImage(item.image) || media[0]?.url || "",
    media,
    nextBatch: next
      ? {
          date: next.date,
          endDate: next.endDate || "",
          label: next.label || "",
          status: next.status || "OPEN",
          departureCity: next.departureCity || "",
          price: next.price ?? null,
        }
      : null,
  };
}

function parseBatches(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
