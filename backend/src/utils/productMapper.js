import { publicTripPhoto } from "../../../shared/publicTrips.js";

const PRODUCT_KEY_TO_TYPE = {
  gt_treks: "trek",
  gt_tours: "tour",
  gt_camping: "camping",
  gt_rentals: "rental",
  gt_heritage: "heritage",
  gt_iv: "industrial",
  gt_villas: "villa",
};

const PRODUCT_TYPE_TO_KEY = Object.fromEntries(
  Object.entries(PRODUCT_KEY_TO_TYPE).map(([key, value]) => [value, key])
);

export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function textList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean).join("\n");
  }
  if (value == null) return "";
  return String(value);
}

function firstText(...values) {
  for (const value of values) {
    const text = textList(value).trim();
    if (text) return text;
  }
  return "";
}

function asItemList(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (typeof entry === "string") return entry.trim() ? [entry.trim()] : [];
      if (entry && typeof entry === "object") {
        const text = entry.text || entry.title || entry.name || entry.item || "";
        return String(text).trim() ? [String(text).trim()] : [];
      }
      return [];
    });
  }
  if (typeof value === "string" && value.trim()) {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  return [];
}

function firstList(...values) {
  for (const value of values) {
    const list = asItemList(value);
    if (list.length) return list;
  }
  return [];
}

function publicImage(row, rawItem, mediaUrls) {
  const stored = row.primary_image_url ?? rawItem.image ?? mediaUrls[0] ?? "";
  if (typeof stored === "string") {
    const url = stored.trim();
    if (url && !/^data:/i.test(url) && url.length <= 4000) return url;
  }
  return publicTripPhoto(row.slug);
}

function safeNumber(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function safeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const fallback = new Date(`${value} GMT+0530`);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString().slice(0, 10);
}

function buildMedia(item) {
  if (Array.isArray(item.media) && item.media.length) {
    return item.media
      .filter((entry) => entry && (entry.url || typeof entry === "string"))
      .map((entry) =>
        typeof entry === "string"
          ? { url: entry, alt: item.name || item.title || "", kind: "image" }
          : {
              url: entry.url,
              alt: entry.alt || item.name || item.title || "",
              kind: entry.kind || "image",
            }
      );
  }

  const gallery = parseJson(item.imageGallery, []);
  const urls = [...(Array.isArray(gallery) ? gallery : []), item.image].filter(Boolean);
  return [...new Set(urls)].map((url) => ({
    url,
    alt: item.name || item.title || "",
    kind: "image",
  }));
}

export function productTypeFromStorageKey(storageKey) {
  return PRODUCT_KEY_TO_TYPE[storageKey] || null;
}

export function storageKeyFromProductType(productType) {
  return PRODUCT_TYPE_TO_KEY[productType] || null;
}

export function productRowFromItem(storageKey, item) {
  const productType = productTypeFromStorageKey(storageKey);
  if (!productType) return null;

  const imageGallery = parseJson(item.imageGallery, []);
  const gallery = Array.isArray(imageGallery) ? imageGallery.filter(Boolean) : [];

  const media = buildMedia(item);
  const hubSlug = item.hubSlug || item.hub_slug || null;

  return {
    slug: item.slug || slugify(item.name || item.title || ""),
    name: item.name || item.title || "Untitled",
    product_type: productType,
    region: item.region || null,
    location: item.location || null,
    hub_slug: hubSlug || null,
    destination: item.destination || item.location || null,
    category: item.category || null,
    base_village: item.baseVillage || null,
    difficulty: item.difficulty || null,
    endurance_level: item.enduranceLevel || null,
    duration_label: item.duration || null,
    altitude_label: item.altitude || null,
    short_description: item.subtitle || item.shortName || item.badge || null,
    description: item.description || item.overview || item.about || null,
    history: item.history || null,
    main_attractions: item.mainAttractions || null,
    detailed_history: item.detailedHistory || null,
    highlights: splitLines(item.highlights),
    places_to_visit: splitLines(item.placesToVisit),
    included_items: splitLines(item.included),
    excluded_items: splitLines(item.notIncluded),
    things_to_carry: splitLines(item.thingsToCarry),
    discount_codes: splitLines(item.discountCodes || item.offerCodes),
    extra_content: { rawItem: item },
    base_price: safeNumber(item.price ?? item.basePrice ?? item.entryFee ?? item.pricePerNight ?? item.pricePerPerson),
    compare_at_price: safeNumber(item.originalPrice),
    rating: safeNumber(item.rating),
    review_count: Number(item.reviews || 0) || 0,
    primary_image_url: item.image || gallery[0] || media[0]?.url || null,
    gallery: gallery.length ? gallery : media.map((entry) => entry.url).filter(Boolean),
    media,
    is_featured: Boolean(item.isFeatured),
    is_active: item.active !== false,
    sort_order: Number(item.sortOrder || 999),
  };
}

