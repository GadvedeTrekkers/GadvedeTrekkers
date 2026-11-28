import { Link } from "react-router-dom";
import logo from "../assets/gadvedelogo-256.png";
import { CONTACT, telHref, whatsappHref } from "../config/contact";
import { DESTINATION_HUBS } from "../../shared/destinationHubs.js";
import { useSiteData } from "../config/siteContent";
import { isFilled } from "../../shared/siteContent.js";

/* Footer copy, contact details and which policy pages are linked all come from the admin (t129u):
   text → Admin → Settings → Site Content → "Footer text"; contact → Profile Setup; a page link appears only once
   that page is PUBLISHED in Site Content (About, FAQ, Privacy, Terms, Cancellation). */
const PAGE_LINKS = [
  { key: "pages.about", to: "/about", label: "About Us" },
  { key: "pages.faq", to: "/faq", label: "FAQ" },
  { key: "pages.privacy", to: "/privacy-policy", label: "Privacy Policy" },
  { key: "pages.cancellation", to: "/cancellation-policy", label: "Cancellation Policy" },
  { key: "pages.terms", to: "/terms", label: "Terms & Conditions" },
];

function Footer() {
  const { content } = useSiteData();
  const about = isFilled("site.footer", content["site.footer"]) ? content["site.footer"].about : "";
  const published = (key) => isFilled(key, content[key]);
  const socials = [
    { label: "Instagram", href: CONTACT.social.instagram },
    { label: "YouTube", href: CONTACT.social.youtube },
    { label: "Facebook", href: CONTACT.social.facebook },
    { label: "WhatsApp", href: whatsappHref() },
  ].filter((s) => s.href);
  return (
    <footer
      className="py-5 mt-5 text-white"
      style={{ backgroundColor: "#198754" }}
    >
      <div className="container">
        <div className="row text-start g-4">

          {/* LEFT SECTION */}
          <div className="col-md-3 mb-4">
            <img
              src={logo}
              alt="Gadvede Logo"
              style={{ width: "80px" }}
              className="mb-3"
            />
            {about && <p style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-line" }}>{about}</p>}
          </div>

          {/* EXPLORE */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Explore</h5>
            <ul className="list-unstyled">
              <li><Link className="footer-link" to="/treks">Treks</Link></li>
              <li><Link className="footer-link" to="/tours">Tours</Link></li>
              <li><Link className="footer-link" to="/camping">Camping</Link></li>
              <li><Link className="footer-link" to="/rentals">Rentals</Link></li>
              <li><Link className="footer-link" to="/heritage">Heritage Walks</Link></li>
            </ul>
          </div>

          {/* CORPORATE */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Corporate</h5>
            <ul className="list-unstyled">
              <li><Link className="footer-link" to="/corporate/trek">Corporate Trek</Link></li>
              <li><Link className="footer-link" to="/corporate/camping">Corporate Camping</Link></li>
              <li><Link className="footer-link" to="/corporate/team-building">Team Building</Link></li>
              <li><Link className="footer-link" to="/industrial-visits">College Industrial Visits</Link></li>
            </ul>
          </div>

          {/* OPPORTUNITIES */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Opportunities</h5>
            <ul className="list-unstyled">
              <li><Link className="footer-link" to="/partner">Join Our Team</Link></li>
              <li><Link className="footer-link" to="/list-property">List Your Property</Link></li>
              <li><Link className="footer-link" to="/list-campsite">List Your Campsite</Link></li>
              <li><Link className="footer-link" to="/list-event">List Your Event</Link></li>
            </ul>
          </div>

          {/* COMPANY & SUPPORT */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Company</h5>
            <ul className="list-unstyled">
              <li><Link className="footer-link" to="/contact">Contact</Link></li>
              <li><Link className="footer-link" to="/register">Paid by bank / UPI? Register</Link></li>
              {PAGE_LINKS.filter((l) => published(l.key)).map((l) => (
                <li key={l.key}><Link className="footer-link" to={l.to}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* OFFICE */}
          <div className="col-md-2 mb-4">
            {CONTACT.addressLines.length > 0 && <h5 className="fw-bold mb-3">Our Office</h5>}
            <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="d-block">{line}</span>
              ))}
            </p>
            <p style={{ fontSize: "14px", lineHeight: "1.8" }} className="mb-0">
              {CONTACT.phones.map((phone) => (
                <a key={phone} href={telHref(phone)} className="footer-link d-block">📞 {phone}</a>
              ))}
              {CONTACT.email && <a href={`mailto:${CONTACT.email}`} className="footer-link d-block">✉️ {CONTACT.email}</a>}
            </p>
            {socials.length > 0 && <h5 className="fw-bold mb-2 mt-3">Follow Us</h5>}
            <div className="d-flex gap-2 flex-wrap">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                  style={{ fontSize: 13, border: "1px solid rgba(255,255,255,0.3)", padding: "3px 10px", borderRadius: 999 }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* POPULAR COLLECTIONS (destination hubs) */}
        <nav aria-label="Popular trip collections" className="mt-2">
          <h5 className="fw-bold mb-2" style={{ fontSize: 15 }}>Popular collections</h5>
          <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
            {DESTINATION_HUBS.map((hub) => (
              <li key={hub.slug}>
                <Link
                  className="footer-link"
                  to={hub.path}
                  style={{ fontSize: 13, border: "1px solid rgba(255,255,255,0.3)", padding: "3px 10px", borderRadius: 999, display: "inline-block" }}
                >
                  {hub.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* COPYRIGHT */}
        <div className="text-center mt-4 pt-3 border-top border-light">
          <p className="mb-0" style={{ fontSize: "14px" }}>
            © {new Date().getFullYear()} {CONTACT.companyName}{CONTACT.companyName ? ". " : ""}All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;