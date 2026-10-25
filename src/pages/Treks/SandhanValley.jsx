import { useState } from "react";
import { Link } from "react-router-dom";
import { findTrekBySlug } from "../../data/treks";
import BookingCTA from "../../components/BookingCTA";

const HERO_IMG = "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1600&q=80";

const GALLERY = [
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80",
  "https://images.unsplash.com/photo-1527164967080-9b2a2e76ae18?w=800&q=80",
  "https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=800&q=80",
];

const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "gallery",   label: "Photo Gallery" },
  { id: "route",     label: "Trek Route" },
  { id: "itinerary", label: "Itinerary" },
  { id: "details",   label: "Details & Cost" },
];

const highlights = [
  { icon: "🏔", text: "200 ft Deep Water-Carved Canyon — Valley of Shadows" },
  { icon: "⛏", text: "Rappelling Through the Gorge Included" },
  { icon: "🌌", text: "Night Camping Under a Star-Filled Sky" },
  { icon: "🪨", text: "Gorge Narrows to Less Than 3 Feet at Points" },
  { icon: "🌊", text: "Surrounded by Alang, Madan & Kulang (AMK) Peaks" },
  { icon: "🧗", text: "Rock Patches & Technical Terrain — Thrilling Experience" },
  { icon: "🌅", text: "Sunrise Over Kalsubai — Highest Peak in Maharashtra" },
  { icon: "🎖", text: "E-Certificate on Successful Completion" },
  { icon: "👩‍🦯", text: "Female Trek Leader on Every Batch" },
  { icon: "🛡", text: "Adventure Insurance Included" },
];

const discountCodes = [
  { code: "EARLY75", desc: "Early Booking Discount" },
];

const whyCards = [
  { icon: "🤝", title: "Safe Group Environment",    desc: "60–40% male-female ratio; solo travellers always welcome" },
  { icon: "⛏",  title: "Rappelling Included",       desc: "Professional rappelling through the gorge — no prior experience needed" },
  { icon: "🌌", title: "Camping Under Stars",        desc: "Sleep in jungle tents with a sky full of stars above you" },
  { icon: "🍱", title: "All Meals Included",         desc: "Breakfast, packed lunch, evening tea & dinner on Day 1 + breakfast Day 2" },
];

const placesToVisit = [
  { icon: "🏔", name: "The Valley of Shadows",     desc: "A 200 ft deep, 1.5 km long water-carved canyon where sunlight rarely reaches the ground. In some sections the gorge is less than 3 feet wide — a geological marvel." },
  { icon: "⛏", name: "Rappelling Patch",           desc: "A dramatic rappelling section inside the canyon — included in your package. Professional gear and guidance provided by our trained trek leaders." },
  { icon: "🏕", name: "Jungle Star Camping",        desc: "Overnight camping deep in the Sahyadri jungle on Night 2. Sleep under a canopy of stars in high-quality tents far from city lights." },
  { icon: "🏔", name: "Ghatghar & Bhandardara Region", desc: "Surrounded by iconic peaks: Alang, Madan, Kulang (AMK — toughest trek in Sahyadris), Ratangad, Ajoba, and Kalsubai at 5,400 ft." },
];

const trekDetails = {
  "Difficulty Level":   "Moderate to Difficult",
  "Endurance Required": "High — physical fitness essential",
  "Base Village":       "Samrad Village, Ghatghar, Bhandardara",
  "Canyon Depth":       "200 feet",
  "Canyon Length":      "1.5 km",
  "Duration":           "2 Nights 2 Days",
  "Schedule":           "Every Saturday (Friday night departure)",
  "Altitude":           "~3,000 ft (Bhandardara region)",
  "From Mumbai":        "~160 km via Kasara (Kasara train recommended)",
  "Best Season":        "October to March",
};

const pricing = [
  { label: "Full Package — Per Person (with transport from Kasara)", price: "2,699" },
];

const inclusions = [
  "✅ Transport: Kasara to Samrad & Dehne to Asangaon Station",
  "✅ Day 1 — Breakfast, packed lunch, evening tea & dinner",
  "✅ Day 2 — Breakfast",
  "✅ Equipment, expert guides & trek leader charges",
  "✅ Rappelling in the gorge",
  "✅ Tent stay (Saturday night, on sharing basis)",
  "✅ First Aid",
  "❌ Train ticket to Kasara (self-arranged)",
  "❌ Mineral water for personal consumption",
  "❌ Extra meals / soft drinks",
  "❌ Personal expenses",
  "❌ Medical / emergency evacuations if required",
];

