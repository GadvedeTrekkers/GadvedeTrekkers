/**
 * Public trip display helpers.
 * Detail pages render API copy and departurePlans as-is:
 * markdown is turned into headings and lists, and itinerary lines stay
 * in the order and wording returned by product_departure_plans.
 */

const COVER_FILE_BY_SLUG = {
  vasota: "vasota",
  "vasota-fort": "vasota",
  "vasota-fort-trek": "vasota",
  harishchandragad: "harishchandragad",
  "harishchandragad-trek": "harishchandragad",
  kalsubai: "kalsubai",
  "kalsubai-trek": "kalsubai",
  "kalsubai-peak-trek": "kalsubai",
  "nye-beach": "nye-beach",
  "new-year-beach": "nye-beach",
  "new-year-beach-side-camping": "nye-beach",
};

const SITE_ORIGIN = "https://www.gadvede.com";

export function parseJsonish(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Remove markdown markers so a visitor never sees raw asterisks. */
export function stripMarkdownInline(text) {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SECTION_TITLES = new Set([
  "fees",
  "fee",
  "pickup",
  "pickups",
  "pickup points",
  "includes",
  "inclusions",
  "excludes",
  "exclusions",
  "things to carry",
  "itinerary",
  "itineraries",
  "notes",
  "note",
  "rules",
]);

function headingTitle(line) {
  const match = String(line || "").trim().match(/^\*\*(.+?)\*\*\s*:?\s*$/);
  if (match) return stripMarkdownInline(match[1]);
  const plain = stripMarkdownInline(line).replace(/:$/, "");
  return SECTION_TITLES.has(plain.toLowerCase()) ? plain : "";
}

/**
 * Turn stored markdown into plain blocks.
 * omitTitles drops a heading and everything under it until the next kept heading.
 * Day headings are part of an omitted Itinerary section.
 */
export function markdownBlocks(text, { omitTitles = [] } = {}) {
  const omit = new Set(omitTitles.map((title) => title.toLowerCase()));
  const skipDayHeadings = omit.has("itinerary");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let skipping = false;

  const flushParagraph = () => {
    const joined = stripMarkdownInline(paragraph.join(" "));
    paragraph = [];
    if (joined) blocks.push({ type: "p", text: joined });
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push({ type: "ul", items: list });
    list = [];
  };

  String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .forEach((raw) => {
      const line = raw.trim();
      const title = headingTitle(line);
      if (title) {
        flushParagraph();
        flushList();
        const key = title.toLowerCase();
        skipping = omit.has(key) || (skipDayHeadings && /^day\s+\d+\b/.test(key));
        if (!skipping) blocks.push({ type: "h", text: title });
        return;
      }
      if (skipping || !line) {
        if (!line && !skipping) {
          flushParagraph();
          flushList();
        }
        return;
      }
      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        flushParagraph();
        const item = stripMarkdownInline(bullet[1]);
        if (item) list.push(item);
        return;
      }
      flushList();
      paragraph.push(line);
    });

  flushParagraph();
  flushList();
  return blocks;
}

export function sectionList(text, titles = []) {
  const wanted = new Set(titles.map((title) => title.toLowerCase()));
  let capture = false;
  const items = [];
  String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .forEach((raw) => {
      const line = raw.trim();
      const title = headingTitle(line);
      if (title) {
        capture = wanted.has(title.toLowerCase());
        return;
      }
      if (!capture || !line) return;
      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (!bullet) return;
      const item = stripMarkdownInline(bullet[1]);
      if (item) items.push(item);
    });
  return items;
}

export function asList(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => asList(entry)).map(stripMarkdownInline).filter(Boolean);
  }
  if (value == null) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    const parsed = parseJsonish(text, null);
    if (Array.isArray(parsed)) return asList(parsed);
  }
  return text
    .split(/\n|•/g)
    .map((line) => stripMarkdownInline(line.replace(/^[-*]\s+/, "")))
    .filter(Boolean);
}

