import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminItems } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";
import { waUrl } from "../../config/whatsappSetting";
import { villaStayTotal } from "../../utils/villaPricing";
import { useSeo } from "../../seo/useSeo";
import { realRating } from "../../utils/rating";
import { SITE_ORIGIN } from "../../seo/publicSeo";

// No built-in sample villas: the page lists only real villas from the DB (/api/products?type=villa).
// Kept as an empty export because the admin page (ManageVillas) imports it as its seed list.
export const villasList = [];

const SORT_OPTIONS = [
  { value: "top", label: "Our Top Picks" },
  { value: "price-asc", label: "Lowest Price First" },
  { value: "rating", label: "Top Reviewed" },
];

const SCORE_FILTERS = [
  { value: 0, label: "Any" },
  { value: 7, label: "Good: 7+" },
  { value: 8, label: "Very Good: 8+" },
  { value: 8.5, label: "Fabulous: 8.5+" },
];

const amenityIcons = {
  "Free WiFi": "📶", "Free Parking": "🅿️", "Garden": "🌿", "Balcony": "🏠",
  "Terrace": "🌅", "Patio": "☀️", "Pets Allowed": "🐾", "Pet Friendly": "🐾",
  "Family Rooms": "👨‍👩‍👧", "Bath": "🛁", "Barbecue": "🔥", "Mountain View": "⛰️",
  "Private Pool": "🏊", "Air Conditioning": "❄️", "Kitchen": "🍳",
  "Farm-to-Table Dining": "🥗", "Hammocks": "🌴", "Entire Place": "🏡",
  "Nature Views": "🌲",
  "Private Pool (14 × 24 ft)": "🏊", "Private Parking for 5 Cars": "🅿️", "2 AC Bedrooms": "❄️", "Wi-Fi": "📶", "Smart LED TV": "📺", "Sound System": "🔊",
  "Fridge": "🧊", "Extra Beds": "🛏️", "Poolside Gazebo": "⛱️",
  "Open Terrace with Mountain View": "⛰️", "Outdoor Seating by the Pool": "🪑",
  "2 Bathrooms with Geyser": "🚿", "Aquaguard Drinking Water": "💧",
};


function StarRating({ score }) {
  const filled = Math.round(score / 2);
  return (
    <span>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ color: s <= filled ? "#f59e0b" : "#d1d5db", fontSize: "0.9rem" }}>★</span>
      ))}
    </span>
  );
}

function RatingBadge({ score }) {
  const color = score >= 8.5 ? "#059669" : score >= 7 ? "#0d9488" : "#3b82f6";
  return (
    <span style={{ background: color, color: "#fff", fontWeight: 800, fontSize: "1rem", padding: "6px 12px", borderRadius: "8px 8px 8px 0" }}>
      {score}
    </span>
  );
}

