import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { uniqueTreks, slugifyTrekName } from "../data/treks";
import { campingList } from "../data/campingData";
import { rentalsList } from "../data/rentalsData";
import { isHeritageEnabled } from "../data/featureFlags";
import { ivDestinations as _ivDestinations } from "../data/industrialVisitsData";
import EnquiryModal from "../components/EnquiryModal";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import { getAdminItems, normaliseItem, saveAdminItems } from "../data/adminStorage";
import BookingCTA from "../components/BookingCTA";
import { syncProductsFromApi } from "../api/getAll";

const CAMPING_ROUTE_BY_NAME = {
  "Alibaug Camping | Music | Barbecue | Bonfire": "alibaug-camping",
  "Pawna Lake Camping 2026": "pawna-lake-camping",
  "Igatpuri Secret Camping and Water Sports": "igatpuri-camping",
  "Bhandardara Lake Camping": "bhandardara-camping",
  "Stargazing Camping Dehene Asangaon": "stargazing-camping",
  "Panshet Dam Camping | Camping near Pune": "panshet-camping",
  "Kalsubai Camping from Kasara": "kalsubai-camping",
  "Revdanda Beach Camping": "revdanda-camping",
  "Rajmachi Camping | Treks and Trails India": "rajmachi-camping",
};

