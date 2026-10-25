import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/gadvedelogo.png";
import { CONTACT, telHref, whatsappHref } from "../config/contact";

function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);
  const rentalCategories = ["Tents"];
  const featuredTours = [
    { label: "Goa", to: "/tours/goa-backpacking" },
    { label: "Malvan Tarkarli", to: "/tours/malvan-tarkarli-with-scuba-diving-and-watersports" },
    { label: "Hampi", to: "/tours/hampi-tour" },
    { label: "Hampi Gokarna Murudeshwar", to: "/tours/hampi-gokarna-murudeshwar" },
    { label: "Gokarna Murudeshwar", to: "/tours/gokarna-honnavar-murudeshwar" },
  ];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) {
        setMobileNavOpen(false);
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  // Scroll effect
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileNav = () => {
    setMobileNavOpen((current) => {
      const next = !current;
      if (!next) {
        setOpenMenu(null);
      }
      return next;
    });
  };

  const closeMenus = () => {
    setMobileNavOpen(false);
    setOpenMenu(null);
  };

  const toggleDropdownMenu = (menuName) => {
    setOpenMenu((current) => (current === menuName ? null : menuName));
  };

  return (
    <header ref={headerRef} style={{ position: "sticky", top: 0, zIndex: 1030, transition: "all 0.3s ease" }}>
      {/* ── Top contact bar – desktop only ── */}
      <div
        className={`gt-topbar d-none d-lg-block ${isScrolled ? "d-lg-none" : ""}`}
        style={{
          backgroundColor: "#146c43",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          width: "100%",
        }}
      >
        <div
          className="container d-flex align-items-center justify-content-center flex-wrap gap-2"
          style={{ minHeight: 34, padding: "6px 12px", fontSize: "0.85rem", lineHeight: 1.4, color: "#fff", fontWeight: 600 }}
        >
          <span aria-hidden="true">📞</span>
          <span>For More Details &amp; Registration – Call:</span>
          {CONTACT.phones.map((phone, i) => (
            <span key={phone} className="d-inline-flex align-items-center gap-2">
              {i > 0 && <span aria-hidden="true" style={{ opacity: 0.6 }}>/</span>}
              <a href={telHref(phone)} className="text-white text-decoration-none" style={{ whiteSpace: "nowrap" }}>
                {phone}
              </a>
            </span>
          ))}
          <span aria-hidden="true" style={{ opacity: 0.6 }}>·</span>
          <a
            href={whatsappHref("Hi Gadvede Trekkers! I'd like more details.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-decoration-none"
            style={{ whiteSpace: "nowrap" }}
          >
            WhatsApp us
          </a>
        </div>
      </div>

    <nav
         className="navbar navbar-expand-lg navbar-dark shadow-sm"
         style={{ 
           backgroundColor: "#198754", 
           paddingTop: isScrolled ? "0.25rem" : "0.25rem", 
           paddingBottom: isScrolled ? "0.25rem" : "0.25rem",
           transition: "all 0.3s ease"
         }}>
      <div className="container">

        {/* LOGO + NAME */}
        <Link
          className="navbar-brand d-flex align-items-center fw-semibold fs-5 text-white me-auto"
          to="/"
          style={{ minWidth: 0, transition: "all 0.3s ease" }}
        >
          <img
            src={logo}
            alt="Gadvede Trekkers Logo"
            style={{ 
              height: isScrolled ? "clamp(24px, 4vw, 32px)" : "clamp(32px, 6vw, 56px)", 
              marginRight: isScrolled ? "6px" : "10px", 
              objectFit: "contain",
              transition: "all 0.3s ease"
            }}
          />
          <span style={{ 
            fontSize: isScrolled ? "clamp(0.75rem, 2vw, 1rem)" : "clamp(1rem, 3vw, 1.6rem)", 
            lineHeight: 1.2, 
            fontWeight: 800,
            transition: "all 0.3s ease"
          }}>
            Gadvede Trekkers
          </span>
        </Link>

        {/* Mobile phone number – shown between logo and hamburger */}
        <a
          href={telHref(CONTACT.phones[0])}
          className="d-lg-none text-white text-decoration-none ms-auto me-2"
          style={{ fontSize: "0.78rem", whiteSpace: "nowrap", lineHeight: 1.4, padding: "4px 0" }}
          aria-label={`Call ${CONTACT.phones[0]}`}
        >
          📞 {CONTACT.phones[0]}
        </a>

        <button
          className={`navbar-toggler border-0 mobile-nav-toggle ${
            mobileNavOpen ? "is-open" : ""
          }`}
          type="button"
          onClick={toggleMobileNav}
          aria-expanded={mobileNavOpen}
          aria-label="Toggle navigation"
        >
          <span className="mobile-nav-line"></span>
          <span className="mobile-nav-line"></span>
          <span className="mobile-nav-line"></span>
        </button>

        <div
          className={`navbar-collapse justify-content-end mobile-nav-panel ${
            mobileNavOpen ? "is-open" : ""
          }`}
          id="navbarContent"
          style={{ fontWeight: 600 }}
        >
          <ul className="navbar-nav align-items-center" style={{ marginLeft: "20px" }}>
            <li
              className="nav-item dropdown mx-3"
              onMouseEnter={() => setOpenMenu("events")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <span
                className={`nav-link dropdown-toggle text-white ${
                  openMenu === "events" ? "show" : ""
                }`}
                role="button"
                aria-expanded={openMenu === "events"}
                onClick={() => toggleDropdownMenu("events")}
              >
                Events Category
              </span>
              <ul className={`dropdown-menu ${openMenu === "events" ? "show" : ""}`} style={{ minWidth: "280px" }}>
                <li>
                  <Link className="dropdown-item" to="/treks" onClick={closeMenus}>
                    🥾 Treks
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/camping" onClick={closeMenus}>
                    ⛺ Camping
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/tours" onClick={closeMenus}>
                    🗺 Tours
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <span className="dropdown-item-text fw-semibold text-success">
                    Featured Tours
                  </span>
                </li>
                {featuredTours.map((tour) => (
                  <li key={tour.to}>
                    <Link className="dropdown-item" to={tour.to} onClick={closeMenus}>
                      {tour.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li
              className="nav-item dropdown mx-3"
              onMouseEnter={() => setOpenMenu("rentals")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <span
                className={`nav-link dropdown-toggle text-white ${
                  openMenu === "rentals" ? "show" : ""
                }`}
                role="button"
                aria-expanded={openMenu === "rentals"}
                onClick={() => toggleDropdownMenu("rentals")}
              >
                Rentals
              </span>
              <ul className={`dropdown-menu ${openMenu === "rentals" ? "show" : ""}`}>
                {rentalCategories.map((category) => (
                  <li key={category}>
                    <Link
                      className="dropdown-item"
                      to="/rentals"
                      state={{ category }}
                      onClick={closeMenus}
                    >
                      {category}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link className="dropdown-item" to="/villas" onClick={closeMenus}>
                    🏡 Villas
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item mx-3">
              <Link className="nav-link text-white" to="/industrial-visits" onClick={closeMenus}>
                College Industrial Visits
              </Link>
            </li>

            {/* Corporate Dropdown */}
            <li
              className="nav-item dropdown mx-3"
              onMouseEnter={() => setOpenMenu("corporate")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <span
                className={`nav-link dropdown-toggle text-white ${openMenu === "corporate" ? "show" : ""}`}
                role="button"
                aria-expanded={openMenu === "corporate"}
                onClick={() => toggleDropdownMenu("corporate")}
              >
                Corporate
              </span>
              <ul className={`dropdown-menu ${openMenu === "corporate" ? "show" : ""}`}>
                <li>
                  <Link className="dropdown-item" to="/corporate/trek" onClick={closeMenus}>
                    🏔 Corporate Trek
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/corporate/camping" onClick={closeMenus}>
                    ⛺ Corporate Camping
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/corporate/team-building" onClick={closeMenus}>
                    🤝 Team Building Activities
                  </Link>
                </li>
              </ul>
            </li>

            {/* Opportunities Dropdown */}
            <li
              className="nav-item dropdown mx-3"
              onMouseEnter={() => setOpenMenu("opportunities")}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <span
                className={`nav-link dropdown-toggle text-white ${openMenu === "opportunities" ? "show" : ""}`}
                role="button"
                aria-expanded={openMenu === "opportunities"}
                onClick={() => toggleDropdownMenu("opportunities")}
              >
                Opportunities
              </span>
              <ul className={`dropdown-menu ${openMenu === "opportunities" ? "show" : ""}`}>
                <li>
                  <Link className="dropdown-item" to="/partner" onClick={closeMenus}>
                    🤝 Join Our Team
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/list-property" onClick={closeMenus}>
                    🏠 List Your Property
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/list-campsite" onClick={closeMenus}>
                    ⛺ List Your Campsite
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/list-event" onClick={closeMenus}>
                    📅 List Your Event
                  </Link>
                </li>
              </ul>
            </li>

          </ul>
        </div>

      </div>
    </nav>
    </header>
  );
}

export default Header;
