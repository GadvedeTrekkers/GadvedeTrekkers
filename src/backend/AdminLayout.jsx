import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentAdminUser } from "../data/permissionStorage";
import { getAlerts } from "../data/notificationStorage";
import { clearAdminSession, isAdminAuthenticated } from "../data/authStorage";
import { apiRequest } from "../api/backendClient";
import { hydrateCustomers } from "../data/customerStorage";
import { hydrateBookings } from "../data/bookingStorage";
import {
  buildNavSections,
  groupIdsContainingPath,
  mergeOpenGroups,
  readOpenGroupIds,
  toggleGroupId,
  writeOpenGroupIds,
} from "./adminNav";

function NavItemLink({ item, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) => `adm-link ${isActive ? "adm-link--active" : ""}`}
    >
      <span className="adm-link-icon">{item.icon}</span>
      <span className="adm-link-label">{item.label}</span>
    </NavLink>
  );
}

function NavGroup({ group, open, onToggle, onNavigate }) {
  const panelId = `adm-nav-group-${group.id}`;
  return (
    <div
      className={`adm-nav-group ${open ? "adm-nav-group--open" : ""}`}
      data-testid={`adm-nav-group-${group.id}`}
    >
      <button
        type="button"
        className="adm-nav-group-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(group.id)}
      >
        <span className="adm-link-icon">{group.icon}</span>
        <span className="adm-nav-group-label">{group.label}</span>
        <span className="adm-nav-group-chevron" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className="adm-nav-group-items"
        hidden={!open}
        role="group"
        aria-label={group.label}
      >
        {group.items.map((item) => (
          <NavItemLink key={item.path} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentAdminUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const unreadAlerts = getAlerts().slice(0, 20).length;
  const sections = buildNavSections(user);

  const [savedOpenGroups, setSavedOpenGroups] = useState(() => {
    try {
      return readOpenGroupIds(window.localStorage);
    } catch {
      return [];
    }
  });
  const openGroups = mergeOpenGroups(
    savedOpenGroups,
    groupIdsContainingPath(location.pathname, sections),
  );

  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!isAdminAuthenticated()) navigate("/admin");
  }, [navigate]);

  /* Customers and bookings are no longer kept in localStorage: load them from
     the backend (admin JWT) into memory, then re-mount the current page once. */
  useEffect(() => {
    if (!isAdminAuthenticated()) return;
    let active = true;
    Promise.allSettled([
      apiRequest("/api/customers?limit=500", { admin: true }),
      apiRequest("/api/bookings?limit=500", { admin: true }),
    ]).then(([customers, bookings]) => {
      if (!active) return;
      if (customers.status === "fulfilled" && Array.isArray(customers.value)) hydrateCustomers(customers.value);
      if (bookings.status === "fulfilled" && Array.isArray(bookings.value)) hydrateBookings(bookings.value);
      setDataVersion((v) => v + 1);
    });
    return () => { active = false; };
  }, []);

  /* The group that owns the current page is always open (derived above).
     Manual open/closed state for the other groups is stored in localStorage. */

  const logout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const onToggleGroup = (id) => {
    setSavedOpenGroups((prev) => {
      const next = toggleGroupId(prev, id);
      try {
        writeOpenGroupIds(next, window.localStorage);
      } catch {
        /* private mode / blocked storage should not break the menu */
      }
      return next;
    });
  };

  /* Mobile slide-in menu: close on Escape and stop the page behind it scrolling. */
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setMobileNavOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);

  return (
    <div className="adm-shell">
      <aside
        id="adm-sidebar"
        className={`adm-sidebar ${mobileNavOpen ? "adm-sidebar--open" : ""}`}
        aria-label="Admin menu"
      >
        <div className="adm-brand">
          <span className="adm-brand-icon">🏔</span>
          <div>
            <div className="adm-brand-name">Gadvede Trekkers</div>
            <div className="adm-brand-sub">Admin Panel</div>
          </div>
          <button
            type="button"
            className="adm-sidebar-close"
            aria-label="Close menu"
            onClick={closeMobileNav}
          >
            ✕
          </button>
        </div>

        {/* Current logged-in user */}
        <div style={{
          margin: "8px 12px 4px", padding: "8px 12px",
          background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0",
        }}>
          <div style={{fontSize:11, color:"#64748b", marginBottom:2}}>Logged in as</div>
          <div style={{fontWeight:700, fontSize:13, color:"#0c6e44"}}>{user.name}</div>
          <div style={{fontSize:10, color:"#94a3b8", fontFamily:"monospace"}}>{user.username}</div>
        </div>

        <nav className="adm-nav">
          {sections.map((section) => (
            section.type === "group" ? (
              <NavGroup
                key={section.id}
                group={section}
                open={openGroups.includes(section.id)}
                onToggle={onToggleGroup}
                onNavigate={closeMobileNav}
              />
            ) : (
              <NavItemLink
                key={section.item.path}
                item={section.item}
                onNavigate={closeMobileNav}
              />
            )
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <a href="/" className="adm-view-site" target="_blank" rel="noopener noreferrer">
            🌐 View Website
          </a>
          <button className="adm-logout" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-mobile-topbar">
          <button
            type="button"
            className="adm-mobile-toggle"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-controls="adm-sidebar"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((value) => !value)}
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
          <div className="adm-mobile-title">Admin Panel</div>
          <div className="adm-mobile-alerts">🔔 {unreadAlerts}</div>
        </div>
        <Outlet key={dataVersion} />
      </main>
      {mobileNavOpen && <div className="adm-mobile-backdrop" onClick={closeMobileNav} />}
    </div>
  );
}

export default AdminLayout;
