/**
 * Destination hub pages (/treks-near-pune, /rajasthan-tours, ...).
 * Shared by the React page (src/pages/Hubs/DestinationHub.jsx) and scripts/generate-sitemap.mjs.
 *
 * Trips are matched from the live /api/products data at runtime; nothing is hard-coded per trip.
 * A hub with fewer than MIN_TRIPS matching trips shows "coming soon" and is noindexed (and left out of the sitemap).
 * Intro copy is general and factual about the place/category; prices, dates and trip names come from the data.
 */

import { redirectTarget } from "./seoRedirects.js";
import { parseJson, positiveNumber, upcomingBatches } from "./tripData.js";

export const MIN_TRIPS = 2;

const text = (item) =>
  [item?.name, item?.slug, item?.location, item?.destination, item?.category, item?.hubSlug, item?.region]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/** trek | tour | camping | null (villas, industrial visits and rentals have no hub). */
export function tripKind(item) {
  const type = String(item?.productType || item?.product_type || "").toLowerCase();
  const nameSlug = `${item?.name || ""} ${item?.slug || ""}`.toLowerCase();
  if (type === "camping") return "camping";
  if (type === "trek") return /\bcamping\b|\bcamp\b/.test(nameSlug) ? "camping" : "trek";
  if (type === "tour") return "tour";
  return null;
}

export function tripPath(item) {
  const kind = tripKind(item);
  const type = String(item?.productType || "").toLowerCase();
  if (type === "camping") return `/camping/${item.slug}`;
  if (type === "tour") return `/tours/${item.slug}`;
  return kind ? `/treks/${item.slug}` : `/${item.slug}`;
}

/** Departure cities from departure plans, pickup points and itinerary rows. */
export function departureCities(item) {
  const cities = new Set();
  const plans = parseJson(item?.departurePlans, null);
  if (plans && typeof plans === "object" && !Array.isArray(plans)) Object.keys(plans).forEach((c) => cities.add(c));
  const pickups = parseJson(item?.pickupPoints, null);
  if (pickups && typeof pickups === "object" && !Array.isArray(pickups)) Object.keys(pickups).forEach((c) => cities.add(c));
  String(item?.itinerary || "")
    .split("\n")
    .forEach((line) => {
      const first = line.split("|")[0]?.trim();
      if (first && !/^day\b/i.test(first) && line.split("|").length >= 3) cities.add(first);
    });
  return [...cities];
}

export const upcomingDates = (item) => upcomingBatches(item).map((b) => b.date);

/**
 * Lowest real price: departure-plan fees first (city departures; a "Base Village" join-at-base fee
 * is only used when there is no city departure), then batch prices, then the card price.
 */
export function fromPrice(item, cityRe = null) {
  const prices = [];
  const plans = parseJson(item?.departurePlans, null);
  if (plans && typeof plans === "object" && !Array.isArray(plans)) {
    const entries = Object.entries(plans).filter(([, p]) => positiveNumber(p?.price));
    // A city hub (e.g. Treks near Pune) shows that city's fee when the trip has one.
    const forCity = cityRe ? entries.filter(([k]) => cityRe.test(k.toLowerCase())) : [];
    if (forCity.length) return Math.min(...forCity.map(([, p]) => positiveNumber(p.price)));
    const city = entries.filter(([k]) => !/base/i.test(k));
    (city.length ? city : entries).forEach(([, p]) => prices.push(positiveNumber(p.price)));
  }
  const batches = parseJson(item?.trekDateBatches ?? item?.tourDateBatches, []);
  if (Array.isArray(batches)) batches.forEach((b) => positiveNumber(b?.price) && prices.push(positiveNumber(b.price)));
  if (!prices.length && positiveNumber(item?.price)) prices.push(positiveNumber(item.price));
  return prices.length ? Math.min(...prices) : null;
}

