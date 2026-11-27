/**
 * Public SEO for Gadvede Trekkers.
 * Home, /treks, /trips, and the four open trip pages share this copy.
 * The trek list has an on-page filter only — there is no /search URL — so
 * WebSite JSON-LD deliberately omits SearchAction.
 */

import { parseJson, upcomingBatches } from "../../shared/tripData.js";

export const SITE_ORIGIN = "https://www.gadvede.com";
export const SITE_NAME = "Gadvede Trekkers";
export const PHONE_DISPLAY = "+91-9856112727";
export const INSTAGRAM = "https://www.instagram.com/gadvede_trekkers/";
export const SOCIAL_PROFILES = [
  INSTAGRAM,
  "https://www.youtube.com/@gadvedetrekkers",
  "https://www.facebook.com/gadvedetrekkers",
];
export const ORG_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Pune",
  addressRegion: "Maharashtra",
  addressCountry: "IN",
};

export const HOME_TITLE = "Gadvede Trekkers | Maharashtra Treks from Pune & Mumbai";
export const HOME_DESCRIPTION =
  "Book Maharashtra treks from Pune and Mumbai with Gadvede Trekkers. Vasota, Harishchandragad, Kalsubai, and New Year beach camping from ₹1,400. WhatsApp booking.";

export const TREKS_TITLE = "Maharashtra Treks | Gadvede Trekkers";
export const TREKS_DESCRIPTION =
  "Weekend treks from Pune and Mumbai: Vasota Fort, Harishchandragad, and Kalsubai Peak, plus New Year beach camping. From ₹1,400. Book on WhatsApp.";

export const TRIPS_TITLE = "Open Trips | Gadvede Trekkers";
export const TRIPS_DESCRIPTION =
  "Four open Gadvede Trekkers trips from Pune and Mumbai: Vasota, Harishchandragad, Kalsubai, and New Year beach camping. From ₹1,400. Book on WhatsApp.";

export const TOURS_TITLE = "Group Tours from Pune & Mumbai | Gadvede Trekkers";
export const TOURS_DESCRIPTION =
  "Fixed-departure group tours from Pune and Mumbai: Rajasthan, Manali Kullu Kasol, Malvan Tarkarli scuba, Hampi Gokarna and Amritsar Dalhousie.";

export const CAMPING_TITLE = "Camping near Pune & Mumbai | Pawna, Alibaug | Gadvede";
export const CAMPING_DESCRIPTION =
  "Lake and beach camping near Pune and Mumbai: Pawna Lake from ₹1,099, Alibaug beach from ₹1,000, and New Year beach camping. BBQ, bonfire, meals.";

export const DEFAULT_OG = {
  path: "/trips/vasota.jpg",
  width: 1024,
  height: 516,
  alt: "Vasota Fort trek with Gadvede Trekkers",
};

/** Absolute Open Graph images for the four public trips. */
export const TRIP_OG = {
  "vasota-fort-trek": {
    path: "/trips/vasota.jpg",
    width: 1024,
    height: 516,
    alt: "Vasota Fort trek, Koyna Wildlife Sanctuary",
  },
  "harishchandragad-trek": {
    path: "/trips/harishchandragad.jpg",
    width: 1280,
    height: 960,
    alt: "Harishchandragad trek, Ahmednagar",
  },
  "kalsubai-peak-trek": {
    path: "/trips/kalsubai.jpg",
    width: 1280,
    height: 720,
    alt: "Kalsubai Peak trek, Bari, Ahmednagar",
  },
  "new-year-beach-side-camping": {
    path: "/trips/nye-beach.jpg",
    width: 1280,
    height: 851,
    alt: "New Year beach side camping on the Konkan coast",
  },
};