export function productItemFromRow(row) {
  const extra = row?.extra_content && typeof row.extra_content === "object" ? row.extra_content : {};
  const rawItem = extra.rawItem && typeof extra.rawItem === "object" ? extra.rawItem : {};
  const media = Array.isArray(row.media) && row.media.length ? row.media : rawItem.media || [];
  const mediaUrls = (Array.isArray(media) ? media : []).map((entry) => entry?.url).filter(Boolean);
  const gallery = Array.isArray(row.gallery) && row.gallery.length ? row.gallery : mediaUrls;
  const includedItems = firstList(row.included_items, rawItem.includedItems, rawItem.included);
  const excludedItems = firstList(row.excluded_items, rawItem.excludedItems, rawItem.notIncluded);
  const thingsToCarry = firstList(row.things_to_carry, rawItem.thingsToCarry);
  const highlights = firstList(row.highlights, rawItem.highlights);
  const itinerary = extra.itinerary ?? rawItem.itinerary ?? null;
  const shortDescription = firstText(row.short_description, rawItem.shortDescription, rawItem.subtitle);

  return {
    ...rawItem,
    id: row.id,
    slug: row.slug,
    name: row.name,
    productType: row.product_type,
    location: row.location,
    region: row.region ?? rawItem.region ?? "",
    hubSlug: row.hub_slug || rawItem.hubSlug || "",
    destination: row.destination || rawItem.destination || row.location || "",
    category: row.category || rawItem.category || "",
    media,
    price: row.base_price ?? rawItem.price ?? "",
    originalPrice: row.compare_at_price ?? rawItem.originalPrice ?? "",
    duration: row.duration_label ?? rawItem.duration ?? "",
    altitude: row.altitude_label ?? rawItem.altitude ?? "",
    difficulty: row.difficulty ?? rawItem.difficulty ?? "",
    enduranceLevel: row.endurance_level ?? rawItem.enduranceLevel ?? "",
    shortDescription,
    subtitle: shortDescription,
    description: firstText(row.description, rawItem.description, rawItem.about, rawItem.overview),
    about: firstText(rawItem.about, row.description, rawItem.description, rawItem.overview),
    overview: firstText(rawItem.overview, row.description, rawItem.description),
    includedItems,
    excludedItems,
    thingsToCarry,
    included: includedItems.join("\n"),
    notIncluded: excludedItems.join("\n"),
    highlights,
    extraContent: { itinerary },
    history: row.history ?? rawItem.history ?? "",
    mainAttractions: row.main_attractions ?? rawItem.mainAttractions ?? "",
    detailedHistory: row.detailed_history ?? rawItem.detailedHistory ?? "",
    image: publicImage(row, rawItem, mediaUrls),
    imageGallery: JSON.stringify(gallery),
    active: row.is_active,
    sortOrder: row.sort_order,
    rating: row.rating ?? rawItem.rating ?? "",
    reviews: row.review_count ?? rawItem.reviews ?? "",
  };
}

export function buildBatchRows(productId, item) {
  const source = item.trekDateBatches ?? item.tourDateBatches ?? "[]";
  return parseJson(source, [])
    .filter((entry) => entry?.date)
    .map((entry) => {
      const row = {
        product_id: productId,
        batch_date: safeDate(entry.date),
        end_date: safeDate(entry.endDate || entry.end_date),
        batch_label: entry.label || null,
        departure_city: entry.departureCity || entry.departure_city || null,
        whatsapp_group_link: entry.whatsappGroupLink || null,
        status: entry.status || "OPEN",
        price: safeNumber(entry.price),
      };
      const seats = Number(entry.seatsTotal || entry.seats_total);
      if (Number.isFinite(seats) && seats > 0) row.seats_total = seats;
      return row;
    })
    .filter((entry) => entry.batch_date);
}

export function batchItemFromRow(entry) {
  return {
    id: entry.id,
    date: entry.batch_date,
    endDate: entry.end_date || "",
    label: entry.batch_label || "",
    departureCity: entry.departure_city || "",
    whatsappGroupLink: entry.whatsapp_group_link || "",
    status: entry.status || "OPEN",
    price: entry.price ?? "",
    seatsTotal: entry.seats_total ?? "",
    seatsAvailable: entry.seats_available ?? "",
  };
}

export function buildDepartureRows(productId, item) {
  const departurePlans = parseJson(item.departurePlans, {});
  return Object.entries(departurePlans).map(([departureOrigin, plan]) => ({
    product_id: productId,
    departure_origin: departureOrigin,
    price: safeNumber(plan?.price) ?? 0,
    pickup_points: Array.isArray(plan?.pickupPoints) ? plan.pickupPoints : [],
    itinerary_text: plan?.itinerary || null,
  }));
}