/** Nights from "1 Night / 1 Day", "3 Nights 4 Days", "Overnight", "9 Days". */
export function nightsOf(item) {
  const d = String(item?.duration || "").toLowerCase();
  if (/overnight/.test(d)) return 1;
  const n = d.match(/(\d+)\s*night/);
  if (n) return Number(n[1]);
  const days = d.match(/(\d+)\s*day/);
  if (days) return Math.max(Number(days[1]) - 1, 0);
  return null;
}

const MAHARASHTRA = /maharashtra|pune|mumbai|lonavala|pawna|alibaug|alibag|satara|ahmednagar|akole|bhandardara|konkan|sahyadri|raigad|nashik|tarkarli|malvan|sindhudurg|igatpuri|kasara|koyna|bamnoli/;

const cityMatch = (item, re) => departureCities(item).some((c) => re.test(c.toLowerCase()));
const tags = (item) => [].concat(parseJson(item?.tags, []) || [], parseJson(item?.seasons, []) || []).map((t) => String(t).toLowerCase());

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function priceSentence(trips, noun) {
  const prices = trips.map((t) => t.fromPrice).filter(Boolean);
  if (!prices.length) return `Each ${noun} page lists its current fee, inclusions and departure points.`;
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi
    ? `Current fees start from ${fmt(lo)} per person; each ${noun} page lists the inclusions and departure points.`
    : `Current fees range from ${fmt(lo)} to ${fmt(hi)} per person (starting price, depending on the ${noun} and departure city). Each page lists the inclusions.`;
}

const BOOKING_FAQ = {
  question: "How do I book, and what if I already paid by bank transfer or UPI?",
  answer:
    "Open the trip page and use the WhatsApp booking button, or message or call Gadvede Trekkers on +91 9856112727. If you have already paid directly by bank transfer or UPI, fill in the payment registration form at gadvede.com/register so the team can match your payment to your seat.",
};

