import { useState } from "react";
import { Link } from "react-router-dom";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";

const gallery = [
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
  "https://images.unsplash.com/photo-1519430044529-9242d9989e06?w=400&q=80",
  "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=400&q=80",
  "https://images.unsplash.com/photo-1467348733814-f4d4718f11e6?w=400&q=80",
];

const ITINERARIES = {
  mumbai: {
    label: "From Mumbai",
    icon: "🚌",
    days: [
      {
        day: "Day Zero — Friday Night",
        items: [
          "21:15 — Meet at Borivali National Park main gate.",
          "21:30 — Leave for Velas.",
          "21:40 — Pick up at Virwani Bus Stop, Goregaon.",
          "21:45 — Pick up at Gundavali Bus Stop, Andheri East.",
          "21:55 — Pick up at Kalanagar bus stop, Bandra.",
          "22:10 — Pick up at Everard Nagar bus stop, Sion.",
          "22:20 — Pick up at Diamond Garden, Chembur.",
          "22:40 — Pick up at Vashi Plaza.",
          "23:00 — Pick up at McDonald's, Kalamboli.",
        ],
      },
      {
        day: "Day One — Saturday",
        items: [
          "06:00 — Early morning arrival at Velas.",
          "06:15 — Visit to Velas Beach for Turtle sighting.",
          "08:30 — Breakfast at Velas Homestay.",
          "10:30 — Visit to Bankot Fort.",
          "13:00 — Lunch & Rest.",
          "17:00 — Visit the beach for turtle sightings.",
          "21:00 — Dinner and enjoy Team Games.",
        ],
      },
      {
        day: "Day Two — Sunday",
        items: [
          "06:00 — Wake up and freshen up.",
          "07:00 — Depart for Harihareshwar temple from Velas village.",
          "08:00 — Cross Bankot creek, Savitri River in a boat from Veshvi Jungle Jetty to Bagmandala jetty.",
          "11:00 — Departure for Mumbai from Harihareshwar temple.",
          "Lunch on the way.",
          "20:00 — Approx. arrival at Mumbai.",
        ],
      },
    ],
  },
  pune: {
    label: "From Pune",
    icon: "🚌",
    days: [
      {
        day: "Day Zero — Friday Night",
        items: [
          "22:00 — Meet at Shivajinagar Bus Stand, Pune.",
          "22:15 — Depart from Shivajinagar.",
          "22:30 — Pick up at Hinjewadi Chowk.",
          "22:45 — Pick up at Wakad Bridge.",
          "23:00 — Pick up at Pimpri-Chinchwad area (confirm with trek leader).",
        ],
      },
      {
        day: "Day One — Saturday",
        items: [
          "06:30 — Early morning arrival at Velas.",
          "06:45 — Visit to Velas Beach for Turtle sighting.",
          "09:00 — Breakfast at Velas Homestay.",
          "10:30 — Visit to Bankot Fort.",
          "13:00 — Lunch & Rest.",
          "17:00 — Visit the beach for turtle sightings.",
          "21:00 — Dinner and enjoy Team Games.",
        ],
      },
      {
        day: "Day Two — Sunday",
        items: [
          "06:00 — Wake up and freshen up.",
          "07:00 — Depart for Harihareshwar temple from Velas village.",
          "08:00 — Cross Bankot creek, Savitri River in a boat from Veshvi Jungle Jetty to Bagmandala jetty.",
          "11:00 — Departure for Pune from Harihareshwar temple.",
          "Lunch on the way.",
          "21:00 — Approx. arrival at Pune.",
        ],
      },
    ],
  },
};

const eventDetails = [
  "Traveling by A/C Bus to Velas Maharashtra",
  "Stay in a Velas turtle festival homestay",
  "Food: Homestay with Veg and Non-Veg food arranged",
  "Bus Transport — private vehicle for the entire tour",
  "Bankot Fort (Himmatgad) — 500 feet above sea level, first residence of East India Company in Southern Konkan",
  "Base Village: Velas, Taluka Mandangad, District Ratnagiri, Region Konkan",
  "Route from Mumbai: Mumbai – Panvel – Mahad – Mandangad – Velas",
  "Route return: Velas → Vesvi → Bagmandle Ferry → Harihareshwar → Pen → Panvel → Mumbai",
  "Distance from Mumbai: 220 kilometers",
  "Total time for Bankot Fort visit: 2 to 3 hours (no trek/climbing required)",
  "Parking available at Velas village",
  "Bus breakdowns possible due to bad road conditions",
];

