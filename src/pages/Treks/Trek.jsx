import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { uniqueTreks, slugifyTrekName } from "../../data/treks";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";
import BookingCTA from "../../components/BookingCTA";
import { WhatsAppIcon, ArrowRightIcon, DownloadIcon } from "../../components/icons";
import { syncProductsFromApi } from "../../api/getAll";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";

const parseGallery = (value, fallback) => {
  try {
    const parsed = JSON.parse(value || "[]").filter(Boolean);
    return parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
};

function buildTreks(rawItems = getAdminItems("gt_treks")) {
  const source = rawItems.length > 0 ? rawItems : uniqueTreks;

  return source
    .filter((t) => t.active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
    .map((t) => {
      const fallbackGallery = [t.image, t.image, t.image].filter(Boolean);
      const gallery = parseGallery(t.imageGallery, fallbackGallery);
      return {
        ...normaliseItem(t),
        slug: t.slug || slugifyTrekName(t.name),
        image: gallery[0] || t.image,
        gallery,
        seasonalTag: t.seasonalTag || "New Listing",
        _sortOrder: Number(t.sortOrder ?? 999),
      };
    });
}

const DIFFICULTY_FILTERS = ["All", "Easy", "Medium", "Hard"];

/**
 * Returns true if a date string (e.g. "25 Sept 2025") is in the past.
 * Falls back to false on parse failures so old dates are never silently hidden.
 */
function isDateExpired(dateStr) {
  if (!dateStr) return false;
  try {
    // "25 Sept 2025" → normalise to "25 Sep 2025" (some browsers need this)
    const normalised = String(dateStr).replace(/sept/i, "Sep");
    const d = new Date(normalised);
    if (isNaN(d.getTime())) return false; // unparseable → show as-is
    return d < new Date();
  } catch {
    return false;
  }
}

const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Highest Rated", value: "rating" },
  { label: "Duration", value: "duration" },
];

function getDiscountPercent(original, current) {
  return Math.round(((original - current) / original) * 100);
}

function Trek() {
  const location = useLocation();
  const [showAllTreks, setShowAllTreks] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [treks, setTreks] = useState(() => buildTreks());
  const [isLoading, setIsLoading] = useState(() => buildTreks().length === 0);

  useEffect(() => {
    const syncLocal = () => setTreks(buildTreks());

    syncProductsFromApi("trek", "gt_treks")
      .then((items) => {
        if (!items) return;
        const mapped = buildTreks(items);
        if (mapped.length > 0) setTreks(mapped);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    window.addEventListener("storage", syncLocal);
    window.addEventListener("gt:storage-updated", syncLocal);
    return () => {
      window.removeEventListener("storage", syncLocal);
      window.removeEventListener("gt:storage-updated", syncLocal);
    };
  }, []);
  const initialVisibleTreks = 10;

  /* ── SEO ─────────────────────────────────────── */
  useEffect(() => {
    document.title =
      "Best Treks in Maharashtra 2025 | Weekend & Monsoon Treks Near Pune & Mumbai | Gadvede Trekkers";

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [key, val] = attr.split("=");
        el.setAttribute(key, val ?? attr);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    setMeta('meta[name="description"]', "name=description",
      "Book the best treks in Maharashtra for 2025. Monsoon treks, weekend treks, and fort treks near Pune & Mumbai. Kalsubai, Harihar, Harishchandragad, Rajmachi & more. Starting ₹799. Expert guides, safe batches, guaranteed departures.");
    setMeta('meta[name="keywords"]', "name=keywords",
      "treks in Maharashtra, weekend treks near Pune, monsoon treks Maharashtra, Kalsubai trek booking, Harihar trek, Harishchandragad trek, trekking near Mumbai 2025, Maharashtra trekking packages, one day treks Pune, Rajmachi trek, Sandhan Valley trek, Gadvede Trekkers");
    setMeta('meta[name="robots"]', "name=robots", "index, follow");
    setMeta('meta[property="og:title"]', "property=og:title",
      "Best Treks in Maharashtra 2025 | Gadvede Trekkers");
    setMeta('meta[property="og:description"]', "property=og:description",
      "Discover top-rated treks near Pune & Mumbai. Expert-led monsoon, weekend & fort treks starting ₹799. Book now!");
    setMeta('meta[property="og:type"]', "property=og:type", "website");
    setMeta('meta[name="twitter:card"]', "name=twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name=twitter:title",
      "Best Treks in Maharashtra 2025 | Gadvede Trekkers");

    /* canonical */
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://www.gadvede.com/treks";

    /* JSON-LD structured data */
    const existingLd = document.querySelector("#trek-jsonld");
    if (existingLd) existingLd.remove();
    const script = document.createElement("script");
    script.id = "trek-jsonld";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Best Treks in Maharashtra 2025",
      description:
        "Top-rated trekking experiences in Maharashtra including Kalsubai, Harihar, Harishchandragad and more, organized by Gadvede Trekkers.",
      url: "https://www.gadvede.com/treks",
      numberOfItems: treks.length,
      itemListElement: treks.map((trek, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "TouristAttraction",
          name: trek.name,
          description: `${trek.difficulty} level trek in ${trek.location}. Duration: ${trek.duration}. Altitude: ${trek.altitude}. Starting from ₹${trek.price}.`,
          address: {
            "@type": "PostalAddress",
            addressRegion: "Maharashtra",
            addressCountry: "IN",
          },
          offers: {
            "@type": "Offer",
            price: trek.price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: trek.rating,
            bestRating: "5",
            reviewCount: trek.reviews,
          },
        },
      })),
    });
    document.head.appendChild(script);

    return () => {
      document.querySelector("#trek-jsonld")?.remove();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    if (location.state) window.history.replaceState({}, document.title);
  }, [location.state]);

  /* ── Counts per difficulty ────────────────────── */
  const difficultyCounts = useMemo(() => {
    const counts = { All: treks.length };
    DIFFICULTY_FILTERS.slice(1).forEach((d) => {
      counts[d] = treks.filter((t) => t.difficulty === d).length;
    });
    return counts;
  }, [treks]);

  /* ── Filtered + sorted treks ─────────────────── */
  const isSearchActive = searchQuery.trim().length >= 3;
  const filteredTreks = useMemo(() => {
    let result = [...treks];
    if (activeFilter !== "All") {
      result = result.filter((t) => t.difficulty === activeFilter);
    }
    if (isSearchActive) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) =>
        t.name?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.difficulty?.toLowerCase().includes(q) ||
        t.duration?.toLowerCase().includes(q) ||
        t.region?.toLowerCase().includes(q) ||
        t.state?.toLowerCase().includes(q) ||
        t.seasonalTag?.toLowerCase().includes(q) ||
        t.tags?.toLowerCase().includes(q)
      );
    }
    if (activeSort === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (activeSort === "price-desc") result.sort((a, b) => b.price - a.price);
    else if (activeSort === "rating") result.sort((a, b) => b.rating - a.rating);
    else result.sort((a, b) => Number(a._sortOrder ?? 999) - Number(b._sortOrder ?? 999));
    return result;
  }, [treks, activeFilter, activeSort, searchQuery]);

  const visibleTreks = showAllTreks
    ? filteredTreks
    : filteredTreks.slice(0, initialVisibleTreks);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowAllTreks(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowAllTreks(false);
  };

  /* ── Hero stats ─────────────────────────────── */
  const heroStats = [
    { value: `${treks.length}+`, label: "Treks Listed" },
    { value: "8+", label: "Destinations" },
    { value: "5000+", label: "Happy Trekkers" },
    { value: "4.8★", label: "Avg Rating" },
  ];

  return (
    <section className="trek-page" aria-label="Maharashtra Trek Listings">
      <div className="container-fluid trek-page-shell py-4 py-md-5">

        {/* ── HERO ─────────────────────────────────── */}
        <header className="trek-hero" role="banner">
          <div className="trek-hero-copy">
            <span className="trek-kicker">Maharashtra Trekking Escapes</span>
            <h1 className="trek-heading">
              Best Treks In Maharashtra For{" "}
              <span className="trek-heading-highlight">Monsoon</span>,{" "}
              <span className="trek-heading-highlight trek-heading-highlight-alt">
                Weekend
              </span>
              , And{" "}
              <span className="trek-heading-highlight">Adventure</span> Lovers
            </h1>
            <p className="trek-subheading">
              Discover scenic forts, waterfall trails, jungle routes, and
              bestselling hiking experiences near Pune, Mumbai, Nashik, and
              Bhandardara.
            </p>

            {/* Stats Strip */}
            <div className="trek-stats-strip">
              {heroStats.map((stat) => (
                <div className="trek-stat-item" key={stat.label}>
                  <span className="trek-stat-value">{stat.value}</span>
                  <span className="trek-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

        </header>

        {/* ── SEARCH BAR ────────────────────────────── */}
        <div style={{ padding: "0 0 8px" }}>
          <div style={{ position: "relative", maxWidth: 440 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8", pointerEvents: "none" }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search treks — enter at least 3 letters…"
              aria-label="Search treks"
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                border: "1.5px solid",
                borderColor: isSearchActive ? "#16a34a" : "#e2e8f0",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                background: "#fff",
                boxShadow: isSearchActive ? "0 0 0 3px rgba(22,163,74,0.12)" : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowAllTreks(false); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                aria-label="Clear search"
              >×</button>
            )}
          </div>
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, paddingLeft: 2 }}>
              Type {3 - searchQuery.length} more letter{3 - searchQuery.length !== 1 ? "s" : ""} to search…
            </div>
          )}
        </div>

        {/* ── FILTER + SORT BAR ────────────────────── */}
        <div className="trek-filter-bar" role="navigation" aria-label="Filter treks">
          <div className="trek-filter-tabs">
            {DIFFICULTY_FILTERS.map((filter) => (
              <button
                key={filter}
                className={`trek-filter-tab${activeFilter === filter ? " active" : ""}`}
                onClick={() => handleFilterChange(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
                <span className="trek-filter-count">
                  {difficultyCounts[filter]}
                </span>
              </button>
            ))}
          </div>

          <div className="trek-sort-wrapper">
            <label className="trek-sort-label" htmlFor="trek-sort">
              Sort by
            </label>
            <select
              id="trek-sort"
              className="trek-sort-select"
              value={activeSort}
              onChange={(e) => {
                setActiveSort(e.target.value);
                setShowAllTreks(false);
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── RESULTS META ─────────────────────────── */}
        <p className="trek-results-meta" aria-live="polite">
          {isSearchActive
            ? <>Search: <strong>"{searchQuery}"</strong> — <strong>{filteredTreks.length}</strong> result{filteredTreks.length !== 1 ? "s" : ""} found</>
            : <>Showing <strong>{visibleTreks.length}</strong> of{" "}
              <strong>{filteredTreks.length}</strong>{" "}
              {activeFilter !== "All" ? `${activeFilter} ` : ""}treks</>
          }
        </p>

        {/* ── TREK GRID ────────────────────────────── */}
        <div className="trek-grid" role="list" aria-label="Available treks">
          {visibleTreks.map((trek, index) => {
            const discountPct = getDiscountPercent(trek.originalPrice, trek.price);
            const isPopular = trek.reviews >= 200;
            return (
              <article
                className="trek-card"
                key={trek.name}
                data-difficulty={trek.difficulty}
                style={{ animationDelay: `${index * 0.05}s` }}
                itemScope
                itemType="https://schema.org/TouristAttraction"
                role="listitem"
              >
                <div className="trek-card-media">
                  {/* Season tag */}
                  <span className="trek-season-tag">{trek.seasonalTag}</span>

                  {/* Discount badge */}
                  {discountPct > 0 && (
                    <span className="trek-discount-badge" aria-label={`${discountPct}% off`}>
                      {discountPct}% OFF
                    </span>
                  )}

                  {/* Popular badge */}
                  {isPopular && (
                    <span className="trek-popular-badge">🔥 Popular</span>
                  )}

                  <div className="trek-gallery">
                    {trek.gallery.map((image, imageIndex) => (
                      <img
                        key={`${trek.name}-${imageIndex}`}
                        src={image}
                        alt={`${trek.name} trek in ${trek.location} - view ${imageIndex + 1}`}
                        className="trek-gallery-image"
                        loading={index < 5 ? "eager" : "lazy"}
                        itemProp="image"
                      />
                    ))}
                  </div>

                  <div className="trek-gallery-dots" aria-hidden="true">
                    {trek.gallery.map((_, imageIndex) => (
                      <span
                        key={`${trek.name}-dot-${imageIndex}`}
                        className="trek-gallery-dot"
                      />
                    ))}
                  </div>

                  {/* Hover quick-action overlay */}
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
                      <h2 className="trek-card-title" itemProp="name">
                        {trek.name}
                      </h2>
                      <p className="trek-location" itemProp="address">
                        📍 {trek.location}
                      </p>
                    </div>

                    <div className="trek-rating" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                      <span className="trek-rating-star" aria-hidden="true">★</span>
                      <span itemProp="ratingValue">{trek.rating.toFixed(1)}</span>
                      <span className="trek-rating-count" itemProp="reviewCount">
                        ({trek.reviews})
                      </span>
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
                    <span className="trek-current-price" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                      <span itemProp="price">₹{trek.price}</span>
                      <meta itemProp="priceCurrency" content="INR" />
                    </span>
                    <span className="trek-starting-text">per person</span>
                  </div>

                  <div className="trek-next-date">
                    {isDateExpired(trek.nextDate) ? (
                      <>
                        <span className="trek-next-label">📅</span>
                        <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.85em" }}>
                          Contact for next dates
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="trek-next-label">📅 Next</span>
                        <span>{trek.nextDate}</span>
                      </>
                    )}
                  </div>

                  <div className="trek-card-actions" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <BookingCTA trek={trek} className="trek-primary-btn" style={{ flex: 1 }}>
                        <WhatsAppIcon />
                        Book on WhatsApp
                      </BookingCTA>
                      <Link
                        to={`/treks/${slugifyTrekName(trek.name)}`}
                        className="trek-secondary-btn"
                        style={{ flex: 1 }}
                      >
                        Details
                        <ArrowRightIcon />
                      </Link>
                    </div>
                    <button
                      type="button"
                      disabled={!trek.itineraryPdfUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        if (trek.itineraryPdfUrl) {
                          const link = document.createElement('a');
                          link.href = trek.itineraryPdfUrl;
                          link.download = `${trek.name.replace(/[^a-z0-9]/gi, '-')}-itinerary.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      className={`trek-tertiary-btn${trek.itineraryPdfUrl ? "" : " is-disabled"}`}
                      style={{ width: "100%" }}
                      title={trek.itineraryPdfUrl ? "Download Itinerary PDF" : "Itinerary coming soon"}
                    >
                      <DownloadIcon />
                      Download Itinerary
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── LOADING SKELETON ─────────────────────── */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 24 }}>
            <ProductCardSkeleton count={6} />
          </div>
        )}

        {/* ── NO RESULTS ───────────────────────────── */}
        {!isLoading && filteredTreks.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            margin: "16px 0",
            boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🏔️</div>
            {isSearchActive ? (
              <>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", marginBottom: 8 }}>
                  No treks found for "{searchQuery}"
                </div>
                <div style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 6, maxWidth: 420, margin: "0 auto 20px" }}>
                  Currently, this trek is not listed. We may add it in the future.
                  <br />
                  If you'd like a customised trek to this destination, please contact us.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", marginBottom: 8 }}>
                  No {activeFilter !== "All" ? activeFilter : ""} treks found
                </div>
                <div style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: 20 }}>
                  Try a different difficulty level or clear your filters.
                </div>
              </>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 8 }}>
              {isSearchActive && (
                <a
                  href={`https://wa.me/919856112727?text=${encodeURIComponent(`Hi! I'm looking for a customised trek to "${searchQuery}". Can you help?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#16a34a", color: "#fff", border: "none",
                    borderRadius: 10, padding: "10px 22px",
                    fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  🎒 Request Custom Trek
                </a>
              )}
              <a
                href="/contact"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "transparent", color: "#16a34a",
                  border: "1.5px solid #16a34a",
                  borderRadius: 10, padding: "10px 22px",
                  fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                📞 Contact Us
              </a>
              <button
                onClick={() => { setSearchQuery(""); setActiveFilter("All"); }}
                style={{
                  background: "#f1f5f9", color: "#334155", border: "none",
                  borderRadius: 10, padding: "10px 22px",
                  fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                }}
              >
                ✕ Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* ── SHOW MORE / LESS ─────────────────────── */}
        {filteredTreks.length > initialVisibleTreks && (
          <div className="trek-grid-toggle">
            <button
              className="btn trek-primary-btn trek-toggle-btn"
              onClick={() => setShowAllTreks((c) => !c)}
            >
              {showAllTreks
                ? `Show Less`
                : `View All ${filteredTreks.length} Treks`}
            </button>
          </div>
        )}

        {/* ── SEO TEXT BLOCK ───────────────────────── */}
        <section className="trek-seo-block" aria-label="About Maharashtra trekking">
          <h2>Why Choose Gadvede Trekkers for Maharashtra Treks?</h2>
          <p>
            Gadvede Trekkers offers the best-curated trekking experiences across
            Maharashtra — from the mighty <strong>Kalsubai Peak</strong> (highest
            in Maharashtra) to the iconic <strong>Harihar Fort</strong> with its
            near-vertical rock-cut steps. Whether you're planning a{" "}
            <strong>one-day trek near Pune</strong>, a{" "}
            <strong>monsoon waterfall trek near Mumbai</strong>, or an{" "}
            <strong>overnight camping adventure</strong> in Bhandardara, we have
            you covered with expert local guides, safe group batches, and
            guaranteed departures.
          </p>
          <div className="trek-seo-tags">
            {[
              "Treks Near Pune",
              "Treks Near Mumbai",
              "Monsoon Treks Maharashtra",
              "Weekend Treks 2025",
              "Fort Treks Maharashtra",
              "Waterfall Treks",
              "One Day Treks",
              "Overnight Camping",
            ].map((tag) => (
              <span className="trek-seo-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default Trek;
