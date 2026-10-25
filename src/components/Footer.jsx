import { Link } from "react-router-dom";
import logo from "../assets/gadvedelogo.png";
import { CONTACT, telHref, whatsappHref } from "../config/contact";
// Footer updated: FAQ moved here from Header nav

function Footer() {
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
            <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
              At Gadvede Trekkers, we provide safe, affordable, and
              unforgettable adventure experiences across India.
            </p>
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
              <li><Link className="footer-link" to="/corporate">College Industrial Visits</Link></li>
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
              <li><Link className="footer-link" to="/about">About Us</Link></li>
              <li><Link className="footer-link" to="/contact">Contact</Link></li>
              <li><Link className="footer-link" to="/faq">FAQ</Link></li>
              <li><span className="footer-link" style={{ cursor: "default" }}>Privacy Policy</span></li>
              <li><Link className="footer-link" to="/cancellation-policy">Cancellation Policy</Link></li>
              <li><span className="footer-link" style={{ cursor: "default" }}>Terms & Conditions</span></li>
            </ul>
          </div>

          {/* OFFICE */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">Our Office</h5>
            <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="d-block">{line}</span>
              ))}
            </p>
            <p style={{ fontSize: "14px", lineHeight: "1.8" }} className="mb-0">
              {CONTACT.phones.map((phone) => (
                <a key={phone} href={telHref(phone)} className="footer-link d-block">📞 {phone}</a>
              ))}
              <a href={`mailto:${CONTACT.email}`} className="footer-link d-block">✉️ {CONTACT.email}</a>
            </p>
            <h5 className="fw-bold mb-2 mt-3">Follow Us</h5>
            <div className="d-flex gap-2 flex-wrap">
              {[
                { label: "Instagram", href: CONTACT.social.instagram },
                { label: "YouTube", href: CONTACT.social.youtube },
                { label: "WhatsApp", href: whatsappHref("Hi Gadvede Trekkers!") },
              ].map((s) => (
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

        {/* COPYRIGHT */}
        <div className="text-center mt-4 pt-3 border-top border-light">
          <p className="mb-0" style={{ fontSize: "14px" }}>
            © {new Date().getFullYear()} Gadvede Trekkers. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;