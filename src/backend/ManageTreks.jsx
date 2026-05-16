import ManagePage from "./ManagePage";
import { uniqueTreks, slugifyTrekName } from "../data/treks";
import { replaceTrekDates } from "../data/trekDatesStorage";
import {
  harishchandragadOverview,
  harishchandragadHistory,
  harishchandragadHighlights,
  harishchandragadEventDetails,
  harishchandragadPricing,
  harishchandragadItineraries,
  harishchandragadPlacesToVisit,
  harishchandragadInclusions,
  harishchandragadExclusions,
  harishchandragadThingsToCarry,
  harishchandragadDiscountCodes,
} from "../data/harishchandragadDetails";
import {
  kalsubaiOverview,
  kalsubaiHistory,
  kalsubaiHighlights,
  kalsubaiEventDetails,
  kalsubaiPricing,
  kalsubaiItineraries,
} from "../data/kalsubaiDetails";

const joinLines = (items = []) => items.filter(Boolean).join("\n");
const formatHighlights = (items = []) => joinLines(items.map((item) => `${item.icon ? `${item.icon} ` : ""}${item.text}`.trim()));
const formatPlaces = (items = []) => joinLines(items.map((item) => [item.name, item.desc].filter(Boolean).join("|")));
const formatDiscountCodes = (items = []) => joinLines(items.map((item) => [item.code, item.desc].filter(Boolean).join("|")));
const formatItineraries = (routes = {}) =>
  Object.values(routes)
    .flatMap((route) =>
      (route.days || []).flatMap((day) =>
        (day.events || []).map((event) => [day.title, event.time, event.desc].filter(Boolean).join("|"))
      )
    )
    .join("\n");
const parseDisplayDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(`${value} GMT+0530`);
};
const formatNextDate = (value) => {
  const parsed = parseDisplayDate(value);
  return parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : value;
};
const routeKeyToCity = {
  mumbai: "Mumbai",
  pune: "Pune",
  kasara: "Kasara",
  withoutTransport: "Base Village",
  baseVillage: "Base Village",
};
const extractPickupPoints = (route = {}) =>
  ((route.days || [])[0]?.events || [])
    .filter((event) => /pickup|meet|meeting|assemble/i.test(event.desc || ""))
    .map((event) => ({
      time: event.time || "",
      location: String(event.desc || "")
        .replace(/^Pickup\s*[—-]\s*/i, "")
        .replace(/^Meet at\s*/i, "")
        .replace(/^Meeting at\s*/i, "")
        .replace(/^Assemble at\s*/i, "")
        .trim(),
    }));
const buildDeparturePlans = (pricing = {}, itineraries = {}) =>
  JSON.stringify(
    Object.entries(itineraries).reduce((acc, [key, route]) => {
      const city = routeKeyToCity[key] || key;
      acc[city] = {
        price: pricing[key]?.price ?? "",
        pickupPoints: extractPickupPoints(route),
        itinerary: (route.days || [])
          .flatMap((day) =>
            (day.events || []).map((event) => [day.title, event.time, event.desc].filter(Boolean).join("|"))
          )
          .join("\n"),
      };
      return acc;
    }, {})
  );
const COMMON_INCLUDED = [
  "Guide charges",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Tea",
  "Travel from Pune",
  "Travel from Mumbai",
  "Travel from Kasara",
  "Tent stay",
  "Forest entry fees",
  "First aid",
  "E-certificate",
  "WhatsApp group coordination",
];
const COMMON_NOT_INCLUDED = [
  "Personal expenses",
  "Travel till pickup point",
  "Mineral water",
  "Soft drinks",
  "Extra meals",
  "Medical expenses",
  "Emergency evacuation",
  "Anything not mentioned in inclusions",
];
const COMMON_THINGS_TO_CARRY = [
  "2 litres water",
  "Trekking shoes",
  "Rainwear",
  "Torch",
  "Extra clothes",
  "Cap",
  "Jacket",
  "Personal medicines",
  "Energy snacks",
  "Identity proof",
  "Haversack",
  "Sunscreen",
];
const DISCOUNT_OPTIONS = [
  "GD75|Save on group of 7 and more",
  "GD50|Save on group of 5 and more",
  "EARLY75|Early Booking Discount",
];