export const TRIP_SEO = {
  "vasota-fort-trek": {
    name: "Vasota Fort Trek",
    location: "Koyna Wildlife Sanctuary, Satara",
    duration: "2 days, 1 night",
    lowPrice: 1800,
    description:
      "Vasota Fort trek in Koyna Wildlife Sanctuary, Satara. 2 days with a Bamnoli camp and boat. From ₹1,800 (Pune). Book on WhatsApp.",
  },
  "harishchandragad-trek": {
    name: "Harishchandragad Trek",
    location: "Pachnai, Ahmednagar",
    duration: "1 night, 2 days",
    lowPrice: 1399,
  },
  "kalsubai-peak-trek": {
    name: "Kalsubai Peak Trek",
    location: "Bari, Ahmednagar",
    duration: "1 night",
    lowPrice: 1099,
  },
  "new-year-beach-side-camping": {
    name: "New Year Beach Side Camping",
    location: "Konkan coast",
    duration: "30 Dec night to 1 Jan",
    lowPrice: 2800,
    description:
      "New Year beach camping on the Konkan coast, 30 Dec night to 1 Jan. Tent from ₹2,800 (Pune). Book on WhatsApp with Gadvede Trekkers.",
  },
};

export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/treks",
  "/trips",
  "/treks/vasota-fort-trek",
  "/treks/harishchandragad-trek",
  "/treks/kalsubai-peak-trek",
  "/treks/new-year-beach-side-camping",
];

export function absoluteUrl(pathOrUrl = "/") {
  if (!pathOrUrl) return `${SITE_ORIGIN}/`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function ogForSlug(slug) {
  const image = TRIP_OG[slug] || DEFAULT_OG;
  return {
    url: absoluteUrl(image.path),
    width: image.width,
    height: image.height,
    alt: image.alt,
  };
}

export function trekTitle(name) {
  const suffix = ` | ${SITE_NAME}`;
  const full = `${name}${suffix}`;
  if (full.length <= 60) return full;
  return `${String(name).slice(0, 60 - suffix.length).trim()}${suffix}`;
}

function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

/** Departure-plan fees first. The card price is used only when no plan fee is set. */
export function offerPrices(trek, pricing) {
  const planPrices = [];
  const push = (value) => {
    const n = asNumber(value);
    if (n > 0) planPrices.push(n);
  };

  if (pricing && typeof pricing === "object") {
    for (const plan of Object.values(pricing)) push(plan?.price);
  }

  const plans = parseJson(trek?.departurePlans, null);
  if (plans && typeof plans === "object" && !Array.isArray(plans)) {
    for (const plan of Object.values(plans)) push(plan?.price);
  }

  const batches = parseJson(trek?.trekDateBatches, []);
  if (Array.isArray(batches)) {
    for (const batch of batches) push(batch?.price);
  }

  if (planPrices.length) return planPrices;
  push(trek?.price);
  return planPrices;
}

/** InStock when there are no dated batches (open on request) or at least one upcoming batch. */
export function offerAvailability(item) {
  const batches = parseJson(item?.trekDateBatches ?? item?.tourDateBatches, []);
  if (!Array.isArray(batches) || batches.length === 0) return "https://schema.org/InStock";
  return upcomingBatches(item).length ? "https://schema.org/InStock" : "https://schema.org/SoldOut";
}

/**
 * AggregateRating ONLY from real review records stored on the product
 * (reviewList / testimonials / userReviews: [{ rating, ... }]).
 * The bare `rating` / `reviews` numbers on a product are not review records, so they are never used.
 */
export function aggregateRating(item) {
  const lists = [item?.reviewList, item?.testimonials, item?.userReviews, item?.customerReviews];
  const ratings = [];
  for (const list of lists) {
    const arr = parseJson(list, []);
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      const v = asNumber(r?.rating ?? r?.stars);
      if (v > 0 && v <= 5) ratings.push(v);
    }
  }
  if (!ratings.length) return null;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return {
    "@type": "AggregateRating",
    ratingValue: Math.round(avg * 10) / 10,
    reviewCount: ratings.length,
    bestRating: 5,
    worstRating: 1,
  };
}

