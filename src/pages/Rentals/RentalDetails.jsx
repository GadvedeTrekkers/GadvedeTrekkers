import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import { findRentalEntry, rentalPath } from "../../utils/rentalLookup";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";
import { realRating } from "../../utils/rating";
import NotFound from "../NotFound";
import { useSiteContent } from "../../config/siteContent";

const RENTAL_PREVIEW_KEY = "gt_rental_preview";

/* Rentals are resolved from route state, the preview, or the published items synced from the API;
   there is no hard-coded catalogue here any more. */

const rentalRules = [
  "You will be asked to provide a government-issued photo ID and address proof before or at the time of delivery.",
  "For certain geographies and high-value orders, we may seek further KYC information (work verification, social media verification).",
  "You may cancel your rental order up to 48 hours before your rental start date for a full refund. Refer to our cancellation policy.",
  "We will provide a detailed product checklist at the time of delivery. Any concerns must be reported within 4 hours of delivery.",
  "It is your responsibility to use the product correctly and within permissible operating conditions.",
  "For any damage to the rented product, you will be liable to pay repair or replacement costs as per our Damage Policy.",
  "Deposit refund will be processed after a thorough check at our offices — normal processing time is 3 working days from product return.",
];

export default function RentalDetails() {
  const trustBadges = useSiteContent("site.trustBadges")?.items || []; // Admin → Site Content (t129u)
  const { id } = useParams();
  const location = useLocation();

  const previewItem = id === "preview"
    ? (() => {
        try {
          return JSON.parse(sessionStorage.getItem(RENTAL_PREVIEW_KEY) || "null");
        } catch {
          return null;
        }
      })()
    : null;

  /* A shared link has no router state and an empty cache, so the page loads the published rentals and villas itself
     (same sync the list pages use) and finds the record by id or slug. */
  const [synced, setSynced] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (id === "preview") return undefined;
    let cancelled = false;
    Promise.allSettled([
      syncProductsFromApi("rental", "gt_rentals"),
      syncProductsFromApi("villa", "gt_villas"),
    ]).finally(() => { if (!cancelled) { setSynced(true); setTick((t) => t + 1); } });
    return () => { cancelled = true; };
  }, [id]);

  const adminItem =
    id !== "preview"
      ? (() => {
          const found = findRentalEntry(id, {
            rentals: getAdminItems("gt_rentals"),
            villas: getAdminItems("gt_villas"),
          });
          return found ? normaliseItem(found) : null;
        })()
      : null;

  /* resolve item — from route state or catalogue lookup */
  const item =
    previewItem ||
    location.state?.item ||
    adminItem ||
    null;
  const rating = realRating(item);

  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  if (!item) {
    if (id !== "preview" && !synced) {
      return <div className="container py-5 text-center text-muted" data-testid="product-loading">Loading…</div>;
    }
    return (
      <NotFound
        title="We couldn’t find that rental"
        message="This rental page is not available. Browse our rentals or message us on WhatsApp."
      />
    );
  }

  const images = item.images || [item.image];
  const relatedPool = getAdminItems("gt_rentals").filter((r) => r.active !== false).map(normaliseItem);
  const youMayLike = relatedPool.filter((c) => c.id !== item.id).slice(0, 4);

  /* compute rental cost */
  const days = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000))
    : null;
  const tier = item.pricingTiers?.slice().sort((a, b) => {
    const aD = parseInt(a.period); const bD = parseInt(b.period);
    return Math.abs(aD - (days || 1)) - Math.abs(bD - (days || 1));
  })[0];
  const totalCost = days ? tier.rentPerDay * days * qty : null;

  const rentalBookingUrl = buildBookingWhatsAppUrl({
    name: item.name,
    location: item.location,
    price: totalCost || item.pricePerDay || item.pricingTiers?.[0]?.rentPerDay,
    productType: "rental",
    guests: qty,
    note: totalCost ? `Estimate: ₹${totalCost.toLocaleString("en-IN")} for ${days} day${days > 1 ? "s" : ""}` : "",
  }, startDate && endDate ? `${startDate} to ${endDate}` : null);

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div className="container" style={{ padding: "12px 16px", fontSize: "0.78rem", color: "#6b7280", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/" style={{ color: "#059669", textDecoration: "none", fontWeight: 600 }}>Home</Link>
          <span>›</span>
          <Link to="/rentals" style={{ color: "#059669", textDecoration: "none", fontWeight: 600 }}>Rent Gear</Link>
          <span>›</span>
          <span style={{ color: "#374151" }}>{item.name}</span>
        </div>
      </div>

      <div className="container py-5">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 40, alignItems: "start" }}>

          {/* ── LEFT: Image Gallery ── */}
          <div>
            <div style={{ borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 12 }}>
              <img
                src={images[activeImage]}
                alt={item.name}
                style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }}
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: 72, height: 56, borderRadius: 10, overflow: "hidden", cursor: "pointer",
                      border: activeImage === i ? "2.5px solid #059669" : "2px solid #e5e7eb",
                      transition: "border 0.2s",
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info + Booking ── */}
          <div>
            {item.badge && (
              <span style={{ background: "#d1fae5", color: "#065f46", padding: "3px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, display: "inline-block", marginBottom: 10 }}>
                {item.badge}
              </span>
            )}
            <h1 style={{ fontWeight: 800, fontSize: "clamp(1.3rem,3vw,1.8rem)", color: "#111827", marginBottom: 8, lineHeight: 1.25 }}>
              {item.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              {rating && <span style={{ fontSize: "0.9rem", color: "#374151" }}>⭐ {rating.label}</span>}
              <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.82rem" }}>📍 {item.location}</span>
            </div>

            {/* Trust badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {trustBadges.map((b) => (
                <div key={b.text} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: "0.78rem", fontWeight: 600, color: "#065f46", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>

            {/* Rental Date Pickers */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, color: "#064e3b", marginBottom: 14, fontSize: "0.95rem" }}>
                🏕 Rental Info
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Rental Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Rental End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>Quantity:</span>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden" }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 34, height: 34, border: "none", background: "#f9fafb", cursor: "pointer", fontSize: "1rem", fontWeight: 700, color: "#374151" }}>−</button>
                  <span style={{ width: 36, textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} style={{ width: 34, height: 34, border: "none", background: "#f9fafb", cursor: "pointer", fontSize: "1rem", fontWeight: 700, color: "#374151" }}>+</button>
                </div>
              </div>

              {/* Cost estimate */}
              {totalCost && (
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#374151", marginBottom: 4 }}>
                    <span>{days} day{days > 1 ? "s" : ""} × ₹{tier.rentPerDay}/day × {qty} unit{qty > 1 ? "s" : ""}</span>
                    <span style={{ fontWeight: 700, color: "#059669" }}>₹{totalCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#6b7280" }}>
                    <span>Refundable Deposit</span>
                    <span>₹{(item.deposit * qty).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              <a
                href={rentalBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", width: "100%", background: "#059669",
                  color: "#fff", padding: "12px", borderRadius: 10,
                  fontWeight: 700, fontSize: "0.95rem", textAlign: "center",
                  textDecoration: "none", minHeight: 44,
                }}
              >
                Book Now
              </a>
            </div>

            {/* Deposit info */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#374151", padding: "0 4px" }}>
              <span>🔒</span>
              <span>Deposit Fee: <strong>₹{item.deposit?.toLocaleString("en-IN")}</strong></span>
              <Link to="/cancellation-policy" style={{ color: "#059669", fontWeight: 600, marginLeft: 4 }}>
                See how to get it waived
              </Link>
            </div>
          </div>
        </div>

        {/* ── PRICING TABLE ── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", marginTop: 40, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontWeight: 700, color: "#064e3b", marginBottom: 16, fontSize: "1.05rem" }}>📊 Rental Pricing</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f0fdf4" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#064e3b", fontWeight: 700, borderRadius: "8px 0 0 8px" }}>Rent Period</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", color: "#064e3b", fontWeight: 700, borderRadius: "0 8px 8px 0" }}>Rent / Day</th>
                </tr>
              </thead>
              <tbody>
                {(item.pricingTiers || []).map((t, i) => (
                  <tr key={t.period} style={{ borderBottom: i < item.pricingTiers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 600 }}>{t.period}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#059669", fontWeight: 700, fontSize: "1rem" }}>₹{t.rentPerDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb", marginBottom: 0 }}>
            {[
              { key: "about",   label: "About the Product" },
              { key: "specs",   label: "Product Specifications" },
              { key: "rules",   label: "Rental Rules" },
              rating && { key: "reviews", label: `Reviews (${rating.count})` },
            ].filter(Boolean).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 20px", border: "none", background: "none", cursor: "pointer",
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? "#059669" : "#6b7280",
                  borderBottom: activeTab === tab.key ? "3px solid #059669" : "3px solid transparent",
                  fontSize: "0.85rem", marginBottom: -2, whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: "0 0 16px 16px", border: "1px solid #e5e7eb", borderTop: "none", padding: "28px 32px" }}>
            {activeTab === "about" && (
              <p style={{ color: "#374151", lineHeight: 1.8, margin: 0, fontSize: "0.93rem" }}>
                {item.description}
              </p>
            )}

            {activeTab === "specs" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <tbody>
                    {(item.specifications || []).map((s, i) => (
                      <tr key={s.label} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                        <td style={{ padding: "10px 16px", color: "#6b7280", fontWeight: 600, width: "40%" }}>{s.label}</td>
                        <td style={{ padding: "10px 16px", color: "#111827", fontWeight: 500 }}>{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "rules" && (
              <ul style={{ padding: "0 0 0 20px", margin: 0 }}>
                {rentalRules.map((rule, i) => (
                  <li key={i} style={{ color: "#374151", lineHeight: 1.8, marginBottom: 10, fontSize: "0.88rem" }}>{rule}</li>
                ))}
              </ul>
            )}

            {activeTab === "reviews" && rating && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111827" }}>{rating.value.toFixed(1)}</div>
                <div style={{ fontSize: "0.88rem", marginBottom: 20 }}>Based on {rating.count} reviews</div>
                <p style={{ fontSize: "0.85rem" }}>Individual review display coming soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── YOU MAY ALSO LIKE ── */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontWeight: 800, color: "#064e3b", marginBottom: 24, fontSize: "1.2rem" }}>
            You May Also Like…
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {youMayLike.map((rel) => (
              <div key={rel.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", transition: "transform 0.25s, box-shadow 0.25s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.11)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)"; }}
              >
                <img src={(rel.images || [rel.image])[0]} alt={rel.name} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "14px 16px 16px" }}>
                  <h5 style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827", marginBottom: 6, lineHeight: 1.35 }}>{rel.name}</h5>
                  {/* Mini pricing */}
                  <div style={{ fontSize: "0.73rem", color: "#6b7280", marginBottom: 10 }}>
                    {(rel.pricingTiers || []).map((t) => (
                      <div key={t.period} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{t.period}</span>
                        <span style={{ color: "#059669", fontWeight: 700 }}>₹{t.rentPerDay}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={rentalPath(rel)}
                    state={{ item: rel }}
                    style={{ display: "block", background: "#059669", color: "#fff", textAlign: "center", padding: "7px", borderRadius: 8, fontWeight: 700, fontSize: "0.8rem", textDecoration: "none" }}
                  >
                    View &amp; Rent
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
