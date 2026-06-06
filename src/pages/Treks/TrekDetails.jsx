import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { findTrekBySlug, slugifyTrekName } from "../../data/treks";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";
import { richTrekDetails } from "../../data/richTrekDetails";
import { getTrekDates } from "../../data/trekDatesStorage";
import BookingCTA from "../../components/BookingCTA";
import { buildShareWhatsAppUrl } from "../../config/bookingConfig";
import { productService } from "../../services/product.service";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "gallery", label: "Photo Gallery" },
  { id: "itinerary", label: "Itinerary" },
  { id: "details", label: "Details & Cost" },
];

const parseJsonValue = (value, fallback) => {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const parseLineItems = (value = "") =>
  String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const parseDiscountItems = (value = "") =>
  parseLineItems(value).map((line) => {
    const [code, desc] = line.split("|");
    return { code: code || line, desc: desc || "" };
  });

const normaliseRouteKey = (city) =>
  String(city || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "");

const parseDeparturePlanItineraries = (departurePlans) =>
  Object.fromEntries(
    Object.entries(parseJsonValue(departurePlans, {})).map(([city, plan]) => {
      const key = normaliseRouteKey(city);
      const lines = parseLineItems(plan?.itinerary || "");
      const events = lines.map((line) => {
        const parts = line.split("|");
        if (parts.length >= 3) {
          return { time: parts[1].trim(), desc: parts.slice(2).join("|").trim() };
        }
        if (parts.length === 2) {
          return { time: parts[0].trim(), desc: parts[1].trim() };
        }
        return { time: "", desc: parts[0].trim() };
      });
      return [
        key,
        {
          label: `From ${city}`,
          sublabel: `${city} Route`,
          icon: city === "Kasara" ? "🚂" : "🚌",
          note: `${city} departure itinerary`,
          days: [{ title: `${city} Departure`, events }],
        },
      ];
    })
  );

const parsePlaces = (value = "") =>
  parseLineItems(value).map((item) => {
    const [name, desc] = item.split("|");
    return { icon: "📍", name: (name || item).trim(), desc: (desc || "").trim() };
  });

const createWhatsappHref = (trek) =>
  createWhatsAppInquiryUrl({
    packageName: trek.name,
    location: trek.location,
    category: "Trek",
  });

function TrekDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remoteTrek, setRemoteTrek] = useState(null);
  const previewDraft =
    typeof window !== "undefined" ? sessionStorage.getItem("gt_trek_preview") : null;
  const previewItem = parseJsonValue(previewDraft, null);
  const previewSlug = previewItem?.name ? slugifyTrekName(previewItem.name) : "";
  const adminMatch = getAdminItems("gt_treks").find((item) => slugifyTrekName(item.name || "") === id);

  const buildLocalTrek = (item) => {
    const fallbackGallery = [item.image, item.image, item.image].filter(Boolean);
    const gallery = parseJsonValue(item.imageGallery, fallbackGallery);
    return { ...normaliseItem(item), image: gallery[0] || item.image, gallery };
  };

  const adminTrek = adminMatch ? buildLocalTrek(adminMatch) : null;
  const previewTrek = previewItem && previewSlug === id ? buildLocalTrek(previewItem) : null;
  const trek = previewTrek || remoteTrek || adminTrek || (id ? findTrekBySlug(id) : null);
  const staticRichTrek = trek?.name ? richTrekDetails[trek.name] || null : null;
  const isRich = !!(staticRichTrek || adminTrek || previewTrek);
  const adminItineraryKeys =
    adminTrek || previewTrek ? Object.keys(parseDeparturePlanItineraries(trek?.departurePlans)) : [];
  const staticItineraryKeys = Object.keys(staticRichTrek?.itineraries || {});
  const defaultItineraryKey = adminItineraryKeys[0] || staticItineraryKeys[0] || "kasara";

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingDates = trek
    ? (
        parseJsonValue(trek.trekDateBatches, []).length > 0
          ? parseJsonValue(trek.trekDateBatches, [])
          : getTrekDates(slugifyTrekName(trek.name))
      ).filter((d) => d.date >= todayStr)
    : [];

  const [activeTab, setActiveTab] = useState("overview");
  const [activeItinerary, setActiveItinerary] = useState(defaultItineraryKey);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  /* ── Date selection for WhatsApp booking message ──────────── */
  const [selectedBookingDate, setSelectedBookingDate] = useState(
    upcomingDates.length > 0 ? upcomingDates[0].date : null
  );

  /* ── Referral code from URL ?ref= param ──────────────────── */
  const location = useLocation();

  useEffect(() => {
    setRemoteTrek(null);
    if (!id || previewSlug === id) return;

    const syncLocal = () => {
      const latestLocal = getAdminItems("gt_treks").find((item) => slugifyTrekName(item.name || "") === id);
      if (latestLocal) {
        setRemoteTrek(buildLocalTrek(latestLocal));
      }
    };

    productService
      .getBySlug(id)
      .then((item) => {
        if (item) setRemoteTrek(buildLocalTrek(item));
      })
      .catch(() => {});

    window.addEventListener("storage", syncLocal);
    return () => window.removeEventListener("storage", syncLocal);
  }, [id, previewSlug]);
  const referralCode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("ref") || "";
  }, [location.search]);

  /* Persist referral code in localStorage so booking form can auto-fill it */
  useEffect(() => {
    if (referralCode) {
      localStorage.setItem("gt_ref_code", referralCode);
    }
  }, [referralCode]);

  /* Canonical referral URL for this trek */
  const trekSlugForRef = trek ? slugifyTrekName(trek.name) : "";
  const referralUrl = useMemo(() => {
    const base = `https://www.gadvede.com/treks/${trekSlugForRef}`;
    return referralCode ? `${base}?ref=${referralCode}` : base;
  }, [trekSlugForRef, referralCode]);

  const downloadItinerary = () => {
    if (!trek) return;
    
    // If trek has itineraryPdfUrl, download that PDF directly
    if (trek.itineraryPdfUrl) {
      const link = document.createElement('a');
      link.href = trek.itineraryPdfUrl;
      link.download = `${trek.name.replace(/[^a-z0-9]/gi, '-')}-itinerary.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    // Otherwise, generate HTML itinerary for printing
    const css = `body{font-family:Arial,sans-serif;max-width:820px;margin:0 auto;padding:32px;color:#1a1a1a}
      h1{color:#0a6a47;font-size:2rem;margin-bottom:4px}
      h2{color:#0a6a47;margin-top:28px;font-size:0.95rem;text-transform:uppercase;letter-spacing:.08em;border-bottom:2px solid #d5f6e4;padding-bottom:6px}
      h3{color:#065f46;font-size:0.88rem;margin-top:16px;margin-bottom:6px}
      hr{border:none;border-top:2px solid #d5f6e4;margin:20px 0}
      ul{padding-left:20px;line-height:2}
      .stats{display:flex;flex-wrap:wrap;gap:0;border:1px solid #d5f6e4;border-radius:8px;margin:12px 0 20px;overflow:hidden}
      .stat{padding:10px 18px;font-size:.9rem;border-right:1px solid #d5f6e4;font-weight:600}
      .stat span{display:block;font-size:.72rem;color:#6b7280;font-weight:400}
      .highlight-list{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding-left:0;list-style:none}
      .highlight-list li{background:#f0fdf4;border:1px solid #d5f6e4;border-radius:6px;padding:8px 12px;font-size:.88rem}
      .place{margin-bottom:10px}
      .place strong{color:#065f46}
      .day-title{background:#d5f6e4;border-left:5px solid #0a8456;padding:10px 14px;font-weight:800;border-radius:8px;margin-bottom:6px;font-size:.9rem}
      .event{display:flex;gap:16px;padding:5px 4px;border-bottom:1px solid #eef4f0;font-size:.88rem}
      .event-time{color:#0a6a47;font-weight:700;min-width:90px;flex-shrink:0}
      .inc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
      .carry-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 16px;list-style:none;padding-left:0}
      .carry-grid li{background:#f6fbf8;border:1px solid #e3efe8;border-radius:6px;padding:6px 10px;font-size:.84rem}
      .discount{background:#f0fdf4;border:1px solid #d5f6e4;border-radius:8px;padding:10px 14px;margin-bottom:8px}
      .discount-code{font-weight:900;letter-spacing:1px;color:#065f46}
      @media print{body{padding:16px}.highlight-list,.inc-grid,.carry-grid{break-inside:avoid}}`;

    const allRoutes = Object.entries(itineraries).map(([key, route]) => {
      const rows = (route?.days || []).map((day) =>
        `<div class="day-title">${day.title}</div>${
          (day.events || []).map((ev) => `<div class="event"><span class="event-time">${ev.time || ""}</span><span>${ev.desc}</span></div>`).join("")
        }`
      ).join("<br>");
      return `<h3>${route?.label || key}</h3>${rows || "<p style='color:#888'>No events listed.</p>"}`;
    }).join("<br>");

    const highlightItems = highlights.map((h) => `<li>${h.icon || "✨"} ${h.text}</li>`).join("");
    const placeItems = placesToVisit.map((p) => `<div class="place"><strong>${p.icon || "📍"} ${p.name}</strong>${p.desc ? `<br><span style="color:#4b5563;font-size:.85rem">${p.desc}</span>` : ""}</div>`).join("");
    const incList = includedItems.map((i) => `<li>${i}</li>`).join("");
    const excList = excludedItems.map((i) => `<li>${i}</li>`).join("");
    const carryList = carryItems.map((i) => `<li>${i}</li>`).join("");
    const discountItems = discountCodes.map((d) => `<div class="discount"><span class="discount-code">${d.code}</span> &nbsp; <span style="color:#374151">${d.desc}</span></div>`).join("");
    const aboutText = [overview.intro, ...(overview.sections || []).map((s) => `<strong>${s.title}</strong><br>${s.body}`)].filter(Boolean).join("<br><br>");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${trek.name} — Full Details</title><style>${css}</style></head><body>
      <p style="color:#6b7280;font-size:.8rem;margin-bottom:4px">Gadvede Trekkers &nbsp;·&nbsp; gadvedetrekkers.com</p>
      <h1>${trek.name}</h1>
      ${trek.subtitle ? `<p style="color:#4b5563;font-size:1rem;margin-top:4px">${trek.subtitle}</p>` : ""}
      <div class="stats">
        ${trek.location ? `<div class="stat"><span>Location</span>${trek.location}</div>` : ""}
        ${trek.difficulty ? `<div class="stat"><span>Difficulty</span>${trek.difficulty}</div>` : ""}
        ${trek.altitude ? `<div class="stat"><span>Altitude</span>${trek.altitude}</div>` : ""}
        ${trek.duration ? `<div class="stat"><span>Duration</span>${trek.duration}</div>` : ""}
        ${trek.baseVillage ? `<div class="stat"><span>Base Village</span>${trek.baseVillage}</div>` : ""}
        ${trek.price ? `<div class="stat"><span>Price</span>From ₹${trek.price}</div>` : ""}
      </div>
      <hr>
      ${aboutText ? `<h2>About</h2><p style="line-height:1.75;color:#374151">${aboutText}</p>` : ""}
      ${history ? `<h2>History & Background</h2><p style="line-height:1.75;color:#374151">${history}</p>` : ""}
      ${highlightItems ? `<h2>Trek Highlights</h2><ul class="highlight-list">${highlightItems}</ul>` : ""}
      ${placeItems ? `<h2>Places to Visit</h2>${placeItems}` : ""}
      <hr>
      <h2>Itinerary</h2>${allRoutes || "<p style='color:#888'>Itinerary details coming soon.</p>"}
      <hr>
      ${(incList || excList) ? `<h2>Inclusions & Exclusions</h2><div class="inc-grid"><div><h3>What's Included</h3><ul>${incList}</ul></div><div><h3>Not Included</h3><ul>${excList}</ul></div></div>` : ""}
      ${carryList ? `<h2>Things to Carry</h2><ul class="carry-grid">${carryList}</ul>` : ""}
      ${discountItems ? `<h2>Offers & Discount Codes</h2>${discountItems}` : ""}
      <hr><p style="color:#888;font-size:0.78rem;margin-top:24px">Generated by Gadvede Trekkers · gadvedetrekkers.com · Printed on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      <script>window.onload=()=>{window.print()}</script></body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!staticRichTrek?.meta) return;
    document.title = staticRichTrek.meta.title;
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta("description", staticRichTrek.meta.description);
    setMeta("keywords", staticRichTrek.meta.keywords);
  }, [staticRichTrek]);

  useEffect(() => {
    setCurrentHeroSlide(0);
    setActiveItinerary(defaultItineraryKey);
  }, [trek?.name, defaultItineraryKey]);

  useEffect(() => {
    if (!trek?.gallery?.length || trek.gallery.length < 2) return undefined;
    const timer = window.setInterval(
      () => setCurrentHeroSlide((prev) => (prev + 1) % trek.gallery.length),
      3200
    );
    return () => window.clearInterval(timer);
  }, [trek?.gallery]);

  const formattedName =
    trek?.name ?? (id ? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trek Details");
  const heroImages = trek?.gallery?.length ? trek.gallery.slice(0, 3) : [];

  if (!isRich) {
    return (
      <div className="td-page">
        {trek ? (
          <>
            <div className="td-hero">
              <div className="td-hero-slides">
                {heroImages.map((image, index) => (
                  <div
                    key={`${trek.name}-basic-hero-${index}`}
                    className={`td-hero-slide${index === currentHeroSlide ? " is-active" : ""}`}
                    style={{ backgroundImage: `url(${image})` }}
                  />
                ))}
              </div>
              <div className="td-hero-overlay" />
              <div className="td-hero-content container-fluid td-shell">
                <button onClick={() => navigate(-1)} className="td-back-btn">← Back</button>
                <span className="td-kicker">🥾 Maharashtra Trek Experience</span>
                <h1 className="td-heading">{formattedName}</h1>
                <p className="td-subheading">{trek.location} · {trek.duration} · {trek.altitude}</p>
                <div className="td-stats-bar">
                  {[
                    { icon: "📍", label: trek.location },
                    { icon: "⏱", label: trek.duration },
                    { icon: "🏔", label: trek.altitude },
                    { icon: "⚡", label: trek.difficulty },
                    { icon: "⭐", label: `${trek.rating} (${trek.reviews} reviews)` },
                    { icon: "💰", label: `From ₹${trek.price}` },
                  ].map((stat) => (
                    <div className="td-stat" key={stat.label}>
                      <span className="td-stat-icon">{stat.icon}</span>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
                <div className="td-hero-actions">
                  <BookingCTA trek={trek} selectedDate={selectedBookingDate} className="btn td-book-btn" label={`Book on WhatsApp — ₹${trek.price}`} />
                  <button className="btn td-itinerary-btn" onClick={downloadItinerary} style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)" }}>Itinerary</button>
                  <button className="btn td-itinerary-btn" onClick={() => setActiveTab("gallery")}>View Photos</button>
                </div>
              </div>
            </div>
            {upcomingDates.length > 0 && (
              <div className="container-fluid td-shell py-4">
                <div className="td-card td-dates-card">
                  <h3 className="td-section-title">📅 Upcoming Departures</h3>
                  <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: 12 }}>
                    Select a date below, then tap <strong>Book on WhatsApp</strong> — we'll confirm your spot instantly.
                  </p>
                  <div className="td-dates-list">
                    {upcomingDates.map((d) => {
                      const displayDate = new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      const isSelected = selectedBookingDate === d.date;
                      return (
                        <div
                          key={d.id}
                          className="td-date-row"
                          style={{
                            cursor: "pointer",
                            borderColor: isSelected ? "#16a34a" : undefined,
                            background: isSelected ? "#f0fdf4" : undefined,
                          }}
                          onClick={() => setSelectedBookingDate(d.date)}
                        >
                          <div className="td-date-info">
                            <input
                              type="radio"
                              name="bookingDate"
                              value={d.date}
                              checked={isSelected}
                              onChange={() => setSelectedBookingDate(d.date)}
                              style={{ accentColor: "#16a34a", marginRight: 8 }}
                            />
                            <span className="td-date-text">{displayDate}</span>
                            {d.label && <span className="td-date-badge">{d.label}</span>}
                          </div>
                          <BookingCTA
                            trek={trek}
                            selectedDate={d.date}
                            className="td-date-book-btn"
                            label="Book on WhatsApp"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="container-fluid td-shell py-4">
              <div className="td-card">
                <h2 className="td-section-title">Photo Gallery</h2>
                <div className="td-gallery-grid">
                  {trek.gallery?.map((img, index) => (
                    <div
                      className="td-gallery-item"
                      key={index}
                      onClick={() => setLightboxImg(img)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setLightboxImg(img)}
                    >
                      <img src={img} alt={`${trek.name} ${index + 1}`} className="td-gallery-img" />
                      <div className="td-gallery-zoom">🔍 View</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="trek-details-basic container py-5">
            <p className="text-center text-muted">Detailed itinerary coming soon for this trek.</p>
          </div>
        )}
      </div>
    );
  }

  const adminItineraries =
    adminTrek || previewTrek ? parseDeparturePlanItineraries(trek?.departurePlans) : {};
  const overview =
    adminTrek || previewTrek
      ? {
          tagline: trek?.subtitle || "",
          subtitle: trek?.subtitle || "",
          intro: trek?.about || "",
          sections: [
            ...(trek?.history ? [{ title: "History & Significance", body: trek.history }] : []),
            ...(trek?.mainAttractions ? [{ title: "Main Attractions", body: trek.mainAttractions }] : []),
          ],
        }
      : staticRichTrek?.overview || { tagline: "", subtitle: "", intro: "", sections: [] };
  const history =
    (adminTrek || previewTrek) && trek?.detailedHistory
      ? trek.detailedHistory
      : staticRichTrek?.history || "";
  const highlights =
    (adminTrek || previewTrek) && trek?.highlights
      ? parseLineItems(trek.highlights).map((text) => ({ icon: "✨", text }))
      : staticRichTrek?.highlights || [];
  const eventDetails =
    adminTrek || previewTrek
      ? {
          difficulty: trek?.difficulty || "",
          endurance: trek?.enduranceLevel || trek?.difficulty || "",
          baseVillage: trek?.baseVillage || "",
          region: trek?.regionArea || trek?.location || "",
          duration: trek?.duration || "",
          climbTime: trek?.climbTime || "",
          distance: trek?.distance || "",
          altitude: trek?.altitude || "",
          driveFromPune: trek?.drivePune || "",
          driveMumbai: trek?.driveMumbai || "",
          sanctuary: trek?.wildlifeSanctuary || "",
          minGroup: trek?.minGroup || "",
          bestTime: trek?.bestTime || "",
          trailType: trek?.trailType || "",
        }
      : staticRichTrek?.eventDetails || {};
  const pricing =
    adminTrek || previewTrek
      ? Object.fromEntries(
          Object.entries(parseJsonValue(trek?.departurePlans, {})).map(([city, plan]) => [
            city,
            { label: `${city} Departure`, price: Number(plan?.price) || trek?.price || 0 },
          ])
        )
      : staticRichTrek?.pricing || {};
  const whyJoin = staticRichTrek?.whyJoin || [];
  const itineraries = adminTrek || previewTrek ? adminItineraries : staticRichTrek?.itineraries || {};
  const itineraryKeys = adminTrek || previewTrek ? Object.keys(adminItineraries) : Object.keys(itineraries);
  const itinerary =
    itineraryKeys.length > 0
      ? itineraries[activeItinerary] ?? itineraries[itineraryKeys[0]]
      : { note: "Itinerary will appear once route details are added.", days: [] };
  const bookingSteps = staticRichTrek?.bookingSteps || [];
  const includedItems =
    adminTrek || previewTrek
      ? parseLineItems(trek?.included).map((item) => `✅ ${item}`)
      : (staticRichTrek?.inclusions || []).map((item) => `✅ ${item}`);
  const excludedItems =
    adminTrek || previewTrek
      ? parseLineItems(trek?.notIncluded).map((item) => `❌ ${item}`)
      : (staticRichTrek?.exclusions || []).map((item) => `❌ ${item}`);
  const carryItems =
    adminTrek || previewTrek ? parseLineItems(trek?.thingsToCarry) : staticRichTrek?.thingsToCarry || [];
  const placesToVisit =
    adminTrek || previewTrek ? parsePlaces(trek?.placesToVisit) : staticRichTrek?.placesToVisit || [];
  const discountCodes =
    adminTrek || previewTrek
      ? trek?.discountEnabled === false
        ? []
        : parseDiscountItems(trek?.discountCodes)
      : staticRichTrek?.discountCodes || [];
  const heroKicker = staticRichTrek?.heroKicker || "🏔 Maharashtra Trek Experience";
  const heroTagline = overview.tagline || overview.subtitle;

  return (
    <div className="td-page">
      <div className="td-hero">
        <div className="td-hero-slides">
          {heroImages.map((image, index) => (
            <div
              key={`${trek.name}-hero-${index}`}
              className={`td-hero-slide${index === currentHeroSlide ? " is-active" : ""}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <button
            onClick={() => navigate(-1)}
            className="td-back-btn"
          >
            ← Back
          </button>
          <span className="td-kicker">{heroKicker}</span>
          <h1 className="td-heading">{trek.name}</h1>
          <p className="td-subheading">{heroTagline}</p>
          <div className="td-stats-bar">
            {[
              { icon: "📍", label: trek.location },
              { icon: "⏱", label: trek.duration },
              { icon: "🏔", label: trek.altitude },
              { icon: "⚡", label: trek.difficulty },
              { icon: "⭐", label: `${trek.rating} (${trek.reviews} reviews)` },
              { icon: "💰", label: `From ₹${trek.price}` },
            ].map((stat) => (
              <div className="td-stat" key={stat.label}>
                <span className="td-stat-icon">{stat.icon}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="td-hero-actions">
            <BookingCTA trek={trek} selectedDate={selectedBookingDate} className="btn td-book-btn" label={`Book on WhatsApp — ₹${trek.price}`} />
            <button className="btn td-itinerary-btn" onClick={downloadItinerary} style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)" }}>Itinerary</button>
            <button className="btn td-itinerary-btn" onClick={() => setActiveTab("itinerary")}>View Itinerary</button>
            <a
              href={buildShareWhatsAppUrl(trek, referralUrl, selectedBookingDate)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn td-itinerary-btn"
              style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)" }}
              title="Share this trek on WhatsApp"
            >
              🔗 Share
            </a>
          </div>
        </div>
      </div>

      <div className="td-tabs-wrapper" role="tablist">
        <div className="td-tabs container-fluid td-shell">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`td-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container-fluid td-shell td-body">
        {activeTab === "overview" && (
          <div className="td-section">
            <div className="td-overview-grid">
              <div className="td-overview-main">
                <div className="td-card">
                  <h2 className="td-section-title">About {trek.name}</h2>
                  <p className="td-para">{overview.intro}</p>
                  {overview.sections?.map((section) => (
                    <div key={section.title}>
                      <h3 className="td-subsection-title">{section.title}</h3>
                      <p className="td-para">{section.body}</p>
                    </div>
                  ))}
                </div>

                {history && (
                  <div className="td-card">
                    <h2 className="td-section-title">{staticRichTrek?.historyTitle || "Detailed History"}</h2>
                    <p className="td-para">{history}</p>
                  </div>
                )}

                {placesToVisit.length > 0 && (
                  <div className="td-card">
                    <h2 className="td-section-title">Places to Visit</h2>
                    <div className="td-places-list">
                      {placesToVisit.map((place) => (
                        <div className="td-place-item" key={place.name}>
                          <span className="td-place-icon">{place.icon}</span>
                          <div>
                            <strong className="td-place-name">{place.name}</strong>
                            <p className="td-place-desc">{place.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="td-overview-side">
                {upcomingDates.length > 0 && (
                  <div className="td-card td-dates-card">
                    <h3 className="td-section-title">📅 Upcoming Departures</h3>
                    <div className="td-dates-list">
                      {upcomingDates.map((d) => {
                        const displayDate = new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                        return (
                          <div key={d.id} className="td-date-row">
                            <div className="td-date-info">
                              <span className="td-date-text">{displayDate}</span>
                              {d.label && <span className="td-date-badge">{d.label}</span>}
                            </div>
                            <Link
                              to={
                                referralCode
                                  ? `/book?trekName=${encodeURIComponent(trek.name)}&ref=${encodeURIComponent(referralCode)}`
                                  : `/book?trekName=${encodeURIComponent(trek.name)}`
                              }
                              state={{ trek }}
                              className="td-date-book-btn"
                            >
                              Book
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="td-card td-highlights-card">
                  <h3 className="td-section-title">Trek Highlights</h3>
                  <ul className="td-highlights-list">
                    {highlights.map((highlight) => (
                      <li key={highlight.text} className="td-highlight-item">
                        <span className="td-highlight-icon">{highlight.icon}</span>
                        <span>{highlight.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {discountCodes.length > 0 && (
                  <div className="td-card" style={{ marginTop: 16 }}>
                    <h3 className="td-section-title">Discount Offers</h3>
                    <div className="td-discount-codes">
                      {discountCodes.map((discount) => (
                        <div className="td-discount-item" key={discount.code}>
                          <span className="td-discount-code">{discount.code}</span>
                          <span className="td-discount-desc">{discount.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {whyJoin.length > 0 && (
                  <div className="td-why-grid" style={{ marginTop: 16 }}>
                    {whyJoin.map((item) => (
                      <div className="td-why-card" key={item.title}>
                        <span className="td-why-icon">{item.icon}</span>
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="td-section">
            <h2 className="td-section-title">Photo Gallery</h2>
            <p className="td-muted">Hover to zoom · Click to view full screen</p>
            <div className="td-gallery-grid">
              {[...trek.gallery, ...trek.gallery].map((img, index) => (
                <div
                  className="td-gallery-item"
                  key={index}
                  onClick={() => setLightboxImg(img)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${trek.name} photo ${index + 1}`}
                  onKeyDown={(e) => e.key === "Enter" && setLightboxImg(img)}
                >
                  <img src={img} alt={`${trek.name} - Photo ${index + 1}`} className="td-gallery-img" loading="lazy" />
                  <div className="td-gallery-zoom">🔍 View</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "itinerary" && (
          <div className="td-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              <h2 className="td-section-title" style={{ marginBottom: 0 }}>Trek Itinerary</h2>
              {(itinerary?.days?.length > 0) && (
                <button onClick={downloadItinerary} className="btn td-itinerary-btn" style={{ background: "linear-gradient(135deg,#065f46,#047857)", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.82rem" }}>
                  Itinerary
                </button>
              )}
            </div>
            <p className="td-muted">
              {itineraryKeys.length > 1
                ? "Choose your departure route to see the itinerary"
                : itinerary?.days?.[0]?.title
                  ? itinerary.days[0].title
                  : "Itinerary"}
            </p>

            {itineraryKeys.length > 1 && (
              <div className="td-itinerary-selector" role="radiogroup" aria-label="Select departure route">
                {itineraryKeys.map((key) => {
                  const route = itineraries[key];
                  return (
                    <label key={key} className={`td-itinerary-option${activeItinerary === key ? " active" : ""}`}>
                      <input
                        type="radio"
                        name="itineraryRoute"
                        value={key}
                        checked={activeItinerary === key}
                        onChange={() => setActiveItinerary(key)}
                      />
                      <span className="td-itinerary-icon">{route.icon}</span>
                      <div>
                        <span className="td-itinerary-label">{route.label}</span>
                        <span className="td-itinerary-sublabel">{route.sublabel}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {itinerary.note && <div className="td-itinerary-note">⚠️ {itinerary.note}</div>}

            <div className="td-timeline">
              {(itinerary.days || []).map((day, dayIndex) => (
                <div className="td-timeline-day" key={dayIndex}>
                  <div className="td-timeline-day-title">{day.title}</div>
                  <div className="td-timeline-events">
                    {(day.events || []).map((event, eventIndex) => (
                      <div className="td-timeline-event" key={eventIndex}>
                        <div className="td-timeline-time">{event.time}</div>
                        <div className="td-timeline-dot" />
                        <div className="td-timeline-desc">{event.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {bookingSteps.length > 0 && (
              <div className="td-card td-booking-steps-card">
                <h3 className="td-section-title">How to Book?</h3>
                <ol className="td-booking-steps">
                  {bookingSteps.map((step, index) => (
                    <li key={index} className="td-booking-step">
                      <span className="td-booking-step-num">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <BookingCTA trek={trek} selectedDate={selectedBookingDate} className="btn td-book-btn" />
                  <a
                    href={buildShareWhatsAppUrl(trek, referralUrl, selectedBookingDate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn td-itinerary-btn"
                    style={{ background: "#25d366", color: "#fff", borderColor: "#25d366" }}
                  >
                    🔗 Share Trek
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "details" && (
          <div className="td-section">
            <div className="td-details-grid">
              <div className="td-card">
                <h2 className="td-section-title">Trek Details</h2>
                <table className="td-details-table">
                  <tbody>
                    {Object.entries({
                      "Difficulty Level": eventDetails.difficulty,
                      "Endurance Level": eventDetails.endurance,
                      "Base Village": eventDetails.baseVillage,
                      Region: eventDetails.region,
                      Duration: eventDetails.duration,
                      "Climb Time": eventDetails.climbTime,
                      Distance: eventDetails.distance,
                      Altitude: eventDetails.altitude,
                      "Drive from Pune": eventDetails.driveFromPune,
                      "Drive from Mumbai": eventDetails.driveMumbai,
                      "Best Time": eventDetails.bestTime,
                      "Trail Type": eventDetails.trailType,
                      "Minimum Group": eventDetails.minGroup,
                      "Wildlife Sanctuary": eventDetails.sanctuary,
                    })
                      .filter(([, value]) => value)
                      .map(([key, value]) => (
                        <tr key={key}>
                          <td className="td-table-key">{key}</td>
                          <td className="td-table-val">{value}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="td-card">
                  <h2 className="td-section-title">Pricing</h2>
                  <div className="td-pricing-cards">
                    {Object.values(pricing).map((price) => (
                      <div className="td-pricing-card" key={price.label}>
                        <div className="td-pricing-label">{price.label}</div>
                        <div className="td-pricing-price">₹{price.price}<span>/person</span></div>
                        <BookingCTA trek={trek} selectedDate={selectedBookingDate} className="btn td-pricing-book-btn" label="Book on WhatsApp" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="td-card" style={{ marginTop: 18 }}>
                  <h3 className="td-section-title">What's Included / Not Included</h3>
                  <ul className="td-inclusions">
                    {[...includedItems, ...excludedItems].map((item) => (
                      <li key={item} className="td-inclusion-item">{item}</li>
                    ))}
                  </ul>
                </div>

                {carryItems.length > 0 && (
                  <div className="td-card" style={{ marginTop: 18 }}>
                    <h3 className="td-section-title">Things to Carry</h3>
                    <ul className="td-inclusions">
                      {carryItems.map((item) => (
                        <li key={item} className="td-inclusion-item">🎒 {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {lightboxImg && (
        <div className="td-lightbox" onClick={() => setLightboxImg(null)}>
          <div className="td-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg} alt="Full view" />
            <button className="td-lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
          </div>
        </div>
      )}

      <div className="td-cta-bar">
        <div className="td-cta-info">
          <span className="td-cta-name">{trek.name}</span>
          <span className="td-cta-meta">{trek.location} · {trek.duration} · {trek.altitude}</span>
        </div>
        <div className="td-cta-price">
          <span className="td-cta-from">from</span>
          <span className="td-cta-amount">₹{trek.price}</span>
          <span className="td-cta-orig">₹{trek.originalPrice}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <BookingCTA trek={trek} selectedDate={selectedBookingDate} className="btn td-cta-book-btn" />
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
            Quick booking via WhatsApp
          </span>
        </div>
        <a
          href={buildShareWhatsAppUrl(trek, referralUrl, selectedBookingDate)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn td-cta-book-btn"
          style={{ background: "#25d366", borderColor: "#25d366" }}
          title="Share this trek"
        >
          🔗 Share
        </a>
      </div>
    </div>
  );
}

export default TrekDetails;
