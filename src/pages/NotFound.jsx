import { Link } from "react-router-dom";
import { CONTACT, whatsappHref } from "../config/contact";
import { formatWhatsappDisplay, getWhatsappNumber } from "../config/whatsappSetting";
import { useSeo } from "../seo/useSeo";
import { NOT_FOUND_SEO } from "../seo/publicSeo";
import { useSiteData } from "../config/siteContent";

/**
 * Public 404 page (FIX-05). Used for unknown URLs and for product slugs that are not in the live
 * catalogue. It sets `noindex` and removes the canonical link, and it never emits product JSON-LD.
 *
 * A single-page app cannot change the HTTP status of the HTML it is served with: the real 404
 * status for unknown URLs comes from the host (see public/404.html and docs on the Render rules).
 */
const S = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "120px 20px 70px", textAlign: "center", color: "#1f2d27" },
  code: { fontSize: "0.9rem", letterSpacing: ".18em", color: "#198754", fontWeight: 700, marginBottom: 8 },
  h1: { fontSize: "2rem", color: "#103528", marginBottom: 12 },
  p: { fontSize: "1.05rem", lineHeight: 1.7, color: "#3a5246" },
  row: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 24 },
};

export default function NotFound({
  title = "We couldn’t find that page",
  message = "The link may be old or mistyped. Here are some good places to start.",
}) {
  useSiteData(); // re-render when the admin-managed contact details arrive
  useSeo(NOT_FOUND_SEO);
  return (
    <main style={S.wrap} data-testid="not-found-page">
      <div style={S.code}>404</div>
      <h1 style={S.h1}>{title}</h1>
      <p style={S.p}>{message}</p>
      <div style={S.row}>
        <Link to="/" className="btn btn-success">Home</Link>
        <Link to="/treks" className="btn btn-outline-success">Treks</Link>
        <Link to="/tours" className="btn btn-outline-success">Tours</Link>
        <Link to="/camping" className="btn btn-outline-success">Camping</Link>
        <Link to="/contact" className="btn btn-outline-success">Contact</Link>
      </div>
      <p style={{ ...S.p, marginTop: 28 }}>
        Looking for a particular trip? Message us on WhatsApp at{" "}
        <a href={whatsappHref("Hi! I couldn't find a page on your website.")} target="_blank" rel="noopener noreferrer">
          {formatWhatsappDisplay(getWhatsappNumber())}
        </a>
        {CONTACT.email ? <> or email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></> : null}.
      </p>
    </main>
  );
}