const importantNotes = [
  "Traveling by A/C Bus — AC may be switched off on Ghat Road.",
  "Due to the closure of the Ambet Ghat, the route has changed via Mahad City.",
  "Bus breakdowns are possible due to bad road conditions.",
  "Hatchling sighting is NOT guaranteed.",
  "Maximum batch size is 30 travelers on a first-come-first-serve basis.",
  "Pick up and Drop at centralized locations only.",
  "Velas Turtle Festival is a budget trip — stay is in Homestay (dormitory-style).",
  "Food will be local Konkani cuisine.",
  "We don't have couple rooms — minimum 4 guests in one room or dorm-like rooms.",
  "For AC Rooms, extra ₹200 per person (WhatsApp us on 8828004949).",
  "Festival sells out quickly — book in advance.",
  "First 18 bookings: stay in main homestay; after that, alternate homestay.",
  "Without transport: Bankot and Harihareshwar in your own vehicle. Ferry and parking charges not included.",
];

const faqs = [
  {
    q: "Can we get a separate room or family room at Velas Turtle Festival Homestay?",
    a: "Currently, we are only conducting group events. Due to heavy rush on weekends, we only offer dormitory homestays at Velas Village. We have separate rooms for Men and Women. Resorts are available in Dapoli or Harihareshwar only.",
  },
  {
    q: "Where can I find Olive Ridley turtles on the Konkan coast?",
    a: "Apart from Velas, Olive Ridley turtles can be found at Guhagar Beach, Harihar Beach, Velas Agar Beach, Anjarle Beach, Wayangani Beach Vengurla, Diveghar, Shirvardhan, Kelshi, Karde, Harney, Ladheghar, and Ganapatipule beaches.",
  },
  {
    q: "What food is available at Velas Village Homestay?",
    a: "We provide locally cooked Jain, Veg, and Non-veg food. The food quality is Konkani cuisine — the same meal that locals cook for themselves. Velas homestay owners are famous for their hospitality and food.",
  },
  {
    q: "Are toilets available and is there a bathing facility?",
    a: "Velas homestay has a bathing facility (hot water unavailable). Toilets include eastern and western commodes. Velas beach has no public toilet facility.",
  },
  {
    q: "What is the mobile connectivity at Velas Village?",
    a: "Range is available in a few spots near the Village — Idea sim cards have good range. There is load shedding; carry a power bank. Bankot Fort and Harihareshwar beach have good mobile connectivity.",
  },
  {
    q: "What are the things to do at Velas Turtle Festival?",
    a: "Bird watching, spotting fireflies in the evening, enjoying village life, Bankot Fort (first British residency in Southern Konkan), night walks on the coastal road, relaxing by the beach, watching dolphins, visiting Anjarle Turtle Festival (40 km away), boat ride to Suvarnadurg Fort, Harihareshwar temple darshan.",
  },
  {
    q: "What are the turtle release timings?",
    a: "Reach Velas beach by 6:30 AM; for the evening visit, arrive by 5:30 PM. Baby Olive Ridley turtles are released around sunrise and sunset every day by locals, the forest department, and the Kasav Mitra Mandal Velas conservation team.",
  },
  {
    q: "Will Harihareshwar Temple and Harihareshwar Beach be visited?",
    a: "Yes, on Sunday. To reach Harihareshwar from Velas, we board a jetty at Vesvi-Bagmandle Ferry Boat. No Velas beach resorts or hotels are available — only homestays.",
  },
  {
    q: "What are the dates for the Velas festival?",
    a: "Velas Turtle Festival dates are released after the Kasav Mitra information center informs us of approx. dates of baby turtle hatching. The festival runs from February to April every year. Velas Turtle Festival 2026 dates are available for all weekends in April.",
  },
  {
    q: "What happened to the Velas Turtle Festival in 2020 and 2021?",
    a: "Both years, the turtle festival was canceled by the forest department due to COVID guidelines. The villagers suffered a huge loss of income, and later also lost their livelihood due to cyclones.",
  },
  {
    q: "What is the best time to visit the Velas Turtle Festival?",
    a: "The festival takes place in February, March, and sometimes April. The best time to visit is in March. Turtle hatchlings are released from February to April.",
  },
  {
    q: "Why should you visit the Velas beach turtle festival?",
    a: "Support #VelasTurtleFestival to help with Olive Ridley turtle conservation and ecotourism. Watch baby turtles being released into the sea. Help the local community after financial depression due to Covid19 and Cyclone Tauktae.",
  },
  {
    q: "When is the Velas Turtle Festival conducted?",
    a: "Depending on the number of Olive Ridley egg nests and the safe release schedule, the festival is held from February to April. Kasav Mahotsav improves livelihood at Velas Maharashtra and involves locals in conservation.",
  },
  {
    q: "What are the chances of seeing Velas sea turtles?",
    a: "Sighting depends on weather, days from egg laying, and other factors. Even dates are decided after understanding these factors — successful sighting is not guaranteed. The Conservation Center releases thousands of baby turtles into the ocean each year.",
  },
  {
    q: "Do you offer a Shrivardhan beach visit?",
    a: "Sorry, due to limited time availability, we cannot visit Shrivardhan beach during the Velas Turtle Tour.",
  },
  {
    q: "Does Harihareshwar have a turtle conservation site?",
    a: "Yes, Harihareshwar has started a promising turtle festival. It's a great chance to experience an Olive Ridley turtle festival at Harihareshwar, help with wildlife conservation, and support the locals through agro-tourism.",
  },
  {
    q: "Is swimming allowed at Velas Beach?",
    a: "Swimming is NOT allowed. Newly released baby turtles hang around the Velas beach lines, and strong sea currents make it one of the most dangerous beaches for swimming.",
  },
  {
    q: "What are the Velas Turtle Festival dates from Pune in April?",
    a: "Velas Turtle Festival 2026 dates from Pune are available on weekends in April. The trip starts Friday night and ends in Pune on Sunday night. Velas Turtle Festival from Pune is available — please contact us for details.",
  },
];

