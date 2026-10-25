import { useState } from "react";
import { Link } from "react-router-dom";
import { findTrekBySlug } from "../../data/treks";
import BookingCTA from "../../components/BookingCTA";

const HERO_IMG = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80";

const GALLERY = [
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  "https://images.unsplash.com/photo-1546768292-fb12f6c92568?w=800&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80",
  "https://images.unsplash.com/photo-1501786223405-6d024d7c3b8d?w=800&q=80",
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
  { icon: "🌿", text: "14 km through Andharban — The Dark Forest" },
  { icon: "💧", text: "3 Major Waterfall Crossings En Route" },
  { icon: "🏔", text: "Kundalika Valley & Bhira Dam Viewpoints" },
  { icon: "🌊", text: "Misty Clouds, Fog & Monsoon Magic" },
  { icon: "🦅", text: "Kingfishers, Asian Paradise Flycatchers, Falcons" },
  { icon: "🦋", text: "Blue Mormon (Maharashtra State Butterfly)" },
  { icon: "🌸", text: "Wildflowers: Karvi, Sonki, Orchids & Mushrooms" },
  { icon: "🎖", text: "E-Certificate on Successful Completion" },
  { icon: "👩‍🦯", text: "Female Trek Leader on Every Batch" },
  { icon: "🛡", text: "Adventure Insurance Included" },
];

const discountCodes = [
  { code: "GD50",    desc: "Save on group of 5 and more" },
  { code: "EARLY75", desc: "Early Booking Discount" },
];

const whyCards = [
  { icon: "🤝", title: "Safe Group Environment",       desc: "60–40% male-female ratio; solo travellers always welcome" },
  { icon: "🌊", title: "Monsoon Waterfall Magic",      desc: "3 major waterfalls crossed at peak flow — unforgettable" },
  { icon: "🌿", title: "Dense Dark Forest Trail",      desc: "One of Maharashtra's most pristine, uncrowded forest treks" },
  { icon: "🍱", title: "Meals Included",               desc: "Veg breakfast & lunch at local homestay included" },
];

const placesToVisit = [
  { icon: "🏔", name: "Kundalika Valley Viewpoint",   desc: "Sweeping valley views of the Kundalika river origin and the lush Tamhini Ghat landscape from the ridge." },
  { icon: "💧", name: "Three Major Waterfalls",       desc: "Cross and relax at three spectacular waterfalls roaring at full force during the monsoon — highlight of the trek." },
  { icon: "🏘", name: "Hirdi Plateau Village",        desc: "The only village on the trail at mid-point. Stop here for lunch, rest and enjoy panoramic Sahyadri views." },
  { icon: "🏞", name: "Bhira Dam View",               desc: "Dramatic view of the Bhira reservoir from above as the trail descends into the Konkan region." },
];

const trekDetails = {
  "Difficulty Level":   "Medium",
  "Endurance Required": "High — good fitness essential",
  "Base Village":       "Pimpri, Tamhini Ghat",
  "Region":             "Mulshi, Tamhini Ghat, Pune",
  "Duration":           "1 Night 1 Day",
  "Trek Distance":      "14 km (one way descent)",
  "Trek Time":          "~10 hours including breaks",
  "Altitude":           "2,160 ft (659m) above sea level",
  "From Mumbai":        "133 km (approx. 5 hrs)",
  "From Pune":          "70 km (approx. 3 hrs)",
};

const pricing = [
  { label: "With Bus Transport — Mumbai to Mumbai", price: "1,699" },
];

const inclusions = [
  "✅ Travel by private AC vehicle (Mumbai pickup & drop)",
  "✅ 1 Veg Breakfast + 1 Veg Lunch",
  "✅ Forest entry charges",
  "✅ Expert Andharban jungle trek guide",
  "✅ Gadvede Trekkers coordination charges",
  "❌ Train ticket to Kasara (self-arranged)",
  "❌ Mineral water purchased for personal consumption",
  "❌ Extra meals / soft drinks ordered",
  "❌ Personal expenses",
  "❌ Medical / emergency evacuations if required",
];

