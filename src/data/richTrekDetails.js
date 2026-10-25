import {
  kalsubaiOverview,
  kalsubaiHistory,
  kalsubaiHighlights,
  kalsubaiEventDetails,
  kalsubaiPricing,
  kalsubaiWhyJoin,
  kalsubaiItineraries,
  kalsubaiBookingSteps,
} from "./kalsubaiDetails";
import {
  vasotaOverview,
  vasotaHistory,
  vasotaHighlights,
  vasotaEventDetails,
  vasotaPricing,
  vasotaWhyJoin,
  vasotaItineraries,
  vasotaInclusions,
  vasotaExclusions,
  vasotaThingsToCarry,
  vasotaBookingSteps,
} from "./vasotaDetails";
import {
  nyeBeachOverview,
  nyeBeachHistory,
  nyeBeachHighlights,
  nyeBeachEventDetails,
  nyeBeachPricing,
  nyeBeachWhyJoin,
  nyeBeachItineraries,
  nyeBeachInclusions,
  nyeBeachExclusions,
  nyeBeachThingsToCarry,
  nyeBeachBookingSteps,
} from "./nyeBeachDetails";
import {
  harishchandragadOverview,
  harishchandragadHistory,
  harishchandragadHighlights,
  harishchandragadEventDetails,
  harishchandragadPricing,
  harishchandragadWhyJoin,
  harishchandragadItineraries,
  harishchandragadBookingSteps,
  harishchandragadPlacesToVisit,
  harishchandragadInclusions,
  harishchandragadExclusions,
  harishchandragadThingsToCarry,
  harishchandragadDiscountCodes,
} from "./harishchandragadDetails";

const commonCarryItems = [
  "ID proof",
  "Backpack with waterproof cover",
  "Trekking shoes or sports shoes with good grip",
  "Trekking pants and extra T-shirt",
  "Water bottle (2-3 litres)",
  "Dry snacks, energy bars, and ready-to-eat food",
  "Torch",
  "Personal medicines and first aid",
  "Rainwear / windcheater",
  "Cap, sunglasses, and sunscreen",
  "Power bank and phone charger",
  "Extra pair of clothes",
];

