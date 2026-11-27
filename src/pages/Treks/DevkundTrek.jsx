import { useState } from "react";
import { Link } from "react-router-dom";
import { findTrekBySlug } from "../../data/treks";
import BookingCTA from "../../components/BookingCTA";
import { useWhatsappTrip } from "../../hooks/useWhatsappTrip";

const HERO_IMG = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80";

const GALLERY = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1546768292-fb12f6c92568?w=800&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
];

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "gallery",    label: "Photo Gallery" },
  { id: "route",      label: "Trek Route" },
  { id: "itinerary",  label: "Itinerary" },
  { id: "details",    label: "Details & Cost" },
  { id: "faq",        label: "FAQs" },
];

const highlights = [
  { icon: "💧", text: "Devkund — 'Bathing Pond of Gods' (250 ft Plunge Waterfall)" },
  { icon: "🌊", text: "Origin of the Kundalika River" },
  { icon: "🌿", text: "6 km Jungle Trail Through Sahyadri Forest" },
  { icon: "🐟", text: "Natural Fish Spa in Turquoise Waters" },
  { icon: "🏕", text: "Camping Options Near Bhira Dam" },
  { icon: "🎖", text: "E-Certificate on Successful Completion" },
  { icon: "👩‍🦯", text: "Female Trek Leader on Every Batch" },
  { icon: "🛡", text: "Adventure Insurance Included" },
  { icon: "⭐", text: "4.7 Rating · 20,000+ Happy Trekkers" },
  { icon: "📸", text: "Perfect for Photographers & Vloggers" },
];

const discountCodes = [
  { code: "GD50",    desc: "Save on group of 5 and more" },
  { code: "EARLY75", desc: "Early Booking Discount" },
];

const whyCards = [
  { icon: "🤝", title: "Safe Group Environment",    desc: "Solo travellers always welcome; guided by experienced trek leaders" },
  { icon: "💧", title: "Stunning Plunge Waterfall", desc: "Turquoise waters, fish spa, and magical colour-changing views" },
  { icon: "🌿", title: "Pristine Jungle Trail",     desc: "Rocky outcrops, perennial waterfalls & lush Sahyadri wilderness" },
  { icon: "🍱", title: "Breakfast & Lunch",         desc: "Meals served at the base village before and after the trek" },
];

const placesToVisit = [
  { icon: "💧", name: "Devkund Waterfall",       desc: "A 250 ft plunge waterfall with mythological significance, featuring a natural turquoise pool perfect for a relaxing dip and fish spa." },
  { icon: "🏞", name: "Bhira Dam",               desc: "The trek starts near Bhira Dam — a scenic reservoir surrounded by lush Sahyadri hills and an ideal spot for nature photography." },
  { icon: "🚣", name: "Kolad River Rafting",     desc: "The Kundalika River, which originates at Devkund, is famous for Kolad river rafting, kayaking, and boating adventures." },
  { icon: "🏔", name: "Tamhini Ghats",           desc: "Explore the adjacent Tamhini Ghat region known for its waterfalls, fog-covered roads, and spectacular monsoon scenery." },
  { icon: "🏛", name: "Kuda Caves",              desc: "Nearby Buddhist rock-cut caves featuring intricate carvings and sculptures of historical and archaeological significance." },
  { icon: "🌄", name: "Plus Valley",             desc: "Peaceful hiking trail with stunning views and lush greenery, located close to the Devkund region." },
];

const trekDetails = {
  "Difficulty Level":        "Moderate",
  "Endurance Required":      "Medium — BMI under 30",
  "Base Village":            "Bhira (Patnus Village)",
  "Region":                  "Raigad District, Maharashtra",
  "Duration":                "1 Day",
  "Trek Distance":           "6 km (one way)",
  "Trek Time":               "~2 hours (one way)",
  "Starting Point Height":   "72 feet above sea level",
  "Highest Point":           "535 feet",
  "Waterfall Height":        "250 feet",
  "Best Time to Visit":      "June to February",
  "From Pune":               "100 km (approx. 3 hrs)",
  "From Mumbai":             "130 km (approx. 4 hrs)",
  "From Lonavala":           "83 km (approx. 3 hrs)",
  "Washroom":                "Available at Base Village",
};

