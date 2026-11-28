import { campingList } from "./campingData";
import { getAdminItems, saveAdminItems } from "./adminStorage";

const STORAGE_KEY = "gt_camping";

export const CAMPING_INCLUDED_OPTIONS = [
  "Welcome drinks",
  "Evening snacks",
  "BBQ (limited)",
  "Dinner (Veg/Non-Veg/Jain)",
  "Breakfast",
  "Tent stay",
  "Blanket and pillows",
  "Bonfire",
  "Live music",
  "Movie screening",
  "Fun games",
  "Washroom access",
  "Parking",
  "Coordinator support",
];

export const CAMPING_EXCLUDED_OPTIONS = [
  "Transportation",
  "Mineral water / soft drinks",
  "Extra meals",
  "Water sports",
  "Personal expenses",
  "Medical / emergency expenses",
  "Anything not mentioned in inclusions",
];

export const CAMPING_CARRY_OPTIONS = [
  "Valid photo ID",
  "Cap / Hat",
  "Personal medicines",
  "Sunscreen",
  "Torch",
  "Power bank",
  "Water bottle",
  "Extra clothes",
  "Towel",
  "Jacket / warm layer",
  "Mosquito repellent",
  "Toiletries",
];

export {
  getPrimaryCampingImage,
  parseFaqItems,
  parseItineraryItems,
  parseJsonValue,
  parseLineItems,
  parseOfferItems,
  parsePipeItems,
} from "../utils/listingParsers";

const GENERIC_POLICY = [
  "50% refund if notified 10 days before the event date.",
  "No refund for cancellations made less than 6 days before the event date.",
  "No show — No refund.",
  "Tickets can be transferred to another person only with prior confirmation.",
];

const GENERIC_RULES = [
  "Carry a valid government ID proof.",
  "Follow coordinator instructions at all times.",
  "Do not litter or damage the campsite property.",
  "Alcohol, smoking, and nuisance behavior are strictly prohibited.",
  "Take care of your personal belongings.",
];

export const CAMPING_DETAIL_SEED_BY_SLUG = {
  "alibaug-camping": {
    name: "Alibaug Camping | Music | Barbecue | Bonfire",
    shortName: "Alibaug Beach Camping",
    location: "Alibaug near Nagaon Beach, Maharashtra",
    type: "Beach",
    duration: "Overnight",
    price: 400,
    originalPrice: 699,
    badge: "Best Budget",
    availability: "Available for every Saturday-Sunday",
    nextDates: JSON.stringify(["25 Mar, 4:00 PM", "26 Mar, 4:00 PM", "27 Mar, 4:00 PM"]),
    imageGallery: JSON.stringify([
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    ]),
    overview:
      "Famous among beach lovers, Alibaug is a gorgeous beach town with a peaceful break from the hustle and bustle of city life. Sparkling beaches, curved coastal roads, fresh seafood, and beautiful sunsets make it one of the most loved quick escapes from Mumbai and Pune. Nagaon Beach is especially popular for beach camping because it offers a mix of open shoreline, water sports, and a lively campsite atmosphere.\n\nThis campsite combines bonfire nights, barbecue, sea breeze, and music with the comfort of organised tents and meal support. It works well for friends, couples, and families looking for a low-stress overnight beach experience.",
    howToReach:
      "From Mumbai: Take a ferry from Gateway of India to Mandwa Jetty, then continue to Alibaug by bus or rickshaw.\nFrom Pune: Reach Alibaug by bus or private vehicle and take a local ride to the campsite.\nPrivate Vehicle: GPS location can be shared before departure for direct navigation.",
    eventDetails:
      "Camping Location|Alibaug near Nagaon Beach\nWashroom Access|Western toilets and shower facility available\nLive Music|Available on selected nights\nMovie Screening|Open-air movie screening by the beach\nExperience|Beachside camping under the stars\nFood|BBQ, dinner, and breakfast included",
    itinerary:
      "Day 1|04:00 PM|Reach campsite and enjoy welcome drink\nDay 1|05:00 PM|High tea and snacks\nDay 1|Sunset|Beach walk and sunset views\nDay 1|08:00 PM|BBQ and music\nDay 1|10:00 PM|Dinner and bonfire time\nDay 2|09:00 AM|Breakfast with beach view\nDay 2|11:00 AM|Check-out with memories",
    highlights:
      "Beachside Bonfire|Light up the evening with a beachside campfire and a relaxed coastal vibe.\nBarbecue Nights|Enjoy a limited BBQ session with your group under the open sky.\nSunrise & Sunset Views|Watch both the evening sunset and early morning sunrise by the beach.",
    included: CAMPING_INCLUDED_OPTIONS.slice(0, 10).join("\n"),
    notIncluded: CAMPING_EXCLUDED_OPTIONS.join("\n"),
    thingsToCarry: CAMPING_CARRY_OPTIONS.join("\n"),
    offers: "GDCAMP100|Save on group of 6 and more\nGDCAMP50|Save on group of 4 and more\nEARLY75|Early Booking Discount",
    faqs:
      "Can beginners join this camping trip?|Yes, this is a beginner-friendly beach camping experience.\nIs it safe for couples and solo travellers?|Yes, the campsite is suitable for couples, solo travellers, and mixed groups.\nIs transportation included?|No, guests need to reach the campsite on their own unless a special package includes travel.\nAre water sports included?|Water sports are available nearby at extra cost.",
    cancellationPolicy: GENERIC_POLICY.join("\n"),
    rules: GENERIC_RULES.join("\n"),
  },
};

