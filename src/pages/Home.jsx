import { Link, useNavigate } from "react-router-dom";
import React, { Fragment, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSiteContent } from "../config/siteContent";
import HomeHero, { SmartLink } from "../components/HomeHero";
import { isHeritageEnabled } from "../data/featureFlags";
import EnquiryModal from "../components/EnquiryModal";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import { getAdminItems, normaliseItem } from "../data/adminStorage";
import BookingCTA from "../components/BookingCTA";
import { WhatsAppIcon, ArrowRightIcon } from "../components/icons";
import { handleImageError, withFallbackImages } from "../utils/imageFallback";
import { stripPromptFields } from "../utils/contentSanitizer";
import { syncProductsFromApi } from "../api/getAll";
import { collectSellingPrices, genuineCompareAt, resolveTripGallery } from "../utils/tripDisplay";
import { tripDetailPath } from "../data/publicTrips";
import { mergeFeaturedTrips } from "../data/featuredTrips";
import { useSeo } from "../seo/useSeo";
import TripRating from "../components/TripRating";
import InstagramFeed from "../components/social/InstagramFeed";
import { waBase } from "../config/whatsappSetting";
import { pageSeo,
  DEFAULT_OG,
  SITE_ORIGIN,
  absoluteUrl,
  homeJsonLd,
} from "../seo/publicSeo";
import { upcomingLabel } from "../utils/upcomingDate";