export function parseDeparturePlans(value) {
  const parsed = parseJsonish(value, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed;
}

function itinerarySource(plan) {
  if (!plan || typeof plan !== "object") return "";
  return plan.itinerary || plan.itinerary_text || "";
}

/**
 * Split departurePlans.itinerary_text into days.
 * Timed lines are "time|activity". A line that starts with "Day N" and has
 * no pipe is a day header. Nothing is added that the text does not contain.
 */
export function parseItineraryDays(text) {
  const days = [];
  let current = null;
  const openDay = (title) => {
    current = { title: stripMarkdownInline(title), events: [] };
    days.push(current);
  };

  String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const clean = stripMarkdownInline(line);
      if (/^day\s+\d+\b/i.test(clean) && !clean.includes("|")) {
        openDay(clean);
        return;
      }
      if (!current) openDay("");
      if (!clean.includes("|")) {
        current.events.push({ time: "", desc: clean });
        return;
      }
      const parts = clean.split("|").map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 3 && /^day\s+\d+\b/i.test(parts[0])) {
        openDay(parts[0]);
        current.events.push({ time: parts[1], desc: parts.slice(2).join(" | ") });
        return;
      }
      if (parts.length >= 2) {
        current.events.push({ time: parts[0], desc: parts.slice(1).join(" | ") });
        return;
      }
      current.events.push({ time: "", desc: parts[0] || clean });
    });

  return days;
}

