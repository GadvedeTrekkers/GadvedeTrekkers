import test from "node:test";
import assert from "node:assert/strict";
import {
  collectSellingPrices,
  genuineCompareAt,
  linkifyHtml,
  linkifyText,
  markdownBlocks,
  parseCombinedItineraryRoutes,
  parseItineraryDays,
  publicTrekItineraries,
  resolveTripGallery,
  stripMarkdownInline,
  upcomingDepartures,
} from "./tripDisplay.js";

const VASOTA_ITINERARY = `Day 1 — Departure from Pune
07:30 PM|Report at City Pride, Satara Road
08:30 PM|Pickup at Katraj Chowk — depart for Bamnoli
Day 2 — Boat + Vasota fort
06:00 AM|Wake up, freshen up, breakfast & tea`;

test("itinerary keeps API day headers and pipe-separated times", () => {
  const days = parseItineraryDays(VASOTA_ITINERARY);
  assert.equal(days.length, 2);
  assert.equal(days[0].title, "Day 1 — Departure from Pune");
  assert.deepEqual(days[0].events[0], {
    time: "07:30 PM",
    desc: "Report at City Pride, Satara Road",
  });
  assert.equal(days[1].events[0].time, "06:00 AM");
  assert.equal(JSON.stringify(days).includes("*"), false);
});

const PUNE_DEPARTURE_ITINERARY = `Day 1|09:00 PM|Report to the Gadvede trek leaders at Fergusson College Main Gate, FC Road, Pune (https://goo.gl/maps/53XNsyDPwcSVReZW9) for attendance and a quick introduction.
Day 1|09:30 PM|Pick-up from Nashik Phata (https://goo.gl/maps/3Fdnzh3YdLEimfHg7); the bus then departs overnight for Bari.

Keep your ID ready
Day 2|03:30 AM|Arrive at Bari base village and rest for a while before the climb.
Day 2||Rest before the climb
Day 2|05:00 AM|Freshen up and start the climb to Kalsubai Peak.
Day 2|09:00 AM|Reach the summit.
Day 2|10:30 AM|Breakfast.
Day 2|11:00 AM|Begin the descent.
Day 2|02:00 PM|Lunch at the base village.
Day 2|03:00 PM|Board the bus for Pune.
Day 2|08:00 PM|Arrive in Pune.
Day 1|10:15 PM|Late joiners meet the leader`;

test("repeated Day N rows share one heading, in first-seen order", () => {
  const days = parseItineraryDays(PUNE_DEPARTURE_ITINERARY);
  assert.deepEqual(days.map((day) => day.title), ["Day 1", "Day 2"]);
  assert.deepEqual(
    days[0].events.map((event) => event.time),
    ["09:00 PM", "09:30 PM", "", "10:15 PM"]
  );
  assert.equal(days[0].events[2].desc, "Keep your ID ready");
  assert.equal(days[0].events[3].desc, "Late joiners meet the leader");
  assert.equal(days[1].events.length, 9);
  assert.deepEqual(days[1].events[1], { time: "", desc: "Rest before the climb" });
  assert.match(days[0].events[0].desc, /https:\/\/goo\.gl\/maps\/53XNsyDPwcSVReZW9/);
  assert.equal(days[0].events[0].desc.includes("<"), false);
});

test("blank lines, missing times, header lines, and case still group", () => {
  const days = parseItineraryDays(`

**Day 1**|09:00 PM|**Report**

day 1|Reach the base village
Day 1|06:30 AM|
Day 2 — Summit
Sunrise photos
Day 1 — Departure from Pune
07:30 PM|Second header stays separate
`);
  assert.equal(days.length, 3);
  assert.equal(days[0].title, "Day 1");
  assert.deepEqual(days[0].events, [
    { time: "09:00 PM", desc: "Report" },
    { time: "", desc: "Reach the base village" },
    { time: "06:30 AM", desc: "" },
  ]);
  assert.equal(days[1].title, "Day 2 — Summit");
  assert.deepEqual(days[1].events, [{ time: "", desc: "Sunrise photos" }]);
  assert.equal(days[2].title, "Day 1 — Departure from Pune");
  assert.equal(days[2].events[0].time, "07:30 PM");
});

test("a note before any day stays on its own untitled block", () => {
  const days = parseItineraryDays("Bring water\n\nDay 1|09:00 PM|Report");
  assert.equal(days[0].title, "");
  assert.deepEqual(days[0].events, [{ time: "", desc: "Bring water" }]);
  assert.equal(days[1].title, "Day 1");
});

