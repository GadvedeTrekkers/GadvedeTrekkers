/* Original Gadvede copy for Vasota Fort Trek. */

export const vasotaOverview = {
  tagline: "Koyna forest fort · boat across Shivsagar · 2 days",
  subtitle: "Pune ₹1,800 · Mumbai ₹3,200 per person",
  intro:
    "Vasota is a forest fort inside the Koyna Wildlife Sanctuary. Gadvede runs it as a two-day trip with a night in tents at Bamnoli, a shared boat across the Shivsagar backwaters, and a guided walk to the fort. You do not arrange the boat, the forest entry, or the return bus yourself.",
};

export const vasotaHistory =
  "Vasota stands in the Koyna forests above the Shivsagar reservoir. The approach is by boat from Bamnoli because the old land route now sits under the backwaters. What remains on the hill are fort walls, a small temple, and viewpoints over the lake. The sanctuary around the trail is a protected forest, so the group stays on the permitted path and comes back the same day.";

export const vasotaHighlights = [
  { icon: "⛵", text: "Shared boat from Bamnoli across Shivsagar" },
  { icon: "🌲", text: "Walk inside Koyna Wildlife Sanctuary" },
  { icon: "🏯", text: "Vasota fort walls, temple, and lake views" },
  { icon: "⛺", text: "Night in shared tents at the Bamnoli campsite" },
  { icon: "🔥", text: "Bonfire at camp after the boat ride" },
  { icon: "🚌", text: "Pune or Mumbai return transport with the group" },
];

export const vasotaEventDetails = {
  difficulty: "Medium",
  endurance: "Medium",
  baseVillage: "Bamnoli",
  region: "Koyna, Satara",
  duration: "2 days, 1 night",
  climbTime: "About 3 hours on the forest trail after the boat",
  distance: "Boat crossing plus a short forest climb",
  altitude: "About 1,170 m",
  driveFromPune: "About 5 to 6 hours by the group bus",
  driveMumbai: "About 7 to 8 hours by the group bus",
  sanctuary: "Koyna Wildlife Sanctuary",
  bestTime: "October to February. Monsoon boats can be cancelled.",
};

export const vasotaPricing = {
  pune: { label: "Pune departure", price: 1800 },
  mumbai: { label: "Mumbai departure", price: 3200 },
};

export const vasotaWhyJoin = [
  { icon: "⛵", title: "Boat is arranged", desc: "The Shivsagar crossing is part of the trip. You do not hire a boat on the spot." },
  { icon: "⛺", title: "Camp is included", desc: "Shared tents at Bamnoli, with dinner and the next morning's breakfast." },
  { icon: "🧭", title: "One leader for the trail", desc: "The same Gadvede leader stays with the group from the bus to the fort and back." },
];

export const vasotaItineraries = {
  pune: {
    label: "From Pune",
    sublabel: "Pune to Pune · ₹1,800",
    icon: "🚌",
    note: "Fee is ₹1,800 per person from Pune. Exact pickup points are confirmed on WhatsApp after you book.",
    days: [
      {
        title: "Day 1 — leave Pune",
        events: [
          { time: "Evening", desc: "Board the Gadvede bus in Pune. Pickup time and stop are sent on WhatsApp." },
          { time: "Night", desc: "Travel to Bamnoli. Reach the campsite, set up in shared tents, and join the bonfire." },
        ],
      },
      {
        title: "Day 2 — boat, fort, return",
        events: [
          { time: "Early morning", desc: "Tea and breakfast at camp." },
          { time: "Morning", desc: "Shared boat across Shivsagar to the forest trail." },
          { time: "Late morning", desc: "Walk to Vasota fort. Time at the temple and the lake viewpoint, then return to the boat." },
          { time: "Afternoon", desc: "Veg lunch, then the bus back to Pune. Arrival is in the evening." },
        ],
      },
    ],
  },
  mumbai: {
    label: "From Mumbai",
    sublabel: "Mumbai to Mumbai · ₹3,200",
    icon: "🚌",
    note: "Fee is ₹3,200 per person from Mumbai. The higher fee covers the longer bus ride. Pickup is confirmed on WhatsApp.",
    days: [
      {
        title: "Day 1 — leave Mumbai",
        events: [
          { time: "Afternoon", desc: "Board the Gadvede bus in Mumbai. The stop and reporting time are sent on WhatsApp." },
          { time: "Night", desc: "Travel to Bamnoli. Shared tents and bonfire at the campsite." },
        ],
      },
      {
        title: "Day 2 — boat, fort, return",
        events: [
          { time: "Early morning", desc: "Tea and breakfast at camp." },
          { time: "Morning", desc: "Boat across Shivsagar and the forest walk to Vasota." },
          { time: "Afternoon", desc: "Veg lunch, then the bus back to Mumbai. Arrival is at night." },
        ],
      },
    ],
  },
};

export const vasotaInclusions = [
  "Pune to Pune or Mumbai to Mumbai bus, depending on the departure you book",
  "Shared tent stay at Bamnoli (about 3 people per tent)",
  "Evening snacks and veg dinner on day 1",
  "Morning tea and breakfast on day 2",
  "One veg lunch on day 2",
  "Shared boat across Shivsagar",
  "Forest entry permission",
  "Trek leader and basic first aid",
];

export const vasotaExclusions = [
  "Camera fee at the forest check-post, if you carry a camera",
  "Mineral water and personal snacks beyond the meals listed",
  "Travel insurance",
  "Anything not listed under inclusions",
];

export const vasotaThingsToCarry = [
  "Government photo ID",
  "Trekking shoes with grip, plus a spare pair of footwear",
  "2 to 3 litres of water",
  "Cap, sunscreen, and sunglasses",
  "Light sweater or rain layer, depending on the month",
  "Extra T-shirt and a small towel",
  "Bedsheet or light blanket for the tent",
  "Torch or headlamp",
  "Personal medicines",
  "A small backpack. Avoid loose shoulder bags on the boat.",
];

export const vasotaBookingSteps = [
  'Tap "Book on WhatsApp"',
  "Tell us Pune or Mumbai, the date, and how many people",
  "We reply in the same chat with the seat and the exact fee",
  "Pay only after that confirmation",
  "Pickup point and the group link come on WhatsApp before departure",
];