const pricing = [
  { label: "Without Transport", price: "899" },
  { label: "With Transport (Pune Pickup & Drop)", price: "1,449" },
];

const inclusions = [
  "✅ Expert trek guide throughout the trail",
  "✅ Veg Breakfast at base village",
  "✅ Veg Lunch after return trek",
  "✅ Forest entry charges",
  "✅ Gadvede Trekkers coordination charges",
  "✅ Adventure insurance for every trekker",
  "✅ E-certificate on successful trek completion",
  "❌ Transport (available at additional ₹550/person)",
  "❌ Mineral water purchased for personal consumption",
  "❌ Extra meals / soft drinks ordered",
  "❌ Personal expenses",
  "❌ Medical / emergency evacuations if required",
];

const thingsToCarry = [
  "🥾 Trekking Shoes (mandatory — slippery jungle trail)",
  "💧 2–3 litres of water (reusable bottle)",
  "🎒 Day Backpack 15–20 litres with rain cover",
  "🌧 Rainwear / Poncho / Waterproof jacket",
  "👕 Full sleeves + full track pant (insect protection)",
  "🍫 Dry fruits / energy bars / ORS sachets",
  "📱 Dry bag / ziplock for phone and valuables",
  "📷 Waterproof camera or phone cover",
  "🩹 Personal first aid and medicines",
  "🪪 Identity Proof (mandatory)",
  "🧴 Sunscreen and insect repellent",
];

const ITINERARIES = {
  pune: {
    label: "From Pune",
    sublabel: "Pune Pickup Route",
    icon: "🚌",
    note: "Missing the bus pickup means missing the trek — no refund. Trekking shoes are mandatory; sandals/sports shoes not allowed. Swimming in the Dam or Waterfall is strictly prohibited.",
    days: [
      {
        title: "Day 0 — Night: Pune → Bhira",
        events: [
          { time: "11:15 pm", desc: "Meet near Inorbit Mall, Viman Nagar." },
          { time: "11:30 pm", desc: "Departure for the trek." },
        ],
      },
      {
        title: "Day 1 — Devkund Waterfall Trek",
        events: [
          { time: "12:00 am", desc: "Meet at McDonald's, Deccan." },
          { time: "12:20 am", desc: "Pick up at Chandni Chowk." },
          { time: "12:35 am", desc: "Pick up at Wakad Bridge / Rajyog Hotel." },
          { time: "12:40 am", desc: "Pick up at Hinjewadi Chowk." },
          { time: "12:50 am", desc: "Pick up at Pirangut Chowk, Hinjewadi Phase 3." },
          { time: "04:30 am", desc: "Reach Bhira base village parking and rest in the bus." },
          { time: "05:00 am", desc: "Breakfast at base village." },
          { time: "06:00 am", desc: "Start trek towards Devkund Waterfall." },
          { time: "08:00 am", desc: "Reach the Devkund Waterfall — enjoy the turquoise plunge pool, natural fish spa, and scenic views." },
          { time: "09:00 am", desc: "Start return trek towards base village." },
          { time: "11:00 am", desc: "Reach base village and have Lunch." },
          { time: "01:00 pm", desc: "Start return journey to Pune." },
          { time: "06:00 pm", desc: "Approximate arrival in Pune." },
        ],
      },
    ],
  },
  mumbai: {
    label: "From Mumbai",
    sublabel: "Mumbai Pickup Route",
    icon: "🚂",
    note: "Missing the bus pickup means missing the trek — no refund. Trekking shoes are mandatory; sandals/sports shoes not allowed. Swimming in the Dam or Waterfall is strictly prohibited.",
    days: [
      {
        title: "Day 0 — Night: Mumbai → Bhira",
        events: [
          { time: "09:30 pm", desc: "Meet at McDonald's, Thane Station." },
          { time: "09:45 pm", desc: "Departure from Thane." },
          { time: "10:00 pm", desc: "Pick up at Dombivali Station (East)." },
          { time: "10:15 pm", desc: "Pick up at Kalyan Station." },
          { time: "10:40 pm", desc: "Pick up at Badlapur Station." },
          { time: "11:00 pm", desc: "Pick up at Karjat area (confirm with trek leader)." },
        ],
      },
      {
        title: "Day 1 — Devkund Waterfall Trek",
        events: [
          { time: "03:30 am", desc: "Reach Bhira base village parking and rest in the bus." },
          { time: "05:00 am", desc: "Breakfast at base village." },
          { time: "06:00 am", desc: "Start trek towards Devkund Waterfall." },
          { time: "08:00 am", desc: "Reach the Devkund Waterfall — enjoy the turquoise plunge pool, natural fish spa, and scenic views." },
          { time: "09:00 am", desc: "Start return trek towards base village." },
          { time: "11:00 am", desc: "Reach base village and have Lunch." },
          { time: "01:00 pm", desc: "Start return journey to Mumbai." },
          { time: "07:00 pm", desc: "Approximate arrival in Mumbai." },
        ],
      },
    ],
  },
};