export const DESTINATION_HUBS = [
  {
    slug: "treks-near-pune",
    path: "/treks-near-pune",
    name: "Treks near Pune",
    h1: "Treks near Pune with Gadvede Trekkers",
    title: "Treks near Pune – Weekend Sahyadri Treks | Gadvede Trekkers",
    description: "Weekend treks from Pune to Sahyadri forts and peaks with Gadvede Trekkers. Pune pickup, trek leaders, meals and transport. See dates and fees, book on WhatsApp.",
    match: (item) => tripKind(item) === "trek" && cityMatch(item, /pune/),
    priceCity: /pune/,
    priceCityLabel: "from Pune",
    intro: [
      "Pune sits right next to the Sahyadri, the stretch of the Western Ghats that runs down western Maharashtra. That makes it one of the easiest cities in India to start a trek from: within a few hours by road you can be at the base of a hill fort, a ridge walk or one of the highest summits in the state. Most of these forts carry centuries of history, from cave temples cut into the rock to the Maratha-era fortifications that still guard the passes.",
      "Every trek on this page leaves from Pune with a fixed pickup plan. Gadvede Trekkers handles the transport from the city, the trek leaders on the trail and the meals listed on each trip page, so you only need to reach the pickup point on time. Many of our Pune treks are night departures: the bus leaves in the evening, you start climbing early in the morning, and you are back in the city the same day or the next morning. This keeps the climb in the cooler hours and leaves your weekend mostly free.",
      "The difficulty, distance and timings are different for every route, so check the trip page before you book. Each page shows the departure points in Pune, the itinerary hour by hour, what is included and not included, and what to carry. Comfortable trekking shoes with good grip, two to three litres of water, a torch and a light jacket are a good start for any Sahyadri trek.",
      "The list below updates on its own from our live trips, so it always shows the treks that are open for booking right now, with the current starting fee and the next available date. If you are new to trekking, start with a shorter route and go with a group; our trek leaders brief everyone before the climb and set the pace on the trail.",
    ],
    faq: (trips) => [
      { question: "Which treks near Pune can I book right now?", answer: `${trips.map((t) => t.name).join(", ")}. The list on this page is updated from our live trips.` },
      { question: "How much does a trek from Pune cost?", answer: priceSentence(trips, "trek") },
      { question: "Where are the pickup points in Pune?", answer: "Each trip page lists its own Pune pickup points and reporting times. Exact batch details are shared on WhatsApp after booking." },
      BOOKING_FAQ,
    ],
    related: ["weekend-treks", "treks-near-mumbai", "camping-near-pune"],
  },
  {
    slug: "treks-near-mumbai",
    path: "/treks-near-mumbai",
    name: "Treks near Mumbai",
    h1: "Treks near Mumbai with Gadvede Trekkers",
    title: "Treks near Mumbai – Weekend Sahyadri Treks | Gadvede Trekkers",
    description: "Weekend treks from Mumbai, Thane and Kasara to Sahyadri forts and peaks with Gadvede Trekkers. Dates, fees and pickup points, book on WhatsApp.",
    match: (item) => tripKind(item) === "trek" && cityMatch(item, /mumbai|kasara|thane|dadar|kalyan/),
    priceCity: /mumbai|kasara|thane|dadar|kalyan/,
    priceCityLabel: "from Mumbai side",
    intro: [
      "Mumbai is a short journey from some of the best trekking in Maharashtra. North-east of the city, the Sahyadri rises sharply above the Konkan plain, and the railway line to Kasara and the highways out of Thane put famous forts and peaks within a night's travel. That is why so many Mumbai trekkers do their climbs as overnight trips: leave after work, trek through the early morning, and be back home by the next evening.",
      "Every trek on this page has a departure plan for Mumbai-side trekkers. Depending on the route, that may be a pickup in Mumbai or Thane, or a meeting point at a railway station such as Kasara, where you join the group after taking a local train. The trip page shows exactly which option applies, the reporting time and the fee for that departure, because the fee differs by where you start.",
      "Gadvede Trekkers runs these treks with trek leaders who brief the group, set the pace and handle the logistics listed on each trip page, such as transport from the pickup point, meals and entry charges where included. Routes in the Sahyadri can be steep and rocky, with ladders or rock patches on some trails, so read the difficulty and the things-to-carry list before you book. Good trekking shoes, enough water and a torch are essential for night climbs.",
      "The list below is pulled from our live trips, so it only shows treks that are open now, with the starting fee and the next date where one is scheduled. If you are travelling as a group of friends or colleagues, message us on WhatsApp and we will tell you which batch suits you best.",
    ],
    faq: (trips) => [
      { question: "Which treks can I join from Mumbai?", answer: `${trips.map((t) => t.name).join(", ")}. Departure options are shown on each trip page.` },
      { question: "How much does a trek from Mumbai cost?", answer: priceSentence(trips, "trek") },
      { question: "Do I need to reach Kasara or is there a Mumbai pickup?", answer: "It depends on the trek. Each trip page lists the Mumbai-side departure options (city pickup or a station meeting point such as Kasara), with the time and fee for each." },
      BOOKING_FAQ,
    ],
    related: ["treks-near-pune", "weekend-treks", "konkan-beach-trips"],
  },
  {
    slug: "weekend-treks",
    path: "/weekend-treks",
    name: "Weekend treks",
    h1: "Weekend treks in Maharashtra",
    title: "Weekend Treks in Maharashtra from Pune & Mumbai | Gadvede",
    description: "One-night weekend treks in the Sahyadri from Pune and Mumbai. Night departures, trek leaders, transport and meals as listed. See dates and book on WhatsApp.",
    match: (item) => {
      if (tripKind(item) !== "trek") return false;
      const n = nightsOf(item);
      return n != null && n <= 1 && MAHARASHTRA.test(text(item));
    },
    intro: [
      "A weekend is all you need for a proper Sahyadri trek. The treks on this page are short trips of one night or less from Pune and Mumbai, designed so you can leave on Friday or Saturday night, summit a fort or peak, and be home in time for the week ahead. They are a good way to start trekking, and a good way to keep trekking when work leaves you only a couple of free days.",
      "Most weekend treks in Maharashtra work in a similar rhythm. The group meets at the pickup point in the evening or at night, travels to the base village, and starts climbing in the early hours so the ascent happens before the heat of the day. Summit views at sunrise are a big reason people choose these routes, especially after the monsoon and through the winter months when the air is clearer.",
      "Even short treks can be demanding. Sahyadri trails are often steep, with loose rock, uneven steps and, on some routes, iron ladders or narrow sections. Check the difficulty and itinerary on each trip page, carry two to three litres of water, a torch or headlamp and shoes with good grip, and listen to your trek leader's call on the day, especially in wet weather.",
      "Gadvede Trekkers runs every trip on this page with trek leaders and a fixed plan for transport and meals as described on the trip page. The list updates automatically from our live trips, so you always see what is open now, the starting fee and the next scheduled date where one is set. Book a seat on WhatsApp, and you will get the batch details on WhatsApp after booking.",
    ],
    faq: (trips) => [
      { question: "What counts as a weekend trek here?", answer: "Treks in Maharashtra that take one night or less, so they fit into a normal weekend. Each trip page shows the full itinerary and timings." },
      { question: "Which weekend treks are open now?", answer: `${trips.map((t) => t.name).join(", ")}.` },
      { question: "How much does a weekend trek cost?", answer: priceSentence(trips, "trek") },
      BOOKING_FAQ,
    ],
    related: ["treks-near-pune", "treks-near-mumbai", "monsoon-treks"],
  },
  {
    slug: "monsoon-treks",
    path: "/monsoon-treks",
    name: "Monsoon treks",
    h1: "Monsoon treks in Maharashtra",
    title: "Monsoon Treks in Maharashtra from Pune & Mumbai | Gadvede",
    description: "Monsoon treks in the Sahyadri from Pune and Mumbai with Gadvede Trekkers: waterfalls, green valleys and trek leaders who make the safety call. Dates as announced.",
    // Only trips that are actually scheduled in the monsoon (a June–September batch) or tagged "monsoon" in admin.
    match: (item) =>
      tripKind(item) === "trek" &&
      (tags(item).includes("monsoon") || upcomingDates(item).some((d) => ["06", "07", "08", "09"].includes(d.slice(5, 7)))),
    intro: [
      "The monsoon transforms the Sahyadri. From roughly June to September, the south-west monsoon brings heavy rain to the Western Ghats, and the dry brown hills of summer turn green almost overnight. Waterfalls appear on every cliff face, clouds drift through the valleys and forts that are dusty in April feel like a different place. For many trekkers in Pune and Mumbai, this is the season they wait for all year.",
      "Monsoon trekking also needs more care than any other season. Trails get muddy and slippery, rock patches and ladders are wet, streams can rise quickly after a heavy spell, and visibility can drop to a few metres in thick cloud. Some trails and protected areas are closed by the forest department during the peak monsoon. That is why Gadvede Trekkers only runs monsoon batches on routes that suit the season, and why our trek leaders make the final call on the day based on the weather.",
      "If you are planning a monsoon trek, pack for rain: a good raincoat or poncho, shoes with a deep grip, a change of clothes in a waterproof bag, and a dry bag or plastic cover for your phone. Avoid cotton, carry some dry snacks, and expect the trek to take longer than it would in winter.",
      "Our monsoon batches are announced closer to the season. This page lists them automatically as soon as they are scheduled, with the fee, the departure points and the date. Until then you can see all our current treks on the treks page, or message us on WhatsApp to hear first when monsoon dates open.",
    ],
    faq: (trips) => [
      { question: "When is the monsoon trekking season in Maharashtra?", answer: "Roughly June to September, when the south-west monsoon reaches the Sahyadri. Exact batch dates are shown here once they are scheduled." },
      {
        question: "Are monsoon batches open now?",
        answer: trips.length ? `Yes: ${trips.map((t) => t.name).join(", ")}.` : "Not yet. Monsoon batches are announced closer to the season and will appear on this page automatically.",
      },
      { question: "What should I carry for a monsoon trek?", answer: "A raincoat or poncho, trekking shoes with good grip, a change of clothes in a waterproof bag, a cover for your phone, water and dry snacks. Each trip page has its own things-to-carry list." },
      BOOKING_FAQ,
    ],
    related: ["weekend-treks", "treks-near-pune", "treks-near-mumbai"],
  },
  {
    slug: "camping-near-pune",
    path: "/camping-near-pune",
    name: "Camping near Pune",
    h1: "Camping near Pune and Mumbai",
    title: "Camping near Pune & Mumbai – Lake & Beach Camps | Gadvede",
    description: "Lake and beach camping near Pune and Mumbai with Gadvede Trekkers: tents, meals and bonfire as listed per camp. See fees and book on WhatsApp.",
    match: (item) => tripKind(item) === "camping" && MAHARASHTRA.test(text(item)),
    intro: [
      "Camping is the easiest way to get out of the city for a night without a long trek. Within a few hours of Pune and Mumbai you can pitch up beside a lake in the Sahyadri foothills or on the Konkan coast, watch the sunset, sit around a fire and wake up to the outdoors. It suits families, friends' groups, couples and first-timers, because there is no long climb involved.",
      "The camps on this page are run or arranged by Gadvede Trekkers in Maharashtra. Each camp page lists exactly what you get: the type of tent and how many people share it, meals and snacks, activities, check-in and check-out times, and whether transport from Pune or Mumbai is included or you reach the campsite on your own. Fees differ by camp and by option, so the starting price shown on each card is the lowest current option.",
      "Lake camps near Pune are popular for their hill views and calm evenings, while beach camps on the Konkan coast trade the hills for the sea. Nights can be cool in winter, so carry a light jacket, along with a torch, any personal medicines and a basic toiletry kit. If you plan to camp in the monsoon, check the camp page or ask us on WhatsApp first, as conditions and availability change with the weather.",
      "The list below updates automatically from our live listings, so it only shows camps that are open now. For a birthday, a corporate outing or a large group, message us on WhatsApp and we will suggest a camp and a date that works.",
    ],
    faq: (trips) => [
      { question: "Which camps near Pune and Mumbai can I book?", answer: `${trips.map((t) => t.name).join(", ")}.` },
      { question: "How much does camping cost?", answer: priceSentence(trips, "camp") },
      { question: "Is transport included?", answer: "It depends on the camp and the option you choose. Each camp page states whether transport is included or you reach the campsite yourself." },
      BOOKING_FAQ,
    ],
    related: ["konkan-beach-trips", "treks-near-pune", "weekend-treks"],
  },
  {
    slug: "konkan-beach-trips",
    path: "/konkan-beach-trips",
    name: "Konkan beach trips",
    h1: "Konkan beach trips and beach camping",
    title: "Konkan Beach Trips & Beach Camping from Pune | Gadvede",
    description: "Beach trips and beach camping on the Konkan coast of Maharashtra from Pune and Mumbai with Gadvede Trekkers. Fees, dates and inclusions, book on WhatsApp.",
    match: (item) => {
      const kind = tripKind(item);
      if (kind !== "camping" && kind !== "tour") return false;
      const t = text(item);
      return MAHARASHTRA.test(t) && /beach|konkan|alibaug|alibag|tarkarli|malvan|sindhudurg|kashid|ganpatipule/.test(t);
    },
    intro: [
      "The Konkan coast runs along the western edge of Maharashtra, between the Arabian Sea and the Sahyadri. It is a coastline of sandy beaches, coconut and betel-nut groves, fishing villages, sea forts and some of the best seafood in the country. From Pune and Mumbai it makes an easy escape, from a single night of beach camping to a few days further south.",
      "The trips on this page are all on the Maharashtra coast. Some are short beach camps, where you arrive in the evening, enjoy the beach, a bonfire and meals as listed, and head back the next day. Others are multi-day coastal trips that include sightseeing and water activities. Each trip page explains exactly what is included, from stay and meals to activities and transport, and which parts are optional or paid separately.",
      "The best time for the Konkan coast is after the monsoon and through the winter, roughly October to February, when the sea is calmer and the weather is pleasant. Sea activities depend on conditions on the day and on local operators, so follow the guidance of the trip captain and the activity staff. Carry sunscreen, a cap, light cotton clothes, a change of clothes for the water and any personal medicines.",
      "This page updates automatically from our live trips, so it only lists what is open for booking now, with the starting fee and the next date where scheduled. Message us on WhatsApp for group bookings or special dates such as New Year. If you are coming from Pune, also check the departure city on each card, because some coastal trips start from Mumbai or ask you to reach the location directly.",
    ],
    faq: (trips) => [
      { question: "Which Konkan beach trips are open now?", answer: `${trips.map((t) => t.name).join(", ")}.` },
      { question: "How much do Konkan beach trips cost?", answer: priceSentence(trips, "trip") },
      { question: "What is the best time to visit the Konkan coast?", answer: "Roughly October to February, after the monsoon, when the sea is calmer and the weather is pleasant." },
      BOOKING_FAQ,
    ],
    related: ["camping-near-pune", "treks-near-mumbai", "weekend-treks"],
  },
  {
    slug: "rajasthan-tours",
    path: "/rajasthan-tours",
    name: "Rajasthan tours",
    h1: "Rajasthan group tours from Pune and Mumbai",
    title: "Rajasthan Group Tours from Pune & Mumbai | Gadvede Trekkers",
    description: "Fixed-departure Rajasthan group tours with Gadvede Trekkers: forts, palaces, lakes and the Thar desert. See itinerary, dates and fees, book on WhatsApp.",
    match: (item) =>
      tripKind(item) === "tour" &&
      (String(item?.hubSlug || "") === "rajasthan" || /rajasthan|jaipur|jaisalmer|jodhpur|udaipur|pushkar/.test(text(item))),
    intro: [
      "Rajasthan is one of the most rewarding regions in India to travel through as a group. In a single trip you can move from the pink city of Jaipur, with its forts and bazaars, to the blue city of Jodhpur under the walls of Mehrangarh, to the golden sandstone of Jaisalmer on the edge of the Thar desert, and to the lakes and palaces of Udaipur. Each city has its own food, crafts and history, and the long drives between them show how varied the state is.",
      "Gadvede Trekkers runs fixed-departure Rajasthan tours for travellers from Pune and Mumbai. A group tour takes care of the parts that are hard to plan on your own: train or road travel between cities, hotel stays, local transport, sightseeing order and a trip captain who travels with the group. Each tour page lists the full day-by-day itinerary, the travel class and package options, and exactly what is included and not included in the fee.",
      "The most comfortable time to visit Rajasthan is the cooler season, roughly October to March. Days can still be warm and desert nights cold, so pack layers, comfortable walking shoes for fort visits, sunscreen and a scarf or cap. Desert activities and some monument entries may be optional or paid on the spot, as shown on the tour page.",
      "This page lists our live Rajasthan tours automatically, with the starting fee and the next departure date. Batches fill up around long weekends and the year-end holidays, so book early on WhatsApp if you have fixed dates.",
    ],
    faq: (trips) => [
      { question: "Which Rajasthan tours are open now?", answer: trips.length ? `${trips.map((t) => t.name).join(", ")}.` : "New Rajasthan departures are coming soon." },
      { question: "How much does a Rajasthan group tour cost?", answer: priceSentence(trips, "tour") },
      { question: "What is the best time for a Rajasthan tour?", answer: "Roughly October to March, when the weather is cooler. Each tour page lists its departure dates." },
      BOOKING_FAQ,
    ],
    related: ["himachal-tours", "konkan-beach-trips"],
  },
  {
    slug: "himachal-tours",
    path: "/himachal-tours",
    name: "Himachal tours",
    h1: "Himachal group tours from Pune and Mumbai",
    title: "Himachal Group Tours from Pune & Mumbai | Gadvede Trekkers",
    description: "Himachal Pradesh group tours with Gadvede Trekkers from Pune and Mumbai: Manali, Kasol, Dharamshala, Dalhousie and more. Itinerary, fees, book on WhatsApp.",
    match: (item) =>
      tripKind(item) === "tour" &&
      (String(item?.hubSlug || "") === "himachal" || /himachal|manali|kasol|kullu|dharamshala|dalhousie|khajjiar|spiti|shimla/.test(text(item))),
    intro: [
      "Himachal Pradesh is where many travellers from Maharashtra see the Himalaya for the first time. The state's valleys hold pine and deodar forests, apple orchards, fast rivers and snow peaks, with very different moods from one valley to the next: the adventure hub of Manali and Solang, the riverside cafés of Kasol and the Parvati valley, the Tibetan monasteries of McLeodganj near Dharamshala, and the colonial hill station of Dalhousie with the meadows of Khajjiar nearby.",
      "Gadvede Trekkers runs Himachal group tours that start from Pune and Mumbai. Reaching the mountains from western India usually means a long train journey to Delhi or Punjab followed by an overnight road journey, and a group tour handles all of it: train and bus or tempo traveller travel, hotel stays, sightseeing in the right order and a trip captain who travels with the group. Each tour page lists the full itinerary, the package options and what is included and excluded in the fee.",
      "Mountain weather changes quickly. Carry warm layers in every season, a waterproof jacket, comfortable shoes with grip and any personal medicines, and expect roads to be slower than the distances suggest. Snow points, adventure activities and some local transport may be optional or paid on the spot, as shown on each tour page.",
      "This page lists our live Himachal tours automatically, with the starting fee and the next departure where scheduled. Message us on WhatsApp for group bookings or custom dates. Because these are long trips with train bookings, seats are confirmed in the order payments are received, so it helps to book a few weeks ahead.",
    ],
    faq: (trips) => [
      { question: "Which Himachal tours are open now?", answer: `${trips.map((t) => t.name).join(", ")}.` },
      { question: "How much does a Himachal tour from Pune cost?", answer: priceSentence(trips, "tour") },
      { question: "How do we travel from Pune or Mumbai to Himachal?", answer: "The route and travel class are listed on each tour page; typically a train to North India followed by road travel into the mountains." },
      BOOKING_FAQ,
    ],
    related: ["rajasthan-tours", "treks-near-pune"],
  },
];