export function buildCampingSeedItem(item) {
  const slug = String(item.shortName || item.name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const rich = CAMPING_DETAIL_SEED_BY_SLUG[slug] || {};
  const nextDates = rich.nextDates || JSON.stringify(item.nextDates || ["Available on Request"]);
  const imageGallery =
    rich.imageGallery || JSON.stringify([item.image].filter(Boolean));

  return {
    sortOrder: "",
    slug,
    name: item.name,
    shortName: item.shortName || item.name,
    type: item.type || "Lake",
    location: item.location || "",
    duration: item.duration || "Overnight",
    price: item.price || 0,
    originalPrice: item.originalPrice || 0,
    badge: item.badge || "",
    availability: item.availability || "Available",
    coupon: item.coupon || "",
    description: item.description || "",
    image: item.image || "",
    imageGallery,
    nextDates,
    overview:
      rich.overview ||
      `${item.shortName || item.name} offers a comfortable camping experience in ${item.location}. It is designed for weekend travellers looking for a mix of nature, food, and memorable group time.`,
    howToReach:
      rich.howToReach ||
      "Reach the campsite by your own vehicle or public transport. Exact location and reporting details can be shared after booking confirmation.",
    eventDetails:
      rich.eventDetails ||
      "Experience|Scenic campsite stay\nFood|Basic meal support available\nSupport|On-ground coordinator assistance",
    itinerary:
      rich.itinerary ||
      "Day 1|04:00 PM|Check in to campsite\nDay 1|08:00 PM|Dinner and campfire\nDay 2|09:00 AM|Breakfast and leisure time\nDay 2|11:00 AM|Check-out",
    highlights:
      rich.highlights ||
      "Nature Stay|Relax in a scenic outdoor setting.\nBonfire Vibes|Enjoy group time around the bonfire.\nWeekend Escape|A quick and refreshing getaway near the city.",
    included: rich.included || CAMPING_INCLUDED_OPTIONS.slice(0, 6).join("\n"),
    notIncluded: rich.notIncluded || CAMPING_EXCLUDED_OPTIONS.join("\n"),
    thingsToCarry: rich.thingsToCarry || CAMPING_CARRY_OPTIONS.join("\n"),
    offers: rich.offers || "EARLY75|Early Booking Discount",
    faqs:
      rich.faqs ||
      "Is this campsite beginner friendly?|Yes, it is suitable for first-time campers.\nIs food included?|Please check the inclusions section for this campsite.\nCan groups book together?|Yes, group bookings are available subject to batch capacity.",
    cancellationPolicy: rich.cancellationPolicy || GENERIC_POLICY.join("\n"),
    rules: rich.rules || GENERIC_RULES.join("\n"),
    active: true,
  };
}

export const CAMPING_SEED_DATA = campingList.map(buildCampingSeedItem);

/**
 * Reads camping items from localStorage.
 * - If empty, seeds from CAMPING_SEED_DATA (all rich fields).
 * - If data already exists, fills any empty/null rich fields from seed (field-level hydration).
 * This ensures admin edits are reflected AND old lightweight seeds get upgraded to full rich data.
 */
export function hydrateCampingStore() {
  const stored = getAdminItems(STORAGE_KEY);

  if (stored.length === 0) {
    const seeded = CAMPING_SEED_DATA.map((item, index) => ({
      ...item,
      id: `seed_${STORAGE_KEY}_${index}`,
      active: item.active !== false,
    }));
    saveAdminItems(STORAGE_KEY, seeded);
    return seeded;
  }

  // Build seed lookup by slug and by name for hydration matching
  const seedBySlug = new Map(
    CAMPING_SEED_DATA.map((item) => [String(item.slug || "").toLowerCase(), item])
  );
  const seedByName = new Map(
    CAMPING_SEED_DATA.map((item) => [String(item.name || item.shortName || "").toLowerCase(), item])
  );

  let changed = false;
  const hydrated = stored.map((item) => {
    const match =
      seedBySlug.get(String(item.slug || "").toLowerCase()) ||
      seedByName.get(String(item.name || item.shortName || "").toLowerCase());
    if (!match) return item;

    const next = { ...item };
    Object.entries(match).forEach(([field, value]) => {
      if (field === "id") return;
      if ((next[field] === "" || next[field] == null) && value !== "" && value != null) {
        next[field] = value;
        changed = true;
      }
    });
    return next;
  });

  if (changed) {
    saveAdminItems(STORAGE_KEY, hydrated);
  }

  return hydrated;
}
