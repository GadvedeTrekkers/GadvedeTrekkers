import { useState } from "react";
import { Link } from "react-router-dom";
import { findTrekBySlug } from "../../data/treks";
import BookingCTA from "../../components/BookingCTA";

const HERO_IMG = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80";

const GALLERY = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80",
];

const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "gallery",   label: "Photo Gallery" },
  { id: "route",     label: "Trek Route" },
  { id: "itinerary", label: "Itinerary" },
  { id: "details",   label: "Details & Cost" },
];

const highlights = [
  { icon: "🏰", text: "Two Forts — Shrivardhan & Manaranjan Strongholds" },
  { icon: "✨", text: "Fireflies at Night — Udhewadi Village (Monsoon)" },
  { icon: "🌅", text: "Sunrise from Shrivardhan Fort Summit" },
  { icon: "💧", text: "Kataldhar Waterfall Viewpoint (Monsoon)" },
  { icon: "🔥", text: "Campfire & Storytime at Udhewadi Village" },
  { icon: "⛩", text: "Godhaneshwar Temple & Uday Sagar Lake Visit" },
  { icon: "⛺", text: "Tent Stay on Multi-Sharing Basis" },
  { icon: "🎖", text: "E-Certificate on Successful Completion" },
  { icon: "👩‍🦯", text: "Female Trek Leader on Every Batch" },
  { icon: "🛡", text: "Adventure Insurance Included" },
];

const discountCodes = [
  { code: "GDCAMP100", desc: "Save ₹100 per head on group of 10 and more" },
  { code: "GDCAMP50",  desc: "Save ₹50 per head on group of 5 and more" },
  { code: "FIRE10",    desc: "Fireflies Special — 10% off on early booking" },
  { code: "EARLY75",   desc: "Early Booking Discount — ₹75 off" },
];

const whyCards = [
  { icon: "🤝", title: "Safe Group Environment",   desc: "60–40% male-female ratio; solo travellers always welcome" },
  { icon: "🌅", title: "Shrivardhan Sunrise",       desc: "Watch the golden sunrise from Maharashtra's historic fort summit" },
  { icon: "🔥", title: "Campfire & Bonfire Night",  desc: "Evening campfire, team games, and stories at Udhewadi Village" },
  { icon: "🍱", title: "Meals Included",            desc: "1 Veg Dinner + 1 Veg Breakfast at homestay included" },
];

const placesToVisit = [
  { icon: "🏰", name: "Shrivardhan Fort (2710 ft)",  desc: "The taller of the two Rajmachi forts. Climb at dawn to witness a spectacular sunrise over the Sahyadri ranges." },
  { icon: "🏯", name: "Manaranjan Fort",              desc: "The companion stronghold of Rajmachi. Together they guarded the strategic Borghat trade route in the Sahyadri Mountains." },
  { icon: "💧", name: "Kataldhar Waterfall",          desc: "A dramatic waterfall visible from Shrivardhan Fort during the monsoon — one of Maharashtra's most photogenic cascade viewpoints." },
  { icon: "⛩", name: "Godhaneshwar Temple",          desc: "An ancient Shiva temple at the base village, visited in the evening before the campfire night stay." },
  { icon: "💧", name: "Uday Sagar Lake",              desc: "A serene natural lake near the base village, perfect for an evening stroll and sunset views before dinner." },
];

const trekDetails = {
  "Difficulty Level":   "Easy to Medium",
  "Endurance Required": "Low to Moderate — suitable for beginners",
  "Base Village":       "Udhewadi Village, Lonavala",
  "Fort Height":        "2,710 ft (Shrivardhan Fort)",
  "Duration":           "1 Night 2 Days",
  "Nearest Railway":    "Lonavala Railway Station",
  "Jeep Distance":      "16 km from Lonavala to Udhewadi",
  "From Mumbai":        "~100 km (Lonavala by train/bus)",
  "From Pune":          "~65 km (Lonavala by train/local)",
  "Best Season":        "Monsoon (Jul–Sep) · Winter (Oct–Feb)",
};

const pricing = [
  { label: "Weekend Trek & Camping — Per Person", price: "1,499" },
];

