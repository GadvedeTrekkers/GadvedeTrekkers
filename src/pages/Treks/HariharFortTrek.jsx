import { useState } from "react";
import { Link } from "react-router-dom";
import { findTrekBySlug } from "../../data/treks";
import BookingCTA from "../../components/BookingCTA";

const HERO_IMG = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80";

const GALLERY = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80",
  "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80",
  "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
];

const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "gallery",   label: "Photo Gallery" },
  { id: "route",     label: "Trek Route" },
  { id: "itinerary", label: "Itinerary" },
  { id: "details",   label: "Details & Cost" },
  { id: "faq",       label: "FAQs" },
];

const ROUTES = [
  { id: "train", icon: "🚂", label: "By Train",  sub: "Kasara Route",  price: "₹1,099" },
  { id: "pune",  icon: "🚌", label: "From Pune", sub: "Pune Route",    price: "₹1,699" },
];

const highlights = [
  { icon: "🏰", text: "117 Rock-Cut Steps to the Fort Summit" },
  { icon: "🧗", text: "75° Inclined Staircase — One of Maharashtra's Toughest" },
  { icon: "🏔", text: "3,676 ft Above Sea Level — Panoramic Sahyadri Views" },
  { icon: "⛩", text: "Temple of Lord Hanuman & Lord Shiva at the Summit" },
  { icon: "🦁", text: "Scottish Kada — 170m Vertical Cliff Face" },
  { icon: "🌙", text: "Night Trek Option for an Unforgettable Experience" },
  { icon: "🎖", text: "E-Certificate on Successful Completion" },
  { icon: "👩‍🦯", text: "Female Trek Leader on Every Batch" },
  { icon: "🛡", text: "Adventure Insurance Included" },
  { icon: "🍱", text: "Veg Breakfast + Lunch Included" },
];

const discountCodes = [
  { code: "GD75",    desc: "Save on group of 7 and more" },
  { code: "GD50",    desc: "Save on group of 5 and more" },
  { code: "EARLY75", desc: "Early Booking Discount" },
];

const whyCards = [
  { icon: "🧗", title: "Iconic Rock-Cut Steps",  desc: "117 steps carved at 75° into the rock face — a one-of-a-kind climbing experience" },
  { icon: "🌿", title: "Sahyadri Wilderness",     desc: "Dense forest, leopard country, panoramic views from 3,676 ft" },
  { icon: "🌙", title: "Night Trek Available",    desc: "Stargaze from the fort plateau and enjoy the cool night air" },
  { icon: "🍱", title: "Meals Included",          desc: "Veg breakfast and lunch served at the base village" },
];

const placesToVisit = [
  { icon: "🏰", name: "Fort Summit & Plateau",           desc: "A tapering plateau with a raised central level offering sweeping 360° views of the Sahyadri ranges, valleys, and surrounding forts." },
  { icon: "⛩",  name: "Temple of Lord Hanuman & Shiva",  desc: "A small sacred temple on the fort plateau with a natural pond in front — the pond water is safe to drink." },
  { icon: "🦁", name: "Scottish Kada",                   desc: "A 170m vertical cliff drop facing Nirgudpada village, first climbed in November 1986 by legendary Himalayan mountaineer Doug Scott — a two-day ascent." },
  { icon: "🏛",  name: "Two-Room Palace",                 desc: "A historic palace ruin near the summit capable of sheltering 10–12 persons — a glimpse into Harihar's storied past." },
  { icon: "🏔", name: "Brahmagiri Parvat",               desc: "Nearby sacred mountain that can be combined with the Harihar trek for an extended adventure." },
  { icon: "🌊", name: "Anjaneri Waterfall",              desc: "Stunning reverse waterfall on the back of Anjneri Hill — water flies 30 feet over you from the top of the slope during the rains." },
];

const trekDetails = {
  "Fort Height":        "3,676 feet above sea level",
  "Difficulty Level":   "Tough",
  "Endurance Required": "High",
  "Base Village":       "Nirgudpada",
  "Region":             "Trimbakeshwar, Nashik District",
  "Duration":           "1 Night 1 Day",
  "Trek Distance":      "3.5 km (one way)",
  "Trek Time":          "~3 hours (one way)",
  "Rock-Cut Steps":     "117 steps at 75° incline",
  "Scottish Kada":      "170 m vertical cliff face",
  "Best Time":          "June to February (avoid rainy weekends)",
  "From Pune":          "~260 km (~7 hrs)",
  "From Mumbai":        "~160 km via Kasara",
  "From Nashik":        "~42 km (~1 hr 15 min)",
};