/* ── Detail Modal ── */
function VillaDetail({ villa, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const stay = villaStayTotal(villa, checkIn, checkOut);
  const nights = stay.nights;
  const totalPrice = stay.total;
  const hasWeekendPrice = Number(villa.weekendPrice) > 0;
  const thumbs = villa.galleryThumbs?.length === villa.gallery.length ? villa.galleryThumbs : villa.gallery;
  const bookingUrl = buildBookingWhatsAppUrl({
    name: villa.name,
    location: villa.location,
    price: totalPrice,
    productType: "villa",
    guests,
    note: checkIn && checkOut ? `Stay: ${nights} night${nights === 1 ? "" : "s"}` : "",
  }, checkIn && checkOut ? `${checkIn} to ${checkOut}` : null);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)", display: "flex",
        alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "20px 16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20,
          width: "100%", maxWidth: 860,
          overflow: "hidden", position: "relative",
          marginTop: 20, marginBottom: 20,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 10,
            background: "rgba(0,0,0,0.5)", border: "none",
            color: "#fff", width: 34, height: 34, borderRadius: "50%",
            fontSize: "1.1rem", cursor: "pointer", lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Gallery */}
        <div style={{ position: "relative", background: "#111" }}>
          <img
            src={villa.gallery[activeImg]}
            alt={villa.name}
            style={{ width: "100%", height: 320, objectFit: "cover", display: "block", opacity: 0.95 }}
          />
          {/* Thumbnail strip */}
          {villa.gallery.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", gap: 6, overflowX: "auto" }}>
              {thumbs.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 52, height: 38, borderRadius: 6, overflow: "hidden",
                    border: i === activeImg ? "2px solid #fff" : "2px solid rgba(255,255,255,0.4)",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <img src={img} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
              <div
                style={{
                  background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6,
                  padding: "0 10px", fontSize: "0.75rem", fontWeight: 600,
                  display: "flex", alignItems: "center", flexShrink: 0,
                }}
              >
                {activeImg + 1} / {villa.gallery.length} photos
              </div>
            </div>
          )}
          {/* Price Match badge */}
          <div
            style={{
              position: "absolute", top: 14, left: 14,
              background: "#fff", borderRadius: 8, padding: "5px 12px",
              fontSize: "0.78rem", fontWeight: 700, color: "#059669",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            🏷️ We Price Match
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <div>
              <h2 style={{ fontWeight: 800, color: "#111827", fontSize: "1.35rem", marginBottom: 4 }}>
                {villa.name}
              </h2>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
                📍 {villa.location}
              </p>
            </div>
            {realRating(villa, { max: 10 }) && (
            <div style={{ textAlign: "right" }}>
              <RatingBadge score={villa.rating} />
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginTop: 4 }}>{villa.ratingLabel}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{villa.reviews} reviews</div>
            </div>
            )}
          </div>

          {/* Weekday / weekend price */}
          {hasWeekendPrice && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ background: "#eef2ff", color: "#1e1b4b", borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", fontWeight: 700 }}>
                Weekday (Sun–Thu night): ₹{villa.price.toLocaleString()} / night
              </span>
              <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 8, padding: "6px 12px", fontSize: "0.85rem", fontWeight: 700 }}>
                Weekend (Fri–Sat night): ₹{Number(villa.weekendPrice).toLocaleString()} / night
              </span>
            </div>
          )}

          {/* Location score */}
          {villa.locationScore > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 8, padding: "6px 12px", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: "#059669", fontSize: "0.9rem" }}>Excellent location</span>
            <span style={{ background: "#059669", color: "#fff", fontWeight: 800, fontSize: "0.8rem", padding: "2px 8px", borderRadius: 6 }}>
              {villa.locationScore}/10
            </span>
            {villa.reviews > 0 && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>score from {villa.reviews} reviews</span>}
          </div>
          )}

          {/* Guest review */}
          {villa.guestReview && (
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 20, borderLeft: "3px solid #059669" }}>
            <p style={{ fontSize: "0.85rem", color: "#374151", fontStyle: "italic", margin: "0 0 6px", lineHeight: 1.6 }}>
              "{villa.guestReview}"
            </p>
            <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>— {villa.reviewerName}</span>
          </div>
          )}

          {/* Quick facts */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Entire place is yours", icon: "🏡" },
              { label: villa.size, icon: "📐" },
              { label: `${villa.bedrooms} Bedrooms`, icon: "🛏️" },
              { label: `${villa.bathrooms} Bathrooms`, icon: "🛁" },
              { label: villa.accommodation[0]?.maxGuests ? `Up to ${villa.accommodation[0].maxGuests} guests` : "", icon: "👥" },
            ].filter((f) => f.label && !/^0 /.test(f.label)).map((f) => (
              <span
                key={f.label}
                style={{
                  background: "#f1f5f9", color: "#374151", borderRadius: 8,
                  padding: "6px 12px", fontSize: "0.82rem", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          {/* Amenities */}
          <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Most Popular Facilities</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {villa.amenities.map((a) => (
              <span
                key={a}
                style={{
                  background: "#f0fdf4", color: "#065f46",
                  border: "1px solid #bbf7d0", borderRadius: 8,
                  padding: "5px 12px", fontSize: "0.8rem", fontWeight: 500,
                }}
              >
                {amenityIcons[a] || "✓"} {a}
              </span>
            ))}
          </div>

          {/* Activities */}
          {villa.activities?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Activities</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {villa.activities.map((a) => (
                  <span key={a} style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 500 }}>
                    🎯 {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>About This Property</h4>
          <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8, marginBottom: 24, whiteSpace: "pre-line" }}>
            {villa.about}
          </p>

          {/* Distance */}
          {villa.distance && (
          <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 24 }}>
            📍 {villa.distance}
          </p>
          )}

          {/* Accommodation types */}
          <h4 style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Accommodation</h4>
          {villa.accommodation.map((acc) => (
            <div
              key={acc.type}
              style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", marginBottom: 12, border: "1px solid #e2e8f0" }}
            >
              <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 8, fontSize: "0.9rem" }}>
                🏠 {acc.type}{acc.maxGuests ? ` · Max ${acc.maxGuests} guests` : ""}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {acc.beds.map((b) => (
                  <span key={b} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", color: "#374151" }}>
                    🛏 {b}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Booking section */}
          <div
            style={{
              background: "#f0fdf4", borderRadius: 16,
              padding: "24px", marginTop: 24,
              border: "1px solid #bbf7d0",
            }}
          >
            <h4 style={{ fontWeight: 800, color: "#064e3b", marginBottom: 4 }}>
              Reserve Your Villa Stay
            </h4>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 16 }}>
              Select dates to check availability and prices
            </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  window.location.assign(bookingUrl);
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={checkIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    Guests
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8].map((n) => (
                      <option key={n} value={n}>{n} adult{n > 1 ? "s" : ""} · 0 children · 1 room</option>
                    ))}
                  </select>
                </div>

                {/* Price summary */}
                <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #e2e8f0" }}>
                  {stay.weekdayNights > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>₹{villa.price.toLocaleString()} × {stay.weekdayNights} {hasWeekendPrice ? "weekday " : ""}night{stay.weekdayNights !== 1 ? "s" : ""}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>₹{(stay.weekdayNights * villa.price).toLocaleString()}</span>
                  </div>
                  )}
                  {stay.weekendNights > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>₹{Number(villa.weekendPrice).toLocaleString()} × {stay.weekendNights} weekend night{stay.weekendNights !== 1 ? "s" : ""}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>₹{(stay.weekendNights * Number(villa.weekendPrice)).toLocaleString()}</span>
                  </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>Total</span>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#059669" }}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block", width: "100%", background: "#059669", color: "#fff",
                    borderRadius: 10, padding: "13px",
                    fontWeight: 700, fontSize: "0.95rem", textAlign: "center",
                    textDecoration: "none", marginBottom: 8, minHeight: 44,
                  }}
                >
                  Book Now
                </a>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center", margin: 0 }}>
                  Opens WhatsApp with your dates. You won't be charged on this page.
                </p>
              </form>
          </div>

          {/* WhatsApp quick contact */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a
              href={waUrl(`Hi! I'm interested in booking ${villa.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                color: "#25d366", fontWeight: 600, fontSize: "0.88rem",
                textDecoration: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Have questions? Chat on WhatsApp
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Main Villas Page ── */
export default function Villas() {
  useSeo({
    title: "Villas on Rent | Gadvede Trekkers",
    description: "Private villas on rent for families and groups, booked through Gadvede Trekkers. See photos, rates and amenities, and book on WhatsApp.",
    canonical: `${SITE_ORIGIN}/villas`,
  });
  const [sort, setSort] = useState("top");
  const [minScore, setMinScore] = useState(0);
  const [selectedVilla, setSelectedVilla] = useState(null);

  const [, setVillaSyncKey] = useState(0);
  const [villasLoading, setVillasLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Best Villas in Pune | Villa Booking | Gadvede Trekkers";

    syncProductsFromApi("villa", "gt_villas")
      .then((items) => { if (items) setVillaSyncKey((k) => k + 1); })
      .catch(() => {})
      .finally(() => setVillasLoading(false));

    const onStorage = () => setVillaSyncKey((k) => k + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("gt:storage-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("gt:storage-updated", onStorage);
    };
  }, []);

  const _storedVillas = getAdminItems("gt_villas");
  const activeVillas = _storedVillas.length > 0
    ? _storedVillas
        .filter((v) => v.active !== false)
        .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
        .map((v) => {
          let gallery;
          try { gallery = JSON.parse(v.imageGallery || "[]").filter(Boolean); } catch { gallery = []; }
          const amenitiesArr = String(v.amenities || "").split("\n").map((s) => s.trim()).filter(Boolean);
          const maxG = Number(v.maxGuests) || 0;
          const rating = Number(v.rating) || 0;
          const ratingLbl = v.ratingLabel || (rating >= 8.5 ? "Fabulous" : rating >= 8 ? "Very good" : "Good");
          return {
            id: v.id || String(v.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") || String(v.sortOrder),
            name: v.name || "",
            location: v.location || "",
            area: v.area || v.location || "",
            rating,
            ratingLabel: ratingLbl,
            reviews: Number(v.reviews) || 0,
            price: Number(v.price) || 0,
            originalPrice: Number(v.originalPrice) || 0,
            guests: "2 adults",
            size: v.size || "",
            bedrooms: Number(v.bedrooms) || 0,
            bathrooms: Number(v.bathrooms) || 0,
            badge: v.badge || null,
            weekendPrice: Number(v.weekendPrice) || 0,
            image: v.image || gallery[0] || "",
            gallery: gallery.length ? gallery : (v.image ? [v.image] : []),
            galleryThumbs: Array.isArray(v.galleryThumbs) ? v.galleryThumbs : [],
            locationScore: Number(v.locationScore) || 0,
            description: v.description || "",
            about: v.about || v.description || "",
            guestReview: v.guestReview || "",
            reviewerName: v.reviewerName || "",
            amenities: amenitiesArr,
            activities: [],
            accommodation: [{ type: `${v.bedrooms || "?"}-Bedroom Villa`, beds: Array.isArray(v.beds) ? v.beds : [], maxGuests: maxG }],
            distance: v.distance || v.nearbyAttractions || "",
          };
        })
    : [];
  // Only real villas from the admin/DB are listed (no built-in sample villas).
  const allVillas = activeVillas;

  const sorted = [...allVillas]
    .filter((v) => v.rating >= minScore)
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div>

      {/* ── HERO ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          padding: "60px 0 44px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div className="container">
          <span
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "5px 18px",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              display: "inline-block",
              marginBottom: 18,
              color: "#c7d2fe",
            }}
          >
            🏡 Villa Rentals
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, marginBottom: 10 }}>
            The Best Villas in Pune
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.85, maxWidth: 520, margin: "0 auto 0" }}>
            Check out our pick of great villas in Pune. Handpicked properties for every budget — from cozy cottages to luxury farmhouses with private pools.
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 90 }}>
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "12px 16px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>Filter by Review Score:</span>
            {SCORE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setMinScore(f.value)}
                style={{
                  padding: "5px 14px", borderRadius: 999,
                  border: minScore === f.value ? "none" : "1px solid #d1d5db",
                  background: minScore === f.value ? "#4338ca" : "#f9fafb",
                  color: minScore === f.value ? "#fff" : "#374151",
                  fontWeight: 600, fontSize: "0.78rem",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{sorted.length} properties</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", background: "#fff", cursor: "pointer" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── VILLA LIST ── */}
      <div className="container py-5">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sorted.map((villa) => (
            <div
              key={villa.id}
              style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                overflow: "hidden",
                display: "grid",
                gridTemplateColumns: "280px 1fr",
                transition: "box-shadow 0.2s",
                cursor: "pointer",
              }}
              className="villa-card-row"
              onClick={() => setSelectedVilla(villa)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)")}
            >
              {/* Image */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={villa.galleryThumbs?.[0] && villa.image === villa.gallery[0] ? villa.galleryThumbs[0] : villa.image}
                  alt={villa.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", minHeight: 200, objectFit: "cover", display: "block" }}
                />
                {villa.badge && (
                  <span
                    style={{
                      position: "absolute", top: 10, left: 10,
                      background: "#4338ca", color: "#fff",
                      padding: "3px 10px", borderRadius: 999,
                      fontSize: "0.72rem", fontWeight: 700,
                    }}
                  >
                    {villa.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111827", lineHeight: 1.3, margin: 0 }}>
                      {villa.name}
                    </h3>
                    {realRating(villa, { max: 10 }) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{villa.ratingLabel}</div>
                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{villa.reviews} reviews</div>
                      </div>
                      <RatingBadge score={villa.rating} />
                    </div>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: 6 }}>📍 {villa.location}</p>
                  <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
                    {villa.description}
                  </p>

                  {/* Top amenities preview */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {villa.amenities.slice(0, 5).map((a) => (
                      <span key={a} style={{ background: "#f0fdf4", color: "#065f46", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                        {amenityIcons[a] || "✓"} {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{villa.weekendPrice > 0 ? "Weekday price" : "Price from"}</div>
                    <div>
                      <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e1b4b" }}>
                        ₹{villa.price.toLocaleString()}
                      </span>
                      {villa.originalPrice > villa.price && (
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af", textDecoration: "line-through", marginLeft: 6 }}>
                        ₹{villa.originalPrice.toLocaleString()}
                      </span>
                      )}
                    </div>
                    {villa.weekendPrice > 0 ? (
                      <div style={{ fontSize: "0.78rem", color: "#92400e", fontWeight: 700 }}>Weekend ₹{villa.weekendPrice.toLocaleString()} / night</div>
                    ) : (
                      <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>1 night, 2 adults</div>
                    )}
                  </div>
                  <button
                    style={{
                      background: "#4338ca", color: "#fff",
                      border: "none", padding: "10px 22px",
                      borderRadius: 10, fontWeight: 700,
                      fontSize: "0.88rem", cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#3730a3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#4338ca")}
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </div>
          ))}
          {allVillas.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "40px 24px", textAlign: "center" }}>
              {villasLoading ? (
                <p style={{ color: "#6b7280", margin: 0 }}>Loading villas…</p>
              ) : (
                <>
                  <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1e1b4b", marginBottom: 8 }}>Villas coming soon</h3>
                  <p style={{ color: "#374151", fontSize: "0.92rem", marginBottom: 16 }}>
                    WhatsApp us on 98561 12727 for villa bookings and availability.
                  </p>
                  <a
                    href={waUrl("Hi! I'm interested in booking a villa.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", background: "#25d366", color: "#fff", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}
                  >
                    WhatsApp us
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {/* SEO footer */}
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: "28px 32px", marginTop: 48, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontWeight: 700, color: "#1e1b4b", marginBottom: 10 }}>Best Villa Rentals Near Pune</h2>
          <p style={{ color: "#374151", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: 16 }}>
            Gadvede Trekkers offers curated villa rentals near Pune — from lakefront farmhouses to forest retreats
            and luxury pool villas. Whether you're planning a family vacation, couple getaway, or group outing, our
            handpicked villas offer the perfect escape from city life. All properties include free WiFi, parking, and
            direct booking support via WhatsApp.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Villa Near Pune", "Private Pool Villa", "Pet Friendly Villa", "Farmhouse Near Pune", "Weekend Villa Rental", "Luxury Villa Pune", "Budget Villa Pune"].map((tag) => (
              <span key={tag} style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedVilla && <VillaDetail villa={selectedVilla} onClose={() => setSelectedVilla(null)} />}

      <style>{`
        @media (max-width: 640px) {
          .villa-card-row {
            grid-template-columns: 1fr !important;
          }
          .villa-card-row img {
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}
