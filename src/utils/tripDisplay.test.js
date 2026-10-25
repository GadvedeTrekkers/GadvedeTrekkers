import test from "node:test";
import assert from "node:assert/strict";
import {
  collectSellingPrices,
  genuineCompareAt,
  markdownBlocks,
  parseItineraryDays,
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
