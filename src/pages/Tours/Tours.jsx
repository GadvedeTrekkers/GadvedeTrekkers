import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { syncProductsFromApi } from "../../api/getAll";
import { parseJsonValue } from "../../utils/listingParsers";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";
import BookingCTA from "../../components/BookingCTA";
import { useSeo } from "../../seo/useSeo";
import { pageSeo, SITE_ORIGIN, DEFAULT_OG, absoluteUrl, organizationNode } from "../../seo/publicSeo";
import { FALLBACK_IMAGE, handleImageError } from "../../utils/imageFallback";
import { upcomingLabel } from "../../utils/upcomingDate";
import { useSiteData } from "../../config/siteContent";

const REGION_ORDER = [
  "himachal",
  "kashmir",
  "northeast",
  "rajasthan",
  "kerala",
  "uttarakhand",
  "goa",
  "maharashtra",
  "karnataka",
];

const REGION_LABELS = {
  himachal: "Himachal",
  kashmir: "Kashmir & Leh",
  northeast: "NorthEast",
  rajasthan: "Rajasthan",
  kerala: "Kerala",
  uttarakhand: "Uttarakhand",
  goa: "Goa",
  maharashtra: "Maharashtra",
  karnataka: "Karnataka",
};

const slugifyTourName = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function Tours() {
  const location = useLocation();
  const selectedRegion = location.state?.region || null;
  const [, setSyncKey] = useState(0);
  const [synced, setSynced] = useState(false); // catalogue sync finished (so "no tours" is not flashed while loading)
  useSiteData(); // re-render when admin content (search titles, company name) arrives
  const seoText = pageSeo("tours"); // Admin → Site Content → Search titles (t129u)
  useSeo({
    title: seoText.title,
    description: seoText.description,
    canonical: `${SITE_ORIGIN}/tours`,
    image: absoluteUrl(DEFAULT_OG.path),
    imageWidth: DEFAULT_OG.width,
    imageHeight: DEFAULT_OG.height,
    imageAlt: "Group tours from Pune and Mumbai with Gadvede Trekkers",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        organizationNode,
        { "@type": "CollectionPage", name: seoText.title, url: `${SITE_ORIGIN}/tours`, description: seoText.description },
      ],
    },
  });

  // Sync from backend on mount so admin changes reflect on all devices
  useEffect(() => {
    const syncLocal = () => setSyncKey((k) => k + 1);

    syncProductsFromApi("tour", "gt_tours")
      .then((items) => { if (items) setSyncKey((k) => k + 1); })
      .catch(() => {})
      .finally(() => setSynced(true));

    window.addEventListener("storage", syncLocal);
    return () => window.removeEventListener("storage", syncLocal);
  }, []);

  // Only published tours synced from the API (gt_tours) are listed. The old static fallback list
  // (Goa Backpacking and others, with past 2025 dates) was removed so nothing unpublished looks bookable.
  // Live/Off toggles in the admin panel are respected.
  const displayTourData = {};
  getAdminItems("gt_tours")
    .filter((tour) => tour.active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999))
    .forEach((tour) => {
      const item = normaliseItem(tour);
      const gallery = parseJsonValue(item.imageGallery, [item.image]).filter(Boolean);
      if (!displayTourData[item.region]) displayTourData[item.region] = [];
      displayTourData[item.region].push({ ...item, image: gallery[0] || item.image });
    });

  const regions = REGION_ORDER.filter(
    (region) => Array.isArray(displayTourData[region]) && displayTourData[region].length
  );

  const regionRefs = {
    himachal: useRef(null),
    kashmir: useRef(null),
    northeast: useRef(null),
    rajasthan: useRef(null),
    kerala: useRef(null),
    uttarakhand: useRef(null),
    goa: useRef(null),
    maharashtra: useRef(null),
    karnataka: useRef(null),
  };

  useEffect(() => {
    if (selectedRegion && regionRefs[selectedRegion]) {
      regionRefs[selectedRegion].current?.scrollIntoView({
        behavior: "smooth",
      });
      window.history.replaceState({}, document.title);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [selectedRegion]);

  return (
    <div className="container py-5">
      <h1 className="fw-bold text-center mb-2 text-success" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>
        Group Tours from Pune &amp; Mumbai
      </h1>
      <h2 className="fw-bold text-center mb-5 text-success" style={{ fontSize: "1.25rem" }}>
        Explore Tours by Region
      </h2>

      {regions.length === 0 && synced && (
        <div className="text-center text-muted py-5" data-testid="tours-empty">
          <p className="mb-2">No group tours are open for booking right now.</p>
          <p>Message us on WhatsApp and we’ll share the next departures.</p>
        </div>
      )}

      {regions.map((region) => (
        <div key={region} ref={regionRefs[region]} className="mb-5">
          <h4 className="fw-bold mb-4 text-success">
            {REGION_LABELS[region] || region} Tours
          </h4>

          <div className="row g-4">
            {(displayTourData[region] || []).map((tour, index) => (
              <div className="col-md-4" key={`${region}-${tour.name}-${index}`}>
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden h-100">
                  <img
                    src={tour.image || FALLBACK_IMAGE}
                    alt={tour.name}
                    loading="lazy"
                    onError={handleImageError}
                    style={{ width: "100%", aspectRatio: "4 / 3", height: "auto", objectFit: "cover", background: "#d9efe3" }}
                  />

                  <div className="card-body">
                    <h5 className="fw-bold">{tour.name}</h5>

                    <div className="mb-2">
                      ⏱ <strong>{tour.duration}</strong>
                    </div>

                    <div className="mb-2">
                      <span className="text-muted text-decoration-line-through me-2">
                        ₹{tour.originalPrice}
                      </span>
                      <span className="fw-bold fs-5">₹{tour.price}</span>
                    </div>

                    {upcomingLabel(tour.nextDate) && (
                      <div className="small mb-3">
                        📅 <strong>Next:</strong> {tour.nextDate}
                      </div>
                    )}

                    <div className="d-flex gap-2 flex-wrap">
                      <BookingCTA trek={tour} className="btn btn-success w-50" label="Book on WhatsApp" />

                      <Link
                        to={`/tours/${slugifyTourName(tour.slug || tour.name)}`}
                        className="btn btn-outline-success w-50"
                      >
                        View Details
                      </Link>
                      <a
                        href={createWhatsAppInquiryUrl({
                          packageName: tour.name,
                          location: tour.destinationLine || REGION_LABELS[region] || region,
                          category: "Tour",
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success w-100"
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
      ))}
    </div>
  );
}

export default Tours;