export const organizationNode = {
  "@type": ["Organization", "LocalBusiness", "TravelAgency"],
  "@id": `${SITE_ORIGIN}/#organization`,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/gadvedelogo.png`,
  image: absoluteUrl(DEFAULT_OG.path),
  description: HOME_DESCRIPTION,
  telephone: PHONE_DISPLAY,
  email: "info@gadvede.com",
  address: ORG_ADDRESS,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: PHONE_DISPLAY,
    contactType: "customer service",
    areaServed: "IN",
    availableLanguage: ["English", "Hindi", "Marathi"],
  },
  sameAs: SOCIAL_PROFILES,
  areaServed: {
    "@type": "State",
    name: "Maharashtra",
  },
  priceRange: "₹1400–₹3700",
};

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    organizationNode,
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    },
  ],
};

export function listJsonLd(pageUrl, name, items) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode,
      {
        "@type": "ItemList",
        name,
        url: pageUrl,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: absoluteUrl(item.path),
        })),
      },
    ],
  };
}

/** SEO copy stored on the product (products.extra_content.rawItem.seo, passed through by the API). */
export function productSeo(item) {
  const seo = item?.seo && typeof item.seo === "object" ? item.seo : {};
  const clean = (v) => (typeof v === "string" ? v.trim() : "");
  return {
    title: clean(seo.title),
    description: clean(seo.description),
    h1: clean(seo.h1),
    intro: clean(seo.intro),
    canonicalPath: clean(seo.canonicalPath),
  };
}

/** "Question|Answer" per line (rawItem.faq / faqs) -> [{ question, answer }]. */
export function parseFaq(value) {
  if (Array.isArray(value)) {
    return value
      .map((f) => ({ question: String(f?.question || f?.q || "").trim(), answer: String(f?.answer || f?.a || "").trim() }))
      .filter((f) => f.question && f.answer);
  }
  return String(value || "")
    .split("\n")
    .map((line) => {
      const i = line.indexOf("|");
      if (i < 0) return null;
      return { question: line.slice(0, i).trim(), answer: line.slice(i + 1).trim() };
    })
    .filter((f) => f && f.question && f.answer);
}

export function faqPageNode(faqs) {
  if (!faqs?.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

const PROVIDER = {
  "@type": "TravelAgency",
  "@id": `${SITE_ORIGIN}/#organization`,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  telephone: PHONE_DISPLAY,
  address: ORG_ADDRESS,
};

/** Up to 6 absolute image URLs from media, gallery and cover (first one = cover). */
function tripImages(item, fallbackUrl) {
  const urls = [];
  const add = (u) => {
    const v = typeof u === "string" ? u.trim() : "";
    if (!v || v.startsWith("data:")) return;
    const abs = absoluteUrl(v);
    if (!urls.includes(abs)) urls.push(abs);
  };
  add(item?.image);
  const media = parseJson(item?.media, []);
  if (Array.isArray(media)) media.forEach((m) => (!m?.kind || m.kind === "image") && add(m?.url));
  const gallery = parseJson(item?.imageGallery, []);
  if (Array.isArray(gallery)) gallery.forEach((g) => add(typeof g === "string" ? g : g?.url));
  if (!urls.length && fallbackUrl) add(fallbackUrl);
  return urls.slice(0, 6);
}

const stripUrls = (t) =>
  String(t || "")
    .replace(/\(\s*https?:\/\/[^)]*\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([;,.:])/g, "$1")
    .trim();

/**
 * Itinerary rows are "City|Day 1|09:00 PM|Text" or "Day 1|09:00 PM|Text" (one per line).
 * Uses the first departure city only, so the list reads as one journey.
 */
