import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";
import { rentalPath } from "../../utils/rentalLookup";
import { realRating } from "../../utils/rating";
import { useSiteContent } from "../../config/siteContent";

/** "⭐ 4.7 (98 reviews)" only when the item has real ratings. */
function RatingLine({ item }) {
  const rating = realRating(item);
  if (!rating) return null;
  return <p style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 10 }}>⭐ {rating.label}</p>;
}

/* The page lists only published rentals synced from the API (gt_rentals). The old hard-coded
   catalogue (shown whenever the API returned none) was removed so nothing unpublished looks bookable. */

const CATEGORIES = ["All", "Tents", "Gear", "Villas"];

export default function Rental() {
  const trustBadges = useSiteContent("site.trustBadges")?.items || []; // Admin → Site Content (t129u)
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(
    location.state?.category || "All"
  );

  const [, setSyncKey] = useState(0);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Rent Camping & Trekking Gear | Gadvede Trekkers";
    // Sync from backend so admin changes reflect on all devices
    syncProductsFromApi("rental", "gt_rentals")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {})
      .finally(() => setSynced(true));
  }, []);

  const _rawRentals = getAdminItems("gt_rentals");
  const adminRentals = _rawRentals.filter((r) => r.active !== false).map(normaliseItem);
  const baseRentals = adminRentals;
  const adminVillas = getAdminItems("gt_villas")
    .filter((v) => v.active !== false)
    .map((v) => ({ ...normaliseItem(v), category: "Villas" }));
  const allItems = [...baseRentals, ...adminVillas];
  const filtered = activeCategory === "All"
    ? allItems
    : allItems.filter((i) => i.category === activeCategory);

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)", padding: "56px 0 44px", color: "#fff" }}>
        <div className="container">
          <nav style={{ fontSize: "0.78rem", marginBottom: 18, opacity: 0.8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/" style={{ color: "#6ee7b7", textDecoration: "none", fontWeight: 600 }}>Home</a>
            <span>›</span>
            <span style={{ color: "#fff" }}>Rent Gear</span>
          </nav>
          <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "5px 18px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", display: "inline-block", marginBottom: 16 }}>
            🏕 Tent &amp; Gear Rentals
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
            Rent Camping &amp; Trekking Gear
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.88, maxWidth: 620, lineHeight: 1.75, marginBottom: 28 }}>
            Tents and trekking gear on rent. Pick an item to see the rental rates and ask us on WhatsApp.
          </p>

          {/* Trust badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {trustBadges.map((b) => (
              <div key={b.text} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{b.icon}</span>{b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 90, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                style={{
                  padding: "6px 20px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", transition: "all 0.2s",
                  border: activeCategory === c ? "none" : "1px solid #d1d5db",
                  background: activeCategory === c ? "#059669" : "#f9fafb",
                  color: activeCategory === c ? "#fff" : "#374151",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>
            Showing {filtered.length} items
          </span>
        </div>
      </div>

      {/* ── GEAR GRID ── */}
      <div className="container py-5">
        {filtered.length === 0 && synced && (
          <div className="text-center text-muted py-5" data-testid="rentals-empty">
            <p className="mb-2">No rental items are listed right now.</p>
            <p>Message us on WhatsApp to ask about tents and gear for your dates.</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {filtered.map((item) => (
            <div
              key={item.id || item.name}
              style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb", transition: "transform 0.3s, box-shadow 0.25s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
            >
              {/* Image */}
              <div style={{ position: "relative" }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: 210, objectFit: "cover", display: "block" }} />
                <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.55)", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                  {item.category}
                </span>
                {item.badge && (
                  <span style={{ position: "absolute", top: 12, right: 12, background: "#059669", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 }}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: "16px 18px 20px" }}>
                <h5 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", marginBottom: 4 }}>{item.name}</h5>
                <p style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 6 }}>📍 {item.location}</p>
                <RatingLine item={item} />
                <p style={{ fontSize: "0.83rem", color: "#374151", lineHeight: 1.55, marginBottom: 14 }}>{item.description}</p>

                {/* Mini pricing table */}
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 12px", marginBottom: 14, border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 0", fontSize: "0.76rem" }}>
                    {(item.pricingTiers || []).map((t) => (
                      <div key={t.period} style={{ display: "contents" }}>
                        <span style={{ color: "#6b7280" }}>{t.period}</span>
                        <span style={{ color: "#059669", fontWeight: 700, textAlign: "right" }}>₹{t.rentPerDay}/day</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>Deposit: </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>₹{item.deposit?.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href={buildBookingWhatsAppUrl({
                        name: item.name,
                        location: item.location,
                        price: item.pricePerDay || item.pricingTiers?.[0]?.rentPerDay,
                        productType: "rental",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "#059669", color: "#fff", padding: "8px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.83rem", textDecoration: "none", flex: 1, textAlign: "center", minHeight: 44 }}
                    >
                      Book Now
                    </a>
                    <Link
                      to={rentalPath(item)}
                      state={{ item }}
                      style={{ background: "#fff", color: "#059669", padding: "8px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.83rem", textDecoration: "none", border: "1px solid #059669", flex: 1, textAlign: "center" }}
                    >
                      View Details
                    </Link>
                    <a
                      href={createWhatsAppInquiryUrl({
                        packageName: item.name,
                        location: item.location,
                        category: "Rental",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "#ecfdf5", color: "#047857", padding: "8px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.83rem", textDecoration: "none", border: "1px solid #86efac", width: "100%", textAlign: "center" }}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ background: "#f0fdf4", padding: "56px 0" }}>
        <div className="container">
          <h2 style={{ fontWeight: 800, color: "#064e3b", textAlign: "center", marginBottom: 8, fontSize: "clamp(1.4rem,3vw,2rem)" }}>
            How Gadvede Rentals Works
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Simple, fast, and transparent. Rent premium gear without the hassle of buying.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
            {[
              { step: "1", icon: "📅", title: "Choose Dates", desc: "Pick your rental start and end dates." },
              { step: "2", icon: "🪪", title: "KYC Verification", desc: "Provide a government-issued photo ID and address proof before or at delivery." },
              { step: "3", icon: "🚚", title: "Delivery to Your Door", desc: "We deliver to Pune and Mumbai. A product checklist is provided at delivery time." },
              { step: "4", icon: "🏕", title: "Enjoy Your Adventure", desc: "Use the gear responsibly. Return it in the same condition for a full deposit refund." },
            ].map((s) => (
              <div key={s.step} style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ width: 28, height: 28, background: "#059669", color: "#fff", borderRadius: "50%", fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>{s.step}</div>
                <h4 style={{ fontWeight: 700, color: "#064e3b", fontSize: "0.95rem", marginBottom: 6 }}>{s.title}</h4>
                <p style={{ color: "#374151", fontSize: "0.84rem", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
