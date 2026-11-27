import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentAdminUser } from "../data/permissionStorage";
import { getAlerts } from "../data/notificationStorage";
import { clearAdminSession, isAdminAuthenticated } from "../data/authStorage";
import { apiRequest } from "../api/backendClient";
import { hydrateCustomers } from "../data/customerStorage";
import { hydrateBookings } from "../data/bookingStorage";

const NAV = [
  { path: "/admin/dashboard",    icon: "📊", label: "Dashboard" },
  { path: "/admin/add-new",      icon: "➕", label: "Add New" },
  { path: "/admin/blogs",        icon: "📝", label: "Blogs" },
  { path: "/admin/treks",        icon: "🥾", label: "Treks" },
  { path: "/admin/tours",        icon: "🗺",  label: "Tours" },
  { path: "/admin/heritage",     icon: "🏛",  label: "Heritage Walks" },
  { path: "/admin/camping",      icon: "⛺",  label: "Camping" },
  { path: "/admin/rentals",      icon: "🏠",  label: "Rentals" },
  { path: "/admin/villas",       icon: "🏡",  label: "Villas on Rent" },
  { path: "/admin/industrial-visits", icon: "🎓", label: "Industrial Visits" },
  { path: "/admin/events",              icon: "📅",  label: "Events" },
  { path: "/admin/property-listings",   icon: "🏡",  label: "Property Listings" },
  { path: "/admin/campsite-listings",   icon: "⛺",  label: "Campsite Listings" },
  { path: "/admin/vendors",             icon: "🏪",  label: "Vendors" },
  { path: "/admin/bookings",     icon: "📋",  label: "Bookings" },
  { path: "/admin/enquiries",    icon: "📬",  label: "Enquiries" },
  { path: "/admin/payment-registrations", icon: "🧾", label: "Payment Registrations" },
  { path: "/admin/booking-form", icon: "🧾",  label: "Booking Desk" },
  { path: "/admin/transactions", icon: "💳",  label: "Transactions" },
  { path: "/admin/customers",    icon: "👤",  label: "Customers" },
  { path: "/admin/reports",      icon: "📈",  label: "Reports" },
  { path: "/admin/marketing",    icon: "📢",  label: "Marketing" },
  { path: "/admin/feedback",     icon: "⭐",  label: "Feedback" },
  { path: "/admin/earnings",     icon: "💰",  label: "Payments & Earnings" },
  { path: "/admin/employees",    icon: "👨‍💼", label: "Employees"  },
  { path: "/admin/training",     icon: "🎓",  label: "Training" },
  { path: "/admin/onboarding",   icon: "📋",  label: "Onboarding" },
  { path: "/admin/logs",         icon: "📋",  label: "Activity Logs" },
  { path: "/admin/docs",         icon: "📖",  label: "How It Works" },
  { path: "/admin/email-templates", icon: "✉️", label: "Email Templates" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const user = getCurrentAdminUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const unreadAlerts = getAlerts().slice(0, 20).length;

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

  const logout = () => {
    clearAdminSession();
    navigate("/admin");
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
            onClick={() => setMobileNavOpen(false)}
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
          {NAV.map(({ path, icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => `adm-link ${isActive ? "adm-link--active" : ""}`}
            >
              <span className="adm-link-icon">{icon}</span>
              {label}
            </NavLink>
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
      {mobileNavOpen && <div className="adm-mobile-backdrop" onClick={() => setMobileNavOpen(false)} />}
    </div>
  );
}

export default AdminLayout;
