import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/gadvedelogo.png";

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
        className={`d-none d-lg-block ${isScrolled ? "d-none" : ""}`}
        style={{ 
          backgroundColor: "#146c43", 
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          transition: "all 0.3s ease",
          overflow: "hidden",
          position: "relative",
          width: "100%",
          height: "32px"
        }}
      >
        {/* Scrolling text animation - single text continuous loop */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            width: "100%"
          }}
        >
          <div
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "scrollTextLoop 30s linear infinite",
              fontSize: "0.85rem",
              color: "#fff",
              fontWeight: 600,
              lineHeight: "32px",
              willChange: "transform"
            }}
          >
            📞 For More Details & Registration - Call: 9856112727 / 9856122727
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollTextLoop {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>

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
          href="tel:9856112727"
          className="d-lg-none text-white text-decoration-none ms-auto me-2"
          style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
        >
          📞 9856112727
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
