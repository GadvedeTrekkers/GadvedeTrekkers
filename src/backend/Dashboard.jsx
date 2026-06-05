import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAdminItems } from "../data/adminStorage";
import InfoTooltip from "../components/InfoTooltip";
import { getAllBookings } from "../data/bookingStorage";
import { getTransactionStats } from "../data/transactionStorage";
import { getAllCustomers } from "../data/customerStorage";
import { getAllEmergencyContacts, saveEmergencyContact, deleteEmergencyContact } from "../data/emergencyStorage";
import { getAllTrekPayments, hydrateTrekPaymentsFromBackend } from "../data/trekPaymentStorage";
import { getAllIncentives } from "../data/incentiveStorage";
import { syncFromTrekPayments, getMissingActions, STAGE_LABELS, STAGE_COLORS } from "../data/trekEventStorage";

const SECTIONS = [
  { label: "Treks",          icon: "🥾", key: "gt_treks",    path: "/admin/treks",    color: "#198754" },
  { label: "Tours",          icon: "🗺",  key: "gt_tours",    path: "/admin/tours",    color: "#0d6efd" },
  { label: "Heritage Walks", icon: "🏛",  key: "gt_heritage", path: "/admin/heritage", color: "#6f42c1" },
  { label: "Camping",        icon: "⛺",  key: "gt_camping",  path: "/admin/camping",  color: "#fd7e14" },
  { label: "Rentals",        icon: "🏠",  key: "gt_rentals",  path: "/admin/rentals",  color: "#dc3545" },
];

