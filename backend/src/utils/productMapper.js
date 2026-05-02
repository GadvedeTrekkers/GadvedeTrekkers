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

  return {
    slug: item.slug || slugify(item.name || item.title || ""),
    name: item.name || item.title || "Untitled",
    product_type: productType,
    region: item.region || null,
    location: item.location || null,
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
    primary_image_url: item.image || gallery[0] || null,
    gallery: gallery.length ? gallery : [item.image].filter(Boolean),
    is_featured: Boolean(item.isFeatured),
    is_active: item.active !== false,
    sort_order: Number(item.sortOrder || 999),
  };
}

export function productItemFromRow(row) {
  const rawItem = row?.extra_content?.rawItem || {};
  return {
    ...rawItem,
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    price: row.base_price ?? rawItem.price ?? "",
    originalPrice: row.compare_at_price ?? rawItem.originalPrice ?? "",
    duration: row.duration_label ?? rawItem.duration ?? "",
    altitude: row.altitude_label ?? rawItem.altitude ?? "",
    difficulty: row.difficulty ?? rawItem.difficulty ?? "",
    enduranceLevel: row.endurance_level ?? rawItem.enduranceLevel ?? "",
    subtitle: row.short_description ?? rawItem.subtitle ?? "",
    description: row.description ?? rawItem.description ?? "",
    history: row.history ?? rawItem.history ?? "",
    mainAttractions: row.main_attractions ?? rawItem.mainAttractions ?? "",
    detailedHistory: row.detailed_history ?? rawItem.detailedHistory ?? "",
    image: row.primary_image_url ?? rawItem.image ?? "",
    imageGallery: JSON.stringify(row.gallery || []),
    active: row.is_active,
    sortOrder: row.sort_order,
    rating: row.rating ?? rawItem.rating ?? "",
    reviews: row.review_count ?? rawItem.reviews ?? "",
  };
}

export function buildBatchRows(productId, item) {
  return parseJson(item.trekDateBatches, [])
    .filter((entry) => entry?.date)
    .map((entry) => ({
      product_id: productId,
      batch_date: safeDate(entry.date),
      batch_label: entry.label || null,
      whatsapp_group_link: entry.whatsappGroupLink || null,
      status: "OPEN",
    }))
    .filter((entry) => entry.batch_date);
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