const thingsToCarry = [
  "🥾 Trekking Shoes (MANDATORY — sandals not allowed)",
  "🔦 Torch with new batteries (compulsory per person)",
  "🛏 Sleeping bag + carry mat",
  "💧 3 litres water (reusable bottle)",
  "🎒 Haversack / backpack (keep hands free)",
  "👕 Full sleeves + full track pant",
  "🧥 Extra pair of clothes + sweater",
  "🍫 Ready-to-eat snacks (plum cake, chocolate, biscuits)",
  "📱 Camera + dry bag for gadgets",
  "🩹 Personal medicines + first aid",
  "🛏 Bed sheets + personal mug, spoon",
  "🪪 Identity Proof (mandatory)",
];

const itinerary = {
  note: "Booking closes every Thursday 5 PM. Missing the train = missing the trek — no refund. Trekking shoes are MANDATORY.",
  days: [
    {
      title: "Day 0 — Friday Night: Mumbai → Kasara",
      events: [
        { time: "10:50 pm", desc: "Board CSMT–Kasara Fast Local from CSMT. Don't miss this train!" },
        { time: "10:57 pm", desc: "Stop at Byculla." },
        { time: "11:05 pm", desc: "Stop at Dadar." },
        { time: "11:13 pm", desc: "Stop at Kurla." },
        { time: "11:18 pm", desc: "Stop at Ghatkopar." },
        { time: "11:34 pm", desc: "Stop at Thane." },
        { time: "11:50 pm", desc: "Stop at Dombivli." },
        { time: "12:01 am", desc: "Stop at Kalyan." },
        { time: "01:12 am", desc: "Reach Kasara Station." },
      ],
    },
    {
      title: "Day 1 — Saturday: Full Descent Trek",
      events: [
        { time: "01:30 am", desc: "Gather at Kasara Station; depart by pre-booked vehicles to base village." },
        { time: "05:00 am", desc: "Reach Samrad base village; rest for a while." },
        { time: "06:30 am", desc: "Hot breakfast." },
        { time: "07:00 am", desc: "Trek briefing; start full descent trek into Sandhan Valley." },
        { time: "01:30 pm", desc: "Packed lunch en route after the rappelling patch." },
        { time: "04:00 pm", desc: "Evening tea." },
        { time: "05:00 pm", desc: "Rest and freshen up at campsite." },
        { time: "08:30 pm", desc: "Dinner & Night Stay under open sky in tents." },
      ],
    },
    {
      title: "Day 2 — Sunday: Return to Mumbai",
      events: [
        { time: "06:30 am", desc: "Wake up and hot breakfast." },
        { time: "07:30 am", desc: "Start descending toward Dehne village." },
        { time: "10:00 am", desc: "Reach Dehne village; depart to Asangaon Railway Station." },
        { time: "11:00 am", desc: "Reach Asangaon Station." },
        { time: "11:47 am", desc: "Board 11:47 AM CSMT Fast Local or 12:56 PM CSMT Fast Local for Mumbai." },
      ],
    },
  ],
};

const routeInfo = [
  { icon: "🚉", label: "Start Point",     value: "Kasara Station → Samrad Village" },
  { icon: "🏔", label: "Canyon Depth",    value: "200 ft" },
  { icon: "📏", label: "Canyon Length",   value: "1.5 km" },
  { icon: "⛏", label: "Rappelling",      value: "Included in gorge" },
  { icon: "🚉", label: "End Point",       value: "Dehne Village → Asangaon" },
  { icon: "⚡", label: "Difficulty",      value: "Moderate to Difficult" },
];

