import React, { useEffect, useState, useMemo } from "react";
import {
  getAllEarnings, saveEarning, deleteEarning,
  queryEarnings, getEarningsSummary, computeProfit,
} from "../data/earningsStorage";
import {
  getAllTrekPayments, createTrekPayment, markSubPaymentDone,
  deleteTrekPayment, getTrekPaymentStats, hydrateTrekPaymentsFromBackend, updateTrekPaymentConfig,
} from "../data/trekPaymentStorage";
import { currentUserHasPermission } from "../data/permissionStorage";
import { logActivity } from "../data/activityLogStorage";
import { getAllEmployees } from "../data/employeeStorage";
import { getAllVendors } from "../data/vendorStorage";
import { getAllIncentives, getIncentiveStats, markAllIncentivesPaid, INCENTIVE_AMOUNT_PER_BOOKING } from "../data/incentiveStorage";
import DownloadButton from "../components/DownloadButton";

/* ── Constants ── */
const REVENUE_TYPES = [
  "Trek / Tour",
  "Tent Rental",
  "Villa Rental",
  "Camping",
  "College IV",
];

const TYPE_CLASS = {
  "Trek / Tour": "trek",
  "Tent Rental": "rental",
  "Villa Rental": "villa",
  "Camping":     "camping",
  "College IV":  "college",
};

const TYPE_ICON = {
  "Trek / Tour": "🥾",
  "Tent Rental": "⛺",
  "Villa Rental": "🏡",
  "Camping":     "🔥",
  "College IV":  "🎓",
};

const PAYMENT_STATUSES = ["PAID", "PENDING", "PARTIAL"];

const PIE_COLORS = { "Trek / Tour": "#3b82f6", "Tent Rental": "#a78bfa", "Villa Rental": "#f472b6", "Camping": "#34d399", "College IV": "#fbbf24" };