const RICH_SEED_BY_NAME = {
  "Harishchandragad Trek": {
    subtitle: harishchandragadOverview.subtitle,
    fortType: "Medieval Hill Fort",
    duration: harishchandragadEventDetails.duration,
    altitude: harishchandragadEventDetails.altitude,
    baseVillage: harishchandragadEventDetails.baseVillage,
    regionArea: harishchandragadEventDetails.region,
    climbTime: harishchandragadEventDetails.climbTime,
    distance: harishchandragadEventDetails.distance,
    drivePune: harishchandragadEventDetails.driveFromPune,
    wildlifeSanctuary: harishchandragadEventDetails.sanctuary,
    about: harishchandragadOverview.intro,
    history: harishchandragadOverview.history,
    mainAttractions: harishchandragadOverview.mainAttractions,
    detailedHistory: harishchandragadHistory,
    highlights: formatHighlights(harishchandragadHighlights),
    placesToVisit: formatPlaces(harishchandragadPlacesToVisit),
    itinerary: formatItineraries(harishchandragadItineraries),
    included: joinLines(harishchandragadInclusions),
    notIncluded: joinLines(harishchandragadExclusions),
    thingsToCarry: joinLines(harishchandragadThingsToCarry),
    discountCodes: formatDiscountCodes(harishchandragadDiscountCodes),
    departurePlans: buildDeparturePlans(harishchandragadPricing, harishchandragadItineraries),
  },
  "Kalsubai Trek": {
    subtitle: kalsubaiOverview.subtitle,
    fortType: "Highest Peak Trek",
    duration: kalsubaiEventDetails.duration,
    altitude: kalsubaiEventDetails.altitude,
    baseVillage: kalsubaiEventDetails.baseVillage,
    regionArea: kalsubaiEventDetails.region,
    climbTime: kalsubaiEventDetails.climbTime,
    distance: kalsubaiEventDetails.distance,
    wildlifeSanctuary: kalsubaiEventDetails.sanctuary,
    about: [kalsubaiOverview.intro, kalsubaiOverview.nightTrek, kalsubaiOverview.monsoon].filter(Boolean).join("\n\n"),
    history: kalsubaiHistory,
    detailedHistory: kalsubaiHistory,
    highlights: formatHighlights(kalsubaiHighlights),
    itinerary: formatItineraries(kalsubaiItineraries),
    departurePlans: buildDeparturePlans(kalsubaiPricing, kalsubaiItineraries),
  },
};

const SEED = uniqueTreks.map((t) => ({
  slug: t.slug || "",
  name: t.name,
  subtitle: "",
  fortType: "",
  region: t.location?.toLowerCase().includes("pune") ? "pune" : "mumbai",
  location: t.location,
  difficulty: t.difficulty,
  enduranceLevel: t.difficulty,
  duration: t.duration,
  altitude: t.altitude,
  price: t.price,
  originalPrice: t.originalPrice,
  nextDate: t.nextDate,
  rating: t.rating,
  reviews: t.reviews || "",
  image: t.image,
  imageGallery: JSON.stringify((t.gallery || [t.image, t.image, t.image]).filter(Boolean)),
  baseVillage: "",
  regionArea: "",
  climbTime: "",
  distance: "",
  drivePune: "",
  wildlifeSanctuary: "",
  pricingLabel: "",
  about: "",
  history: "",
  mainAttractions: "",
  detailedHistory: "",
  highlights: "",
  placesToVisit: "",
  itinerary: "",
  included: "",
  notIncluded: "",
  thingsToCarry: "",
  discountCodes: "",
  discountEnabled: false,
  trekDateBatches: "[]",
  departurePlans: "{}",
  pickupPoints: "{}",
  sortOrder: 999,
  active: true,
  ...(RICH_SEED_BY_NAME[t.name] || {}),
}));

