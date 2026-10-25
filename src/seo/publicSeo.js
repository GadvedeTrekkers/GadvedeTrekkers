/**
 * Public SEO for Gadvede Trekkers.
 * Home, /treks, /trips, and the four open trip pages share this copy.
 * The trek list has an on-page filter only — there is no /search URL — so
 * WebSite JSON-LD deliberately omits SearchAction.
 */

export const SITE_ORIGIN = "https://www.gadvede.com";
export const SITE_NAME = "Gadvede Trekkers";
export const PHONE_DISPLAY = "+91-9856112727";
export const INSTAGRAM = "https://www.instagram.com/gadvede_trekkers/";

export const HOME_TITLE = "Gadvede Trekkers | Maharashtra Treks from Pune & Mumbai";
export const HOME_DESCRIPTION =
  "Book Maharashtra treks from Pune and Mumbai with Gadvede Trekkers. Vasota, Harishchandragad, Kalsubai, and New Year beach camping from ₹1,400. WhatsApp booking.";

export const TREKS_TITLE = "Maharashtra Treks | Gadvede Trekkers";
export const TREKS_DESCRIPTION =
  "Weekend treks from Pune and Mumbai: Vasota Fort, Harishchandragad, and Kalsubai Peak, plus New Year beach camping. From ₹1,400. Book on WhatsApp.";

export const TRIPS_TITLE = "Open Trips | Gadvede Trekkers";
export const TRIPS_DESCRIPTION =
  "Four open Gadvede Trekkers trips from Pune and Mumbai: Vasota, Harishchandragad, Kalsubai, and New Year beach camping. From ₹1,400. Book on WhatsApp.";

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
    lowPrice: 1400,
    description:
      "Harishchandragad trek from Pachnai, Ahmednagar. 1 night, 2 days to Konkan Kada. From ₹1,400. Book on WhatsApp with Gadvede Trekkers.",
  },
  "kalsubai-peak-trek": {
    name: "Kalsubai Peak Trek",
    location: "Bari, Ahmednagar",
    duration: "1 night",
    lowPrice: 1400,
    description:
      "Kalsubai Peak trek from Bari, Ahmednagar — Maharashtra's highest peak. 1 night. From ₹1,400. Book on WhatsApp with Gadvede Trekkers.",
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

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

export function offerAvailability(trek) {
  const batches = parseJson(trek?.trekDateBatches, []);
  if (!Array.isArray(batches) || batches.length === 0) {
    return "https://schema.org/InStock";
  }
  const today = new Date().toISOString().slice(0, 10);
  const open = batches.some(
    (batch) =>
      batch?.date &&
      batch.date >= today &&
      batch.status !== "CANCELLED" &&
      batch.status !== "CLOSED"
  );
  return open ? "https://schema.org/InStock" : "https://schema.org/SoldOut";
}

/** Only when the product record already has both a rating and a review count. */
export function aggregateRating(trek) {
  const ratingValue = asNumber(trek?.rating);
  const reviewCount = asNumber(trek?.reviews ?? trek?.reviewCount ?? trek?.review_count);
  if (!(ratingValue > 0) || ratingValue > 5 || !(reviewCount > 0)) return null;
  return {
    "@type": "AggregateRating",
    ratingValue,
    reviewCount,
    bestRating: 5,
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
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  sameAs: [INSTAGRAM],
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
  const description =
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
  const canonical = absoluteUrl(`/treks/${slug}`);
  const rating = aggregateRating(trek);
  const trip = {
    "@type": "TouristTrip",
    name,
    description,
    image: image.url,
    url: canonical,
    touristType: "Trekking group",
    provider: {
      "@type": "TravelAgency",
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      telephone: PHONE_DISPLAY,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      ...(lowPrice != null ? { lowPrice } : {}),
      ...(highPrice != null && highPrice !== lowPrice ? { highPrice } : {}),
      availability: offerAvailability(trek),
      url: canonical,
    },
  };
  if (rating) trip.aggregateRating = rating;

  return {
    title: trekTitle(name),
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
      ],
    },
  };
}
