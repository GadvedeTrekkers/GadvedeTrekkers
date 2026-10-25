import { useEffect, useState } from "react";
import { handleImageError } from "../../utils/imageFallback";
import { Link } from "react-router-dom";
import EnquiryModal from "../../components/EnquiryModal";

const popularTrips = [
  {
    title: "Corporate Outing in Lonavala",
    price: 999,
    coupon: "EARLY75",
    duration: "1 Night 1 Day",
    availability: "Available on Request",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Corporate Outing Places Near Pune",
    price: 999,
    coupon: "EARLY75",
    duration: "1 Night 1 Day",
    availability: "Available on Request",
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "One Day Trek in Mumbai for Corporates",
    price: 999,
    coupon: "EARLY75",
    duration: "1 Day",
    availability: "Available on Request",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
  },
];

const monsoonDestinations = [
  {
    title: "Lonavala",
    blurb: "Waterfalls, foggy hills, premium villas, and luxury resorts ideal for team bonding during the monsoon.",
    image: "https://media.assettype.com/outlooktraveller%2F2024-06%2Fda76e5da-53f3-4dba-9993-f2671fd439c5%2FSnapinsta.app_298932303_1122877238308100_7007648488620988182_n_1080.jpg?auto=format%2Ccompress&w=640",
  },
  {
    title: "Khandala",
    blurb: "A scenic and peaceful setting for leadership offsites, relaxed workshops, and nature-led recharge days.",
    image: "https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_182%2Cw_3500%2Ch_1969%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_500%2Cf_auto%2Cc_fit/zaras-resort-khandala/two_sotabd",
  },
  {
    title: "Alibaug",
    blurb: "Beach vibes with monsoon charm, private pool villas, and fun-filled team outings close to Mumbai.",
    image: "https://www.indiamike.com/files/images/89/80/09/alibag-beach--monsoon.jpg",
  },
  {
    title: "Karjat",
    blurb: "Adventure, waterfalls, riverside villas, and outdoor challenges for active corporate groups.",
    image: "https://www.historywithtravel.com/images/bhivpuri-waterfall/bhivpuri-waterfall-2.jpg",
  },
  {
    title: "Igatpuri",
    blurb: "A hidden monsoon gem with misty mountains, calm surroundings, and retreat-friendly spaces.",
    image: "https://static2.tripoto.com/media/filter/tst/img/306426/TripDocument/1531146179_screenshot_20180707_120637_01_01.jpeg.webp",
  },
];

const monsoonHighlights = [
  "Private pool villas",
  "Rain-friendly outdoor setups",
  "Conference and meeting halls",
  "Open lawns for activities",
  "Ice-breaker games",
  "Leadership activities",
  "Treasure hunt",
  "Rain dance and DJ",
  "Adventure challenges",
  "Problem-solving tasks",
];

const whyChoose = [
  { icon: "🎯", title: "Customized Programs", desc: "Every team is different, and so are their needs. We design custom programs tailored to the specific goals of your organization." },
  { icon: "👨‍🏫", title: "Experienced Trainers", desc: "Our facilitators are industry experts with years of experience in delivering high-impact training." },
  { icon: "📈", title: "Proven Results", desc: "Our clients consistently report improved team dynamics, better communication, and higher levels of productivity following our programs." },
  { icon: "🏔️", title: "Beautiful Locations", desc: "We operate in breathtaking natural settings, offering your team a chance to disconnect from daily grind and reconnect with nature." },
  { icon: "🛡️", title: "Safety First", desc: "All our activities are conducted with the highest safety standards to ensure a secure and enjoyable experience for all participants." },
];

const teamBuildingApproach = [
  { icon: "🧠", title: "Experiential Learning", desc: "Our activities provide real-life challenges that require teamwork and cooperation to overcome." },
  { icon: "💎", title: "Focus on Core Values", desc: "We align our activities with your company's core values to reinforce the principles that matter most to your organization." },
  { icon: "🤝", title: "Inclusive Environment", desc: "We ensure that all activities are inclusive, catering to diverse teams with varying levels of physical ability." },
  { icon: "💡", title: "Post-Activity Reflection", desc: "After each activity, we conduct debriefing sessions to help participants reflect on experiences and apply lessons to their work." },
];