test("legacy City|Day|time|text groups per city without mixing routes", () => {
  const routes = parseCombinedItineraryRoutes(`Pune|Day 1|09:00 PM|Report at FC Road (https://goo.gl/maps/53XNsyDPwcSVReZW9)
Bring a torch
Mumbai|Day 2|06:00 AM|Summit
Pune|Day 2|05:00 AM|Start the climb
Pune|Day 1|09:30 PM|Nashik Phata
Mumbai|Day 1|08:30 PM|Teen Hath Naka
`);
  assert.deepEqual(Object.keys(routes), ["pune", "mumbai"]);
  assert.equal(routes.pune.label, "From Pune");
  assert.deepEqual(routes.pune.days.map((day) => day.title), ["Day 1", "Day 2"]);
  assert.deepEqual(
    routes.pune.days[0].events.map((event) => event.desc),
    ["Report at FC Road (https://goo.gl/maps/53XNsyDPwcSVReZW9)", "Bring a torch", "Nashik Phata"]
  );
  assert.equal(routes.pune.days[1].events[0].time, "05:00 AM");
  assert.deepEqual(routes.mumbai.days.map((day) => day.title), ["Day 2", "Day 1"]);
  assert.equal(routes.mumbai.days[1].events[0].desc, "Teen Hath Naka");
});

test("departure plans win, and an empty plan falls back to the legacy field", () => {
  const fromPlans = publicTrekItineraries(
    { Pune: { itinerary: "Day 1|09:00 PM|From plans\nDay 1|10:00 PM|Still day 1" } },
    "Pune|Day 1|01:00 AM|From legacy"
  );
  assert.equal(fromPlans.pune.days.length, 1);
  assert.deepEqual(
    fromPlans.pune.days[0].events.map((event) => event.desc),
    ["From plans", "Still day 1"]
  );

  const fromLegacy = publicTrekItineraries(
    JSON.stringify({ Pune: { price: 1399, itinerary: "" } }),
    "Mumbai|Day 1|08:30 PM|Legacy only\nMumbai|Day 1|09:00 PM|Second stop"
  );
  assert.equal(fromLegacy.pune, undefined);
  assert.equal(fromLegacy.mumbai.days.length, 1);
  assert.equal(fromLegacy.mumbai.days[0].events.length, 2);
  assert.equal(fromLegacy.mumbai.icon, "🚌");
});

test("linkify turns map URLs into a short accessible link and escapes everything else", () => {
  const segments = linkifyText(
    'Report (https://goo.gl/maps/53XNsyDPwcSVReZW9) and http://example.com/notes. See https://en.wikipedia.org/wiki/Trek_(hiking).'
  );
  assert.equal(segments[0].text, "Report (");
  assert.deepEqual(segments[1], {
    type: "link",
    href: "https://goo.gl/maps/53XNsyDPwcSVReZW9",
    label: "View on map",
    ariaLabel: "View on map: https://goo.gl/maps/53XNsyDPwcSVReZW9",
  });
  assert.equal(segments[2].text, ") and ");
  assert.equal(segments[3].href, "http://example.com/notes");
  assert.equal(segments[3].label, "http://example.com/notes");
  assert.equal(segments[3].ariaLabel, undefined);
  assert.equal(segments[4].text, ". See ");
  assert.equal(segments[5].href, "https://en.wikipedia.org/wiki/Trek_(hiking)");
  assert.equal(segments[6].text, ".");

  const maps = linkifyText("https://maps.google.com/maps?q=kothrud and https://maps.app.goo.gl/abcDEF");
  assert.equal(maps[0].label, "View on map");
  assert.equal(maps[2].label, "View on map");
  assert.equal(maps[2].href, "https://maps.app.goo.gl/abcDEF");

  const html = linkifyHtml(
    `Meet <script>alert(1)</script> <img src=x onerror="alert(1)"> at https://goo.gl/maps/abc123 now. javascript:alert(1)`
  );
  assert.equal(html.includes("<script"), false);
  assert.equal(html.includes("<img"), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /javascript:alert\(1\)/);
  assert.match(
    html,
    /<a href="https:\/\/goo\.gl\/maps\/abc123" target="_blank" rel="noopener noreferrer" aria-label="View on map: https:\/\/goo\.gl\/maps\/abc123">View on map<\/a>/
  );
  assert.equal((html.match(/<a /g) || []).length, 1);

  const quoted = linkifyHtml('Click <a href="https://evil.example/phish">here</a> & go');
  assert.match(quoted, /&lt;a href=&quot;/);
  assert.match(quoted, /&amp; go/);
  assert.match(quoted, /href="https:\/\/evil\.example\/phish"/);
  assert.equal(quoted.includes("<a href=\"https://evil"), true);
  assert.equal(quoted.includes("<script"), false);
});