const inclusions = [
  "✅ Jeep travel: Lonavala to Udhewadi & back (Lonavala to Lonavala)",
  "✅ 1 Veg Dinner (Day 1) + 1 Veg Breakfast (Day 2)",
  "✅ Tent stay on multi-sharing basis (Triple / Quad sharing, Male/Female separate)",
  "✅ Expert trek leader",
  "✅ E-certificate on completion",
  "✅ WhatsApp group coordination",
  "❌ Train / bus travel to Lonavala (self-arranged)",
  "❌ Breakfast on Day 1",
  "❌ Mineral water purchased for personal consumption",
  "❌ Extra meals / soft drinks ordered",
  "❌ Any kind of personal expenses",
  "❌ Costs due to unforeseen circumstances (roadblocks, bad weather)",
  "❌ Medical / emergency evacuations if required",
];

const thingsToCarry = [
  "🥾 Trekking Shoes (mandatory)",
  "💧 2–3 litres of water",
  "🔦 Torch with extra batteries",
  "🛏 Sleeping bag or two bed-sheets",
  "🧥 Warm clothes (nights are cold)",
  "🎒 Day Backpack 20–30 litres",
  "🌧 Rainwear / Poncho (monsoon season)",
  "🍫 Dry fruits / energy bars / ORS sachets",
  "📱 Dry bag / ziplock for phone",
  "🩹 Personal first aid and medicines",
  "🪪 Identity Proof (mandatory)",
];

const ITINERARIES = {
  mumbai: {
    label: "From Mumbai",
    sublabel: "Chennai Express Route",
    icon: "🚂",
    note: "Board Chennai Express 11042 from CSMT. People may board from their nearest station. Missing the train = missing the trek — no refund.",
    days: [
      {
        title: "Day 1 — Saturday",
        events: [
          { time: "02:00 pm", desc: "Board Chennai Express 11042 at CSMT." },
          { time: "02:12 pm", desc: "Dadar station." },
          { time: "02:33 pm", desc: "Thane station." },
          { time: "02:55 pm", desc: "Kalyan station." },
          { time: "04:20 pm", desc: "Arrive at Lonavala Railway Station." },
          { time: "04:45 pm", desc: "Assemble at Lonavala station; depart by jeep towards Udhewadi." },
          { time: "06:30 pm", desc: "Reach Udhewadi base village." },
          { time: "07:00 pm", desc: "Evening walk — spot Fireflies near Uday Sagar Lake & Godhaneshwar Temple." },
          { time: "09:00 pm", desc: "Dinner at camp." },
          { time: "10:00 pm", desc: "Tent allocation, campfire & storytime." },
        ],
      },
      {
        title: "Day 2 — Sunday",
        events: [
          { time: "05:00 am", desc: "Wake up and freshen up." },
          { time: "05:30 am", desc: "Start ascending Shrivardhan Fort." },
          { time: "06:30 am", desc: "Reach the summit — watch sunrise over the Sahyadris." },
          { time: "08:00 am", desc: "Start descending." },
          { time: "08:45 am", desc: "Reach base village — hot breakfast at camp." },
          { time: "09:15 am", desc: "Visit Kataldhar Waterfall viewpoint & Manaranjan Fort." },
          { time: "10:30 am", desc: "Depart by jeep back to Lonavala Railway Station." },
          { time: "12:00 pm", desc: "Arrive at Lonavala — board train back to Mumbai / Pune." },
        ],
      },
    ],
  },
  pune: {
    label: "From Pune",
    sublabel: "Pune Local Train Route",
    icon: "🚌",
    note: "Board Pune–Lonavala local train. Transport as per participant count. Date transfer within 3 days of departure: ₹200/person.",
    days: [
      {
        title: "Day 1 — Saturday",
        events: [
          { time: "03:00 pm", desc: "Board Pune–Lonavala local train from Pune station." },
          { time: "04:20 pm", desc: "Arrive at Lonavala Railway Station." },
          { time: "04:45 pm", desc: "Assemble at Lonavala station; depart by jeep towards Udhewadi." },
          { time: "06:30 pm", desc: "Reach Udhewadi base village." },
          { time: "07:00 pm", desc: "Evening walk — spot Fireflies near Uday Sagar Lake & Godhaneshwar Temple." },
          { time: "09:00 pm", desc: "Dinner at camp." },
          { time: "10:00 pm", desc: "Tent allocation, campfire & storytime." },
        ],
      },
      {
        title: "Day 2 — Sunday",
        events: [
          { time: "05:00 am", desc: "Wake up and freshen up." },
          { time: "05:30 am", desc: "Start ascending Shrivardhan Fort." },
          { time: "06:30 am", desc: "Reach the summit — watch sunrise over the Sahyadris." },
          { time: "08:00 am", desc: "Start descending." },
          { time: "08:45 am", desc: "Reach base village — hot breakfast at camp." },
          { time: "09:15 am", desc: "Visit Kataldhar Waterfall viewpoint & Manaranjan Fort." },
          { time: "10:30 am", desc: "Depart by jeep back to Lonavala Railway Station." },
          { time: "12:30 pm", desc: "Arrive at Lonavala — board train back to Pune." },
        ],
      },
    ],
  },
};