const thingsToCarry = [
  "🥾 Trekking Shoes (mandatory — campus/CTR brand recommended)",
  "💧 2–3 litres of water (reusable bottle)",
  "🔦 Torch with extra batteries",
  "🎒 Day Backpack 20–30 litres with rain cover",
  "🌧 Rainwear / Poncho / Waterproof jacket",
  "👕 Full sleeves + full track pant (insect protection)",
  "🍫 Dry fruits / energy bars / ORS sachets",
  "📱 Dry bag / ziplock for phone and valuables",
  "🩹 Personal first aid and medicines",
  "🪪 Identity Proof (mandatory)",
];

const itinerary = {
  note: "Missing the bus pickup means missing the trek — no refund. Wear trekking shoes; sandals/sports shoes not allowed.",
  days: [
    {
      title: "Day 0 — Friday Night: Mumbai → Pimpri",
      events: [
        { time: "09:45 pm", desc: "Meet at Borivali National Park main gate." },
        { time: "10:00 pm", desc: "Leave for Pimpri, Tamhini Ghat." },
        { time: "10:10 pm", desc: "Pickup at Virwani Bus Stop, Goregaon." },
        { time: "10:30 pm", desc: "Pickup at Gundavali Bus Stop, Andheri East." },
        { time: "10:45 pm", desc: "Pickup at Kalanagar Bus Stop, Bandra." },
        { time: "11:00 pm", desc: "Pickup at Everard Nagar Bus Stop, Sion." },
        { time: "11:15 pm", desc: "Pickup at Diamond Garden, Chembur." },
        { time: "11:45 pm", desc: "Pickup at Vashi Plaza." },
        { time: "12:05 am", desc: "Pickup at McDonald's, Kalamboli." },
      ],
    },
    {
      title: "Day 1 — Saturday: Andharban Trek",
      events: [
        { time: "~ 4 am",  desc: "Reach Pimpri village; rest on the bus." },
        { time: "06:00 am", desc: "Freshen up and have breakfast at the local villager's house." },
        { time: "07:00 am", desc: "Trek briefing + start full Andharban jungle trek." },
        { time: "11:30 am", desc: "Reach half-point at Hirdi Plateau. Spend time at waterfalls." },
        { time: "12:00 pm", desc: "Start return trek towards Pimpri Dam." },
        { time: "01:30 pm", desc: "Lunch after completing the trek." },
        { time: "02:30 pm", desc: "Reach local homestay — change into dry clothes." },
        { time: "03:30 pm", desc: "Departure back to Mumbai." },
        { time: "10:30 pm", desc: "Approx. arrival in Mumbai." },
      ],
    },
  ],
};

const routeInfo = [
  { icon: "🏘", label: "Start Point",       value: "Pimpri Dam (2100 ft)" },
  { icon: "🏔", label: "Turnaround",        value: "Hirdi Plateau" },
  { icon: "📏", label: "Distance",          value: "14 km" },
  { icon: "⏱", label: "Trek Time",         value: "~10 hours" },
  { icon: "💧", label: "Waterfall Crossings", value: "3 Major" },
  { icon: "⚡", label: "Difficulty",        value: "Medium" },
];