const pricingOptions = [
  { label: "By Train (Kasara to Kasara)",           price: "1,099", note: "Includes local jeep from Kasara to base village" },
  { label: "Own Vehicle (Reach Base Village)",       price: "799",   note: "GPS location shared after booking" },
  { label: "From Pune (Pune to Pune – Bus)",         price: "1,699", note: "Private non-AC vehicle, multiple pickup points" },
];

const inclusionsByRoute = {
  train: {
    included: [
      "✅ 1 Veg Breakfast + 1 Veg local lunch",
      "✅ Kasara to Kasara travel by local jeep",
      "✅ Expert trek leader charges",
      "✅ Gadvede Trekkers coordination charges",
      "✅ Adventure insurance for every trekker",
      "✅ E-certificate on successful trek completion",
    ],
    excluded: [
      "❌ Train travel to/from Kasara (self-arranged)",
      "❌ Entry fee for foreign nationals",
      "❌ Mineral water / lime water purchased personally",
      "❌ Extra meals / soft drinks ordered",
      "❌ Any personal expenses",
      "❌ Expenses due to unforeseen circumstances (bad weather, roadblocks)",
      "❌ Medical / emergency evacuations if required",
    ],
  },
  pune: {
    included: [
      "✅ 1 Veg Breakfast + 1 Veg Lunch",
      "✅ Pune to Pune travel by private non-AC vehicle",
      "✅ Expert trek leader charges",
      "✅ Gadvede Trekkers coordination charges",
      "✅ Adventure insurance for every trekker",
      "✅ E-certificate on successful trek completion",
    ],
    excluded: [
      "❌ Mineral water / lime water purchased personally",
      "❌ Extra meals / soft drinks ordered",
      "❌ Any personal expenses",
      "❌ Expenses due to unforeseen circumstances (bad weather, roadblocks)",
      "❌ Medical / emergency evacuations if required",
    ],
  },
};

const thingsToCarry = [
  "🥾 Trekking Shoes — mandatory (Campus or Action brand for Sahyadri grip)",
  "💧 2–3 litres of water",
  "🔦 Good torch with extra batteries",
  "🍫 Dry fruits / dry snacks / energy bars",
  "🧃 Glucon D / ORS / Tang / Gatorade sachets",
  "🎒 Day Backpack 20–30 litres",
  "🧢 Sun cap and sunscreen",
  "🩹 Personal first aid and medicines",
  "🪪 Identity Proof (mandatory)",
  "👕 Full sleeves + full track pant (protection from sun, thorns, insects)",
  "🌧 Rainwear / Poncho / Waterproof jacket",
  "📱 Double-pack valuables/phones in plastic bags — rains expected",
];

const cancellationPolicy = [
  "75% refund if notified via phone 8 or more days prior to the event date.",
  "50% refund if notified via phone 4 to 7 days prior to the event date.",
  "No refund if cancellation is requested less than 3 days prior to the event.",
  "No show — No Refund.",
  "Event tickets cannot be transferred to another date against cancellation.",
  "Event tickets cannot be transferred to another person against cancellation.",
  "If the trek is cancelled, only the 'Trek Amount' will be refunded.",
  "If the event is cancelled due to natural calamity, political unrest, or reasons beyond our control, the same cancellation policy applies.",
  "Refunds won't be issued if you cannot attend due to heavy rains, floods, traffic jams, car breakdowns, or personal medical emergency.",
  "Your booking cannot be shifted to another date due to any of the above reasons.",
  "If you are bringing kids, please understand the possibility of getting stuck due to heavy rains, floods, or rush at the destination — we won't refund or shift dates.",
  "Due to bad weather, floods, or overcrowding, the organizer has the right to change the trekking destination.",
  "During the trek, the trek leader has the right to cancel for safety reasons — no refund shall be issued.",
];