const FIELDS = [
  /* ── Ordering ── */
  { key: "sortOrder", label: "Display Order", type: "number", col: 4, placeholder: "1 = first on page" },

  /* ── Basic Info ── */
  { key: "name",          label: "Trek Name",              required: true,  col: 8 },
  { key: "subtitle",      label: "Subtitle / Tagline",     col: 12, placeholder: "Medieval Hill Fort — 4650 Ft | Konkan Kada | Kedareshwar Cave" },
  { key: "fortType",      label: "Fort / Trek Type",       col: 4,  placeholder: "Ancient Hill Fort" },
  { key: "region",        label: "Region",                 required: true,  type: "select", options: ["mumbai", "pune"], col: 4 },
  { key: "location",      label: "Location",               required: true,  placeholder: "Pune, Maharashtra", col: 4 },
  { key: "difficulty",    label: "Difficulty",             required: true,  type: "select", options: ["Easy", "Medium", "Hard"], col: 4 },
  { key: "enduranceLevel",label: "Endurance Level",        type: "select",  options: ["Easy", "Medium", "Hard"], col: 4 },
  { key: "duration",      label: "Duration",               required: true,  placeholder: "1 Night 1 Day", col: 4 },
  { key: "altitude",      label: "Altitude",               placeholder: "1424m", col: 4 },
  { key: "price",         label: "Price (₹)",              required: true,  type: "number", placeholder: "1449", col: 4 },
  { key: "originalPrice", label: "Original Price (₹)",     type: "number",  placeholder: "1899", col: 4 },
  { key: "rating",        label: "Rating (1-5)",           type: "number",  placeholder: "4.9", col: 4 },
  { key: "reviews",       label: "Review Count",           type: "number",  placeholder: "190", col: 4 },
  { key: "imageGallery",  label: "Trek Banner Images",     type: "imageGallery", col: 12 },
  { key: "itineraryPdfUrl", label: "Itinerary PDF URL", placeholder: "/itineraries/trek-name.pdf or https://...", col: 12 },
  { key: "trekDateBatches", label: "Trek Dates & WhatsApp Group Links", type: "trekDates", col: 12 },

  /* ── Trek Details ── */
  { key: "baseVillage",       label: "Base Village",         placeholder: "Pachnai Village", col: 4 },
  { key: "regionArea",        label: "Region / Area",        placeholder: "Igatpuri, Ahmednagar, Junnar", col: 4 },
  { key: "climbTime",         label: "Climb Time (one way)", placeholder: "3 hours uphill", col: 4 },
  { key: "distance",          label: "Distance (one way)",   placeholder: "5 km from Pachnai", col: 4 },
  { key: "drivePune",         label: "Drive from Pune",      placeholder: "170 km one way", col: 4 },
  { key: "wildlifeSanctuary", label: "Wildlife Sanctuary",   placeholder: "Kalsubai Harishchandragad WS", col: 4 },

  /* ── Content ── */
  {
    key: "about", label: "About (Overview)", type: "textarea", col: 12,
    aiPrompt: (f) => `Write a detailed, SEO-friendly overview for ${f.name || "[Trek Name]"}, a ${f.difficulty || "Medium"} difficulty trek in ${f.location || "[Location]"}, Maharashtra, India.

Trek details:
- Duration: ${f.duration || "[Duration]"}
- Altitude: ${f.altitude || "[Altitude]"}
- Base Village: ${f.baseVillage || "[Base Village]"}
- Region: ${f.regionArea || f.location || "[Region]"}

Write 150–200 words covering:
1. What makes this trek special and unique
2. Landscape, terrain, and key features along the trail
3. Best season to visit
4. Who should do this trek (beginner/intermediate/expert)
5. An engaging opening hook

Reference style (Kalsubai Trek):
"Kalsubai Peak (1646 m / 5400 ft) is the highest peak in Maharashtra, nestled in the Sahyadri range inside the Kalsubai Harishchandragad Wildlife Sanctuary. Steel railings, chains, and ladders at difficult sections make this trek accessible for beginners and thrilling for veterans alike."

Output only the paragraph text, no headings or bullet points.`,
  },
  {
    key: "history", label: "History & Significance", type: "textarea", col: 12,
    aiPrompt: (f) => `Write the historical background and cultural significance of ${f.name || "[Trek Name]"} located in ${f.location || "[Location]"}, Maharashtra.

Trek type: ${f.fortType || "Hill Trek"}
Region: ${f.regionArea || f.location || "[Region]"}

Cover in 100–150 words:
1. Historical usage (fort, vantage point, trade route, etc.)
2. Mythological legends or local stories
3. Connection to Maratha history or tribal communities
4. Any temples, ruins, or heritage elements

Reference style (Kalsubai):
"Kalsubai is named after a local woman named Kalsu who is believed to have lived on the peak and the goddess Kalsubai who is worshipped at the small temple at the summit. Legends say Kalsu was a devoted woman whose spirit guards the mountain..."

Output only the paragraph, no headings.`,
  },
  {
    key: "mainAttractions", label: "Main Attractions", type: "textarea", col: 12,
    aiPrompt: (f) => `List and describe the main attractions of ${f.name || "[Trek Name]"} trek in ${f.location || "[Location]"}, Maharashtra.

Trek details: ${f.difficulty || "Medium"} difficulty, ${f.altitude || "[Altitude]"} altitude, ${f.duration || "[Duration]"}

Write 4–6 main attractions as short paragraphs (2–3 sentences each). Cover:
- Key viewpoints or summits
- Temples, caves, or heritage structures
- Wildlife, forests, or waterfalls
- Unique trail features (ladders, rocky patches, etc.)
- Sunrise or stargazing opportunities

Format each attraction as:
[Attraction Name]: [2–3 sentence description]

Output only the list, no extra commentary.`,
  },
  {
    key: "detailedHistory", label: "Detailed History", type: "textarea", col: 12,
    aiPrompt: (f) => `Write a detailed historical and cultural essay about ${f.name || "[Trek Name]"} in ${f.location || "[Location]"}, Maharashtra.

Fort/Trek type: ${f.fortType || "Hill Fort / Peak"}
Region: ${f.regionArea || f.location || "[Region]"}
Altitude: ${f.altitude || "[Altitude]"}

Write 250–350 words covering:
1. Pre-medieval and medieval history
2. Maratha empire connection (Shivaji Maharaj / Peshwas)
3. Architectural details if a fort (bastions, gates, water cisterns, temples)
4. Legends and folklore
5. Ecological and wildlife significance
6. Current condition and trekking heritage

Reference style: Detailed, evocative, Wikipedia-quality historical writing with a travel-friendly tone.

Output only the essay text, no headings.`,
  },

  /* ── Lists (one item per line) ── */
  {
    key: "highlights", label: "Trek Highlights (one per line, e.g. 🏔 4650 Ft High)", type: "textarea", col: 12,
    aiPrompt: (f) => `Generate exactly 8 trek highlight bullet points for ${f.name || "[Trek Name]"} — a ${f.difficulty || "Medium"} trek at ${f.altitude || "[Altitude]"} in ${f.location || "[Location]"}, Maharashtra.

Format each line as: [emoji] [Short highlight text]

Reference (Kalsubai Trek highlights):
🏔 Highest Peak in Maharashtra — 1646m / 5400 ft
🌟 Walk under the Milky Way on a Night Trek
🌅 Witness Breathtaking Sahyadri Sunrise
⛩️ Seek Blessings at the Kalsubai Temple
🦅 Inside Kalsubai Harishchandragad Wildlife Sanctuary
🪜 3 Iron Ladders — Safe for Beginners
🎖️ E-Certificates on Successful Completion
🍱 Veg Thali + Jain Food Available at Base

Include highlights about: altitude/distance, unique terrain features, viewpoints, temples/heritage, wildlife, difficulty level, food/certificates. Keep each line under 10 words.

Output only the 8 lines, one per line, no numbering.`,
  },
  {
    key: "placesToVisit", label: "Places to Visit (Name|Description, one per line)", type: "textarea", col: 12,
    aiPrompt: (f) => `List 5–6 places to visit at or near ${f.name || "[Trek Name]"} in ${f.location || "[Location]"}, Maharashtra.

Format each line exactly as: PlaceName|Brief description (1–2 sentences)

Example format:
Konkan Kada|A dramatic overhanging cliff offering a breathtaking view of the Konkan coast far below. Best visited early morning to catch the mist rolling in.
Kedareshwar Cave|An ancient Shiva temple inside a water-filled cave with a large Shivalinga at its centre. Considered one of the most sacred spots on this trail.

Include:
- Summit/peak viewpoints
- Temples or caves
- Water bodies (lake, waterfall, dam)
- Nearby forts or heritage spots
- Unique geological formations

Output only the lines in the specified format, nothing else.`,
  },
  {
    key: "included",
    label: "What's Included",
    type: "checklistTextarea",
    col: 6,
    options: COMMON_INCLUDED,
    placeholder: "Add custom included items, one per line",
  },
  {
    key: "notIncluded",
    label: "Not Included",
    type: "checklistTextarea",
    col: 6,
    options: COMMON_NOT_INCLUDED,
    placeholder: "Add custom excluded items, one per line",
  },
  {
    key: "thingsToCarry",
    label: "Things to Carry",
    type: "checklistTextarea",
    col: 12,
    options: COMMON_THINGS_TO_CARRY,
    placeholder: "Add custom carry items, one per line",
  },
  {
    key: "discountCodes",
    label: "Discount Coupons",
    type: "discountCodes",
    col: 12,
    options: DISCOUNT_OPTIONS,
    toggleKey: "discountEnabled",
  },
  {
    key: "departurePlans",
    label: "Departure Cities, Pricing, Pickup Points & Itinerary",
    type: "departurePlans",
    col: 12,
    cityOptions: ["Mumbai", "Pune", "Kasara", "Base Village"],
    helpText: `HOW TO ADD ITINERARY — Click "+ Add City" for each departure point (e.g. Mumbai, Pune, Kasara).\n\nFor each city tab:\n• Price: Enter per-person price from that city (e.g. 1449)\n• Pickup Points: Add each stop with time and location (click "+ Add Pickup Point")\n  Example: 10:30 PM → Kasara Railway Station, Platform 1\n• Itinerary: One event per line in format → Day Title|Time|Description\n  Example:\n  Day 01|10:30 PM|Depart from Kasara Station by private vehicle\n  Day 01|11:45 PM|Arrive at Base Village — settle in and rest\n  Day 02|04:30 AM|Wake up call — light snacks served\n  Day 02|05:00 AM|Begin trek to Kalsubai Peak\n  Day 02|08:00 AM|Reach summit — sunrise views and temple darshan\n  Day 02|10:30 AM|Descend to base village\n  Day 02|12:30 PM|Lunch at base — depart for home`,
  },
];