// ─── Active treks (respects Live/Off status from admin panel) ─────────────────
function parseGalleryHome(value, fallback) {
  try {
    const parsed = JSON.parse(value || "[]").filter(Boolean);
    return parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function buildActiveTreks() {
  const stored = getAdminItems("gt_treks");
  const source = stored.length > 0 ? stored : uniqueTreks;
  return source
    .filter((t) => t.active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
    .map((t) => {
      const fallbackGallery = [t.image, t.image, t.image].filter(Boolean);
      const gallery = parseGalleryHome(t.imageGallery, fallbackGallery);
      return {
        ...normaliseItem(t),
        slug: t.slug || slugifyTrekName(t.name),
        image: gallery[0] || t.image,
        gallery,
        seasonalTag: t.seasonalTag || "",
      };
    });
}

// ─── Itinerary PDF download for home cards ────────────────────────────────────
function downloadTrekPdf(trek) {
  const parseLines = (v = "") => String(v).split("\n").map((s) => s.trim()).filter(Boolean);
  const name = trek.name || "Trek";

  const highlightItems = parseLines(trek.highlights).map((h) => `<li style="background:#f0fdf4;border:1px solid #d5f6e4;border-radius:6px;padding:7px 12px;font-size:.87rem">${h}</li>`).join("");
  const incList = parseLines(trek.included).map((i) => `<li>✅ ${i}</li>`).join("");
  const excList = parseLines(trek.notIncluded).map((i) => `<li>❌ ${i}</li>`).join("");
  const carryList = parseLines(trek.thingsToCarry).map((i) => `<li style="background:#f6fbf8;border:1px solid #e3efe8;border-radius:6px;padding:6px 10px;font-size:.84rem">${i}</li>`).join("");
  const about = trek.about || "";

  // ── Build schedule HTML from departurePlans (JSON) or legacy itinerary (pipe-delimited) ──
  let scheduleHtml = "";
  try {
    const plans = JSON.parse(trek.departurePlans || "{}");
    const entries = Object.entries(plans).filter(([, p]) => p && String(p.itinerary || "").trim());
    if (entries.length > 0) {
      scheduleHtml = entries.map(([city, plan]) => {
        const price = plan.price ? ` — ₹${plan.price}/person` : "";
        const dayMap = {};
        String(plan.itinerary || "").split("\n").map((l) => l.trim()).filter(Boolean).forEach((line) => {
          const parts = line.split("|").map((p) => p.trim());
          const day = parts[0] || "Day";
          const time = parts[1] || "";
          const desc = parts[2] || parts[1] || "";
          if (!dayMap[day]) dayMap[day] = [];
          dayMap[day].push({ time: parts.length >= 3 ? time : "", desc: parts.length >= 3 ? desc : (parts[1] || "") });
        });
        const daysHtml = Object.entries(dayMap).map(([day, events]) =>
          `<div style="background:#d5f6e4;border-left:5px solid #0a8456;padding:8px 12px;font-weight:800;border-radius:6px;margin:10px 0 4px;font-size:.88rem">${day}</div>` +
          events.map((ev) => `<div style="display:flex;gap:14px;padding:4px 2px;border-bottom:1px solid #eef4f0;font-size:.85rem"><span style="color:#0a6a47;font-weight:700;min-width:90px;flex-shrink:0">${ev.time}</span><span>${ev.desc}</span></div>`).join("")
        ).join("");
        return `<h3 style="color:#065f46;font-size:.9rem;margin-top:18px;margin-bottom:4px">📍 ${city}${price}</h3>${daysHtml}`;
      }).join("<br>");
    }
  } catch {/* ignore */}

  // Fallback to legacy pipe-delimited itinerary: City|Day N|Time|Activity
  if (!scheduleHtml) {
    const lines = parseLines(trek.itinerary);
    if (lines.length > 0) {
      const cityMap = {};
      lines.forEach((line) => {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 2) return;
        const city = parts[0];
        const day = parts[1];
        const time = parts.length >= 4 ? parts[2] : "";
        const desc = parts.length >= 4 ? parts[3] : (parts[2] || "");
        if (!cityMap[city]) cityMap[city] = {};
        if (!cityMap[city][day]) cityMap[city][day] = [];
        cityMap[city][day].push({ time, desc });
      });
      scheduleHtml = Object.entries(cityMap).map(([city, days]) => {
        const daysHtml = Object.entries(days).map(([day, events]) =>
          `<div style="background:#d5f6e4;border-left:5px solid #0a8456;padding:8px 12px;font-weight:800;border-radius:6px;margin:10px 0 4px;font-size:.88rem">${day}</div>` +
          events.map((ev) => `<div style="display:flex;gap:14px;padding:4px 2px;border-bottom:1px solid #eef4f0;font-size:.85rem"><span style="color:#0a6a47;font-weight:700;min-width:90px;flex-shrink:0">${ev.time}</span><span>${ev.desc}</span></div>`).join("")
        ).join("");
        return `<h3 style="color:#065f46;font-size:.9rem;margin-top:18px;margin-bottom:4px">📍 ${city}</h3>${daysHtml}`;
      }).join("<br>");
    }
  }

  const css = `body{font-family:Arial,sans-serif;max-width:820px;margin:0 auto;padding:32px;color:#1a1a1a}h1{color:#0a6a47;font-size:1.9rem}h2{color:#0a6a47;font-size:.93rem;text-transform:uppercase;letter-spacing:.07em;border-bottom:2px solid #d5f6e4;padding-bottom:5px;margin-top:26px}hr{border:none;border-top:2px solid #d5f6e4;margin:18px 0}ul{padding-left:20px;line-height:2}.hl{display:grid;grid-template-columns:1fr 1fr;gap:6px;list-style:none;padding-left:0}.ig{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}.cg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 16px;list-style:none;padding-left:0}@media print{body{padding:16px}}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name} — Trek Details</title><style>${css}</style></head><body>
    <p style="color:#6b7280;font-size:.8rem;margin-bottom:4px">Gadvede Trekkers · gadvedetrekkers.com</p>
    <h1>${name}</h1>
    <p style="color:#4b5563;margin-top:4px">${[trek.difficulty, trek.duration, trek.altitude, trek.location].filter(Boolean).join(" &nbsp;·&nbsp; ")}</p>
    <p style="color:#0a6a47;font-weight:700;font-size:1.05rem">From ₹${trek.price || ""} per person</p>
    <hr>
    ${about ? `<h2>About</h2><p style="line-height:1.75;color:#374151">${about}</p>` : ""}
    ${highlightItems ? `<h2>Trek Highlights</h2><ul class="hl">${highlightItems}</ul>` : ""}
    ${scheduleHtml ? `<hr><h2>Trek Schedule / Itinerary</h2>${scheduleHtml}` : ""}
    ${(incList || excList) ? `<hr><h2>Inclusions &amp; Exclusions</h2><div class="ig"><div><h3 style="color:#065f46">Included</h3><ul>${incList}</ul></div><div><h3 style="color:#065f46">Not Included</h3><ul>${excList}</ul></div></div>` : ""}
    ${carryList ? `<hr><h2>Things to Carry</h2><ul class="cg">${carryList}</ul>` : ""}
    <hr><p style="color:#888;font-size:.78rem;margin-top:20px">Generated by Gadvede Trekkers · gadvedetrekkers.com · ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
    <script>window.onload=()=>{window.print()}</script></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── HomeTrekCard ─────────────────────────────────────────────────────────────
function HomeTrekCard({ trek }) {
  const [imgIdx, setImgIdx] = useState(0);
  const intervalRef = useRef(null);
  const images = trek.gallery.slice(0, 3);
  const discountPct = Math.round(
    ((trek.originalPrice - trek.price) / trek.originalPrice) * 100
  );
  const isPopular = trek.reviews >= 200;

  const handleMouseEnter = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setImgIdx((prev) => (prev + 1) % images.length);
    }, 800);
  };

  const handleMouseLeave = () => {
    clearInterval(intervalRef.current);
    setImgIdx(0);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <article
      className="trek-card ht-trek-card"
      data-difficulty={trek.difficulty}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ height: "100%" }}
    >
      <div className="trek-card-media">
        <span className="trek-season-tag">{trek.seasonalTag}</span>
        {discountPct > 0 && (
          <span className="trek-discount-badge">{discountPct}% OFF</span>
        )}
        {isPopular && (
          <span className="trek-popular-badge">🔥 Popular</span>
        )}
        <div className="trek-gallery">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${trek.name} - view ${i + 1}`}
              className="trek-gallery-image"
              style={{
                opacity: i === imgIdx ? 1 : 0,
                transform: i === imgIdx ? "scale(1.05)" : "scale(1.02)",
                transition: "opacity 0.5s ease, transform 0.6s ease",
              }}
              loading="lazy"
            />
          ))}
        </div>
        <div className="trek-gallery-dots" aria-hidden="true">
          {images.map((_, i) => (
            <span
              key={i}
              className="trek-gallery-dot"
              style={{
                background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.5)",
                transform: i === imgIdx ? "scale(1.35)" : "scale(1)",
                transition: "transform 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
        <div className="trek-card-overlay">
          <BookingCTA
            trek={trek}
            className="trek-overlay-btn trek-overlay-book"
            label="Book on WhatsApp"
          />
          <Link
            to={`/treks/${slugifyTrekName(trek.name)}`}
            className="trek-overlay-btn trek-overlay-details"
            tabIndex="-1"
            aria-hidden="true"
          >
            Details
          </Link>
        </div>
      </div>

      <div className="trek-card-body">
        <div className="trek-card-topline">
          <div>
            <h2 className="trek-card-title">{trek.name}</h2>
            <p className="trek-location">📍 {trek.location}</p>
          </div>
          <div className="trek-rating">
            <span className="trek-rating-star" aria-hidden="true">★</span>
            <span>{trek.rating.toFixed(1)}</span>
            <span className="trek-rating-count">({trek.reviews})</span>
          </div>
        </div>

        <div className="trek-chip-row">
          <span
            className={`trek-chip ${
              trek.difficulty === "Easy"
                ? "chip-easy"
                : trek.difficulty === "Medium"
                ? "chip-medium"
                : "chip-hard"
            }`}
          >
            {trek.difficulty}
          </span>
          <span className="trek-chip chip-neutral">⏱ {trek.duration}</span>
          <span className="trek-chip chip-neutral">🏔 {trek.altitude}</span>
        </div>

        <div className="trek-pricing">
          <span className="trek-original-price">₹{trek.originalPrice}</span>
          <span className="trek-current-price">₹{trek.price}</span>
          <span className="trek-starting-text">per person</span>
        </div>

        <div className="trek-next-date">
          <span className="trek-next-label">📅 Next</span>
          <span>{trek.nextDate}</span>
        </div>

        <div className="trek-card-actions">
          <BookingCTA trek={trek} className="btn trek-primary-btn" label="Book on WhatsApp" />
          <Link
            to={`/treks/${slugifyTrekName(trek.name)}`}
            className="btn trek-secondary-btn"
          >
            View Details
          </Link>
          <button
            type="button"
            className="btn trek-secondary-btn"
            style={{ padding: "0 12px", minWidth: 0, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}
            title="Download Itinerary PDF"
            onClick={(e) => { e.preventDefault(); downloadTrekPdf(trek); }}
          >
            ⬇️ PDF
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Tour Categories (home section) ──────────────────────────────────────────
const TOUR_CATEGORIES = [
  {
    region: "himachal", label: "Himachal Tours", icon: "🏔️",
    subtitle: "Manali · Kasol · Spiti · Jibhi",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    region: "kashmir", label: "Kashmir & Leh Tours", icon: "🌷",
    subtitle: "Srinagar · Gulmarg · Pahalgam · Leh",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
  {
    region: "northeast", label: "NorthEast Tours", icon: "🌿",
    subtitle: "Meghalaya · Sikkim · Kaziranga",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  },
  {
    region: "rajasthan", label: "Rajasthan Tours", icon: "🏰",
    subtitle: "Jaipur · Jodhpur · Jaisalmer · Udaipur",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
  },
  {
    region: "kerala", label: "Kerala Tours", icon: "🌴",
    subtitle: "Munnar · Thekkady · Alleppey · Kochi",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
  },
  {
    region: "uttarakhand", label: "Uttarakhand Tours", icon: "⛪",
    subtitle: "Kedarnath · Badrinath · Char Dham",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
  },
  {
    region: "goa", label: "Goa Tours", icon: "🏖️",
    subtitle: "Beaches · Backpacking · Party Capital",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
  },
  {
    region: "maharashtra", label: "Maharashtra Tours", icon: "🌊",
    subtitle: "Malvan · Tarkarli · Scuba Diving",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
  },
  {
    region: "karnataka", label: "Karnataka Tours", icon: "🏛️",
    subtitle: "Hampi · Gokarna · Murdeshwar",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80",
  },
];

function TourCategoryCard({ cat }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="col-6 col-md-4 col-lg-4">
      <div
        onClick={() => navigate("/tours", { state: { region: cat.region } })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          cursor: "pointer", aspectRatio: "4/3",
          boxShadow: hovered ? "0 16px 42px rgba(0,0,0,0.28)" : "0 4px 16px rgba(0,0,0,0.12)",
          transform: hovered ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
          transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <img
          src={cat.image}
          alt={cat.label}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: hovered
            ? "linear-gradient(160deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.7) 100%)"
            : "linear-gradient(160deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.58) 100%)",
          transition: "background 0.3s ease",
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          justifyContent: "flex-end", padding: "14px 16px",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{cat.icon}</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(0.85rem,2.2vw,1rem)", lineHeight: 1.25, marginBottom: 3 }}>
            {cat.label}
          </div>
          <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.72rem", fontWeight: 500, letterSpacing: 0.3 }}>
            {cat.subtitle}
          </div>
          {hovered && (
            <div style={{
              marginTop: 10, background: "#16a34a", color: "#fff",
              borderRadius: 999, padding: "5px 14px", fontSize: "0.74rem",
              fontWeight: 700, display: "inline-block", width: "fit-content",
            }}>
              Explore →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IVDestCard ───────────────────────────────────────────────────────────────
function IVDestCard({ dest, idx, onEnquire }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: hovered ? "0 20px 48px rgba(29,78,216,0.16)" : "0 2px 14px rgba(0,0,0,0.07)",
        border: `1.5px solid ${hovered ? "#93c5fd" : "#e5e7eb"}`,
        transform: hovered ? "translateY(-8px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        animationDelay: `${idx * 0.08}s`,
        animationFillMode: "both",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 2×2 image grid with zoom on hover */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, height: 180, overflow: "hidden", position: "relative" }}>
        {(dest.images || []).slice(0, 4).map((img, i) => (
          <div key={i} style={{ overflow: "hidden", position: "relative" }}>
            <img
              src={img.src}
              alt={img.caption}
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                transform: hovered ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.5s ease",
              }}
            />
          </div>
        ))}
        {/* duration badge overlay */}
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 2,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          color: "#fff", borderRadius: 8, padding: "3px 10px",
          fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.5,
        }}>
          ⏱ {dest.duration}
        </div>
      </div>

      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "0.7rem", color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
          {dest.subtitle}
        </div>
        <h6 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827", marginBottom: 8, lineHeight: 1.35 }}>
          {dest.icon} {dest.title}
        </h6>

        {/* Best For badge */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ background: "#f0fdf4", color: "#065f46", border: "1px solid #bbf7d0", borderRadius: 20, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 600 }}>
            🎓 {dest.bestFor.split("&")[0].trim()}
          </span>
        </div>

        {/* Highlights */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", flex: 1 }}>
          {(dest.highlights || []).slice(0, 3).map((h) => (
            <li key={h} style={{ fontSize: "0.78rem", color: "#374151", marginBottom: 5, display: "flex", gap: 7, alignItems: "flex-start" }}>
              <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✔</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onEnquire}
          style={{
            display: "block", width: "100%",
            background: hovered ? "linear-gradient(135deg,#1e40af,#2563eb)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            color: "#fff", border: "none", textAlign: "center",
            padding: "10px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700,
            cursor: "pointer", letterSpacing: 0.3,
            boxShadow: hovered ? "0 6px 18px rgba(29,78,216,0.35)" : "0 2px 8px rgba(29,78,216,0.2)",
            transition: "all 0.25s ease",
          }}
        >
          Enquire Now →
        </button>
      </div>
    </div>
  );
}

function SlidingCards({ items, visibleCount = 3, interval = 4200, renderCard }) {
  const [index, setIndex] = useState(visibleCount);
  const [transition, setTransition] = useState(true);

  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    if (safeItems.length <= visibleCount) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, safeItems.length, visibleCount]);

  useEffect(() => {
    setIndex(visibleCount);
    setTransition(true);
  }, [safeItems.length, visibleCount]);

  if (safeItems.length === 0) {
    return null;
  }

  if (safeItems.length <= visibleCount) {
    return (
      <div className="row g-4">
        {safeItems.map((item, itemIndex) => (
          <div className={`col-12 col-md-${12 / visibleCount}`} key={item.id || item.name || itemIndex}>
            {renderCard(item, itemIndex)}
          </div>
        ))}
      </div>
    );
  }

  const extended = [
    ...safeItems.slice(-visibleCount),
    ...safeItems,
    ...safeItems.slice(0, visibleCount),
  ];

  const next = () => setIndex((prev) => prev + 1);
  const prev = () => setIndex((prev) => prev - 1);

  const handleTransitionEnd = () => {
    if (index >= safeItems.length + visibleCount) {
      setTransition(false);
      setIndex(visibleCount);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransition(true)));
    } else if (index < visibleCount) {
      setTransition(false);
      setIndex(safeItems.length + visibleCount - 1);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransition(true)));
    }
  };

  return (
    <div className="trek-slider-container">
      <button className="trek-slider-btn left" onClick={prev} aria-label="Previous">❮</button>
      <div className="trek-slider-wrapper">
        <div
          className="trek-slider-track"
          style={{
            transform: `translateX(-${index * (100 / visibleCount)}%)`,
            transition: transition ? "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extended.map((item, itemIndex) => (
            <div className="trek-slide" key={`${item.id || item.name || "item"}-${itemIndex}`}>
              {renderCard(item, itemIndex)}
            </div>
          ))}
        </div>
      </div>
      <button className="trek-slider-btn right" onClick={next} aria-label="Next">❯</button>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  const CPP = 4;
  const [loadedCount, setLoadedCount] = useState(CPP);
  const [page, setPage]               = useState(0);
  const [slideAnim, setSlideAnim]     = useState("");
  const [enquiryDest, setEnquiryDest] = useState(null);
  const gridRef = useRef(null);
  const [, setSyncKey] = useState(0);
  const [activeTreks, setActiveTreks] = useState(() => buildActiveTreks());
  const [treksLoading, setTreksLoading] = useState(() => buildActiveTreks().length === 0);

  // Sync all categories from backend so Live/Off status is cross-device
  useEffect(() => {
    syncProductsFromApi("trek", "gt_treks")
      .then((items) => { if (items) setActiveTreks(buildActiveTreks()); })
      .catch(() => {})
      .finally(() => setTreksLoading(false));
    syncProductsFromApi("camping", "gt_camping")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});
    syncProductsFromApi("rental", "gt_rentals")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});

    const onStorage = () => {
      setActiveTreks(buildActiveTreks());
      setSyncKey((k) => k + 1);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("gt:storage-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("gt:storage-updated", onStorage);
    };
  }, []);

  const loadedTreks  = activeTreks.slice(0, loadedCount);
  const totalPages   = Math.ceil(loadedCount / CPP);
  const visibleTreks = loadedTreks.slice(page * CPP, (page + 1) * CPP);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const hasMore = loadedCount < activeTreks.length;

  const animateAndGo = useCallback((dir, cb) => {
    setSlideAnim(dir === "next" ? "ht-slide-out-left" : "ht-slide-out-right");
    setTimeout(() => {
      cb();
      setSlideAnim(dir === "next" ? "ht-slide-in-right" : "ht-slide-in-left");
      setTimeout(() => setSlideAnim(""), 320);
    }, 260);
  }, []);

  const goNext = () => { if (!canNext) return; animateAndGo("next", () => setPage((p) => p + 1)); };
  const goPrev = () => { if (!canPrev) return; animateAndGo("prev", () => setPage((p) => p - 1)); };

  const loadMore = () => {
    const newCount = Math.min(loadedCount + CPP, activeTreks.length);
    setLoadedCount(newCount);
    setPage(Math.floor(loadedCount / CPP));
  };

  const arrowStyle = (side) => ({
    position: "absolute",
    [side]: "-18px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 10,
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#fff",
    border: "none",
    boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
    fontSize: "1.4rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#198754",
    transition: "box-shadow 0.2s ease",
  });

  const services = [
    {
      icon: "🥾",
      title: "Trekking",
      desc: "Join weekend treks, monsoon treks, and winter treks from Pune and Mumbai with expert guidance, safety, and affordable pricing.",
      link: "/treks",
    },
    {
      icon: "⛺",
      title: "Camping & Adventure",
      desc: "Experience camping near Pune and Mumbai with scenic locations, tents, and exciting outdoor activities for individuals and groups.",
      link: "/camping",
    },
    {
      icon: "🏢",
      title: "Corporate & Team Outings",
      desc: "We organize corporate treks, team outings, day outings, and team building activities designed for fun, bonding, and adventure.",
      link: "/corporate",
    },
    {
      icon: "🎒",
      title: "School / College / Industrial Visits",
      desc: "We conduct school trips, college tours, and industrial visits with safe, engaging, and well-planned experiences.",
      link: "/corporate",
    },
    ...(isHeritageEnabled() ? [{
      icon: "🏛️",
      title: "Heritage Walks",
      desc: "Explore history through curated heritage walks that showcase forts, culture, and local experiences.",
      link: "/heritage",
    }] : []),
    {
      icon: "🏡",
      title: "Villa Rental",
      desc: "Book villas on rent in Lonavala, Alibag, Dapoli, and Karjat for group stays and weekend getaways.",
      link: "/rentals",
    },
    {
      icon: "🏕️",
      title: "Tent Rental",
      desc: "Get tents on rent in Pune for trekking, camping, and outdoor adventures.",
      link: "/rentals",
    },
  ];

  // Camping — admin-first: only show active admin items; fall back to campingList if admin is empty
  const _adminCampsRaw = getAdminItems("gt_camping");
  const _activeCamps = _adminCampsRaw.length > 0
    ? _adminCampsRaw.filter((c) => c.active !== false).map(normaliseItem)
    : campingList;
  const campsiteCards = _activeCamps.slice(0, 8).map((camp) => ({
    id: camp.slug || CAMPING_ROUTE_BY_NAME[camp.name] || null,
    name: camp.shortName || camp.name,
    price: `Starting ₹${camp.price}`,
    img: camp.image,
    location: camp.location,
  })).filter((c) => c.img);

  // Rentals — admin-first: only show active admin items; fall back to rentalsList if admin is empty
  const _adminRentalsRaw = getAdminItems("gt_rentals");
  const _activeRentals = _adminRentalsRaw.length > 0
    ? _adminRentalsRaw.filter((item) => item.active !== false).map(normaliseItem)
    : rentalsList;
  const tentRentalCards = _activeRentals
    .filter((item) => (item.category || "").toLowerCase() === "tents" && item.image)
    .slice(0, 8)
    .map((item, idx) => ({
      id: item.id || `tent-rental-${idx}`,
      name: item.name,
      price: `Starting ₹${Number(item.price || item.pricePerDay || 0).toLocaleString("en-IN")}/day`,
      img: item.image,
      location: item.location,
      item,
    }));

  const _storedIV = getAdminItems("gt_iv");
  const ivDestinations = _storedIV.length > 0
    ? _storedIV.filter((d) => d.active !== false).map((d) => {
        let images = [];
        try { images = JSON.parse(d.imageGallery || "[]").filter(Boolean).map((url) => ({ src: url, caption: "" })); } catch { images = []; }
        const highlights = String(d.highlights || "").split("\n").map((s) => s.trim()).filter(Boolean);
        return { ...normaliseItem(d), images, highlights };
      })
    : _ivDestinations;

  return (
    <>
      {/* ─── Global styles ───────────────────────────────────────────────────── */}
      <style>{`
        .ht-trek-card:hover .trek-gallery-image { animation: none !important; }
        .ht-grid-wrap { transition: opacity 0.26s ease, transform 0.26s ease; }
        .ht-slide-out-left  { opacity: 0; transform: translateX(-40px); }
        .ht-slide-out-right { opacity: 0; transform: translateX(40px); }
        .ht-slide-in-right  { opacity: 0; transform: translateX(40px); }
        .ht-slide-in-left   { opacity: 0; transform: translateX(-40px); }

        /* Hero */
        .ht-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(160deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 100%);
        }
        .ht-hero-content { position: relative; z-index: 2; }
        .ht-hero-kicker {
          display: inline-block;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 18px;
        }
        .ht-hero-headline {
          font-size: clamp(2.2rem, 5.5vw, 4rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #fff;
          margin-bottom: 18px;
        }
        .ht-hero-headline .ht-accent {
          color: #4ade80;
          position: relative;
        }
        .ht-hero-sub {
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          color: rgba(255,255,255,0.88);
          max-width: 560px;
          margin: 0 auto 28px;
          line-height: 1.65;
        }
        .ht-hero-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: #16a34a;
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          padding: 14px 32px;
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 8px 28px rgba(22,163,74,0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ht-hero-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(22,163,74,0.5);
          color: #fff;
        }
        .ht-hero-cta-outline {
          display: inline-flex; align-items: center; gap: 6px;
          border: 2px solid rgba(255,255,255,0.7);
          color: #fff;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 13px 28px;
          border-radius: 999px;
          text-decoration: none;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .ht-hero-cta-outline:hover { background: #fff; color: #16a34a; }

        /* Service cards */
        .ht-svc-card {
          border-radius: 18px;
          padding: 28px 24px;
          background: #fff;
          border: 1px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          height: 100%;
          display: flex; flex-direction: column;
        }
        .ht-svc-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.1);
        }
        .ht-svc-icon {
          font-size: 2.2rem;
          margin-bottom: 14px;
          width: 52px; height: 52px;
          display: flex; align-items: center; justify-content: center;
          background: #f0fdf4;
          border-radius: 14px;
        }

        /* SEO chips */
        .ht-seo-chip {
          display: inline-block;
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Hero slide BG zoom */
        @keyframes htZoom {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .ht-hero-bg { animation: htZoom 22s ease-in-out infinite; }
      `}</style>

      {/* ================= HERO ================= */}
      <div
        id="heroCarousel"
        className="carousel slide carousel-fade"
        data-bs-ride="carousel"
        data-bs-interval="6000"
      >
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
        </div>

        <div className="carousel-inner">

          {/* Slide 1 — Primary SEO Hero */}
          <div className="carousel-item active">
            <div
              className="d-flex align-items-center justify-content-center text-center position-relative"
              style={{ height: "90vh", overflow: "hidden" }}
            >
              <div
                className="ht-hero-bg"
                style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="ht-hero-overlay" />
              <div className="ht-hero-content px-3">
                <span className="ht-hero-kicker">Sahyadri Trekking Experts</span>
                <h1 className="ht-hero-headline">
                  Escape the City.{" "}
                  <span className="ht-accent">Trek the Sahyadris.</span>
                </h1>
                <p className="ht-hero-sub">
                  Join budget-friendly treks, camping, and adventure experiences with departures from{" "}
                  <strong style={{ color: "#fff" }}>Pune, Mumbai, Thane, Navi Mumbai,</strong> and{" "}
                  <strong style={{ color: "#fff" }}>Kasara</strong>.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to="/treks" className="ht-hero-cta">
                    Explore Treks →
                  </Link>
                  <Link to="/contact" className="ht-hero-cta-outline">
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item">
            <div
              className="d-flex align-items-center justify-content-center text-center position-relative"
              style={{ height: "90vh", overflow: "hidden" }}
            >
              <div
                className="ht-hero-bg"
                style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1920&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="ht-hero-overlay" />
              <div className="ht-hero-content px-3">
                <span className="ht-hero-kicker">Himalayan Escapes</span>
                <h1 className="ht-hero-headline">
                  Himalayan <span className="ht-accent">Adventures</span>
                </h1>
                <p className="ht-hero-sub">
                  Explore breathtaking landscapes across Himachal, Uttarakhand, and Kashmir with curated group tours.
                </p>
                <Link to="/tours" className="ht-hero-cta">
                  Explore Tours →
                </Link>
              </div>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item">
            <div
              className="d-flex align-items-center justify-content-center text-center position-relative"
              style={{ height: "90vh", overflow: "hidden" }}
            >
              <div
                className="ht-hero-bg"
                style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="ht-hero-overlay" />
              <div className="ht-hero-content px-3">
                <span className="ht-hero-kicker">Corporate & School Groups</span>
                <h1 className="ht-hero-headline">
                  Team Outings &{" "}
                  <span className="ht-accent">School Trips</span>
                </h1>
                <p className="ht-hero-sub">
                  Safe, customized, and affordable corporate treks, team building activities, and school/college tours.
                </p>
                <Link to="/corporate" className="ht-hero-cta">
                  Plan Your Trip →
                </Link>
              </div>
            </div>
          </div>

        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>

      {/* ================= STATS TRUST BAR ================= */}
      <div className="ht-stats-bar">
        <div className="container">
          <div className="ht-stats-inner">
            <div className="ht-stat-item">
              <span className="ht-stat-number">500+</span>
              <span className="ht-stat-label">Treks Completed</span>
            </div>
            <div className="ht-stat-divider" />
            <div className="ht-stat-item">
              <span className="ht-stat-number">10,000+</span>
              <span className="ht-stat-label">Happy Trekkers</span>
            </div>
            <div className="ht-stat-divider" />
            <div className="ht-stat-item">
              <span className="ht-stat-number">4.8★</span>
              <span className="ht-stat-label">Average Rating</span>
            </div>
            <div className="ht-stat-divider" />
            <div className="ht-stat-item">
              <span className="ht-stat-number">50+</span>
              <span className="ht-stat-label">Destinations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TREKS & CAMPING (Premium Section) ================= */}
      <section
        className="py-5"
        style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #fff 60%)" }}
      >
        <div className="container">

          {/* Section header */}
          <div className="text-center mb-4">
            <span
              style={{
                color: "#16a34a",
                fontWeight: 700,
                fontSize: "0.8rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Featured Experiences
            </span>
            <h2 className="fw-bold mt-1 mb-3">— TREKS &amp; CAMPING —</h2>

            {/* SEO-rich description */}
            <p
              className="mx-auto"
              style={{ maxWidth: "680px", color: "#555", lineHeight: 1.7, fontSize: "0.97rem" }}
            >
              Discover the best treks near Pune and Mumbai with budget-friendly weekend treks
              across the Sahyadri mountains. Join monsoon treks, winter treks, and
              beginner-friendly hiking experiences with a trusted trekking community.
            </p>
          </div>

          {/* Paginated grid with prev/next arrows */}
          <div style={{ position: "relative" }}>

            {canPrev && (
              <button onClick={goPrev} style={arrowStyle("left")} aria-label="Previous treks">‹</button>
            )}

            {treksLoading ? (
              <div className="row g-3">
                <ProductCardSkeleton count={4} />
              </div>
            ) : (
              <div ref={gridRef} className={`row g-3 ht-grid-wrap ${slideAnim}`}>
                {visibleTreks.map((trek) => (
                  <div className="col-12 col-sm-6 col-md-3" key={trek.name}>
                    <HomeTrekCard trek={trek} />
                  </div>
                ))}
              </div>
            )}

            {canNext && (
              <button onClick={goNext} style={arrowStyle("right")} aria-label="Next treks">›</button>
            )}
          </div>

          {/* Page dots */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              {Array.from({ length: totalPages }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: i === page ? "#198754" : "#ccc",
                    display: "inline-block",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Load More + View All */}
          <div className="text-center mt-4 d-flex justify-content-center align-items-center gap-3 flex-wrap">
            {hasMore && (
              <button
                onClick={loadMore}
                className="btn btn-outline-success fw-semibold px-4 py-2"
                style={{ borderRadius: "999px" }}
              >
                Load More Treks
              </button>
            )}
            <Link to="/treks" className="btn btn-success fw-semibold px-4 py-2" style={{ borderRadius: "999px" }}>
              View All Treks →
            </Link>
          </div>
        </div>
      </section>

      {/* ================= TOUR CATEGORIES ================= */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              PAN-India Travel
            </span>
            <h2 className="fw-bold mt-1 mb-2">— EXPLORE TOURS BY REGION —</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: 580, fontSize: "0.96rem" }}>
              From Himalayan peaks to coastal shores — choose your next adventure.
            </p>
          </div>
          <div className="row g-3">
            {TOUR_CATEGORIES.map((cat) => (
              <TourCategoryCard key={cat.region} cat={cat} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/tours" className="btn btn-success fw-semibold px-4 py-2" style={{ borderRadius: "999px" }}>
              View All Tours →
            </Link>
          </div>
        </div>
      </section>

      {/* ================= POPULAR CAMPSITES ================= */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold">Explore Campsites</h2>
          <p className="text-center text-muted mb-5">Discover beach, lake, mountain, and forest camping getaways.</p>
          <SlidingCards
            items={campsiteCards}
            visibleCount={3}
            renderCard={(camp) => (
              <div className="card border-0 shadow-sm h-100 text-center">
                <img src={camp.img} className="card-img-top standard-img" alt={camp.name} />
                <div className="card-body">
                  <h5>{camp.name}</h5>
                  <p className="text-muted small mb-2">{camp.location}</p>
                  <h6 className="fw-bold text-success">{camp.price}</h6>
                  <Link to={`/camping/${camp.id || "alibaug-camping"}`} className="btn btn-success mt-3">Explore →</Link>
                </div>
              </div>
            )}
          />

          <div className="text-center mt-4">
            <Link to="/camping" className="btn btn-outline-success px-4">View All Campsites →</Link>
          </div>
        </div>
      </section>

      {/* ================= HERITAGE WALKS ================= */}
      {isHeritageEnabled() && <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold">Explore Pune Heritage Walks</h2>
          <p className="text-center text-muted mb-5">Discover history, culture, and hidden gems of Pune.</p>

          {(() => {
            const heritage = [
              { name: "Old Pune City Walk",     price: "Starting ₹399", img: "/HeritageImages/pune.png",           state: { category: "city" } },
              { name: "Forts & Landmarks Walk",  price: "Starting ₹699", img: "/HeritageImages/shanivaarwada.png",  state: { category: "forts" } },
              { name: "Temple & Cultural Walk",  price: "Starting ₹299", img: "/HeritageImages/cultural.png",       state: { category: "temples" } },
            ];
            return (
              <div className="row g-4">
                {heritage.map((item, i) => (
                  <div className="col-md-4" key={i}>
                    <div className="card border-0 shadow-sm h-100 text-center">
                      <img src={item.img} className="card-img-top standard-img" alt={item.name} />
                      <div className="card-body">
                        <h5>{item.name}</h5>
                        <h6 className="fw-bold text-success">{item.price}</h6>
                        <Link to="/heritage" state={item.state} className="btn btn-success mt-3">Explore →</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="text-center mt-4">
            <Link to="/heritage" className="btn btn-outline-success px-4">View All Heritage Walks →</Link>
          </div>
        </div>
      </section>}

      {/* ================= RENTALS ================= */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold">Adventure Rentals & Essentials</h2>
          <p className="text-center text-muted mb-5">Browse listed tent rentals ready for your next trek, campsite, or outdoor event.</p>

          <SlidingCards
            items={tentRentalCards}
            visibleCount={3}
            renderCard={(item) => (
              <div className="card border-0 shadow-sm h-100 text-center">
                <img src={item.img} className="card-img-top standard-img" alt={item.name} />
                <div className="card-body d-flex flex-column">
                  <h5>{item.name}</h5>
                  <p className="text-muted small mb-2">{item.location}</p>
                  <h6 className="fw-bold text-success">{item.price}</h6>
                  <Link to={`/rentals/${item.id}`} state={{ item: item.item }} className="btn btn-success mt-auto">Explore →</Link>
                </div>
              </div>
            )}
          />

          <div className="text-center mt-4">
            <Link to="/rentals" className="btn btn-outline-success px-4">View All Rentals →</Link>
          </div>
        </div>
      </section>

      {/* ================= CORPORATE / BUDGET TOURS ================= */}
      <section className="py-5" style={{ background: "linear-gradient(180deg,#f0fdf4 0%,#eff6ff 100%)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "4px 16px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              🎓 School & College Packages
            </span>
            <h2 className="fw-bold mt-2 mb-1">Budget Tours for Schools &amp; Corporate Groups</h2>
            <p className="text-muted mb-0">Safe, affordable &amp; customizable PAN-India tours.</p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <SlidingCards
              items={ivDestinations}
              visibleCount={3}
              renderCard={(dest, idx) => (
                <IVDestCard dest={dest} idx={idx} onEnquire={() => setEnquiryDest(dest)} />
              )}
            />
          </div>

          <div className="text-center">
            <Link to="/industrial-visits" className="btn btn-primary px-5 py-2 fw-bold" style={{ borderRadius: 30, background: "linear-gradient(135deg,#1d4ed8,#2563eb)", border: "none", boxShadow: "0 4px 16px rgba(29,78,216,0.25)" }}>
              View All Packages →
            </Link>
          </div>
        </div>
      </section>

      {enquiryDest && (
        <EnquiryModal dest={enquiryDest} category="Industrial Visit" onClose={() => setEnquiryDest(null)} />
      )}

      {/* ================= TESTIMONIALS ================= */}
      <section className="ht-testimonials-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="ht-section-eyebrow">What Trekkers Say</span>
            <h2 className="ht-section-title">Real Stories, Real Adventures</h2>
            <p className="ht-section-sub">Join thousands of trekkers who've explored Maharashtra with us.</p>
          </div>
          <div className="row g-4">
            {[
              {
                text: "Harihar Fort was a life-changing experience! The guides were amazing and the views from the top were absolutely breathtaking. Gadvede made everything seamless — from pickup to the summit.",
                name: "Priya M.",
                trek: "Harihar Trek",
                initials: "PM",
              },
              {
                text: "First time trekking and I chose Gadvede Trekkers. Best decision ever! The team made sure everyone was safe and having fun all the way. Already planning my next one.",
                name: "Rohan K.",
                trek: "Rajmachi Trek",
                initials: "RK",
              },
              {
                text: "Everything was perfectly organized. The campfire, the food, the sunrise hike at Bhandardara — all perfect. The guides are knowledgeable and truly passionate about the outdoors.",
                name: "Sneha P.",
                trek: "Bhandardara Camping",
                initials: "SP",
              },
            ].map((t, i) => (
              <div className="col-12 col-md-4" key={i}>
                <div className="ht-testimonial-card">
                  <div className="ht-testimonial-stars">★★★★★</div>
                  <p className="ht-testimonial-text">"{t.text}"</p>
                  <div className="ht-testimonial-author">
                    <div className="ht-testimonial-avatar">{t.initials}</div>
                    <div>
                      <div className="ht-testimonial-name">{t.name}</div>
                      <div className="ht-testimonial-trek">{t.trek}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="py-5" style={{ background: "#f8fffe" }}>
        <div className="container">
          <div className="text-center mb-5">
            <span
              style={{
                color: "#16a34a",
                fontWeight: 700,
                fontSize: "0.8rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              What We Offer
            </span>
            <h2 className="fw-bold mt-1 mb-2">Our Adventure Services</h2>
            <p className="text-muted">
              Everything you need — from weekend treks to corporate outings and villa stays.
            </p>
          </div>

          <div className="row g-4">
            {services.map((svc, i) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={i}>
                <div className="ht-svc-card">
                  <div className="ht-svc-icon">{svc.icon}</div>
                  <h5 className="fw-bold mb-2" style={{ fontSize: "1rem" }}>{svc.title}</h5>
                  <p className="text-muted mb-3" style={{ fontSize: "0.875rem", lineHeight: 1.65, flex: 1 }}>
                    {svc.desc}
                  </p>
                  <Link
                    to={svc.link}
                    className="btn btn-outline-success btn-sm"
                    style={{ borderRadius: "999px", alignSelf: "flex-start" }}
                  >
                    Learn More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="ht-cta-banner">
        <div className="container">
          <h2 className="ht-cta-banner-title">Ready for Your Next Adventure?</h2>
          <p className="ht-cta-banner-sub">
            Join 10,000+ trekkers who&apos;ve explored Maharashtra with us. Affordable, safe, and unforgettable.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/treks" className="ht-cta-banner-btn-primary">
              Explore All Treks →
            </Link>
            <a
              href="https://wa.me/919856112727"
              className="ht-cta-banner-btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ================= LOCAL SEO SECTION ================= */}
      <section
        className="py-4"
        style={{ background: "#f0fdf4", borderTop: "1px solid #d1fae5", borderBottom: "1px solid #d1fae5" }}
      >
        <div className="container">
          <div className="text-center mb-3">
            <p className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
              Treks available from{" "}
              <strong>Pune, Mumbai, Thane, Navi Mumbai, Kasara, Pimpri-Chinchwad, Hinjewadi,</strong> and{" "}
              <strong>Kharadi</strong>.
            </p>
            <p className="text-muted mb-3" style={{ fontSize: "0.82rem" }}>Popular searches:</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {[
                "Treks near Pune",
                "Treks near Mumbai",
                "Budget Treks Maharashtra",
                "Monsoon Treks",
                "Weekend Treks near Pune",
              ].map((tag) => (
                <span key={tag} className="ht-seo-chip">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating WhatsApp button ── */}
      <a
        href="https://wa.me/919856112727"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          backgroundColor: "#25D366",
          borderRadius: "50%",
          width: "58px",
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="white" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
        </svg>
      </a>
    </>
  );
}

export default Home;