const outdoorActivities = [
  { icon: "⛰️", title: "Adventure Challenges", desc: "Test your team's endurance, resilience, and problem-solving abilities with our adventure challenges." },
  { icon: "🤜", title: "Trust-Building Exercises", desc: "Engage in activities that require trust and communication, helping to build stronger relationships within your team." },
  { icon: "🔍", title: "Creative Problem Solving", desc: "Our activities encourage participants to think outside the box and come up with innovative solutions to challenges." },
  { icon: "🏅", title: "Leadership Development", desc: "Develop leadership skills through activities that require decision-making and strategic thinking under pressure." },
];

const teamOutingBenefits = [
  { icon: "🚀", title: "Boost Morale", desc: "A well-planned team outing significantly boosts team morale and creates a positive work environment." },
  { icon: "💬", title: "Enhance Communication", desc: "Spending time together outside the office helps improve communication and builds stronger relationships." },
  { icon: "🧩", title: "Foster Collaboration", desc: "Our activities encourage teamwork and collaboration, helping to break down barriers and build a cohesive team." },
  { icon: "⚡", title: "Relax and Recharge", desc: "A team outing provides an opportunity to relax, recharge, and return to work with renewed energy and focus." },
];

const popularGroupActivities = [
  { icon: "🥾", title: "Hiking and Trekking", desc: "Explore beautiful trails and enjoy the great outdoors with your team across Maharashtra's Sahyadri ranges." },
  { icon: "⛺", title: "Camping", desc: "Spend a night under the stars and enjoy the tranquility of nature with lakeside and forest camps." },
  { icon: "🧗", title: "Adventure Sports", desc: "Engage in adrenaline-pumping activities such as rock climbing, rappelling, and zip-lining." },
  { icon: "🚣", title: "Water Sports", desc: "Enjoy rafting, kayaking, and canoeing in some of the most scenic locations across India." },
];

const outdoorGames = [
  { icon: "🗺️", title: "Treasure Hunt", desc: "A fun and engaging game that requires teamwork, communication, and problem-solving skills." },
  { icon: "🏃", title: "Relay Races", desc: "A classic team-building activity that promotes teamwork, coordination, and healthy competition." },
  { icon: "🚧", title: "Obstacle Course", desc: "Test your team's physical abilities and problem-solving skills with our challenging obstacle course." },
  { icon: "🫂", title: "Trust Fall", desc: "A trust-building exercise that requires participants to rely on their teammates for support." },
];

const teamBondingReasons = [
  { icon: "📣", title: "Improves Communication", desc: "Effective communication is key to a successful team, and our activities are designed to improve it." },
  { icon: "🔗", title: "Builds Trust", desc: "Trust is the foundation of any successful team, and our activities help to build and strengthen it." },
  { icon: "🤝", title: "Encourages Collaboration", desc: "Our activities encourage teamwork and collaboration, helping to create a more cohesive team." },
  { icon: "🌟", title: "Boosts Morale", desc: "A strong sense of camaraderie and team spirit can significantly boost team morale and productivity." },
];