const FAQS = [
  { q: "What is the difficulty level of Devkund Waterfall Trek?", a: "Devkund Waterfall Trek is rated as Moderate. The 6 km jungle trail involves stream crossings and some rocky sections. No prior trekking experience is required, but a reasonable fitness level is recommended." },
  { q: "Is swimming allowed at Devkund Waterfall?", a: "Swimming is NOT allowed at Devkund Waterfall or in Bhira Dam. The current can be strong and unpredictable. Trekkers may wade in shallow areas near the base of the falls under the trek leader's supervision." },
  { q: "What shoes should I wear for Devkund Trek?", a: "Proper trekking shoes are mandatory. Sandals, slippers, and sports/running shoes are not allowed as the jungle trail is slippery, especially during the monsoon season." },
  { q: "What is the best time to visit Devkund Waterfall?", a: "The best time is June to February. The waterfall is at its fullest during the monsoon (June–September) and post-monsoon (October–February). The trek is closed in summer (March–May) due to dry conditions and extreme heat." },
  { q: "How far is Devkund from Pune?", a: "Devkund Waterfall is approximately 100 km from Pune (about 3 hours by road). The base village is Bhira (also called Patnus village) in Raigad district." },
  { q: "How far is Devkund from Mumbai?", a: "Devkund Waterfall is approximately 130 km from Mumbai (about 4 hours by road). The nearest railway station is Karjat." },
  { q: "What is included in the Devkund Trek package?", a: "The package includes an expert trek guide, veg breakfast, veg lunch, forest entry charges, adventure insurance, e-certificate, and coordination charges. Transport is optional at ₹550/person extra." },
  { q: "Are there any age restrictions for the Devkund Trek?", a: "There is no strict age restriction, but participants should have a reasonable fitness level. Trekkers with a BMI above 30 should consult their doctor before joining. Children must be accompanied by a guardian." },
  { q: "Is there mobile network at Devkund?", a: "Mobile connectivity is limited at the base village and along the jungle trail. Carry a power bank. Jio and Airtel networks have partial coverage." },
  { q: "What are the washroom facilities?", a: "Washroom facilities are available at the base village (Bhira). There are no toilet facilities on the jungle trail itself." },
  { q: "Can I visit Devkund during summer?", a: "We do not conduct treks to Devkund during summer (March–May) as the waterfall dries up and the heat makes the trail unsafe." },
  { q: "Is the trek suitable for beginners?", a: "Yes, Devkund is beginner-friendly provided you wear proper trekking shoes, carry enough water, and are comfortable walking 6 km on a jungle trail with some stream crossings." },
  { q: "What is the Devkund waterfall height?", a: "Devkund is a 250 feet (approximately 76 metre) plunge waterfall. It is one of the tallest waterfalls near Mumbai and Pune." },
  { q: "Can we do Kolad river rafting with Devkund Trek?", a: "Kolad river rafting on the Kundalika River is a popular add-on. The Kundalika River originates at Devkund. You can combine both activities on the same day with early departure." },
  { q: "Are there any group discounts for Devkund Trek?", a: "Yes. Use code GD50 for a group of 5 or more. Additional discounts may be available — contact us on WhatsApp for bulk bookings." },
  { q: "What happens if it rains during the trek?", a: "Light to moderate rain is expected during monsoon and can enhance the experience. Trek leaders monitor weather and trail conditions. In case of extreme weather or flooding, the trek may be postponed for safety." },
  { q: "How do I reach Bhira base village?", a: "By road from Pune: Take NH48 towards Mumbai, exit at Khopoli, then head towards Bhira via Patnus. By train: Take a train to Khopoli or Karjat station and arrange local transport to Bhira (about 30–40 km)." },
  { q: "Is parking available at Bhira?", a: "Yes, parking is available at the Bhira base village. Parking charges are typically ₹100–200 per vehicle and are not included in the trek price." },
  { q: "Can I bring my dog on the Devkund Trek?", a: "Pets are not allowed on Gadvede Trekkers group treks for safety reasons and to avoid disturbing wildlife." },
  { q: "Is the Devkund trail forest area?", a: "Yes, the trail passes through a designated forest area. Forest entry charges are included in the trek package." },
];

