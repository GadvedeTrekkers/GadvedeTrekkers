import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { findTrekBySlug, slugifyTrekName } from "../../data/treks";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { richTrekDetails, richTrekFor } from "../../data/richTrekDetails";
import { FEATURED_TRIPS } from "../../data/featuredTrips";
import { getTrekDates } from "../../data/trekDatesStorage";
import BookingCTA from "../../components/BookingCTA";
import { buildShareWhatsAppUrl } from "../../config/bookingConfig";
import { productService } from "../../services/product.service";
import { cleanDisplayText, isPromptLike, stripPromptFields } from "../../utils/contentSanitizer";
import {
  asList,
  collectSellingPrices,
  genuineCompareAt,
  itineraryHasEvents,
  markdownBlocks,
  parseDeparturePlanItineraries,
  parseJsonish,
  pickupGroups,
  pricingCards,
  resolveTripGallery,
  sectionList,
  stripMarkdownInline,
  upcomingDepartures,
} from "../../utils/tripDisplay";
import { useSeo } from "../../seo/useSeo";
import { buildTrekPageSeo } from "../../seo/publicSeo";


const TABS = [
  { id: "overview", label: "Overview" },
  { id: "gallery", label: "Photo Gallery" },
  { id: "itinerary", label: "Itinerary" },
  { id: "details", label: "Details & Cost" },
];