const DEFAULT = {
  sortOrder: "", name: "", subtitle: "", fortType: "", region: "mumbai", location: "",
  difficulty: "Medium", enduranceLevel: "Medium", duration: "", altitude: "",
  price: "", originalPrice: "", nextDate: "", rating: "", reviews: "", image: "", imageGallery: "[]",
  baseVillage: "", regionArea: "", climbTime: "", distance: "", drivePune: "",
  wildlifeSanctuary: "", pricingLabel: "",
  about: "", history: "", mainAttractions: "", detailedHistory: "",
  highlights: "", placesToVisit: "", itinerary: "",
  included: "", notIncluded: "", thingsToCarry: "", discountCodes: "", discountEnabled: false,
  trekDateBatches: "[]",
  departurePlans: "{}",
  pickupPoints: "{}",
};

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function buildLegacyPickupPoints(departurePlans) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(departurePlans).map(([city, plan]) => [city, plan.pickupPoints || []])
    )
  );
}

function buildLegacyItinerary(departurePlans) {
  return Object.entries(departurePlans)
    .flatMap(([city, plan]) =>
      String(plan.itinerary || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `${city}|${line}`)
    )
    .join("\n");
}

function buildPricingLabel(departurePlans) {
  return Object.entries(departurePlans)
    .filter(([, plan]) => plan.price !== "" && plan.price != null)
    .map(([city, plan]) => `${city}: ₹${plan.price}`)
    .join(" | ");
}

