export const ivDestinations = [
  {
    id: "pune-delhi-amritsar-manali-kasol-kullu-agra-pune",
    icon: "🏔️",
    title: "Manali – Amritsar – Kasol – Agra | Student Group Trip",
    subtitle: "9 Days · Pune → Delhi → Amritsar → Manali → Kasol → Agra → Pune",
    price: 13800,
    originalPrice: 16000,
    highlights: [
      "Delhi — India Gate, Rashtrapati Bhavan view, Qutub Minar, Connaught Place",
      "Amritsar — Golden Temple, Jallianwala Bagh, Wagah–Attari Border",
      "Manali — Hadimba Temple, Mall Road, Old Manali",
      "Atal Tunnel + Solang Valley excursion",
      "Kasol riverside campsite",
      "River rafting included in package price",
      "Agra — Taj Mahal (+ Agra Fort if time permits)",
      "9 days Pune → Delhi → Amritsar → Manali → Kasol → Agra → Pune",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80", caption: "Delhi NCR — India Gate" },
      { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80", caption: "Manali, Himachal Pradesh" },
      { src: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80", caption: "Golden Temple, Amritsar" },
      { src: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80", caption: "Taj Mahal, Agra" },
    ],
    industries: ["Heritage & Cultural Tourism", "Adventure & Eco-Tourism", "Hospitality", "Architecture & History"],
    duration: "9 Days",
    bestFor: "College & school student groups",
    pricingSlabs: [
      { students: "Non-AC train package", pricePerHead: 13800, note: "Full package meals + rafting (as listed)" },
      { students: "AC train package", pricePerHead: 16000, note: "Full package meals + rafting (as listed)" },
      { students: "20 – 29 students", pricePerHead: null, note: "Group quotes on WhatsApp" },
      { students: "30+ students", pricePerHead: null, note: "Custom college pricing — contact us" },
    ],
    includes: [
      "Train tickets Pune → Delhi and Agra → Pune",
      "Delhi day: breakfast, lunch and dinner",
      "Amritsar hotel stay (2 days): breakfast, lunch and dinner each day",
      "Amritsar → Manali overnight bus",
      "Manali hotel + Day 6 Kasol camp: breakfast, lunch and dinner (both days)",
      "Transport for Solang Valley and Atal Tunnel",
      "River rafting included (as per local conditions & operator schedule)",
      "Kasol campsite stay",
      "Day 7 Kasol checkout: breakfast, lunch and dinner, then overnight to Agra",
      "Overnight transport Kasol → Agra (direct)",
      "Agra: breakfast only",
    ],
    excludes: [
      "No meals on train days (Day 1 & Day 9)",
      "No lunch and no dinner in Agra (Day 8)",
      "Monument entry fees (unless stated for your booked package)",
      "Optional adventure activities beyond included rafting",
      "Personal expenses, snacks, mineral water",
      "Anything not listed in inclusions — inclusions may change by package chosen",
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Pune → Delhi by train",
        items: [
          "Depart Pune by pre-booked train",
          "Overnight journey towards Delhi",
          "Keep personal essentials, water and snacks handy",
          "Meals: none (train journey)",
          "Stay: overnight on the train",
        ],
      },
      {
        day: "Day 2",
        title: "Delhi sightseeing → overnight to Amritsar",
        items: [
          "Arrive in Delhi and transfer to hotel for freshening up",
          "Visit India Gate; view Rashtrapati Bhavan from outside",
          "Visit Qutub Minar if time permits",
          "Lunch break at hotel or nearby restaurant",
          "Explore Connaught Place for shopping and free time",
          "Dinner included, then proceed to bus boarding point",
          "Overnight AC bus to Amritsar",
          "Meals: breakfast, lunch and dinner",
          "Stay: overnight AC bus",
        ],
      },
      {
        day: "Day 3",
        title: "Amritsar sightseeing",
        items: [
          "Arrive in Amritsar and transfer to hotel",
          "Check in / freshen up, then breakfast",
          "Visit Golden Temple and sacred Sarovar",
          "Lunch break",
          "Visit Jallianwala Bagh",
          "Afternoon: Wagah–Attari Border ceremony (subject to access & timings)",
          "Return to hotel for dinner and rest",
          "Meals: breakfast, lunch and dinner",
          "Stay: hotel in Amritsar",
        ],
      },
      {
        day: "Day 4",
        title: "Amritsar exploration → overnight to Manali",
        items: [
          "Breakfast and hotel checkout",
          "Explore Hall Bazaar and local markets",
          "Visit Partition Museum if time and opening hours permit",
          "Lunch break in Amritsar; free time for shopping & Punjabi food",
          "Dinner included before departure",
          "Board pre-booked overnight bus to Manali",
          "Meals: breakfast, lunch and dinner",
          "Stay: overnight bus",
        ],
      },
      {
        day: "Day 5",
        title: "Arrival in Manali & local sightseeing",
        items: [
          "Arrive in Manali and transfer to hotel",
          "Check in / leave luggage and freshen up",
          "Breakfast after overnight journey",
          "Visit Hadimba Devi Temple",
          "Explore local market and Mall Road",
          "Free time in Old Manali cafés and shops",
          "Dinner and overnight rest at hotel",
          "Meals: breakfast, lunch and dinner",
          "Stay: hotel in Manali",
        ],
      },
      {
        day: "Day 6",
        title: "Atal Tunnel · Solang Valley · Kasol camp",
        items: [
          "Early breakfast and checkout from Manali hotel",
          "Visit Atal Tunnel and Sissu side if weather/road access permit",
          "Visit Solang Valley (views & optional activities)",
          "Lunch during the excursion",
          "Same-day depart towards Kasol",
          "Check into Kasol campsite; riverside group time",
          "Dinner and overnight at campsite",
          "Meals: breakfast, lunch and dinner",
          "Stay: Kasol campsite",
          "Note: long mountain day — buffer for traffic/weather",
        ],
      },
      {
        day: "Day 7",
        title: "Kasol checkout → overnight to Agra",
        items: [
          "Breakfast at campsite, then checkout",
          "Lunch before departure",
          "Board overnight transport direct to Agra (no Delhi stop)",
          "Dinner included on the journey",
          "Travel overnight towards Agra",
          "Meals: breakfast, lunch and dinner",
          "Stay: overnight in transit to Agra",
        ],
      },
      {
        day: "Day 8",
        title: "Agra sightseeing → train to Pune",
        items: [
          "Reach Agra after overnight journey from Kasol",
          "Freshen up at hotel or day-use facility if required",
          "Breakfast",
          "Visit Taj Mahal",
          "Visit Agra Fort if time permits",
          "No lunch in Agra — collect luggage after sightseeing",
          "Proceed to Agra railway station; board train to Pune",
          "Meals: breakfast only (no lunch/dinner in Agra)",
          "Stay: overnight on the train",
          "Note: keep buffer for delays before train",
        ],
      },
      {
        day: "Day 9",
        title: "Arrival in Pune",
        items: [
          "Continue train journey Agra → Pune",
          "No meals on train (own arrangement)",
          "Arrive in Pune as per confirmed railway timetable",
          "Trip concludes",
        ],
      },
    ],
  },
  {
    id: "jaipur-jodhpur-udaipur",
    icon: "🏜️",
    title: "Jaipur – Jodhpur – Udaipur",
    subtitle: "Royal Rajasthan Heritage Circuit",
    highlights: [
      "Textile & handicraft industry visits",
      "Heritage learning experience",
      "Royal Rajasthan exploration",
      "Gem & jewellery industry exposure",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1524229648276-e66561fe45a9?auto=format&fit=crop&w=800&q=80", caption: "Hawa Mahal, Jaipur" },
      { src: "https://images.unsplash.com/photo-1566577529803-7aced417384b?auto=format&fit=crop&w=800&q=80", caption: "Jodhpur – The Blue City" },
      { src: "https://images.unsplash.com/photo-1679505512042-07792fede259?auto=format&fit=crop&w=800&q=80", caption: "Lake Palace, Udaipur" },
      { src: "https://images.unsplash.com/photo-1524309784716-6a4be8299c7f?auto=format&fit=crop&w=800&q=80", caption: "Amber Fort, Jaipur" },
    ],
    industries: ["Textile & Handicraft", "Gem & Jewellery", "Heritage Tourism", "Marble & Stone Industry"],
    duration: "5–7 Days",
    bestFor: "Fashion, Design & Commerce Students",
    pricingSlabs: [
      { students: "20 – 29", pricePerHead: 9500,  note: "Smaller groups" },
      { students: "30 – 39", pricePerHead: 8800,  note: "Standard group" },
      { students: "40 – 49", pricePerHead: 8200,  note: "Better saving" },
      { students: "50+",     pricePerHead: null,  note: "Custom pricing — contact us" },
    ],
  },
  {
    id: "jaipur-jaisalmer-udaipur",
    icon: "🐪",
    title: "Jaipur – Jaisalmer – Udaipur",
    subtitle: "Desert & Heritage Exploration",
    highlights: [
      "Desert camps & cultural exposure",
      "Historical forts and architecture",
      "Unique student travel experience",
      "Camel safari & desert ecosystem study",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1633319755208-26bef3342d34?auto=format&fit=crop&w=800&q=80", caption: "Camel Safari, Jaisalmer Desert" },
      { src: "https://images.unsplash.com/photo-1524309784716-6a4be8299c7f?auto=format&fit=crop&w=800&q=80", caption: "Amber Fort, Jaipur" },
      { src: "https://images.unsplash.com/photo-1524229648276-e66561fe45a9?auto=format&fit=crop&w=800&q=80", caption: "Hawa Mahal, Jaipur" },
      { src: "https://images.unsplash.com/photo-1679505512042-07792fede259?auto=format&fit=crop&w=800&q=80", caption: "Lake Palace, Udaipur" },
    ],
    industries: ["Desert Ecology & Environment", "Architecture & Heritage", "Tourism & Hospitality", "Cultural Studies"],
    duration: "6–8 Days",
    bestFor: "Architecture, Environment & Humanities Students",
    pricingSlabs: [
      { students: "20 – 29", pricePerHead: 11000, note: "Smaller groups" },
      { students: "30 – 39", pricePerHead: 10200, note: "Standard group" },
      { students: "40 – 49", pricePerHead: 9500,  note: "Better saving" },
      { students: "50+",     pricePerHead: null,  note: "Custom pricing — contact us" },
    ],
  },
  {
    id: "kerala",
    icon: "🌴",
    title: "Kerala – Industrial & Educational Tours",
    subtitle: "God's Own Country — Industry Meets Nature",
    highlights: [
      "Tea & spice plantation visits",
      "Port and logistics industry exposure",
      "Nature + education combo",
      "Backwater ecosystem study",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1609828913552-f9138ed9e42d?auto=format&fit=crop&w=800&q=80", caption: "Kerala Backwaters" },
      { src: "https://images.unsplash.com/photo-1646818978594-880ef94bde44?auto=format&fit=crop&w=800&q=80", caption: "Tea Gardens, Munnar" },
      { src: "https://images.unsplash.com/photo-1516815231560-8f41ec531527?auto=format&fit=crop&w=800&q=80", caption: "Cochin Port & Logistics" },
      { src: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80", caption: "Spice Plantations, Wayanad" },
    ],
    industries: ["Tea & Spice Plantations", "Port & Logistics", "Fisheries & Marine", "Eco-Tourism & Sustainability"],
    duration: "6–8 Days",
    bestFor: "Agriculture, Marine, Commerce & Science Students",
    pricingSlabs: [
      { students: "20 – 29", pricePerHead: 12500, note: "Smaller groups" },
      { students: "30 – 39", pricePerHead: 11500, note: "Standard group" },
      { students: "40 – 49", pricePerHead: 10800, note: "Better saving" },
      { students: "50+",     pricePerHead: null,  note: "Custom pricing — contact us" },
    ],
  },
  {
    id: "goa",
    icon: "🌊",
    title: "Goa – Student Trips & Industrial Visits",
    subtitle: "India's Tourism Capital — Fun Meets Learning",
    highlights: [
      "Hospitality & tourism industry visits",
      "Beach activities & relaxation",
      "Perfect mix of fun + learning",
      "Fisheries & coastal industry exposure",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1558894930-0e1f89b9f0ce?auto=format&fit=crop&w=800&q=80", caption: "Goa Beach Sunset" },
      { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", caption: "Goa Beaches & Coastline" },
      { src: "https://images.unsplash.com/photo-1626154150938-39211a1e5701?auto=format&fit=crop&w=800&q=80", caption: "Old Goa Churches" },
      { src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80", caption: "Adventure Activities" },
    ],
    industries: ["Tourism & Hospitality", "Fisheries & Coastal Industry", "Event Management", "Food & Beverage Industry"],
    duration: "4–6 Days",
    bestFor: "Hotel Management, Tourism & Commerce Students",
    pricingSlabs: [
      { students: "20 – 29", pricePerHead: 7500, note: "Smaller groups" },
      { students: "30 – 39", pricePerHead: 6800, note: "Standard group" },
      { students: "40 – 49", pricePerHead: 6200, note: "Better saving" },
      { students: "50+",     pricePerHead: null, note: "Custom pricing — contact us" },
    ],
  },
];

function looksLikeClockTime(value) {
  return /^\d{1,2}(:\d{2})?\s*(am|pm)?$/i.test(String(value || "").trim());
}

/** Day N|title|item, with later rows as Day N||item. Clock times stay on the bullet. */
export function parseIvItinerary(value) {
  if (Array.isArray(value)) {
    return value
      .map((day) => ({
        day: String(day?.day || "Day").trim() || "Day",
        title: String(day?.title || day?.day || "Day").trim() || "Day",
        items: (Array.isArray(day?.items) ? day.items : [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      }))
      .filter((day) => day.title || day.items.length);
  }

  const days = [];
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split("|");
      const day = (parts[0] || "").trim() || "Day";
      const second = (parts[1] || "").trim();
      const detail = parts.slice(2).join("|").trim();
      let entry = days.find((item) => item.day === day);
      if (!entry) {
        entry = { day, title: "", items: [] };
        days.push(entry);
      }

      if (parts.length < 3) {
        if (!second) return;
        if (!entry.title) entry.title = second;
        else entry.items.push(second);
        return;
      }

      if (!second) {
        if (detail) entry.items.push(detail);
        return;
      }

      if (looksLikeClockTime(second)) {
        entry.items.push(detail ? `${second} — ${detail}` : second);
        return;
      }

      if (!entry.title) entry.title = second;
      if (detail) entry.items.push(detail);
      else if (entry.title !== second) entry.items.push(second);
    });

  return days.map((day) => ({
    day: day.day,
    title: day.title || day.day,
    items: day.items,
  }));
}

export function itineraryToPipe(days = []) {
  return (Array.isArray(days) ? days : [])
    .flatMap((day) => {
      const label = day.day || "Day";
      const title = day.title && day.title !== label ? day.title : "";
      return (day.items || []).map((item, index) =>
        index === 0 ? `${label}|${title}|${item}` : `${label}||${item}`
      );
    })
    .join("\n");
}