function Section({ title, children, dark }) {
  return (
    <div
      style={{
        background: dark ? "#0f2027" : "#fff",
        borderRadius: 14,
        padding: "28px 28px",
        marginBottom: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}
    >
      <h2 style={{ fontWeight: 800, fontSize: "1.15rem", color: dark ? "#6ee7b7" : "#065f46", marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function VelasTurtleFestival() {
  const [mainImg, setMainImg]           = useState(gallery[0]);
  const [openFaq, setOpenFaq]           = useState(null);
  const [transport, setTransport]       = useState("without");
  const [guests, setGuests]             = useState(1);
  const [activeRoute, setActiveRoute]   = useState("mumbai");
  const itinerary = ITINERARIES[activeRoute];

  const priceMap = { without: 2599, with_adult: 3399, with_child: 1999 };
  const selectedPrice = transport === "without" ? priceMap.without : priceMap.with_adult;
  const total = selectedPrice * guests;

  return (
    <div style={{ background: "#f0fdf4", minHeight: "100vh" }}>
      <style>{`
        .velas-section { background:#fff; border-radius:14px; padding:28px; margin-bottom:24px; box-shadow:0 2px 12px rgba(0,0,0,0.07); }
        .velas-faq-item { border-bottom:1px solid #e5e7eb; }
        .velas-faq-q { width:100%; background:none; border:none; text-align:left; padding:14px 0; font-weight:600; font-size:0.92rem; color:#065f46; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
        .velas-faq-a { font-size:0.88rem; color:#374151; line-height:1.7; padding-bottom:14px; }
        .velas-chip { display:inline-block; background:#d1fae5; color:#065f46; border-radius:20px; padding:4px 14px; font-size:0.78rem; font-weight:600; margin:3px; }
        .velas-it-day { background:#059669; color:#fff; padding:6px 16px; border-radius:8px; font-weight:700; font-size:0.88rem; display:inline-block; margin-bottom:10px; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#047857 100%)", padding: "48px 0 40px" }}>
        <div className="container">
          <p style={{ color: "#6ee7b7", fontSize: "0.82rem", marginBottom: 12 }}>
            <Link to="/" style={{ color: "#6ee7b7", textDecoration: "none" }}>Home</Link>
            {" › "}
            <Link to="/tours" style={{ color: "#6ee7b7", textDecoration: "none" }}>Photography Tours</Link>
            {" › "}
            <span style={{ color: "#fff" }}>Velas Turtle Festival 2026 Mumbai</span>
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <span className="velas-chip" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>🐢 Eco-Tourism</span>
            <span className="velas-chip" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>🌊 Beach</span>
            <span className="velas-chip" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>📸 Photography Tour</span>
            <span className="velas-chip" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>🎟 3 offers</span>
          </div>

          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", marginBottom: 8 }}>
            Velas Turtle Festival 2026 Mumbai
          </h1>
          <p style={{ color: "#a7f3d0", marginBottom: 20 }}>📍 Velas village, Mandangad Taluka, Ratnagiri District, Maharashtra</p>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <span style={{ color: "#6ee7b7", fontSize: "0.8rem" }}>Starting From</span>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: "2rem" }}>₹2,599<span style={{ fontSize: "1rem", fontWeight: 400 }}>/person</span></div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["✅ Best Price Guaranteed", "🔒 Secure & Easy Booking", "😊 1000+ Happy Customers"].map(b => (
                <span key={b} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

          {/* ── LEFT CONTENT ── */}
          <div>
            {/* Gallery */}
            <div className="velas-section">
              <img src={mainImg} alt="Velas Turtle Festival" style={{ width: "100%", height: 340, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                {gallery.map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setMainImg(img)}
                    style={{ height: 70, width: 100, objectFit: "cover", borderRadius: 6, cursor: "pointer", flexShrink: 0, border: mainImg === img ? "2px solid #059669" : "2px solid transparent", opacity: mainImg === img ? 1 : 0.75, transition: "opacity 0.2s" }}
                  />
                ))}
              </div>
            </div>

            {/* Overview */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 12 }}>Experience the joy of Velas Kasav Mahotsav in 2026</h2>
              <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: 14 }}>
                Maharashtra is blessed with a 720 km long coastline shared with Konkan, Thane, Ratnagiri and Sindhudurg districts. In 2000-01, it was found that the Olive Ridley turtle is a prominent visitor to Maharashtra's shores for breeding. Other species include the Green Turtle, Hawksbill and Leatherback.
              </p>
              <h3 style={{ fontWeight: 700, color: "#065f46", fontSize: "1rem", marginBottom: 10 }}>Why Velas Turtle Festival Maharashtra?</h3>
              <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: 14 }}>
                Velas is a small fishing village on the western coast of Maharashtra, about 220 km from Mumbai. It is that time of the year when a tiny grey head pokes out of the golden sand and takes a breath of the fresh salty air of the Arabian Sea.
              </p>
              <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: 14 }}>
                This journey starts when the mother emerges from rolling waves to lay 100–120 eggs on the sandy beach under cover of darkness. The tiny hatchlings crawl their way towards the brightest lights on the horizon — the sea. Gadvede Trekkers invites you to witness this miracle of Nature.
              </p>
              <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.92rem" }}>
                Olive Ridley turtle conservation trends have spread to nearby villages that have started similar Kasav Mahotsav. Best time to visit is <strong>February to April</strong> to see baby turtles being released at Velas beach.
              </p>
            </div>

            {/* Cost */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 16 }}>💰 Velas Turtle Festival Cost</h2>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { label: "With Transport (5 years and above)", price: "₹3,399", highlight: true },
                  { label: "With Transport (0 to 4 years — seat required in Bus)", price: "₹1,999", highlight: false },
                  { label: "Without Transport", price: "₹2,599", highlight: false },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: row.highlight ? "#d1fae5" : "#f9fafb", borderRadius: 10, padding: "14px 18px" }}>
                    <span style={{ fontSize: "0.9rem", color: "#374151", fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#059669" }}>{row.price} <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 400 }}>per person</span></span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 14, fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>
                ⚠️ Please note: We don't have couple rooms. Minimum 4 guests in one room or dorm-like rooms. For AC Rooms, extra ₹200 per person.
              </p>
            </div>

            {/* Important Notes */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 14 }}>📋 Kindly Note</h2>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {importantNotes.map((note, i) => (
                  <li key={i} style={{ color: "#374151", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: 6 }}>{note}</li>
                ))}
              </ul>
            </div>

            {/* Itinerary */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 18 }}>🗓 Itinerary — Velas Turtle Festival 2026</h2>

              {/* Route selector */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {Object.entries(ITINERARIES).map(([key, route]) => (
                  <button key={key} onClick={() => setActiveRoute(key)}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "2px solid", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                      borderColor: activeRoute === key ? "#059669" : "#d1d5db",
                      background: activeRoute === key ? "#059669" : "#fff",
                      color: activeRoute === key ? "#fff" : "#374151" }}>
                    {route.icon} {route.label}
                  </button>
                ))}
              </div>

              {itinerary.days.map((day, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div className="velas-it-day">{day.day}</div>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {day.items.map((item, j) => (
                      <li key={j} style={{ color: "#374151", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: 5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p style={{ fontSize: "0.82rem", color: "#6b7280", fontStyle: "italic" }}>
                There can be delays due to bad road conditions, bus breakdowns, health issues, and driver breaks.
              </p>
            </div>

            {/* Event Details */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 14 }}>⛺ Turtle Festival Event Details 2026</h2>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {eventDetails.map((detail, i) => (
                  <li key={i} style={{ color: "#374151", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: 6 }}>
                    <span style={{ color: "#059669", fontWeight: 700, marginRight: 6 }}>✓</span>{detail}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dates */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 14 }}>📅 Upcoming Dates</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["27 Mar 2026", "03 Apr 2026", "10 Apr 2026", "17 Apr 2026", "24 Apr 2026"].map(d => (
                  <span key={d} style={{ background: "#d1fae5", color: "#065f46", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: "0.9rem" }}>📅 {d}</span>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: "0.82rem", color: "#6b7280" }}>Available for all weekends in April 2026. Contact us for Pune departures.</p>
            </div>

            {/* Offers */}
            <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 14, padding: 24, marginBottom: 24 }}>
              <h2 style={{ color: "#6ee7b7", fontWeight: 800, fontSize: "1.1rem", marginBottom: 16 }}>🎟 Discount Offers</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                {[
                  { code: "EARLY75", desc: "Early Booking Discount" },
                  { code: "NYEGD6", desc: "Group Discount — ₹75/head (6+ people)" },
                  { code: "NYEGD12", desc: "Group Discount — ₹100/head (12+ people)" },
                ].map(o => (
                  <div key={o.code} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 800, color: "#fde68a", letterSpacing: 2, marginBottom: 4 }}>{o.code}</div>
                    <div style={{ color: "#a7f3d0", fontSize: "0.82rem" }}>{o.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="velas-section">
              <h2 style={{ fontWeight: 800, color: "#065f46", fontSize: "1.15rem", marginBottom: 16 }}>❓ Frequently Asked Questions</h2>
              {faqs.map((faq, i) => (
                <div key={i} className="velas-faq-item">
                  <button className="velas-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{i + 1}. {faq.q}</span>
                    <span style={{ fontSize: "1.2rem", marginLeft: 10 }}>{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && <p className="velas-faq-a">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>Starting From</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#059669" }}>₹{selectedPrice.toLocaleString()}</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>per person</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Transport Option</label>
                <select value={transport} onChange={e => setTransport(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1fae5", borderRadius: 10, fontSize: "0.88rem", color: "#065f46", outline: "none" }}>
                  <option value="without">Without Transport — ₹2,599</option>
                  <option value="with_adult">With Transport (5+ yrs) — ₹3,399</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Number of Guests</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                    style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #059669", background: "#fff", color: "#059669", fontSize: "1.2rem", cursor: "pointer", fontWeight: 700 }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#065f46", minWidth: 24, textAlign: "center" }}>{guests}</span>
                  <button onClick={() => setGuests(g => Math.min(30, g + 1))}
                    style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #059669", background: "#fff", color: "#059669", fontSize: "1.2rem", cursor: "pointer", fontWeight: 700 }}>+</button>
                </div>
              </div>

              <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#374151", marginBottom: 6 }}>
                  <span>₹{selectedPrice.toLocaleString()} × {guests} guest{guests > 1 ? "s" : ""}</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#059669", fontSize: "1rem", borderTop: "1px solid #d1fae5", paddingTop: 8, marginTop: 6 }}>
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <a
                href={buildBookingWhatsAppUrl({
                  name: "Velas Turtle Festival 2026",
                  location: "Velas, Ratnagiri",
                  price: total,
                  productType: "tour",
                  guests,
                  note: transport === "without" ? "Transport: without transport" : "Transport: with transport",
                }, "27 Mar, 03 Apr, 10 Apr")}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", width: "100%", background: "#059669", color: "#fff", borderRadius: 12, padding: "14px 0", fontWeight: 800, fontSize: "1rem", textDecoration: "none", textAlign: "center", marginBottom: 10, minHeight: 44 }}
              >
                Book Now
              </a>

              <a href="https://wa.me/919856112727?text=Hi%2C+I%27m+interested+in+Velas+Turtle+Festival+2026"
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25d366", color: "#fff", borderRadius: 12, padding: "12px 0", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", marginBottom: 14 }}>
                <span style={{ fontSize: "1.1rem" }}>💬</span> WhatsApp Enquiry
              </a>

              <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span>⏱</span><span style={{ color: "#374151" }}>2 Nights 2 Days</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span>📅</span><span style={{ color: "#374151" }}>27 Mar, 03 Apr, 10 Apr + more</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span>📍</span><span style={{ color: "#374151" }}>Velas, Ratnagiri</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span>👥</span><span style={{ color: "#374151" }}>Max 30 per batch</span>
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 }}>Need help booking?</div>
              <a href="tel:9856112727" style={{ fontWeight: 700, color: "#059669", textDecoration: "none", fontSize: "0.95rem" }}>📞 9856112727</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