export function parseDeparturePlanItineraries(departurePlans) {
  return Object.fromEntries(
    Object.entries(parseDeparturePlans(departurePlans)).map(([city, plan]) => {
      const key = String(city || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const days = parseItineraryDays(itinerarySource(plan));
      return [
        key,
        {
          label: `From ${city}`,
          sublabel: `${city} route`,
          icon: /kasara/i.test(city) ? "🚂" : "🚌",
          note: "",
          days,
        },
      ];
    })
  );
}

export function itineraryHasEvents(itineraries) {
  return Object.values(itineraries || {}).some((route) =>
    (route?.days || []).some((day) => (day.events || []).length > 0)
  );
}

function formatHumanDate(iso) {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDepartureWhen(date, endDate) {
  const start = formatHumanDate(date);
  const end = endDate && endDate !== date ? formatHumanDate(endDate) : "";
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

function cityFromRawLabel(label) {
  const match = String(label || "").match(/\(([^)]+)\)\s*$/);
  if (!match) return "";
  const city = match[1].trim();
  if (!city || /boat|batch|share|tent/i.test(city)) return "";
  return city;
}

function feeForCity(plans, city) {
  if (!city) return null;
  const match = Object.keys(plans).find((key) => key.toLowerCase() === city.toLowerCase());
  if (!match) return null;
  const price = Number(plans[match]?.price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/**
 * Upcoming rows: human date + city + plan fee.
 * batch_label values such as "11 07–08 boat (Pune)" are never shown.
 * Rows with the same date and city collapse to one.
 */
export function upcomingDepartures(batches, departurePlans, today = new Date().toISOString().slice(0, 10)) {
  const plans = parseDeparturePlans(departurePlans);
  const rows = (Array.isArray(batches) ? batches : [])
    .filter((batch) => batch?.date && batch.date >= today)
    .filter((batch) => batch.status !== "CANCELLED" && batch.status !== "CLOSED")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.departureCity || "").localeCompare(String(b.departureCity || "")));

  const seen = new Set();
  const departures = [];
  rows.forEach((batch) => {
    const city = String(batch.departureCity || cityFromRawLabel(batch.label) || "").trim();
    const key = `${batch.date}|${city.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    departures.push({
      id: batch.id || key,
      date: batch.date,
      endDate: batch.endDate && batch.endDate !== batch.date ? batch.endDate : "",
      city,
      fee: feeForCity(plans, city),
      label: formatDepartureWhen(batch.date, batch.endDate),
    });
  });
  return departures;
}

export function pickupGroups(departurePlans) {
  return Object.entries(parseDeparturePlans(departurePlans))
    .map(([city, plan]) => ({
      city,
      points: (Array.isArray(plan?.pickupPoints) ? plan.pickupPoints : [])
        .map((point) => ({
          time: stripMarkdownInline(point?.time || point?.pickup_time || ""),
          location: stripMarkdownInline(point?.location || point?.name || ""),
        }))
        .filter((point) => point.time || point.location),
    }))
    .filter((group) => group.points.length);
}

function rupeeAmounts(text) {
  const amounts = [];
  for (const match of String(text || "").matchAll(/₹\s*([\d][\d,]*)/g)) {
    const value = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) amounts.push(value);
  }
  return amounts;
}

/** Every current selling price advertised on the product, including other stay tiers. */
export function collectSellingPrices(item = {}) {
  const prices = new Set();
  const add = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) prices.add(numeric);
  };
  add(item.price);
  add(item.base_price);
  const plans = parseDeparturePlans(item.departurePlans);
  Object.values(plans).forEach((plan) => {
    add(plan?.price);
    rupeeAmounts(itinerarySource(plan)).forEach(add);
  });
  [item.description, item.about, item.subtitle, item.overview].forEach((text) => {
    rupeeAmounts(text).forEach(add);
  });
  return [...prices];
}

/**
 * Struck-through compare_at only when it is above THIS plan's price and it is
 * not another live tier (for example the NYE 4-share room price).
 */
export function genuineCompareAt(compareAt, sellingPrice, sellingPrices = []) {
  const compare = Number(compareAt);
  const selling = Number(sellingPrice);
  if (!Number.isFinite(compare) || !Number.isFinite(selling) || compare <= selling) return null;
  if (sellingPrices.some((price) => Number(price) === compare)) return null;
  return compare;
}

export function pricingCards(item = {}) {
  const plans = parseDeparturePlans(item.departurePlans);
  const sellingPrices = collectSellingPrices(item);
  const compareAt = item.originalPrice ?? item.compare_at_price;
  const cards = Object.entries(plans)
    .map(([city, plan]) => {
      const price = Number(plan?.price) || Number(item.price) || 0;
      return {
        key: city,
        label: `${city} departure`,
        price,
        compareAt: genuineCompareAt(compareAt, price, sellingPrices),
      };
    })
    .filter((card) => card.price > 0);
  if (!cards.length && Number(item.price) > 0) {
    cards.push({
      key: "base",
      label: "Per person",
      price: Number(item.price),
      compareAt: genuineCompareAt(compareAt, item.price, sellingPrices),
    });
  }
  return cards;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isLogoImage(url) {
  return /gadvedelogo|(^|\/)logo\.(png|jpe?g|svg|webp)/i.test(String(url || ""));
}

export function absolutizeTripImage(url) {
  const value = String(url || "").trim();
  if (!value || value.startsWith("data:")) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/trips/")) return `${SITE_ORIGIN}${value}`;
  return value;
}

export function coverUrlForTrip(item = {}) {
  const file = COVER_FILE_BY_SLUG[slugify(item.slug)] || COVER_FILE_BY_SLUG[slugify(item.name)];
  if (file) return `${SITE_ORIGIN}/trips/${file}.jpg`;
  const gallery = parseJsonish(item.imageGallery, []);
  const candidates = [item.image, ...(Array.isArray(gallery) ? gallery : [])];
  for (const candidate of candidates) {
    const match = String(candidate || "").match(/\/trips\/([a-z0-9-]+)\.(jpe?g|png|webp)/i);
    if (match && !/logo/i.test(match[1])) return `${SITE_ORIGIN}/trips/${match[1]}.jpg`;
  }
  return "";
}

/** Hero and gallery. A single real cover is repeated so the grid is not a lone logo. */
export function resolveTripGallery(item = {}) {
  const cover = coverUrlForTrip(item);
  const gallery = parseJsonish(item.imageGallery, []);
  const media = Array.isArray(item.media) ? item.media.map((entry) => (typeof entry === "string" ? entry : entry?.url)) : [];
  const urls = [item.image, ...(Array.isArray(gallery) ? gallery : []), ...media]
    .map(absolutizeTripImage)
    .filter((url) => url && !isLogoImage(url));
  const ordered = cover ? [cover, ...urls.filter((url) => url !== cover)] : urls;
  const unique = [];
  ordered.forEach((url) => {
    if (!unique.includes(url)) unique.push(url);
  });
  if (!unique.length) return [];
  if (unique.length === 1) return [unique[0], unique[0], unique[0]];
  return unique.slice(0, 6);
}