function prepareTrekForm(form) {
  const trekDateBatches = parseJson(form.trekDateBatches, [])
    .filter((entry) => entry?.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const departurePlans = parseJson(form.departurePlans, {});
  const imageGallery = parseJson(form.imageGallery, []).filter(Boolean);
  return {
    ...form,
    trekDateBatches: JSON.stringify(trekDateBatches),
    departurePlans: JSON.stringify(departurePlans),
    imageGallery: JSON.stringify(imageGallery),
    image: imageGallery[0] || form.image || "",
    nextDate: trekDateBatches[0]?.date ? formatNextDate(trekDateBatches[0].date) : "",
    pickupPoints: buildLegacyPickupPoints(departurePlans),
    itinerary: buildLegacyItinerary(departurePlans) || form.itinerary,
    pricingLabel: buildPricingLabel(departurePlans),
  };
}

function handleTrekPersist(item) {
  const slug = slugifyTrekName(item.name || item.slug || "");
  const trekDateBatches = parseJson(item.trekDateBatches, []);
  replaceTrekDates(slug, item.name, trekDateBatches);
}

function handlePreview(form) {
  const prepared = prepareTrekForm(form);
  const slug = slugifyTrekName(prepared.name || "trek-preview");
  sessionStorage.setItem("gt_trek_preview", JSON.stringify(prepared));
  window.open(`/treks/${slug}?preview=1`, "_blank");
}

export default function ManageTreks() {
  return (
    <ManagePage
      title="Treks"
      icon="🥾"
      storageKey="gt_treks"
      fields={FIELDS}
      defaultForm={DEFAULT}
      seedData={SEED}
      transformForm={prepareTrekForm}
      afterSubmit={handleTrekPersist}
      onPreview={handlePreview}
    />
  );
}