test("overview markdown no longer contains asterisks", () => {
  const blocks = markdownBlocks(
    "A forest fort.\n\n**Fees**\n- Pune: ₹1,800 per person\n\n**Itinerary**\n**Day 1: Camp**\n- Raw prose\n\n**Includes**\n- Breakfast",
    { omitTitles: ["itinerary"] }
  );
  const flat = JSON.stringify(blocks);
  assert.equal(flat.includes("*"), false);
  assert.equal(blocks.some((block) => block.type === "h" && block.text === "Fees"), true);
  assert.equal(blocks.some((block) => block.type === "h" && block.text === "Includes"), true);
  assert.equal(blocks.some((block) => /Raw prose|Day 1/.test(JSON.stringify(block))), false);
  assert.equal(stripMarkdownInline("**Includes**"), "Includes");
  const plain = markdownBlocks("Forest fort.\n\nFees\n- Pune: ₹1,800 per person\n\nPickup\n- City Pride", {
    omitTitles: ["itinerary"],
  });
  assert.equal(plain.some((block) => block.type === "h" && block.text === "Fees"), true);
  assert.equal(plain.some((block) => block.type === "ul" && block.items[0].includes("1,800")), true);
});

test("departures use a human date and city, never the raw boat label", () => {
  const rows = upcomingDepartures(
    [
      {
        id: "a",
        date: "2026-11-07",
        endDate: "2026-11-08",
        label: "11 07–08 boat (Pune)",
        departureCity: "Pune",
        status: "OPEN",
      },
      {
        id: "b",
        date: "2026-11-07",
        endDate: "2026-11-08",
        label: "Nov 07–08 boat (Pune)",
        departureCity: "Pune",
        status: "OPEN",
      },
      {
        id: "c",
        date: "2026-11-14",
        endDate: "2026-11-15",
        label: "11 14–15 boat (Mumbai)",
        departureCity: "Mumbai",
        status: "OPEN",
      },
    ],
    { Pune: { price: 1800 }, Mumbai: { price: 3200 } },
    "2026-11-01"
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].city, "Pune");
  assert.equal(rows[0].fee, 1800);
  assert.match(rows[0].label, /Nov/);
  assert.match(rows[0].label, /2026/);
  assert.equal(JSON.stringify(rows).toLowerCase().includes("boat"), false);
  assert.equal(JSON.stringify(rows).includes("11 07"), false);
  assert.equal(rows[1].city, "Mumbai");
  assert.equal(rows[1].fee, 3200);
});

test("NYE 4-share price is not a strikethrough original for the tent", () => {
  const item = {
    price: 2800,
    originalPrice: 3700,
    description: "4-share rooms: Pune ₹3,500 | Mumbai ₹3,700",
    departurePlans: {
      Pune: { price: 2800, itinerary: "Note|Tent ₹2,800 | 4-share room ₹3,500" },
      Mumbai: { price: 3000, itinerary: "Note|Tent ₹3,000 | 4-share room ₹3,700" },
    },
  };
  const selling = collectSellingPrices(item);
  assert.equal(genuineCompareAt(3700, 2800, selling), null);
  assert.equal(genuineCompareAt(3700, 3500, selling), null);
  assert.equal(genuineCompareAt(2299, 1800, [1800, 3200]), 2299);
  assert.equal(genuineCompareAt(1099, 1400, [1400]), null);
});

test("known trips use the public cover and pad a thin gallery", () => {
  const gallery = resolveTripGallery({
    slug: "vasota-fort-trek",
    image: "https://www.gadvede.com/gadvedelogo.png",
    imageGallery: "[]",
  });
  assert.deepEqual(gallery, [
    "https://www.gadvede.com/trips/vasota.jpg",
    "https://www.gadvede.com/trips/vasota.jpg",
    "https://www.gadvede.com/trips/vasota.jpg",
  ]);
  assert.equal(
    resolveTripGallery({ slug: "new-year-beach-side-camping", image: "/trips/nye-beach.jpg" })[0],
    "https://www.gadvede.com/trips/nye-beach.jpg"
  );
});

test("the image saved in the admin wins over the bundled /trips cover", () => {
  const db = "https://example.supabase.co/storage/v1/object/public/site-images/kalsubai-peak-trek/01.jpg";
  const gallery = resolveTripGallery({
    slug: "kalsubai-peak-trek",
    image: db,
    imageGallery: JSON.stringify([db, "https://www.gadvede.com/trips/kalsubai.jpg"]),
  });
  assert.equal(gallery[0], db);
  assert.equal(gallery[1], "https://www.gadvede.com/trips/kalsubai.jpg");
});

test("admin gallery wins over stale media, and admin data: uploads are kept", () => {
  const up = "data:image/jpeg;base64,AAAA";
  const gallery = resolveTripGallery({
    slug: "new-year-beach-side-camping",
    image: "https://x.test/a.jpg",
    imageGallery: JSON.stringify(["https://x.test/a.jpg", up]),
    media: [{ url: "https://www.gadvede.com/trips/nye-beach.jpg" }, { url: "https://x.test/a.jpg" }],
  });
  assert.deepEqual(gallery, ["https://x.test/a.jpg", up]);
});