const itineraryByRoute = {
  train: {
    note: "Board the CSMT–Kasara slow local. Arrive 10 minutes early at each station. Trekking shoes mandatory. Missing the train means missing the trek — no refund.",
    days: [
      {
        title: "Day 0 — Friday Night: Catch CSMT–Kasara Slow Local",
        events: [
          { time: "09:32 pm", desc: "CSMT — board the slow local towards Kasara." },
          { time: "09:40 pm", desc: "Byculla." },
          { time: "09:50 pm", desc: "Dadar." },
          { time: "10:00 pm", desc: "Kurla." },
          { time: "10:06 pm", desc: "Ghatkopar." },
          { time: "10:27 pm", desc: "Thane." },
          { time: "10:51 pm", desc: "Dombivali." },
          { time: "11:03 pm", desc: "Kalyan." },
          { time: "12:13 am", desc: "Kasara — end of train journey." },
        ],
      },
      {
        title: "Day 1 — Saturday: Harihar Fort Trek",
        events: [
          { time: "12:15 am", desc: "Meeting at Kasara Railway Station ticket counter." },
          { time: "12:30 am", desc: "Start journey towards base village by local jeep." },
          { time: "03:30 am", desc: "Reach base village." },
          { time: "04:00 am", desc: "Breakfast." },
          { time: "04:30 am", desc: "Start ascending towards Harihar Fort." },
          { time: "07:30 am", desc: "Reach the fort summit — explore the plateau, temple, Scottish Kada viewpoint." },
          { time: "08:30 am", desc: "Start descending — follow trek leader instructions on rock-cut steps." },
          { time: "11:30 am", desc: "Reach base village." },
          { time: "12:00 pm", desc: "Lunch — simple veg thali; Jain food available." },
          { time: "01:00 pm", desc: "Start return journey towards Kasara." },
          { time: "03:30 pm", desc: "Approximate arrival at Kasara Railway Station — disperse." },
        ],
      },
    ],
  },
  pune: {
    note: "Missing the bus pickup means missing the trek — no refund. Trekking shoes are mandatory. Arrive at pickup point 10 minutes early.",
    days: [
      {
        title: "Day 0 — Night: Pune → Nirgudpada",
        events: [
          { time: "08:45 pm", desc: "Meet at McDonald's, Deccan." },
          { time: "09:00 pm", desc: "Move towards base village." },
          { time: "09:20 pm", desc: "Pick up at New Shivaji Nagar bus stop (Mari Aai Gate / Wakadewadi)." },
          { time: "09:40 pm", desc: "Pick up at Nashik Phata (Opp. Kasarwadi Police Station)." },
        ],
      },
      {
        title: "Day 1 — Harihar Fort Trek",
        events: [
          { time: "05:30 am", desc: "Reach base village; freshen up and have breakfast." },
          { time: "06:00 am", desc: "Trek briefing and start ascending towards Harihar Fort." },
          { time: "09:30 am", desc: "Reach fort summit — explore the plateau, temple, and Scottish Kada." },
          { time: "10:30 am", desc: "Start descending — maintain three-point contact on rock-cut steps." },
          { time: "01:30 pm", desc: "Reach base village. Lunch — simple veg thali; Jain food available." },
          { time: "02:30 pm", desc: "Start return journey towards Pune." },
          { time: "11:00 pm", desc: "Approximate arrival at Pune (subject to traffic)." },
        ],
      },
    ],
  },
};

const routeInfo = [
  { icon: "🏘", label: "Start Point",     value: "Nirgudpada Base Village" },
  { icon: "🏰", label: "Destination",     value: "Harihar Fort Summit (3,676 ft)" },
  { icon: "📏", label: "Trek Distance",   value: "3.5 km (one way)" },
  { icon: "⏱", label: "Trek Time",       value: "~3 hours (one way)" },
  { icon: "🧗", label: "Rock-Cut Steps",  value: "117 steps at 75° incline" },
  { icon: "⚡", label: "Difficulty",      value: "Tough" },
];

