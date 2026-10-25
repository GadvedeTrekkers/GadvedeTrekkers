import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";

const RENTAL_PREVIEW_KEY = "gt_rental_preview";

/* ─── Full catalogue (same as Rental.jsx — shared source of truth) ─── */
const catalogue = [
  {
    id: "coleman-sundome-4p",
    name: "Coleman Sundome 4 Person Tent",
    category: "Tents",
    location: "Pune & Mumbai",
    rating: 4.8,
    reviews: 134,
    deposit: 1500,
    availability: "Available",
    badge: "Most Rented",
    pricePerDay: 350,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 350 },
      { period: "7 Days",  rentPerDay: 200 },
      { period: "15 Days", rentPerDay: 150 },
      { period: "20 Days", rentPerDay: 120 },
    ],
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
    ],
    description: "The Coleman Sundome 4 Person Tent is built with WeatherTec system — patented welded floors and inverted seams to keep water out. Features a large door for easy in-and-out access, two windows for ventilation, and a powerful center height of 4 feet 11 inches. Setup takes approximately 10 minutes.",
    specifications: [
      { label: "Capacity",       value: "4 Person" },
      { label: "Dimensions",    value: "9 x 7 ft (2.7 x 2.1 m)" },
      { label: "Center Height", value: "4 ft 11 in (1.5 m)" },
      { label: "Weight",        value: "7.28 kg" },
      { label: "Doors",         value: "1 large door" },
      { label: "Windows",       value: "2 windows" },
      { label: "Material",      value: "Polyester fly, polyethylene floor" },
      { label: "Setup Time",    value: "~10 minutes" },
      { label: "Season",        value: "3 Season" },
      { label: "Packed Size",   value: "61 x 15 cm" },
    ],
  },
  {
    id: "2p-camping-tent",
    name: "2 Person Camping Tent",
    category: "Tents",
    location: "Pune",
    rating: 4.7,
    reviews: 98,
    deposit: 800,
    availability: "Available",
    badge: null,
    pricePerDay: 199,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 199 },
      { period: "7 Days",  rentPerDay: 120 },
      { period: "15 Days", rentPerDay: 90  },
      { period: "20 Days", rentPerDay: 75  },
    ],
    images: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Lightweight 2-person tent with easy setup. Ideal for couples and solo trekkers who want a comfortable night under the stars without carrying heavy gear.",
    specifications: [
      { label: "Capacity",    value: "2 Person" },
      { label: "Dimensions",  value: "7 x 5 ft" },
      { label: "Weight",      value: "2.8 kg" },
      { label: "Material",    value: "190T polyester" },
      { label: "Season",      value: "3 Season" },
    ],
  },
  {
    id: "event-shelter",
    name: "Coleman Event Shelter UV & Water Protected",
    category: "Tents",
    location: "Pune & Mumbai",
    rating: 4.6,
    reviews: 67,
    deposit: 2000,
    availability: "Available",
    badge: "Group Pick",
    pricePerDay: 3000,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 3000 },
      { period: "7 Days",  rentPerDay: 714  },
      { period: "15 Days", rentPerDay: 366  },
      { period: "20 Days", rentPerDay: 300  },
    ],
    images: [
      "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Large event shelter with UV 50+ protection and water resistance. Perfect for group camping events, outdoor gatherings, and team-building activities.",
    specifications: [
      { label: "Size",         value: "3.6 x 3.6 m" },
      { label: "UV Rating",   value: "UPF 50+" },
      { label: "Material",    value: "Polyester 150D" },
      { label: "Weight",      value: "18 kg" },
      { label: "Capacity",    value: "Up to 20 people" },
    ],
  },
  {
    id: "sleeping-bag",
    name: "Sleeping Bag — Mummy Style",
    category: "Gear",
    location: "Pune",
    rating: 4.6,
    reviews: 88,
    deposit: 500,
    availability: "Available",
    badge: null,
    pricePerDay: 149,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 149 },
      { period: "7 Days",  rentPerDay: 90  },
      { period: "15 Days", rentPerDay: 60  },
      { period: "20 Days", rentPerDay: 45  },
    ],
    images: [
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Warm mummy-style sleeping bag rated to 5°C. Lightweight and compact for backpacking.",
    specifications: [
      { label: "Temperature Rating", value: "5°C comfort" },
      { label: "Weight",             value: "1.2 kg" },
      { label: "Material",           value: "Hollow fibre fill" },
    ],
  },
  {
    id: "rucksack-60l",
    name: "Rucksack 60L",
    category: "Gear",
    location: "Pune",
    rating: 4.8,
    reviews: 115,
    deposit: 700,
    availability: "Available",
    badge: "Top Rated",
    pricePerDay: 249,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 249 },
      { period: "7 Days",  rentPerDay: 150 },
      { period: "15 Days", rentPerDay: 100 },
      { period: "20 Days", rentPerDay: 80  },
    ],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Spacious 60L trekking rucksack with rain cover. Ergonomic back support for long hauls.",
    specifications: [
      { label: "Volume",    value: "60L" },
      { label: "Weight",    value: "1.8 kg" },
      { label: "Material",  value: "Ripstop nylon" },
      { label: "Rain Cover", value: "Included" },
    ],
  },
  {
    id: "barbeque-grill",
    name: "Prestige Barbeque Grill",
    category: "Gear",
    location: "Pune & Mumbai",
    rating: 4.7,
    reviews: 74,
    deposit: 600,
    availability: "Available",
    badge: null,
    pricePerDay: 500,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 500 },
      { period: "7 Days",  rentPerDay: 92  },
      { period: "15 Days", rentPerDay: 46  },
      { period: "20 Days", rentPerDay: 37  },
    ],
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Portable charcoal barbeque grill — perfect for camping cookouts and bonfire nights.",
    specifications: [
      { label: "Type",     value: "Charcoal" },
      { label: "Size",     value: "45 x 30 cm grill area" },
      { label: "Weight",   value: "4.5 kg" },
    ],
  },
  {
    id: "shower-cubicle",
    name: "2 Seconds Camping Shower Cubicle",
    category: "Gear",
    location: "Pune",
    rating: 4.4,
    reviews: 42,
    deposit: 400,
    availability: "Available",
    badge: null,
    pricePerDay: 500,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 500 },
      { period: "7 Days",  rentPerDay: 100 },
      { period: "15 Days", rentPerDay: 60  },
      { period: "20 Days", rentPerDay: 50  },
    ],
    images: [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Instant pop-up shower cubicle / changing tent. Sets up in 2 seconds — perfect for multi-day camps.",
    specifications: [
      { label: "Setup Time",  value: "2 seconds" },
      { label: "Height",      value: "190 cm" },
      { label: "Floor",       value: "Waterproof base" },
    ],
  },
  {
    id: "hammock-chair",
    name: "SkyFloat Foldable Hammock Chair",
    category: "Gear",
    location: "Pune & Mumbai",
    rating: 4.5,
    reviews: 59,
    deposit: 350,
    availability: "Available",
    badge: null,
    pricePerDay: 400,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 400 },
      { period: "7 Days",  rentPerDay: 100 },
      { period: "15 Days", rentPerDay: 60  },
      { period: "20 Days", rentPerDay: 45  },
    ],
    images: [
      "https://images.unsplash.com/photo-1520454974749-611f78e3c949?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Lightweight foldable hammock chair for relaxing at camp. Easy to hang between trees.",
    specifications: [
      { label: "Load Capacity", value: "120 kg" },
      { label: "Weight",        value: "0.9 kg" },
      { label: "Material",      value: "Parachute nylon" },
    ],
  },
  {
    id: "trekking-poles",
    name: "Trekking Poles (Pair)",
    category: "Gear",
    location: "Pune",
    rating: 4.7,
    reviews: 103,
    deposit: 300,
    availability: "Available",
    badge: null,
    pricePerDay: 120,
    pricingTiers: [
      { period: "1 Day",   rentPerDay: 120 },
      { period: "7 Days",  rentPerDay: 70  },
      { period: "15 Days", rentPerDay: 50  },
      { period: "20 Days", rentPerDay: 40  },
    ],
    images: [
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80",
    ],
    description: "Adjustable aluminium trekking poles with anti-shock mechanism. A must for rocky trails.",
    specifications: [
      { label: "Material",       value: "Aluminium 7075" },
      { label: "Weight",         value: "280g per pole" },
      { label: "Adjustable",     value: "58–135 cm" },
      { label: "Anti-shock",     value: "Yes" },
    ],
  },
];

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

  const adminItem =
    id !== "preview"
      ? getAdminItems("gt_rentals")
          .map(normaliseItem)
          .find((entry) => entry.id === id)
      : null;

  /* resolve item — from route state or catalogue lookup */
  const item =
    previewItem ||
    location.state?.item ||
    adminItem ||
    catalogue.find((c) => c.id === id);

  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  if (!item) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏕</div>
        <h3 style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>Rental item not found</h3>
        <Link to="/rentals" style={{ background: "#059669", color: "#fff", padding: "10px 24px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>
          ← Back to Rentals
        </Link>
      </div>
    );
  }

  const images = item.images || [item.image];
  const relatedPool = [
    ...catalogue,
    ...getAdminItems("gt_rentals").map(normaliseItem),
  ];
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
              <span style={{ fontSize: "0.9rem", color: "#374151" }}>⭐ {item.rating}</span>
              <span style={{ color: "#9ca3af", fontSize: "0.82rem" }}>({item.reviews} reviews)</span>
              <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.82rem" }}>📍 {item.location}</span>
            </div>

            {/* Trust badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[
                { icon: "⚡", text: "Block in 2 minutes" },
                { icon: "💳", text: "No payment required now" },
                { icon: "🚚", text: "Pay on delivery available*" },
                { icon: "↩️", text: "Easy cancellation policy" },
              ].map((b) => (
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
              { key: "reviews", label: `Reviews (${item.reviews})` },
            ].map((tab) => (
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

            {activeTab === "reviews" && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111827" }}>{item.rating}</div>
                <div style={{ fontSize: "0.88rem", marginBottom: 20 }}>Based on {item.reviews} reviews</div>
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
                    to={`/rentals/${rel.id}`}
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