function fmt(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

/* ── Blank form ── */
const BLANK = {
  revenueType: "Trek / Tour",
  clientName: "",
  date: new Date().toISOString().slice(0, 10),
  paymentStatus: "PAID",
  notes: "",
  /* Trek */
  trekName: "", trekLeaderName: "",
  trekRevenue: "", transportCost: "", foodCost: "", trekOtherExpenses: "",
  /* Tent */
  tentQty: "", rentPerTent: "", durationDays: "", tentMaintenance: "",
  /* Villa */
  villaName: "", villaRentPerDay: "", villaDays: "", villaServiceCharges: "",
  /* Camping */
  campingLocation: "", campingPerPerson: "", campingParticipants: "", campingSetup: "", campingFoodLogistics: "",
  /* College IV */
  collegeName: "", collegePkgPerStudent: "", collegeStudents: "", collegeCost: "",
  /* Common extras */
  trekLeaderPay: "", vendorCosts: "",
  bookingType: "Own",
};

/* ─────────────────────────────────────────────
   PURE-SVG charts
───────────────────────────────────────────── */
function PieChart({ data }) {
  /* data = [{ label, value, color }] */
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div style={{ color: "#94a3b8", textAlign: "center", padding: 20, fontSize: 13 }}>No data</div>;

  const slices = data.reduce((state, d) => {
    const pct = d.value / total;
    const slice = { ...d, pct, start: state.cursor };
    return {
      cursor: state.cursor + pct,
      slices: [...state.slices, slice],
    };
  }, { cursor: 0, slices: [] }).slices;

  const r = 60; const cx = 80; const cy = 80;
  function arc(start, end) {
    const s = { x: cx + r * Math.cos(2 * Math.PI * start - Math.PI / 2), y: cy + r * Math.sin(2 * Math.PI * start - Math.PI / 2) };
    const e = { x: cx + r * Math.cos(2 * Math.PI * end   - Math.PI / 2), y: cy + r * Math.sin(2 * Math.PI * end   - Math.PI / 2) };
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {slices.map((s, i) => (
          <path key={i} d={arc(s.start, s.start + s.pct)} fill={s.color} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      <div style={{ flex: 1 }}>
        {slices.map((s, i) => (
          <div key={i} className="earn-insight-bar" style={{ marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
            <span className="earn-insight-bar-label" style={{ width: "auto", flex: 1, paddingLeft: 6 }}>{s.label}</span>
            <span className="earn-insight-bar-val">{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color = "#22c55e" }) {
  /* data = [{ label, value }] */
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 360; const H = 140; const PAD = { t: 10, r: 10, b: 32, l: 50 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const bW = Math.max(4, iW / data.length - 6);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.t + iH * (1 - f);
        return <g key={f}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          <text x={PAD.l - 4} y={y + 4} fontSize={8} fill="#94a3b8" textAnchor="end">
            {(max * f / 1000).toFixed(0)}k
          </text>
        </g>;
      })}
      {data.map((d, i) => {
        const bH = iH * (d.value / max);
        const x = PAD.l + i * (iW / data.length) + (iW / data.length - bW) / 2;
        const y = PAD.t + iH - bH;
        return <g key={i}>
          <rect x={x} y={y} width={bW} height={bH} rx={2} fill={color} opacity={0.85} />
          <text x={x + bW / 2} y={H - PAD.b + 14} fontSize={8} fill="#64748b" textAnchor="middle">{d.label}</text>
        </g>;
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Dynamic form fields per revenue type
───────────────────────────────────────────── */
function RevenueFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const calc = computeProfit(form);

  /* Load employees + vendors for auto-fill */
  const leaders = useMemo(() => {
    try { return (getAllEmployees() || []).filter((e) => e.role === "Trek Leader" && e.status !== "inactive"); }
    catch { return []; }
  }, []);
  const allVendors = useMemo(() => {
    try { return getAllVendors() || []; }
    catch { return []; }
  }, []);

  const handleLeaderChange = (e) => {
    const emp = leaders.find((l) => l.fullName === e.target.value);
    setForm((f) => ({
      ...f,
      trekLeaderName: e.target.value,
      trekLeaderPay:  emp?.payPerTrek ? String(emp.payPerTrek) : f.trekLeaderPay,
    }));
  };

  const handleVendorChange = (e) => {
    const v = allVendors.find((v) => v.name === e.target.value);
    setForm((f) => ({
      ...f,
      _selectedVendorName: e.target.value,
      vendorCosts: v?.rateAmount ? String(v.rateAmount) : f.vendorCosts,
    }));
  };

  const numInput = (label, key, placeholder = "0") => (
    <div className="mb-2">
      <label className="form-label" style={{ fontSize: 12 }}>{label}</label>
      <input type="number" className="form-control form-control-sm" placeholder={placeholder}
        value={form[key]} onChange={set(key)} min={0} />
    </div>
  );

  let fields = null;
  switch (form.revenueType) {
    case "Trek / Tour":
      fields = <>
        <div className="mb-2">
          <label className="form-label" style={{ fontSize: 12 }}>Trek Name</label>
          <input className="form-control form-control-sm" value={form.trekName} onChange={set("trekName")} placeholder="e.g. Rajmachi Fort" />
        </div>
        <div className="mb-2">
          <label className="form-label" style={{ fontSize: 12 }}>Trek Leader</label>
          {leaders.length > 0 ? (
            <select className="form-select form-select-sm" value={form.trekLeaderName} onChange={handleLeaderChange}>
              <option value="">— Select Leader —</option>
              {leaders.map((l) => (
                <option key={l.employeeId} value={l.fullName}>
                  {l.fullName}{l.payPerTrek ? ` (₹${Number(l.payPerTrek).toLocaleString("en-IN")}/trek)` : ""}
                </option>
              ))}
              <option value="__other__">Other (type manually)</option>
            </select>
          ) : (
            <input className="form-control form-control-sm" value={form.trekLeaderName} onChange={set("trekLeaderName")} placeholder="Leader name" />
          )}
          {form.trekLeaderName === "__other__" && (
            <input className="form-control form-control-sm mt-1" value={form._customLeaderName || ""} onChange={(e) => setForm((f) => ({ ...f, _customLeaderName: e.target.value, trekLeaderName: e.target.value }))} placeholder="Enter leader name" />
          )}
        </div>
        <div className="earn-form-section">Revenue</div>
        {numInput("Total Revenue Collected (₹)", "trekRevenue")}
        <div className="earn-form-section">Expenses</div>
        {numInput("Transport Cost (₹)", "transportCost")}
        {numInput("Food Cost (₹)", "foodCost")}
        {numInput("Other Expenses (₹)", "trekOtherExpenses")}
      </>;
      break;

    case "Tent Rental":
      fields = <>
        <div className="earn-form-section">Rental Details</div>
        {numInput("Number of Tents", "tentQty", "10")}
        {numInput("Rent per Tent (₹/night)", "rentPerTent", "500")}
        {numInput("Duration (Days)", "durationDays", "1")}
        <div className="earn-form-section">Expenses</div>
        {numInput("Maintenance Cost (₹)", "tentMaintenance")}
      </>;
      break;

    case "Villa Rental":
      fields = <>
        <div className="mb-2">
          <label className="form-label" style={{ fontSize: 12 }}>Villa Name</label>
          <input className="form-control form-control-sm" value={form.villaName} onChange={set("villaName")} />
        </div>
        <div className="earn-form-section">Rental Details</div>
        {numInput("Rent per Day (₹)", "villaRentPerDay")}
        {numInput("Number of Days", "villaDays", "1")}
        <div className="earn-form-section">Expenses</div>
        {numInput("Cleaning / Service Charges (₹)", "villaServiceCharges")}
      </>;
      break;

    case "Camping":
      fields = <>
        <div className="mb-2">
          <label className="form-label" style={{ fontSize: 12 }}>Location</label>
          <input className="form-control form-control-sm" value={form.campingLocation} onChange={set("campingLocation")} />
        </div>
        <div className="earn-form-section">Revenue</div>
        {numInput("Charge per Person (₹)", "campingPerPerson")}
        {numInput("Total Participants", "campingParticipants")}
        <div className="earn-form-section">Expenses</div>
        {numInput("Setup Cost (₹)", "campingSetup")}
        {numInput("Food + Logistics Cost (₹)", "campingFoodLogistics")}
      </>;
      break;

    case "College IV":
      fields = <>
        <div className="mb-2">
          <label className="form-label" style={{ fontSize: 12 }}>College / Institution Name</label>
          <input className="form-control form-control-sm" value={form.collegeName} onChange={set("collegeName")} />
        </div>
        <div className="earn-form-section">Package</div>
        {numInput("Package Cost per Student (₹)", "collegePkgPerStudent")}
        {numInput("Number of Students", "collegeStudents")}
        <div className="earn-form-section">Total Cost (Transport + Stay + Food)</div>
        {numInput("Total Cost (₹)", "collegeCost")}
      </>;
      break;

    default: break;
  }

  return (
    <>
      {fields}

      {/* Common extras */}
      <div className="earn-form-section">Common Extras</div>
      <div className="mb-2">
        <label className="form-label" style={{ fontSize: 12 }}>Booking Type</label>
        <select className="form-select form-select-sm" value={form.bookingType} onChange={set("bookingType")}>
          <option>Own</option>
          <option>B2B Operator</option>
        </select>
      </div>
      {numInput("Trek Leader Pay (₹)", "trekLeaderPay")}

      {/* Vendor selector with auto-fill */}
      <div className="mb-2">
        <label className="form-label" style={{ fontSize: 12 }}>Vendor (auto-fills rate)</label>
        {allVendors.length > 0 ? (
          <select className="form-select form-select-sm" value={form._selectedVendorName || ""} onChange={handleVendorChange}>
            <option value="">— Select Vendor (optional) —</option>
            {allVendors.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name} · {v.serviceType}{v.rateAmount ? ` (₹${Number(v.rateAmount).toLocaleString("en-IN")})` : ""}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {numInput("Vendor Costs (₹)", "vendorCosts")}

      {/* Live calculation */}
      <div className="earn-calc-box">
        <div className="earn-calc-row"><span>Total Revenue</span><strong>{fmt(calc.revenue)}</strong></div>
        <div className="earn-calc-row"><span>Total Expenses</span><strong>{fmt(calc.expenses)}</strong></div>
        <div className={`earn-calc-total ${calc.profit < 0 ? "earn-calc-loss" : ""}`}>
          <span>Net Profit</span><strong>{fmt(calc.profit)}</strong>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Trek Payments Tab
───────────────────────────────────────────── */
const RECIPIENT_ICONS = {
  LEADER:     "👤",
  FOOD_VENDOR: "🍱",
  BUS_VENDOR:  "🚌",
  ENTRY_FEES:  "🎟",
};

const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Cash", "Cheque"];

function TrekPaymentsTab({ tick, onRefresh }) {
  const hasPermission = currentUserHasPermission("vendor_payments");

  /* Form state */
  const [selectedTrekId,      setSelectedTrekId]      = useState("");
  const [selectedLeaderId,    setSelectedLeaderId]    = useState("");
  const [selectedFoodVendorId, setSelectedFoodVendorId] = useState("");
  const [selectedBusVendorId, setSelectedBusVendorId] = useState("");
  const [entryFeesInput,      setEntryFeesInput]      = useState("");
  const [eventDate,           setEventDate]           = useState("");
  const [participants,        setParticipants]        = useState("");
  const [whatsappGroupLink,   setWhatsappGroupLink]   = useState("");
  const [formMsg,             setFormMsg]             = useState("");
  const [overrides,           setOverrides]           = useState({});
  // overrides shape: { LEADER: { amount: "", reason: "" }, FOOD_VENDOR: { ... }, ... }

  /* Expanded row */
  const [expandedId, setExpandedId] = useState(null);

  /* Mark-paid inline form */
  const [markForm, setMarkForm] = useState({}); // { [paymentId-recipientType]: { method, reference } }

  /* WhatsApp link edit */
  const [waEditId,  setWaEditId]  = useState(null);
  const [waEditVal, setWaEditVal] = useState("");

  /* Data lists */
  const treks = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("gt_treks")) || []; }
    catch { return []; }
  }, [tick]);

  const leaders     = useMemo(() => getAllEmployees().filter(e => e.role === "Trek Leader" && e.status !== "inactive"), [tick]);
  const foodVendors = useMemo(() => getAllVendors().filter(v => v.serviceType === "Food"),  [tick]);
  const busVendors  = useMemo(() => getAllVendors().filter(v => v.serviceType === "Bus"),   [tick]);

  /* Selected records */
  const selectedTrek       = treks.find(t => t.id === selectedTrekId) || null;
  const selectedLeader     = leaders.find(e => e.employeeId === selectedLeaderId) || null;
  const selectedFoodVendor = foodVendors.find(v => v.id === selectedFoodVendorId) || null;
  const selectedBusVendor  = busVendors.find(v => v.id === selectedBusVendorId)   || null;

  /* Build config from employee/vendor records */
  const config = {
    trekLeaderName:     selectedLeader?.fullName     || "",
    foodVendorName:     selectedFoodVendor?.name     || "",
    busVendorName:      selectedBusVendor?.name      || "",
    leaderFee:          Number(selectedLeader?.payPerTrek          || 0),
    foodCostPerPerson:  Number(selectedFoodVendor?.rateAmount      || 0),
    transportCostFixed: Number(selectedBusVendor?.rateAmount       || 0),
    entryFees:          Number(entryFeesInput                      || 0),
    whatsappGroupLink:  whatsappGroupLink.trim(),
  };

  /* Live calc */
  const p = Number(participants || 0);
  const liveLeader    = config.leaderFee;
  const liveFood      = config.foodCostPerPerson  * p;
  const liveTransport = config.transportCostFixed;
  const liveEntry     = config.entryFees          * p;
  const liveTotal     = liveLeader + liveFood + liveTransport + liveEntry;

  const canSubmit = selectedTrekId && eventDate && participants && Number(participants) > 0;

  const resetForm = () => {
    setSelectedTrekId(""); setSelectedLeaderId(""); setSelectedFoodVendorId("");
    setSelectedBusVendorId(""); setEntryFeesInput(""); setEventDate(""); setParticipants("");
    setWhatsappGroupLink("");
    setOverrides({});
  };

  const handleInitiate = async () => {
    if (!canSubmit) return;
    try {
      const record = await createTrekPayment({
        trekName: selectedTrek?.name || selectedTrekId,
        trekId: selectedTrek?.id || "",
        eventDate,
        participants: Number(participants),
        config,
        overrides: Object.fromEntries(
          Object.entries(overrides).filter(([, v]) => v.amount !== "")
            .map(([k, v]) => [k, { amount: Number(v.amount), reason: v.reason }])
        ),
      });
      logActivity({
        action: "TREK_PAYMENT_INITIATED",
        actionLabel: `Initiated payment for ${record.trekName}`,
        details: `Event: ${eventDate} | Participants: ${participants} | Leader: ${config.trekLeaderName || "—"} | Total: ₹${record.calculations.totalCost.toLocaleString("en-IN")}`,
        module: "Payments",
        severity: "warning",
      });
      resetForm();
      setFormMsg("Payment initiated successfully!");
      setTimeout(() => setFormMsg(""), 3000);
      onRefresh();
    } catch (error) {
      setFormMsg(error.message || "Payment could not be initiated.");
    }
  };

  const payments = getAllTrekPayments();

  const statusBadge = (s) => {
    const map = { PENDING: ["#fef3c7", "#92400e", "PENDING"], IN_PROGRESS: ["#dbeafe", "#1e40af", "IN PROGRESS"], COMPLETED: ["#dcfce7", "#166534", "COMPLETED"] };
    const [bg, color, label] = map[s] || map.PENDING;
    return <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{label}</span>;
  };

  const getMarkKey = (paymentId, recipientType) => `${paymentId}-${recipientType}`;

  const handleMarkPaid = async (paymentId, recipientType) => {
    const key = getMarkKey(paymentId, recipientType);
    const mf = markForm[key] || {};
    const updated = await markSubPaymentDone({ paymentId, recipientType, method: mf.method || "UPI", reference: mf.reference || "" });
    if (updated) {
      logActivity({
        action: "TREK_SUBPAYMENT_COMPLETED",
        description: `Marked ${recipientType} payment as COMPLETED for payment ${paymentId} via ${mf.method || "UPI"}`,
        module: "Payments",
        severity: "info",
      });
      setMarkForm((prev) => { const n = { ...prev }; delete n[key]; return n; });
      onRefresh();
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm("Delete this payment record? This cannot be undone.")) return;
    const deleted = await deleteTrekPayment(paymentId);
    if (deleted) {
      logActivity({
        action: "TREK_PAYMENT_DELETED",
        description: `Deleted trek payment record ${paymentId}`,
        module: "Payments",
        severity: "warning",
      });
      onRefresh();
    }
  };

  if (!hasPermission) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h5 style={{ color: "#1e293b" }}>Access Restricted</h5>
        <p style={{ color: "#64748b" }}>You do not have access to perform this action.</p>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Only <strong>Pratik Ubhe</strong> and <strong>Rohit Panhalkar</strong> can initiate and manage vendor payments.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Initiate New Trek Payment form card ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Initiate New Trek Payment</div>

        {/* Row 1: Trek / Date / Participants */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Trek / Event Name *</label>
            <select className="form-select form-select-sm" value={selectedTrekId}
              onChange={(e) => setSelectedTrekId(e.target.value)}>
              <option value="">— Choose Trek —</option>
              {treks.map((t, i) => <option key={t.id || i} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Event Date *</label>
            <input type="date" className="form-control form-control-sm" value={eventDate}
              onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Participant Count *</label>
            <input type="number" className="form-control form-control-sm" min={1} placeholder="e.g. 30"
              value={participants} onChange={(e) => setParticipants(e.target.value)} />
          </div>
        </div>

        {/* Row 2: Leader / Vendors / Entry Fees */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Trek Leader</label>
            <select className="form-select form-select-sm" value={selectedLeaderId}
              onChange={(e) => setSelectedLeaderId(e.target.value)}>
              <option value="">— Select Leader —</option>
              {leaders.map(e => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.fullName}{e.payPerTrek ? ` (₹${Number(e.payPerTrek).toLocaleString("en-IN")}/trek)` : ""}
                </option>
              ))}
            </select>
            {selectedLeader && <small className="text-muted" style={{fontSize:10}}>Pay: ₹{Number(selectedLeader.payPerTrek||0).toLocaleString("en-IN")}</small>}
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Food Vendor</label>
            <select className="form-select form-select-sm" value={selectedFoodVendorId}
              onChange={(e) => setSelectedFoodVendorId(e.target.value)}>
              <option value="">— Select Food Vendor —</option>
              {foodVendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}{v.rateAmount ? ` (₹${Number(v.rateAmount).toLocaleString("en-IN")}/person)` : ""}
                </option>
              ))}
            </select>
            {selectedFoodVendor && <small className="text-muted" style={{fontSize:10}}>Rate: ₹{Number(selectedFoodVendor.rateAmount||0).toLocaleString("en-IN")}/person</small>}
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Bus / Transport Vendor</label>
            <select className="form-select form-select-sm" value={selectedBusVendorId}
              onChange={(e) => setSelectedBusVendorId(e.target.value)}>
              <option value="">— Select Bus Vendor —</option>
              {busVendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}{v.rateAmount ? ` (₹${Number(v.rateAmount).toLocaleString("en-IN")}/trip)` : ""}
                </option>
              ))}
            </select>
            {selectedBusVendor && <small className="text-muted" style={{fontSize:10}}>Rate: ₹{Number(selectedBusVendor.rateAmount||0).toLocaleString("en-IN")} fixed</small>}
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Entry Fees (₹/person)</label>
            <input type="number" className="form-control form-control-sm" min={0} placeholder="0"
              value={entryFeesInput} onChange={(e) => setEntryFeesInput(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>📱 WhatsApp Group Link</label>
            <input type="url" className="form-control form-control-sm" placeholder="https://chat.whatsapp.com/..."
              value={whatsappGroupLink} onChange={(e) => setWhatsappGroupLink(e.target.value)} />
            <small className="text-muted" style={{ fontSize: 10 }}>Visible to assigned trek leader</small>
          </div>
        </div>

        {/* Editable cost lines — shown once trek + at least one selection made */}
        {(selectedTrekId || liveTotal > 0) && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: "#166534", marginBottom: 10 }}>Cost Breakdown (Edit to Override)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {[
                { key: "LEADER",     label: "Trek Leader Fee", recipient: config.trekLeaderName || "Trek Leader", baseAmount: liveLeader },
                { key: "FOOD_VENDOR", label: "Food Total",      recipient: config.foodVendorName  || "Food Vendor",  baseAmount: liveFood },
                { key: "BUS_VENDOR", label: "Transport Cost",  recipient: config.busVendorName   || "Bus Vendor",   baseAmount: liveTransport },
                { key: "ENTRY_FEES", label: "Entry Fees Total", recipient: "Entry Fees / Government",              baseAmount: liveEntry },
              ].filter(row => row.baseAmount > 0 || overrides[row.key]?.amount !== undefined).map(({ key, label, recipient, baseAmount }) => {
                const ovr = overrides[key] || { amount: "", reason: "" };
                const changed = ovr.amount !== "" && Number(ovr.amount) !== baseAmount;
                return (
                  <div key={key} style={{ background: "#fff", border: `1px solid ${changed ? "#fbbf24" : "#e2e8f0"}`, borderRadius: 6, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{recipient}</div>
                    <input
                      type="number" min="0"
                      className="form-control form-control-sm"
                      value={ovr.amount !== "" ? ovr.amount : baseAmount}
                      onChange={e => setOverrides(prev => ({ ...prev, [key]: { ...prev[key], amount: e.target.value, reason: prev[key]?.reason || "" } }))}
                      style={{ borderColor: changed ? "#fbbf24" : undefined }}
                    />
                    {changed && (
                      <input
                        className="form-control form-control-sm mt-1"
                        placeholder="Reason for change *"
                        value={ovr.reason}
                        onChange={e => setOverrides(prev => ({ ...prev, [key]: { ...prev[key], reason: e.target.value } }))}
                        style={{ borderColor: !ovr.reason ? "#ef4444" : "#22c55e" }}
                      />
                    )}
                    {changed && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 3 }}>Auto: ₹{baseAmount.toLocaleString("en-IN")} → ₹{Number(ovr.amount).toLocaleString("en-IN")}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: "#166534", borderTop: "1px solid #bbf7d0", paddingTop: 8 }}>
              Total Outgoing: <strong>₹{(() => {
                const ovL = overrides.LEADER?.amount !== "" && overrides.LEADER?.amount !== undefined ? Number(overrides.LEADER.amount) : liveLeader;
                const ovF = overrides.FOOD_VENDOR?.amount !== "" && overrides.FOOD_VENDOR?.amount !== undefined ? Number(overrides.FOOD_VENDOR.amount) : liveFood;
                const ovB = overrides.BUS_VENDOR?.amount !== "" && overrides.BUS_VENDOR?.amount !== undefined ? Number(overrides.BUS_VENDOR.amount) : liveTransport;
                const ovE = overrides.ENTRY_FEES?.amount !== "" && overrides.ENTRY_FEES?.amount !== undefined ? Number(overrides.ENTRY_FEES.amount) : liveEntry;
                return (ovL + ovF + ovB + ovE).toLocaleString("en-IN");
              })()}</strong>
            </div>
          </div>
        )}

        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-success btn-sm" disabled={!canSubmit} onClick={handleInitiate}>
            Initiate Payments
          </button>
          {formMsg && <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>{formMsg}</span>}
        </div>
      </div>

      {/* ── Existing payment records ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
          Payment Records ({payments.length})
        </div>

        {payments.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">💸</div>
            <p className="adm-empty-text">No trek payment records yet.</p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="table table-hover adm-table mb-0">
              <thead>
                <tr>
                  <th>Trek Name</th>
                  <th>Event Date</th>
                  <th>Participants</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((rec) => (
                  <React.Fragment key={rec.paymentId}>
                    <tr>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{rec.trekName}</td>
                      <td style={{ fontSize: 12 }}>{rec.eventDate}</td>
                      <td style={{ fontSize: 13 }}>{rec.participants}</td>
                      <td><strong>{fmt(rec.calculations?.totalCost)}</strong></td>
                      <td>{statusBadge(rec.status)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize: 11 }}
                            onClick={() => setExpandedId(expandedId === rec.paymentId ? null : rec.paymentId)}>
                            {expandedId === rec.paymentId ? "Hide" : "View"}
                          </button>
                          {rec.status === "PENDING" && (
                            <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize: 11 }}
                              onClick={() => handleDelete(rec.paymentId)}>
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedId === rec.paymentId && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: 16 }}>
                            {/* WhatsApp Group Link per date */}
                            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", whiteSpace: "nowrap" }}>📱 WhatsApp Group ({rec.eventDate}):</span>
                              {waEditId === rec.paymentId ? (
                                <>
                                  <input
                                    type="url"
                                    className="form-control form-control-sm"
                                    style={{ flex: 1, minWidth: 220 }}
                                    placeholder="https://chat.whatsapp.com/..."
                                    value={waEditVal}
                                    onChange={e => setWaEditVal(e.target.value)}
                                  />
                                  <button className="btn btn-success btn-sm py-0 px-2" style={{ fontSize: 11 }} onClick={async () => {
                                    await updateTrekPaymentConfig(rec.paymentId, { whatsappGroupLink: waEditVal.trim() });
                                    setWaEditId(null); setWaEditVal(""); onRefresh();
                                  }}>Save</button>
                                  <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: 11 }} onClick={() => { setWaEditId(null); setWaEditVal(""); }}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  {rec.config?.whatsappGroupLink
                                    ? <a href={rec.config.whatsappGroupLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#15803d", flex: 1, wordBreak: "break-all" }}>{rec.config.whatsappGroupLink}</a>
                                    : <span style={{ fontSize: 12, color: "#94a3b8", flex: 1 }}>No link set for this date</span>
                                  }
                                  <button className="btn btn-outline-success btn-sm py-0 px-2" style={{ fontSize: 11 }} onClick={() => { setWaEditId(rec.paymentId); setWaEditVal(rec.config?.whatsappGroupLink || ""); }}>
                                    {rec.config?.whatsappGroupLink ? "Edit" : "+ Add Link"}
                                  </button>
                                </>
                              )}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                              Sub-Payments — Created by {rec.createdBy} on {new Date(rec.createdAt).toLocaleDateString("en-IN")}
                            </div>
                            {rec.payments && rec.payments.length > 0 ? rec.payments.map((sp) => {
                              const mkKey = getMarkKey(rec.paymentId, sp.recipientType);
                              const mf = markForm[mkKey] || {};
                              return (
                                <div key={sp.recipientType} style={{
                                  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                                  padding: "10px 14px", marginBottom: 8, display: "flex",
                                  alignItems: "flex-start", gap: 12, flexWrap: "wrap",
                                }}>
                                  <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                      {RECIPIENT_ICONS[sp.recipientType] || "💳"} {sp.recipientName}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>
                                      {fmt(sp.amount)}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    {sp.status === "COMPLETED" ? (
                                      <div style={{ fontSize: 12, color: "#22c55e" }}>
                                        ✅ Paid via {sp.method} on {sp.paidAt ? new Date(sp.paidAt).toLocaleDateString("en-IN") : "—"}
                                        {sp.reference && <span style={{ color: "#64748b" }}> · Ref: {sp.reference}</span>}
                                      </div>
                                    ) : (
                                      <>
                                        {statusBadge("PENDING")}
                                        {markForm[mkKey] !== undefined ? (
                                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                            <select className="form-select form-select-sm" style={{ width: 130 }}
                                              value={mf.method || "UPI"}
                                              onChange={(e) => setMarkForm((prev) => ({ ...prev, [mkKey]: { ...prev[mkKey], method: e.target.value } }))}>
                                              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                                            </select>
                                            <input className="form-control form-control-sm" style={{ width: 140 }}
                                              placeholder="Reference / UTR"
                                              value={mf.reference || ""}
                                              onChange={(e) => setMarkForm((prev) => ({ ...prev, [mkKey]: { ...prev[mkKey], reference: e.target.value } }))} />
                                            <button className="btn btn-success btn-sm py-0 px-2" style={{ fontSize: 11 }}
                                              onClick={() => handleMarkPaid(rec.paymentId, sp.recipientType)}>
                                              Confirm
                                            </button>
                                            <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: 11 }}
                                              onClick={() => setMarkForm((prev) => { const n = { ...prev }; delete n[mkKey]; return n; })}>
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <button className="btn btn-outline-success btn-sm py-0 px-2" style={{ fontSize: 11 }}
                                            onClick={() => setMarkForm((prev) => ({ ...prev, [mkKey]: { method: "UPI", reference: "" } }))}>
                                            Mark Paid
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            }) : (
                              <div style={{ fontSize: 12, color: "#94a3b8" }}>No sub-payments (all amounts were ₹0).</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   IncentivePayoutsSection — admin view of referral incentives
═════════════════════════════════════════════ */
function IncentivePayoutsSection({ onRefresh }) {
  const hasPermission = currentUserHasPermission("vendor_payments");
  const [payForm, setPayForm] = useState({});    // { [empId]: { via, ref } }
  const [expanded, setExpanded] = useState(null);

  const incentives = getAllIncentives();
  /* Group by employee */
  const byEmp = {};
  incentives.forEach(i => {
    if (!byEmp[i.employeeId]) byEmp[i.employeeId] = { name: i.employeeName, empId: i.employeeId, items: [] };
    byEmp[i.employeeId].items.push(i);
  });
  const empGroups = Object.values(byEmp);

  if (empGroups.length === 0) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
        🔗 Referral Incentive Payouts
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400, marginLeft: 8 }}>₹{INCENTIVE_AMOUNT_PER_BOOKING} per referred booking</span>
      </div>

      {empGroups.map(grp => {
        const pending = grp.items.filter(i => i.status === "PENDING");
        const paid    = grp.items.filter(i => i.status === "PAID");
        const pendingAmt = pending.reduce((s, i) => s + i.amount, 0);
        const pf = payForm[grp.empId] || {};

        return (
          <div key={grp.empId} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{grp.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {grp.items.length} referral booking{grp.items.length !== 1 ? "s" : ""} ·
                  <span style={{ color: "#d97706" }}> ₹{pendingAmt.toLocaleString("en-IN")} pending</span> ·
                  <span style={{ color: "#16a34a" }}> ₹{paid.reduce((s,i)=>s+i.amount,0).toLocaleString("en-IN")} paid</span>
                </div>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize: 11 }}
                  onClick={() => setExpanded(expanded === grp.empId ? null : grp.empId)}>
                  {expanded === grp.empId ? "Hide" : "View All"}
                </button>
                {hasPermission && pending.length > 0 && (
                  <>
                    <select className="form-select form-select-sm" style={{ width: 100 }} value={pf.via || "UPI"}
                      onChange={e => setPayForm(p => ({ ...p, [grp.empId]: { ...p[grp.empId], via: e.target.value } }))}>
                      {["UPI", "Bank Transfer", "Cash", "Cheque"].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input className="form-control form-control-sm" style={{ width: 130 }} placeholder="Reference…"
                      value={pf.ref || ""}
                      onChange={e => setPayForm(p => ({ ...p, [grp.empId]: { ...p[grp.empId], ref: e.target.value } }))} />
                    <button className="btn btn-success btn-sm py-0 px-3" style={{ fontSize: 11 }}
                      onClick={() => {
                        markAllIncentivesPaid(grp.empId, { paidVia: pf.via || "UPI", paidRef: pf.ref || "" });
                        logActivity({ action: "INCENTIVE_PAYOUT", actionLabel: "Incentive Payout", details: `Paid ₹${pendingAmt} to ${grp.name}`, module: "Payments", severity: "info" });
                        setPayForm(p => { const n = { ...p }; delete n[grp.empId]; return n; });
                        onRefresh();
                      }}>
                      ✅ Pay ₹{pendingAmt.toLocaleString("en-IN")}
                    </button>
                  </>
                )}
              </div>
            </div>
            {expanded === grp.empId && (
              <div style={{ borderTop: "1px solid #f1f5f9", padding: "8px 16px 12px" }}>
                {grp.items.map(inc => (
                  <div key={inc.incentiveId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{inc.trekName}</span>
                      <span style={{ color: "#94a3b8", marginLeft: 8 }}>{inc.customerName}</span>
                      <span style={{ color: "#94a3b8", marginLeft: 8 }}>{new Date(inc.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <strong style={{ color: "#16a34a" }}>₹{inc.amount}</strong>
                    <span className={`badge ${inc.status === "PAID" ? "bg-success" : "bg-warning text-dark"}`} style={{ fontSize: 9 }}>{inc.status}</span>
                    {inc.status === "PAID" && inc.paidVia && <span style={{ fontSize: 10, color: "#94a3b8" }}>{inc.paidVia} · {inc.paidRef}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Main ManageEarnings component
═════════════════════════════════════════════ */
export default function ManageEarnings() {
  const [tab,          setTab]          = useState("overview");
  const [earningSubTab, setEarningSubTab] = useState("records"); // "add" | "records"
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [form,         setForm]         = useState({ ...BLANK });
  const [editId,       setEditId]       = useState(null);
  const [tick,         setTick]         = useState(0);
  const [expanded,     setExpanded]     = useState(null);
  const [saveMsg,      setSaveMsg]      = useState("");

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    let active = true;
    hydrateTrekPaymentsFromBackend().then(() => {
      if (active) refresh();
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const summary  = useMemo(() => getEarningsSummary(), [tick]);
  const payStats = useMemo(() => getTrekPaymentStats(), [tick]);
  const incStats = useMemo(() => getIncentiveStats(), [tick]);

  const records = queryEarnings({
    revenueType: typeFilter || undefined,
    paymentStatus: statusFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    search: search || undefined,
  });

  /* ── Handlers ── */
  const startAdd = () => { setForm({ ...BLANK }); setEditId(null); setEarningSubTab("add"); setTab("earnings"); setSaveMsg(""); };
  const startEdit = (e) => {
    setForm({ ...BLANK, ...e });
    setEditId(e.earningId);
    setEarningSubTab("add");
    setTab("earnings");
    setSaveMsg("");
  };

  const handleSave = () => {
    const required = form.clientName.trim() && form.date;
    if (!required) { setSaveMsg("Client name and date are required."); return; }
    saveEarning({ ...form, earningId: editId || undefined });
    refresh();
    setSaveMsg(editId ? "Record updated." : "Record saved.");
    setTimeout(() => { setEarningSubTab("records"); setSaveMsg(""); }, 800);
    if (!editId) setForm({ ...BLANK });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this earnings record?")) return;
    deleteEarning(id);
    refresh();
  };

  /* ── KPI data ── */
  const pieData = Object.entries(summary.byType).map(([label, d]) => ({ label, value: d.revenue, color: PIE_COLORS[label] || "#94a3b8" }));
  const monthlyBar = Object.entries(summary.monthly).map(([label, value]) => ({ label, value }));

  /* ── Utilization / insights ── */
  const maxByType = Math.max(...Object.values(summary.byType).map((d) => d.revenue), 1);

  return (
    <div className="adm-page">

      {/* ── Page header ── */}
      <div className="adm-page-header">
        <h3 className="adm-page-title">💰 Payments & Earnings</h3>
        <div className="d-flex gap-2 align-items-center">
          <span className="adm-count-badge">{summary.count} records</span>
          <DownloadButton
            getData={() => getAllEarnings().map((e) => ({
              id: e.earningId, type: e.revenueType, client: e.clientName,
              date: e.date, revenue: e.revenue, expenses: e.expenses,
              profit: e.profit, status: e.paymentStatus,
            }))}
            filename="earnings"
            title="Earnings Report — Gadvede Trekkers"
          />
          <button className="btn btn-success btn-sm" onClick={startAdd}>+ Add Earning</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="earn-tabs">
        {[["overview","📊 Overview"], ["payments","💸 Payments"], ["earnings","💰 Earnings"], ["completed","✅ Completed"], ["insights","💡 Insights"]].map(([t, l]) => (
          <button key={t} className={`earn-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════ */}
      {tab === "overview" && (
        <>
          {/* Outgoing payments KPI banner */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>💸 Trek Payments</span>
              <span>Total: <strong>₹{payStats.totalOutgoing.toLocaleString("en-IN")}</strong></span>
              <span>Pending: <strong style={{ color: "#f59e0b" }}>₹{payStats.pending.toLocaleString("en-IN")}</strong></span>
              <span>Completed: <strong style={{ color: "#22c55e" }}>₹{payStats.completed.toLocaleString("en-IN")}</strong></span>
              <span>{payStats.count} event{payStats.count !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ flex: 1, minWidth: 200, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>🔗 Referral Incentives</span>
              <span>Total: <strong>₹{incStats.totalIssued.toLocaleString("en-IN")}</strong></span>
              <span>Pending: <strong style={{ color: "#d97706" }}>₹{incStats.pending.toLocaleString("en-IN")}</strong></span>
              <span>Paid: <strong style={{ color: "#16a34a" }}>₹{incStats.paid.toLocaleString("en-IN")}</strong></span>
              <span>{incStats.count} booking{incStats.count !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* KPI row */}
          <div className="earn-kpi-row">
            <div className="earn-kpi">
              <div className="earn-kpi-icon">💵</div>
              <div className="earn-kpi-val">{fmt(summary.totalRevenue)}</div>
              <div className="earn-kpi-label">Total Revenue</div>
            </div>
            <div className="earn-kpi">
              <div className="earn-kpi-icon">📉</div>
              <div className="earn-kpi-val">{fmt(summary.totalExpenses)}</div>
              <div className="earn-kpi-label">Total Expenses</div>
            </div>
            <div className="earn-kpi">
              <div className="earn-kpi-icon">📈</div>
              <div className="earn-kpi-val" style={{ color: summary.totalProfit >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(summary.totalProfit)}</div>
              <div className="earn-kpi-label">Net Profit</div>
            </div>
            <div className="earn-kpi">
              <div className="earn-kpi-icon">⏳</div>
              <div className="earn-kpi-val" style={{ color: "#f59e0b" }}>{fmt(summary.pending)}</div>
              <div className="earn-kpi-label">Pending Payments</div>
            </div>
            <div className="earn-kpi">
              <div className="earn-kpi-icon">📁</div>
              <div className="earn-kpi-val">{summary.count}</div>
              <div className="earn-kpi-label">Total Records</div>
            </div>
          </div>

          {/* Source cards */}
          <div className="earn-source-row">
            {REVENUE_TYPES.map((rt) => {
              const d = summary.byType[rt] || { revenue: 0, count: 0 };
              return (
                <div key={rt} className={`earn-source-card ${TYPE_CLASS[rt]}`} data-icon={TYPE_ICON[rt]}>
                  <div className="earn-source-type">{rt}</div>
                  <div className="earn-source-amt">{fmt(d.revenue)}</div>
                  <div className="earn-source-count">{d.count || 0} records</div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Revenue by Type</div>
              <PieChart data={pieData} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Monthly Revenue (Last 6 Months)</div>
              <BarChart data={monthlyBar} color="#22c55e" />
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB: PAYMENTS
      ══════════════════════════════════════════ */}
      {tab === "payments" && (
        <>
          <TrekPaymentsTab tick={tick} onRefresh={refresh} />
          <IncentivePayoutsSection onRefresh={refresh} />
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB: EARNINGS
      ══════════════════════════════════════════ */}
      {tab === "earnings" && (
        <>
          {/* Sub-tab toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["add", editId ? "✏️ Edit" : "✏️ Add"], ["records", "📋 Records"]].map(([st, sl]) => (
              <button key={st}
                className={`btn btn-sm ${earningSubTab === st ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setEarningSubTab(st)}>
                {sl}
              </button>
            ))}
          </div>

          {/* ── Sub-tab: ADD / EDIT ── */}
          {earningSubTab === "add" && (
            <div className="earn-form-grid">
              {/* Left: basic info */}
              <div className="earn-form-card">
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                  {editId ? "Edit Earning Record" : "New Earning Record"}
                </div>

                <div className="mb-2">
                  <label className="form-label" style={{ fontSize: 12 }}>Revenue Type *</label>
                  <select className="form-select form-select-sm" value={form.revenueType}
                    onChange={(e) => setForm((f) => ({ ...BLANK, revenueType: e.target.value, clientName: f.clientName, date: f.date, paymentStatus: f.paymentStatus, notes: f.notes }))}>
                    {REVENUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label" style={{ fontSize: 12 }}>Client / Group Name *</label>
                  <input className="form-control form-control-sm" value={form.clientName}
                    onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
                </div>

                <div className="mb-2">
                  <label className="form-label" style={{ fontSize: 12 }}>Date *</label>
                  <input type="date" className="form-control form-control-sm" value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>

                <div className="mb-2">
                  <label className="form-label" style={{ fontSize: 12 }}>Payment Status</label>
                  <select className="form-select form-select-sm" value={form.paymentStatus}
                    onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}>
                    {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 12 }}>Notes</label>
                  <textarea className="form-control form-control-sm" rows={2} value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm" onClick={handleSave}>
                    {editId ? "Update Record" : "Save Record"}
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setEarningSubTab("records")}>Cancel</button>
                </div>
                {saveMsg && <div className="alert alert-info py-1 mt-2" style={{ fontSize: 13 }}>{saveMsg}</div>}
              </div>

              {/* Right: dynamic revenue-type fields */}
              <div className="earn-form-card">
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{TYPE_ICON[form.revenueType]}</span>
                  {form.revenueType} Details
                </div>
                <RevenueFields form={form} setForm={setForm} />
              </div>
            </div>
          )}

          {/* ── Sub-tab: RECORDS ── */}
          {earningSubTab === "records" && (
            <>
              {/* Filters */}
              <div className="adm-filter-bar">
                <input className="form-control form-control-sm" placeholder="Search client, ID, trek…"
                  value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 2 }} />
                <select className="form-select form-select-sm" value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)} style={{ flex: 1 }}>
                  <option value="">All Types</option>
                  {REVENUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <select className="form-select form-select-sm" value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: 1 }}>
                  <option value="">All Statuses</option>
                  {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input type="date" className="form-control form-control-sm" value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1 }} title="From" />
                <input type="date" className="form-control form-control-sm" value={toDate}
                  onChange={(e) => setToDate(e.target.value)} style={{ flex: 1 }} title="To" />
              </div>

              {records.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-icon">💰</div>
                  <p className="adm-empty-text">No earnings records found.</p>
                </div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="table table-hover adm-table mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Client / Group</th>
                        <th>Date</th>
                        <th>Revenue</th>
                        <th>Expenses</th>
                        <th>Net Profit</th>
                        <th>Status</th>
                        <th style={{ width: 100 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((e) => (
                        <React.Fragment key={e.earningId}>
                          <tr>
                            <td style={{ fontFamily: "monospace", fontSize: 11 }}>{e.earningId}</td>
                            <td>
                              <span className={`earn-type-badge earn-type-${TYPE_CLASS[e.revenueType] || "trek"}`}>
                                {TYPE_ICON[e.revenueType]} {e.revenueType}
                              </span>
                            </td>
                            <td style={{ fontSize: 13 }}>{e.clientName}</td>
                            <td style={{ fontSize: 12 }}>{e.date}</td>
                            <td><strong>{fmt(e.revenue)}</strong></td>
                            <td style={{ color: "#64748b" }}>{fmt(e.expenses)}</td>
                            <td>
                              <span className={e.profit >= 0 ? "earn-profit-pos" : "earn-profit-neg"}>
                                {e.profit >= 0 ? "+" : ""}{fmt(e.profit)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${e.paymentStatus === "PAID" ? "bg-success" : e.paymentStatus === "PARTIAL" ? "bg-warning text-dark" : "bg-danger"}`} style={{ fontSize: 10 }}>
                                {e.paymentStatus}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize: 11 }}
                                  onClick={() => setExpanded(expanded === e.earningId ? null : e.earningId)}>
                                  {expanded === e.earningId ? "Hide" : "View"}
                                </button>
                                <button className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: 11 }}
                                  onClick={() => startEdit(e)}>
                                  Edit
                                </button>
                                <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize: 11 }}
                                  onClick={() => handleDelete(e.earningId)}>
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expanded === e.earningId && (
                            <tr>
                              <td colSpan={9} className="p-0">
                                <div className="adm-booking-detail">
                                  <div className="adm-detail-grid">
                                    {e.trekName      && <div><span>Trek</span><strong>{e.trekName}</strong></div>}
                                    {e.trekLeaderName && <div><span>Leader</span><strong>{e.trekLeaderName}</strong></div>}
                                    {e.villaName     && <div><span>Villa</span><strong>{e.villaName}</strong></div>}
                                    {e.collegeName   && <div><span>College</span><strong>{e.collegeName}</strong></div>}
                                    {e.campingLocation && <div><span>Location</span><strong>{e.campingLocation}</strong></div>}
                                    {Number(e.trekLeaderPay) > 0 && <div><span>Leader Pay</span><strong>{fmt(e.trekLeaderPay)}</strong></div>}
                                    {Number(e.vendorCosts) > 0   && <div><span>Vendor Costs</span><strong>{fmt(e.vendorCosts)}</strong></div>}
                                    <div><span>Booking Type</span><strong>{e.bookingType || "Own"}</strong></div>
                                    {e.notes && <div style={{ gridColumn: "1/-1" }}><span>Notes</span><strong>{e.notes}</strong></div>}
                                    <div><span>Created</span><strong style={{ fontSize: 11 }}>{e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN") : "—"}</strong></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB: COMPLETED
      ══════════════════════════════════════════ */}
      {tab === "completed" && (() => {
        const completedPayments = getAllTrekPayments().filter(r => r.status === "COMPLETED");
        return (
          <div>
            {completedPayments.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">✅</div>
                <p className="adm-empty-text">No completed trek payments yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {completedPayments.map(rec => {
                  const totalPaid = (rec.payments || []).reduce((s, sp) => s + (sp.finalAmount !== undefined ? sp.finalAmount : sp.amount), 0);
                  return (
                    <div key={rec.paymentId} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ background: "#f0fdf4", padding: "10px 16px", borderBottom: "1px solid #bbf7d0", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>{rec.trekName}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>📅 {rec.eventDate}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>👥 {rec.participants} participants</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginLeft: "auto" }}>Total Paid: {fmt(totalPaid)}</div>
                      </div>
                      <div style={{ padding: "12px 16px" }}>
                        {(rec.payments || []).map(sp => (
                          <div key={sp.recipientType} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                            <div style={{ minWidth: 180 }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{RECIPIENT_ICONS[sp.recipientType] || "💳"} {sp.recipientName}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              {sp.isOverridden && sp.finalAmount !== undefined ? (
                                <span>
                                  <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 12 }}>{fmt(sp.baseAmount ?? sp.amount)}</span>
                                  {" → "}
                                  <strong style={{ color: "#16a34a" }}>{fmt(sp.finalAmount)}</strong>
                                  {sp.overrideReason && <span style={{ fontSize: 11, color: "#f59e0b", marginLeft: 6 }}>({sp.overrideReason})</span>}
                                </span>
                              ) : (
                                <strong style={{ color: "#16a34a" }}>{fmt(sp.amount)}</strong>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {sp.method && <span style={{ background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>{sp.method}</span>}
                              {sp.paidAt && <span style={{ marginLeft: 6 }}>· {new Date(sp.paidAt).toLocaleDateString("en-IN")}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          TAB: INSIGHTS
      ══════════════════════════════════════════ */}
      {tab === "insights" && (
        <>
          {/* Profit margin per category */}
          <div className="earn-insights-grid">
            <div className="earn-insight">
              <div className="earn-insight-title">Revenue by Category</div>
              {REVENUE_TYPES.map((rt) => {
                const d = summary.byType[rt] || { revenue: 0 };
                const pct = maxByType > 0 ? (d.revenue / maxByType) * 100 : 0;
                return (
                  <div key={rt} className="earn-insight-bar">
                    <span className="earn-insight-bar-label">{TYPE_ICON[rt]} {rt.split(" ")[0]}</span>
                    <div className="earn-insight-bar-track">
                      <div className="earn-insight-bar-fill" style={{ width: pct + "%", background: `linear-gradient(90deg, ${PIE_COLORS[rt]}, ${PIE_COLORS[rt]}88)` }} />
                    </div>
                    <span className="earn-insight-bar-val">{fmt(d.revenue)}</span>
                  </div>
                );
              })}
            </div>

            <div className="earn-insight">
              <div className="earn-insight-title">Profit Margin by Category</div>
              {REVENUE_TYPES.map((rt) => {
                const d = summary.byType[rt] || { revenue: 0, profit: 0 };
                const margin = d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0;
                return (
                  <div key={rt} className="earn-insight-bar">
                    <span className="earn-insight-bar-label">{TYPE_ICON[rt]} {rt.split(" ")[0]}</span>
                    <div className="earn-insight-bar-track">
                      <div className="earn-insight-bar-fill" style={{
                        width: Math.max(0, Math.min(100, margin)) + "%",
                        background: margin >= 50 ? "linear-gradient(90deg,#22c55e,#86efac)" : margin >= 20 ? "linear-gradient(90deg,#f59e0b,#fcd34d)" : "linear-gradient(90deg,#ef4444,#fca5a5)"
                      }} />
                    </div>
                    <span className="earn-insight-bar-val">{margin.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>

            <div className="earn-insight">
              <div className="earn-insight-title">Best Earners (This Data)</div>
              {Object.entries(summary.byType)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .slice(0, 5)
                .map(([rt, d]) => (
                  <div key={rt} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: "#475569" }}>{TYPE_ICON[rt]} {rt}</span>
                    <strong style={{ color: "#1e293b" }}>{fmt(d.revenue)}</strong>
                  </div>
                ))
              }
              {Object.keys(summary.byType).length === 0 && <div style={{ color: "#94a3b8", fontSize: 12 }}>No data yet</div>}
            </div>

            <div className="earn-insight">
              <div className="earn-insight-title">Seasonal Analysis (Monthly Revenue)</div>
              <BarChart data={monthlyBar} color="#3b82f6" />
            </div>
          </div>
        </>
      )}

    </div>
  );
}
