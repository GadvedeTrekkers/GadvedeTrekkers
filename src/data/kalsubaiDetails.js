/* ── KALSUBAI TREK – Rich Content Data ── */

export const kalsubaiOverview = {
  tagline: "Highest Peak of Maharashtra — 5400 Ft",
  subtitle: "The Everest of Maharashtra",
  intro: `Kalsubai Peak (1646 m / 5400 ft) is the highest peak in Maharashtra, nestled in the Sahyadri range inside the Kalsubai Harishchandragad Wildlife Sanctuary. Steel railings, chains, and ladders at difficult sections make this trek accessible for beginners and thrilling for veterans alike.`,
  nightTrek: `Embark on an unforgettable night trek to Mount Kalsubai — experience the magic of walking under a blanket of millions of stars, guided by the soft glow of moonlight and the Milky Way. The trail begins from Bari Village, winding through farmlands, rocky patches, and sturdy ladders. Reaching the summit just before dawn rewards you with one of the most breathtaking sunrises in the Sahyadris. Seek blessings at the Kalsubai Temple dedicated to the local goddess who guards the peak.`,
  monsoon: `During monsoon, the entire mountain is draped in emerald green, covered in mist and fog. Three ladders installed by locals mark the trail milestones — after the carved steps and first ladder you have completed 1/3 of the trek; after the final ladder, 2/3 is done. A plateau walk leads to the summit ladder.`,
};

export const kalsubaiHistory = `Kalsubai is named after a local woman named Kalsu who is believed to have lived on the peak and the goddess Kalsubai who is worshipped at the small temple at the summit. Legends say Kalsu was a devoted woman whose spirit guards the mountain. The peak lies within the Kalsubai Harishchandragad Wildlife Sanctuary, one of Maharashtra's most biodiverse protected areas. The fort-like peak has historically served as a strategic vantage point offering panoramic views of Bhandardara Dam, Arthur Lake, and the surrounding Sahyadri ranges.`;

export const kalsubaiHighlights = [
  { icon: "🏔", text: "Highest Peak in Maharashtra — 1646m / 5400 ft" },
  { icon: "🌟", text: "Walk under the Milky Way on a Night Trek" },
  { icon: "🌅", text: "Witness Breathtaking Sahyadri Sunrise" },
  { icon: "⛩️", text: "Seek Blessings at the Kalsubai Temple" },
  { icon: "🦅", text: "Inside Kalsubai Harishchandragad Wildlife Sanctuary" },
  { icon: "🪜", text: "3 Iron Ladders — Safe for Beginners" },
  { icon: "🎖️", text: "E-Certificates on Successful Completion" },
  { icon: "🍱", text: "Veg Thali + Jain Food Available at Base" },
];

export const kalsubaiEventDetails = {
  difficulty: "Medium",
  endurance: "High",
  baseVillage: "Bari Village",
  region: "Igatpuri / Bhandardara",
  duration: "1 Night, 1 Day",
  climbTime: "3.5 – 4 hours one way",
  distance: "5.5 km one way",
  altitude: "1646 m (5400 ft)",
  minGroup: "6 pax",
  sanctuary: "Kalsubai Harishchandragad Wildlife Sanctuary",
};

export const kalsubaiPricing = {
  pune: { label: "Pune departure", price: 1400 },
  kasara: { label: "Kasara departure", price: 1400 },
};

export const kalsubaiWhyJoin = [
  { icon: "🤝", title: "Like-Minded Community", desc: "Hike with fun, safe group of fellow adventure lovers" },
  { icon: "🌅", title: "Stunning Sunrise", desc: "Witness Maharashtra's most breathtaking Sahyadri sunrise" },
  { icon: "🌌", title: "Night Sky & Milky Way", desc: "Trek under a million stars, spot the Milky Way" },
  { icon: "🍽️", title: "Meals Included", desc: "Hassle-free travel with breakfast and veg lunch included" },
];

