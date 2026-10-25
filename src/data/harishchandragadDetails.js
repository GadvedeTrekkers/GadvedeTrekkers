/* ── HARISHCHANDRAGAD TREK – Rich Content Data ── */

export const harishchandragadOverview = {
  tagline: "Medieval Hill Fort — 4650 Ft | Konkan Kada | Kedareshwar Cave",
  subtitle: "The Most Scenic Route: Harishchandragad Trek and Camping",
  intro: `Harishchandragad is one of the best high forts near Mumbai, Maharashtra. Strong fortifications of this fort have multiple entry routes such as the Junnar gate route, Sadhale ghat, Nalichi wat, and Indore waat. Its ancient rock-cut temples, sacred caves, and the breathtaking Kokankada cliff make it an unforgettable destination in the Sahyadris.`,
  history: `The carvings on the temples of Nageshwar (in Khireshwar village), in the Harishchandreshwar temple and in the cave of Kedareshwar indicate that the fort belongs to the medieval period since it is related to Shaiva, Shakta or Naath. Later the fort was under the control of Mughals. The Marathas captured it in 1747.`,
  mainAttractions: `Main attractions on Fort: Sapta Tirta Pushkarini, Kedareshwar Cave, Konkan Kada (Konkan cliff), Taramati peak, Temple of Harishchandreshwar.`,
};

export const harishchandragadHistory = `Harishchandragad's history is linked with that of Malshej Ghat, Kothale village, and it has played a major role in guarding and controlling the surrounding region. The fort's rock carvings at Harishchandreshwar temple and the Nageshwar temple in Khireshwar village indicate medieval origins tied to Shaiva, Shakta, and Naath traditions. The Marathas captured it from the Mughals in 1747. Today it forms part of the Kalsubai Harishchandragad Wildlife Sanctuary, one of Maharashtra's most biodiverse protected areas. The fort's famous Kedareshwar Cave houses a massive Shiva Linga surrounded by ice-cold waist-deep water — four pillars once surrounded the linga, and locals believe the remaining one represents the Kali Yuga.`;

export const harishchandragadHighlights = [
  { icon: "🏔", text: "4650 Ft High — One of the Best Forts Near Mumbai" },
  { icon: "🌅", text: "Konkan Kada — Breathtaking Westward Cliff" },
  { icon: "⛩️", text: "Ancient Harishchandreshwar Temple" },
  { icon: "🕉️", text: "Kedareshwar Cave — Shiva Linga in Ice-Cold Water" },
  { icon: "💧", text: "Sapta Tirtha Pushkarini — Sacred Lake" },
  { icon: "🦅", text: "Inside Kalsubai Harishchandragad Wildlife Sanctuary" },
  { icon: "🎖️", text: "E-Certificate on Successful Completion" },
  { icon: "🍱", text: "Day 1: Evening Tea + Veg Dinner | Day 2: Breakfast + Veg Lunch" },
];

export const harishchandragadEventDetails = {
  difficulty: "Medium",
  endurance: "Medium",
  baseVillage: "Pachnai Village",
  region: "Igatpuri, Ahmednagar, Junnar",
  duration: "1 Night, 2 Days",
  climbTime: "2–2.5 hours uphill one way from Pachnai Village",
  distance: "5 km uphill from Pachnai Village",
  altitude: "1424 m (4650 ft)",
  driveFromPune: "170 km one way",
  sanctuary: "Kalsubai Harishchandragad Wildlife Sanctuary",
};

export const harishchandragadPricing = {
  kasara: { label: "By Train — Kasara to Kasara (Mumbai Participants)", price: 2299 },
  pune:   { label: "From Pune — Pune to Pune (Private Non-AC Vehicle)", price: 2299 },
};

export const harishchandragadWhyJoin = [
  { icon: "🤝", title: "Safe Group Environment", desc: "60–40% male-female ratio; solo travellers always welcome" },
  { icon: "🌅", title: "Kokankada Sunset & Sunrise", desc: "Watch breathtaking views from Maharashtra's most dramatic cliff edge" },
  { icon: "🕉️", title: "Sacred Cave Experience", desc: "Enter the Kedareshwar Cave with its ancient Shiva Linga in ice-cold water" },
  { icon: "🍽️", title: "Meals Included", desc: "Evening tea, veg dinner (Day 1) + breakfast and veg lunch (Day 2)" },
];

