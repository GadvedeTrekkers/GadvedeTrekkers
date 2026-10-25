import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminItems, normaliseItem } from "../../data/adminStorage";
import { publicTripPhoto } from "../../data/publicTrips";
import {
  getPrimaryCampingImage,
  parseFaqItems,
  parseItineraryItems,
  parseJsonValue,
  parseLineItems,
  parseOfferItems,
  parsePipeItems,
} from "../../data/campingDetailsData";
import BookingCTA from "../../components/BookingCTA";
import { createWhatsAppInquiryUrl } from "../../utils/leadActions";
import { productService } from "../../services/product.service";

const CAMPING_PREVIEW_KEY = "gt_camping_preview";

function parseDates(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return parseJsonValue(value, [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCampingEntry(id) {
  const stored = [...getAdminItems("gt_camping"), ...getAdminItems("gt_treks")].map((item) => ({
    ...item,
    slug: item.slug || slugify(item.shortName || item.name),
  }));

  return stored.find((item) => item.id === id || item.slug === id);
}

function feeOptions(item = {}) {
  const plans = parseJsonValue(item.departurePlans, {});
  const fromPlans = Object.entries(plans)
    .map(([city, plan]) => ({ label: city, price: plan?.price }))
    .filter((row) => row.price != null && row.price !== "");
  if (fromPlans.length) return fromPlans;

  return parseJsonValue(item.trekDateBatches, [])
    .filter((batch) => batch?.price != null && batch.price !== "")
    .map((batch) => ({
      label: [batch.departureCity, batch.label].filter(Boolean).join(" · ") || "Batch",
      price: batch.price,
    }));
}

function normalizeCampingEntry(item) {
  if (!item) return null;

  const normalized = normaliseItem(item);
  const imageGallery = parseJsonValue(item.imageGallery, []).filter(Boolean);

  return {
    ...normalized,
    image: getPrimaryCampingImage(item),
    imageGallery: imageGallery.length ? imageGallery : [getPrimaryCampingImage(item)],
    nextDates: parseDates(item.nextDates),
    overviewParagraphs: String(item.overview || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    howToReach: parseLineItems(item.howToReach),
    eventDetails: parsePipeItems(item.eventDetails),
    itinerary: parseItineraryItems(item.itinerary),
    highlights: parsePipeItems(item.highlights),
    included: parseLineItems(item.included),
    notIncluded: parseLineItems(item.notIncluded),
    thingsToCarry: parseLineItems(item.thingsToCarry),
    fees: feeOptions(item),
    offers: parseOfferItems(item.offers),
    faqs: parseFaqItems(item.faqs),
    cancellationPolicy: parseLineItems(item.cancellationPolicy),
    rules: parseLineItems(item.rules),
  };
}

function campingFromCatalog(item) {
  if (!item) return null;
  const batches = parseJsonValue(item.trekDateBatches, []);
  const nextDates = Array.isArray(batches)
    ? batches.map((batch) => batch?.date).filter(Boolean)
    : [];
  return normalizeCampingEntry({
    ...item,
    shortName: item.shortName || item.name,
    type: item.type || "Camp",
    image: item.image || publicTripPhoto(item.slug),
    overview: item.overview || item.description || item.about || "",
    description: item.description || item.subtitle || "",
    nextDates: item.nextDates || nextDates,
  });
}

export default function CampingDetails() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [remoteCamp, setRemoteCamp] = useState(null);

  useEffect(() => {
    if (!id || id === "preview") {
      setRemoteCamp(null);
      return;
    }
    let cancelled = false;
    productService
      .getBySlug(id)
      .then((item) => {
        if (!cancelled && item && (item.productType === "camping" || item.slug === id)) {
          setRemoteCamp(campingFromCatalog(item));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const camp = useMemo(() => {
    if (id === "preview") {
      try {
        const previewItem = JSON.parse(sessionStorage.getItem(CAMPING_PREVIEW_KEY) || "null");
        return normalizeCampingEntry(previewItem);
      } catch {
        return null;
      }
    }

    return remoteCamp || normalizeCampingEntry(resolveCampingEntry(id));
  }, [id, remoteCamp]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.title = camp ? `${camp.shortName || camp.name} | Gadvede Trekkers` : "Camping Details | Gadvede Trekkers";
  }, [camp]);

  if (!camp) {
    return (
      <div className="container py-5 text-center">
        <h2>Campsite not found</h2>
        <Link to="/camping" className="btn btn-success mt-3">Back to Camping</Link>
      </div>
    );
  }

  const whatsappUrl = createWhatsAppInquiryUrl({
    packageName: camp.shortName || camp.name,
    location: camp.location,
    category: "Camping",
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#047857 100%)", padding: "48px 0 36px", color: "#fff" }}>
        <div className="container">
          <p style={{ fontSize: "0.8rem", marginBottom: 14, opacity: 0.75 }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Home</Link>
            {" › "}
            <Link to="/camping" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Camping</Link>
            {" › "}
            <span style={{ color: "#6ee7b7" }}>{camp.shortName || camp.name}</span>
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 600 }}>
              ⏱ {camp.duration}
            </span>
            <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 999, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 700 }}>
              ⛺ {camp.type}
            </span>
            {camp.badge ? (
              <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 700 }}>
                {camp.badge}
              </span>
            ) : null}
          </div>

          <h1 style={{ fontWeight: 900, fontSize: "clamp(1.6rem,3.5vw,2.5rem)", lineHeight: 1.2, marginBottom: 8 }}>
            {camp.name}
          </h1>
          <p style={{ opacity: 0.88, fontSize: "0.95rem", marginBottom: 20 }}>📍 {camp.location}</p>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Starting From</span>
              <div>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#6ee7b7" }}>₹{camp.price}</span>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, marginLeft: 6 }}>/person</span>
                {camp.originalPrice ? (
                  <span style={{ fontSize: "0.85rem", opacity: 0.65, textDecoration: "line-through", marginLeft: 10 }}>
                    ₹{camp.originalPrice}
                  </span>
                ) : null}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: "0.78rem", opacity: 0.9 }}>
              <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "3px 12px" }}>
                {camp.availability || "Available"}
              </span>
              {camp.coupon ? (
                <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "3px 12px" }}>
                  🎟 {camp.coupon}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
          <div>
            <section style={{ background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #e5e7eb", marginBottom: 24 }}>
              <div style={{ aspectRatio: "16 / 8", borderRadius: 16, overflow: "hidden", background: "#d1d5db", marginBottom: 12 }}>
                <img src={camp.imageGallery[activeImage]} alt={camp.shortName || camp.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              {camp.imageGallery.length > 1 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 10 }}>
                  {camp.imageGallery.map((image, index) => (
                    <button
                      key={`${image}_${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      style={{
                        border: activeImage === index ? "2px solid #059669" : "1px solid #d1d5db",
                        borderRadius: 12,
                        padding: 0,
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      <img src={image} alt={`View ${index + 1}`} style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            {camp.fees?.length > 0 && (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 14, fontSize: "1.08rem" }}>Fees</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                  {camp.fees.map((fee) => (
                    <div key={`${fee.label}-${fee.price}`} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.82rem", color: "#065f46", fontWeight: 700 }}>{fee.label}</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#059669" }}>₹{Number(fee.price).toLocaleString("en-IN")}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
              <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 14, fontSize: "1.08rem" }}>About This Campsite</h3>
              {camp.overviewParagraphs.length > 0 ? (
                camp.overviewParagraphs.map((paragraph, index) => (
                  <p key={index} style={{ color: "#374151", lineHeight: 1.8, marginBottom: index === camp.overviewParagraphs.length - 1 ? 0 : 12 }}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p style={{ color: "#6b7280", margin: 0 }}>Overview can be updated from admin.</p>
              )}
            </section>

            {camp.eventDetails.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 16, fontSize: "1.08rem" }}>Camp Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  {camp.eventDetails.map((item, index) => (
                    <div key={`${item.title}_${index}`} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.86rem", marginBottom: 6 }}>{item.title}</div>
                      <div style={{ color: "#374151", fontSize: "0.86rem", lineHeight: 1.65 }}>{item.detail}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {camp.highlights.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 16, fontSize: "1.08rem" }}>Highlights</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {camp.highlights.map((item, index) => (
                    <div key={`${item.title}_${index}`} style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.92rem", marginBottom: 8 }}>{item.title}</div>
                      <div style={{ color: "#374151", fontSize: "0.86rem", lineHeight: 1.7 }}>{item.detail}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {camp.itinerary.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 16, fontSize: "1.08rem" }}>Itinerary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {camp.itinerary.map((item, index) => (
                    <div key={`${item.day}_${item.time}_${index}`} style={{ display: "grid", gridTemplateColumns: "170px 120px 1fr", gap: 12, alignItems: "start", borderTop: index === 0 ? "none" : "1px solid #eef2f7", paddingTop: index === 0 ? 0 : 12 }}>
                      <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.85rem" }}>{item.day || "-"}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.84rem", fontWeight: 600 }}>{item.time || "-"}</div>
                      <div style={{ color: "#374151", fontSize: "0.86rem", lineHeight: 1.7 }}>{item.description || "-"}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {camp.howToReach.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 16, fontSize: "1.08rem" }}>How To Reach</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {camp.howToReach.map((item, index) => (
                    <li key={index} style={{ color: "#374151", lineHeight: 1.8, marginBottom: 8 }}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 18, padding: "22px 24px", border: "1px solid #bbf7d0" }}>
                <h3 style={{ fontWeight: 800, color: "#065f46", marginBottom: 14, fontSize: "1rem" }}>Included</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {camp.included.map((item, index) => (
                    <li key={index} style={{ color: "#374151", lineHeight: 1.75, marginBottom: 6 }}>{item}</li>
                  ))}
                </ul>
              </div>
              <div style={{ background: "#fff7ed", borderRadius: 18, padding: "22px 24px", border: "1px solid #fed7aa" }}>
                <h3 style={{ fontWeight: 800, color: "#9a3412", marginBottom: 14, fontSize: "1rem" }}>Not Included</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {camp.notIncluded.map((item, index) => (
                    <li key={index} style={{ color: "#374151", lineHeight: 1.75, marginBottom: 6 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            {camp.thingsToCarry.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 14, fontSize: "1.08rem" }}>Things To Carry</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {camp.thingsToCarry.map((item, index) => (
                    <span key={index} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 999, padding: "6px 12px", fontSize: "0.82rem", fontWeight: 600 }}>
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {camp.faqs.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 14, fontSize: "1.08rem" }}>FAQs</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {camp.faqs.map((faq, index) => (
                    <div key={`${faq.q}_${index}`} style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "14px 18px",
                          background: openFaq === index ? "#f0fdf4" : "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          color: openFaq === index ? "#065f46" : "#1f2937",
                        }}
                      >
                        {faq.q}
                        <span>{openFaq === index ? "−" : "+"}</span>
                      </button>
                      {openFaq === index ? (
                        <div style={{ padding: "12px 18px 16px", background: "#f0fdf4", color: "#374151", lineHeight: 1.75, fontSize: "0.87rem" }}>
                          {faq.a}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {camp.cancellationPolicy.length > 0 ? (
              <section style={{ background: "#fff5f5", borderRadius: 18, padding: "24px 28px", border: "1px solid #fecaca", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#dc2626", marginBottom: 14, fontSize: "1.08rem" }}>Cancellation Policy</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {camp.cancellationPolicy.map((item, index) => (
                    <li key={index} style={{ color: "#374151", lineHeight: 1.75, marginBottom: 8 }}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {camp.rules.length > 0 ? (
              <section style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 14, fontSize: "1.08rem" }}>Rules & Regulations</h3>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {camp.rules.map((item, index) => (
                    <li key={index} style={{ color: "#374151", lineHeight: 1.75, marginBottom: 8 }}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>Starting From</div>
                <div>
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "#059669" }}>₹{camp.price}</span>
                  {camp.originalPrice ? (
                    <span style={{ fontSize: "0.85rem", color: "#9ca3af", textDecoration: "line-through", marginLeft: 8 }}>
                      ₹{camp.originalPrice}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>per person · {camp.duration?.toLowerCase() || "overnight"}</div>
              </div>

              {camp.nextDates.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: 8 }}>Upcoming Dates</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {camp.nextDates.slice(0, 5).map((date, index) => (
                      <div key={`${date}_${index}`} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "9px 12px", fontSize: "0.83rem", color: "#065f46", fontWeight: 700 }}>
                        {date}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {camp.offers.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: 8 }}>Available Offers</div>
                  {camp.offers.map((offer, index) => (
                    <div key={`${offer.code}_${index}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <code style={{ background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 6, fontWeight: 800, fontSize: "0.78rem" }}>
                        {offer.code}
                      </code>
                      <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{offer.desc}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <BookingCTA
                  trek={{
                    name: camp.shortName || camp.name,
                    price: camp.price,
                    location: camp.location,
                    productType: "camping",
                    nextDate: camp.nextDates?.[0] || "",
                  }}
                  label="Book Now"
                  block
                  style={{ background: "#059669", color: "#fff", borderRadius: 10, padding: "12px 14px", fontWeight: 800, fontSize: "0.95rem", textDecoration: "none", minHeight: 44 }}
                />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", background: "#ecfdf5", color: "#047857", borderRadius: 10, padding: "11px 14px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", textAlign: "center", border: "1px solid #86efac" }}
                >
                  WhatsApp Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .container > div[style*="grid-template-columns: 1fr 340px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
        }

        @media (max-width: 768px) {
          section[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 170px 120px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