// ─── Active treks (respects Live/Off status from admin panel) ─────────────────
function parseGalleryHome(value, fallback) {
  try {
    const parsed = JSON.parse(value || "[]").filter(Boolean);
    return parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function buildActiveTreks(rawItems = []) {
  return mergeFeaturedTrips(rawItems).map((t) => {
    const resolved = resolveTripGallery(t);
    const gallery = resolved.length
      ? resolved
      : withFallbackImages(parseGalleryHome(t.imageGallery, [t.image].filter(Boolean)));
    return {
      ...stripPromptFields(normaliseItem(t)),
      slug: t.slug,
      image: gallery[0] || t.image,
      gallery,
      seasonalTag: t.seasonalTag || "",
      productType: t.productType || t.product_type || "trek",
    };
  });
}

// ─── HomeTrekCard ─────────────────────────────────────────────────────────────
const initialsOf = (name = "") => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

function HomeTrekCard({ trek }) {
  const [imgIdx, setImgIdx] = useState(0);
  const intervalRef = useRef(null);
  const images = (trek.gallery || []).slice(0, 3);
  const compareAt = genuineCompareAt(trek.originalPrice, trek.price, collectSellingPrices(trek));
  const discountPct = compareAt ? Math.round(((compareAt - trek.price) / compareAt) * 100) : 0;
  const detailPath = tripDetailPath(trek);

  const handleMouseEnter = () => {
    if (images.length < 2) return;
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
        {trek.seasonalTag && <span className="trek-season-tag">{trek.seasonalTag}</span>}
        {discountPct > 0 && (
          <span className="trek-discount-badge">{discountPct}% OFF</span>
        )}
        <div className="trek-gallery">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={i === 0 ? `${trek.name} cover` : `${trek.name} — view ${i + 1}`}
              className="trek-gallery-image"
              style={{
                opacity: i === imgIdx ? 1 : 0,
                transform: i === imgIdx ? "scale(1.05)" : "scale(1.02)",
                transition: "opacity 0.5s ease, transform 0.6s ease",
              }}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
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
            to={detailPath}
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
          <TripRating item={trek} />
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
          {trek.duration && <span className="trek-chip chip-neutral">⏱ {trek.duration}</span>}
        </div>

        <div className="trek-pricing">
          {compareAt && (
            <span className="trek-original-price">₹{compareAt}</span>
          )}
          <span className="trek-current-price">₹{trek.price}</span>
          <span className="trek-starting-text">per person</span>
        </div>

        {upcomingLabel(trek.nextDate) && (
          <div className="trek-next-date">
            <span className="trek-next-label">📅 Next</span>
            <span>{trek.nextDate}</span>
          </div>
        )}

        <div className="trek-card-actions">
          <BookingCTA trek={trek} className="trek-primary-btn">
            <WhatsAppIcon />
            Book on WhatsApp
          </BookingCTA>
          <Link
            to={detailPath}
            className="trek-secondary-btn trek-details-link"
          >
            View Details
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Tour Categories (home section) ──────────────────────────────────────────
/* Region names/icons are UI labels for the admin "Region" options; the cards themselves (which regions,
   their trips and photo) come from the published tours (t129u). */
const REGION_LABELS = {
  himachal: { label: "Himachal Tours", icon: "🏔️" },
  kashmir: { label: "Kashmir & Leh Tours", icon: "🌷" },
  northeast: { label: "NorthEast Tours", icon: "🌿" },
  rajasthan: { label: "Rajasthan Tours", icon: "🏰" },
  kerala: { label: "Kerala Tours", icon: "🌴" },
  uttarakhand: { label: "Uttarakhand Tours", icon: "⛪" },
  goa: { label: "Goa Tours", icon: "🏖️" },
  maharashtra: { label: "Maharashtra Tours", icon: "🌊" },
  karnataka: { label: "Karnataka Tours", icon: "🛕" },
};

function tourCategoriesFrom(tours) {
  const byRegion = new Map();
  for (const t of tours) {
    const region = String(t.region || "").toLowerCase();
    if (!region) continue;
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(t);
  }
  return [...byRegion.entries()].map(([region, list]) => {
    const meta = REGION_LABELS[region] || { label: `${region.charAt(0).toUpperCase()}${region.slice(1)} Tours`, icon: "🧭" };
    let image = "";
    for (const t of list) {
      let gallery = [];
      try { gallery = Array.isArray(t.imageGallery) ? t.imageGallery : JSON.parse(t.imageGallery || "[]"); } catch { gallery = []; }
      image = t.image || (typeof gallery[0] === "string" ? gallery[0] : gallery[0]?.src) || "";
      if (image) break;
    }
    return { region, ...meta, subtitle: list.slice(0, 4).map((t) => t.shortName || t.name).filter(Boolean).join(" · "), image };
  });
}

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
          position: "relative", 
          borderRadius: 16, 
          overflow: "hidden",
          cursor: "pointer", 
          aspectRatio: "4/3",
          border: "2px solid #000",
          boxShadow: hovered 
            ? "0 50px 100px rgba(0, 0, 0, 0.35), 0 25px 50px rgba(17, 24, 39, 0.30), 0 12px 24px rgba(15, 111, 74, 0.25), 0 6px 12px rgba(0, 0, 0, 0.20)"
            : "0 6px 16px rgba(17, 24, 39, 0.12), 0 3px 8px rgba(0, 0, 0, 0.08)",
          transform: hovered ? "translateY(-20px) scale(1.04)" : "translateY(0) scale(1)",
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.25s ease",
        }}
      >
        <img
          src={cat.image}
          alt={cat.label}
          loading="lazy"
          onError={handleImageError}
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
              loading="lazy"
              onError={handleImageError}
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
            🎓 {(dest.bestFor || "Student groups").split("&")[0].trim()}
          </span>
        </div>

        {dest.priceLabel ? (
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#064e3b", marginBottom: 8, lineHeight: 1.4 }}>
            {dest.priceLabel}
          </div>
        ) : null}

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
  const isTouchDevice = () =>
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 768px)").matches;

  const [isMobile, setIsMobile] = useState(() => isTouchDevice());
  const effectiveVisible = isMobile ? 1 : visibleCount;

  const [index, setIndex] = useState(effectiveVisible);
  const [transition, setTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Detect screen size changes
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => {
      const mobile = isTouchDevice();
      setIsMobile(mobile);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const safeItems = Array.isArray(items) ? items : [];

  // Reset index when effectiveVisible changes (adjusted during render, not in an effect: no cascading renders)
  const [prevVisible, setPrevVisible] = useState(effectiveVisible);
  if (prevVisible !== effectiveVisible) {
    setPrevVisible(effectiveVisible);
    setIndex(effectiveVisible);
    setTransition(false);
  }
  // Turn the slide animation back on two frames after a jump without animation.
  useEffect(() => {
    if (transition) return undefined;
    let inner = 0;
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setTransition(true)); });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, [transition]);

  useEffect(() => {
    // No auto-rotation on mobile/touch
    if (safeItems.length <= effectiveVisible || isPaused || isMobile) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, safeItems.length, effectiveVisible, isPaused, isMobile]);

  if (safeItems.length === 0) return null;

  if (safeItems.length <= effectiveVisible) {
    return (
      <div className="row g-4">
        {safeItems.map((item, i) => (
          <div className={`col-12 col-md-${12 / effectiveVisible}`} key={item.id || item.name || i}>
            {renderCard(item, i)}
          </div>
        ))}
      </div>
    );
  }

  const extended = [
    ...safeItems.slice(-effectiveVisible),
    ...safeItems,
    ...safeItems.slice(0, effectiveVisible),
  ];

  const next = () => setIndex((prev) => prev + 1);
  const prev = () => setIndex((prev) => prev - 1);

  const handleTransitionEnd = () => {
    if (index >= safeItems.length + effectiveVisible) {
      setTransition(false);
      setIndex(effectiveVisible);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransition(true)));
    } else if (index < effectiveVisible) {
      setTransition(false);
      setIndex(safeItems.length + effectiveVisible - 1);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransition(true)));
    }
  };

  const cardWidthPct = 100 / effectiveVisible;

  return (
    <div className="trek-slider-container">
      <button className="trek-slider-btn left" onClick={prev} aria-label="Previous">❮</button>
      <div
        className="trek-slider-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="trek-slider-track"
          style={{
            transform: `translateX(-${index * cardWidthPct}%)`,
            transition: transition ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extended.map((item, i) => (
            <div
              className="trek-slide"
              key={`${item.id || item.name || "item"}-${i}`}
              style={{ flex: `0 0 ${cardWidthPct}%`, maxWidth: `${cardWidthPct}%` }}
            >
              {renderCard(item, i)}
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
  // All copy below comes from Admin → Settings → Site Content (t129u). Unset / unpublished = section hidden.
  const heroSlides = useSiteContent("home.hero")?.slides || [];
  const visibleStats = useSiteContent("home.stats")?.items || [];
  const testimonials = useSiteContent("home.testimonials");
  const services = useSiteContent("home.services");
  const cta = useSiteContent("home.cta");
  const localSeo = useSiteContent("home.localSeo");
  const CPP = 4;
  const [loadedCount, setLoadedCount] = useState(CPP);
  const [page, setPage]               = useState(0);
  const [slideAnim, setSlideAnim]     = useState("");
  const [enquiryDest, setEnquiryDest] = useState(null);
  const gridRef = useRef(null);
  const [syncKey, setSyncKey] = useState(0);
  const [activeTreks, setActiveTreks] = useState([]); // filled from the live catalogue (Admin → Treks / Camping)
  const [activeTours, setActiveTours] = useState([]);
  const [treksLoading, setTreksLoading] = useState(true);

  const seoText = pageSeo("home"); // Admin → Site Content → Search titles (t129u)
  useSeo({
    title: seoText.title,
    description: seoText.description,
    canonical: `${SITE_ORIGIN}/`,
    image: absoluteUrl(DEFAULT_OG.path),
    imageWidth: DEFAULT_OG.width,
    imageHeight: DEFAULT_OG.height,
    imageAlt: DEFAULT_OG.alt,
    jsonLd: homeJsonLd,
  });

  // Treks section is trek + camping so seasonal camping stays beside the forts.
  useEffect(() => {
    let cancelled = false;
    const applyTrips = (treks, camps) => {
      if (!cancelled) setActiveTreks(buildActiveTreks([...(treks || []), ...(camps || [])]));
    };

    Promise.all([
      syncProductsFromApi("trek", "gt_treks").catch(() => []),
      syncProductsFromApi("camping", "gt_camping").catch(() => []),
    ])
      .then(([treks, camps]) => applyTrips(treks, camps))
      .finally(() => {
        if (!cancelled) setTreksLoading(false);
      });

    syncProductsFromApi("rental", "gt_rentals")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});
    syncProductsFromApi("tour", "gt_tours")
      .then((items) => {
        if (!cancelled) setActiveTours((items || []).filter((item) => item.active !== false));
      })
      .catch(() => {
        if (!cancelled) setActiveTours([]);
      });
    syncProductsFromApi("heritage", "gt_heritage")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});
    syncProductsFromApi("industrial", "gt_iv")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {});

    const onStorage = () => {
      applyTrips(getAdminItems("gt_treks"), getAdminItems("gt_camping"));
      setSyncKey((k) => k + 1);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("gt:storage-updated", onStorage);
    return () => {
      cancelled = true;
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


  const campsiteCards = useMemo(
    () =>
      activeTreks
        .filter((camp) => camp.productType === "camping" || /camp/i.test(`${camp.category || ""} ${camp.name || ""}`))
        .map((camp) => ({
          id: camp.slug,
          name: camp.shortName || camp.name,
          price: `Starting ₹${camp.price}`,
          img: camp.image,
          location: camp.location || camp.destination,
          productType: camp.productType,
          slug: camp.slug,
        })),
    [activeTreks]
  );

  // Rentals — only active catalog products. Hide the section when this list is empty.
  const heritageCards = useMemo(() => {
    return getAdminItems("gt_heritage")
      .filter((item) => item && item.active !== false && item.name)
      .sort((x, y) => Number(x.sortOrder ?? 999) - Number(y.sortOrder ?? 999))
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price ? `Starting ₹${Number(item.price).toLocaleString("en-IN")}` : "",
        img: item.image,
        path: `/heritage/${String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncKey re-reads local storage after an API sync
  }, [syncKey]);

  const tentRentalCards = useMemo(() => {
    const _adminRentalsRaw = getAdminItems("gt_rentals");
    const _activeRentals = _adminRentalsRaw
      .filter((item) => item.active !== false)
      .map(normaliseItem);
    return _activeRentals
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
  }, [syncKey]);

  const ivDestinations = useMemo(() => {
    const stored = getAdminItems("gt_iv");
    return stored
      .filter((d) => d.active !== false)
      .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
      .map((d) => {
        let images = [];
        try {
          const gallery = JSON.parse(d.imageGallery || "[]");
          images = (Array.isArray(gallery) ? gallery : [])
            .filter(Boolean)
            .map((url) => (typeof url === "string" ? { src: url, caption: "" } : { src: url.src, caption: url.caption || "" }))
            .filter((img) => img.src);
        } catch { images = []; }
        const highlights = Array.isArray(d.highlights)
          ? d.highlights.filter(Boolean)
          : String(d.highlights || "").split("\n").map((s) => s.trim()).filter(Boolean);
        const priced = String(d.pricingSlabs || "")
          .split("\n")
          .map((line) => line.split("|"))
          .filter((parts) => parts[0] && parts[1] && Number(parts[1]));
        const priceLabel = priced.length
          ? priced.slice(0, 2).map(([name, price]) => `${name.trim()} ₹${Number(price).toLocaleString("en-IN")}`).join(" · ")
          : (Number(d.price) > 0 ? `From ₹${Number(d.price).toLocaleString("en-IN")}` : "");
        return {
          ...normaliseItem(d),
          title: d.title || d.name,
          bestFor: d.bestFor || "Student groups",
          images,
          highlights,
          priceLabel,
        };
      });
  }, [syncKey]);

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

      {/* ================= HERO (slides from Admin → Site Content → Hero slides) ================= */}
      <HomeHero slides={heroSlides} />

      {/* ================= STATS TRUST BAR ================= */}
      {visibleStats.length > 0 && (
      <div className="ht-stats-bar">
        <div className="container">
          <div className="ht-stats-inner">
            {visibleStats.map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 && <div className="ht-stat-divider" />}
                <div className="ht-stat-item">
                  <span className="ht-stat-number">{stat.value}</span>
                  <span className="ht-stat-label">{stat.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      )}

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
            {activeTreks.length > 0 && (
              <p
                className="mx-auto"
                style={{ maxWidth: "680px", color: "#555", lineHeight: 1.7, fontSize: "0.97rem" }}
              >
                {/* Built from the published trips (t129u), not typed in code. */}
                Open batches: {activeTreks.slice(0, 4).map((t) => t.shortName || t.name).join(", ")}.
              </p>
            )}
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
            <Link to="/trips" className="btn btn-outline-success fw-semibold px-4 py-2" style={{ borderRadius: "999px" }}>
              Open trips
            </Link>
          </div>
        </div>
      </section>

      {/* ================= TOUR CATEGORIES ================= */}
      {activeTours.length > 0 && <section className="py-5 bg-light">
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
            {tourCategoriesFrom(activeTours).map((cat) => (
              <TourCategoryCard key={cat.region} cat={cat} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/tours" className="btn btn-success fw-semibold px-4 py-2" style={{ borderRadius: "999px" }}>
              View All Tours →
            </Link>
          </div>
        </div>
      </section>}

      {/* ================= POPULAR CAMPSITES ================= */}
      {campsiteCards.length > 0 && <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold">Explore Campsites</h2>
          <p className="text-center text-muted mb-5">Discover beach, lake, mountain, and forest camping getaways.</p>
          <SlidingCards
            items={campsiteCards}
            visibleCount={3}
            renderCard={(camp) => (
              <div 
                className="card h-100 text-center" 
                style={{
                  border: "2px solid #000",
                  borderRadius: "22px",
                  overflow: "hidden",
                  boxShadow: "0 6px 16px rgba(17, 24, 39, 0.12), 0 3px 8px rgba(0, 0, 0, 0.08)",
                  transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-20px) scale(1.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                }}
              >
                <img src={camp.img} className="card-img-top standard-img" alt={camp.name} loading="lazy" onError={handleImageError} />
                <div className="card-body d-flex flex-column">
                  <h5>{camp.name}</h5>
                  <p className="text-muted small mb-2">{camp.location}</p>
                  <h6 className="fw-bold text-success">{camp.price}</h6>
                  <div className="trek-card-actions mt-3">
                    <BookingCTA trek={camp} className="trek-primary-btn">
                      <WhatsAppIcon />
                      Book on WhatsApp
                    </BookingCTA>
                    <Link to={tripDetailPath(camp)} className="trek-secondary-btn">
                      Details
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          />

          <div className="text-center mt-4">
            <Link to="/camping" className="btn btn-outline-success px-4">View All Campsites →</Link>
          </div>
        </div>
      </section>}

      {/* ================= HERITAGE WALKS ================= */}
      {isHeritageEnabled() && heritageCards.length > 0 && <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold">Explore Pune Heritage Walks</h2>
          <p className="text-center text-muted mb-5">Discover history, culture, and hidden gems of Pune.</p>

          {(() => {
            // t129u: walks come from Admin → Listings → Heritage Walks (published records only).
            const heritage = heritageCards;
            return (
              <div className="row g-4">
                {heritage.map((item, i) => (
                  <div className="col-md-4" key={i}>
                    <div className="card border-0 shadow-sm h-100 text-center">
                      <img src={item.img} className="card-img-top standard-img" alt={item.name} loading="lazy" onError={handleImageError} />
                      <div className="card-body d-flex flex-column">
                        <h5>{item.name}</h5>
                        <h6 className="fw-bold text-success">{item.price}</h6>
                        <div className="trek-card-actions mt-3">
                          <BookingCTA trek={item} className="trek-primary-btn">
                            <WhatsAppIcon />
                            Book on WhatsApp
                          </BookingCTA>
                          <Link to={item.path} className="trek-secondary-btn">
                            Details
                            <ArrowRightIcon />
                          </Link>
                        </div>
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
      {tentRentalCards.length > 0 && <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold">Adventure Rentals & Essentials</h2>
          <p className="text-center text-muted mb-5">Browse listed tent rentals ready for your next trek, campsite, or outdoor event.</p>

          <SlidingCards
            items={tentRentalCards}
            visibleCount={3}
            renderCard={(item) => (
              <div 
                className="card h-100 text-center" 
                style={{
                  border: "2px solid #000",
                  borderRadius: "22px",
                  overflow: "hidden",
                  boxShadow: "0 6px 16px rgba(17, 24, 39, 0.12), 0 3px 8px rgba(0, 0, 0, 0.08)",
                  transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-20px) scale(1.04)";
                  e.currentTarget.style.boxShadow = "0 50px 100px rgba(0, 0, 0, 0.35), 0 25px 50px rgba(17, 24, 39, 0.30), 0 12px 24px rgba(15, 111, 74, 0.25), 0 6px 12px rgba(0, 0, 0, 0.20)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(17, 24, 39, 0.12), 0 3px 8px rgba(0, 0, 0, 0.08)";
                }}
              >
                <img src={item.img} className="card-img-top standard-img" alt={item.name} loading="lazy" onError={handleImageError} />
                <div className="card-body d-flex flex-column">
                  <h5>{item.name}</h5>
                  <p className="text-muted small mb-2">{item.location}</p>
                  <h6 className="fw-bold text-success">{item.price}</h6>
                  <div className="trek-card-actions mt-auto">
                    <BookingCTA trek={item} className="trek-primary-btn">
                      <WhatsAppIcon />
                      Book on WhatsApp
                    </BookingCTA>
                    <Link to={`/rentals/${item.id}`} state={{ item: item.item }} className="trek-secondary-btn">
                      Details
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          />

          <div className="text-center mt-4">
            <Link to="/rentals" className="btn btn-outline-success px-4">View All Rentals →</Link>
          </div>
        </div>
      </section>}

      {/* ================= CORPORATE / BUDGET TOURS ================= */}
      {ivDestinations.length > 0 && <section className="py-5" style={{ background: "linear-gradient(180deg,#f0fdf4 0%,#eff6ff 100%)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "4px 16px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              🎓 School & College Packages
            </span>
            <h2 className="fw-bold mt-2 mb-1">College Industrial Visits</h2>
            <p className="text-muted mb-0">Safe, affordable student group trips with a full day-by-day itinerary.</p>
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
      </section>}

      {enquiryDest && (
        <EnquiryModal dest={enquiryDest} category="Industrial Visit" onClose={() => setEnquiryDest(null)} />
      )}

      {/* ================= TESTIMONIALS (Admin → Site Content; hidden when none) ================= */}
      {testimonials && (
      <section className="ht-testimonials-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            {testimonials.eyebrow && <span className="ht-section-eyebrow">{testimonials.eyebrow}</span>}
            {testimonials.title && <h2 className="ht-section-title">{testimonials.title}</h2>}
            {testimonials.subtitle && <p className="ht-section-sub">{testimonials.subtitle}</p>}
          </div>
          <div className="row g-4">
            {testimonials.items.map((t, i) => (
              <div className="col-12 col-md-4" key={i}>
                <div className="ht-testimonial-card">
                  <p className="ht-testimonial-text">"{t.text}"</p>
                  <div className="ht-testimonial-author">
                    <div className="ht-testimonial-avatar">{initialsOf(t.name)}</div>
                    <div>
                      <div className="ht-testimonial-name">{t.name}</div>
                      {t.trip && <div className="ht-testimonial-trek">{t.trip}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ================= INSTAGRAM (hidden until the feed is configured) ================= */}
      <InstagramFeed placement="home" limit={8} />

      {/* ================= SERVICES (Admin → Site Content; hidden when none) ================= */}
      {services && (
      <section className="py-5" style={{ background: "#f8fffe" }}>
        <div className="container">
          <div className="text-center mb-5">
            {services.eyebrow && (
              <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {services.eyebrow}
              </span>
            )}
            {services.title && <h2 className="fw-bold mt-1 mb-2">{services.title}</h2>}
            {services.subtitle && <p className="text-muted">{services.subtitle}</p>}
          </div>

          <div className="row g-4">
            {services.items.map((svc, i) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={i}>
                <div className="ht-svc-card">
                  {svc.icon && <div className="ht-svc-icon">{svc.icon}</div>}
                  <h5 className="fw-bold mb-2" style={{ fontSize: "1rem" }}>{svc.title}</h5>
                  {svc.text && (
                    <p className="text-muted mb-3" style={{ fontSize: "0.875rem", lineHeight: 1.65, flex: 1 }}>
                      {svc.text}
                    </p>
                  )}
                  {svc.link && (
                    <SmartLink
                      to={svc.link}
                      className="btn btn-outline-success btn-sm"
                      style={{ borderRadius: "999px", alignSelf: "flex-start" }}
                    >
                      Learn More →
                    </SmartLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ================= CTA BANNER (Admin → Site Content; hidden when not set) ================= */}
      {cta && (
      <section className="ht-cta-banner">
        <div className="container">
          <h2 className="ht-cta-banner-title">{cta.title}</h2>
          {cta.subtitle && <p className="ht-cta-banner-sub">{cta.subtitle}</p>}
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            {cta.buttonLabel && cta.buttonLink && (
              <SmartLink to={cta.buttonLink} className="ht-cta-banner-btn-primary">
                {cta.buttonLabel}
              </SmartLink>
            )}
            {cta.whatsappLabel && (
              <a href={waBase()} className="ht-cta-banner-btn-secondary" target="_blank" rel="noopener noreferrer">
                {cta.whatsappLabel}
              </a>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ================= PICKUP CITIES / SEARCH TAGS (Admin → Site Content; hidden when not set) ================= */}
      {localSeo && (
      <section
        className="py-4"
        style={{ background: "#f0fdf4", borderTop: "1px solid #d1fae5", borderBottom: "1px solid #d1fae5" }}
      >
        <div className="container">
          <div className="text-center mb-3">
            {localSeo.text && <p className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>{localSeo.text}</p>}
            {localSeo.chips.length > 0 && (
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {localSeo.chips.map((c) => (
                  <span key={c.label} className="ht-seo-chip">{c.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      )}
    </>
  );
}

export default Home;
