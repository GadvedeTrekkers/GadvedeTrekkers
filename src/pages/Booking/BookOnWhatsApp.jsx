import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { productService } from "../../services/product.service";
import { buildBookingWhatsAppUrl, CTA_LABELS } from "../../config/bookingConfig";
import { whatsappHref } from "../../config/contact";
import { formatWhatsappDisplay, getWhatsappNumber } from "../../config/whatsappSetting";
import { useSeo } from "../../seo/useSeo";
import { SITE_ORIGIN } from "../../seo/publicSeo";
import NotFound from "../NotFound";
import { bookingSubject, productDetailPath, readBookParams } from "./bookingLink";

/**
 * /book (FIX-08). Booking is on WhatsApp, so this page never shows a dead-end desk:
 *  - /book?trekId=<live slug>  → the live product (name, fee) and a WhatsApp button that carries it
 *  - /book                     → pick a trip, or message us
 *  - /book?trekId=<unknown>    → the 404 page
 * Same single official number as every other button. No payment gateway, no booking records.
 */
const S = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "120px 20px 70px", textAlign: "center", color: "#1f2d27" },
  card: { background: "#fff", border: "1px solid #dbe7df", borderRadius: 14, padding: "22px 20px", margin: "20px 0", boxShadow: "0 6px 18px rgba(16,53,40,.06)" },
  h1: { fontSize: "1.8rem", color: "#103528" },
  p: { fontSize: "1.02rem", lineHeight: 1.7, color: "#3a5246" },
};

function formatFee(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  if (!raw || raw.toUpperCase() === "TBD") return "";
  return raw.startsWith("₹") ? raw : `₹${raw}`;
}

export default function BookOnWhatsApp() {
  const { search } = useLocation();
  const { slug, ref } = useMemo(() => readBookParams(search), [search]);
  // Result of the last catalogue lookup, tagged with the slug it was for (so a slug change shows "loading", not stale data).
  const [lookup, setLookup] = useState({ slug: "", status: "none", product: null });
  const state = !slug ? { status: "none" } : lookup.slug === slug ? lookup : { status: "loading" };

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    productService
      .getBySlug(slug)
      .then((product) => {
        if (cancelled) return;
        setLookup(product && product.name ? { slug, status: "found", product } : { slug, status: "missing", product: null });
      })
      .catch(() => { if (!cancelled) setLookup({ slug, status: "missing", product: null }); });
    return () => { cancelled = true; };
  }, [slug]);

  useSeo({
    title: "Book on WhatsApp | Gadvede Trekkers",
    description: "Book your Gadvede Trekkers trip on WhatsApp.",
    canonical: `${SITE_ORIGIN}/book`,
    robots: "noindex, follow",
  });

  if (state.status === "missing") {
    return (
      <NotFound
        title="We couldn’t find that trip"
        message="That booking link doesn’t match a trip we have open right now. Browse our current trips or message us on WhatsApp."
      />
    );
  }

  if (state.status === "loading") {
    return <main style={S.wrap} data-testid="book-loading"><p style={S.p}>Loading…</p></main>;
  }

  if (state.status === "found") {
    const { product } = state;
    const subject = bookingSubject(product, { ref });
    const fee = formatFee(product.price ?? product.fees);
    return (
      <main style={S.wrap} data-testid="book-whatsapp-product">
        <h1 style={S.h1}>Book {product.name}</h1>
        <div style={S.card}>
          <p style={{ ...S.p, margin: 0 }}>
            {[product.location, product.duration].filter(Boolean).join(" · ")}
            {fee ? <><br /><strong>From {fee}</strong> per person</> : null}
          </p>
        </div>
        <p style={S.p}>We take bookings on WhatsApp. Tap the button and your message to us is pre-filled with this trip. We’ll confirm dates, pickup and payment there.</p>
        <p>
          <a
            className="btn btn-success btn-lg"
            href={buildBookingWhatsAppUrl(subject)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Book ${product.name} on WhatsApp`}
          >
            {CTA_LABELS.WHATSAPP}
          </a>
        </p>
        <p style={S.p}>
          Want to see dates and the itinerary first?{" "}
          <Link to={productDetailPath(product, slug)}>View the trip page</Link>.
        </p>
      </main>
    );
  }

  return (
    <main style={S.wrap} data-testid="book-whatsapp-generic">
      <h1 style={S.h1}>Book on WhatsApp</h1>
      <p style={S.p}>Choose a trip, then tap “{CTA_LABELS.WHATSAPP}” on its page. Or message us and we’ll help you pick.</p>
      <div className="d-flex flex-wrap gap-2 justify-content-center my-3">
        <Link to="/treks" className="btn btn-outline-success">Treks</Link>
        <Link to="/tours" className="btn btn-outline-success">Tours</Link>
        <Link to="/camping" className="btn btn-outline-success">Camping</Link>
      </div>
      <p>
        <a
          className="btn btn-success btn-lg"
          href={whatsappHref("Hi 👋 I want to book a trip with Gadvede Trekkers.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          {CTA_LABELS.WHATSAPP}
        </a>
      </p>
      <p style={S.p}>WhatsApp {formatWhatsappDisplay(getWhatsappNumber())}</p>
    </main>
  );
}