export const harishchandragadItineraries = {
  kasara: {
    label: "From Mumbai",
    sublabel: "Kasara Train Route",
    icon: "🚂",
    note: "People may board the same train from their respective stations of convenience. Missing the train = missing the trek — no refund will be provided.",
    days: [
      {
        title: "Day 1 — Saturday",
        events: [
          { time: "06:55 am", desc: "Depart CSMT" },
          { time: "07:02 am", desc: "Byculla" },
          { time: "07:08 am", desc: "Dadar" },
          { time: "07:15 am", desc: "Kurla" },
          { time: "07:34 am", desc: "Thane" },
          { time: "07:49 am", desc: "Dombivali" },
          { time: "07:57 am", desc: "Kalyan" },
          { time: "09:14 am", desc: "Arrive Kasara" },
          { time: "09:15 am", desc: "Meeting at Kasara Railway Station" },
          { time: "09:30 am", desc: "Move towards base village by private local vehicle" },
          { time: "—",        desc: "Breakfast on the way" },
          { time: "02:00 pm", desc: "Reach base village — Lunch" },
          { time: "03:00 pm", desc: "Start ascending" },
          { time: "05:30 pm", desc: "Reach the top — Enjoy sunset at Kokankada" },
          { time: "09:00 pm", desc: "Dinner" },
        ],
      },
      {
        title: "Day 2 — Sunday",
        events: [
          { time: "04:30 am", desc: "Wake up and freshen up" },
          { time: "05:00 am", desc: "Start trek towards Taramati Shikhar (weather & time permitting)" },
          { time: "07:00 am", desc: "Start descending from Taramati Shikhar" },
          { time: "08:00 am", desc: "Back to Kokankada" },
          { time: "08:30 am", desc: "Breakfast" },
          { time: "09:00 am", desc: "Start descending — Visit Harishchandreshwar Temple, Kedareshwar Temple, Pushkarani, Caves" },
          { time: "12:30 pm", desc: "Reach base village" },
          { time: "01:00 pm", desc: "Lunch" },
          { time: "02:00 pm", desc: "Start return journey to Kasara" },
          { time: "06:00 pm", desc: "Reach Kasara station — Disperse" },
        ],
      },
    ],
  },
  pune: {
    label: "From Pune",
    sublabel: "Pune Route",
    icon: "🚌",
    note: "Transport as per participant count only. Date transfer within 3 days of departure: ₹200/person.",
    days: [
      {
        title: "Day 1 — Saturday",
        events: [
          { time: "08:15 am", desc: "Meet at McDonald's, Deccan" },
          { time: "08:30 am", desc: "Move towards base village" },
          { time: "08:50 am", desc: "Pickup — New Shivaji Nagar Bus Stop" },
          { time: "09:10 am", desc: "Pickup — Nashik Phata" },
          { time: "02:00 pm", desc: "Reach base village — Lunch" },
          { time: "03:00 pm", desc: "Start ascending" },
          { time: "05:30 pm", desc: "Reach the top — Enjoy sunset at Kokankada" },
          { time: "09:00 pm", desc: "Dinner" },
        ],
      },
      {
        title: "Day 2 — Sunday",
        events: [
          { time: "04:30 am", desc: "Wake up and freshen up" },
          { time: "05:00 am", desc: "Start trek towards Taramati Shikhar (weather & time permitting)" },
          { time: "07:00 am", desc: "Start descending from Taramati Shikhar" },
          { time: "08:00 am", desc: "Back to Kokankada" },
          { time: "08:30 am", desc: "Breakfast" },
          { time: "09:00 am", desc: "Start descending — Visit Harishchandreshwar Temple, Kedareshwar Temple, Pushkarani, Caves" },
          { time: "12:30 pm", desc: "Reach base village" },
          { time: "01:00 pm", desc: "Lunch" },
          { time: "02:00 pm", desc: "Start return journey to Pune" },
          { time: "08:00 pm", desc: "Approx. arrival at Pune" },
        ],
      },
    ],
  },
};