const faqs = [
  {
    q: "Are trekking shoes compulsory for Harihar Fort?",
    a: "Yes. The rock-cut steps can be extremely slippery during monsoon and post-rainy season. Campus or Action brand trekking shoes are the first choice for Nashik fort trekkers — they offer the best grip on Sahyadri rock. Sandals and sports shoes are strictly not allowed.",
  },
  {
    q: "What is the best time to visit Harihar Fort?",
    a: "June to February is the best time. During monsoon weekends, the trek is regularly banned due to dangerous overcrowding. Weekday treks in monsoon and winter (November–February) offer the safest, most scenic experience.",
  },
  {
    q: "Is camping allowed at Harihar Fort?",
    a: "No. The forest department prohibits camping due to wildlife in the area, including frequent leopard sightings. You can camp at Igatpuri, Vaitarna, or Nashik and proceed for the fort trek in the morning.",
  },
  {
    q: "What is Harihar Fort Nashik's weather like?",
    a: "Summers are sweltering and humid — avoid trekking in summer. Monsoon brings heavy rainfall in the Trimbakeshwar region with fog and low visibility but great scenery. Winter (November–February) is pleasant till late morning — ideal for comfortable trekking. Night treks are recommended in summer.",
  },
  {
    q: "What is the Nashik to Harihar Fort distance?",
    a: "Nashik to Harihar Fort (Harshewadi trailhead) is approximately 42 km — about 1 hour 15 minutes. Harihar Fort to Trimbakeshwar is 13 km. Brahmagiri Parvat can be combined with this trek.",
  },
  {
    q: "Why is Harihar Fort banned during monsoon?",
    a: "Multiple accidents during monsoon weekends due to overcrowding prompted bans by the forest department and collector's office. Thousands of tourists on the narrow 117-step staircase simultaneously creates a hazardous situation. Trekkers have been stuck for up to 6 hours. Authorities are planning to introduce daily permits.",
  },
  {
    q: "Where is Harihar Fort located in Maharashtra?",
    a: "Harihar Fort (also called Harshagad or Harihargad) is in Maharashtra's Nashik district — 40 km from Nashik city, 48 km from Igatpuri, 13 km from Trimbakeshwar, and 40 km from Ghoti. It was built to watch over the Gonda Ghat commerce route.",
  },
  {
    q: "How to register for the Harihar Fort Trek from Mumbai?",
    a: "Mumbai to Harihar Fort (Nirgudpada) is approximately 190 km — about 5 hours. Tap Book on WhatsApp to register. The Kasara train route (₹1,099) is most popular from Mumbai. After booking, GPS location and WhatsApp group details are shared.",
  },
  {
    q: "Which is the nearest railway station to Harihar Fort?",
    a: "Kasara Railway Station is the most convenient — approximately 60 km from Harihar Fort base village. From CSMT, take the slow local train to Kasara (2.5 hrs). From Kasara, shared jeeps take you to the trailhead. Pro Tip: If arriving at Kasara past 10 pm, pre-book your jeep taxi.",
  },
  {
    q: "Are Harihar Fort and Harihareshwar the same?",
    a: "No. Harihar Fort is a hill fort near Nashik famous for its rock-cut steps. Harihareshwar is a separate coastal tourist destination near Dapoli and Shirvardhan — known for temples and beaches, not a hill fort.",
  },
  {
    q: "How to reach Kalyan to Nashik for the trek?",
    a: "Kalyan to Nashik is approximately 140 km (3 hours). Take a train to Kasara Railway Station on the Central Railway and board a sharing taxi. Taxis charge under ₹100 per person. You can also pre-book a local taxi to drop and pick you up at the trailhead.",
  },
  {
    q: "What is the Nashik to Ramshej Fort distance?",
    a: "Ramshej Killa is approximately 16 km from Nashik city — about 45 minutes by road. It can be combined with a Nashik area trekking itinerary.",
  },
  {
    q: "Is Harihar Fort the most dangerous fort in Maharashtra?",
    a: "The fort itself has well-maintained rock-cut holds and sufficient passage space for safe navigation. However, extreme weekend overcrowding — especially in monsoon — has earned it a dangerous reputation. The steps are safe if climbed with proper footwear and caution on weekdays.",
  },
  {
    q: "What is the Anjaneri Reverse Waterfall?",
    a: "On the back side of Anjneri Hill is a stunning reverse waterfall — water flies 30 feet above you from the top of the slope during the rains. It is a sacred location (birthplace of Lord Hanuman) and great for early trekkers. Note: Only mobile cameras allowed — professional cameras are prohibited as the fort has endangered endemic wildflowers.",
  },
];

