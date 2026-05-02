import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/gadvedelogo.png";

function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    <header ref={headerRef}>
      {/* ── Top contact bar – desktop only ── */}
      <div
        className="d-none d-lg-block"
        style={{ backgroundColor: "#146c43", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div className="container d-flex justify-content-end align-items-center py-1 gap-3">
          <span className="text-white" style={{ fontSize: "0.8rem" }}>
            📞{" "}
            <a href="tel:9856112727" className="text-white text-decoration-none fw-semibold">
              9856112727
            </a>
            {" / "}
            <a href="tel:9856122727" className="text-white text-decoration-none fw-semibold">
              9856122727
            </a>
          </span>
        </div>
      </div>

    <nav
         className="navbar navbar-expand-lg navbar-dark shadow-sm py-1 py-lg-3"
         style={{ backgroundColor: "#198754" }}>
      <div className="container">

        {/* LOGO + NAME */}
        <Link
          className="navbar-brand d-flex align-items-center fw-semibold fs-5 text-white"
          to="/"
          style={{ minWidth: 0 }}
        >
          <img
            src={logo}
            alt="Gadvede Trekkers Logo"
            style={{ height: "clamp(36px, 8vw, 80px)", marginRight: "8px", objectFit: "contain" }}
          />
          <span style={{ fontSize: "clamp(0.85rem, 3vw, 1.25rem)", lineHeight: 1.1 }}>
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
        >
          <ul className="navbar-nav align-items-center">
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
