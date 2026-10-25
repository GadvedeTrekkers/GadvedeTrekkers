/* Original Gadvede copy for New Year Beach Side Camping. */

export const nyeBeachOverview = {
  tagline: "Beach camp · 30 December night to 1 January",
  subtitle: "Tent from ₹2,800 · 4-share room from ₹3,500",
  intro:
    "New Year Beach Side Camping is Gadvede's year-end beach batch. The group leaves on the night of 30 December and is back on 1 January. You choose a shared tent or a 4-share room, and you choose Pune or Mumbai as the departure city. The fee on this page is the full per-person price for that combination.",
};

export const nyeBeachHistory =
  "This is a seasonal Gadvede batch, not a fort trek. The two nights are at a beach campsite with the group, a bonfire, and simple meals. Daytime is free time on the beach with the coordinator nearby. There is no separate sightseeing ticket in the fee.";

export const nyeBeachHighlights = [
  { icon: "🌙", text: "Leave 30 December at night, back on 1 January" },
  { icon: "⛺", text: "Shared tent or a 4-share room — pick one when you book" },
  { icon: "🚌", text: "Pune and Mumbai departures, each with its own fee" },
  { icon: "🔥", text: "Bonfire with the group on both evenings" },
  { icon: "🍽️", text: "Dinner, breakfast, and a simple lunch as listed below" },
];

export const nyeBeachEventDetails = {
  difficulty: "Easy",
  endurance: "Easy",
  baseVillage: "Beach campsite",
  region: "Konkan coast",
  duration: "30 December night to 1 January",
  climbTime: "No trek. Beach stay.",
  distance: "Bus from Pune or Mumbai",
  bestTime: "This batch only: night of 30 December through 1 January",
  minGroup: "Book on WhatsApp so we can hold the tent or room",
};

export const nyeBeachPricing = {
  tentPune: { label: "Tent · Pune departure", price: 2800 },
  tentMumbai: { label: "Tent · Mumbai departure", price: 3000 },
  sharePune: { label: "4-share room · Pune departure", price: 3500 },
  shareMumbai: { label: "4-share room · Mumbai departure", price: 3700 },
};

export const nyeBeachWhyJoin = [
  { icon: "📅", title: "Dates are fixed", desc: "Out on the night of 30 December, back on 1 January. No other dates on this batch." },
  { icon: "🛏️", title: "Two stay types", desc: "Tent is the lower fee. The 4-share room costs more and is confirmed only if a bed is free." },
  { icon: "💬", title: "City is part of the fee", desc: "Tell us Pune or Mumbai on WhatsApp before you pay. The prices above already include that bus." },
];

export const nyeBeachItineraries = {
  pune: {
    label: "From Pune",
    sublabel: "Tent ₹2,800 · 4-share room ₹3,500",
    icon: "🚌",
    note: "Pune fees: tent ₹2,800 per person, 4-share room ₹3,500 per person. Say which stay you want when you message us.",
    days: [
      {
        title: "30 December — night departure",
        events: [
          { time: "Night", desc: "Board the Pune bus. Reporting time and the stop are sent on WhatsApp the day before." },
          { time: "Late night", desc: "Reach the beach camp, check into the tent or 4-share room, and join the bonfire." },
        ],
      },
      {
        title: "31 December — beach day",
        events: [
          { time: "Morning", desc: "Breakfast at camp." },
          { time: "Day", desc: "Free time on the beach. The coordinator stays at camp." },
          { time: "Evening", desc: "Dinner and the New Year bonfire with the group. Lights out after midnight." },
        ],
      },
      {
        title: "1 January — return",
        events: [
          { time: "Morning", desc: "Breakfast and checkout." },
          { time: "Afternoon", desc: "Bus back to Pune. Arrival is in the evening." },
        ],
      },
    ],
  },
  mumbai: {
    label: "From Mumbai",
    sublabel: "Tent ₹3,000 · 4-share room ₹3,700",
    icon: "🚌",
    note: "Mumbai fees: tent ₹3,000 per person, 4-share room ₹3,700 per person. The extra amount is the longer bus ride.",
    days: [
      {
        title: "30 December — night departure",
        events: [
          { time: "Night", desc: "Board the Mumbai bus. The stop and time are confirmed on WhatsApp." },
          { time: "Late night", desc: "Reach camp, move into the tent or 4-share room, and join the bonfire." },
        ],
      },
      {
        title: "31 December — beach day",
        events: [
          { time: "Morning", desc: "Breakfast at camp." },
          { time: "Day", desc: "Beach time with the group. No extra sightseeing is included." },
          { time: "Evening", desc: "Dinner and the New Year bonfire." },
        ],
      },
      {
        title: "1 January — return",
        events: [
          { time: "Morning", desc: "Breakfast and checkout." },
          { time: "Afternoon", desc: "Bus back to Mumbai. Arrival is at night." },
        ],
      },
    ],
  },
};

export const nyeBeachInclusions = [
  "Pune or Mumbai return bus for the city you book",
  "Stay for the night of 30 December and the night of 31 December",
  "Shared tent, or a bed in a 4-share room if you book that option",
  "Dinner on 30 December and 31 December",
  "Breakfast on 31 December and 1 January",
  "One simple lunch on 31 December",
  "Bonfire on both evenings",
  "On-ground coordinator",
];

export const nyeBeachExclusions = [
  "Personal drinks, snacks, and any meal not listed above",
  "Water sports or paid beach activities",
  "A private room or a couple tent. This batch is tent or 4-share only.",
  "Travel insurance and personal medical costs",
];

export const nyeBeachThingsToCarry = [
  "Government photo ID",
  "Warm layer for the night bus and the beach wind",
  "Torch",
  "Personal medicines",
  "Sunscreen, cap, and a towel",
  "Slip-on footwear for the sand, and closed shoes for the bus",
  "A light blanket if you feel cold in a tent",
  "Cash for anything that is not in the inclusion list",
];

export const nyeBeachBookingSteps = [
  'Tap "Book on WhatsApp"',
  "Say tent or 4-share, Pune or Mumbai, and the number of people",
  "We confirm the fee from the price list and whether that stay is free",
  "Pay only after the chat confirmation",
  "Bus timing and the camp contact come on WhatsApp before 30 December",
];