const routeInfo = [
  { icon: "🚉", label: "Assembly Point",  value: "Lonavala Railway Station" },
  { icon: "🚙", label: "Jeep to Base",    value: "16 km to Udhewadi" },
  { icon: "🏰", label: "Fort Summit",     value: "Shrivardhan — 2,710 ft" },
  { icon: "⏱", label: "Climb Time",      value: "~1 hour (base to summit)" },
  { icon: "💧", label: "Waterfall",       value: "Kataldhar (monsoon)" },
  { icon: "⚡", label: "Difficulty",      value: "Easy to Medium" },
];

export default function RajmachiTrek() {
  const trek = findTrekBySlug("rajmachi-trek");
  const [activeTab, setActiveTab]       = useState("overview");
  const [lightboxImg, setLightboxImg]   = useState(null);
  const [activeRoute, setActiveRoute]   = useState("mumbai");
  const itinerary = ITINERARIES[activeRoute];

  return (
    <div className="td-page">

      {/* ── HERO ── */}
      <div className="td-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <span className="td-kicker">✨ FORT TREK & FIREFLIES CAMPING — LONAVALA</span>
          <h1 className="td-heading">Rajmachi Fireflies Trek 2025</h1>
          <p className="td-subheading">Shrivardhan & Manaranjan Forts · Fireflies at Night · Campfire · Kataldhar Waterfall</p>
          <div className="td-stats-bar">
            {[
              { icon: "📍", label: "Udhewadi, Lonavala" },
              { icon: "⏱", label: "1 Night 2 Days" },
              { icon: "🏔", label: "2,710 ft (825m)" },
              { icon: "⚡", label: "Easy–Medium" },
              { icon: "⭐", label: "4.5 (15,000+ trekkers)" },
              { icon: "💰", label: "From ₹1,499" },
            ].map(s => (
              <div className="td-stat" key={s.label}>
                <span className="td-stat-icon">{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="td-hero-actions">
            <BookingCTA trek={trek} className="btn td-book-btn" label="Book on WhatsApp" />
            <button className="btn td-itinerary-btn" onClick={() => setActiveTab("itinerary")}>View Itinerary</button>
          </div>
        </div>
      </div>

      {/* ── STICKY TABS ── */}
      <div className="td-tabs-wrapper" role="tablist">
        <div className="td-tabs container-fluid td-shell">
          {TABS.map(tab => (
            <button key={tab.id} role="tab" aria-selected={activeTab === tab.id}
              className={`td-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container-fluid td-shell td-body">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="td-section">
            <div className="td-overview-grid">
              <div className="td-overview-main">
                <div className="td-card">
                  <h2 className="td-section-title">About Rajmachi Fort Trek</h2>
                  <p className="td-para">
                    Rajmachi Fort is a historical fort complex featuring two powerful stronghold forts — <strong>Shrivardhan</strong> and <strong>Manaranjan</strong> — in the Lonavala region of the Sahyadri Mountains. Visible from the Mumbai–Pune Expressway on the right-hand side of Borghat, the popular Rajmachi View Point near Khandala draws thousands of visitors year-round.
                  </p>
                  <p className="td-para">
                    Rajmachi is among the most beloved trekking destinations in Maharashtra. We stay at <strong>Udhewadi Village</strong>, located below the two Balekilla forts, in a traditional local homestay. The base village is accessible by jeep from Lonavala (16 km) or by a 16 km hike.
                  </p>

                  <h3 className="td-subsection-title">🏯 History & Significance</h3>
                  <p className="td-para">
                    Rajmachi Fort was strategically positioned to overlook Borghat — the ancient trade route through the Sahyadris connecting the Deccan plateau to the Konkan coast. It served as a key military post controlling movement through this crucial pass. The fort complex later came under Maratha control, and its strategic importance made it one of the most significant hill stations in Western Maharashtra.
                  </p>

                  <h3 className="td-subsection-title">🌿 Monsoon Magic</h3>
                  <p className="td-para">
                    During the monsoon, the entire Rajmachi region transforms into a lush green paradise. The <strong>Kataldhar Waterfall</strong> becomes clearly visible from Shrivardhan Fort's summit — one of Maharashtra's most dramatic waterfall viewpoints. Fireflies can be spotted in the village during evening walks, making the night stay truly magical.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Places to Visit at Rajmachi</h2>
                  <div className="td-places-list">
                    {placesToVisit.map(place => (
                      <div className="td-place-item" key={place.name}>
                        <span className="td-place-icon">{place.icon}</span>
                        <div>
                          <strong className="td-place-name">{place.name}</strong>
                          <p className="td-place-desc">{place.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="td-overview-side">
                <div className="td-card td-highlights-card">
                  <h3 className="td-section-title">Trek Highlights</h3>
                  <ul className="td-highlights-list">
                    {highlights.map(h => (
                      <li key={h.text} className="td-highlight-item">
                        <span className="td-highlight-icon">{h.icon}</span>
                        <span>{h.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="td-card" style={{ marginTop: 16 }}>
                  <h3 className="td-section-title">Discount Offers</h3>
                  <div className="td-discount-codes">
                    {discountCodes.map(d => (
                      <div className="td-discount-item" key={d.code}>
                        <span className="td-discount-code">{d.code}</span>
                        <span className="td-discount-desc">{d.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="td-why-grid" style={{ marginTop: 16 }}>
                  {whyCards.map(w => (
                    <div className="td-why-card" key={w.title}>
                      <span className="td-why-icon">{w.icon}</span>
                      <strong>{w.title}</strong>
                      <p>{w.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── GALLERY ── */}
        {activeTab === "gallery" && (
          <div className="td-section">
            <h2 className="td-section-title">Photo Gallery</h2>
            <p className="td-muted">Hover to zoom · Click to view full screen</p>
            <div className="td-gallery-grid">
              {[...GALLERY, ...GALLERY].map((img, i) => (
                <div className="td-gallery-item" key={i} onClick={() => setLightboxImg(img)}
                  role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && setLightboxImg(img)}>
                  <img src={img} alt={`Rajmachi Fort Trek photo ${i + 1}`} className="td-gallery-img" loading="lazy" />
                  <div className="td-gallery-zoom">🔍 View</div>
                </div>
              ))}
            </div>
            {lightboxImg && (
              <div className="td-lightbox" onClick={() => setLightboxImg(null)}>
                <div className="td-lightbox-inner" onClick={e => e.stopPropagation()}>
                  <img src={lightboxImg} alt="Full view" />
                  <button className="td-lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ROUTE ── */}
        {activeTab === "route" && (
          <div className="td-section">
            <h2 className="td-section-title">Trek Route Map</h2>
            <p className="td-muted">Lonavala Station → Jeep → Udhewadi Village → Shrivardhan Fort Summit → Return</p>
            <div className="td-card" style={{ marginBottom: 20, padding: "32px 24px", textAlign: "center", background: "linear-gradient(135deg,#e0f7ec,#c8f2de)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: "0.95rem", fontWeight: 700, color: "#0c2e20" }}>
                <span>🚉 Lonavala Station<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Assembly</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🚙 16 km Jeep Ride<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>To Udhewadi</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏘 Udhewadi Village<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Base Camp</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏰 Shrivardhan<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>2710 ft · Sunrise</small></span>
              </div>
            </div>
            <div className="td-route-info-grid">
              {routeInfo.map(r => (
                <div className="td-route-info-item" key={r.label}>
                  <span className="td-route-icon">{r.icon}</span>
                  <div>
                    <div className="td-route-label">{r.label}</div>
                    <div className="td-route-value">{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ITINERARY ── */}
        {activeTab === "itinerary" && (
          <div className="td-section">
            <h2 className="td-section-title">Trek Itinerary</h2>
            <p className="td-muted">Select your departure city — participants board train to Lonavala</p>

            {/* Route selector */}
            <div className="td-itinerary-tabs" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {Object.entries(ITINERARIES).map(([key, route]) => (
                <button key={key} onClick={() => setActiveRoute(key)}
                  className={`td-itinerary-tab${activeRoute === key ? " active" : ""}`}
                  style={{ padding: "10px 20px", borderRadius: 8, border: "2px solid", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                    borderColor: activeRoute === key ? "#1a9b65" : "#d1d5db",
                    background: activeRoute === key ? "#1a9b65" : "#fff",
                    color: activeRoute === key ? "#fff" : "#374151" }}>
                  {route.icon} {route.label}
                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 400, opacity: 0.85 }}>{route.sublabel}</span>
                </button>
              ))}
            </div>

            <div className="td-itinerary-note">⚠️ {itinerary.note}</div>
            <div className="td-timeline">
              {itinerary.days.map((day, di) => (
                <div className="td-timeline-day" key={di}>
                  <div className="td-timeline-day-title">{day.title}</div>
                  <div className="td-timeline-events">
                    {day.events.map((ev, ei) => (
                      <div className="td-timeline-event" key={ei}>
                        <div className="td-timeline-time">{ev.time}</div>
                        <div className="td-timeline-dot" />
                        <div className="td-timeline-desc">{ev.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="td-card td-booking-steps-card">
              <h3 className="td-section-title">How to Book?</h3>
              <ol className="td-booking-steps">
                {[
                  "Tap Book on WhatsApp. The chat includes the trek, date, and fee.",
                  "Send the message and mention travellers or a coupon.",
                  "We confirm your seat in the same WhatsApp chat.",
                  "Pay only after the team confirms on WhatsApp.",
                  "Booking confirmation comes back on WhatsApp.",
                  "WhatsApp group link sent 8 hours before departure.",
                  "Trek leader details shared in the WhatsApp group.",
                  "Board your train to Lonavala from Mumbai or Pune.",
                ].map((step, i) => (
                  <li key={i} className="td-booking-step">
                    <span className="td-booking-step-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <BookingCTA trek={trek} className="btn td-book-btn" style={{ marginTop: 20 }} label="Book on WhatsApp" />
            </div>
          </div>
        )}

        {/* ── DETAILS & COST ── */}
        {activeTab === "details" && (
          <div className="td-section">
            <div className="td-details-grid">
              <div className="td-card">
                <h2 className="td-section-title">Trek Details</h2>
                <table className="td-details-table">
                  <tbody>
                    {Object.entries(trekDetails).map(([key, val]) => (
                      <tr key={key}>
                        <td className="td-table-key">{key}</td>
                        <td className="td-table-val">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="td-card">
                  <h2 className="td-section-title">Pricing</h2>
                  <div className="td-pricing-cards">
                    {pricing.map(p => (
                      <div className="td-pricing-card" key={p.label}>
                        <div className="td-pricing-label">{p.label}</div>
                        <div className="td-pricing-price">₹{p.price}<span>/person</span></div>
                        <BookingCTA trek={trek} className="btn td-pricing-book-btn" label="Book on WhatsApp" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="td-card" style={{ marginTop: 18 }}>
                  <h3 className="td-section-title">What's Included / Not Included</h3>
                  <ul className="td-inclusions">
                    {inclusions.map(item => (
                      <li key={item} className="td-inclusion-item">{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="td-card" style={{ marginTop: 18 }}>
                  <h3 className="td-section-title">Things to Carry</h3>
                  <ul className="td-inclusions">
                    {thingsToCarry.map(item => (
                      <li key={item} className="td-inclusion-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY CTA ── */}
      <div className="td-cta-bar">
        <div className="td-cta-info">
          <span className="td-cta-name">Rajmachi Fireflies Trek</span>
          <span className="td-cta-meta">Udhewadi, Lonavala · 1 Night 2 Days · 2710 ft · ✨ Fireflies</span>
        </div>
        <div className="td-cta-price">
          <span className="td-cta-from">from</span>
          <span className="td-cta-amount">₹1,499</span>
        </div>
        <BookingCTA trek={trek} className="btn td-cta-book-btn" label="Book on WhatsApp" />
      </div>
    </div>
  );
}
