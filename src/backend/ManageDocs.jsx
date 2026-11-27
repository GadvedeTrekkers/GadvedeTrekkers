import { useState, useEffect } from "react";
import { getAllCredentials } from "../data/employeePortalStorage";

/* ══════════════════════════════════════════════
   ManageDocs.jsx — Gadvede Trekkers
   User Manual · SRS · BRD · Flowcharts · Credentials
   Readable by any new team member or outsider
══════════════════════════════════════════════ */

const S = {
  page:     { fontFamily: "system-ui, sans-serif", color: "#0f172a" },
  tabBar:   { display: "flex", gap: 0, borderBottom: "2px solid #e2e8f0", marginBottom: 28, overflowX: "auto" },
  h2:       { fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6 },
  h3:       { fontSize: 16, fontWeight: 700, color: "#0f172a", marginTop: 24, marginBottom: 8 },
  h4:       { fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 16, marginBottom: 6 },
  p:        { fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 10 },
  badge:    (c) => ({ background: c + "20", color: c, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, display: "inline-block" }),
  card:     { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", marginBottom: 16 },
  table:    { width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 },
  th:       { padding: "8px 12px", background: "#f8fafc", color: "#64748b", fontWeight: 700, textAlign: "left", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  td:       { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
  chip:     (c) => ({ background: c, color: "#fff", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, display: "inline-block", marginRight: 4 }),
  box:      (c) => ({ background: c + "10", border: `2px solid ${c}40`, borderRadius: 8, padding: "8px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: c, cursor: "default" }),
  arrow:    { fontSize: 16, color: "#94a3b8", textAlign: "center", padding: "2px 0" },
  section:  { background: "#f8fafc", borderLeft: "4px solid #22c55e", borderRadius: 8, padding: "12px 16px", marginBottom: 12 },
};

function Tab({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      border: "none", borderBottom: `3px solid ${active ? "#22c55e" : "transparent"}`,
      background: "none", padding: "10px 18px", fontSize: 13,
      fontWeight: active ? 700 : 400, color: active ? "#16a34a" : "#64748b",
      cursor: "pointer", whiteSpace: "nowrap",
    }}>
      {icon} {label}
    </button>
  );
}

function FlowNode({ text, type = "process", color = "#3b82f6", sub }) {
  const shapes = {
    start:    { borderRadius: 99, background: "#16a34a", color: "#fff" },
    end:      { borderRadius: 99, background: "#dc2626", color: "#fff" },
    process:  { borderRadius: 8, background: color + "15", border: `2px solid ${color}40`, color },
    decision: { borderRadius: 8, background: "#f59e0b15", border: "2px solid #f59e0b40", color: "#b45309", fontStyle: "italic" },
    storage:  { borderRadius: 4, background: "#7c3aed15", border: "2px solid #7c3aed40", color: "#7c3aed" },
  };
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-block", padding: "8px 16px", minWidth: 160, fontSize: 12, fontWeight: 600, ...shapes[type] }}>
        {text}
        {sub && <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Arrow({ label, dir = "down" }) {
  return (
    <div style={{ textAlign: "center", padding: "3px 0", color: "#94a3b8", fontSize: 12 }}>
      {dir === "down" ? "↓" : dir === "right" ? "→" : "↑"}
      {label && <span style={{ fontSize: 10, marginLeft: 4, color: "#64748b" }}>{label}</span>}
    </div>
  );
}

function FlowRow({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
      {children}
    </div>
  );
}

/* ── Credential pill ── */
function CredRow({ role, username, password, portal, notes }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <tr>
      <td style={S.td}><strong>{role}</strong></td>
      <td style={{ ...S.td, fontFamily: "monospace", color: "#0284c7" }}>{username}</td>
      <td style={S.td}>
        <span style={{ fontFamily: "monospace", color: showPw ? "#dc2626" : "#94a3b8" }}>
          {showPw ? password : "••••••••"}
        </span>
        <button onClick={() => setShowPw(v => !v)} style={{ marginLeft: 8, background: "none", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 10, cursor: "pointer", padding: "1px 6px" }}>
          {showPw ? "Hide" : "Show"}
        </button>
      </td>
      <td style={S.td}><span style={S.badge("#0284c7")}>{portal}</span></td>
      <td style={{ ...S.td, color: "#64748b", fontSize: 11 }}>{notes}</td>
    </tr>
  );
}

/* ═════════════════════════════════════════
   TAB: USER MANUAL
═════════════════════════════════════════ */
function UserManual() {
  const modules = [
    {
      icon: "🧭", title: "Public Website Navigation", path: "/",
      desc: "The homepage and top navigation now use grouped event browsing instead of separate top-level buttons everywhere.",
      steps: [
        "Homepage sliders now showcase Treks, Campsites, Rentals, Tours, and School/Corporate packages",
        "Top navigation has an Events Category menu with Treks, Camping, and Tours",
        "Featured home-page cards for tours/camping/rentals open the respective listing or detail pages directly",
        "Use this flow when guiding customers on call or WhatsApp so they land on the right page quickly",
      ]
    },
    {
      icon: "📊", title: "Dashboard", path: "/admin/dashboard",
      desc: "Overview of all listings, financial health widgets (Revenue, Expenses, GST, Net P&L), upcoming trek events timeline, bookings & revenue counts, emergency contacts.",
      steps: ["Login at /admin with admin credentials", "View financial health cards — green = profit, red = loss", "Check Upcoming Trek Events section for active assignments", "Click 'View All →' to jump to Reports → Trek Lifecycle"]
    },
    {
      icon: "🥾", title: "Treks / Tours / Camping", path: "/admin/treks",
      desc: "Manage all publicly-listed activities (Treks, Tours, Heritage Walks, Camping, Rentals). Add/edit content — title, description, pricing, dates, images.",
      steps: ["Go to the relevant section (Treks / Tours etc.)", "Click '+ Add New' to create a listing", "Fill in name, location, difficulty, price, dates, description", "Upload cover image (base64 supported)", "Toggle Active/Inactive — inactive items hidden from public site"]
    },
    {
      icon: "📋", title: "Bookings", path: "/admin/bookings",
      desc: "View all customer bookings. Filter by status (Confirmed/Pending/Cancelled). See booking details: customer, trek, date, pickup, payment status.",
      steps: ["Go to Admin → Bookings", "Use search/filter to find specific bookings", "Click any row to expand booking details", "Payment status updates automatically when leader collects partial payment"]
    },
    {
      icon: "📬", title: "Enquiries", path: "/admin/enquiries",
      desc: "Track all incoming enquiries in a CRM-style pipeline. Enquiries are permanent records, can be archived, assigned to sales, tagged as High Intent, and auto-convert when the same customer books.",
      steps: [
        "Go to Admin → Enquiries",
        "New enquiries enter the pipeline as New Lead",
        "Use the board columns to move leads through Contacted, Quoted, Converted, or Lost",
        "View does not change the status by itself anymore",
        "Use the Assign Sales dropdown so Pratik or the assigned sales owner can handle the lead from their portal",
        "Use the High Intent tag to highlight hot leads in the dedicated section",
        "If the same customer books the same event using the same phone number or email, the enquiry auto-updates to Converted",
        "Use Archive instead of Delete — archived enquiries stay stored in CRM and customers",
      ]
    },
    {
      icon: "🧾", title: "Booking Desk", path: "/admin/booking-form",
      desc: "Control the booking experience from backend settings and give staff a separate direct-payment form for offline UPI/cash/bank-transfer bookings.",
      steps: [
        "Go to Admin → Booking Desk",
        "Read-only preview cards show the public booking copy and staff-form content",
        "Editable sections are limited to shared dropdowns and staff operational controls",
        "The public booking page now shows only the joining destinations and pickups configured for that selected trek/event",
        "The employee direct-booking form also follows the selected event’s actual departure plan instead of generic pickup lists",
        "Use Preview Staff Form to check the employee-facing booking flow before sharing it",
        "Use Copy Link to share the employee direct-booking form with login redirect support",
        "Manual direct bookings are saved tax-free and still update bookings, customers, transactions, and alerts",
      ]
    },
    {
      icon: "💰", title: "Payments & Earnings", path: "/admin/earnings",
      desc: "Two tabs: (1) Trek Payments — initiate and track vendor/leader payouts per trek event. (2) Manual Earnings — record revenue from Tent Rental, Villa, Camping, College IV.",
      steps: [
        "TREK PAYMENTS: Select trek → date → participants → assign leader + vendors",
        "WhatsApp group link field: paste group invite link — auto-shown to assigned leader",
        "System auto-calculates: Leader fee + Food (rate×pax) + Transport (fixed) + Entry (rate×pax)",
        "After trek: expand payment record → click 'Mark Paid' per recipient → enter method + reference",
        "Each trek+date combination gets its own WhatsApp link — independent records",
      ]
    },
    {
      icon: "👨‍💼", title: "Employees", path: "/admin/employees",
      desc: "Manage trek leaders, guides, and staff. Set role, pay per trek, skills, certifications, profile photo.",
      steps: ["Add employee profile with full details", "Set role = 'Trek Leader' to make them selectable in payments", "Set 'Pay Per Trek (₹)' — requires Pratik/Akshay approval", "Portal credentials auto-created on save — pending Akshay/Pratik approval"]
    },
    {
      icon: "📋", title: "Onboarding", path: "/admin/onboarding",
      desc: "Employee onboarding approval flow. Akshay and Pratik can approve/reject pending portal access requests.",
      steps: ["Approvers (Akshay/Pratik) see a banner: 'N pending approvals'", "Click View Creds to see credentials", "Click Approve → employee portal unlocked", "Click Reject → enter reason → employee blocked with reason shown on login"]
    },
    {
      icon: "🏪", title: "Vendors", path: "/admin/vendors",
      desc: "Manage food vendors and transport (bus) vendors. Each vendor has service type, contact, and rate amount.",
      steps: ["Add vendor with service type: Food or Bus", "Set rate: Food vendors = ₹/person, Bus vendors = ₹/trip (fixed)", "Rates auto-populate in Trek Payment form when vendor is selected"]
    },
    {
      icon: "👀", title: "Preview Buttons", path: "/admin/camping",
      desc: "Camping and Rentals now support preview before publishing, so you can check how the public detail page will look.",
      steps: [
        "Go to Admin → Camping or Admin → Rentals",
        "Use Preview while adding/editing an item to open a public-style preview in a new tab",
        "You can also use Preview directly from the listing row after the item is saved",
        "Preview mode does not publish changes by itself — you still need to Save Listing",
      ]
    },
    {
      icon: "📊", title: "Reports & Analytics", path: "/admin/reports",
      desc: "3 tabs: Financial Summary (filtered P&L), Trek Lifecycle (stage tracking + task checklist), Analytics Charts.",
      steps: [
        "FINANCIAL: Filter by date range and/or specific trek",
        "KPI cards: Revenue (green), Pending (orange), Expenses (red), GST (purple), Net P&L",
        "Expense table: Leader / Food / Transport / Entry / Incentives + Legacy Earnings",
        "Per-Trek P&L: click Expand → see profit/loss per trek",
        "LIFECYCLE: Each trek event auto-synced from payment records",
        "Click stage bar to jump stage, or '→ Next Stage' button to advance",
        "Task checklist: click checkbox to toggle done/pending",
      ]
    },
    {
      icon: "🔗", title: "Employee Portal", path: "/employee-login",
      desc: "Separate portal for trek leaders. Login with auto-generated credentials. View assigned treks, collect payments, share referral links, track earnings.",
      steps: ["Open /employee-login in a separate tab", "Login with the username and password the admin set up for you on the server", "My Treks: see all assigned events — upcoming and past", "View participant list with emergency contacts", "Enter amount + click Collect to record partial payment", "Copy referral link from Share & Earn tab", "My Earnings: track ₹100/referral incentives"]
    },
  ];

  return (
    <div>
      <h2 style={S.h2}>📖 User Manual</h2>
      <p style={{ ...S.p, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
        This manual covers every module of the Gadvede Trekkers management system. Follow the steps to get started quickly.
      </p>

      {modules.map(m => (
        <div key={m.title} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{m.title}</div>
              <code style={{ fontSize: 10, color: "#64748b" }}>{m.path}</code>
            </div>
          </div>
          <p style={{ ...S.p, marginBottom: 8 }}>{m.desc}</p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {m.steps.map((s, i) => <li key={i} style={{ ...S.p, marginBottom: 4 }}>{s}</li>)}
          </ol>
        </div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════
   TAB: SRS
═════════════════════════════════════════ */
function SRSTab() {
  return (
    <div>
      <h2 style={S.h2}>📋 Software Requirements Specification (SRS)</h2>
      <p style={S.p}>Version 1.0 · Gadvede Trekkers Management System · March 2026</p>

      <div style={S.card}>
        <h3 style={S.h3}>1. Introduction</h3>
        <h4 style={S.h4}>1.1 Purpose</h4>
        <p style={S.p}>This document specifies the software requirements for the Gadvede Trekkers Management System — a full-stack web application for managing trek bookings, vendor payments, employee operations, and financial reporting.</p>
        <h4 style={S.h4}>1.2 Scope</h4>
        <p style={S.p}>The system covers: public-facing booking website, admin management panel, employee portal, and automated financial reporting. Data is persisted via browser localStorage (no backend server required).</p>
        <h4 style={S.h4}>1.3 Definitions</h4>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Term</th><th style={S.th}>Definition</th></tr></thead>
          <tbody>
            {[
              ["Trek Event", "A single occurrence of a trek on a specific date (e.g., Kalsubai on 2026-03-29)"],
              ["Trek Payment Record", "An admin-created record that maps a trek event to its leader, vendors, and costs"],
              ["Trek Lifecycle", "The 6-stage journey of a trek event: Created → Booking Open → Departure → Ongoing → Completed → Payments Settled"],
              ["Referral Incentive", "₹100 earned by an employee when a customer books via their referral link"],
              ["Trek Leader", "An employee assigned to lead a specific trek event"],
              ["Vendor", "Food or transport supplier hired per trek event"],
            ].map(([t, d]) => <tr key={t}><td style={{ ...S.td, fontWeight: 600, whiteSpace: "nowrap" }}>{t}</td><td style={S.td}>{d}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>2. User Classes</h3>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Role</th><th style={S.th}>Access Level</th><th style={S.th}>Key Permissions</th></tr></thead>
          <tbody>
            {[
              ["Super Admin (admin)", "Full access", "All modules, can override anything"],
              ["Management - Pratik Ubhe", "High", "Approve pay rates, initiate vendor payments, approve onboarding"],
              ["Management - Akshay Kangude", "High", "Approve onboarding, approve pay rates"],
              ["Management - Rohit Panhalkar", "High", "Initiate and mark vendor payments"],
              ["Trek Leader (Employee Portal)", "Limited", "View assigned treks, participant list, collect payments, referral links"],
              ["Customer (Public)", "Read-only", "Browse activities, book treks, submit feedback"],
            ].map(([r, l, p]) => <tr key={r}><td style={S.td}><strong>{r}</strong></td><td style={S.td}><span style={S.badge("#3b82f6")}>{l}</span></td><td style={S.td}>{p}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>3. Functional Requirements</h3>
        {[
          { id: "FR-01", module: "Booking", req: "Customers can book treks/tours online with participant details, pickup selection, and payment" },
          { id: "FR-02", module: "Booking", req: "Referral code (?ref=) captured at booking time; ₹100 incentive auto-created for the referring employee" },
          { id: "FR-03", module: "Payments", req: "Admin can initiate trek payment records per event date; system auto-calculates leader + food + transport + entry costs" },
          { id: "FR-04", module: "Payments", req: "WhatsApp group link stored per trek-event-date combination; visible to assigned leader only" },
          { id: "FR-05", module: "Payments", req: "Admin can mark each sub-payment (leader/food/bus/entry) as paid with method and reference" },
          { id: "FR-06", module: "Employee", req: "Employee portal login with auto-generated credentials; blocked until approved by Akshay or Pratik" },
          { id: "FR-07", module: "Employee", req: "Leader sees participant list for assigned treks: name, phone, WhatsApp, pickup, payment status, emergency contact" },
          { id: "FR-08", module: "Employee", req: "Leader can collect partial payments inline; updates reflected in all reports immediately" },
          { id: "FR-09", module: "Reports", req: "Financial summary with date-range and trek filters: Revenue, Expenses, GST, Net P&L" },
          { id: "FR-10", module: "Lifecycle", req: "Trek events tracked through 6 stages with task checklists and missing-action detection" },
          { id: "FR-11", module: "Reports", req: "Per-trek P&L breakdown showing profit/loss per trek event" },
          { id: "FR-12", module: "Referral", req: "Employee referral incentives tracked, pending/paid status, payable via admin panel" },
        ].map(f => (
          <div key={f.id} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
            <span style={{ ...S.badge("#0284c7"), whiteSpace: "nowrap", alignSelf: "flex-start", marginTop: 1 }}>{f.id}</span>
            <span style={S.badge("#7c3aed")}>{f.module}</span>
            <span style={{ color: "#475569" }}>{f.req}</span>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>4. Non-Functional Requirements</h3>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Category</th><th style={S.th}>Requirement</th></tr></thead>
          <tbody>
            {[
              ["Performance", "All pages load < 2 seconds; all calculations done client-side in real-time"],
              ["Persistence", "All data stored in browser localStorage; no data loss on page refresh"],
              ["Security", "Role-based access control; session stored in sessionStorage (clears on tab close); passwords not hashed (local-only system)"],
              ["Usability", "Mobile-responsive; works on Chrome, Firefox, Safari; no login required for public pages"],
              ["Reliability", "No backend dependency; operates fully offline; graceful handling of missing/corrupt localStorage data"],
              ["Maintainability", "React functional components; modular storage files per domain; no external state management library"],
            ].map(([c, r]) => <tr key={c}><td style={{ ...S.td, fontWeight: 600, color: "#0284c7" }}>{c}</td><td style={S.td}>{r}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>5. Data Storage Map</h3>
        <table style={S.table}>
          <thead><tr><th style={S.th}>localStorage Key</th><th style={S.th}>Contents</th><th style={S.th}>Used By</th></tr></thead>
          <tbody>
            {[
              ["gt_bookings", "Customer booking records", "Booking form, ManageBookings, Reports, Employee Portal"],
              ["gt_enquiries", "Incoming enquiry records + status + tags + booking linkage", "Enquiry modal, ManageEnquiries, Customers"],
              ["gt_trek_payments", "Trek event payment configs (leader, vendors, costs, WhatsApp link)", "ManageEarnings, Reports, Employee Portal"],
              ["gt_treks", "Trek listings (public content)", "ManageTreks, Booking form, Employee Portal"],
              ["gt_employees", "Employee profiles (role, pay, skills)", "ManageEmployees, Trek Payments form"],
              ["gt_vendors", "Vendor profiles (service type, rate)", "ManageVendors, Trek Payments form"],
              ["gt_employee_onboarding", "Portal onboarding approval status (no passwords; login is checked by the backend)", "Onboarding"],
              ["gt_incentives", "Referral incentive records (₹100 each)", "Booking form, ManageEarnings, Employee Portal"],
              ["gt_trek_events", "Trek lifecycle stage tracking + task checklists", "ManageReports → Lifecycle tab, Dashboard"],
              ["gt_earnings", "Manual earnings entries (Tent/Villa/Camping/College IV)", "ManageEarnings, Reports"],
              ["gt_transactions", "Payment gateway transaction records", "ManageTransactions, Reports"],
              ["gt_customers", "Customer profiles", "ManageCustomers, Reports"],
              ["gt_feedback", "Customer feedback/ratings", "ManageFeedback, Employee Portal"],
            ].map(([k, c, u]) => <tr key={k}><td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: "#7c3aed" }}>{k}</td><td style={S.td}>{c}</td><td style={{ ...S.td, fontSize: 11, color: "#64748b" }}>{u}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   TAB: BRD
═════════════════════════════════════════ */
function BRDTab() {
  return (
    <div>
      <h2 style={S.h2}>📊 Business Requirements Document (BRD)</h2>
      <p style={S.p}>Version 1.0 · Gadvede Trekkers · March 2026</p>

      <div style={S.card}>
        <h3 style={S.h3}>1. Executive Summary</h3>
        <p style={S.p}>Gadvede Trekkers is an adventure tourism company offering treks, tours, camping, and heritage walks around Maharashtra. The management system digitises end-to-end operations: customer bookings, vendor payouts, employee management, and financial visibility — eliminating manual spreadsheets and WhatsApp coordination.</p>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>2. Business Objectives</h3>
        {[
          { icon: "💰", obj: "Full financial visibility", detail: "Real-time revenue, expenses, GST, and profit/loss per trek with zero manual calculation" },
          { icon: "📋", obj: "Zero paperwork bookings", detail: "Online booking flow with participant details, pickup selection, auto-generated e-ticket" },
          { icon: "👥", obj: "Employee accountability", detail: "Trek leaders log into their portal, view assigned participants, collect payments — all tracked" },
          { icon: "🔗", obj: "Referral-driven growth", detail: "Employees share personalised links; ₹100 incentive per booking drives word-of-mouth" },
          { icon: "🏔", obj: "Trek lifecycle control", detail: "6-stage lifecycle with task checklists prevents incomplete setups and payment defaults" },
          { icon: "📱", obj: "WhatsApp group integration", detail: "Group link stored per trek-date; automatically shown to assigned leader on portal" },
        ].map(b => (
          <div key={b.obj} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{b.obj}</div><div style={S.p}>{b.detail}</div></div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>3. Stakeholders</h3>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Stakeholder</th><th style={S.th}>Role</th><th style={S.th}>Primary Concern</th></tr></thead>
          <tbody>
            {[
              ["Akshay Kangude", "Co-founder / Operations", "Onboarding approvals, trek assignments, overall operations"],
              ["Pratik Ubhe", "Co-founder / Finance", "Vendor payments, pay rate approvals, financial reporting"],
              ["Rohit Panhalkar", "Finance / Payments", "Marking vendor payments, transaction records"],
              ["Trek Leaders (e.g. Rahul Patil)", "Field Staff", "Participant list, collect pending payments, WhatsApp group access"],
              ["Customers", "End Users", "Easy booking, e-ticket, trek info"],
              ["Vendors (Food / Bus)", "External Suppliers", "Payment confirmation, assignment per event"],
            ].map(([s, r, c]) => <tr key={s}><td style={S.td}><strong>{s}</strong></td><td style={S.td}><span style={S.badge("#0284c7")}>{r}</span></td><td style={S.td}>{c}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>4. Problem Statement → Solution</h3>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Before (Problem)</th><th style={S.th}>After (Solution)</th></tr></thead>
          <tbody>
            {[
              ["Bookings via WhatsApp DMs — no record, no tracking", "Online booking form → auto-saved to gt_bookings with unique booking ID"],
              ["Excel sheets for payments — error-prone, not shared", "Trek Payment module → auto-calculated costs, mark-paid per recipient"],
              ["Leaders had no idea who's coming until day before", "Employee Portal → participant list with contacts always visible"],
              ["No referral tracking — incentives forgotten/disputed", "Referral link system → ₹100 auto-created on booking, tracked in portal"],
              ["\"How much profit did Kalsubai make?\" — unknown", "Per-trek P&L in Reports → Revenue − Expenses − GST = Net Profit/Loss"],
              ["Trek completed but vendors not paid for weeks", "Lifecycle tracking → alerts when payments overdue post-completion"],
              ["WhatsApp group links shared manually every time", "Stored per trek-date in payment record → auto-shown to leader on portal"],
            ].map(([b, a]) => <tr key={b}><td style={{ ...S.td, color: "#dc2626", fontSize: 12 }}>❌ {b}</td><td style={{ ...S.td, color: "#16a34a", fontSize: 12 }}>✅ {a}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <h3 style={S.h3}>5. Success Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {[
            { metric: "Booking to ticket", target: "< 2 minutes", icon: "⚡" },
            { metric: "Payment settlement", target: "< 24h post-trek", icon: "✅" },
            { metric: "Financial accuracy", target: "100% auto-calculated", icon: "🎯" },
            { metric: "Leader portal usage", target: "100% assigned leaders", icon: "👥" },
            { metric: "Referral tracking", target: "Zero incentive disputes", icon: "🔗" },
            { metric: "Trek closure rate", target: "All 6 stages completed", icon: "🏔" },
          ].map(m => (
            <div key={m.metric} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{m.metric}</div>
              <div style={{ color: "#16a34a", fontSize: 11, fontWeight: 600 }}>{m.target}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   TAB: FLOWCHARTS
═════════════════════════════════════════ */
function FlowchartsTab() {
  const [active, setActive] = useState("booking");
  const flows = [
    { id: "booking", label: "Customer Booking" },
    { id: "lifecycle", label: "Trek Lifecycle" },
    { id: "onboarding", label: "Employee Onboarding" },
    { id: "referral", label: "Referral Incentive" },
    { id: "payment", label: "Payment Settlement" },
  ];

  return (
    <div>
      <h2 style={S.h2}>🔄 Workflow Flowcharts</h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {flows.map(f => (
          <button key={f.id} onClick={() => setActive(f.id)} style={{
            border: `2px solid ${active === f.id ? "#22c55e" : "#e2e8f0"}`,
            background: active === f.id ? "#f0fdf4" : "#fff",
            color: active === f.id ? "#16a34a" : "#64748b",
            borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: active === f.id ? 700 : 400, cursor: "pointer",
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
        {active === "booking" && (
          <div>
            <h3 style={{ ...S.h3, marginTop: 0 }}>🛒 Customer Booking Flow</h3>
            <div style={{ maxWidth: 360, margin: "0 auto" }}>
              <FlowNode text="Customer visits website" type="start" color="#16a34a" />
              <Arrow /><FlowNode text="Browses Treks / Tours / Camping" type="process" color="#3b82f6" />
              <Arrow /><FlowNode text="Clicks 'Book Now' (or referral link)" type="process" color="#3b82f6" />
              <Arrow label="?ref= captured if present" /><FlowNode text="Fills booking form" type="process" color="#3b82f6" sub="Name · Phone · Pickup · Participants" />
              <Arrow /><FlowNode text="Reviews order + total price" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="Submits payment" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="Booking saved to gt_bookings" type="storage" />
              <Arrow /><FlowNode text="Referral code present?" type="decision" />
              <div style={{ display: "flex", gap: 16, justifyContent: "center", margin: "4px 0" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#16a34a", fontSize: 11 }}>YES ↓</div>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#16a34a" }}>₹100 incentive created for employee</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>NO ↓</div>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#64748b" }}>Skip incentive</div>
                </div>
              </div>
              <Arrow /><FlowNode text="Booking confirmation shown" type="process" color="#16a34a" />
              <Arrow /><FlowNode text="E-ticket generated (printable)" type="end" />
            </div>
          </div>
        )}

        {active === "lifecycle" && (
          <div>
            <h3 style={{ ...S.h3, marginTop: 0 }}>🏔 Trek Lifecycle (6 Stages)</h3>
            <div style={{ display: "flex", overflowX: "auto", gap: 0, alignItems: "flex-start", paddingBottom: 12 }}>
              {[
                { stage: "CREATED", color: "#94a3b8", tasks: ["Trek event created in system", "Linked to payment record"] },
                { stage: "BOOKING OPEN", color: "#3b82f6", tasks: ["Assign Trek Leader ✓", "Confirm Food Vendor ✓", "Book Transport ✓", "Bookings accepted online"] },
                { stage: "DEPARTURE", color: "#f59e0b", tasks: ["Collect all payments", "Send pre-trek briefing", "Confirm participant count"] },
                { stage: "ONGOING", color: "#8b5cf6", tasks: ["Trek in progress", "Leader managing group", "Incidents logged if any"] },
                { stage: "COMPLETED", color: "#22c55e", tasks: ["Trek marked complete", "Feedback collected from participants"] },
                { stage: "PAYMENTS SETTLED", color: "#059669", tasks: ["Settle leader payment", "Settle vendor payments", "Settle referral incentives"] },
              ].map((s, i) => (
                <div key={s.stage} style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ minWidth: 130, background: s.color + "15", border: `2px solid ${s.color}40`, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: s.color, marginBottom: 6 }}>{s.stage}</div>
                    {s.tasks.map(t => <div key={t} style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>• {t}</div>)}
                  </div>
                  {i < 5 && <div style={{ alignSelf: "center", color: "#94a3b8", fontSize: 18, padding: "0 4px" }}>→</div>}
                </div>
              ))}
            </div>
            <div style={{ ...S.section, marginTop: 16 }}>
              <strong>Missing Action Detection:</strong> System automatically alerts when — trek date passed but stage not advanced · departure approaching with tasks pending · trek completed 7+ days ago but payments not settled
            </div>
          </div>
        )}

        {active === "onboarding" && (
          <div>
            <h3 style={{ ...S.h3, marginTop: 0 }}>👤 Employee Onboarding Flow</h3>
            <div style={{ maxWidth: 400, margin: "0 auto" }}>
              <FlowNode text="Admin creates employee profile" type="start" color="#16a34a" />
              <Arrow /><FlowNode text="System auto-generates credentials" type="process" color="#3b82f6" sub="username = first.last · password = first+id · referral code = REF-XX001" />
              <Arrow /><FlowNode text="Credentials saved — status: PENDING" type="storage" />
              <Arrow /><FlowNode text="Akshay or Pratik logs in" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="Sees 'N pending approvals' banner" type="process" color="#f59e0b" />
              <Arrow /><FlowNode text="Reviews credentials + employee details" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="Approve or Reject?" type="decision" />
              <div style={{ display: "flex", gap: 16, justifyContent: "center", margin: "4px 0" }}>
                <div>
                  <div style={{ color: "#16a34a", fontSize: 11, textAlign: "center" }}>APPROVE ↓</div>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
                    <div style={{ color: "#16a34a", fontWeight: 700 }}>Portal UNLOCKED</div>
                    <div style={{ color: "#64748b" }}>Employee can login</div>
                    <div style={{ color: "#64748b" }}>Referral code active</div>
                  </div>
                </div>
                <div>
                  <div style={{ color: "#dc2626", fontSize: 11, textAlign: "center" }}>REJECT ↓</div>
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
                    <div style={{ color: "#dc2626", fontWeight: 700 }}>Portal BLOCKED</div>
                    <div style={{ color: "#64748b" }}>Reason shown on login</div>
                  </div>
                </div>
              </div>
              <Arrow />
              <FlowNode text="Employee portal access granted/denied" type="end" />
            </div>
          </div>
        )}

        {active === "referral" && (
          <div>
            <h3 style={{ ...S.h3, marginTop: 0 }}>🔗 Referral Incentive Flow</h3>
            <div style={{ maxWidth: 380, margin: "0 auto" }}>
              <FlowNode text="Employee logs into portal" type="start" color="#16a34a" />
              <Arrow /><FlowNode text="Goes to Share & Earn tab" type="process" color="#3b82f6" />
              <Arrow /><FlowNode text="Copies referral link" type="process" color="#3b82f6" sub="e.g. /book?ref=REF-RP001" />
              <Arrow /><FlowNode text="Shares via WhatsApp / social media" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="Customer opens link + books trek" type="process" color="#0284c7" />
              <Arrow /><FlowNode text="System detects ?ref=REF-RP001" type="process" color="#f59e0b" />
              <Arrow /><FlowNode text="Looks up approved credential matching ref code" type="process" color="#7c3aed" />
              <Arrow /><FlowNode text="Creates ₹100 incentive record (PENDING)" type="storage" />
              <Arrow /><FlowNode text="Visible in Employee → My Earnings" type="process" color="#16a34a" />
              <Arrow /><FlowNode text="Visible in Admin → Payments & Earnings" type="process" color="#0284c7" />
              <Arrow /><FlowNode text="Admin pays via UPI/Cash + marks PAID" type="process" color="#16a34a" />
              <Arrow /><FlowNode text="Employee sees 'Paid Out' in portal" type="end" />
            </div>
          </div>
        )}

        {active === "payment" && (
          <div>
            <h3 style={{ ...S.h3, marginTop: 0 }}>💸 Payment Settlement Flow</h3>
            <div style={{ maxWidth: 420, margin: "0 auto" }}>
              <FlowNode text="Trek event booked + participants set" type="start" color="#16a34a" />
              <Arrow /><FlowNode text="Admin opens Payments & Earnings" type="process" color="#3b82f6" />
              <Arrow /><FlowNode text="Fills 'Initiate Trek Payment' form" type="process" color="#3b82f6" sub="Trek · Date · Participants · Leader · Vendors" />
              <Arrow /><FlowNode text="Adds WhatsApp group link (per date)" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="System calculates total outgoing" type="process" color="#f59e0b" sub="Leader fee + Food + Transport + Entry fees" />
              <Arrow /><FlowNode text="Click 'Initiate Payments'" type="process" color="#16a34a" />
              <Arrow /><FlowNode text="Payment record saved to gt_trek_payments" type="storage" />
              <Arrow /><FlowNode text="Trek lifecycle: stage → BOOKING_OPEN" type="process" color="#3b82f6" />
              <Arrow label="after trek completion" /><FlowNode text="Admin expands payment record" type="process" color="#0891b2" />
              <Arrow /><FlowNode text="Marks each sub-payment PAID" type="process" color="#16a34a" sub="Leader · Food · Bus · Entry · Incentives" />
              <Arrow /><FlowNode text="All sub-payments done?" type="decision" />
              <Arrow label="YES" /><FlowNode text="Payment status: COMPLETED" type="process" color="#22c55e" />
              <Arrow /><FlowNode text="Lifecycle stage → PAYMENTS_SETTLED" type="end" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Employee cred row with local show/hide ─── */
function EmpCredRow({ cred }) {
  const [showPw, setShowPw] = useState(false);
  const statusColor = cred.onboardingStatus === "APPROVED" ? "#16a34a"
    : cred.onboardingStatus === "REJECTED" ? "#dc2626" : "#d97706";
  return (
    <tr>
      <td style={S.td}><strong>{cred.fullName}</strong><div style={{ fontSize: 10, color: "#94a3b8" }}>{cred.employeeId}</div></td>
      <td style={{ ...S.td, fontFamily: "monospace", color: "#0284c7" }}>{cred.username}</td>
      <td style={S.td}>
        <span style={{ fontFamily: "monospace", color: showPw ? "#dc2626" : "#94a3b8" }}>{showPw ? "Stored on server" : "••••••••"}</span>
        <button onClick={() => setShowPw(v => !v)} style={{ marginLeft: 6, background: "none", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 10, cursor: "pointer", padding: "1px 5px" }}>
          {showPw ? "Hide" : "Show"}
        </button>
      </td>
      <td style={{ ...S.td, fontFamily: "monospace", color: "#16a34a" }}>{cred.referralCode}</td>
      <td style={S.td}><span style={S.badge(statusColor)}>{cred.onboardingStatus}</span></td>
    </tr>
  );
}

/* ═════════════════════════════════════════
   TAB: CREDENTIALS
═════════════════════════════════════════ */
function CredentialsTab() {
  const [empCreds, setEmpCreds] = useState([]);

  useEffect(() => {
    setEmpCreds(getAllCredentials());
  }, []);

  return (
    <div>
      <h2 style={S.h2}>🔑 Login Credentials & Quick Reference</h2>
      <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400e" }}>
        ⚠️ Keep these credentials confidential. For production use, store in a secure secrets manager — not in source code.
      </div>

      {/* ── URL Reference ── */}
      <div style={S.card}>
        <h3 style={S.h3}>🔗 Quick URL Reference</h3>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>URL</th>
              <th style={S.th}>What it opens</th>
              <th style={S.th}>Who uses it</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["/", "Public homepage", "Customers"],
              ["/treks", "Browse all treks", "Customers"],
              ["/tours", "Browse all tours", "Customers"],
              ["/camping", "Browse camping packages", "Customers"],
              ["/book?trekId=XXX", "Book a specific trek", "Customers"],
              ["/book?ref=REF-RP001", "Book via referral link", "Customers (referred)"],
              ["/feedback", "Customer feedback form", "Customers post-trek"],
              ["/ticket", "View e-ticket", "Customers"],
              ["/admin", "Admin login page", "Akshay, Pratik, Rohit, Admin"],
              ["/admin/dashboard", "Admin dashboard", "Admins"],
              ["/admin/enquiries", "Enquiries workflow dashboard", "Admins / sales"],
              ["/admin/bookings", "All bookings", "Admins"],
              ["/admin/booking-form", "Booking desk text/options editor", "Admins"],
              ["/admin/customers", "Customer profiles & CRM", "Admins"],
              ["/admin/transactions", "Financial transactions", "Rohit / Pratik"],
              ["/admin/earnings", "Payments & Earnings", "Rohit / Pratik"],
              ["/admin/reports", "Reports & Analytics", "Akshay / Pratik"],
              ["/admin/employees", "Employee management", "Admins"],
              ["/admin/onboarding", "Employee onboarding approvals", "Akshay / Pratik"],
              ["/admin/docs", "This page — How to Use, Credentials, Docs", "Admins"],
              ["/employee-login", "Employee portal login", "Trek Leaders / Staff"],
              ["/employee/dashboard", "Trek leader dashboard", "Trek Leaders"],
              ["/employee/direct-booking", "Direct payment booking form", "Employees / admins"],
            ].map(([url, desc, who]) => (
              <tr key={url}>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: "#7c3aed" }}>{url}</td>
                <td style={S.td}>{desc}</td>
                <td style={{ ...S.td, color: "#64748b" }}>{who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Admin credentials ── */}
      <div style={S.card}>
        <h3 style={S.h3}>Admin Panel <code style={{ fontSize: 11, color: "#64748b" }}>/admin</code></h3>
        <table style={S.table}>
          <thead><tr>{["Role", "Username", "Password", "Portal", "Notes"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            <CredRow role="Super Admin" username="admin" password="Stored on server (Render env ADMIN_USERS)" portal="Admin Panel" notes="Full access to all modules" />
            <CredRow role="Pratik Ubhe – Management" username="pratik.ubhe" password="Stored on server (Render env ADMIN_USERS)" portal="Admin Panel" notes="Approve pay rates, initiate vendor payments, approve onboarding" />
            <CredRow role="Rohit Panhalkar – Management" username="rohit.panhalkar" password="Stored on server (Render env ADMIN_USERS)" portal="Admin Panel" notes="Mark vendor payments, financial records" />
            <CredRow role="Akshay Kangude – Management" username="akshay.kangude" password="Stored on server (Render env ADMIN_USERS)" portal="Admin Panel" notes="Approve onboarding, approve pay rates" />
          </tbody>
        </table>
      </div>

      {/* ── Employee credentials (dynamic) ── */}
      <div style={S.card}>
        <h3 style={S.h3}>Employee Portal <code style={{ fontSize: 11, color: "#64748b" }}>/employee-login</code></h3>
        <p style={S.p}>
          Employee credentials are auto-generated when a new employee profile is saved.
          Format: <code>first.last</code> / <code>first+id_suffix</code>.
          Must be <strong>APPROVED</strong> by Akshay or Pratik before login works.
          This table updates automatically when new employees are added.
        </p>
        {empCreds.length === 0 ? (
          <p style={{ ...S.p, color: "#94a3b8" }}>No employee credentials found.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>{["Employee", "Username", "Password", "Referral Code", "Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {empCreds.map(cred => <EmpCredRow key={cred.credId} cred={cred} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ApiReferenceTab() {
  const apis = [
    {
      group: "Lead & WhatsApp APIs",
      rows: [
        {
          name: "handleWhatsAppLead(payload)",
          file: "src/utils/leadActions.js",
          use: "Main lead-capture API for WhatsApp buttons and enquiry popups.",
          behavior: "Saves enquiry locally first, tries POST /api/leads with timeout protection, then opens WhatsApp. Returns local enquiry + API result.",
        },
        {
          name: "buildWhatsAppMessage(payload)",
          file: "src/utils/leadActions.js",
          use: "Builds the prefilled WhatsApp sales message.",
          behavior: "Used in listings, enquiry board, and employee portal quick actions.",
        },
        {
          name: "createWhatsAppInquiryUrl(payload)",
          file: "src/utils/leadActions.js",
          use: "Generates direct WhatsApp CTA links for cards.",
          behavior: "Used alongside Book Now / View Details buttons on listing pages.",
        },
        {
          name: "openSmsWithMessage(phone, message)",
          file: "src/utils/leadActions.js",
          use: "Launches SMS app with prefilled text.",
          behavior: "Used for quick contact actions from enquiry dashboards and portals.",
        },
      ],
    },
    {
      group: "Enquiry CRM APIs",
      rows: [
        {
          name: "saveEnquiry(enquiry)",
          file: "src/data/enquiryStorage.js",
          use: "Creates a new lead record.",
          behavior: "Default status = New Lead. Saves into enquiries, creates alert/email alert record, and stores the lead in customers.",
        },
        {
          name: "syncEnquiriesWithBookings()",
          file: "src/data/enquiryStorage.js",
          use: "Keeps enquiry conversion state in sync with bookings.",
          behavior: "Auto-converts when same customer books same event by phone or email. Also pushes enquiry + booking linkage into customers.",
        },
        {
          name: "setEnquiryStatus(id, status)",
          file: "src/data/enquiryStorage.js",
          use: "Moves enquiry through sales stages.",
          behavior: "Supports New Lead, Contacted, Quoted, Converted, Lost and records response/conversion timestamps.",
        },
        {
          name: "setEnquiryTags(id, tags)",
          file: "src/data/enquiryStorage.js",
          use: "Updates enquiry tags.",
          behavior: "Currently used for High Intent tagging.",
        },
        {
          name: "setEnquiryAssignment(id, assignee)",
          file: "src/data/enquiryStorage.js",
          use: "Assigns a lead to a sales person.",
          behavior: "Assigned enquiries become visible in that sales person’s employee portal.",
        },
        {
          name: "archiveEnquiry(id)",
          file: "src/data/enquiryStorage.js",
          use: "Archives enquiry without deleting it.",
          behavior: "Keeps history intact in enquiries + customers while hiding it from the active board.",
        },
        {
          name: "getEnquiryInsights(items)",
          file: "src/data/enquiryStorage.js",
          use: "Builds dashboard metrics for the enquiry board.",
          behavior: "Tracks top location, best converting page, avg response time, and conversion rate.",
        },
      ],
    },
    {
      group: "Booking & Customer APIs",
      rows: [
        {
          name: "saveBookingRecord(record)",
          file: "src/data/bookingStorage.js",
          use: "Stores website and direct bookings.",
          behavior: "Persists booking, keeps statuses, and works with customers / transactions / alerts.",
        },
        {
          name: "generateBookingId()",
          file: "src/data/bookingStorage.js",
          use: "Creates GT-year-sequence booking IDs.",
          behavior: "Used for all persistent booking records.",
        },
        {
          name: "findOrCreateCustomer(payload)",
          file: "src/data/customerStorage.js",
          use: "Deduplicates and returns one customer record.",
          behavior: "Matches by normalized phone first, then email.",
        },
        {
          name: "upsertCustomerActivity(payload)",
          file: "src/data/customerStorage.js",
          use: "Pushes enquiry/booking activity into customer timeline.",
          behavior: "Ensures customers keep enquiry counts, booking counts, tags, latest booked event, and latest enquiry status.",
        },
      ],
    },
    {
      group: "Booking Desk & Event Pickup APIs",
      rows: [
        {
          name: "getBookingFormConfig() / saveBookingFormConfig(config)",
          file: "src/data/bookingFormStorage.js",
          use: "Reads and updates Booking Desk settings.",
          behavior: "Controls dropdowns, notes, and operational form configuration from backend.",
        },
        {
          name: "getEventDepartureConfig(payload)",
          file: "src/utils/eventDepartureConfig.js",
          use: "Returns event-specific joining destinations and pickup map.",
          behavior: "Used by both public booking page and employee direct-booking form so only relevant pickup points are shown.",
        },
      ],
    },
    {
      group: "Notification APIs",
      rows: [
        {
          name: "createAlert(payload)",
          file: "src/data/notificationStorage.js",
          use: "Creates browser/app alert records.",
          behavior: "Used when enquiries arrive and when bookings are saved.",
        },
        {
          name: "recordEmailAlertAttempt(payload)",
          file: "src/data/notificationStorage.js",
          use: "Records email-notification attempts.",
          behavior: "Current state is tracked in-app until a real email provider is connected.",
        },
      ],
    },
  ];

  const usageNotes = [
    "Front-end enquiry popup and WhatsApp buttons should always use handleWhatsAppLead so every click becomes a CRM lead first.",
    "Admin and employee portals should use enquiryStorage APIs instead of directly mutating localStorage.",
    "Use archiveEnquiry instead of any delete operation. Enquiries are now permanent CRM records.",
    "Use getEventDepartureConfig whenever an event selection should decide joining destinations or pickup points.",
    "Treat POST /api/leads as optional external sync. The local enquiry save remains the source of truth.",
  ];

  return (
    <div>
      <h2 style={S.h2}>🧩 API Reference</h2>
      <p style={S.p}>
        This section lists the active front-end APIs/helpers used by the current system, along with what each one does and where it is used after the latest CRM and Booking Desk updates.
      </p>

      <div style={S.card}>
        <h3 style={{ ...S.h3, marginTop: 0 }}>How To Use These APIs</h3>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {usageNotes.map((note, index) => (
            <li key={index} style={{ ...S.p, marginBottom: 4 }}>{note}</li>
          ))}
        </ol>
      </div>

      {apis.map((section) => (
        <div key={section.group} style={S.card}>
          <h3 style={{ ...S.h3, marginTop: 0 }}>{section.group}</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>API / Helper</th>
                <th style={S.th}>Use</th>
                <th style={S.th}>Behavior</th>
                <th style={S.th}>File</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row.name}>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: "#7c3aed" }}>{row.name}</td>
                  <td style={S.td}>{row.use}</td>
                  <td style={S.td}>{row.behavior}</td>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: "#0284c7" }}>{row.file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div style={{ ...S.section, marginTop: 16 }}>
        <strong>External endpoint note:</strong> <code>/api/leads</code> is currently used as a non-blocking external sync endpoint. If it fails or times out, the local enquiry is still saved successfully and the user flow continues.
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════ */
export default function ManageDocs() {
  const [tab, setTab] = useState("manual");
  const TABS = [
    { id: "manual",      icon: "📖", label: "User Manual"  },
    { id: "srs",         icon: "📋", label: "SRS"          },
    { id: "brd",         icon: "📊", label: "BRD"          },
    { id: "apis",        icon: "🧩", label: "APIs"         },
    { id: "flowcharts",  icon: "🔄", label: "Flowcharts"   },
    { id: "credentials", icon: "🔑", label: "Credentials"  },
  ];

  return (
    <div className="adm-page" style={S.page}>
      <h3 className="adm-page-title">📖 How It Works — Documentation Hub</h3>
      <p style={{ ...S.p, marginBottom: 20 }}>
        Complete documentation for the Gadvede Trekkers Management System. Readable by new team members, stakeholders, or any outsider.
      </p>

      <div style={S.tabBar}>
        {TABS.map(t => <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />)}
      </div>

      {tab === "manual"      && <UserManual />}
      {tab === "srs"         && <SRSTab />}
      {tab === "brd"         && <BRDTab />}
      {tab === "apis"        && <ApiReferenceTab />}
      {tab === "flowcharts"  && <FlowchartsTab />}
      {tab === "credentials" && <CredentialsTab />}
    </div>
  );
}