function tripItinerary(item) {
  let raw = item?.itinerary;
  if (!raw) {
    const plans = parseJson(item?.departurePlans, null);
    const first = plans && typeof plans === "object" ? Object.values(plans).find((p) => p?.itinerary) : null;
    raw = first?.itinerary || "";
  }
  if (Array.isArray(raw)) {
    raw = raw
      .map((d) => [d?.day || d?.title || "", d?.time || "", d?.description || d?.details || d?.activity || ""].join("|"))
      .join("\n");
  }
  if (typeof raw !== "string" || !raw.trim()) return null;
  let city = null;
  const steps = [];
  for (const line of raw.split("\n")) {
    const parts = line.split("|").map((x) => x.trim());
    if (parts.length < 2) continue;
    if (!/^day\b/i.test(parts[0]) && parts.length >= 3) {
      if (city === null) city = parts[0];
      if (parts[0] !== city) continue;
      parts.shift();
    }
    const [day, ...rest] = parts;
    const time = rest.length > 1 && /\d{1,2}[:.]\d{2}|\b(am|pm)\b/i.test(rest[0]) ? rest.shift() : "";
    const text = stripUrls(rest.join(" – "));
    if (!text) continue;
    steps.push({ name: [day, time].filter(Boolean).join(", "), description: text.slice(0, 300) });
    if (steps.length >= 25) break;
  }
  if (!steps.length) return null;
  return {
    "@type": "ItemList",
    numberOfItems: steps.length,
    itemListElement: steps.map((st, i) => ({ "@type": "ListItem", position: i + 1, name: st.name, description: st.description })),
  };
}

/**
 * TouristTrip + Product node. Offers come only from real prices in the data
 * (departure plans per city, batch prices, card price). Upcoming dates become
 * dated Offers (Google does not allow trips/packages to be marked up as Events).
 */
function tripNode({ item, name, description, canonical, lowPrice, highPrice, touristType, fallbackImage }) {
  const images = tripImages(item, fallbackImage);
  const plans = parseJson(item?.departurePlans, null);
  const availability = offerAvailability(item);
  const offers = [];
  if (plans && typeof plans === "object" && !Array.isArray(plans)) {
    for (const [city, plan] of Object.entries(plans)) {
      const price = asNumber(plan?.price);
      if (price > 0) {
        offers.push({
          "@type": "Offer",
          name: `${name} – ${city} departure`,
          price,
          priceCurrency: "INR",
          availability,
          url: canonical,
          seller: { "@id": `${SITE_ORIGIN}/#organization` },
        });
      }
    }
  }
  const upcoming = upcomingBatches(item).slice(0, 12);
  for (const b of upcoming) {
    const price = asNumber(b?.price) > 0 ? asNumber(b.price) : lowPrice;
    if (!(price > 0)) continue;
    const seatsLeft = asNumber(b?.seatsAvailable);
    offers.push({
      "@type": "Offer",
      name: `${name} – departure ${b.date}${b.departureCity ? ` (${b.departureCity})` : ""}`,
      price,
      priceCurrency: "INR",
      availability: seatsLeft === 0 && String(b.seatsAvailable).trim() !== "" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      validThrough: `${b.endDate || b.date}T23:59:59+05:30`,
      url: canonical,
      seller: { "@id": `${SITE_ORIGIN}/#organization` },
    });
  }
  const hasPrice = lowPrice != null && lowPrice > 0;
  const node = {
    "@type": hasPrice ? ["TouristTrip", "Product"] : "TouristTrip",
    "@id": `${canonical}#trip`,
    name,
    description,
    ...(images.length ? { image: images } : {}),
    url: canonical,
    touristType,
    provider: PROVIDER,
  };
  const itinerary = tripItinerary(item);
  if (itinerary) node.itinerary = itinerary;
  if (hasPrice) {
    node.sku = item?.slug || canonical.split("/").pop();
    node.brand = { "@type": "Brand", name: SITE_NAME };
    if (item?.category) node.category = String(item.category);
    node.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice,
      highPrice: highPrice != null && highPrice >= lowPrice ? highPrice : lowPrice,
      offerCount: Math.max(offers.length, 1),
      availability,
      url: canonical,
      ...(offers.length ? { offers } : {}),
    };
  }
  const rating = aggregateRating(item);
  if (rating) node.aggregateRating = rating;
  return node;
}

function seoTitle(seo, name) {
  return seo.title && seo.title.length <= 65 ? seo.title : trekTitle(name);
}

