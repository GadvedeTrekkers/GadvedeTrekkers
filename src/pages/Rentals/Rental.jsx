import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig";

/* ─── Rental catalogue ─── */
const rentalItems = [
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
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
    description: "Spacious 4-person dome tent with WeatherTec system. Perfect for family camping and group treks.",
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
    image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80",
    description: "Lightweight 2-person tent with easy setup. Ideal for couples and solo trekkers.",
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
    image: "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=800&q=80",
    description: "Large event shelter with UV and water protection. Perfect for group camping events and outdoor gatherings.",
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
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80",
    description: "Warm mummy-style sleeping bag rated to 5°C. Lightweight and compact for backpacking.",
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
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    description: "Spacious 60L trekking rucksack with rain cover. Ergonomic back support for long hauls.",
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
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    description: "Portable charcoal barbeque grill — perfect for camping cookouts and bonfire nights.",
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
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
    description: "Instant pop-up shower cubicle / changing tent. Sets up in 2 seconds, perfect for multi-day camps.",
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
    image: "https://images.unsplash.com/photo-1520454974749-611f78e3c949?auto=format&fit=crop&w=800&q=80",
    description: "Lightweight foldable hammock chair for relaxing at camp. Easy to hang between trees.",
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
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    description: "Adjustable aluminium trekking poles with anti-shock mechanism. A must for rocky trails.",
  },
];

const CATEGORIES = ["All", "Tents", "Gear", "Villas"];

export default function Rental() {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(
    location.state?.category || "All"
  );

  const [, setSyncKey] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Rent Camping & Trekking Gear | Gadvede Trekkers";
    // Sync from backend so admin changes reflect on all devices
    syncProductsFromApi("rental", "gt_rentals")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});
  }, []);

  const _rawRentals = getAdminItems("gt_rentals");
  const adminRentals = _rawRentals.filter((r) => r.active !== false).map(normaliseItem);
  const baseRentals = _rawRentals.length > 0 ? adminRentals : rentalItems;
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
            Why buy when you can rent? Get premium camping tents, sleeping bags, rucksacks, and more — available in Pune &amp; Mumbai. Block your gear in 2 minutes. No payment required now. Pay on delivery available.
          </p>

          {/* Trust badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              { icon: "⚡", text: "Block in 2 minutes" },
              { icon: "💳", text: "No payment required now" },
              { icon: "🚚", text: "Pay on delivery" },
              { icon: "↩️", text: "Easy cancellation" },
            ].map((b) => (
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
                <p style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 10 }}>
                  ⭐ {item.rating} <span style={{ color: "#9ca3af" }}>({item.reviews} reviews)</span>
                </p>
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
                      to={`/rentals/${item.id}`}
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
              { step: "1", icon: "📅", title: "Choose Dates", desc: "Pick your rental start and end dates. Block instantly — no payment required now." },
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