const QUOTES = [
  { text: "The mountains are calling and I must go.", author: "John Muir" },
  { text: "Every mountain top is within reach if you just keep climbing.", author: "Barry Finlay" },
  { text: "It's not the mountain we conquer, but ourselves.", author: "Sir Edmund Hillary" },
  { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir" },
  { text: "The climb is tough, but the view from the top is priceless.", author: "Unknown" },
  { text: "Adventure is worthwhile in itself.", author: "Amelia Earhart" },
  { text: "Nature is not a place to visit. It is home.", author: "Gary Snyder" },
];

const SAFETY_RULES = [
  { icon: "🧭", rule: "Follow guide instructions at all times" },
  { icon: "💧", rule: "Carry at least 2 litres of water per person" },
  { icon: "🗑",  rule: "Avoid littering — carry a trash bag" },
  { icon: "👥", rule: "Stay with the group — never trek alone" },
  { icon: "📵", rule: "Conserve phone battery for emergencies" },
  { icon: "🌦", rule: "Check weather forecast before departure" },
];

const EMPTY_CONTACT = { name: "", contactNumber: "", location: "", type: "Hospital" };

function fmt(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }

function Dashboard() {
  const [syncTick, setSyncTick] = useState(0);
  const stats = SECTIONS.map((s) => ({ ...s, count: getAdminItems(s.key).length }));
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const txnStats      = getTransactionStats();
  const bookingCount  = getAllBookings().length;
  const customerCount = getAllCustomers().length;

  /* ── Financial health ── */
  const bookings    = useMemo(() => getAllBookings(),     []);
  const trekPayments = useMemo(() => getAllTrekPayments(), [syncTick]);
  const incentives   = useMemo(() => getAllIncentives(),   []);
  const trekEvents   = useMemo(() => syncFromTrekPayments(), [syncTick]);

  const revenue      = bookings.filter(b => b.status !== "CANCELLED").reduce((s, b) => s + Number(b.pricePaid || 0), 0);
  const leaderFees   = trekPayments.reduce((s, p) => s + Number(p.calculations?.leaderFee || 0), 0);
  const foodCosts    = trekPayments.reduce((s, p) => s + Number(p.calculations?.foodTotal || 0), 0);
  const transport    = trekPayments.reduce((s, p) => s + Number(p.calculations?.transportTotal || 0), 0);
  const entryCosts   = trekPayments.reduce((s, p) => s + Number(p.calculations?.entryTotal || 0), 0);
  const incentiveAmt = incentives.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = leaderFees + foodCosts + transport + entryCosts + incentiveAmt;
  const gst          = Math.round(revenue * 0.05);
  const netProfit    = revenue - totalExpenses - gst;

  /* ── Trek timeline — next 6 upcoming events ── */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingEvents = trekEvents
    .filter(e => e.trekDate && new Date(e.trekDate) >= today)
    .sort((a, b) => new Date(a.trekDate) - new Date(b.trekDate))
    .slice(0, 6);
  const alertCount = trekEvents.filter(e => getMissingActions(e).some(a => a.severity === "high")).length;

  /* ── Quote rotation ── */
  const [quoteIdx, setQuoteIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    hydrateTrekPaymentsFromBackend().then(() => {
      if (active) setSyncTick((tick) => tick + 1);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  /* ── Emergency contacts ── */
  const [contacts, setContacts]       = useState(() => getAllEmergencyContacts());
  const [showForm, setShowForm]       = useState(false);
  const [formContact, setFormContact] = useState(EMPTY_CONTACT);
  const [editingId, setEditingId]     = useState(null);

  const refreshContacts = () => setContacts(getAllEmergencyContacts());

  const handleSave = () => {
    if (!formContact.name || !formContact.contactNumber) return;
    saveEmergencyContact({ ...formContact, id: editingId || undefined });
    setShowForm(false);
    setFormContact(EMPTY_CONTACT);
    setEditingId(null);
    refreshContacts();
  };

  const handleEdit = (c) => {
    setFormContact({ name: c.name, contactNumber: c.contactNumber, location: c.location, type: c.type });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this contact?")) { deleteEmergencyContact(id); refreshContacts(); }
  };

  return (
    <div className="adm-page">
      <h3 className="adm-page-title">
        Dashboard
        <InfoTooltip text="Real-time overview of bookings, revenue, trek events, and all listings. Financial figures pull from transactions and trek payment records." />
      </h3>
      <p className="text-muted mb-4">Overview of all your listings on the website.</p>

      {/* ── Motivational Quote ── */}
      <div className="adm-quote-card mb-4">
        <div className="adm-quote-icon">💬</div>
        <div>
          <p className="adm-quote-text">"{QUOTES[quoteIdx].text}"</p>
          <p className="adm-quote-author">— {QUOTES[quoteIdx].author}</p>
        </div>
      </div>

      {/* ── Listing counts ── */}
      <div className="adm-total-banner mb-4">
        <span className="adm-total-num">{total}</span>
        <span className="adm-total-label">Total Admin Listings</span>
      </div>

      <div className="adm-stat-grid">
        {stats.map((s) => (
          <Link key={s.key} to={s.path} className="adm-stat-card" style={{ "--card-accent": s.color }}>
            <span className="adm-stat-icon">{s.icon}</span>
            <div className="adm-stat-body">
              <div className="adm-stat-count">{s.count}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
            <span className="adm-stat-arrow">→</span>
          </Link>
        ))}
      </div>

      {/* ── Financial Health Widgets ── */}
      <h5 className="mt-4 mb-3 fw-semibold">
        💰 Financial Health
        <InfoTooltip text="Revenue = sum of all confirmed booking payments. Expenses = leader fees + food + transport + entry costs. GST is calculated at 5% of revenue. Net Profit = Revenue − Expenses − GST − Incentives." />
      </h5>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "💰", label: "Revenue Collected", value: fmt(revenue), color: "#16a34a", bg: "#f0fdf4" },
          { icon: "💸", label: "Total Expenses", value: fmt(totalExpenses), color: "#dc2626", bg: "#fef2f2" },
          { icon: "🧾", label: "GST (5%)", value: fmt(gst), color: "#7c3aed", bg: "#f5f3ff" },
          { icon: netProfit >= 0 ? "📈" : "📉", label: netProfit >= 0 ? "Net Profit" : "Net Loss", value: fmt(Math.abs(netProfit)), color: netProfit >= 0 ? "#16a34a" : "#dc2626", bg: netProfit >= 0 ? "#f0fdf4" : "#fef2f2" },
          { icon: "🔗", label: "Referral Incentives", value: fmt(incentiveAmt), color: "#0284c7", bg: "#f0f9ff" },
        ].map(w => (
          <Link key={w.label} to="/admin/earnings" style={{ textDecoration: "none" }}>
            <div style={{ background: w.bg, border: `1px solid ${w.color}25`, borderLeft: `4px solid ${w.color}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{w.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: w.color }}>{w.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{w.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Trek Timeline ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h5 className="fw-semibold mb-0">🏔 Upcoming Trek Events</h5>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {alertCount > 0 && (
            <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
              ⚠️ {alertCount} need attention
            </span>
          )}
          <Link to="/admin/reports" className="btn btn-outline-success btn-sm" style={{ fontSize: 11 }}>
            View All →
          </Link>
        </div>
      </div>
      {upcomingEvents.length === 0 ? (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 16px", marginBottom: 24, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
          No upcoming trek events. <Link to="/admin/earnings">Initiate a payment</Link> to create one.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginBottom: 24 }}>
          {upcomingEvents.map(evt => {
            const alerts = getMissingActions(evt);
            const daysTo = Math.round((new Date(evt.trekDate) - today) / 86400000);
            const doneTasks = evt.tasks.filter(t => t.status === "DONE").length;
            const totalTasks = evt.tasks.length;
            const pct = Math.round((doneTasks / totalTasks) * 100);
            const stageColor = STAGE_COLORS[evt.currentStage];
            return (
              <Link key={evt.eventId} to="/admin/reports" style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: `1px solid ${alerts.some(a => a.severity === "high") ? "#fecaca" : "#e2e8f0"}`, borderLeft: `4px solid ${stageColor}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>{evt.trekName}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                    📅 {evt.trekDate}
                    <span style={{ marginLeft: 6, color: daysTo <= 3 ? "#d97706" : "#16a34a", fontWeight: 600 }}>
                      {daysTo === 0 ? "Today!" : `in ${daysTo}d`}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ background: stageColor + "20", color: stageColor, padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                      {STAGE_LABELS[evt.currentStage]}
                    </span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{doneTasks}/{totalTasks} tasks</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#22c55e" : stageColor, borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                  {alerts.some(a => a.severity === "high") && (
                    <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 4 }}>⚠️ Action required</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Bookings & Revenue ── */}
      <h5 className="mt-4 mb-3 fw-semibold">Bookings & Revenue</h5>
      <div className="adm-stat-grid">
        <Link to="/admin/bookings" className="adm-stat-card" style={{ "--card-accent": "#0891b2" }}>
          <span className="adm-stat-icon">📋</span>
          <div className="adm-stat-body"><div className="adm-stat-count">{bookingCount}</div><div className="adm-stat-label">Bookings</div></div>
          <span className="adm-stat-arrow">→</span>
        </Link>
        <Link to="/admin/customers" className="adm-stat-card" style={{ "--card-accent": "#7c3aed" }}>
          <span className="adm-stat-icon">👤</span>
          <div className="adm-stat-body"><div className="adm-stat-count">{customerCount}</div><div className="adm-stat-label">Customers</div></div>
          <span className="adm-stat-arrow">→</span>
        </Link>
        <Link to="/admin/transactions" className="adm-stat-card" style={{ "--card-accent": "#059669" }}>
          <span className="adm-stat-icon">💳</span>
          <div className="adm-stat-body"><div className="adm-stat-count">₹{txnStats.revenue.toLocaleString("en-IN")}</div><div className="adm-stat-label">Revenue ({txnStats.success} txns)</div></div>
          <span className="adm-stat-arrow">→</span>
        </Link>
        <Link to="/admin/transactions" className="adm-stat-card" style={{ "--card-accent": "#dc2626" }}>
          <span className="adm-stat-icon">↩️</span>
          <div className="adm-stat-body"><div className="adm-stat-count">{txnStats.refunded}</div><div className="adm-stat-label">Refunded Txns</div></div>
          <span className="adm-stat-arrow">→</span>
        </Link>
      </div>

      {/* ── Safety Rules ── */}
      <h5 className="mt-5 mb-3 fw-semibold">🛡 Trekking Safety Rules</h5>
      <div className="adm-safety-grid">
        {SAFETY_RULES.map((r, i) => (
          <div key={i} className="adm-safety-card">
            <span className="adm-safety-icon">{r.icon}</span>
            <span className="adm-safety-rule">{r.rule}</span>
          </div>
        ))}
      </div>

      {/* ── Emergency Contacts ── */}
      <div className="d-flex align-items-center justify-content-between mt-5 mb-3">
        <h5 className="fw-semibold mb-0">🚨 Emergency Contacts</h5>
        <button className="btn btn-sm btn-outline-danger" onClick={() => { setShowForm((v)=>!v); setFormContact(EMPTY_CONTACT); setEditingId(null); }}>
          {showForm ? "✕ Cancel" : "+ Add Contact"}
        </button>
      </div>

      {showForm && (
        <div className="adm-emergency-form mb-3">
          <select className="form-select form-select-sm" style={{ flex: 1 }} value={formContact.type} onChange={(e) => setFormContact((f) => ({ ...f, type: e.target.value }))}>
            <option>Hospital</option><option>Rescue Team</option><option>Local Authority</option><option>Police</option><option>Forest Dept.</option>
          </select>
          <input className="form-control form-control-sm" placeholder="Name *" value={formContact.name} onChange={(e) => setFormContact((f) => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} />
          <input className="form-control form-control-sm" placeholder="Contact Number *" value={formContact.contactNumber} onChange={(e) => setFormContact((f) => ({ ...f, contactNumber: e.target.value }))} style={{ flex: 1.5 }} />
          <input className="form-control form-control-sm" placeholder="Location" value={formContact.location} onChange={(e) => setFormContact((f) => ({ ...f, location: e.target.value }))} style={{ flex: 2 }} />
          <button className="btn btn-sm btn-success" onClick={handleSave}>{editingId ? "Update" : "Save"}</button>
        </div>
      )}

      {contacts.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 13 }}>No emergency contacts added yet.</p>
      ) : (
        <div className="adm-table-wrap mb-5">
          <table className="table table-hover adm-table mb-0">
            <thead><tr><th>Type</th><th>Name</th><th>Contact</th><th>Location</th><th style={{ width: 90 }}>Actions</th></tr></thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td><span className={`adm-emergency-badge adm-emergency-badge--${c.type?.toLowerCase().replace(/\s/g,'')}`}>{c.type}</span></td>
                  <td><strong>{c.name}</strong></td>
                  <td><a href={`tel:${c.contactNumber}`}>{c.contactNumber}</a></td>
                  <td>{c.location || "—"}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-secondary btn-sm py-0 px-1" style={{ fontSize: 11 }} onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm py-0 px-1" style={{ fontSize: 11 }} onClick={() => handleDelete(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Quick Add ── */}
      <h5 className="mt-4 mb-3 fw-semibold">Quick Add</h5>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {SECTIONS.map((s) => (
          <Link key={s.key} to={s.path} className="btn btn-outline-success btn-sm">{s.icon} Add {s.label}</Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