const routeInfo = [
  { icon: "🏘", label: "Start Point",       value: "Bhira Base Village (72 ft)" },
  { icon: "💧", label: "Destination",       value: "Devkund Waterfall (250 ft high)" },
  { icon: "📏", label: "Trek Distance",     value: "6 km (one way)" },
  { icon: "⏱", label: "Trek Time",         value: "~2 hours (one way)" },
  { icon: "🌊", label: "Waterfall Type",    value: "Plunge (250 ft height)" },
  { icon: "⚡", label: "Difficulty",        value: "Moderate" },
];

const WHATSAPP_TRIP = { id: "devkund-waterfall-trek", name: "Devkund Waterfall Trek", type: "trek" };

export default function DevkundTrek() {
  useWhatsappTrip(WHATSAPP_TRIP);
  const trek = findTrekBySlug("devkund-waterfall-trek");
  const [activeTab, setActiveTab]     = useState("overview");
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeRoute, setActiveRoute] = useState("pune");
  const [openFaq, setOpenFaq]         = useState(null);
  const itinerary = ITINERARIES[activeRoute];

  return (
    <div className="td-page">

      {/* ── HERO ── */}
      <div className="td-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <span className="td-kicker">💧 WATERFALL TREK — RAIGAD, MAHARASHTRA</span>
          <h1 className="td-heading">Devkund Waterfall Trek from Pune</h1>
          <p className="td-subheading">Bathing Pond of Gods · 250 ft Plunge Waterfall · 6 km Jungle Trail</p>
          <div className="td-stats-bar">
            {[
              { icon: "📍", label: "Bhira, Raigad" },
              { icon: "⏱", label: "1 Day" },
              { icon: "🏔", label: "535 ft Highest Point" },
              { icon: "⚡", label: "Moderate" },
              { icon: "⭐", label: "4.7 (20,000+ trekkers)" },
              { icon: "💰", label: "From ₹899" },
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
                  <h2 className="td-section-title">About Devkund Waterfall Trek from Pune</h2>
                  <p className="td-para">
                    Visiting hidden paradises is a luxury best reserved for days when the world feels out of sync. The <strong>Devkund Waterfall</strong>, located near Bhira Dam in Maharashtra, is one such place — a mystical waterfall known as the <strong>"Bathing Pond of Gods"</strong>, with great mythological significance and sacred reverence among the local villagers.
                  </p>
                  <p className="td-para">
                    Devkund waterfall trek is <strong>175 km from Mumbai</strong>, <strong>115 km from Pune</strong>, and <strong>90 km from Lonavala</strong>. Bhira, Patnus village in Raigad district, serves as the base village. The trek is best enjoyed during the rainy season and winter months (June to February), and remains closed during summer due to scorching heat and dry waterfall conditions.
                  </p>
                  <p className="td-para">
                    The Falls — an amalgamation of three waterfalls — are regularly voted as one of the best jungle waterfall treks in India. You can dip your tired feet in the relaxing turquoise waters, enjoy the natural fish spa, and completely rejuvenate. The plunge waterfall changes colour depending on the time of day, creating a magical and picture-perfect scene.
                  </p>

                  <h3 className="td-subsection-title">🌊 The Plunge Waterfall</h3>
                  <p className="td-para">
                    During the rainy season, the Devkund plunge waterfall — the origin of the Kundalika River — is fed by the Tamhini Ghat and flows at full force. The waterfall drops 250 feet into a pristine turquoise pool, offering a natural therapy session unlike any other. Be ready with waterproof cameras to capture the monsoon magic.
                  </p>

                  <h3 className="td-subsection-title">⚠️ Safety Advisory</h3>
                  <p className="td-para">
                    Devkund waterfall trek is <strong>6 km one way</strong>. Trekkers with reasonable fitness levels should join. Please wear proper trekking shoes as the route is slippery. <strong>Swimming is not allowed</strong> in the Dam or Waterfall. During stream crossings, follow the trek leader's instructions strictly. Trekkers are not allowed to go out of sight of trek guides at any time.
                  </p>
                  <p className="td-para">
                    No previous trekking experience is required for the Bhira Devkund waterfall trek.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Things to Do on the Devkund Waterfall Trek</h2>
                  <p className="td-para">
                    Devkund is set in the lush green environs of the Sahyadri range and offers much more than just a waterfall hike:
                  </p>
                  <ul className="td-inclusions">
                    <li className="td-inclusion-item">🚣 Kolad River Rafting, kayaking, boating, and speed boat rides on the Kundalika River.</li>
                    <li className="td-inclusion-item">🏕 Camping near Bhira Dam in the middle of nature — ideal for campers and outdoor enthusiasts.</li>
                    <li className="td-inclusion-item">🦅 Bird watching — spot kingfishers, sunbirds, and more by starting your trek very early.</li>
                    <li className="td-inclusion-item">🏢 Corporate team outing option — easy trek with optional resort stay nearby.</li>
                    <li className="td-inclusion-item">📸 Ideal for photographers, vloggers, writers, and content creators — ample viral-worthy moments.</li>
                    <li className="td-inclusion-item">🏘 Experience village life at Bhira — learn local customs, enjoy homestay food, and connect with the countryside.</li>
                    <li className="td-inclusion-item">🏔 Nearby range treks: Korigad, Sudhagad, Sarasgad, Plus Valley, Khajina Waterfall, Garudmachi.</li>
                  </ul>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Places to Visit Near Devkund</h2>
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

                <div className="td-card">
                  <h2 className="td-section-title">Best Time to Visit Devkund Waterfall</h2>
                  <p className="td-para">
                    The <strong>best time to visit Devkund</strong> is during the rainy season and post-monsoon season — <strong>June to February</strong>. During this period, the waterfall flows at its most spectacular, the jungle is lush green, and the turquoise plunge pool is at its deepest. The trail is closed in summer (March–May) due to low water levels and extreme heat.
                  </p>
                  <p className="td-para">
                    Devkund is a "plunge" waterfall that empties massive volumes of water onto the rocky surface below. The magical colour-changing water — from turquoise to deep blue to milky white — makes it a popular spot for one-day picnics and photography.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Why Choose Gadvede Trekkers?</h2>
                  <ul className="td-inclusions">
                    <li className="td-inclusion-item">✅ 6+ years of experience managing Devkund Waterfall Trek with all safety SOPs.</li>
                    <li className="td-inclusion-item">✅ Preferred by over 20,000 trekkers with a 4.7 rating out of 5.</li>
                    <li className="td-inclusion-item">✅ One trek leader for every 10 trekkers.</li>
                    <li className="td-inclusion-item">✅ Female trek leader on each trek.</li>
                    <li className="td-inclusion-item">✅ E-certificate on successful trek completion — tamper-proof and shareable on social media.</li>
                    <li className="td-inclusion-item">✅ Adventure insurance for every trekker and trek leader.</li>
                    <li className="td-inclusion-item">✅ Self-operated treks — no middlemen.</li>
                    <li className="td-inclusion-item">✅ Group discounts available.</li>
                  </ul>
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
                  <img src={img} alt={`Devkund Waterfall Trek photo ${i + 1}`} className="td-gallery-img" loading="lazy" />
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
            <p className="td-muted">Jungle trail from Bhira Base Village → River Crossings → Devkund Plunge Waterfall</p>
            <div className="td-card" style={{ marginBottom: 20, padding: "32px 24px", textAlign: "center", background: "linear-gradient(135deg,#e0f0ff,#c8e8ff)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: "0.95rem", fontWeight: 700, color: "#0c2040" }}>
                <span>🏘 Bhira Base Village<br/><small style={{ fontWeight: 400, color: "#4a6a8a" }}>Start · 72 ft</small></span>
                <span style={{ color: "#1a65b5", fontSize: "1.5rem" }}>→</span>
                <span>🌊 River Crossings<br/><small style={{ fontWeight: 400, color: "#4a6a8a" }}>Jungle Trail</small></span>
                <span style={{ color: "#1a65b5", fontSize: "1.5rem" }}>→</span>
                <span>🏔 Highest Point<br/><small style={{ fontWeight: 400, color: "#4a6a8a" }}>535 ft</small></span>
                <span style={{ color: "#1a65b5", fontSize: "1.5rem" }}>→</span>
                <span>💧 Devkund Waterfall<br/><small style={{ fontWeight: 400, color: "#4a6a8a" }}>6 km · 250 ft Falls</small></span>
                <span style={{ color: "#1a65b5", fontSize: "1.5rem" }}>↩</span>
                <span>🏘 Return to Base<br/><small style={{ fontWeight: 400, color: "#4a6a8a" }}>12 km total</small></span>
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
            <p className="td-muted">Select your departure city — multiple pickup points en route</p>

            {/* Route selector */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {Object.entries(ITINERARIES).map(([key, route]) => (
                <button key={key} onClick={() => setActiveRoute(key)}
                  className={`td-itinerary-tab${activeRoute === key ? " active" : ""}`}
                  style={{ padding: "10px 20px", borderRadius: 8, border: "2px solid", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                    borderColor: activeRoute === key ? "#1a65b5" : "#d1d5db",
                    background: activeRoute === key ? "#1a65b5" : "#fff",
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
                  "Click 'Book Now' and select your departure date.",
                  "Choose ticket type & quantity; apply coupon code if any.",
                  "Fill in personal details and proceed to payment.",
                  "Pay via UPI / Debit / Credit Card / Net Banking.",
                  "Receive booking confirmation via email (provide a valid email ID).",
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
              <p className="td-muted" style={{ marginTop: 12 }}>
                ⚠️ If you wrongly booked for a different date or batch and want to change within 3 days of departure, transfer charges of ₹200/person will apply. Transport will be arranged as per participant count.
              </p>
              <BookingCTA trek={trek} className="btn td-book-btn" style={{ marginTop: 20 }} label="Book on WhatsApp" />
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === "faq" && (
          <div className="td-section">
            <style>{`
              .dk-faq-item { border-bottom: 1px solid #e5e7eb; }
              .dk-faq-q { width: 100%; background: none; border: none; text-align: left; padding: 16px 0; font-weight: 600; font-size: 0.92rem; color: #1a5fa3; cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
              .dk-faq-a { font-size: 0.88rem; color: #374151; line-height: 1.75; padding-bottom: 16px; }
            `}</style>
            <h2 className="td-section-title">Frequently Asked Questions</h2>
            <p className="td-muted" style={{ marginBottom: 20 }}>Everything you need to know about Devkund Waterfall Trek.</p>
            <div className="td-card">
              {FAQS.map((faq, i) => (
                <div key={i} className="dk-faq-item">
                  <button className="dk-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{i + 1}. {faq.q}</span>
                    <span style={{ flexShrink: 0, fontSize: "1.2rem" }}>{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && <p className="dk-faq-a">{faq.a}</p>}
                </div>
              ))}
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
          <span className="td-cta-name">Devkund Waterfall Trek from Pune</span>
          <span className="td-cta-meta">Bhira, Raigad · 1 Day · 6 km Trek</span>
        </div>
        <div className="td-cta-price">
          <span className="td-cta-from">from</span>
          <span className="td-cta-amount">₹899</span>
        </div>
        <BookingCTA trek={trek} className="btn td-cta-book-btn" label="Book on WhatsApp" />
      </div>
    </div>
  );
}
