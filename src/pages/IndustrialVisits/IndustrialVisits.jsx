import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ivDestinations as _ivDestinations } from "../../data/industrialVisitsData";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import EnquiryModal from "../../components/EnquiryModal";
import { syncProductsFromApi } from "../../api/getAll";

const _parseLines = (v) => String(v || "").split("\n").map((s) => s.trim()).filter(Boolean);

function buildDestinations() {
  const stored = getAdminItems("gt_iv");
  if (stored.length === 0) return [];
  return stored
    .filter((d) => d.active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
    .map((d) => {
      let gallery;
      try { gallery = JSON.parse(d.imageGallery || "[]").filter(Boolean); } catch { gallery = []; }
      const images = gallery.map((src, i) => ({ src, caption: `Image ${i + 1}` }));

      const pricingSlabs = _parseLines(d.pricingSlabs).map((line) => {
        const [students, price, note] = line.split("|");
        return { students: students?.trim() || "", pricePerHead: price?.trim() ? Number(price.trim()) : null, note: note?.trim() || "" };
      });

      const itinerary = [];
      _parseLines(d.itinerary).forEach((line) => {
        const [dayKey, time, ...rest] = line.split("|");
        const desc = rest.join("|");
        const existing = itinerary.find((x) => x.day === dayKey?.trim());
        const item = time?.trim() ? `${time.trim()} — ${desc}` : desc;
        if (existing) existing.items.push(item);
        else itinerary.push({ day: dayKey?.trim() || "Day", title: dayKey?.trim() || "", items: [item] });
      });

      return {
        ...d,
        id: d.id || String(d.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        images: images.length ? images : [],
        highlights: Array.isArray(d.highlights) ? d.highlights : _parseLines(d.highlights),
        industries: Array.isArray(d.industries) ? d.industries : _parseLines(d.industries),
        includes: Array.isArray(d.includes) ? d.includes : _parseLines(d.includes),
        excludes: Array.isArray(d.excludes) ? d.excludes : _parseLines(d.excludes),
        pricingSlabs,
        itinerary,
      };
    });
}


const whyChoose = [
  { icon: "🎯", title: "Customized Industrial Visit Planning", desc: "Every institution has different academic objectives. We design fully customized itineraries aligned with your curriculum and industry exposure goals." },
  { icon: "🏭", title: "Industry Tie-Ups for Real Exposure", desc: "We have established partnerships with industries across manufacturing, IT, hospitality, agriculture, and more for authentic student exposure." },
  { icon: "🛡️", title: "Safe & Student-Friendly Itineraries", desc: "Student safety is our top priority. All trips include trained guides, verified transport, insured stays, and 24/7 support." },
  { icon: "💰", title: "Affordable Packages", desc: "We offer competitive group pricing with no hidden charges. Special discounts for bulk bookings from colleges and schools." },
  { icon: "📋", title: "End-to-End Support", desc: "From travel and accommodation to industry visit coordination and documentation — we handle everything so faculty can focus on students." },
  { icon: "📜", title: "Official Visit Certificates", desc: "Students receive official visit letters and certificates that can be attached to their academic portfolios and placement documents." },
];

const blogIdeas = [
  { title: "Top 10 Industrial Visit Places in India for Students", icon: "🏭" },
  { title: "Best Educational Tours for Engineering Colleges", icon: "⚙️" },
  { title: "Why Industrial Visits Are Important for Students", icon: "🎓" },
  { title: "Affordable College Trip Packages in India", icon: "💰" },
];

export default function IndustrialVisits() {
  const [activeDestination, setActiveDestination] = useState(null);
  const [expandedItinerary, setExpandedItinerary] = useState(new Set());
  const [destinations, setDestinations] = useState(() => buildDestinations());

  const toggleItinerary = (id) =>
    setExpandedItinerary((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Industrial Visits for Colleges & Schools in India | Delhi, Manali, Jaipur, Kerala, Goa | Gadvede Trekkers";

    syncProductsFromApi("industrial", "gt_iv")
      .then((items) => { if (items) setDestinations(buildDestinations()); })
      .catch(() => {});

    const onStorage = () => setDestinations(buildDestinations());
    window.addEventListener("storage", onStorage);
    window.addEventListener("gt:storage-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("gt:storage-updated", onStorage);
    };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1d4ed8 100%)", padding: "64px 0 52px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=60') center/cover no-repeat", opacity: 0.15 }} />
        <div className="container" style={{ position: "relative" }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: "0.78rem", marginBottom: 20, opacity: 0.8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Link to="/" style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>Home</Link>
            <span>›</span>
            <span style={{ color: "#fff" }}>College Industrial Visits</span>
          </nav>

          <span style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "5px 18px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "inline-block", marginBottom: 16 }}>
            🎓 Educational &amp; Industrial Tours
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
            Industrial Visits for<br />Colleges &amp; Schools in India
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.9, maxWidth: 700, lineHeight: 1.8, marginBottom: 28 }}>
            Plan the best industrial visits for colleges and schools across India. Explore <strong>Delhi, Manali, Amritsar, Agra, Rajasthan, Kerala, and Goa</strong> with affordable, safe, and educational tour packages — combining practical industry exposure, learning, and unforgettable travel.
          </p>

          {/* Quick destination links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={() => scrollTo(d.id)}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              >
                {d.icon} {d.title.split("–")[0].trim()}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {[
              { num: "500+", label: "Student Groups" },
              { num: "15+", label: "Destinations" },
              { num: "50+", label: "Industry Partners" },
              { num: "98%", label: "Satisfaction Rate" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#93c5fd" }}>{s.num}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8, letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INTRO ── */}
      <div style={{ background: "#fff", padding: "48px 0", borderBottom: "1px solid #e5e7eb" }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ fontWeight: 800, color: "#1e3a5f", textAlign: "center", fontSize: "clamp(1.3rem,3vw,1.8rem)", marginBottom: 16 }}>
            🎓 Educational &amp; Industrial Visits — End-to-End Planning
          </h2>
          <p style={{ color: "#374151", lineHeight: 1.85, textAlign: "center", marginBottom: 12, fontSize: "0.95rem" }}>
            We specialize in organizing <strong>educational and industrial visits</strong> for colleges and schools across India. Our tours are designed to combine <strong>practical industry exposure, learning, and travel experience</strong> for students.
          </p>
          <p style={{ color: "#374151", lineHeight: 1.85, textAlign: "center", fontSize: "0.93rem" }}>
            Whether it's a technical visit, management exposure, or a fun educational trip, we provide <strong>end-to-end planning</strong> — including travel, accommodation, industry coordination, and complete safety support.
          </p>
        </div>
      </div>

      {/* ── DESTINATIONS ── */}
      <div className="container py-5">
        <h2 style={{ fontWeight: 800, color: "#1e3a5f", textAlign: "center", fontSize: "clamp(1.3rem,3vw,1.9rem)", marginBottom: 8 }}>
          📍 Popular Industrial Visit Destinations
        </h2>
        <p style={{ textAlign: "center", color: "#6b7280", maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.7 }}>
          From the mountains of Manali to the beaches of Goa — we cover all major educational tour circuits across India.
        </p>

        {destinations.map((dest, idx) => (
          <div
            key={dest.id}
            id={dest.id}
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              marginBottom: 40,
              scrollMarginTop: 80,
            }}
          >
            {/* Destination Header */}
            <div style={{ background: idx % 2 === 0 ? "linear-gradient(135deg, #1e3a5f, #1d4ed8)" : "linear-gradient(135deg, #064e3b, #059669)", padding: "24px 32px", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {dest.subtitle}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: "clamp(1.1rem,2.5vw,1.5rem)", margin: 0 }}>
                    {dest.icon} {dest.title}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600 }}>
                    ⏱ {dest.duration}
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600 }}>
                    🎓 {dest.bestFor}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: "28px 32px" }}>
              {/* Image Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                {dest.images.map((img, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: "hidden", position: "relative" }}>
                    <img
                      src={img.src}
                      alt={img.caption}
                      style={{ width: "100%", height: 140, objectFit: "cover", display: "block", transition: "transform 0.4s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)", padding: "20px 8px 8px", color: "#fff", fontSize: "0.68rem", fontWeight: 600 }}>
                      {img.caption}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Highlights */}
                <div>
                  <div style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.88rem", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    ✅ Trip Highlights
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {dest.highlights.map((h) => (
                      <li key={h} style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#374151", fontSize: "0.88rem", marginBottom: 8, lineHeight: 1.5 }}>
                        <span style={{ color: "#059669", fontWeight: 700, marginTop: 2 }}>✔</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Industry Sectors */}
                <div>
                  <div style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.88rem", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    🏭 Industry Sectors Covered
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {dest.industries.map((ind) => (
                      <span key={ind} style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 8, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CTA bar — always visible ── */}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                  Customized itinerary available · Group discounts applicable · Certificate provided
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {/* View Itinerary toggle */}
                  <button
                    type="button"
                    onClick={() => toggleItinerary(dest.id)}
                    style={{
                      background: expandedItinerary.has(dest.id) ? "#1e3a5f" : "#fff",
                      color: expandedItinerary.has(dest.id) ? "#fff" : "#1e3a5f",
                      border: "2px solid #1e3a5f",
                      padding: "10px 20px", borderRadius: 10,
                      fontWeight: 700, fontSize: "0.85rem",
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    📋 {expandedItinerary.has(dest.id) ? "Hide Itinerary ↑" : "View Itinerary ↓"}
                  </button>
                  {/* Enquire button */}
                  <button
                    type="button"
                    onClick={() => setActiveDestination(dest)}
                    style={{ background: "#1d4ed8", color: "#fff", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1e3a5f")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                  >
                    Enquire Now →
                  </button>
                </div>
              </div>

              {/* ── Expandable Itinerary Panel ── */}
              {expandedItinerary.has(dest.id) && (
                <div style={{ marginTop: 0, borderTop: "2px solid #e0f2fe", paddingTop: 24 }}>

                  {/* Package cost + includes/excludes */}
                  {(dest.packageCost || dest.pricingSlabs || dest.includes || dest.excludes) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 24 }}>
                      {dest.pricingSlabs && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 18px", gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                            💰 Package Cost — Per Student (Based on Group Size)
                          </div>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                              <thead>
                                <tr style={{ background: "#dcfce7" }}>
                                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#166534", fontWeight: 700, borderBottom: "2px solid #bbf7d0" }}>Group Size</th>
                                  <th style={{ padding: "8px 14px", textAlign: "center", color: "#166534", fontWeight: 700, borderBottom: "2px solid #bbf7d0" }}>Price / Student</th>
                                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#166534", fontWeight: 700, borderBottom: "2px solid #bbf7d0" }}>Note</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dest.pricingSlabs.map((slab, si) => (
                                  <tr key={si} style={{ borderBottom: "1px solid #d1fae5", background: si % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                                    <td style={{ padding: "9px 14px", fontWeight: 700, color: "#0f172a" }}>👥 {slab.students} Students</td>
                                    <td style={{ padding: "9px 14px", textAlign: "center" }}>
                                      {slab.pricePerHead
                                        ? <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#064e3b" }}>₹{slab.pricePerHead.toLocaleString("en-IN")}</span>
                                        : <span style={{ color: "#6b7280", fontStyle: "italic", fontSize: "0.8rem" }}>Contact us</span>}
                                    </td>
                                    <td style={{ padding: "9px 14px", color: "#374151", fontSize: "0.78rem" }}>{slab.note}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{ marginTop: 10, fontSize: "0.75rem", color: "#6b7280" }}>
                            * Prices are indicative. Final quote provided after form submission based on confirmed group size, season, and customisation.
                          </div>
                        </div>
                      )}
                      {dest.packageCost && !dest.pricingSlabs && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                          <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Package Cost</div>
                          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#064e3b" }}>₹{dest.packageCost.toLocaleString("en-IN")}</div>
                          <div style={{ fontSize: "0.78rem", color: "#15803d" }}>per student</div>
                        </div>
                      )}
                      {dest.includes && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#166534", fontSize: "0.82rem", marginBottom: 8 }}>✅ Package Includes</div>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {dest.includes.map((item, i) => (
                              <li key={i} style={{ fontSize: "0.8rem", color: "#374151", marginBottom: 5, display: "flex", gap: 6 }}>
                                <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>{item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {dest.excludes && (
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.82rem", marginBottom: 8 }}>❌ Not Included</div>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {dest.excludes.map((item, i) => (
                              <li key={i} style={{ fontSize: "0.8rem", color: "#374151", marginBottom: 5, display: "flex", gap: 6 }}>
                                <span style={{ color: "#dc2626" }}>✗</span>{item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Day-wise itinerary */}
                  {dest.itinerary ? (
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.88rem", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        🗓 Day-wise Itinerary — {dest.duration}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
                        {dest.itinerary.map((d, i) => (
                          <div key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#f0fdf4", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              <span style={{ background: "#1e3a5f", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>{d.day}</span>
                              <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.85rem", lineHeight: 1.3 }}>{d.title}</span>
                            </div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                              {d.items.map((item, j) => (
                                <li key={j} style={{ fontSize: "0.8rem", color: "#374151", marginBottom: 4, display: "flex", gap: 6, lineHeight: 1.45 }}>
                                  <span style={{ color: "#1d4ed8", marginTop: 2, flexShrink: 0 }}>•</span>{item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "#f1f5f9", borderRadius: 12, padding: "20px 24px", textAlign: "center", color: "#64748b" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Custom Itinerary Available</div>
                      <div style={{ fontSize: "0.85rem" }}>Contact us with your institution details and we'll prepare a tailored {dest.duration} itinerary for your group.</div>
                      <button
                        type="button"
                        onClick={() => setActiveDestination(dest)}
                        style={{ marginTop: 12, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        Request Custom Itinerary →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── WHY CHOOSE US ── */}
      <div style={{ background: "#eff6ff", padding: "60px 0" }}>
        <div className="container">
          <h2 style={{ fontWeight: 800, color: "#1e3a5f", textAlign: "center", fontSize: "clamp(1.3rem,3vw,1.9rem)", marginBottom: 8 }}>
            ✅ Why Choose Gadvede Trekkers?
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.7 }}>
            We are industrial visit planners trusted by colleges and schools across Pune, Mumbai, and India.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {whyChoose.map((w) => (
              <div key={w.title} style={{ background: "#fff", borderRadius: 16, padding: "24px 26px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{w.icon}</div>
                <h4 style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.95rem", marginBottom: 8 }}>{w.title}</h4>
                <p style={{ color: "#374151", fontSize: "0.87rem", lineHeight: 1.75, margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background: "#fff", padding: "60px 0" }}>
        <div className="container">
          <h2 style={{ fontWeight: 800, color: "#1e3a5f", textAlign: "center", fontSize: "clamp(1.3rem,3vw,1.9rem)", marginBottom: 40 }}>
            📋 How We Plan Your Industrial Visit
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
            {[
              { step: "01", icon: "📞", title: "Initial Consultation", desc: "Share your institution's requirements, student count, budget, and preferred destinations." },
              { step: "02", icon: "🗺️", title: "Custom Itinerary", desc: "We design a tailored itinerary with industry visits, accommodation, transport, and activities." },
              { step: "03", icon: "🏭", title: "Industry Coordination", desc: "We coordinate with partner industries and arrange official visit permissions and scheduling." },
              { step: "04", icon: "🚌", title: "Travel & Stay", desc: "Comfortable transport, verified hotels, and mess/catering arrangements for student groups." },
              { step: "05", icon: "🎓", title: "On-Trip Support", desc: "Dedicated trip coordinator accompanies the group with 24/7 faculty and admin support." },
              { step: "06", icon: "📜", title: "Certificates & Report", desc: "Students receive visit certificates. Institutions get a post-trip report for academic records." },
            ].map((s) => (
              <div key={s.step} style={{ background: "#f9fafb", borderRadius: 16, padding: "22px 20px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#1d4ed8", letterSpacing: 2, marginBottom: 8 }}>STEP {s.step}</div>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{s.icon}</div>
                <h4 style={{ fontWeight: 700, color: "#1e3a5f", fontSize: "0.9rem", marginBottom: 6 }}>{s.title}</h4>
                <p style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOCUS KEYWORDS / SEO BLOCK ── */}
      <div style={{ background: "#f0fdf4", padding: "48px 0" }}>
        <div className="container">
          <h2 style={{ fontWeight: 800, color: "#064e3b", textAlign: "center", fontSize: "clamp(1.2rem,2.5vw,1.6rem)", marginBottom: 12 }}>
            🔍 Popular Searches
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", maxWidth: 560, margin: "0 auto 28px", fontSize: "0.88rem", lineHeight: 1.7 }}>
            We serve students and institutions looking for industrial visits across India
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              "Industrial visits for colleges in India",
              "School industrial tours India",
              "Educational tours India for students",
              "Industrial visit packages India",
              "College trip Delhi Manali Amritsar",
              "Rajasthan educational tours Jaipur Udaipur Jaisalmer",
              "Kerala industrial tour packages",
              "Goa student trips India",
              "Industrial visits in Delhi",
              "Educational tours in Manali",
              "Student trips to Amritsar & Agra",
              "Industrial visit planners in Pune",
              "Industrial visit planners in Mumbai",
            ].map((kw) => (
              <span key={kw} style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 999, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600 }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)", padding: "56px 0", color: "#fff", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(1.4rem,3vw,2.2rem)", marginBottom: 14, lineHeight: 1.2 }}>
            Book Your College or School Industrial Visit Today
          </h2>
          <p style={{ opacity: 0.88, lineHeight: 1.8, marginBottom: 32, fontSize: "1rem" }}>
            Give students a real-world learning experience that goes beyond textbooks. Connect with us to plan an educational tour tailored to your institution's needs and academic calendar.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/contact"
              style={{ background: "#fff", color: "#1e3a5f", padding: "13px 32px", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", textDecoration: "none", transition: "transform 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              📞 Get a Free Quote
            </Link>
            <a
              href="https://wa.me/919856112727?text=Hi%2C%20I%20want%20to%20enquire%20about%20industrial%20visit%20packages%20for%20colleges"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#25d366", color: "#fff", padding: "13px 32px", borderRadius: 12, fontWeight: 800, fontSize: "0.95rem", textDecoration: "none", transition: "transform 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              💬 WhatsApp Us Now
            </a>
          </div>
        </div>
      </div>

      {activeDestination && (
        <EnquiryModal
          dest={activeDestination}
          category="Industrial Visit"
          onClose={() => setActiveDestination(null)}
        />
      )}

    </div>
  );
}
