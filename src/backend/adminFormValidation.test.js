import test from "node:test";
import assert from "node:assert/strict";
import { validateAdminForm, validatePickupRowsByCity } from "./adminFormValidation.js";

const DEPARTURE_PLANS = {
  Pune: {
    price: "1800",
    pickupPoints: [
      { time: "08:30 PM", location: "Shivajinagar", mapUrl: "https://maps.google.com/?q=shivajinagar" },
      { time: "", location: "", mapUrl: "" },
    ],
    itinerary: "Day 1|08:30 PM|Depart from Shivajinagar",
  },
  Mumbai: {
    price: "1600",
    pickupPoints: [
      { time: "09:00 PM", location: "Dadar", mapUrl: "" },
    ],
    itinerary: "Day 1|09:00 PM|Depart from Dadar",
  },
};

const TREK_FIELDS = [
  { key: "name", label: "Trek Name", type: "text", required: true },
  { key: "departurePlans", label: "Departure Cities", type: "departurePlans" },
  { key: "trekDateBatches", label: "Trek Dates", type: "trekDates" },
];

test("validateAdminForm accepts departurePlans objects with city price, pickups, and itinerary", () => {
  const errors = validateAdminForm(TREK_FIELDS, {
    name: "Harishchandragad",
    departurePlans: DEPARTURE_PLANS,
    trekDateBatches: [{ date: "2026-11-14", label: "Weekend", whatsappGroupLink: "" }],
  });

  assert.deepEqual(errors, {});
});

test("validateAdminForm accepts the same departurePlans when stored as a JSON string", () => {
  const errors = validateAdminForm(TREK_FIELDS, {
    name: "Kalsubai",
    departurePlans: JSON.stringify(DEPARTURE_PLANS),
    trekDateBatches: "[]",
  });

  assert.deepEqual(errors, {});
});

test("invalid departure-plan pickup rows become field errors instead of throwing", () => {
  const errors = validateAdminForm(TREK_FIELDS, {
    name: "Rajmachi",
    departurePlans: {
      Pune: {
        price: "1499",
        pickupPoints: [
          { time: "07:00 PM", location: "", mapUrl: "maps.google.com/pune" },
        ],
        itinerary: "Day 1|07:00 PM|Depart",
      },
      Mumbai: {
        price: "1599",
        pickupPoints: [
          { time: "08:00 PM", location: "Dadar", mapUrl: "https://maps.google.com/?q=dadar" },
        ],
        itinerary: "",
      },
    },
    trekDateBatches: "[]",
  });

  assert.deepEqual(errors.departurePlans, [
    "Pune pickup 1: add a pickup location.",
    "Pune pickup 1: Google Maps link should start with http:// or https://.",
  ]);
});

test("a departure plan without pickupPoints does not throw", () => {
  assert.doesNotThrow(() => {
    const errors = validateAdminForm(TREK_FIELDS, {
      name: "Base village trek",
      departurePlans: {
        Kasara: { price: "999", itinerary: "Day 1|10:30 PM|Depart" },
      },
      trekDateBatches: "[]",
    });
    assert.deepEqual(errors, {});
  });
});

test("validatePickupRowsByCity ignores non-array city values instead of throwing", () => {
  const issues = validatePickupRowsByCity({
    Pune: { price: "1800", pickupPoints: [], itinerary: "" },
  });
  assert.deepEqual(issues, []);
});

test("standalone pickup fields still report invalid rows", () => {
  const errors = validateAdminForm(
    [{ key: "pickupPoints", label: "Pickups", type: "pickups" }],
    {
      pickupPoints: {
        Mumbai: [
          { time: "06:00 AM", location: "", mapUrl: "not-a-url" },
          { time: "07:00 AM", location: "Dadar", mapUrl: "https://maps.google.com/?q=dadar" },
        ],
      },
    }
  );

  assert.deepEqual(errors.pickupPoints, [
    "Mumbai pickup 1: add a pickup location.",
    "Mumbai pickup 1: Google Maps link should start with http:// or https://.",
  ]);
});

test("forms without departurePlans keep required-field and batch checks", () => {
  const errors = validateAdminForm(
    [
      { key: "name", label: "Tour Name", type: "text", required: true },
      { key: "trekDateBatches", label: "Dates", type: "trekDates" },
    ],
    {
      name: "   ",
      trekDateBatches: [{ date: "", label: "Batch", whatsappGroupLink: "wa.me/group" }],
    }
  );

  assert.deepEqual(errors.name, ["Tour Name is required."]);
  assert.deepEqual(errors.trekDateBatches, [
    "Batch 1: date is required.",
    "Batch 1: WhatsApp link should start with http:// or https://.",
  ]);
});