const BY_SLUG = new Map(DESTINATION_HUBS.map((h) => [h.slug, h]));
export const hubBySlug = (slug) => BY_SLUG.get(String(slug || "")) || null;

/** Live, de-duplicated trip cards for a hub, cheapest-first within upcoming-first. */
export function hubTrips(hub, products = []) {
  if (!hub) return [];
  const seen = new Map();
  for (const item of products || []) {
    if (!item || item.active === false || !item.slug) continue;
    if (!hub.match(item)) continue;
    const canonical = item?.seo?.canonicalPath;
    if (canonical && canonical !== tripPath(item)) continue;
    if (redirectTarget(tripPath(item))) continue;
    const key = String(item.name || item.slug).trim().toLowerCase();
    const prev = seen.get(key);
    // Same trip listed twice (e.g. as a trek and as a camping item): keep the camping/tour listing.
    if (prev && String(prev.productType) !== "trek") continue;
    seen.set(key, item);
  }
  return [...seen.values()]
    .map((item) => {
      const dates = upcomingDates(item);
      return {
        slug: item.slug,
        name: item.name || item.slug,
        path: tripPath(item),
        kind: tripKind(item),
        productType: item.productType,
        location: item.destination || item.location || "",
        duration: item.duration || "",
        difficulty: item.difficulty || "",
        image: item.image || "",
        fromPrice: fromPrice(item, hub.priceCity || null),
        priceCity: hub.priceCityLabel || "",
        nextDate: dates[0] || null,
        departureCities: departureCities(item).filter((c) => !/base village/i.test(c)),
      };
    })
    .sort((a, b) => (a.nextDate || "9999").localeCompare(b.nextDate || "9999") || (a.fromPrice || 1e9) - (b.fromPrice || 1e9));
}

export const hubIsIndexable = (trips) => trips.length >= MIN_TRIPS;