export default function AndharbanTrek() {
  const trek = findTrekBySlug("andharban-jungle-trek");
  const [activeTab, setActiveTab]   = useState("overview");
  const [lightboxImg, setLightboxImg] = useState(null);

  return (
    <div className="td-page">

      {/* ── HERO ── */}
      <div className="td-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <span className="td-kicker">🌿 MONSOON TREK — TAMHINI GHAT</span>
          <h1 className="td-heading">Andharban Trek 2025</h1>
          <p className="td-subheading">Dark Dense Forest · 14 km · 3 Waterfalls · Kundalika Valley</p>
          <div className="td-stats-bar">
            {[
              { icon: "📍", label: "Pimpri, Tamhini Ghat" },
              { icon: "⏱", label: "1 Night 1 Day" },
              { icon: "🏔", label: "659m (2160 ft)" },
              { icon: "⚡", label: "Medium" },
              { icon: "⭐", label: "4.7 (20,000+ trekkers)" },
              { icon: "💰", label: "From ₹1,699" },
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
                  <h2 className="td-section-title">About Andharban Trek</h2>
                  <p className="td-para">
                    Andharban, meaning <strong>"dark, dense forest"</strong> in Marathi, is one of the most beautiful monsoon treks in Maharashtra. It is a gradual descent trek from 2,100 ft down to Bhira Dam, walking through a ridge offering fantastic views of the Kundalika Valley, Bhira Dam, Devkund Waterfall, and the Tamhini Ghat mountain ranges.
                  </p>
                  <p className="td-para">
                    Evergreen forest covers you with shade for the first 6–8 km. Three major waterfalls are crossed along the route. The same valley is the origin of the Kundalika river, famous for Kolad river rafting. The trail is located in Tamhini Ghat — also known for Plus Valley, Devkund Waterfall, and the Kundalika Valley viewpoint.
                  </p>

                  <h3 className="td-subsection-title">🌧 Monsoon Trek Experience</h3>
                  <p className="td-para">
                    During the rainy season, this forest comes alive with rivers, streams, waterfalls, and fog. The trail is moderately challenging and requires good fitness — stream crossings and waterfall crossings can become dangerous on heavy rainfall days. Forest department permits are compulsory. You can spot wildflowers like Karvi, Sonki, Orchids, and Mushrooms, and birds like Kingfishers, Asian Paradise Flycatchers, Falcons, and the Blue Mormon butterfly.
                  </p>

                  <h3 className="td-subsection-title">⚠️ Important Notice</h3>
                  <p className="td-para">
                    The trail can be dangerous without a guide — fog makes navigation difficult and unpredictable weather can cause flash floods around waterfall crossings. <strong>Trekking shoes are mandatory</strong>. The trek is open from June to September; it may be banned during peak monsoon. Advance booking is required.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Forest & Wildlife</h2>
                  <p className="td-para">
                    Andharban forest spreads along the vast area of the Sahyadris starting from Pimpri village, passing through the Kundalika Valley through the dark forest patch to the open Hirdi Plateau, and then descending to Bhira Dam. You can spot hunting traps laid by locals who occasionally hunt wild boars, porcupines, and monitor lizards. The forest is home to rare orchid flowers, various mushroom species, and the magnificent Karvi flower which blooms once every seven years.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Places to Visit on Andharban Trek</h2>
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
                  <img src={img} alt={`Andharban Trek photo ${i + 1}`} className="td-gallery-img" loading="lazy" />
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
            <p className="td-muted">Gradual descent from Pimpri Dam → Dense Forest → Hirdi Plateau → Bhira Dam</p>
            <div className="td-card" style={{ marginBottom: 20, padding: "32px 24px", textAlign: "center", background: "linear-gradient(135deg,#e0f7ec,#c8f2de)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: "0.95rem", fontWeight: 700, color: "#0c2e20" }}>
                <span>🏘 Pimpri Dam<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>Start · 2100 ft</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🌊 Waterfall 1<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>4 km</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🌊 Waterfall 2 &amp; 3<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>7 km</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>→</span>
                <span>🏘 Hirdi Plateau<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>10 km · Lunch</small></span>
                <span style={{ color: "#1a9b65", fontSize: "1.5rem" }}>↩</span>
                <span>🏘 Return to Pimpri<br/><small style={{ fontWeight: 400, color: "#5a7a6a" }}>14 km total</small></span>
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
            <p className="td-muted">Departure from Mumbai — centralized pickups en route</p>
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
                  "Arrive at pickup point 10 minutes early.",
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
          <span className="td-cta-name">Andharban Trek 2025</span>
          <span className="td-cta-meta">Pimpri, Tamhini Ghat · 1 Night 1 Day · 659m</span>
        </div>
        <div className="td-cta-price">
          <span className="td-cta-from">from</span>
          <span className="td-cta-amount">₹1,699</span>
        </div>
        <BookingCTA trek={trek} className="btn td-cta-book-btn" label="Book on WhatsApp" />
      </div>
    </div>
  );
}