export function buildTrekPageSeo({ slug = "", trek = null, pricing = null } = {}) {
  const preset = TRIP_SEO[slug] || null;
  const name = trek?.name || preset?.name || "Trek";
  const location = trek?.location || preset?.location || "Maharashtra";
  const duration = trek?.duration || preset?.duration || "";
  const prices = offerPrices(
    trek?.price != null ? trek : { ...trek, price: preset?.lowPrice },
    pricing
  );
  if (preset?.lowPrice) prices.push(preset.lowPrice);
  const positive = prices.filter((n) => n > 0);
  const lowPrice = positive.length ? Math.min(...positive) : null;
  const highPrice = positive.length ? Math.max(...positive) : null;
  const seo = productSeo(trek);
  const description =
    seo.description ||
    preset?.description ||
    [
      `${name} with Gadvede Trekkers`,
      location,
      duration,
      lowPrice ? `from ₹${lowPrice.toLocaleString("en-IN")}` : "",
      "Book on WhatsApp.",
    ]
      .filter(Boolean)
      .join(". ")
      .replace(/\.\./g, ".");
  const image = ogForSlug(slug);
  const canonical = absoluteUrl(seo.canonicalPath || `/treks/${slug}`);
  const faq = faqPageNode(parseFaq(trek?.faq || trek?.faqs));
  const trip = tripNode({
    item: { ...(trek || {}), slug },
    name,
    description,
    canonical,
    lowPrice,
    highPrice,
    touristType: "Trekking group",
    fallbackImage: image.url,
  });

  return {
    title: seoTitle(seo, name),
    description,
    canonical,
    image: image.url,
    imageWidth: image.width,
    imageHeight: image.height,
    imageAlt: image.alt,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        organizationNode,
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "Treks", item: `${SITE_ORIGIN}/treks` },
            { "@type": "ListItem", position: 3, name, item: canonical },
          ],
        },
        trip,
        ...(faq ? [faq] : []),
      ],
    },
  };
}

/** Tour (/tours/:slug) and camping (/camping/:slug) detail pages. */
export function buildProductPageSeo({ section = "tours", slug = "", item = null } = {}) {
  const seo = productSeo(item);
  const sectionName = section === "camping" ? "Camping" : "Tours";
  const name = item?.name || slug.replace(/-/g, " ");
  const prices = [];
  const pushPrice = (v) => {
    const n = asNumber(v);
    if (n > 0) prices.push(n);
  };
  pushPrice(item?.price);
  String(item?.pricingOptions || "")
    .split("\n")
    .forEach((line) => pushPrice(line.split("|")[1]));
  const plans = parseJson(item?.departurePlans, null);
  if (plans && typeof plans === "object" && !Array.isArray(plans)) {
    Object.values(plans).forEach((p) => pushPrice(p?.price));
  }
  const lowPrice = prices.length ? Math.min(...prices) : null;
  const highPrice = prices.length ? Math.max(...prices) : null;
  const plain = (v) => String(v || "").replace(/\s+/g, " ").trim();
  const fallbackDesc = plain(item?.shortDescription || item?.subtitle || item?.description || "");
  const description =
    seo.description ||
    (fallbackDesc
      ? `${fallbackDesc.slice(0, 120).trim()}${lowPrice ? ` From ₹${lowPrice.toLocaleString("en-IN")}.` : ""}`
      : `${name} with Gadvede Trekkers. Book on WhatsApp.`);
  const canonical = absoluteUrl(seo.canonicalPath || `/${section}/${slug}`);
  const imageUrl = item?.image ? absoluteUrl(item.image) : absoluteUrl(DEFAULT_OG.path);
  const faq = faqPageNode(parseFaq(item?.faq || item?.faqs));
  const trip = tripNode({
    item: { ...(item || {}), slug },
    name,
    description,
    canonical,
    lowPrice,
    highPrice,
    touristType: section === "camping" ? "Camping group" : "Group tour",
    fallbackImage: imageUrl,
  });
  return {
    title: seoTitle(seo, name),
    description,
    canonical,
    image: imageUrl,
    imageWidth: undefined,
    imageHeight: undefined,
    imageAlt: name,
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        organizationNode,
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: sectionName, item: `${SITE_ORIGIN}/${section}` },
            { "@type": "ListItem", position: 3, name, item: canonical },
          ],
        },
        trip,
        ...(faq ? [faq] : []),
      ],
    },
  };
}