export const harishchandragadPlacesToVisit = [
  {
    name: "Harishchandragad Konkan Kada",
    desc: "A spectacular cliff facing west offering sweeping views of the surrounding region. The cliff has an overhang and on misty days a rare circular rainbow can be seen from this point. During monsoon, vertical cloud bursts shoot upward from the valley below. One of Maharashtra's most dramatic viewpoints.",
    icon: "🪨",
  },
  {
    name: "Saptatirtha Pushkarni",
    desc: "A beautiful small lake on the east side of Harishchandreshwar temple, originally a potable source of drinking water. Several lakeside idols of Vishnu and other deities have been moved to nearby caves for protection. Locals swim here during monsoon season.",
    icon: "💧",
  },
  {
    name: "Kedareshwar Cave",
    desc: "A huge cave housing a massive Shiva Linga standing five feet tall, surrounded by ice-cold waist-deep water. The cave is the origin of River Mangalganga. Four pillars once enclosed the linga — locals believe them to represent the four yugas (Satya, Treta, Dvapara, Kali). Only one pillar remains standing.",
    icon: "🕉️",
  },
  {
    name: "Caves on Harishchandragad",
    desc: "Natural caves scattered across the fort provide shelter for trekkers. The most magnificent cave is situated on a hillside near Saptatirtha Pushkarni — 30 feet deep with many entrances. Earlier trekkers would stay in these caves during monsoon and winters.",
    icon: "🏔",
  },
  {
    name: "Pachnai Village",
    desc: "The base village at 2592 ft above sea level, 210 km from Mumbai. During monsoon it is surrounded by beautiful waterfalls and rice fields. Pre-monsoon is famous for firefly spotting. Local villagers run restaurants and dhabas serving trekkers. Ample parking available (parking fee applies).",
    icon: "🏘",
  },
];

export const harishchandragadInclusions = [
  "✅ Day 1: 1 evening tea, 1 veg dinner",
  "✅ Day 2: 1 breakfast, 1 veg lunch",
  "✅ Kasara to Kasara travel by local jeep (Mumbai Participants)",
  "✅ Pune to Pune travel by private non-AC vehicle (Pune Participants)",
  "✅ Tent stay on multi-sharing basis (Triple / Quad)",
  "✅ Expert trek leader",
  "✅ E-certificate on completion",
  "✅ WhatsApp group coordination",
];

export const harishchandragadExclusions = [
  "❌ Travel till Kasara and back (Mumbai Participants)",
  "❌ Breakfast on Day 1",
  "❌ Mineral water / soft drinks / personal consumption items",
  "❌ All kinds of extra meals / soft drinks ordered",
  "❌ Any kind of personal expenses",
  "❌ Costs due to unforeseen circumstances (roadblocks, bad weather)",
  "❌ Medical / emergency evacuation costs",
];

export const harishchandragadThingsToCarry = [
  "2–3 litres of water",
  "Trekking shoes (mandatory — sandals/running shoes not allowed)",
  "Good torch with extra batteries (compulsory per person)",
  "Sleeping material (sleeping bag or 2 bedsheets)",
  "Jacket / warm layer, cap, muffler",
  "A haversack (no jholas or side bags)",
  "Extra pair of clothes, napkin",
  "Dry fruits, energy bars, snacks",
  "Glucon D / ORS / Tang / Gatorade sachets",
  "Sun cap and sunscreen",
  "Personal first aid and medicines",
  "Identity proof",
  "Full sleeves + full track pants (Sun / Thorns / Insects)",
];

export const harishchandragadDiscountCodes = [
  { code: "GD75",    desc: "Save on group of 7 and more" },
  { code: "GD50",    desc: "Save on group of 5 and more" },
  { code: "EARLY75", desc: "Early Booking Discount" },
];

export const harishchandragadBookingSteps = [
  'Tap "Book on WhatsApp"',
  "WhatsApp opens with the trek name, date, and fee filled in",
  "Send the message and mention travellers or a coupon if you have one",
  "We confirm your seat in the same chat",
  "Pay only after the team confirms on WhatsApp",
  "Booking confirmation comes back on WhatsApp",
  "WhatsApp group link sent 8 hours before departure",
  "Trek leader and event details shared on WhatsApp group",
];