/* Overview copy is stored as markdown. Render headings and lists, never raw asterisks. */
function Paragraphs({ text, className = "td-para" }) {
  const blocks = markdownBlocks(text, { omitTitles: ["itinerary"] });
  if (!blocks.length) return null;
  return blocks.map((block, index) => {
    if (block.type === "h") {
      return (
        <h3 className="td-subsection-title" key={`h-${index}`}>
          {block.text}
        </h3>
      );
    }
    if (block.type === "ul") {
      return (
        <ul className="td-inclusions" key={`ul-${index}`}>
          {block.items.map((item, itemIndex) => (
            <li className="td-inclusion-item" key={`${index}-${itemIndex}`}>
              {item}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p className={className} key={`p-${index}`}>
        {block.text}
      </p>
    );
  });
}

function DepartureRows({ departures, trek }) {
  if (!departures.length) return null;
  return (
    <div className="td-dates-list">
      {departures.map((departure) => {
        const when = departure.city ? `${departure.label} · ${departure.city}` : departure.label;
        return (
          <div key={departure.id} className="td-date-row">
            <div className="td-date-info">
              <span className="td-date-text">{departure.label}</span>
              {departure.city ? <span className="td-date-badge">{departure.city}</span> : null}
              {departure.fee ? (
                <span className="td-date-badge">₹{Number(departure.fee).toLocaleString("en-IN")}</span>
              ) : null}
            </div>
            <BookingCTA
              trek={{ ...trek, price: departure.fee || trek.price }}
              selectedDate={when}
              className="td-date-book-btn"
              label="Book Now"
            />
          </div>
        );
      })}
    </div>
  );
}

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

const parsePlaces = (value = "") =>
  parseLineItems(value).map((item) => {
    const [name, desc] = item.split("|");
    return { icon: "📍", name: (name || item).trim(), desc: (desc || "").trim() };
  });

function TrekHeroSlides({ name, images, current }) {
  if (!images?.length) return null;
  return (
    <div className="td-hero-slides">
      {images.map((image, index) => (
        <div
          key={`${name}-cover-${index}`}
          className={`td-hero-slide${index === current ? " is-active" : ""}`}
        >
          <img className="td-hero-cover" src={image} alt={`${name} cover`} />
        </div>
      ))}
    </div>
  );
}

function TrekBreadcrumb({ name }) {
  return (
    <nav className="td-breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span aria-hidden="true"> / </span>
      <Link to="/treks">Treks</Link>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">{name}</span>
    </nav>
  );
}

function TrekDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remoteTrek, setRemoteTrek] = useState(null);
  const previewDraft =
    typeof window !== "undefined" ? sessionStorage.getItem("gt_trek_preview") : null;
  const previewItem = parseJsonValue(previewDraft, null);
  const previewSlug = previewItem?.name ? slugifyTrekName(previewItem.name) : "";
  const adminMatch = getAdminItems("gt_treks").find(
    (item) => item.slug === id || slugifyTrekName(item.name || "") === id
  );

  const buildLocalTrek = (item) => {
    const gallery = resolveTripGallery(item);
    const image = gallery[0] || item.image;
    return { ...stripPromptFields(normaliseItem(item)), image, gallery: gallery.length ? gallery : [image].filter(Boolean) };
  };

  const adminTrek = adminMatch ? buildLocalTrek(adminMatch) : null;
  const previewTrek = previewItem && previewSlug === id ? buildLocalTrek(previewItem) : null;
  const featuredBase = FEATURED_TRIPS.find((item) => item.slug === id);
  const featuredTrek = featuredBase
    ? buildLocalTrek({ ...featuredBase, originalPrice: 0, altitude: "", rating: 0, reviews: 0 })
    : null;
  const trek = previewTrek || remoteTrek || adminTrek || (id ? findTrekBySlug(id) : null) || featuredTrek;
  const staticRichTrek =
    richTrekFor({ name: trek?.name, slug: id || trek?.slug }) ||
    (trek?.name ? richTrekDetails[trek.name] || null : null);
  const catalogItineraries = parseDeparturePlanItineraries(trek?.departurePlans);
  const hasTimedItinerary = itineraryHasEvents(catalogItineraries);
  const hasCatalogCopy = Boolean(
    trek && (trek.description || trek.about || trek.includedItems || Object.keys(catalogItineraries).length)
  );
  const isRich = !!(staticRichTrek || adminTrek || previewTrek || hasCatalogCopy);
  const staticItineraryKeys = Object.keys(staticRichTrek?.itineraries || {});
  const defaultItineraryKey = Object.keys(catalogItineraries)[0] || staticItineraryKeys[0] || "kasara";

  const todayStr = new Date().toISOString().slice(0, 10);
  const departures = trek
    ? upcomingDepartures(
        parseJsonish(trek.trekDateBatches, []).length > 0
          ? parseJsonish(trek.trekDateBatches, [])
          : getTrekDates(slugifyTrekName(trek.name)),
        trek.departurePlans,
        todayStr
      )
    : [];

  const [activeTab, setActiveTab] = useState("overview");
  const [activeItinerary, setActiveItinerary] = useState(defaultItineraryKey);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  /* ── Date selection for WhatsApp booking message ──────────── */
  const activeBookingDate = departures[0]?.label || null;

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
    const aboutText = [
      ...markdownBlocks(overview.intro, { omitTitles: ["itinerary"] }).map((block) => {
        if (block.type === "h") return `<strong>${block.text}</strong>`;
        if (block.type === "ul") return `<ul>${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
        return block.text;
      }),
      ...(overview.sections || []).map((section) => `<strong>${section.title}</strong><br>${section.body}`),
    ]
      .filter(Boolean)
      .join("<br><br>")
      .replace(/\*/g, "");

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

  const pageSeo = useMemo(() => {
    const cards = trek ? pricingCards(trek) : [];
    const cardPricing = Object.fromEntries(cards.map((card) => [card.key, { price: card.price }]));
    const rated = remoteTrek || adminTrek || previewTrek;
    return buildTrekPageSeo({
      slug: id,
      trek: rated ? trek : { ...(trek || {}), rating: undefined, reviews: undefined },
      pricing: Object.keys(cardPricing).length ? cardPricing : staticRichTrek?.pricing,
    });
  }, [id, trek, staticRichTrek, remoteTrek, adminTrek, previewTrek]);
  useSeo(pageSeo);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

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
  const heroImages = trek?.gallery?.length ? trek.gallery.slice(0, 3) : trek?.image ? [trek.image] : [];

  if (!isRich) {
    return (
      <div className="td-page">
        {trek ? (
          <>
            <div className="td-hero">
              <TrekHeroSlides name={formattedName} images={heroImages} current={currentHeroSlide} />
              <div className="td-hero-overlay" />
              <div className="td-hero-content container-fluid td-shell">
                <button onClick={() => navigate(-1)} className="td-back-btn">← Back</button>
                <TrekBreadcrumb name={formattedName} />
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
                  <BookingCTA trek={trek} selectedDate={activeBookingDate} className="btn td-book-btn" label={`Book Now — ₹${trek.price}`} />
                  <button className="btn td-itinerary-btn" onClick={downloadItinerary} style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)" }}>Itinerary</button>
                  <button className="btn td-itinerary-btn" onClick={() => setActiveTab("gallery")}>View Photos</button>
                </div>
              </div>
            </div>
            {departures.length > 0 && (
              <div className="container-fluid td-shell py-4">
                <div className="td-card td-dates-card">
                  <h3 className="td-section-title">📅 Upcoming Departures</h3>
                  <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: 12 }}>
                    Choose a date and tap <strong>Book Now</strong> — it opens WhatsApp so we can confirm your spot.
                  </p>
                  <DepartureRows departures={departures} trek={trek} />
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

  const copySource = trek?.about || trek?.description || "";
  const rawOverview = hasCatalogCopy
      ? {
          tagline: trek?.subtitle || "",
          subtitle: trek?.subtitle || "",
          intro: copySource,
          sections: [
            ...(trek?.mainAttractions ? [{ title: "Main Attractions", body: trek.mainAttractions }] : []),
          ],
        }
      : staticRichTrek?.overview || { tagline: "", subtitle: "", intro: "", sections: [] };
  const overview = {
    ...rawOverview,
    tagline: stripMarkdownInline(cleanDisplayText(rawOverview.tagline)),
    subtitle: stripMarkdownInline(cleanDisplayText(rawOverview.subtitle)),
    intro: cleanDisplayText(rawOverview.intro),
    sections: (rawOverview.sections || [])
      .map((section) => ({
        ...section,
        title: stripMarkdownInline(section.title),
        body: cleanDisplayText(section.body),
      }))
      .filter((section) => section.body),
  };
  const history = cleanDisplayText(
    hasCatalogCopy && (trek?.detailedHistory || trek?.history)
      ? trek.detailedHistory || trek.history
      : staticRichTrek?.history || ""
  );
  const highlightSource = asList(trek?.highlights);
  const highlights = (
    highlightSource.length
      ? highlightSource.map((text) => ({ icon: "✨", text: stripMarkdownInline(text) }))
      : staticRichTrek?.highlights || []
  ).filter((h) => h?.text && !isPromptLike(h.text));
  const catalogDetails = {
    difficulty: trek?.difficulty || "",
    endurance: trek?.enduranceLevel || "",
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
  };
  const eventDetails = {
    ...(staticRichTrek?.eventDetails || {}),
    ...Object.fromEntries(Object.entries(catalogDetails).filter(([, value]) => value)),
  };
  const catalogPrices = pricingCards(trek);
  const pricing = catalogPrices.length ? catalogPrices : Object.values(staticRichTrek?.pricing || {});
  const heroCompare = genuineCompareAt(trek?.originalPrice, trek?.price, collectSellingPrices(trek));
  const whyJoin = staticRichTrek?.whyJoin || [];
  const itineraries = hasTimedItinerary ? catalogItineraries : staticRichTrek?.itineraries || {};
  const itineraryKeys = Object.keys(itineraries);
  const itinerary =
    itineraryKeys.length > 0
      ? itineraries[activeItinerary] ?? itineraries[itineraryKeys[0]]
      : { note: "Itinerary will appear once route details are added.", days: [] };
  const bookingSteps = staticRichTrek?.bookingSteps || [];
  const listOr = (primary, secondary, titles, fallback) => {
    const first = asList(primary);
    if (first.length) return first;
    const second = asList(secondary);
    if (second.length) return second;
    const fromCopy = sectionList(copySource, titles);
    if (fromCopy.length) return fromCopy;
    return fallback || [];
  };
  const includedItems = listOr(trek?.includedItems, trek?.included, ["includes", "inclusions"], staticRichTrek?.inclusions).map(
    (item) => `✅ ${stripMarkdownInline(item)}`
  );
  const excludedItems = listOr(trek?.excludedItems, trek?.notIncluded, ["excludes", "exclusions"], staticRichTrek?.exclusions).map(
    (item) => `❌ ${stripMarkdownInline(item)}`
  );
  const carryItems = listOr(
    trek?.thingsToCarry,
    trek?.things_to_carry,
    ["things to carry"],
    staticRichTrek?.thingsToCarry
  ).map((item) => stripMarkdownInline(item));
  const pickups = pickupGroups(trek?.departurePlans);
  const placesToVisit =
    hasCatalogCopy && trek?.placesToVisit ? parsePlaces(trek?.placesToVisit) : staticRichTrek?.placesToVisit || [];
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
        <TrekHeroSlides name={trek.name} images={heroImages} current={currentHeroSlide} />
        <div className="td-hero-overlay" />
        <div className="td-hero-content container-fluid td-shell">
          <button
            onClick={() => navigate(-1)}
            className="td-back-btn"
          >
            ← Back
          </button>
          <TrekBreadcrumb name={trek.name} />
          <span className="td-kicker">{heroKicker}</span>
          <h1 className="td-heading">{trek.name}</h1>
          {heroTagline && <p className="td-subheading">{heroTagline}</p>}
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
            <BookingCTA trek={trek} selectedDate={activeBookingDate} className="btn td-book-btn" label={`Book Now — ₹${trek.price}`} />
            <button className="btn td-itinerary-btn" onClick={downloadItinerary} style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)" }}>Itinerary</button>
            <button className="btn td-itinerary-btn" onClick={() => setActiveTab("itinerary")}>View Itinerary</button>
            <a
              href={buildShareWhatsAppUrl(trek, referralUrl, activeBookingDate)}
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
                  {overview.intro ? (
                    <Paragraphs text={overview.intro} />
                  ) : (
                    !overview.sections?.length && (
                      <p className="td-para td-muted">Full trek description coming soon. Contact us for details.</p>
                    )
                  )}
                  {overview.sections?.map((section) => (
                    <div key={section.title}>
                      <h3 className="td-subsection-title">{section.title}</h3>
                      <Paragraphs text={section.body} />
                    </div>
                  ))}
                </div>

                {history && (
                  <div className="td-card">
                    <h2 className="td-section-title">{staticRichTrek?.historyTitle || "Detailed History"}</h2>
                    <Paragraphs text={history} />
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
                {departures.length > 0 && (
                  <div className="td-card td-dates-card">
                    <h3 className="td-section-title">📅 Upcoming Departures</h3>
                    <DepartureRows departures={departures} trek={trek} />
                  </div>
                )}

                {highlights.length > 0 && (
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
                )}

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
              {(trek.gallery || []).map((img, index) => (
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
                  {day.title ? <div className="td-timeline-day-title">{day.title}</div> : null}
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
                  <BookingCTA trek={trek} selectedDate={activeBookingDate} className="btn td-book-btn" />
                  <a
                    href={buildShareWhatsAppUrl(trek, referralUrl, activeBookingDate)}
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
                {pickups.length > 0 && (
                  <div className="td-card" style={{ marginBottom: 18 }}>
                    <h2 className="td-section-title">Pickup points</h2>
                    {pickups.map((group) => (
                      <div key={group.city} style={{ marginBottom: 12 }}>
                        <h3 className="td-subsection-title">{group.city}</h3>
                        <ul className="td-inclusions">
                          {group.points.map((point, index) => (
                            <li className="td-inclusion-item" key={`${group.city}-${index}`}>
                              {point.time ? `${point.time} — ` : ""}
                              {point.location}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                <div className="td-card">
                  <h2 className="td-section-title">Pricing</h2>
                  <div className="td-pricing-cards">
                    {pricing.map((price) => (
                      <div className="td-pricing-card" key={price.label}>
                        <div className="td-pricing-label">{price.label}</div>
                        {price.compareAt ? (
                          <div className="td-cta-orig">₹{Number(price.compareAt).toLocaleString("en-IN")}</div>
                        ) : null}
                        <div className="td-pricing-price">₹{Number(price.price).toLocaleString("en-IN")}<span>/person</span></div>
                        <BookingCTA
                          trek={{ ...trek, price: price.price }}
                          selectedDate={activeBookingDate}
                          className="btn td-pricing-book-btn"
                          label="Book Now"
                        />
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
            <img src={lightboxImg} alt={`${formattedName} full view`} />
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
          {heroCompare ? (
            <span className="td-cta-orig">₹{Number(heroCompare).toLocaleString("en-IN")}</span>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <BookingCTA trek={trek} selectedDate={activeBookingDate} className="btn td-cta-book-btn" label="Book Now" />
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
            Quick booking via WhatsApp
          </span>
        </div>
        <a
          href={buildShareWhatsAppUrl(trek, referralUrl, activeBookingDate)}
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
