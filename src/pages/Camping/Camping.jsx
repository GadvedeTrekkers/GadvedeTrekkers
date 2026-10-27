import { useEffect, useMemo, useState } from "react";
import { FALLBACK_IMAGE, handleImageError } from "../../utils/imageFallback";
import { Link, useLocation } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { getPrimaryCampingImage, parseJsonValue } from "../../data/campingDetailsData";
import { selectPublicTrips } from "../../data/publicTrips";
import { syncProductsFromApi } from "../../api/getAll";
import BookingCTA from "../../components/BookingCTA";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";

const TYPE_FILTERS = ["All", "Beach", "Lake", "Forest", "Mountain", "Hill", "Farm"];

function parseDates(value, depth = 0) {
  // Admin saves can double-encode nextDates (e.g. ['["25 Mar, 4:00 PM"]']); unwrap nested JSON arrays.
  if (Array.isArray(value)) {
    return depth > 8 ? value.filter(Boolean) : value.flatMap((entry) => parseDates(entry, depth + 1));
  }
  if (typeof value === "string" && value.trim().startsWith("[") && depth <= 8) {
    return parseDates(parseJsonValue(value, []), depth + 1);
  }

  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Camping() {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("popular");
  const [campingItems, setCampingItems] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = "Camping | Group Discount Available | Starting From Rs 1000 | Gadvede Trekkers";
    if (location.state) window.history.replaceState({}, document.title);
  }, [location.state]);

  useEffect(() => {
    const buildItems = (rawItems) =>
      rawItems
        .filter((item) => item.active !== false)
        .map((item) => ({
          ...normaliseItem(item),
          image: getPrimaryCampingImage(item),
          nextDates: parseDates(item.nextDates),
        }));

    // Real camping products (product_type=camping) are listed as-is; selectPublicTrips is the
    // 4-slug Home/Treks allowlist and would drop every admin-created camp. It is used here only
    // to pick up the NYE listing that is stored as a trek.
    const publicCamps = (camps, treks) => {
      const liveCamps = (camps || []).filter(
        (item) =>
          item &&
          item.slug &&
          item.active !== false &&
          String(item.productType || item.product_type || "camping").toLowerCase() === "camping"
      );
      const nyeTrek = selectPublicTrips(treks || []).filter(
        (item) => item.slug === "new-year-beach-side-camping"
      );
      const seen = new Set();
      return [...nyeTrek, ...liveCamps].filter((item) => {
        if (seen.has(item.slug)) return false;
        seen.add(item.slug);
        return true;
      });
    };

    // saveAdminItems() fires a key-less synthetic "storage" event on every product sync
    // (tours, rentals, villas... from other components). Re-reading gt_camping then wipes the
    // API result whenever the camping cache failed to persist (QuotaExceededError on large
    // payloads), which shows "0 of 0 camps". Only react to real cross-tab events for our keys.
    const sync = (event) => {
      if (!event || !["gt_camping", "gt_treks"].includes(event.key)) return;
      setCampingItems(
        buildItems(publicCamps(getAdminItems("gt_camping"), getAdminItems("gt_treks")))
      );
    };

    Promise.all([
      syncProductsFromApi("camping", "gt_camping").catch(() => []),
      syncProductsFromApi("trek", "gt_treks").catch(() => []),
    ])
      .then(([camps, treks]) => setCampingItems(buildItems(publicCamps(camps, treks))))
      .catch(() => {});
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const filtered = useMemo(() => {
    return [...campingItems]
      .filter((site) => activeFilter === "All" || site.type === activeFilter)
      .sort((a, b) => {
        if (activeSort === "price-asc") return a.price - b.price;
        if (activeSort === "price-desc") return b.price - a.price;
        const aOrder = Number(a.sortOrder) || 9999;
        const bOrder = Number(b.sortOrder) || 9999;
        return aOrder - bOrder;
      });
  }, [campingItems, activeFilter, activeSort]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)", padding: "56px 0 44px", color: "#fff" }}>
        <div className="container">
          <nav style={{ fontSize: "0.78rem", marginBottom: 20, opacity: 0.85, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Link to="/" style={{ color: "#6ee7b7", textDecoration: "none", fontWeight: 600 }}>Home</Link>
            <span>›</span>
            <span style={{ color: "rgba(255,255,255,0.75)" }}>Events</span>
            <span>›</span>
            <span style={{ color: "#fff" }}>Camping</span>
          </nav>

          <div style={{ marginBottom: 16 }}>
            <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "5px 18px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              ⛺ Admin Synced Camping Collection
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
            Camping Near Mumbai & Pune
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.9, maxWidth: 760, lineHeight: 1.8, marginBottom: 0 }}>
            This page now reads from the same campsite data structure used in admin, so listing cards and detail pages stay aligned. Add or edit a campsite in backend and the same content appears here in the same format.
          </p>
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 90, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: "6px 18px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  transition: "all 0.2s",
                  border: activeFilter === filter ? "none" : "1px solid #d1d5db",
                  background: activeFilter === filter ? "#059669" : "#f9fafb",
                  color: activeFilter === filter ? "#fff" : "#374151",
                }}
              >
                {filter}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>
              Showing {filtered.length} of {campingItems.length} camps
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>Sort by</span>
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", fontSize: "0.82rem", background: "#fff", cursor: "pointer" }}
              >
                <option value="popular">Recommended</option>
                <option value="price-asc">Lowest Price</option>
                <option value="price-desc">Highest Price</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⛺</div>
            <p>No camping listings available for this filter yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {filtered.map((site) => {
              const nextDates = site.nextDates || [];
              const slug = site.slug || site.id;
              return (
                <div
                  key={site.id || site.name}
                  style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb", transition: "transform 0.3s ease, box-shadow 0.25s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.13)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)";
                  }}
                >
                  <div style={{ position: "relative", overflow: "hidden" }}>
                    <img src={site.image || FALLBACK_IMAGE} alt={site.shortName || site.name} loading="lazy" onError={handleImageError} style={{ width: "100%", aspectRatio: "4 / 3", height: "auto", objectFit: "cover", display: "block", background: "#d9efe3" }} />
                    <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.55)", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                      {site.type}
                    </span>
                    {site.badge ? (
                      <span style={{ position: "absolute", top: 12, right: 12, background: "#059669", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 }}>
                        {site.badge}
                      </span>
                    ) : null}
                    {site.originalPrice ? (
                      <span style={{ position: "absolute", bottom: 12, left: 12, background: "#dc2626", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 }}>
                        {Math.max(0, Math.round((1 - site.price / site.originalPrice) * 100))}% OFF
                      </span>
                    ) : null}
                  </div>

                  <div style={{ padding: "18px 18px 20px" }}>
                    <h5 style={{ fontWeight: 700, fontSize: "0.98rem", color: "#111827", marginBottom: 4, lineHeight: 1.35 }}>
                      {site.shortName || site.name}
                    </h5>
                    <p style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 8 }}>📍 {site.location}</p>
                    <p style={{ fontSize: "0.83rem", color: "#374151", lineHeight: 1.55, marginBottom: 12 }}>
                      {site.description || "Camping experience details will appear here once updated from admin."}
                    </p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 10px", fontSize: "0.73rem", fontWeight: 600 }}>
                        ⏱ {site.duration}
                      </span>
                      {site.coupon ? (
                        <span style={{ background: "#fefce8", color: "#854d0e", border: "1px solid #fde047", borderRadius: 6, padding: "2px 10px", fontSize: "0.73rem", fontWeight: 600 }}>
                          🎟 {site.coupon}
                        </span>
                      ) : null}
                      <span
                        style={{
                          background: String(site.availability || "").toLowerCase().includes("available") ? "#dcfce7" : "#f3f4f6",
                          color: String(site.availability || "").toLowerCase().includes("available") ? "#166534" : "#6b7280",
                          border: `1px solid ${String(site.availability || "").toLowerCase().includes("available") ? "#86efac" : "#d1d5db"}`,
                          borderRadius: 6,
                          padding: "2px 10px",
                          fontSize: "0.73rem",
                          fontWeight: 600,
                        }}
                      >
                        {site.availability || "Available"}
                      </span>
                    </div>

                    {nextDates.length > 0 ? (
                      <p style={{ fontSize: "0.77rem", color: "#6b7280", marginBottom: 12 }}>
                        📅 {nextDates.slice(0, 3).join(", ")}
                      </p>
                    ) : null}

                    <div style={{ marginTop: 8 }}>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669" }}>₹{site.price.toLocaleString("en-IN")}</span>
                        {site.originalPrice ? (
                          <span style={{ fontSize: "0.78rem", color: "#9ca3af", textDecoration: "line-through", marginLeft: 6 }}>
                            ₹{site.originalPrice.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                        <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: 4 }}>/person</span>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <BookingCTA
                          trek={{
                            name: site.shortName || site.name,
                            price: site.price,
                            location: site.location,
                            productType: "camping",
                            nextDate: nextDates[0] || "",
                          }}
                          label="Book Now"
                          style={{ background: "#059669", color: "#fff", padding: "8px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.83rem", textDecoration: "none", flex: 1, textAlign: "center", minHeight: 44 }}
                        />
                        <Link
                          to={`/camping/${slug}`}
                          style={{ background: "#fff", color: "#059669", padding: "8px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.83rem", textDecoration: "none", border: "1px solid #059669", flex: 1, textAlign: "center" }}
                        >
                          View Details
                        </Link>
                        <a
                          href={createWhatsAppInquiryUrl({
                            packageName: site.shortName || site.name,
                            location: site.location,
                            category: "Camping",
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
