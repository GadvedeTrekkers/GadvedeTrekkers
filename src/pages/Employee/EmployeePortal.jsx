import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Inbox, Mountain, CalendarDays, Share2, IndianRupee,
  Star, AlertCircle, User, LogOut, GraduationCap, Menu, X, Copy,
  ExternalLink, Phone, MessageSquare, Mail, Download, CheckCircle2,
  TrendingUp, CreditCard, Hourglass, ChevronRight, Link2,
} from "lucide-react";
import {
  DEFAULT_TRAINING_MODULES,
  getTrainingModules,
} from "../../data/trainingData";
import { getModuleProgress, getBestAttempt, getCertificationLabel } from "../../data/leaderStorage";
import { getTrainingUpdateEventName } from "../../data/trainingAdminStorage";
import { getEmployeeSession, clearEmployeeSession, getCredentialsByEmployeeId, updateEmployeePassword } from "../../data/employeePortalStorage";
import { getAllEmployees } from "../../data/employeeStorage";
import { getEmployeeIncentiveStats, getIncentivesByEmployee, INCENTIVE_AMOUNT_PER_BOOKING } from "../../data/incentiveStorage";
import { getAllVendors } from "../../data/vendorStorage";
import { ENQUIRY_STATUS, ENQUIRY_TAGS, getEnquiries, setEnquiryStatus, setEnquiryTags } from "../../data/enquiryStorage";
import { getLocalLeaderTrekEvents, loadLeaderTrekEvents } from "../../services/leaderEvents.service";
import { buildWhatsAppMessage, DEFAULT_SALES_SMS, openSmsWithMessage } from "../../utils/leadActions";
import {
  compareEventsAscending,
  compareEventsDescending,
  getDaysUntilEvent,
  isEventPast,
  isEventUpcomingOrUndated,
} from "../../utils/eventDate";

const BASE_URL = window.location.origin;

function fmt(n) { return `₹${Number(n || 0).toLocaleString("en-IN")}`; }

function getAssignedVendor(vendorName) {
  if (!vendorName) return null;
  try { return getAllVendors().find(v => v.name?.toLowerCase() === vendorName?.toLowerCase()) || null; }
  catch { return null; }
}

function getUpcomingTreks() {
  try {
    const treks = JSON.parse(localStorage.getItem("gt_treks")) || [];
    return treks.filter(t => t.active !== false).sort((a, b) => new Date(a.nextDate || "9999-12-31") - new Date(b.nextDate || "9999-12-31"));
  } catch { return []; }
}

function getTrekBookingCount(trekId, trekName) {
  try {
    const bookings = JSON.parse(localStorage.getItem("gt_bookings")) || [];
    return bookings.filter(b => b.status !== "CANCELLED" && (b.trekId === trekId || b.trekName === trekName)).length;
  } catch { return 0; }
}

function getEmployeeRatings(employeeName) {
  try {
    const feedback = JSON.parse(localStorage.getItem("gt_feedback")) || [];
    return feedback.filter(f => f.trekLeader === employeeName || f.guideName === employeeName);
  } catch { return []; }
}

function getTrekParticipants(trekName) {
  try {
    const bookings = JSON.parse(localStorage.getItem("gt_bookings")) || [];
    return bookings.filter(b =>
      b.status !== "CANCELLED" &&
      (b.trekName === trekName || b.trekName?.toLowerCase() === trekName?.toLowerCase())
    );
  } catch { return []; }
}

const GST_RATE = 0.18;
function calc50PercentDue(totalPrice, pricePaid) {
  const halfTotal = Math.ceil(Number(totalPrice) / 2);
  const partialDue = Math.max(0, halfTotal - Number(pricePaid));
  const tax = Math.round(partialDue * GST_RATE);
  return { balance: Math.max(0, Number(totalPrice) - Number(pricePaid)), partialDue, tax, totalWithTax: partialDue + tax };
}