export default function SandhanValley() {
  const trek = findTrekBySlug("sandhan-valley-trek");
  const [activeTab, setActiveTab]     = useState("overview");
  const [lightboxImg, setLightboxImg] = useState(null);

  return (
    <div className="td-page">

      {/* ── HERO ── */}
      <div className="td-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <span className="td-kicker">🏔 THE VALLEY OF SHADOWS — BHANDARDARA</span>
          <h1 className="td-heading">Sandhan Valley Trek</h1>
          <p className="td-subheading">Water-Carved Canyon · Rappelling · 200 ft Deep · Camping Under Stars</p>
          <div className="td-stats-bar">
            {[
              { icon: "📍", label: "Bhandardara, Maharashtra" },
              { icon: "⏱", label: "2 Nights 2 Days" },
              { icon: "🏔", label: "200 ft Canyon" },
              { icon: "⚡", label: "Moderate–Difficult" },
              { icon: "⭐", label: "4.8 (Every Saturday)" },
              { icon: "💰", label: "From ₹2,699" },
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
                  <h2 className="td-section-title">About Sandhan Valley Trek</h2>
                  <p className="td-para">
                    Sandhan Valley, famously known as the <strong>Valley of Shadows</strong> or Valley of Suspense, is a breathtaking natural wonder nestled in the Sahyadri Western Ghats. This water-carved canyon — <strong>200 feet deep</strong> and stretching <strong>1.5 km</strong> — is a geological marvel where sunlight barely reaches the gorge floor, creating an enchanting interplay of light and shadow.
                  </p>
                  <p className="td-para">
                    Located in the stunning Bhandardara region near Samrad village, Sandhan Valley is surrounded by iconic peaks — Alang, Madan, and Kulang (AMK — known as the toughest trek in the Sahyadris), Ratangad, Ajoba, and Kalsubai (the highest peak in Maharashtra at 5,400 ft). In some sections, the gorge narrows to <strong>less than 3 feet</strong>.
                  </p>

                  <h3 className="td-subsection-title">⛏ Rappelling & Adventure</h3>
                  <p className="td-para">
                    This trek combines thrilling activities — trekking through the canyon, <strong>rappelling</strong> through the gorge, navigating rock patches, and camping under a sky blanketed with stars. It is classified as Moderate to Difficult and is suitable for experienced trekkers or those ready for a serious challenge. High physical fitness is essential.
                  </p>

                  <h3 className="td-subsection-title">⚠️ Booking Deadline</h3>
                  <p className="td-para">
                    <strong>Sandhan Valley Trek booking closes every Thursday at 5 PM</strong> — adventure insurance is compulsory for this trek and must be arranged in advance. Trekking shoes are absolutely mandatory; participants in sandals or sports shoes will be turned back without a refund.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Places to Visit at Sandhan Valley</h2>
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
                  <img src={img} alt={`Sandhan Valley photo ${i + 1}`} className="td-gallery-img" loading="lazy" />
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
            <p className="td-muted">Full descent trek: Samrad Village → Sandhan Valley Gorge → Rappelling → Dehne Village</p>
            <div className="td-card" style={{ marginBottom: 20, padding: "32px 24px", textAlign: "center", background: "linear-gradient(135deg,#e0f7ec,#c8f2de)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: "0.95rem", fontWeight: 700, color: "#0c2e20" }}>
                <span>🚉 Kasara Station<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Night arrival</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏘 Samrad Village<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Start · Rest</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏔 Valley Entry<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Canyon descent</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>⛏ Rappelling<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>In the gorge</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏕 Jungle Camp<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Night under stars</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏘 Dehne Village<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>End · Asangaon</small></span>
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
            <p className="td-muted">Departure Friday night from Mumbai — arrives back Sunday via Asangaon</p>
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
                  "Tap Book on WhatsApp — booking closes every Thursday 5 PM.",
                  "Send the message and mention EARLY75 if you are eligible.",
                  "We confirm your seat in the same WhatsApp chat.",
                  "Pay only after the team confirms on WhatsApp.",
                  "Booking confirmation comes back on WhatsApp.",
                  "WhatsApp group link sent 8 hours before departure.",
                  "Board CSMT–Kasara Fast Local at 10:50 PM on Friday.",
                  "Trek leader meets group at Kasara Station (1:30 AM).",
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
          <span className="td-cta-name">Sandhan Valley Trek & Camping</span>
          <span className="td-cta-meta">Bhandardara, Maharashtra · 2 Nights 2 Days · Every Saturday</span>
        </div>
        <div className="td-cta-price">
          <span className="td-cta-from">from</span>
          <span className="td-cta-amount">₹2,699</span>
        </div>
        <BookingCTA trek={trek} className="btn td-cta-book-btn" label="Book on WhatsApp" />
      </div>
    </div>
  );
}