export default function HariharFortTrek() {
  const trek = findTrekBySlug("harihar-trek");
  const [activeTab,    setActiveTab]    = useState("overview");
  const [activeRoute,  setActiveRoute]  = useState("train");
  const [lightboxImg,  setLightboxImg]  = useState(null);
  const [openFaq,      setOpenFaq]      = useState(null);

  const currentItinerary = itineraryByRoute[activeRoute];
  const currentInclusions = inclusionsByRoute[activeRoute] || inclusionsByRoute.train;

  return (
    <div className="td-page">

      {/* ── HERO ── */}
      <div className="td-hero" style={{ backgroundImage: `url(${HERO_IMG})` }}>
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <span className="td-kicker">🏰 FORT TREK — TRIMBAKESHWAR, NASHIK</span>
          <h1 className="td-heading">Harihar Fort Trek from Pune</h1>
          <p className="td-subheading">117 Rock-Cut Steps · 3,676 ft · Scottish Kada · Night Trek</p>
          <div className="td-stats-bar">
            {[
              { icon: "📍", label: "Nirgudpada, Nashik" },
              { icon: "⏱", label: "1 Night 1 Day" },
              { icon: "🏔", label: "3,676 ft (1,120m)" },
              { icon: "⚡", label: "Tough" },
              { icon: "🧗", label: "117 Rock-Cut Steps" },
              { icon: "💰", label: "From ₹799" },
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
                  <h2 className="td-section-title">About Harihar Fort Trek</h2>
                  <p className="td-para">
                    Harihar Fort appears rectangular from its base village, but is built on a <strong>triangular prism of rock</strong>. Its three faces and two edges are vertical at 90 degrees, while the third edge towards the west is inclined at a dramatic <strong>75 degrees</strong>. A one-metre wide rocky staircase with hand-carved niches is chiselled directly into the rock face for ascending and descending the fort.
                  </p>
                  <p className="td-para">
                    There are <strong>117 steps</strong> in all. After climbing the first rocky staircase main entrance, you walk below an overhang with a sheer drop. You then climb a set of steep stairs with niches, pass through a staircase inside the rock — similar to Peth Fort or Kothaligad Fort — and finally reach the summit. The view from the top is extraordinary.
                  </p>
                  <p className="td-para">
                    The fort plateau is tapering with a raised level in the middle. A small temple of <strong>Lord Hanuman and Lord Shiva</strong> stands on the plateau, with a natural pond in front providing drinking water. A historic palace with two rooms capable of sheltering 10–12 persons lies further on.
                  </p>

                  <h3 className="td-subsection-title">🏛 Harihar Fort History</h3>
                  <p className="td-para">
                    Harihar Fort was built during the Yadava dynasty upon a triangular mountain with nearly vertical elevations. It served as a strategic watchtower over the <strong>Gonda Ghat commerce route</strong>. In 1818, British officer Briggs captured the fort. While the British used cannons to destroy defences and access roads across Maharashtra's forts, Officer Briggs was so astounded by the splendour of Harihar's rock-cut steps that he <strong>left the fort completely intact</strong> — one of the few forts spared by the British.
                  </p>

                  <h3 className="td-subsection-title">🦁 Scottish Kada — 170m Vertical Cliff</h3>
                  <p className="td-para">
                    One of the vertical drops facing Nirgudpada village is called the <strong>'Scottish Kada'</strong> — named because it was first climbed in November 1986 by <strong>Doug Scott</strong>, the legendary Himalayan mountaineer, taking him two full days to complete the 170-metre ascent.
                  </p>

                  <h3 className="td-subsection-title">🧗 The Most Challenging Segments</h3>
                  <p className="td-para">
                    The iconic rock-cut steps are the most challenging section. During monsoon, both staircases before and after the Mahadarvaja can be extremely slick. Always maintain <strong>three-point contact</strong> and face the mountain while descending. There is also a narrow traverse — stay to your right as the left side is exposed. If you're afraid of heights, keep your gaze forward while climbing: looking back is terrifying but the panorama is stunning!
                  </p>

                  <h3 className="td-subsection-title">⚠️ Overcrowding Advisory</h3>
                  <p className="td-para">
                    Harihar Fort is <strong>banned on rainy-season weekends</strong> due to dangerous overcrowding. Thousands of tourists on the narrow 117-step staircase simultaneously have caused trekkers to be stuck for up to six hours. <strong>Weekday treks are strongly recommended</strong> — crowd numbers drop by 95%. Authorities are planning to introduce daily permits.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Trek Trail Information</h2>
                  <p className="td-para">The Harihar Fort trek route has two stages:</p>
                  <p className="td-para">
                    <strong>Stage 1:</strong> From base village Nirgudpada, the trek starts passing through Kotamwadi village. It takes approximately 1 hour 20 minutes to reach the plateau. While climbing, the fort will be on your right-hand side.
                  </p>
                  <p className="td-para">
                    <strong>Stage 2:</strong> From the plateau, hike towards the iconic steps and climb to the summit. This section takes up to 2 hours depending on your skills, crowd, weather, and endurance. The second trailhead at Harshewadi village connects to the same plateau and shares the same route from there.
                  </p>
                  <p className="td-para">
                    From the summit, on a clear day you can see: Bhaskargad/Basgad, Anjaneri Fort, Brahmagiri Hill, Bhandardurg, Vaitarna Lake, Utwad Fort, and many other forts near Nashik.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Best Season for Harihar Fort Trek</h2>
                  <p className="td-para">
                    The best time to visit is <strong>May end to February</strong>. Monsoon (June–September) brings spectacular fog-covered Sahyadri scenery — rice fields brilliantly verdant, forts peeking above clouds — but weekend treks are banned due to overcrowding. Weekday monsoon treks are still possible.
                  </p>
                  <p className="td-para">
                    <strong>Winter (November–February)</strong> is safest — fewer trekkers, clear skies for stargazing, fantastic views of surrounding peaks and forts. <strong>Summer night treks</strong> are recommended as daytime is hot and humid with risk of forest fires.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Places to Visit Near Harihar Fort</h2>
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
                  <h2 className="td-section-title">How to Reach Harihar Fort</h2>
                  <p className="td-para">Two main trailheads:</p>
                  <ul className="td-inclusions" style={{ marginBottom: 12 }}>
                    <li className="td-inclusion-item"><strong>Harshewadi Village</strong> — closer to Nashik (~42 km). Preferred by Nashik trekkers.</li>
                    <li className="td-inclusion-item"><strong>Nirgudpada Village via Kotamwadi</strong> — accessible from both Mumbai (~160 km) and Pune (~260 km). Ample parking and homestays available.</li>
                  </ul>
                  <p className="td-para">
                    <strong>By Train (Mumbai):</strong> Take CSMT–Kasara slow local (~2.5 hrs). Shared jeep taxis from Kasara to base village. Pro Tip: If arriving past 10 pm, pre-book the taxi — the stand closes.
                  </p>
                  <p className="td-para">
                    <strong>From Nashik:</strong> Cab to Harshewadi (~42 km). Or bus to Trimbakeshwar + shared/private jeep to trailhead.
                  </p>
                  <p className="td-para">
                    <strong>Return journey:</strong> State buses operate only till 5 pm. If late, ask locals for a jeep taxi number or arrange a stay at a homestay.
                  </p>
                </div>

                <div className="td-card">
                  <h2 className="td-section-title">Cancellation Policy</h2>
                  <ul className="td-inclusions">
                    {cancellationPolicy.map((item, i) => (
                      <li key={i} className="td-inclusion-item">• {item}</li>
                    ))}
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
                  <img src={img} alt={`Harihar Fort Trek photo ${i + 1}`} className="td-gallery-img" loading="lazy" />
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
            <p className="td-muted">Nirgudpada Base Village → Forest Trail → Kotamwadi → 117 Rock-Cut Steps → Harihar Fort Summit</p>
            <div className="td-card" style={{ marginBottom: 20, padding: "32px 24px", textAlign: "center", background: "linear-gradient(135deg,#f5e8d0,#ede0c8)" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗺</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: "0.95rem", fontWeight: 700, color: "#2e1a00" }}>
                <span>🏘 Nirgudpada<br/><small style={{ fontWeight: 400, color: "#7a5a30" }}>Base · Start</small></span>
                <span style={{ color: "#b06020", fontSize: "1.5rem" }}>→</span>
                <span>🌿 Kotamwadi<br/><small style={{ fontWeight: 400, color: "#7a5a30" }}>~1 hr 20 min</small></span>
                <span style={{ color: "#b06020", fontSize: "1.5rem" }}>→</span>
                <span>🧗 Mahadarvaja<br/><small style={{ fontWeight: 400, color: "#7a5a30" }}>117 Steps Begin</small></span>
                <span style={{ color: "#b06020", fontSize: "1.5rem" }}>→</span>
                <span>🏰 Fort Summit<br/><small style={{ fontWeight: 400, color: "#7a5a30" }}>3,676 ft · 3.5 km</small></span>
                <span style={{ color: "#b06020", fontSize: "1.5rem" }}>↩</span>
                <span>🏘 Return to Base<br/><small style={{ fontWeight: 400, color: "#7a5a30" }}>7 km total</small></span>
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
            <p className="td-muted">Choose your departure route to see the itinerary</p>

            {/* Route Selector */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              {ROUTES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveRoute(r.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 20px", borderRadius: 12, cursor: "pointer",
                    border: activeRoute === r.id ? "2px solid #1a9b65" : "2px solid #e0e0e0",
                    background: activeRoute === r.id ? "#edfaf4" : "#fff",
                    minWidth: 180, textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1.6rem" }}>{r.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: activeRoute === r.id ? "#0c6e44" : "#1a2e1a" }}>{r.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6a8a7a" }}>{r.sub}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="td-itinerary-note">⚠️ {currentItinerary.note}</div>
            <div className="td-timeline">
              {currentItinerary.days.map((day, di) => (
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
                  "Choose ticket type & quantity; apply coupon code if applicable.",
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
                  <h2 className="td-section-title">Pricing Options</h2>
                  <div className="td-pricing-cards">
                    {pricingOptions.map(p => (
                      <div className="td-pricing-card" key={p.label}>
                        <div className="td-pricing-label">{p.label}</div>
                        <div className="td-pricing-price">₹{p.price}<span>/person</span></div>
                        <div style={{ fontSize: "0.78rem", color: "#6a8a7a", marginBottom: 10 }}>{p.note}</div>
                        <BookingCTA trek={trek} className="btn td-pricing-book-btn" label="Book on WhatsApp" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route-specific inclusions */}
                <div className="td-card" style={{ marginTop: 18 }}>
                  <h3 className="td-section-title">What's Included / Not Included</h3>
                  <p className="td-muted" style={{ marginBottom: 12 }}>Select route for relevant inclusions:</p>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    {ROUTES.map(r => (
                      <button key={r.id} onClick={() => setActiveRoute(r.id)}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                          border: activeRoute === r.id ? "2px solid #1a9b65" : "2px solid #e0e0e0",
                          background: activeRoute === r.id ? "#edfaf4" : "#fff",
                          color: activeRoute === r.id ? "#0c6e44" : "#555",
                        }}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                  <ul className="td-inclusions">
                    {[...currentInclusions.included, ...currentInclusions.excluded].map(item => (
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

        {/* ── FAQs ── */}
        {activeTab === "faq" && (
          <div className="td-section">
            <h2 className="td-section-title">Frequently Asked Questions</h2>
            <p className="td-muted">Everything you need to know about Harihar Fort Trek</p>
            <div className="td-card" style={{ marginTop: 20 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < faqs.length - 1 ? "1px solid #e8e8e8" : "none", paddingBottom: 16, marginBottom: 16 }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: 0 }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a2e1a", lineHeight: 1.4 }}>
                      {i + 1}. {faq.q}
                    </span>
                    <span style={{ fontSize: "1.2rem", color: "#4a9a6a", flexShrink: 0 }}>{openFaq === i ? "▲" : "▼"}</span>
                  </button>
                  {openFaq === i && (
                    <p className="td-para" style={{ marginTop: 10, marginBottom: 0 }}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY CTA ── */}
      <div className="td-cta-bar">
        <div className="td-cta-info">
          <span className="td-cta-name">Harihar Fort Trek from Pune / Mumbai</span>
          <span className="td-cta-meta">Nirgudpada, Nashik · 1 Night 1 Day · 3,676 ft</span>
        </div>
        <div className="td-cta-price">
          <span className="td-cta-from">from</span>
          <span className="td-cta-amount">₹799</span>
        </div>
        <BookingCTA trek={trek} className="btn td-cta-book-btn" label="Book on WhatsApp" />
      </div>
    </div>
  );
}