function downloadParticipantsCSV(trekName, eventDate, participants) {
  const headers = ["#", "Booking ID", "First Name", "Last Name", "Contact", "WhatsApp", "Pickup", "Payment Status", "Total Price", "Paid", "Balance", "Emergency Contact", "Emergency Phone"];
  const rows = participants.map((p, i) => {
    const total = Number(p.totalPrice || p.price || 0);
    const paid = Number(p.pricePaid || 0);
    return [i + 1, p.bookingId || p.enhancedBookingId || "", p.firstName || "", p.lastName || "", p.contactNumber || p.phone || "", p.whatsappNumber || "", p.pickupLocation || p.departureOrigin || "", p.paymentStatus || "PENDING", total, paid, Math.max(0, total - paid), p.emergencyContact?.name || p.emergencyContactName || "", p.emergencyContact?.phone || p.emergencyContactPhone || p.emergencyContact || ""];
  });
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `participants_${trekName.replace(/\s+/g, "_")}_${eventDate || "event"}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function savePartialCollection({ bookingId, amount, collectedBy }) {
  try {
    const bookings = JSON.parse(localStorage.getItem("gt_bookings")) || [];
    const updated = bookings.map(b => {
      if (b.bookingId !== bookingId) return b;
      const newCollected = Number(b.leaderCollected || 0) + Number(amount);
      const totalPaid = Number(b.pricePaid || 0) + Number(amount);
      const totalPrice = Number(b.totalPrice || b.price || 0);
      return { ...b, leaderCollected: newCollected, pricePaid: totalPaid, paymentStatus: totalPaid >= totalPrice ? "PAID" : "PARTIAL", lastCollectedBy: collectedBy, lastCollectedAt: new Date().toISOString() };
    });
    localStorage.setItem("gt_bookings", JSON.stringify(updated));
    return true;
  } catch { return false; }
}

// Usernames that belong to management — they oversee the full pipeline.
const MGMT_USERNAMES = ["pratik.ubhe", "rohit.panhalkar", "akshay.kangude"];

function isManagementUser(session) {
  return MGMT_USERNAMES.includes(session?.username);
}

function canAccessAssignedEnquiries(session, emp) {
  if (isManagementUser(session)) return true;
  const role = String(emp?.role || emp?.expertise || "").toLowerCase();
  return role.includes("sales") || role.includes("coordinator");
}

/**
 * Returns the enquiry list scoped to the user's access level.
 *   Management → all enquiries (full pipeline view)
 *   Sales / Coordinator → only enquiries assigned to that user
 */
function getEnquiriesForUser(session, emp) {
  if (isManagementUser(session)) return getEnquiries();
  return getEnquiries().filter(item =>
    item.assignedSalesEmployeeId === session.employeeId ||
    item.assignedSalesUsername === session.username ||
    item.assignedSalesName === session.fullName
  );
}

/* ── Dark theme tokens ── */
const S = {
  bg: "#0a0a0a", surface: "#121212", border: "rgba(255,255,255,0.05)",
  green: "#22c55e", text: "#fff",
  muted: "rgba(255,255,255,0.45)", dimmed: "rgba(255,255,255,0.2)",
  card: (r = 18) => ({ background: "#121212", border: "1px solid rgba(255,255,255,0.05)", borderRadius: r, padding: "1.25rem" }),
  heading: { fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" },
  label: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.28)", marginBottom: 4 },
};

function SidebarItem({ icon: Icon, label, id, active, badge, onClick }) {
  return (
    <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => onClick(id)} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px",
      border: "none", cursor: "pointer", background: active ? "rgba(255,255,255,0.08)" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,0.45)",
      borderRight: active ? "3px solid #22c55e" : "3px solid transparent", transition: "all 0.15s",
    }}>
      <Icon size={17} strokeWidth={active ? 2.5 : 2} />
      <span style={{ fontWeight: active ? 700 : 500, fontSize: 13, flex: 1, textAlign: "left" }}>{label}</span>
      {badge ? <span style={{ background: "#ef4444", color: "#fff", borderRadius: 9, fontSize: 9, padding: "2px 6px", fontWeight: 700 }}>{badge}</span> : null}
    </motion.button>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} style={{ ...S.card(18), position: "relative", overflow: "hidden", cursor: "default" }}>
      <div style={{ position: "absolute", top: -8, right: -8, width: 60, height: 60, borderRadius: "50%", background: color, opacity: 0.12, filter: "blur(14px)" }} />
      <div style={{ width: 38, height: 38, borderRadius: 11, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 10 }}>
        <Icon size={19} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 900, color: "#fff" }}>{value}</div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   EmployeePortal
══════════════════════════════════════════ */
export default function EmployeePortal() {
  const navigate = useNavigate();
  const session = getEmployeeSession();

  useEffect(() => { if (!session) navigate("/employee-login"); }, []);
  if (!session) return null;

  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", new1: "", new2: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [collectAmts, setCollectAmts] = useState({});
  const [collectMsg, setCollectMsg] = useState({});
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [showPastTreks, setShowPastTreks] = useState(false);
  const [tick, setTick] = useState(0);
  const [trainingModules, setTrainingModules] = useState(() => getTrainingModules());
  const [myTrekEvents, setMyTrekEvents] = useState(() => getLocalLeaderTrekEvents(session.fullName));

  useEffect(() => {
    const name = getTrainingUpdateEventName();
    const handler = () => setTrainingModules(getTrainingModules());
    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
  }, []);

  useEffect(() => {
    let isActive = true;

    setMyTrekEvents(getLocalLeaderTrekEvents(session.fullName));

    loadLeaderTrekEvents(session.fullName).then((events) => {
      if (isActive) {
        setMyTrekEvents(events);
      }
    });

    return () => {
      isActive = false;
    };
  }, [session.fullName, tick]);

  const emp = useMemo(() => getAllEmployees().find(e => e.employeeId === session.employeeId), [tick]);
  const cred = useMemo(() => getCredentialsByEmployeeId(session.employeeId), []);
  const incentives = useMemo(() => getIncentivesByEmployee(session.employeeId), [tick]);
  const incStats = useMemo(() => getEmployeeIncentiveStats(session.employeeId), [tick]);
  const ratings = useMemo(() => getEmployeeRatings(session.fullName), [tick]);
  const treks = useMemo(() => getUpcomingTreks(), [tick]);
  const canViewEnquiries = useMemo(() => canAccessAssignedEnquiries(session, emp), [session, emp]);
  // emp is a dep: management status is derived from session.username (stable),
  // but emp must be included so the list re-evaluates if the employee record changes.
  const assignedEnquiries = useMemo(() => getEnquiriesForUser(session, emp), [session, emp, tick]);

  const referralCode = cred?.referralCode || session.referralCode || "";
  const referralLink = `${BASE_URL}/book?ref=${referralCode}`;
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + Number(r.rating || 0), 0) / ratings.length).toFixed(1) : null;

  const logout = () => { clearEmployeeSession(); navigate("/employee-login"); };
  const copyLink = () => { navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.new1) { setPwMsg("Fill all fields."); return; }
    if (pwForm.new1 !== pwForm.new2) { setPwMsg("Passwords don't match."); return; }
    if (cred?.password !== pwForm.current) { setPwMsg("Current password is incorrect."); return; }
    updateEmployeePassword(session.employeeId, pwForm.new1);
    setPwMsg("Password updated successfully!");
    setPwForm({ current: "", new1: "", new2: "" });
  };

  const handleCollect = (bookingId) => {
    const amt = Number(collectAmts[bookingId] || 0);
    if (!amt || amt <= 0) { setCollectMsg(p => ({ ...p, [bookingId]: "Enter a valid amount." })); return; }
    const ok = savePartialCollection({ bookingId, amount: amt, collectedBy: session.fullName });
    if (ok) {
      setCollectMsg(p => ({ ...p, [bookingId]: `✅ ₹${amt.toLocaleString("en-IN")} collected!` }));
      setCollectAmts(p => ({ ...p, [bookingId]: "" }));
      setTick(t => t + 1);
      setTimeout(() => setCollectMsg(p => { const n = { ...p }; delete n[bookingId]; return n; }), 3000);
    }
  };

  const handleEnquiryStatus = (id, status) => { setEnquiryStatus(id, status); setTick(t => t + 1); };
  const handleEnquiryTag = (enquiry, tag) => {
    const currentTags = Array.isArray(enquiry.tags) ? enquiry.tags : [];
    const nextTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
    setEnquiryTags(enquiry.id, nextTags); setTick(t => t + 1);
  };
  const handleEnquiryWhatsApp = (item) => {
    if (!item.phone) return;
    const msg = buildWhatsAppMessage({ packageName: item.eventName, location: item.location || item.eventName?.split("–")[0]?.trim() || "Pune/Mumbai", category: item.category || "Enquiry", customerName: item.name, customerPhone: item.phone, customerEmail: item.email, pax: item.pax, preferredDate: item.date });
    window.open(`https://wa.me/91${item.phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const TABS = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(canViewEnquiries ? [{ id: "enquiries", icon: Inbox, label: "Enquiries", badge: assignedEnquiries.length || null }] : []),
    { id: "mytreks", icon: Mountain, label: "My Treks", badge: myTrekEvents.length || null },
    { id: "treks", icon: CalendarDays, label: "Trek Events" },
    { id: "share", icon: Share2, label: "Share & Earn" },
    { id: "earnings", icon: IndianRupee, label: "My Earnings" },
    { id: "ratings", icon: Star, label: "My Ratings" },
    { id: "training", icon: GraduationCap, label: "Leader Training" },
    { id: "emergency", icon: AlertCircle, label: "Emergency" },
    { id: "profile", icon: User, label: "My Profile" },
  ];

  const activeTab = TABS.find(t => t.id === tab);
  const inputDark = { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 9 };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex" }}>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 45 }} />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 264, background: "#121212", borderRight: "1px solid rgba(255,255,255,0.05)",
        position: "fixed", top: 0, left: 0, bottom: 0, display: "flex", flexDirection: "column", zIndex: 50,
      }} className={`emp-sidebar${sidebarOpen ? " open" : ""}`}>

        <div style={{ padding: "1rem 1rem 0.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#22c55e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mountain size={18} color="#22c55e" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#fff" }}>Gadvede Trekkers</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Employee Portal</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="emp-sidebar-close" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "none" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ margin: "0.4rem 0.6rem 0.3rem", padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
          {emp?.profilePhoto && <img src={emp.profilePhoto} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid #22c55e", float: "right", marginLeft: 8 }} />}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{session.fullName}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{emp?.role || "Employee"}</div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
          {TABS.map(t => (
            <SidebarItem key={t.id} icon={t.icon} label={t.label} id={t.id} active={tab === t.id} badge={t.badge}
              onClick={(id) => { setTab(id); setSidebarOpen(false); }} />
          ))}
        </nav>

        <div style={{ padding: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 12, fontWeight: 600, borderRadius: 7 }}>
            <ExternalLink size={14} /> View Website
          </a>
          <motion.button whileHover={{ x: 3 }} onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700, borderRadius: 7 }}>
            <LogOut size={14} /> Logout
          </motion.button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, marginLeft: 264, minHeight: "100vh", display: "flex", flexDirection: "column" }} className="emp-main">

        {/* Top bar */}
        <header style={{ height: 56, padding: "0 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.92)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)} className="emp-hamburger" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "none" }}>
              <Menu size={21} />
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{activeTab?.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Welcome, {session.fullName.split(" ")[0]}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {emp?.profilePhoto && <img src={emp.profilePhoto} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "2px solid #22c55e" }} />}
            <button onClick={logout} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Logout</button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: "1.25rem" }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>

              {/* ══ DASHBOARD ══ */}
              {tab === "dashboard" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "clamp(1.3rem,3vw,1.75rem)", margin: 0 }}>👋 Hello, {session.fullName.split(" ")[0]}!</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4, marginBottom: 0 }}>Here's your portal at a glance.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, marginBottom: 16 }}>
                    <KpiCard icon={Share2} label="Referral Bookings" value={incStats.count} color="#3b82f6" />
                    <KpiCard icon={IndianRupee} label="Total Earned" value={fmt(incStats.totalEarned)} color="#22c55e" />
                    <KpiCard icon={Hourglass} label="Pending Payout" value={fmt(incStats.pending)} color="#f59e0b" />
                    <KpiCard icon={CheckCircle2} label="Paid Out" value={fmt(incStats.paid)} color="#8b5cf6" />
                    <KpiCard icon={Star} label="Avg Rating" value={avgRating ? `${avgRating}/5` : "—"} color="#ea580c" />
                    <KpiCard icon={CalendarDays} label="Upcoming Treks" value={treks.length} color="#ec4899" />
                  </div>

                  <motion.div whileHover={{ scale: 1.005 }} style={{ background: "linear-gradient(135deg,#052e16,#064e3b)", border: "1px solid #166534", borderRadius: 18, padding: "1.1rem", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 5, fontSize: 13 }}>🔗 Your Referral Link</div>
                    <div style={{ fontSize: 11, color: "#86efac", marginBottom: 9 }}>Earn <strong style={{ color: "#4ade80" }}>₹{INCENTIVE_AMOUNT_PER_BOOKING}</strong> for every booking through your link!</div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <input readOnly value={referralLink} style={{ flex: 1, minWidth: 160, fontFamily: "monospace", fontSize: 11, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, padding: "6px 9px", color: "#fff" }} />
                      <motion.button whileHover={{ scale: 1.05 }} onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: 5, background: "#22c55e", border: "none", color: "#fff", borderRadius: 7, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                        <Copy size={12} /> {copied ? "Copied!" : "Copy"}
                      </motion.button>
                      <a href={`whatsapp://send?text=Book%20your%20trek!%20${encodeURIComponent(referralLink)}`} style={{ display: "flex", alignItems: "center", gap: 5, background: "#25D366", color: "#fff", borderRadius: 7, padding: "6px 12px", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>📱 WA</a>
                    </div>
                  </motion.div>

                  <div style={{ ...S.card(16), marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <CreditCard size={16} color="#22c55e" />
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Direct Payment Booking Form</div>
                    </div>
                    <div style={{ fontSize: 12, color: S.muted, marginBottom: 9 }}>Use when a customer pays by UPI, cash, or bank transfer — saved without website tax.</div>
                    <a href="/employee/direct-booking" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                      Open Form <ExternalLink size={11} />
                    </a>
                  </div>

                  {incentives.length > 0 && (
                    <div style={S.card(16)}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>💵 Recent Referral Bookings</div>
                      {incentives.slice(0, 5).map(inc => (
                        <div key={inc.incentiveId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{inc.trekName}</div>
                            <div style={{ fontSize: 11, color: S.muted }}>{inc.customerName} · {new Date(inc.createdAt).toLocaleDateString("en-IN")}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, color: "#4ade80" }}>+{fmt(inc.amount)}</div>
                            <span className={`badge ${inc.status === "PAID" ? "bg-success" : "bg-warning text-dark"}`} style={{ fontSize: 9 }}>{inc.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ ENQUIRIES ══ */}
              {tab === "enquiries" && canViewEnquiries && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>📬 Assigned Enquiries</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Update the stage, contact the lead, and track high-intent prospects.</p>
                  </div>
                  {assignedEnquiries.length === 0
                    ? <div style={{ ...S.card(14), textAlign: "center", padding: "3rem", color: S.muted }}>No enquiries assigned to you yet.</div>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {assignedEnquiries.map(item => (
                          <motion.div key={item.id} whileHover={{ y: -2 }} style={{ ...S.card(14), padding: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
                              <div>
                                <div style={{ fontWeight: 800 }}>{item.name}</div>
                                <div style={{ fontSize: 12, color: S.muted }}>{item.phone}{item.email ? ` · ${item.email}` : ""}</div>
                                <div style={{ fontSize: 12, color: S.dimmed }}>{item.location || "Unknown"} · {item.eventName}</div>
                              </div>
                              <span className="badge bg-primary" style={{ height: "fit-content" }}>{String(item.status || "").replace(/_/g, " ")}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 }}>
                              {Object.values(ENQUIRY_STATUS).map(status => (
                                <button key={status} type="button" className={`btn btn-sm ${item.status === status ? "btn-primary" : "btn-outline-primary"}`} onClick={() => handleEnquiryStatus(item.id, status)} style={{ fontSize: 10 }}>{String(status).replace(/_/g, " ")}</button>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 9 }}>
                              {ENQUIRY_TAGS.map(tag => {
                                const active = (item.tags || []).includes(tag);
                                return <button key={tag} type="button" className={`btn btn-sm ${active ? "btn-warning" : "btn-outline-secondary"}`} onClick={() => handleEnquiryTag(item, tag)} style={{ fontSize: 10 }}>{tag}</button>;
                              })}
                            </div>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              <a href={`tel:${item.phone}`} className="btn btn-outline-primary btn-sm" style={{ fontSize: 10 }}><Phone size={11} className="me-1" />Call</a>
                              <button type="button" className="btn btn-outline-success btn-sm" onClick={() => handleEnquiryWhatsApp(item)} style={{ fontSize: 10 }}><MessageSquare size={11} className="me-1" />WA</button>
                              <a href={item.email ? `mailto:${item.email}` : "#"} className="btn btn-outline-secondary btn-sm" onClick={e => !item.email && e.preventDefault()} style={{ fontSize: 10 }}><Mail size={11} className="me-1" />Email</a>
                              <button type="button" className="btn btn-outline-light btn-sm" onClick={() => openSmsWithMessage(item.phone, DEFAULT_SALES_SMS)} style={{ fontSize: 10 }}>SMS</button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* ══ MY TREKS (assigned) ══ */}
              {tab === "mytreks" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>🏔 My Assigned Treks</h1>
                      <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>View participants, collect payments, access group links.</p>
                    </div>
                    <div style={{ display: "flex", gap: 0, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, overflow: "hidden" }}>
                      <button onClick={() => setShowPastTreks(false)} style={{ border: "none", padding: "6px 14px", fontSize: 12, fontWeight: !showPastTreks ? 700 : 500, background: !showPastTreks ? "#22c55e" : "transparent", color: !showPastTreks ? "#fff" : S.muted, cursor: "pointer" }}>
                        🚀 Upcoming ({myTrekEvents.filter((event) => isEventUpcomingOrUndated(event.eventDate)).length})
                      </button>
                      <button onClick={() => setShowPastTreks(true)} style={{ border: "none", padding: "6px 14px", fontSize: 12, fontWeight: showPastTreks ? 700 : 500, background: showPastTreks ? "#22c55e" : "transparent", color: showPastTreks ? "#fff" : S.muted, cursor: "pointer" }}>
                        🕒 Past ({myTrekEvents.filter((event) => isEventPast(event.eventDate)).length})
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const filtered = myTrekEvents.filter(e => {
                      return showPastTreks ? isEventPast(e.eventDate) : isEventUpcomingOrUndated(e.eventDate);
                    });
                    if (filtered.length === 0) return <div style={{ ...S.card(14), textAlign: "center", padding: "3rem", color: S.muted }}>{showPastTreks ? "No past treks found." : "No upcoming treks assigned to you yet."}</div>;
                    return filtered.sort((a, b) => showPastTreks ? compareEventsDescending(a, b) : compareEventsAscending(a, b)).map(evt => {
                      const participants = getTrekParticipants(evt.trekName, evt.eventDate);
                      const pending = participants.filter(p => p.paymentStatus === "PARTIAL" || p.paymentStatus === "PENDING" || !p.paymentStatus);
                      const paid = participants.filter(p => p.paymentStatus === "PAID");
                      const isOpen = expandedEvent === evt.paymentId;
                      const waLink = evt.config?.whatsappGroupLink;
                      const daysTo = getDaysUntilEvent(evt.eventDate);
                      return (
                        <div key={evt.paymentId} style={{ ...S.card(14), marginBottom: 10, padding: 0, overflow: "hidden" }}>
                          <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "rgba(255,255,255,0.02)", borderBottom: isOpen ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: 14 }}>{evt.trekName}</div>
                              <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>
                                📅 {evt.eventDate}
                                {daysTo !== null && <span style={{ marginLeft: 6, color: daysTo < 0 ? "#ef4444" : daysTo <= 3 ? "#f59e0b" : "#4ade80", fontWeight: 700 }}>({daysTo < 0 ? `${Math.abs(daysTo)}d ago` : daysTo === 0 ? "Today!" : `in ${daysTo}d`})</span>}
                                &nbsp;·&nbsp; 👥 {participants.length} &nbsp;·&nbsp; <span style={{ color: "#4ade80" }}>✅ {paid.length}</span> &nbsp;·&nbsp; <span style={{ color: "#f59e0b" }}>⏳ {pending.length}</span>
                              </div>
                              {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, background: "#16a34a22", color: "#4ade80", padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>📱 WhatsApp Group</a>}
                            </div>
                            <button className="btn btn-outline-light btn-sm" style={{ fontSize: 11 }} onClick={() => setExpandedEvent(isOpen ? null : evt.paymentId)}>
                              {isOpen ? "Hide" : "Participants"}
                            </button>
                          </div>

                          {isOpen && (() => {
                            const vendor = getAssignedVendor(evt.config?.vendorName);
                            if (!vendor) return null;
                            return (
                              <div style={{ padding: "9px 14px", background: "#0d2818", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 11, marginBottom: 5 }}>🚌 Vendor — {vendor.serviceType}</div>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: 13 }}>{vendor.name}</div>
                                    {vendor.address && <div style={{ fontSize: 11, color: S.muted }}>📍 {vendor.address}</div>}
                                  </div>
                                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                    {vendor.contactNumber && <a href={`tel:${vendor.contactNumber}`} className="btn btn-outline-success btn-sm" style={{ fontSize: 10 }}>📱 {vendor.contactNumber}</a>}
                                    {vendor.contactNumber && <a href={`https://wa.me/91${vendor.contactNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm" style={{ fontSize: 10 }}>💬 WA</a>}
                                    {vendor.googleMapLocation && <a href={vendor.googleMapLocation} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm" style={{ fontSize: 10 }}>🗺 Map</a>}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {isOpen && (
                            <div style={{ padding: "0 0 8px" }}>
                              {participants.length === 0
                                ? <div style={{ padding: 18, textAlign: "center", color: S.muted, fontSize: 13 }}>No bookings found for this trek.</div>
                                : (
                                  <div style={{ overflowX: "auto" }}>
                                    <div style={{ padding: "7px 12px 3px", display: "flex", justifyContent: "flex-end" }}>
                                      <button className="btn btn-outline-success btn-sm" style={{ fontSize: 10 }} onClick={() => downloadParticipantsCSV(evt.trekName, evt.eventDate, participants)}>
                                        <Download size={11} className="me-1" /> CSV
                                      </button>
                                    </div>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                      <thead>
                                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                                          {["#", "Name", "Contact", "WhatsApp", "Pickup", "Status", "Paid", "Balance", "Collect", "Emergency"].map(h => (
                                            <th key={h} style={{ padding: "6px 9px", textAlign: "left", fontSize: 10, fontWeight: 700, color: S.muted, whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {participants.map((p, i) => {
                                          const totalPrice = Number(p.totalPrice || p.price || 0);
                                          const pricePaid = Number(p.pricePaid || 0);
                                          const balance = Math.max(0, totalPrice - pricePaid);
                                          const isPending = balance > 0;
                                          const msg = collectMsg[p.bookingId];
                                          return (
                                            <tr key={p.bookingId || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: isPending ? "rgba(245,158,11,0.03)" : "transparent" }}>
                                              <td style={{ padding: "8px 9px", color: S.dimmed }}>{i + 1}</td>
                                              <td style={{ padding: "8px 9px" }}>
                                                <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                                                <div style={{ fontSize: 10, color: S.dimmed, fontFamily: "monospace" }}>{p.bookingId || p.enhancedBookingId}</div>
                                              </td>
                                              <td style={{ padding: "8px 9px", whiteSpace: "nowrap" }}><a href={`tel:${p.contactNumber || p.phone}`} style={{ color: "#60a5fa" }}>📱 {p.contactNumber || p.phone || "—"}</a></td>
                                              <td style={{ padding: "8px 9px", whiteSpace: "nowrap" }}>
                                                {p.whatsappNumber ? <a href={`https://wa.me/91${p.whatsappNumber}`} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", fontSize: 11 }}>💬 {p.whatsappNumber}</a> : <span style={{ color: S.dimmed }}>—</span>}
                                              </td>
                                              <td style={{ padding: "8px 9px", fontSize: 11, color: S.muted }}>{p.pickupLocation || p.departureOrigin || "—"}</td>
                                              <td style={{ padding: "8px 9px" }}>
                                                <span className={`badge ${p.paymentStatus === "PAID" ? "bg-success" : p.paymentStatus === "PARTIAL" ? "bg-warning text-dark" : "bg-secondary"}`} style={{ fontSize: 9 }}>{p.paymentStatus || "PENDING"}</span>
                                              </td>
                                              <td style={{ padding: "8px 9px", fontWeight: 600, color: "#4ade80" }}>{pricePaid > 0 ? fmt(pricePaid) : "—"}</td>
                                              <td style={{ padding: "8px 9px", fontWeight: 700, color: balance > 0 ? "#ef4444" : "#4ade80" }}>{balance > 0 ? fmt(balance) : "✅"}</td>
                                              <td style={{ padding: "8px 9px", whiteSpace: "nowrap" }}>
                                                {isPending ? (() => {
                                                  const { partialDue, tax } = calc50PercentDue(totalPrice, pricePaid);
                                                  return (
                                                    <div>
                                                      {partialDue > 0 && (
                                                        <div style={{ fontSize: 9, color: "#60a5fa", marginBottom: 3 }}>
                                                          50% = ₹{partialDue.toLocaleString("en-IN")} + GST ₹{tax.toLocaleString("en-IN")}
                                                          <button style={{ marginLeft: 4, fontSize: 9, border: "none", background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderRadius: 3, padding: "0 5px", cursor: "pointer" }} onClick={() => setCollectAmts(prev => ({ ...prev, [p.bookingId]: partialDue }))}>Fill 50%</button>
                                                        </div>
                                                      )}
                                                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                        <input type="number" min="1" max={balance} className="form-control form-control-sm" style={{ width: 80, ...inputDark, fontSize: 10 }} placeholder={`≤${balance}`} value={collectAmts[p.bookingId] || ""} onChange={e => setCollectAmts(prev => ({ ...prev, [p.bookingId]: e.target.value }))} />
                                                        <button className="btn btn-success btn-sm py-0 px-2" style={{ fontSize: 10 }} onClick={() => handleCollect(p.bookingId)}>✓</button>
                                                      </div>
                                                    </div>
                                                  );
                                                })() : <span style={{ color: S.dimmed, fontSize: 11 }}>—</span>}
                                                {msg && <div style={{ fontSize: 10, color: msg.includes("✅") ? "#4ade80" : "#ef4444", marginTop: 2 }}>{msg}</div>}
                                              </td>
                                              <td style={{ padding: "8px 9px", fontSize: 11 }}>
                                                {p.emergencyContact
                                                  ? <div><div style={{ fontWeight: 600 }}>{p.emergencyContact.name || p.emergencyContactName}</div><a href={`tel:${p.emergencyContact.phone || p.emergencyContactPhone || p.emergencyContact}`} style={{ color: "#ef4444" }}>🚨 {p.emergencyContact.phone || p.emergencyContactPhone || p.emergencyContact}</a></div>
                                                  : <span style={{ color: S.dimmed }}>—</span>}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* ══ TREK EVENTS ══ */}
              {tab === "treks" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>🥾 Upcoming Trek Events</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>All active treks — copy your referral link for each.</p>
                  </div>
                  {treks.length === 0
                    ? <div style={{ ...S.card(14), textAlign: "center", padding: "3rem", color: S.muted }}>No upcoming treks found.</div>
                    : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(255px,1fr))", gap: 12 }}>
                        {treks.map(trek => {
                          const count = getTrekBookingCount(trek.id, trek.name);
                          const trekRefLink = `${BASE_URL}/book?trekId=${trek.id || ""}&trekName=${encodeURIComponent(trek.name)}&ref=${referralCode}`;
                          return (
                            <motion.div key={trek.id || trek.name} whileHover={{ y: -4 }} style={{ ...S.card(14), padding: 0, overflow: "hidden" }}>
                              {trek.image && <img src={trek.image} alt={trek.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                              <div style={{ padding: "11px 13px" }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{trek.name}</div>
                                <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{trek.location} · {trek.difficulty}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9 }}>
                                  <div><div style={S.label}>Next Date</div><div style={{ fontWeight: 700, fontSize: 12, color: "#60a5fa" }}>{trek.nextDate || "TBD"}</div></div>
                                  <div style={{ textAlign: "right" }}><div style={S.label}>Bookings</div><div style={{ fontWeight: 900, fontSize: 17, color: count > 0 ? "#4ade80" : S.dimmed }}>{count}</div></div>
                                </div>
                                {trek.price && <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginTop: 5 }}>₹{Number(trek.price).toLocaleString("en-IN")} {trek.originalPrice && <span style={{ fontSize: 10, color: S.dimmed, textDecoration: "line-through" }}>₹{Number(trek.originalPrice).toLocaleString("en-IN")}</span>}</div>}
                                <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                                  <button className="btn btn-outline-success btn-sm" style={{ flex: 1, fontSize: 10 }} onClick={() => { navigator.clipboard.writeText(trekRefLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>🔗 My Link</button>
                                  <a href={`/treks/${trek.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm" style={{ flex: 1, fontSize: 10, textDecoration: "none" }}>View</a>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}

              {/* ══ SHARE & EARN ══ */}
              {tab === "share" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>🔗 Share & Earn</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Earn <strong style={{ color: "#4ade80" }}>₹{INCENTIVE_AMOUNT_PER_BOOKING}</strong> for every booking through your link!</p>
                  </div>

                  <motion.div whileHover={{ scale: 1.003 }} style={{ background: "linear-gradient(135deg,#052e16,#064e3b)", border: "1px solid #166534", borderRadius: 18, padding: "1.25rem", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "#86efac", marginBottom: 3, fontWeight: 600 }}>Your Referral Code</div>
                    <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 4, marginBottom: 10 }}>{referralCode}</div>
                    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 7, padding: "6px 10px", fontFamily: "monospace", fontSize: 11, marginBottom: 12, wordBreak: "break-all", color: "#86efac" }}>{referralLink}</div>
                    <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: 5, background: "#22c55e", border: "none", color: "#fff", borderRadius: 7, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        <Copy size={12} /> {copied ? "Copied!" : "Copy Link"}
                      </motion.button>
                      <a href={`whatsapp://send?text=Book%20your%20trek%20with%20Gadvede%20Trekkers!%20${encodeURIComponent(referralLink)}`} style={{ display: "flex", alignItems: "center", gap: 5, background: "#25D366", color: "#fff", borderRadius: 7, padding: "7px 14px", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>📱 Share on WhatsApp</a>
                    </div>
                  </motion.div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
                    <KpiCard icon={Link2} label="Bookings via Link" value={incStats.count} color="#3b82f6" />
                    <KpiCard icon={IndianRupee} label="Total Earned" value={fmt(incStats.totalEarned)} color="#22c55e" />
                    <KpiCard icon={Hourglass} label="Pending Payout" value={fmt(incStats.pending)} color="#f59e0b" />
                  </div>

                  <div style={S.card(14)}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📖 How it works</div>
                    {[["1️⃣", "Copy your referral link above"], ["2️⃣", "Share it with friends, family or on social media"], ["3️⃣", "When someone books using your link, it's tracked automatically"], ["4️⃣", `You earn ₹${INCENTIVE_AMOUNT_PER_BOOKING} for each confirmed booking`], ["5️⃣", "Earnings are paid out by admin — check My Earnings tab"]].map(([step, text]) => (
                      <div key={step} style={{ display: "flex", gap: 10, marginBottom: 7, fontSize: 13, color: S.muted }}><span style={{ fontSize: 16 }}>{step}</span>{text}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ MY EARNINGS ══ */}
              {tab === "earnings" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>💵 My Earnings</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Referral incentive history. Payouts processed by admin.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(145px,1fr))", gap: 10, marginBottom: 14 }}>
                    {[{ label: "Total Earned", value: fmt(incStats.totalEarned), color: "#fff" }, { label: "Paid Out", value: fmt(incStats.paid), color: "#4ade80" }, { label: "Pending", value: fmt(incStats.pending), color: "#f59e0b" }, { label: "Bookings", value: incStats.count, color: "#60a5fa" }].map(s => (
                      <div key={s.label} style={S.card(13)}><div style={{ fontSize: 17, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 11, color: S.muted }}>{s.label}</div></div>
                    ))}
                  </div>
                  {incentives.length === 0
                    ? <div style={{ ...S.card(14), textAlign: "center", padding: "3rem", color: S.muted }}>No referral bookings yet. Share your link to start earning!</div>
                    : (
                      <div style={{ ...S.card(14), padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                              {["Trek", "Customer", "Date", "Amount", "Status"].map(h => (
                                <th key={h} style={{ padding: "9px 13px", textAlign: "left", fontWeight: 700, fontSize: 10, color: S.muted, borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {incentives.map(inc => (
                              <tr key={inc.incentiveId} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <td style={{ padding: "9px 13px", fontWeight: 600 }}>{inc.trekName}</td>
                                <td style={{ padding: "9px 13px", color: S.muted }}>{inc.customerName}</td>
                                <td style={{ padding: "9px 13px", color: S.dimmed, fontSize: 12 }}>{new Date(inc.createdAt).toLocaleDateString("en-IN")}</td>
                                <td style={{ padding: "9px 13px", fontWeight: 700, color: "#4ade80" }}>+{fmt(inc.amount)}</td>
                                <td style={{ padding: "9px 13px" }}>
                                  <span className={`badge ${inc.status === "PAID" ? "bg-success" : "bg-warning text-dark"}`} style={{ fontSize: 9 }}>{inc.status}</span>
                                  {inc.status === "PAID" && inc.paidAt && <div style={{ fontSize: 10, color: S.dimmed, marginTop: 2 }}>Paid {new Date(inc.paidAt).toLocaleDateString("en-IN")} via {inc.paidVia}</div>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}

              {/* ══ MY RATINGS ══ */}
              {tab === "ratings" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>⭐ Customer Ratings</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Feedback received from customers after treks.</p>
                  </div>
                  {ratings.length > 0 && (
                    <motion.div whileHover={{ scale: 1.005 }} style={{ background: "linear-gradient(135deg,#1a1200,#292100)", border: "1px solid rgba(253,224,71,0.18)", borderRadius: 18, padding: "1.25rem", marginBottom: 14, textAlign: "center" }}>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fbbf24" }}>{avgRating}</div>
                      <div style={{ fontSize: 22, marginBottom: 3 }}>{"⭐".repeat(Math.round(Number(avgRating)))}</div>
                      <div style={{ fontSize: 13, color: S.muted }}>Based on {ratings.length} review{ratings.length > 1 ? "s" : ""}</div>
                    </motion.div>
                  )}
                  {ratings.length === 0
                    ? <div style={{ ...S.card(14), textAlign: "center", padding: "3rem", color: S.muted }}>No ratings received yet.</div>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {ratings.map((r, i) => (
                          <motion.div key={i} whileHover={{ y: -2 }} style={S.card(14)}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.customerName || "Customer"}</div>
                                <div style={{ fontSize: 12, color: S.muted }}>{r.trekName} · {r.date ? new Date(r.date).toLocaleDateString("en-IN") : ""}</div>
                              </div>
                              <div style={{ fontSize: 16 }}>{"⭐".repeat(Number(r.rating || 0))}</div>
                            </div>
                            {r.comment && <p style={{ fontSize: 13, color: S.muted, margin: 0, fontStyle: "italic" }}>"{r.comment}"</p>}
                          </motion.div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* ══ LEADER TRAINING ══ */}
              {tab === "training" && (() => {
                const progress = getModuleProgress();
                const best = getBestAttempt();
                const cert = best ? getCertificationLabel(best.percent) : null;
                const completed = trainingModules.filter(m => progress[m.id]?.completed).length;
                const total = trainingModules.length;
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                      <div>
                        <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>🎓 Leader Training</h1>
                        <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Complete all modules to unlock the certification test.</p>
                      </div>
                      <Link to="/leader-training" style={{ background: "#22c55e", color: "#fff", borderRadius: 9, padding: "7px 16px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                        Open Portal <ChevronRight size={13} />
                      </Link>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginBottom: 14 }}>
                      <KpiCard icon={GraduationCap} label="Modules Done" value={`${completed}/${total}`} color="#22c55e" />
                      <KpiCard icon={Star} label="Certification" value={cert ? cert.level : "Not tested"} color={cert?.color || S.dimmed} />
                      <KpiCard icon={TrendingUp} label="Best Score" value={best ? `${best.percent}%` : "—"} color="#3b82f6" />
                    </div>

                    <div style={{ ...S.card(13), marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 7 }}>
                        <span>Module Progress</span>
                        <span style={{ color: "#22c55e" }}>{Math.round((completed / total) * 100)}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((completed / total) * 100)}%` }} transition={{ duration: 0.5 }} style={{ height: 6, borderRadius: 3, background: "#22c55e" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                      {trainingModules.map((mod, i) => {
                        const done = !!progress[mod.id]?.completed;
                        return (
                          <div key={mod.id} style={{ ...S.card(12), display: "flex", alignItems: "center", gap: 10, border: done ? "1px solid rgba(34,197,94,0.18)" : "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: mod.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{mod.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>Module {i + 1}: {mod.title}</div>
                              <div style={{ fontSize: 11, color: S.muted }}>⏱ {mod.estimatedTime}{mod.sections?.length > 0 && ` · ${mod.sections.length} sections`}{mod.videos?.length > 0 && ` · 🎥 ${mod.videos.length} videos`}</div>
                            </div>
                            {done
                              ? <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, flexShrink: 0 }}>✅ Done</span>
                              : <Link to={`/leader-training/module/${mod.id}`} style={{ background: mod.color, color: "#fff", borderRadius: 6, padding: "3px 11px", fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>Start →</Link>}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ background: completed === total ? "linear-gradient(135deg,#052e16,#064e3b)" : "#121212", border: completed === total ? "1px solid #166534" : "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "1.1rem", textAlign: "center" }}>
                      {completed === total
                        ? <><div style={{ fontSize: "1.5rem", marginBottom: 5 }}>🎓</div><div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 9 }}>All modules complete! Take the test.</div><Link to="/leader-training/test" style={{ background: "#22c55e", color: "#fff", borderRadius: 7, padding: "7px 22px", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-block" }}>Take Certification Test →</Link></>
                        : <><div style={{ fontSize: "1.2rem", marginBottom: 5 }}>🔒</div><div style={{ fontWeight: 600, fontSize: 13, color: S.muted }}>Complete all {total} modules to unlock the test</div><div style={{ fontSize: 12, color: S.dimmed, marginTop: 3 }}>{total - completed} module{total - completed !== 1 ? "s" : ""} remaining</div></>}
                    </div>
                  </div>
                );
              })()}

              {/* ══ EMERGENCY ══ */}
              {tab === "emergency" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0, color: "#ef4444" }}>🚨 Emergency Services</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Quick access to emergency contacts during treks. Save before heading out.</p>
                  </div>
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 16, padding: "1.1rem", marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, color: "#f87171", marginBottom: 10, fontSize: 13 }}>📞 National Emergency Numbers</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 7 }}>
                      {[{ icon: "🚓", label: "Police", number: "100", desc: "Law enforcement" }, { icon: "🚒", label: "Fire Brigade", number: "101", desc: "Fire & rescue" }, { icon: "🚑", label: "Ambulance", number: "108", desc: "Medical emergency" }, { icon: "🆘", label: "National Emergency", number: "112", desc: "Unified helpline" }, { icon: "⛰️", label: "Disaster Mgmt", number: "1070", desc: "NDRF helpline" }, { icon: "👩‍⚕️", label: "Women Helpline", number: "1091", desc: "Women safety" }].map(item => (
                        <a key={item.number} href={`tel:${item.number}`} style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.13)", borderRadius: 10, padding: "9px 11px", textDecoration: "none", display: "block" }}>
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{item.icon}</div>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 12 }}>{item.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#ef4444", letterSpacing: 1 }}>{item.number}</div>
                          <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>{item.desc}</div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 16, padding: "1.1rem", marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, color: "#f59e0b", marginBottom: 10, fontSize: 13 }}>⛰️ Trek & Mountain Safety</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {[{ icon: "🏥", label: "Maharashtra SDRF", number: "1070", desc: "State Disaster Response Force" }, { icon: "🏕️", label: "Forest Department", number: "1800-233-4721", desc: "Maharashtra Forest Dept toll-free" }, { icon: "🚁", label: "Air Ambulance (ZIQITZA)", number: "1860-500-1066", desc: "Emergency helicopter / air ambulance" }, { icon: "🩺", label: "Nashik Civil Hospital", number: "0253-2308888", desc: "Closest for Harihar / Salher treks" }, { icon: "🩺", label: "Ahmednagar Dist Hospital", number: "0241-2323255", desc: "Closest for Bhandardara / Ratangad treks" }, { icon: "🩺", label: "Kalyan District Hospital", number: "0251-2322401", desc: "Closest for Murbad / Malshej treks" }].map(item => (
                        <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9, padding: "9px 11px", display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{item.label}</div><div style={{ fontSize: 10, color: S.muted }}>{item.desc}</div></div>
                          <a href={`tel:${item.number}`} style={{ background: "#ea580c", color: "#fff", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", flexShrink: 0, padding: "4px 10px", borderRadius: 6, textDecoration: "none" }}>📞 {item.number}</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 16, padding: "1.1rem" }}>
                    <div style={{ fontWeight: 800, color: "#4ade80", marginBottom: 10, fontSize: 13 }}>🩹 First Aid Quick Reminders</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 7 }}>
                      {[{ icon: "🌡️", label: "Heat Exhaustion", steps: ["Move to shade immediately", "Hydrate with ORS / water", "Cool neck, armpits, wrists", "Call 108 if unconscious"] }, { icon: "🦶", label: "Ankle Sprain", steps: ["R.I.C.E: Rest, Ice, Compress, Elevate", "Do not apply heat", "Avoid weight-bearing", "Descend if severe"] }, { icon: "🐍", label: "Snakebite", steps: ["Keep victim calm and still", "Immobilise the limb", "Do NOT suck or cut wound", "Rush to hospital"] }, { icon: "⚡", label: "Lightning Safety", steps: ["Avoid open ridges and peaks", "Crouch low on balls of feet", "Stay away from lone trees", "Head to lower ground"] }].map(item => (
                        <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(34,197,94,0.08)", borderRadius: 9, padding: "9px 11px" }}>
                          <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 12, marginBottom: 5 }}>{item.icon} {item.label}</div>
                          <ul style={{ margin: 0, paddingLeft: 13, fontSize: 11, color: S.muted }}>
                            {item.steps.map((s, i) => <li key={i} style={{ marginBottom: 2 }}>{s}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ MY PROFILE ══ */}
              {tab === "profile" && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <h1 style={{ ...S.heading, fontSize: "1.55rem", margin: 0 }}>👤 My Profile</h1>
                    <p style={{ color: S.muted, fontSize: 13, marginTop: 4 }}>Your personal information and credentials.</p>
                  </div>

                  {emp ? (
                    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 14 }} className="emp-profile-grid">
                      <div style={{ ...S.card(14), textAlign: "center" }}>
                        <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", margin: "0 auto 9px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
                          {emp.profilePhoto ? <img src={emp.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{emp.fullName}</div>
                        <div style={{ fontSize: 12, color: S.muted }}>{emp.role}</div>
                        <div style={{ marginTop: 5 }}><span className={`badge ${emp.status === "active" ? "bg-success" : "bg-secondary"}`}>{emp.status || "active"}</span></div>
                        {emp.experience?.years && <div style={{ fontSize: 11, color: S.dimmed, marginTop: 5 }}>{emp.experience.years} yrs exp</div>}
                      </div>

                      <div>
                        <div style={{ ...S.card(13), marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 9, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Contact & Info</div>
                          {[["📱 Phone", emp.contactNumber], ["✉️ Email", emp.email], ["📍 Address", emp.address], ["🎯 Expertise", emp.expertise]].filter(([, v]) => v).map(([label, val]) => (
                            <div key={label} style={{ display: "flex", gap: 9, marginBottom: 5, fontSize: 13 }}>
                              <span style={{ color: S.muted, minWidth: 85 }}>{label}</span>
                              <span>{val}</span>
                            </div>
                          ))}
                          {emp.linkedin && <a href={emp.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#60a5fa" }}>🔗 LinkedIn</a>}
                          {emp.instagram && <a href={emp.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#f472b6", marginLeft: 10 }}>📸 Instagram</a>}
                        </div>

                        {emp.skills?.length > 0 && (
                          <div style={{ ...S.card(13), marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 7, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>🎯 Skills</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {emp.skills.map(s => <span key={s} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 20, padding: "2px 9px", fontSize: 11, color: "#4ade80" }}>{s}</span>)}
                            </div>
                          </div>
                        )}

                        {emp.certifications?.length > 0 && (
                          <div style={{ ...S.card(13), marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 7, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>🏅 Certifications</div>
                            {emp.certifications.map((c, i) => <div key={i} style={{ fontSize: 13, marginBottom: 3 }}><strong>{c.name}</strong>{c.details ? ` — ${c.details}` : ""}</div>)}
                          </div>
                        )}

                        {emp.payPerTrek && (
                          <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.13)", borderRadius: 11, padding: "10px 13px", marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: "#4ade80" }}>💵 Pay per Trek</div>
                            <div style={{ fontSize: 19, fontWeight: 900, color: "#22c55e" }}>₹{Number(emp.payPerTrek).toLocaleString("en-IN")}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...S.card(14), color: S.muted, textAlign: "center", padding: "3rem" }}>Profile not found.</div>
                  )}

                  <div style={{ ...S.card(14), marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>🔑 Change Password</div>
                    <form onSubmit={handleChangePassword}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 9, marginBottom: 11 }}>
                        {[["Current Password", "current"], ["New Password", "new1"], ["Confirm New", "new2"]].map(([lbl, key]) => (
                          <div key={key}>
                            <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 3, color: S.muted }}>{lbl}</label>
                            <input type="password" className="form-control form-control-sm" style={inputDark} value={pwForm[key]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                      <button type="submit" className="btn btn-success btn-sm">Update Password</button>
                      {pwMsg && <span style={{ marginLeft: 9, fontSize: 12, color: pwMsg.includes("success") ? "#4ade80" : "#ef4444" }}>{pwMsg}</span>}
                    </form>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .emp-sidebar { transform: translateX(-100%); transition: transform 0.25s; }
          .emp-sidebar.open { transform: translateX(0) !important; }
          .emp-sidebar-close { display: flex !important; }
          .emp-hamburger { display: flex !important; }
          .emp-main { margin-left: 0 !important; }
          .emp-profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