export const richTrekDetails = {
  "Kalsubai Trek": {
    heroKicker: "🏔 Maharashtra's Highest Peak",
    meta: {
      title: "Kalsubai Trek 2025 | Highest Peak Maharashtra | Night Trek | Gadvede Trekkers",
      description:
        "Book Kalsubai Trek — Maharashtra's highest peak (5400 ft). Night trek from Mumbai, Pune & Kasara. Sunrise, Milky Way, Temple darshan. Starting ₹799. Expert guides, safe batches.",
      keywords:
        "Kalsubai trek booking, Kalsubai night trek, highest peak Maharashtra, Kalsubai from Mumbai, Kalsubai from Pune, Kalsubai from Kasara, Bari village trek, Sahyadri trek 2025",
    },
    overview: {
      tagline: kalsubaiOverview.tagline,
      subtitle: kalsubaiOverview.subtitle,
      intro: kalsubaiOverview.intro,
      sections: [
        { title: "Kalsubai Night Trek", body: kalsubaiOverview.nightTrek },
        { title: "Kalsubai Monsoon Trek", body: kalsubaiOverview.monsoon },
      ],
    },
    history: kalsubaiHistory,
    historyTitle: "History & Legend",
    highlights: kalsubaiHighlights,
    eventDetails: kalsubaiEventDetails,
    pricing: kalsubaiPricing,
    whyJoin: kalsubaiWhyJoin,
    itineraries: kalsubaiItineraries,
    bookingSteps: kalsubaiBookingSteps,
    inclusions: [
      "Expert certified trek leader",
      "Breakfast at summit",
      "Veg lunch at base village",
      "Local jeep from Kasara for train batch",
      "First aid support",
      "E-certificate on completion",
      "WhatsApp group coordination",
    ],
    exclusions: ["Train ticket for self-travel participants", "Personal expenses"],
    thingsToCarry: commonCarryItems,
  },
  "Harishchandragad Trek": {
    heroKicker: "🏔 Ancient Hill Fort — Konkan Kada",
    meta: {
      title: "Harishchandragad Trek 2025 | Konkan Kada | Kedareshwar Cave | Gadvede Trekkers",
      description:
        "Book Harishchandragad Trek from Pune 2025. Night trek to Maharashtra's iconic hill fort — Konkan Kada, Kedareshwar Cave, Harishchandreshwar Temple. ₹1,449/person. Expert guides, safe batches.",
      keywords:
        "Harishchandragad trek, Harishchandragad from Pune, Konkan Kada, Kedareshwar cave, Pachnai village trek, Harishchandragad 2025, Maharashtra fort trek",
    },
    overview: {
      tagline: harishchandragadOverview.tagline,
      subtitle: harishchandragadOverview.subtitle,
      intro: harishchandragadOverview.intro,
      sections: [
        { title: "History & Significance", body: harishchandragadOverview.history },
        { title: "Main Attractions", body: harishchandragadOverview.mainAttractions },
      ],
    },
    history: harishchandragadHistory,
    historyTitle: "Detailed History",
    highlights: harishchandragadHighlights,
    eventDetails: harishchandragadEventDetails,
    pricing: harishchandragadPricing,
    whyJoin: harishchandragadWhyJoin,
    itineraries: harishchandragadItineraries,
    bookingSteps: harishchandragadBookingSteps,
    placesToVisit: harishchandragadPlacesToVisit,
    inclusions: harishchandragadInclusions.map((item) => item.replace(/^[^\s]+\s*/, "")),
    exclusions: harishchandragadExclusions.map((item) => item.replace(/^[^\s]+\s*/, "")),
    thingsToCarry: harishchandragadThingsToCarry,
    discountCodes: harishchandragadDiscountCodes,
  },
  "Harihar Trek": {
    heroKicker: "🏰 Trekking Harihar Fort | Mumbai",
    meta: {
      title: "Harihar Fort Trek | Mumbai | Gadvede Trekkers",
      description:
        "Book Harihar Fort Trek from Mumbai. Experience the famous 80-degree steps, Sahyadri sunrise, and guided fort climb with breakfast and lunch included.",
      keywords:
        "Harihar Fort trek Mumbai, Harihar trek 2026, Harihar Fort Nirgudpada, Harihar steps trek, Nashik fort trek",
    },
    overview: {
      tagline: "Iconic 80° Steps · 3676 ft · Sunrise Fort Trek",
      subtitle: "A dramatic rock-cut staircase trek in the Nashik region",
      intro:
        "Harihar Fort, also known as Harshagad, is one of Maharashtra's most thrilling fort treks. Located near Trimbakeshwar in Nashik district, the fort is famous for its near-vertical rock-cut staircase, commanding views of the Sahyadri range, and a summit rich in history and atmosphere.",
      sections: [
        {
          title: "Why Harihar Is Special",
          body:
            "From the base village, Harihar Fort appears to sit on a rectangular hill, but the fort itself stands on a triangular prism of rock. The final approach over the steep stone steps is the defining moment of the trek and one of the most memorable climbs in Maharashtra.",
        },
        {
          title: "What You See At The Top",
          body:
            "The summit opens to sweeping 360-degree views of nearby forts and peaks such as Bhaskargad, Anjaneri, and Utwad Fort. Trekkers also visit the small temple area with idols of Lord Hanuman, Shiva, and Nandi while enjoying the sunrise over the surrounding valleys.",
        },
      ],
    },
    history:
      "Harihar Fort was an important hill fort built to keep watch over trade routes in the Trimbakeshwar region. Today it is prized less for fortification remains and more for the dramatic approach, the engineering of its staircase, and the panoramic Sahyadri viewpoints from the top.",
    historyTitle: "History & Significance",
    highlights: [
      { icon: "🧗", text: "80-degree rock-cut steps — the signature section of the trek" },
      { icon: "🌅", text: "Sunrise views over the Sahyadri mountain range" },
      { icon: "🏔", text: "3676 ft fort summit near Trimbakeshwar, Nashik" },
      { icon: "⛩️", text: "Temple area with Hanuman, Shiva, and Nandi idols" },
      { icon: "📸", text: "Panoramic views of Bhaskargad, Anjaneri, and Utwad Fort" },
      { icon: "🥾", text: "Medium to difficult trek with thrilling final ascent" },
    ],
    eventDetails: {
      difficulty: "Medium to Difficult",
      endurance: "Medium",
      baseVillage: "Nirgudpada",
      region: "Nashik District, Maharashtra",
      duration: "1 Night 1 Day",
      climbTime: "3.5 hours one way",
      distance: "Approx. 3.5 km one way",
      altitude: "3676 ft",
      driveFromPune: "247 km",
      driveMumbai: "190 km",
      bestTime: "June to February",
    },
    pricing: {
      kasara: { label: "Mumbai (Kasara)", price: 1099 },
      baseVillage: { label: "Base Village", price: 699 },
    },
    whyJoin: [
      { icon: "🪜", title: "Iconic Climb", desc: "Climb one of Maharashtra's most recognizable fort staircases." },
      { icon: "🌄", title: "Sunrise Experience", desc: "Reach the summit in time for early morning views across Nashik's forts." },
      { icon: "🍽️", title: "Meals Included", desc: "Breakfast, tea, and veg lunch are included in the event cost." },
      { icon: "🛡️", title: "Guided Support", desc: "Trek leader, expertise charges, and first aid are part of the package." },
    ],
    itineraries: {
      kasara: {
        label: "From Mumbai",
        sublabel: "Kasara Route",
        icon: "🚂",
        note: "Participants board the CSMT to Kasara local and join the group at Kasara station.",
        days: [
          {
            title: "Day 1",
            events: [
              { time: "08:44 PM", desc: "CSMT" },
              { time: "08:58 PM", desc: "Dadar" },
              { time: "09:11 PM", desc: "Ghatkopar" },
              { time: "09:26 PM", desc: "Thane" },
              { time: "09:52 PM", desc: "Kalyan" },
              { time: "11:04 PM", desc: "Kasara" },
              { time: "11:15 PM", desc: "Report at Kasara Station" },
              { time: "11:45 PM", desc: "Report at Kasara Ghat and proceed after dinner halt" },
            ],
          },
          {
            title: "Day 2",
            events: [
              { time: "02:30 AM", desc: "Reach base village and rest for some time" },
              { time: "04:00 AM", desc: "Freshen up and have breakfast" },
              { time: "04:30 AM", desc: "Start trek to Harihar Fort after briefing" },
              { time: "06:00 AM", desc: "Reach the plateau and continue towards the summit steps" },
              { time: "06:30 AM", desc: "Reach the top and enjoy sunrise views" },
              { time: "08:00 AM", desc: "Start descending via the same route" },
              { time: "12:00 PM", desc: "Reach base village and have lunch" },
              { time: "01:30 PM", desc: "Start return journey for Kasara" },
              { time: "04:30 PM", desc: "Reach Kasara Station" },
            ],
          },
        ],
      },
    },
    bookingSteps: [
      'Tap "Book on WhatsApp".',
      "WhatsApp opens with the trek name, date, and fee filled in.",
      "Send the message so the team can confirm your seat.",
      "Share travellers in the same chat.",
      "Pay only after the team confirms on WhatsApp.",
      "Booking confirmation and event updates come back on WhatsApp.",
    ],
    inclusions: [
      "Travel from Kasara to Kasara by private jeeps",
      "Breakfast and tea",
      "Lunch (veg thali)",
      "Trek guide charges",
      "Entry charges",
      "Trek expertise charges",
      "First aid charges",
    ],
    exclusions: [
      "Travel till pickup point",
      "5% GST",
      "Personal expenses and extra meals",
      "Mineral water and soft drinks",
      "Emergency evacuation or insurance",
      "Any cost not mentioned in inclusions",
    ],
    thingsToCarry: commonCarryItems,
    discountCodes: [{ code: "LOYALTY50", desc: "Old customers enjoy flat 50 off" }],
  },
  "Ratangad Trek": {
    heroKicker: "🌄 Trekking Ratangad Sunrise Trek",
    meta: {
      title: "Ratangad Sunrise Trek | Pune & Mumbai | Gadvede Trekkers",
      description:
        "Book Ratangad Sunrise Trek from Pune or Mumbai. Explore forest trails, ladders, caves, and fort ruins with breakfast, lunch, and guided support included.",
      keywords:
        "Ratangad trek Pune, Ratangad trek Mumbai, Ratangad sunrise trek, Ratanwadi fort trek, Bhandardara fort trek",
    },
    overview: {
      tagline: "Ancient fort trek with caves, ladders, and sunrise views",
      subtitle: "A Sahyadri fort experience blending history and adventure",
      intro:
        "Ratangad, set in the Western Ghats of Maharashtra, is a classic fort trek known for dense forests, rocky climbs, cave shelters, and memorable sunrise views. The route from Ratanwadi takes trekkers through a scenic mix of village trails, woodland sections, and final fort access points aided by iron ladders and railings.",
      sections: [
        {
          title: "Why Trekkers Love Ratangad",
          body:
            "Ratangad combines natural beauty with historical depth. The climb moves from forest trail to fort approach, and the summit rewards trekkers with views of surrounding Sahyadri peaks, Bhandardara Lake, and nearby forts like Alang, Madan, Kulang, and Harishchandragad.",
        },
        {
          title: "Trail Experience",
          body:
            "The trek starts from Ratanwadi, the base village most commonly used for Ratangad. Trekkers pass streams, forested sections, Ganesh Darwaja, caves used for camping, and the final steeper rock patches where railings and ladders help with the climb.",
        },
      ],
    },
    history:
      "Ratangad Fort is one of the notable hill forts of the Sahyadris and remains a favorite among trekkers because of its caves, fort walls, gateways, and commanding views over the Bhandardara region. Its ruins and entrance structures still convey the fort's strategic character.",
    historyTitle: "History & Significance",
    highlights: [
      { icon: "🏰", text: "Ancient fort ruins and the stone Ganesh Darwaja" },
      { icon: "🌅", text: "Sunrise views from the fort top" },
      { icon: "🪜", text: "Trail includes forest sections and iron ladders" },
      { icon: "🏔", text: "Panoramic views of Alang, Madan, Kulang, and Harishchandragad" },
      { icon: "🏕️", text: "Natural caves used by trekkers for resting and camping" },
      { icon: "🌊", text: "Bhandardara Lake vistas from the summit" },
    ],
    eventDetails: {
      difficulty: "Moderate to Difficult",
      endurance: "Medium to High",
      baseVillage: "Ratanwadi",
      region: "Ahmednagar, Maharashtra",
      duration: "1 Night 1 Day",
      climbTime: "4-5 hours to reach the fort",
      distance: "Approx. 6 km",
      altitude: "1296 m (4255 ft)",
      driveFromPune: "175 km",
      driveMumbai: "178 km",
      bestTime: "June to February",
      trailType: "Combination of forest trail and iron ladders",
    },
    pricing: {
      pune: { label: "Pune", price: 1399 },
      kasara: { label: "Mumbai (Kasara)", price: 1399 },
      borivali: { label: "Mumbai (Borivali)", price: 1699 },
      baseVillage: { label: "Base Village", price: 799 },
    },
    whyJoin: [
      { icon: "🌅", title: "Sunrise Summit", desc: "Reach the fort top before dawn and enjoy a rewarding sunrise." },
      { icon: "🧗", title: "Engaging Trail", desc: "The route mixes forest walking, fort entrances, ladders, and rock patches." },
      { icon: "🍽️", title: "Meals Covered", desc: "Breakfast, tea, and veg lunch are included in the trek package." },
      { icon: "📍", title: "Multiple Departure Options", desc: "Choose Pune, Kasara, Borivali, or base village participation." },
    ],
    itineraries: {
      pune: {
        label: "From Pune",
        sublabel: "Pune Route",
        icon: "🚌",
        note: "Friday night departures are preferred to avoid rush. Friday batch needs a minimum of 10 participants.",
        days: [
          {
            title: "Day 1",
            events: [
              { time: "08:00 PM", desc: "Report at FC Road" },
              { time: "08:30 PM", desc: "Pickup from Nashik Phata (Kasarwadi)" },
            ],
          },
          {
            title: "Day 2",
            events: [
              { time: "03:30 AM", desc: "Reach base village and rest for a while" },
              { time: "04:00 AM", desc: "Freshen up, gear up, and start the trek after briefing" },
              { time: "06:00 AM", desc: "Reach fort top and explore the surroundings" },
              { time: "06:30 AM", desc: "Enjoy the sunrise and photography time" },
              { time: "07:30 AM", desc: "Breakfast and fort exploration" },
              { time: "09:00 AM", desc: "Start descending towards the base village" },
              { time: "01:30 PM", desc: "Reach base village, freshen up, and have lunch" },
              { time: "02:30 PM", desc: "Start return journey to Pune" },
              { time: "05:00 PM", desc: "Reach Pune" },
            ],
          },
        ],
      },
      kasara: {
        label: "From Mumbai",
        sublabel: "Kasara Route",
        icon: "🚂",
        note: "Friday night departures are preferred to avoid rush. Friday batch needs a minimum of 7 participants.",
        days: [
          {
            title: "Day 1",
            events: [
              { time: "08:44 PM", desc: "CSMT" },
              { time: "08:58 PM", desc: "Dadar" },
              { time: "09:11 PM", desc: "Ghatkopar" },
              { time: "09:26 PM", desc: "Thane" },
              { time: "09:52 PM", desc: "Kalyan" },
              { time: "11:04 PM", desc: "Kasara" },
              { time: "11:15 PM", desc: "Report at Kasara Station" },
              { time: "11:45 PM", desc: "Report at Kasara Ghat and halt for dinner" },
            ],
          },
          {
            title: "Day 2",
            events: [
              { time: "01:30 AM", desc: "Igatpuri pickup" },
              { time: "02:30 AM", desc: "Reach base village and rest for some time" },
              { time: "03:00 AM", desc: "Freshen up and start trek to Ratangad Fort" },
              { time: "06:00 AM", desc: "Reach Ratangad top and enjoy panoramic views" },
              { time: "07:30 AM", desc: "Breakfast" },
              { time: "09:00 AM", desc: "Start descending to the base village" },
              { time: "01:00 PM", desc: "Reach base village, freshen up, and have lunch" },
              { time: "02:30 PM", desc: "Start return journey to Kasara" },
              { time: "05:00 PM", desc: "Reach Kasara Station" },
            ],
          },
        ],
      },
      borivali: {
        label: "From Mumbai",
        sublabel: "Borivali Route",
        icon: "🚌",
        note: "Borivali batch includes private bus transport from Mumbai.",
        days: [
          {
            title: "Day 1",
            events: [
              { time: "10:00 PM", desc: "Borivali National Park" },
              { time: "10:05 PM", desc: "Samta Nagar, Kandivali" },
              { time: "10:15 PM", desc: "Sufi Irani Cafe, Goregaon" },
              { time: "10:30 PM", desc: "Hanuman Road Bus Stop, Andheri" },
              { time: "10:45 PM", desc: "Kalanagar Bus Stop, Bandra" },
              { time: "11:00 PM", desc: "Everard Nagar, Sion" },
              { time: "11:10 PM", desc: "Amar Mahal Palace" },
              { time: "11:45 PM", desc: "Teen Hath Naka, Thane" },
            ],
          },
          {
            title: "Day 2",
            events: [
              { time: "12:15 AM", desc: "Kalyan Bypass" },
              { time: "05:00 AM", desc: "Reach base village and rest in the bus" },
              { time: "05:30 AM", desc: "Freshen up and have breakfast" },
              { time: "06:00 AM", desc: "Start the trek towards Ratangad Fort" },
              { time: "09:30 AM", desc: "Reach the peak and explore the fort" },
              { time: "11:00 AM", desc: "Start descending towards base village" },
              { time: "02:00 PM", desc: "Reach base village and have lunch" },
              { time: "04:00 PM", desc: "Start return journey to Mumbai" },
              { time: "10:00 PM", desc: "Reach Mumbai" },
            ],
          },
        ],
      },
    },
    bookingSteps: [
      'Scroll to "Book on WhatsApp" and tap it.',
      "WhatsApp opens with the trek name, date, and fee filled in.",
      "Send the message so the team can confirm your seat.",
      "Share travellers in the same chat.",
      "Pay only after the team confirms on WhatsApp.",
      "The WhatsApp group link is shared on chat before departure.",
    ],
    placesToVisit: [
      { icon: "🏰", name: "Ratangad Fort Summit", desc: "Explore the fort ruins, bastions, and caves after the final climb." },
      { icon: "🏞️", name: "Bhandardara Lake Viewpoints", desc: "The summit offers expansive lake and valley views in clear weather." },
      { icon: "⛩️", name: "Amruteshwar Temple", desc: "A historic temple near Ratanwadi known for its carvings and architecture." },
      { icon: "💦", name: "Randha Falls", desc: "A popular nearby waterfall often visited with the Bhandardara circuit." },
    ],
    inclusions: [
      "Private transportation from selected departure point",
      "Breakfast and tea",
      "Lunch (veg thali)",
      "Trek leader charges",
      "Trek expertise charges",
      "Forest entry charges",
      "First aid charges",
    ],
    exclusions: [
      "Travel till pickup points",
      "5% GST on booking tickets",
      "Personal expenses, soft drinks, and extra snacks",
      "Any cost not mentioned in inclusions",
      "Emergency evacuation and insurance",
    ],
    thingsToCarry: commonCarryItems,
    discountCodes: [{ code: "LOYALTY50", desc: "Old customers enjoy flat 50 off" }],
  },
  "Kalu Waterfall Trek": {
    heroKicker: "💦 Trekking Kalu Waterfall Trek",
    meta: {
      title: "Kalu Waterfall Trek | Pune & Mumbai | Gadvede Trekkers",
      description:
        "Book Kalu Waterfall Trek from Pune or Mumbai. Enjoy a long scenic trail through Malshej region with breakfast, lunch, permits, and guided support.",
      keywords:
        "Kalu Waterfall trek Pune, Kalu Waterfall trek Mumbai, Malshej trek, Kalu waterfall trek 2025, Thitbi trek",
    },
    overview: {
      tagline: "Nature trail trek in the Malshej region with waterfall viewpoints",
      subtitle: "A monsoon-friendly trek with long scenic walking sections",
      intro:
        "Kalu Waterfall Trek is a scenic nature-trail experience in the Malshej region, popular for lush monsoon landscapes, long walking sections, and dramatic waterfall views. The trek is moderate in difficulty and typically takes 8 to 9 hours for the round trip.",
      sections: [
        {
          title: "Why Trekkers Choose Kalu",
          body:
            "This trek is ideal for trekkers who enjoy green valleys, long trail days, and the atmosphere of the Malshej belt during the rains. Trekhievers positions it as a well-supported trek with one leader for every group of ten participants and partial fee contribution towards village development.",
        },
      ],
    },
    history:
      "Kalu Waterfall is primarily a nature destination rather than a fort or heritage site. Its appeal comes from the terrain, the dense greenery of the Malshej region, and the dramatic sight of the waterfall viewed from a safe distance along the trail.",
    historyTitle: "About The Trail",
    highlights: [
      { icon: "💦", text: "View Kalu Waterfall from the designated viewpoint" },
      { icon: "🌿", text: "Nature trail through the Malshej region" },
      { icon: "🥾", text: "Moderate trek with 8-9 hours total walking time" },
      { icon: "🚌", text: "Separate Pune and Mumbai departure options" },
      { icon: "🍽️", text: "Breakfast, tea, and veg lunch included" },
      { icon: "🛡️", text: "Permit, forest entry, trek expertise, and first aid included" },
    ],
    eventDetails: {
      difficulty: "Moderate",
      endurance: "Medium / Average",
      baseVillage: "Thitbi",
      region: "Malshej, Maharashtra",
      duration: "1 Day",
      climbTime: "8-9 hours both sides",
      distance: "",
      altitude: "",
      driveFromPune: "120 km",
      driveMumbai: "143 km",
      bestTime: "Throughout the year",
      trailType: "Nature trail",
    },
    pricing: {
      pune: { label: "Pune", price: 1399 },
      mumbai: { label: "Mumbai", price: 1399 },
      baseVillage: { label: "Base Village", price: 899 },
    },
    whyJoin: [
      { icon: "🌧️", title: "Monsoon Favorite", desc: "A green, scenic Malshej trail that works especially well in the rainy season." },
      { icon: "👣", title: "Long Trail Day", desc: "A satisfying 8-9 hour trek for trekkers who enjoy full-day routes." },
      { icon: "🍲", title: "Simple Logistics", desc: "Transport, breakfast, lunch, permits, and guiding are handled for you." },
      { icon: "🤝", title: "Village Support", desc: "Part of the event fee is positioned as support for village development." },
    ],
    itineraries: {
      pune: {
        label: "From Pune",
        sublabel: "Pune Route",
        icon: "🚌",
        note: "Friday departures are preferred to avoid rush. Friday batch needs at least 10 participants.",
        days: [
          {
            title: "Departure Morning",
            events: [
              { time: "04:30 AM", desc: "Novotel Hotel, Viman Nagar" },
              { time: "05:00 AM", desc: "Report at Fergusson College Main Gate" },
              { time: "05:15 AM", desc: "Pickup from Bremen Chowk, Aundh" },
              { time: "05:30 AM", desc: "Pickup from Shivar Garden, Pimple Saudagar" },
              { time: "05:40 AM", desc: "Pickup from Nashik Phata, Kasarwadi" },
              { time: "05:55 AM", desc: "Pickup from Moshi Chowk" },
            ],
          },
          {
            title: "Trek Day",
            events: [
              { time: "09:30 AM", desc: "Reach base village and freshen up" },
              { time: "09:30 AM", desc: "Have breakfast" },
              { time: "10:30 AM", desc: "Start trek towards Kalu Waterfall" },
              { time: "12:30 PM", desc: "Enjoy the waterfall view from 1.5 km distance" },
              { time: "01:30 PM", desc: "Start trekking back towards the base village" },
              { time: "03:00 PM", desc: "Reach base village, freshen up, and have lunch" },
              { time: "05:00 PM", desc: "Start return journey to Pune" },
              { time: "10:00 PM", desc: "Reach Pune and Nashik Phata" },
            ],
          },
        ],
      },
      mumbai: {
        label: "From Mumbai",
        sublabel: "Mumbai Route",
        icon: "🚌",
        note: "Friday departures are preferred to avoid rush. Friday batch needs at least 10 participants.",
        days: [
          {
            title: "Day 1",
            events: [
              { time: "10:00 PM", desc: "Borivali National Park" },
              { time: "10:05 PM", desc: "Samta Nagar, Kandivali" },
              { time: "10:15 PM", desc: "Sufi Irani Cafe, Goregaon" },
              { time: "10:30 PM", desc: "Hanuman Road Bus Stop, Andheri" },
              { time: "10:45 PM", desc: "Kalanagar Bus Stop, Bandra" },
              { time: "11:00 PM", desc: "Everard Nagar, Sion" },
              { time: "11:10 PM", desc: "Amar Mahal Palace" },
              { time: "11:45 PM", desc: "Teen Hath Naka, Thane" },
            ],
          },
          {
            title: "Day 2",
            events: [
              { time: "12:10 AM", desc: "Kalyan Khadakpada Circle" },
              { time: "03:00 AM", desc: "Reach base village and rest in the bus" },
              { time: "04:30 AM", desc: "Wake-up call and freshen up" },
              { time: "05:00 AM", desc: "Breakfast and bus journey towards trek start point" },
              { time: "07:00 AM", desc: "Reach the start point" },
              { time: "07:30 AM", desc: "Start descending towards Malshej Ghat jungle" },
              { time: "10:30 AM", desc: "Visit Kalu Waterfall from a 1.5 km distance and head back" },
              { time: "12:30 PM", desc: "Reach base village (Thitbi) and freshen up" },
              { time: "01:30 PM", desc: "Have lunch" },
              { time: "03:00 PM", desc: "Start return journey to Mumbai" },
              { time: "10:00 PM", desc: "Reach Mumbai" },
            ],
          },
        ],
      },
    },
    bookingSteps: [
      'Tap "Book on WhatsApp".',
      "WhatsApp opens with the trek name, date, and fee filled in.",
      "Send the message so the team can confirm your seat.",
      "Share travellers in the same chat.",
      "Pay only after the team confirms on WhatsApp.",
      "Ticket confirmation and departure updates come back on WhatsApp.",
    ],
    inclusions: [
      "Private bus transportation",
      "Breakfast and tea",
      "Lunch (veg thali)",
      "Trek leader charges",
      "Permit and forest entry charges",
      "Trek expertise charges",
      "First aid charges",
    ],
    exclusions: [
      "Travel till pickup points",
      "5% GST on booking tickets",
      "Personal expenses, soft drinks, and extra meals",
      "Any cost not mentioned in inclusions",
      "Emergency evacuation and insurance",
    ],
    thingsToCarry: commonCarryItems,
    discountCodes: [{ code: "LOYALTY50", desc: "Old customers enjoy flat 50 off" }],
  },
  "Vasota Fort Trek": {
    heroKicker: "🌲 Koyna forest fort",
    meta: {
      title: "Vasota Fort Trek | Pune ₹1800 | Mumbai ₹3200 | Gadvede Trekkers",
      description:
        "Vasota Fort Trek with Gadvede Trekkers. Boat across Shivsagar, forest walk, and a night at Bamnoli. Pune ₹1,800. Mumbai ₹3,200.",
      keywords: "Vasota fort trek, Vasota from Pune, Vasota from Mumbai, Bamnoli camp, Shivsagar boat",
    },
    overview: {
      tagline: vasotaOverview.tagline,
      subtitle: vasotaOverview.subtitle,
      intro: vasotaOverview.intro,
      sections: [],
    },
    history: vasotaHistory,
    historyTitle: "The fort and the boat crossing",
    highlights: vasotaHighlights,
    eventDetails: vasotaEventDetails,
    pricing: vasotaPricing,
    whyJoin: vasotaWhyJoin,
    itineraries: vasotaItineraries,
    bookingSteps: vasotaBookingSteps,
    inclusions: vasotaInclusions,
    exclusions: vasotaExclusions,
    thingsToCarry: vasotaThingsToCarry,
  },
  "New Year Beach Side Camping": {
    heroKicker: "🌙 30 December night to 1 January",
    meta: {
      title: "New Year Beach Side Camping | Gadvede Trekkers",
      description:
        "Gadvede New Year beach camp. Leave 30 December night, return 1 January. Tent Pune ₹2,800 / Mumbai ₹3,000. 4-share room Pune ₹3,500 / Mumbai ₹3,700.",
      keywords: "New Year beach camping Pune, New Year camping Mumbai, Gadvede beach camp",
    },
    overview: {
      tagline: nyeBeachOverview.tagline,
      subtitle: nyeBeachOverview.subtitle,
      intro: nyeBeachOverview.intro,
      sections: [],
    },
    history: nyeBeachHistory,
    historyTitle: "What this batch is",
    highlights: nyeBeachHighlights,
    eventDetails: nyeBeachEventDetails,
    pricing: nyeBeachPricing,
    whyJoin: nyeBeachWhyJoin,
    itineraries: nyeBeachItineraries,
    bookingSteps: nyeBeachBookingSteps,
    inclusions: nyeBeachInclusions,
    exclusions: nyeBeachExclusions,
    thingsToCarry: nyeBeachThingsToCarry,
  },
};

const RICH_NAME_ALIASES = {
  "Kalsubai Peak Trek": "Kalsubai Trek",
  "Kalsubai": "Kalsubai Trek",
};

export function richTrekFor({ name, slug } = {}) {
  if (slug && richTrekBySlug[slug]) return richTrekBySlug[slug];
  if (name && richTrekDetails[name]) return richTrekDetails[name];
  const alias = RICH_NAME_ALIASES[name];
  return (alias && richTrekDetails[alias]) || null;
}

export const richTrekBySlug = {
  "vasota-fort-trek": richTrekDetails["Vasota Fort Trek"],
  "harishchandragad-trek": richTrekDetails["Harishchandragad Trek"],
  "kalsubai-peak-trek": richTrekDetails["Kalsubai Trek"],
  "new-year-beach-side-camping": richTrekDetails["New Year Beach Side Camping"],
};