export const kalsubaiItineraries = {
  kasara: {
    label: "By Train",
    sublabel: "Kasara Route",
    icon: "🚂",
    note: "Train ticket not included. People may board from any station of convenience. Missing the train = missing the trek (no refund).",
    days: [
      {
        title: "Day 0 — Friday Night",
        events: [
          { time: "08:44 pm", desc: "Depart CSMT" },
          { time: "08:51 pm", desc: "Byculla" },
          { time: "08:58 pm", desc: "Dadar" },
          { time: "09:07 pm", desc: "Kurla" },
          { time: "09:11 pm", desc: "Ghatkopar" },
          { time: "09:26 pm", desc: "Thane" },
          { time: "09:42 pm", desc: "Dombivali" },
          { time: "09:52 pm", desc: "Kalyan" },
          { time: "11:04 pm", desc: "Arrive Kasara" },
          { time: "11:15 pm", desc: "Assemble at Kasara Railway Station (near ticket counter)" },
          { time: "11:20 pm", desc: "Travel by Local Jeep to Bari Village" },
        ],
      },
      {
        title: "Day 1 — Saturday",
        events: [
          { time: "02:30 am", desc: "Reach Bari Village — Introduction & briefing" },
          { time: "03:00 am", desc: "Start ascending the trek" },
          { time: "06:30 am", desc: "Reach Kalsubai Summit — Explore, temple darshan, sunrise" },
          { time: "08:00 am", desc: "Breakfast at summit area" },
          { time: "09:00 am", desc: "Begin descent" },
          { time: "12:00 pm", desc: "Reach Bari Village — Lunch (veg thali / Jain food)" },
          { time: "01:00 pm", desc: "Jeep back to Kasara Railway Station" },
          { time: "03:00 pm", desc: "Reach Kasara Station — Disperse" },
        ],
      },
    ],
  },
  mumbai: {
    label: "By Bus",
    sublabel: "Mumbai Route",
    icon: "🚌",
    note: "Please arrive 10–15 mins early at your pickup stop. Road conditions may cause delays on return.",
    days: [
      {
        title: "Day 0 — Saturday Night",
        events: [
          { time: "07:45 pm", desc: "Meet at Borivali National Park Main Gate" },
          { time: "08:00 pm", desc: "Bus departs" },
          { time: "08:10 pm", desc: "Pickup — Virwani Bus Stop, Goregaon" },
          { time: "08:30 pm", desc: "Pickup — Gundavali Bus Stop, Andheri East" },
          { time: "08:45 pm", desc: "Pickup — Kalanagar Bus Stop, Bandra" },
          { time: "09:00 pm", desc: "Pickup — Everard Nagar, Sion" },
          { time: "09:10 pm", desc: "Pickup — Amar Mahal, Ghatkopar" },
          { time: "09:30 pm", desc: "Pickup — Teen Hath Naka, Thane" },
          { time: "10:00 pm", desc: "Pickup — Kalyan Bypass" },
        ],
      },
      {
        title: "Day 1 — Sunday",
        events: [
          { time: "02:00 am", desc: "Reach Bari Village" },
          { time: "02:30 am", desc: "Introduction, tea & biscuits at base" },
          { time: "03:00 am", desc: "Start ascending" },
          { time: "06:30 am", desc: "Reach Kalsubai Summit — Explore & sunrise" },
          { time: "08:00 am", desc: "Breakfast" },
          { time: "09:00 am", desc: "Begin descent" },
          { time: "12:00 pm", desc: "Reach Bari — Lunch (veg thali / Jain food)" },
          { time: "01:30 pm", desc: "Start return journey to Mumbai" },
          { time: "08:00 pm", desc: "Approx. arrival Mumbai (delays expected)" },
        ],
      },
    ],
  },
  pune: {
    label: "From Pune",
    sublabel: "Pune Route",
    icon: "🚌",
    note: "Transport as per participant count. Date transfer within 3 days of departure: ₹200/person.",
    days: [
      {
        title: "Day 0 — Saturday Night",
        events: [
          { time: "07:45 pm", desc: "Meet at McDonald's, Deccan" },
          { time: "08:00 pm", desc: "Move towards base village" },
          { time: "08:20 pm", desc: "Pickup — New Shivajinagar Bus Stop" },
          { time: "08:40 pm", desc: "Pickup — Nashik Phata" },
        ],
      },
      {
        title: "Day 1 — Sunday",
        events: [
          { time: "03:00 am", desc: "Reach Bari Village — Introduction" },
          { time: "03:30 am", desc: "Start ascending" },
          { time: "07:00 am", desc: "Reach Kalsubai Summit — Explore & sunrise" },
          { time: "08:00 am", desc: "Breakfast" },
          { time: "08:30 am", desc: "Begin descent" },
          { time: "11:30 am", desc: "Reach Bari Village — Lunch (veg thali / Jain food)" },
          { time: "01:00 pm", desc: "Start return journey to Pune" },
          { time: "08:00 pm", desc: "Approx. arrival Pune (delays expected)" },
        ],
      },
    ],
  },
};

export const kalsubaiBookingSteps = [
  'Tap "Book on WhatsApp"',
  "WhatsApp opens with the trek name, date, and fee filled in",
  "Send the message and mention travellers or a coupon if you have one",
  "We confirm your seat in the same chat",
  "Pay only after the team confirms on WhatsApp",
  "Booking confirmation comes back on WhatsApp",
  "WhatsApp group link sent 8 hours before departure",
  "Trek leader details shared on the WhatsApp group",
];