/* ── Reusable card grid ── */
function CardGrid({ items }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 20,
        marginTop: 28,
      }}
    >
      {items.map((item) => (
        <div
          key={item.title}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "24px 22px",
            border: "1px solid #e2e8f0",
            transition: "box-shadow 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(5,150,105,0.12)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>{item.icon}</div>
          <h4 style={{ fontWeight: 700, color: "#065f46", fontSize: "0.95rem", marginBottom: 8 }}>
            {item.title}
          </h4>
          <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.7, margin: 0 }}>
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, subtitle, children, dark, green }) {
  const bg = dark ? "#1e293b" : green ? "#f0fdf4" : "#fff";
  const titleColor = dark ? "#fff" : green ? "#064e3b" : "#1e293b";
  const subtitleColor = dark ? "rgba(255,255,255,0.75)" : "#6b7280";

  return (
    <section style={{ background: bg, padding: "60px 0" }}>
      <div className="container">
        {title && (
          <h2
            style={{
              fontWeight: 800,
              color: titleColor,
              textAlign: "center",
              marginBottom: subtitle ? 8 : 28,
              fontSize: "clamp(1.35rem, 3vw, 1.75rem)",
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            style={{
              textAlign: "center",
              color: subtitleColor,
              maxWidth: 680,
              margin: "0 auto 36px",
              lineHeight: 1.75,
              fontSize: "0.95rem",
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export default function Corporate() {
  const [activeEnquiry, setActiveEnquiry] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Outdoor Training Program | Corporate Team Building | Gadvede Trekkers";
  }, []);

  return (
    <div>

      {/* ── HERO ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #064e3b 100%)",
          padding: "72px 0 56px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "#6ee7b7" }}>Outdoor Training Program</span>
          </div>

          <span
            style={{
              background: "rgba(110,231,183,0.15)",
              border: "1px solid rgba(110,231,183,0.35)",
              borderRadius: 999,
              padding: "5px 18px",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              display: "inline-block",
              marginBottom: 18,
              color: "#6ee7b7",
            }}
          >
            🏢 Corporate & Team Building
          </span>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 900,
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Outbound Training Program
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              opacity: 0.85,
              maxWidth: 700,
              margin: "0 auto 32px",
              lineHeight: 1.8,
            }}
          >
            Learning through experience is the most effective way to foster growth. Our Outbound Training
            Programs push boundaries, build trust, and enhance team cohesion through immersive outdoor
            activities — tailored to meet the specific needs of your organization.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://wa.me/919856112727"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25d366", color: "#fff",
                padding: "13px 28px", borderRadius: 10,
                fontWeight: 700, fontSize: "0.95rem",
                textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Get a Quote on WhatsApp
            </a>
            <Link
              to="/contact"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                color: "#fff",
                padding: "13px 28px", borderRadius: 10,
                fontWeight: 700, fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* ── POPULAR CORPORATE TRIPS ── */}
      <section style={{ background: "#f0fdf4", padding: "56px 0 48px", borderBottom: "1px solid #d1fae5" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 14px", borderRadius: 999, fontSize: "0.76rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              🔥 Handpicked Packages
            </span>
          </div>
          <h2 style={{ fontWeight: 800, color: "#064e3b", textAlign: "center", fontSize: "clamp(1.4rem,3vw,1.85rem)", marginBottom: 8 }}>
            Popular Corporate Trips
          </h2>
          <p style={{ textAlign: "center", color: "#374151", maxWidth: 640, margin: "0 auto 12px", lineHeight: 1.7, fontSize: "0.95rem" }}>
            Handpicked corporate outing packages available on request.
          </p>
          {/* Coupon banner */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ background: "#fff", border: "2px dashed #6ee7b7", borderRadius: 10, padding: "8px 20px", fontSize: "0.88rem", fontWeight: 700, color: "#065f46", letterSpacing: 1 }}>
              🎟 Use coupon <span style={{ background: "#064e3b", color: "#fff", borderRadius: 6, padding: "3px 10px", marginLeft: 4 }}>EARLY75</span> for an early booking discount
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 22 }}>
            {popularTrips.map((trip) => (
              <div key={trip.title} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(6,78,59,0.1)", border: "1px solid #d1fae5", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(6,78,59,0.16)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(6,78,59,0.1)"; }}
              >
                <div style={{ height: 180, overflow: "hidden" }}>
                  <img src={trip.image} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <h3 style={{ fontWeight: 700, color: "#064e3b", fontSize: "0.98rem", marginBottom: 8 }}>{trip.title}</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ background: "#f0fdf4", color: "#166534", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600 }}>⏱ {trip.duration}</span>
                    <span style={{ background: "#f0fdf4", color: "#166534", borderRadius: 6, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600 }}>📅 {trip.availability}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Starting from</div>
                      <div style={{ fontWeight: 900, color: "#064e3b", fontSize: "1.2rem" }}>₹{trip.price}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#6b7280" }}>/person</span></div>
                    </div>
                    <a
                      href="https://wa.me/919856112727"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "#25d366", color: "#fff", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}
                    >
                      Enquire
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTRO TEXT ── */}
      <Section green>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#374151", lineHeight: 1.9, fontSize: "0.97rem", marginBottom: 18 }}>
            At Gadvede Trekkers, we believe that learning through experience is the most effective way to
            foster growth, both individually and collectively. Our Outbound Training Programs are designed to
            push boundaries, build trust, and enhance team cohesion through immersive outdoor activities.
            Tailored to meet the specific needs of your organization, our programs focus on experiential
            learning, utilizing the natural environment as a powerful tool to develop leadership skills,
            improve communication, and boost morale.
          </p>
          <p style={{ color: "#374151", lineHeight: 1.9, fontSize: "0.97rem", margin: 0 }}>
            Outbound training isn't just about outdoor fun; it's about creating real-world scenarios that
            challenge your team to think critically, collaborate effectively, and perform under pressure.
            Whether your goal is to enhance problem-solving abilities, promote creative thinking, or build
            stronger interpersonal relationships, our training programs provide a unique platform for
            achieving these objectives.
          </p>
        </div>
      </Section>

      <Section
        title="Monsoon Corporate One-Day Outings Near Pune & Mumbai"
        subtitle="Refresh your team with nature, rain, and team bonding in curated villas and resorts across Maharashtra's most loved monsoon destinations."
      >
        <div style={{ maxWidth: 880, margin: "0 auto 28px", textAlign: "center" }}>
          <p style={{ color: "#374151", lineHeight: 1.85, fontSize: "0.96rem", marginBottom: 0 }}>
            We organize premium one-day corporate outings near Pune and Mumbai with end-to-end planning, verified stays, custom team-building modules, and safe, well-managed experiences. Perfect for offsites, annual meets, team celebrations, and monsoon refreshers.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 22, marginBottom: 28 }}>
          {monsoonDestinations.map((spot) => (
            <div key={spot.title} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(15,23,42,0.06)" }}>
              <img src={spot.image} alt={spot.title} loading="lazy" onError={handleImageError} style={{ width: "100%", aspectRatio: "4 / 3", height: "auto", objectFit: "cover", display: "block", background: "#d9efe3" }} />
              <div style={{ padding: "18px 20px" }}>
                <h4 style={{ fontWeight: 800, color: "#065f46", fontSize: "1rem", marginBottom: 8 }}>{spot.title}</h4>
                <p style={{ color: "#374151", fontSize: "0.86rem", lineHeight: 1.7, marginBottom: 0 }}>{spot.blurb}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20, marginBottom: 28 }}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "22px 24px" }}>
            <h4 style={{ fontWeight: 800, color: "#065f46", fontSize: "0.98rem", marginBottom: 12 }}>Why Corporates Choose Us</h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.9, fontSize: "0.87rem" }}>
              <li>End-to-end planning</li>
              <li>Verified villas and resorts</li>
              <li>Custom team-building modules</li>
              <li>Budget to luxury options</li>
            </ul>
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 16, padding: "22px 24px" }}>
            <h4 style={{ fontWeight: 800, color: "#1d4ed8", fontSize: "0.98rem", marginBottom: 12 }}>Sample One-Day Itinerary</h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.9, fontSize: "0.87rem" }}>
              <li>Morning departure and welcome breakfast</li>
              <li>Mid-day team building activities and lunch</li>
              <li>Evening fun games, rain dance, snacks, and return</li>
            </ul>
          </div>
          <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 16, padding: "22px 24px" }}>
            <h4 style={{ fontWeight: 800, color: "#c2410c", fontSize: "0.98rem", marginBottom: 12 }}>Popular Add-ons</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {monsoonHighlights.map((item) => (
                <span key={item} style={{ background: "#fff", color: "#7c2d12", border: "1px solid #fdba74", borderRadius: 999, padding: "5px 12px", fontSize: "0.77rem", fontWeight: 700 }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── WHY CHOOSE US ── */}
      <Section
        title="Why Choose Our Outbound Training Program?"
        subtitle="We design experiences that deliver measurable results for your team and organization."
      >
        <CardGrid items={whyChoose} />
      </Section>

      {/* ── POPULAR TRIPS ── */}
      <Section
        title="Popular Corporate Trips"
        subtitle="Handpicked corporate outing packages available on request. Use coupon EARLY75 for an early booking discount."
        green
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {popularTrips.map((trip) => (
            <div
              key={trip.title}
              style={{
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.13)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.08)";
              }}
            >
              <img
                src={trip.image}
                alt={trip.title}
                style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "18px 20px" }}>
                <h4 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: 10, lineHeight: 1.4 }}>
                  {trip.title}
                </h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <span style={{ background: "#fefce8", color: "#854d0e", border: "1px solid #fde047", borderRadius: 6, padding: "2px 10px", fontSize: "0.73rem", fontWeight: 600 }}>
                    🎟 {trip.coupon}
                  </span>
                  <span style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 10px", fontSize: "0.73rem", fontWeight: 600 }}>
                    ⏱ {trip.duration}
                  </span>
                  <span style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 6, padding: "2px 10px", fontSize: "0.73rem", fontWeight: 600 }}>
                    📅 {trip.availability}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669" }}>₹{trip.price}</span>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280", marginLeft: 4 }}>/person</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveEnquiry({
                        icon: "🏢",
                        title: trip.title,
                        subtitle: "Corporate Team Outing Package",
                        duration: trip.duration,
                        bestFor: "Corporate Teams & Office Groups",
                      })
                    }
                    style={{
                      background: "#059669", color: "#fff",
                      padding: "8px 18px", borderRadius: 8,
                      fontWeight: 700, fontSize: "0.82rem",
                      textDecoration: "none", border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Enquire Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TEAM BUILDING COMPANY ── */}
      <Section
        title="Team Building Company in India"
        subtitle="Gadvede Trekkers stands out among team building companies for our innovative approach to fostering teamwork and camaraderie. We believe the foundation of a successful team lies in trust, communication, and mutual respect. Our team building activities are carefully crafted to break down barriers, encourage open communication, and build lasting bonds."
      >
        <CardGrid items={teamBuildingApproach} />
      </Section>

      {/* ── OUTBOUND TRAINING COMPANY ── */}
      <Section
        title="Outbound Training Company"
        subtitle="As a leading outbound training company, Gadvede Trekkers specializes in creating transformative experiences that take teams out of their comfort zones. Our programs are based on the principle of experiential learning, where participants engage in activities that simulate real-world challenges and encourage them to apply critical thinking, problem-solving, and leadership skills."
        dark
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 18,
            marginTop: 8,
          }}
        >
          {[
            { icon: "👨‍🏫", title: "Experienced Facilitators", desc: "Seasoned professionals with extensive experience in delivering outbound training programs." },
            { icon: "🎯", title: "Customized Solutions", desc: "We tailor our programs to meet the specific needs of your organization and team." },
            { icon: "🛡️", title: "Focus on Safety", desc: "We prioritize the safety and well-being of all participants in every activity." },
            { icon: "✅", title: "Proven Methodologies", desc: "Programs based on tried-and-tested methodologies that have been proven to deliver results." },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "22px 20px",
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>{item.icon}</div>
              <h4 style={{ fontWeight: 700, color: "#6ee7b7", fontSize: "0.92rem", marginBottom: 8 }}>{item.title}</h4>
              <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── OUTDOOR TEAM BUILDING ── */}
      <Section
        title="Outdoor Team Building Activities"
        subtitle="Gadvede Trekkers is recognized as one of the top outdoor team building companies. We offer a wide range of outdoor activities designed to promote teamwork, build trust, and enhance communication."
        green
      >
        <CardGrid items={outdoorActivities} />
      </Section>

      {/* ── TEAM OUTING ACTIVITIES ── */}
      <Section
        title="Team Outing Activities"
        subtitle="Planning a team outing? We offer a wide range of team outing activities perfect for groups of all sizes — from a day of adventure to a weekend getaway or customized corporate retreat."
      >
        <CardGrid items={teamOutingBenefits} />
      </Section>

      {/* ── GROUP OUTDOOR ACTIVITIES ── */}
      <Section
        title="Popular Group Outdoor Activities"
        subtitle="Our activities are designed to challenge participants, encourage teamwork, and provide a fun and engaging experience for all involved."
        green
      >
        <CardGrid items={popularGroupActivities} />
      </Section>

      {/* ── TEAM BONDING ── */}
      <Section
        title="Team Bonding Activities"
        subtitle="Team bonding is essential for creating a cohesive and productive work environment. Our activities strengthen relationships, improve communication, and build trust among team members."
        dark
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 18,
            marginTop: 8,
          }}
        >
          {teamBondingReasons.map((item) => (
            <div
              key={item.title}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "22px 20px",
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>{item.icon}</div>
              <h4 style={{ fontWeight: 700, color: "#6ee7b7", fontSize: "0.92rem", marginBottom: 8 }}>{item.title}</h4>
              <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── OUTDOOR GAMES ── */}
      <Section
        title="Outdoor Games for Team Building"
        subtitle="Outdoor games are a fun and effective way to build teamwork, improve communication, and foster unity. Our games are challenging, engaging, and designed to help teams achieve common goals."
      >
        <CardGrid items={outdoorGames} />
      </Section>

      {/* ── CORPORATE PACKAGES ── */}
      <Section
        title="Corporate Tour Packages"
        subtitle="We offer a variety of corporate tour packages designed to provide a fun and memorable experience for your team — including activities, accommodations, and meals. From weekend getaways to week-long retreats."
        green
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          {[
            { icon: "🏕️", title: "Corporate Camping Retreat", desc: "Overnight lakeside or forest camping with bonfire, team games, and group meals. Perfect for 15–100 people." },
            { icon: "🥾", title: "Corporate Trek Day Out", desc: "Half or full-day guided treks in the Sahyadris with certified trek leaders and safety gear included." },
            { icon: "🧗", title: "Adventure & Sports Package", desc: "Rock climbing, rappelling, zip-lining, and obstacle courses customized for your team size and fitness level." },
            { icon: "🏛️", title: "Heritage & Culture Walk", desc: "Explore Pune or Mumbai's historic forts and heritage sites with expert guides and team quiz activities." },
            { icon: "🌊", title: "Water Sports Package", desc: "Rafting, kayaking, and canoeing at scenic Maharashtra locations — perfect for high-energy teams." },
            { icon: "📋", title: "Custom Corporate Retreat", desc: "Multi-day custom retreats combining trekking, camping, team games, and leadership workshops." },
          ].map((pkg) => (
            <div
              key={pkg.title}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px 22px",
                border: "1px solid #e2e8f0",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(5,150,105,0.12)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>{pkg.icon}</div>
              <h4 style={{ fontWeight: 700, color: "#065f46", fontSize: "0.95rem", marginBottom: 8 }}>{pkg.title}</h4>
              <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.7, margin: "0 0 16px" }}>{pkg.desc}</p>
              <a
                href="https://wa.me/919856112727"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#059669", color: "#fff",
                  padding: "7px 18px", borderRadius: 8,
                  fontWeight: 600, fontSize: "0.82rem",
                  textDecoration: "none",
                }}
              >
                Get Quote →
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b, #065f46)",
          padding: "60px 0",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div className="container">
          <h2 style={{ fontWeight: 800, marginBottom: 12, fontSize: "clamp(1.4rem,3vw,2rem)" }}>
            Ready to Plan Your Corporate Outing?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Whether you're a small startup or a large corporation, we have the expertise and resources to create
            a team-building experience that delivers measurable results. Get in touch today!
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://wa.me/919856112727"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25d366", color: "#fff",
                padding: "14px 32px", borderRadius: 12,
                fontWeight: 700, fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(37,211,102,0.35)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
            <Link
              to="/contact"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.3)",
                color: "#fff",
                padding: "14px 32px", borderRadius: 12,
                fontWeight: 700, fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              Send Enquiry
            </Link>
          </div>
        </div>
      </div>

      {activeEnquiry && (
        <EnquiryModal
          dest={activeEnquiry}
          category="Corporate"
          onClose={() => setActiveEnquiry(null)}
        />
      )}

    </div>
  );
}
