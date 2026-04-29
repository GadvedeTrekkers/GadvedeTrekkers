import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import { createWhatsAppInquiryUrl, handleWhatsAppLead } from "../../utils/leadActions";
import { BOOKING_WHATSAPP_NUMBER } from "../../config/bookingConfig";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function discountPct(price, originalPrice) {
  if (!originalPrice || !price || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function StarRating({ rating }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  return (
    <span aria-label={`${rating} out of 5 stars`} style={{ fontSize: 12, color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

/* ─── Book Now button ────────────────────────────────────────────────────────
   Three states: idle → loading → done → idle
   - Saves an enquiry to the CRM before opening WhatsApp (lead capture).
   - Uses BOOKING_WHATSAPP_NUMBER (booking intent, separate from inquiry).
   - touch-target height ≥ 44 px for mobile accessibility.               */

function BookNowButton({ item }) {
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "done"

  const handleClick = useCallback(async () => {
    if (status !== "idle") return;     // guard double-tap on mobile
    setStatus("loading");

    try {
      await handleWhatsAppLead({
        phoneNumber: BOOKING_WHATSAPP_NUMBER,
        packageName: item.name,
        location:    item.location,
        category:    "Heritage Walk",
        source:      "Heritage Listing",
      });
    } catch {
      /* network / storage error — WhatsApp still opens via window.open */
    }

    setStatus("done");
    setTimeout(() => setStatus("idle"), 2500);
  }, [item, status]);

  const label =
    status === "loading" ? "Opening…"   :
    status === "done"    ? "✓ Opened!"  :
    "Book Now";

  const isLoading = status === "loading";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={`Book ${item.name} on WhatsApp`}
      style={{
        flex:           1,
        minHeight:      44,            /* WCAG touch target */
        background:     status === "done" ? "#15803d" : "#198754",
        border:         "none",
        borderRadius:   8,
        color:          "#fff",
        fontWeight:     700,
        fontSize:       "0.85rem",
        letterSpacing:  "0.01em",
        cursor:         isLoading ? "wait" : "pointer",
        opacity:        isLoading ? 0.75  : 1,
        transition:     "background 0.2s, opacity 0.2s",
        whiteSpace:     "nowrap",
        padding:        "0 12px",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Heritage card ──────────────────────────────────────────────────────── */

function HeritageCard({ item }) {
  const pct    = discountPct(item.price, item.originalPrice);
  const saving = item.originalPrice - item.price;

  return (
    <div
      style={{
        background:    "#fff",
        borderRadius:  16,
        border:        "1px solid #e5e7eb",
        boxShadow:     "0 4px 20px rgba(0,0,0,0.07)",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        height:        "100%",
      }}
    >
      {/* ── Image + discount badge ── */}
      <div style={{ position: "relative" }}>
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
        />
        {pct > 0 && (
          <span
            aria-label={`${pct}% off`}
            style={{
              position:     "absolute",
              top:          10,
              left:         10,
              background:   "#dc2626",
              color:        "#fff",
              fontSize:     11,
              fontWeight:   800,
              borderRadius: 6,
              padding:      "3px 8px",
              letterSpacing: "0.03em",
            }}
          >
            {pct}% OFF
          </span>
        )}
        <span
          style={{
            position:   "absolute",
            top:        10,
            right:      10,
            background: "rgba(0,0,0,0.55)",
            color:      "#fff",
            fontSize:   11,
            fontWeight: 600,
            borderRadius: 6,
            padding:    "3px 8px",
            backdropFilter: "blur(4px)",
          }}
        >
          {item.type}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", flex: 1, gap: 0 }}>

        {/* Name */}
        <h5 style={{ fontWeight: 800, fontSize: "0.97rem", color: "#111827", margin: "0 0 4px" }}>
          {item.name}
        </h5>

        {/* Location + duration */}
        <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "0 0 8px" }}>
          📍 {item.location} &nbsp;·&nbsp; ⏱ {item.duration}
        </p>

        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <StarRating rating={item.rating} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {item.rating} ({item.reviews} reviews)
          </span>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "0.82rem", marginRight: 6 }}>
            ₹{item.originalPrice}
          </span>
          <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#111827" }}>
            ₹{item.price}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", marginLeft: 4 }}>/ person</span>
          {saving > 0 && (
            <div style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600, marginTop: 2 }}>
              You save ₹{saving}
            </div>
          )}
        </div>

        {/* Next date — urgency anchor */}
        <div style={{ fontSize: "0.8rem", color: "#374151", marginBottom: 14 }}>
          📅 <strong>Next batch:</strong> {item.nextDate}
        </div>

        {/* ── CTAs ── */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Primary row: Book Now + View Details */}
          <div style={{ display: "flex", gap: 8 }}>
            <BookNowButton item={item} />

            <Link
              to={`/heritage/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              style={{
                flex:         1,
                minHeight:    44,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                background:   "transparent",
                border:       "1.5px solid #198754",
                borderRadius: 8,
                color:        "#198754",
                fontWeight:   700,
                fontSize:     "0.85rem",
                textDecoration: "none",
                whiteSpace:   "nowrap",
                padding:      "0 12px",
                transition:   "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              View Details
            </Link>
          </div>

          {/* Secondary: WhatsApp inquiry (distinct number + inquiry intent) */}
          <a
            href={createWhatsAppInquiryUrl({
              packageName: item.name,
              location:    item.location,
              category:    "Heritage Walk",
            })}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            6,
              minHeight:      40,
              background:     "#f0fdf4",
              border:         "1px solid #bbf7d0",
              borderRadius:   8,
              color:          "#15803d",
              fontWeight:     600,
              fontSize:       "0.8rem",
              textDecoration: "none",
              transition:     "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dcfce7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Ask a Question
          </a>

          {/* Micro-copy — reduces hesitation */}
          <p style={{ margin: 0, textAlign: "center", fontSize: "0.7rem", color: "#9ca3af" }}>
            ⚡ Instant confirmation · No advance payment
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

function Heritage() {
  const location = useLocation();
  const selectedCategory = location.state?.category || null;
  const [, setSyncKey] = useState(0);

  useEffect(() => {
    const syncLocal = () => setSyncKey((k) => k + 1);

    syncProductsFromApi("heritage", "gt_heritage")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});

    window.addEventListener("storage", syncLocal);
    return () => window.removeEventListener("storage", syncLocal);
  }, []);

  const heritageData = {
    city: [
      {
        name: "Shaniwar Wada Heritage Walk",
        location: "Pune",
        duration: "2-3 Hours",
        type: "City",
        price: 499,
        originalPrice: 799,
        nextDate: "20 Sept 2025",
        rating: 4.8,
        reviews: 120,
        image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09c",
      },
      {
        name: "Kasba Peth Walk",
        location: "Pune",
        duration: "2 Hours",
        type: "City",
        price: 399,
        originalPrice: 699,
        nextDate: "22 Sept 2025",
        rating: 4.7,
        reviews: 90,
        image: "https://images.unsplash.com/photo-1581091215367-59ab6b2d6c2d",
      },
      {
        name: "Tulshibaug Market Walk",
        location: "Pune",
        duration: "2 Hours",
        type: "City",
        price: 399,
        originalPrice: 699,
        nextDate: "25 Sept 2025",
        rating: 4.6,
        reviews: 75,
        image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1",
      },
    ],
    forts: [
      {
        name: "Sinhagad Fort Walk",
        location: "Pune",
        duration: "Half Day",
        type: "Fort",
        price: 799,
        originalPrice: 1199,
        nextDate: "21 Sept 2025",
        rating: 4.9,
        reviews: 210,
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
      {
        name: "Purandar Fort Walk",
        location: "Pune",
        duration: "1 Day",
        type: "Fort",
        price: 999,
        originalPrice: 1399,
        nextDate: "28 Sept 2025",
        rating: 4.8,
        reviews: 150,
        image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
      },
      {
        name: "Lohagad Fort Walk",
        location: "Lonavala",
        duration: "Half Day",
        type: "Fort",
        price: 699,
        originalPrice: 999,
        nextDate: "24 Sept 2025",
        rating: 4.7,
        reviews: 130,
        image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff",
      },
    ],
    temples: [
      {
        name: "Dagdusheth Ganpati Walk",
        location: "Pune",
        duration: "2 Hours",
        type: "Temple",
        price: 299,
        originalPrice: 599,
        nextDate: "19 Sept 2025",
        rating: 4.9,
        reviews: 300,
        image: "https://images.unsplash.com/photo-1587474260584-136574528ed5",
      },
      {
        name: "Parvati Hill Temple Walk",
        location: "Pune",
        duration: "2-3 Hours",
        type: "Temple",
        price: 399,
        originalPrice: 699,
        nextDate: "23 Sept 2025",
        rating: 4.8,
        reviews: 180,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      },
      {
        name: "Sarasbaug Walk",
        location: "Pune",
        duration: "2 Hours",
        type: "Temple",
        price: 299,
        originalPrice: 599,
        nextDate: "26 Sept 2025",
        rating: 4.7,
        reviews: 140,
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      },
    ],
  };

  /* Merge admin-created heritage walks, respecting Live/Off status */
  const _adminHeritage = getAdminItems("gt_heritage");
  const _adminByName   = new Map(_adminHeritage.map((w) => [(w.name || "").toLowerCase(), w]));

  Object.keys(heritageData).forEach((cat) => {
    heritageData[cat] = heritageData[cat].filter((w) => {
      const adminItem = _adminByName.get((w.name || "").toLowerCase());
      return !adminItem || adminItem.active !== false;
    });
  });

  const _hardcodedNames = new Set(
    Object.values(heritageData).flat().map((w) => (w.name || "").toLowerCase())
  );
  _adminHeritage
    .filter((w) => w.active !== false && !_hardcodedNames.has((w.name || "").toLowerCase()))
    .forEach((w) => {
      const item = normaliseItem(w);
      const cat  = (item.type || "city").toLowerCase();
      if (!heritageData[cat]) heritageData[cat] = [];
      heritageData[cat].push(item);
    });

  const categories = Object.keys(heritageData);

  const categoryRefs = {
    city:    useRef(null),
    forts:   useRef(null),
    temples: useRef(null),
  };

  useEffect(() => {
    if (selectedCategory && categoryRefs[selectedCategory]) {
      categoryRefs[selectedCategory].current?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState({}, document.title);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [selectedCategory]);

  const SECTION_LABELS = {
    city:    "Old Pune City Heritage Walk",
    forts:   "Historical Forts & Landmarks Walk",
    temples: "Cultural & Temple Heritage Walk",
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-5 text-success">
        Pune Heritage Walks
      </h2>

      {categories.map((category) => (
        <div key={category} ref={categoryRefs[category]} className="mb-5">
          <h4 className="fw-bold mb-4 text-success">
            {SECTION_LABELS[category] ?? category}
          </h4>

          <div className="row g-4">
            {heritageData[category].map((item, index) => (
              <div className="col-md-4" key={item.id ?? item.name ?? index}>
                <HeritageCard item={item} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Heritage;
