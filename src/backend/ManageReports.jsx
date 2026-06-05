import React, { useEffect, useState, useMemo } from "react";
import { getAllBookings } from "../data/bookingStorage";
import { getAllTransactions } from "../data/transactionStorage";
import { getAllCustomers } from "../data/customerStorage";
import { getAllTrekPayments, hydrateTrekPaymentsFromBackend } from "../data/trekPaymentStorage";
import { getAllIncentives } from "../data/incentiveStorage";
import { getAllEarnings, computeProfit } from "../data/earningsStorage";
import {
  syncFromTrekPayments, advanceStage, setStage, updateTask,
  getMissingActions, STAGES, STAGE_LABELS, STAGE_COLORS,
} from "../data/trekEventStorage";

/* ══════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════ */
function fmt(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monthKey(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}
function last6Months() {
  const labels = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    labels.push({ label, key: label });
  }
  return labels;
}

function inRange(dateStr, fromDate, toDate) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (fromDate && d < new Date(fromDate)) return false;
  if (toDate   && d > new Date(toDate + "T23:59:59")) return false;
  return true;
}

function computeFinancials(bookings, payments, incentives, earnings, { fromDate, toDate, trek }) {
  const fb = bookings.filter(b => {
    if (b.status === "CANCELLED") return false;
    if (trek && b.trekName !== trek) return false;
    return inRange(b.savedAt || b.bookingDate || b.createdAt, fromDate, toDate);
  });
  const fp = payments.filter(p => {
    if (trek && p.trekName !== trek) return false;
    return inRange(p.eventDate || p.createdAt, fromDate, toDate);
  });
  const fi = incentives.filter(i => {
    if (trek && i.trekName !== trek) return false;
    return inRange(i.createdAt, fromDate, toDate);
  });
  // earningsStorage — legacy manual entries, no trek filter (apply date only)
  const fe = trek ? [] : earnings.filter(e => inRange(e.date || e.createdAt, fromDate, toDate));

  const revenue           = fb.reduce((s, b) => s + Number(b.pricePaid || 0), 0);
  const totalBookingValue = fb.reduce((s, b) => s + Number(b.totalPrice || b.price || 0), 0);
  const pendingCollection = totalBookingValue - revenue;
  const leaderFees        = fp.reduce((s, p) => s + Number(p.calculations?.leaderFee      || 0), 0);
  const foodCosts         = fp.reduce((s, p) => s + Number(p.calculations?.foodTotal       || 0), 0);
  const transportCosts    = fp.reduce((s, p) => s + Number(p.calculations?.transportTotal  || 0), 0);
  const entryCosts        = fp.reduce((s, p) => s + Number(p.calculations?.entryTotal      || 0), 0);
  const incentiveTotal    = fi.reduce((s, i) => s + Number(i.amount || 0), 0);

  // Legacy earnings (additional revenue + expenses from earningsStorage)
  const legacyRevenue  = fe.reduce((s, e) => s + (computeProfit(e).revenue   || 0), 0);
  const legacyExpenses = fe.reduce((s, e) => s + (computeProfit(e).expenses  || 0), 0);

  const totalRevenue      = revenue + legacyRevenue;
  const totalExpenses     = leaderFees + foodCosts + transportCosts + entryCosts + incentiveTotal + legacyExpenses;
  const gst               = Math.round(totalRevenue * 0.05);
  const netProfit         = totalRevenue - totalExpenses - gst;

  return {
    bookingCount: fb.length,
    revenue, totalBookingValue, pendingCollection,
    legacyRevenue, legacyExpenses,
    leaderFees, foodCosts, transportCosts, entryCosts, incentiveTotal,
    totalRevenue, totalExpenses, gst, netProfit,
  };
}

function computePerTrekBreakdown(bookings, payments, incentives, earnings, { fromDate, toDate }) {
  const fb = bookings.filter(b => b.status !== "CANCELLED" && inRange(b.savedAt || b.bookingDate || b.createdAt, fromDate, toDate));
  const fp = payments.filter(p => inRange(p.eventDate || p.createdAt, fromDate, toDate));
  const trekNames = [...new Set([...fb.map(b => b.trekName), ...fp.map(p => p.trekName)])].filter(Boolean).sort();
  return trekNames.map(trekName => ({
    trekName,
    ...computeFinancials(bookings, payments, incentives, earnings, { fromDate, toDate, trek: trekName }),
  }));
}

/* ══════════════════════════════════════════════
   SVG Chart Primitives
══════════════════════════════════════════════ */
function BarChart({ data, color = "#198754", height = 180 }) {
  if (!data?.length) return <p className="text-muted" style={{ fontSize: 12 }}>No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const padL = 30, padB = 28, padT = 20, padR = 10;
  const W = 400, H = height;
  const innerW = W - padL - padR, innerH = H - padB - padT;
  const bw = innerW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {[0,0.25,0.5,0.75,1].map(f => {
        const y = padT + innerH * (1 - f);
        return <g key={f}>
          <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#e2e8f0" strokeWidth="1"/>
          <text x={padL-4} y={y+4} textAnchor="end" fontSize="8" fill="#94a3b8">{Math.round(max*f)}</text>
        </g>;
      })}
      {data.map((d, i) => {
        const barH = (d.value/max)*innerH;
        const x = padL + i*bw + bw*0.15, y = padT + innerH - barH;
        return <g key={i}>
          <rect x={x} y={y} width={bw*0.7} height={barH} fill={color} rx="3" opacity="0.85"/>
          {d.value > 0 && <text x={x+bw*0.35} y={y-4} textAnchor="middle" fontSize="8" fill="#475569">{d.value}</text>}
          <text x={x+bw*0.35} y={H-8} textAnchor="middle" fontSize="8" fill="#64748b">{d.label}</text>
        </g>;
      })}
    </svg>
  );
}

function LineChart({ data, color = "#0891b2", height = 160 }) {
  if (!data?.length) return <p className="text-muted" style={{ fontSize: 12 }}>No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const padL = 30, padB = 28, padT = 20, padR = 10;
  const W = 400, H = height;
  const innerW = W - padL - padR, innerH = H - padB - padT;
  const step = innerW / Math.max(data.length - 1, 1);
  const pts = data.map((d, i) => `${padL+i*step},${padT+innerH-(d.value/max)*innerH}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }}>
      {[0,0.5,1].map(f => <line key={f} x1={padL} y1={padT+innerH*(1-f)} x2={W-padR} y2={padT+innerH*(1-f)} stroke="#e2e8f0" strokeWidth="1"/>)}
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
      {data.map((d, i) => {
        const cx = padL+i*step, cy = padT+innerH-(d.value/max)*innerH;
        return <g key={i}>
          <circle cx={cx} cy={cy} r="4" fill={color}/>
          {d.value > 0 && <text x={cx} y={cy-8} textAnchor="middle" fontSize="8" fill="#475569">{d.value}</text>}
          <text x={cx} y={H-8} textAnchor="middle" fontSize="8" fill="#64748b">{d.label}</text>
        </g>;
      })}
    </svg>
  );
}

function PieChart({ data }) {
  if (!data?.length || data.every(d => d.value === 0)) return <p className="text-muted" style={{ fontSize: 12 }}>No data</p>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 80, cy = 80, r = 65;
  const slices = data.reduce((state, d) => {
    if (!d.value) return state;
    const angle = (d.value / total) * 2 * Math.PI;
    return {
      cursor: state.cursor + angle,
      slices: [...state.slices, { ...d, start: state.cursor, angle }],
    };
  }, { cursor: -Math.PI / 2, slices: [] }).slices;
  return (
    <div className="adm-pie-wrap">
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {slices.map((d, i) => {
          const x1 = cx + r * Math.cos(d.start), y1 = cy + r * Math.sin(d.start);
          const end = d.start + d.angle;
          const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
          return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${d.angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`} fill={d.color}/>;
        })}
      </svg>
      <ul className="adm-pie-legend">
        {data.map((d, i) => (
          <li key={i}><span style={{ background: d.color }}></span>{d.label}: <strong>{d.value}</strong> ({Math.round((d.value/total)*100)}%)</li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════
   KPI Widget Card
══════════════════════════════════════════════ */
function KPICard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{
      background: bg || "#fff",
      border: `1px solid ${color}30`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      padding: "16px 18px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Trek Event Card (Lifecycle tab)
══════════════════════════════════════════════ */
function TrekEventCard({ event, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [advMsg, setAdvMsg] = useState("");
  const alerts = getMissingActions(event);

  const stageIdx = STAGES.indexOf(event.currentStage);
  const totalTasks = event.tasks.length;
  const doneTasks = event.tasks.filter(t => t.status === "DONE").length;
  const progressPct = Math.round((doneTasks / totalTasks) * 100);

  const handleAdvance = async () => {
    await advanceStage(event.eventId);
    setAdvMsg("Stage advanced!");
    setTimeout(() => setAdvMsg(""), 2000);
    onUpdate();
  };

  const handleSetStage = async (stage) => {
    await setStage(event.eventId, stage);
    onUpdate();
  };

  const handleToggleTask = async (taskKey, currentStatus) => {
    await updateTask(event.eventId, taskKey, { status: currentStatus === "DONE" ? "PENDING" : "DONE" });
    onUpdate();
  };

  const daysToTrek = event.trekDate
    ? Math.round((new Date(event.trekDate) - new Date()) / 86400000)
    : null;

  const isOverdue = daysToTrek !== null && daysToTrek < 0 && event.currentStage !== "COMPLETED" && event.currentStage !== "PAYMENTS_SETTLED";

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`,
      borderLeft: `4px solid ${isOverdue ? "#ef4444" : STAGE_COLORS[event.currentStage]}`,
      borderRadius: 12,
      marginBottom: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{event.trekName}</span>
            <span style={{
              background: STAGE_COLORS[event.currentStage] + "20",
              color: STAGE_COLORS[event.currentStage],
              padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            }}>{STAGE_LABELS[event.currentStage]}</span>
            {isOverdue && <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>⚠️ OVERDUE</span>}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            📅 {event.trekDate || "No date set"}
            {daysToTrek !== null && (
              <span style={{ marginLeft: 8, color: daysToTrek < 0 ? "#dc2626" : daysToTrek <= 7 ? "#d97706" : "#16a34a" }}>
                {daysToTrek < 0 ? `${Math.abs(daysToTrek)}d ago` : daysToTrek === 0 ? "Today!" : `in ${daysToTrek}d`}
              </span>
            )}
          </div>

          {/* Stage progress bar */}
          <div style={{ display: "flex", gap: 2, marginTop: 10, alignItems: "center" }}>
            {STAGES.map((s, i) => (
              <div key={s} style={{ flex: 1, position: "relative" }}>
                <div
                  title={STAGE_LABELS[s]}
                  onClick={() => handleSetStage(s)}
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: i <= stageIdx ? STAGE_COLORS[s] : "#e2e8f0",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                />
                {i === stageIdx && (
                  <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: STAGE_COLORS[s], border: "2px solid #fff", boxShadow: "0 0 0 2px " + STAGE_COLORS[s] }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
            {STAGE_LABELS[event.currentStage]} · Click stage bar to jump
          </div>

          {/* Task progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 2 }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: progressPct === 100 ? "#22c55e" : "#3b82f6", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{doneTasks}/{totalTasks} tasks</span>
          </div>

          {/* Missing action alerts */}
          {alerts.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {alerts.map((a, i) => (
                <span key={i} style={{
                  background: a.severity === "high" ? "#fee2e2" : "#fef3c7",
                  color: a.severity === "high" ? "#991b1b" : "#92400e",
                  padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                }}>⚠️ {a.msg}</span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {stageIdx < STAGES.length - 1 && (
            <button
              onClick={handleAdvance}
              style={{ background: STAGE_COLORS[STAGES[stageIdx + 1]], color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              → {STAGE_LABELS[STAGES[stageIdx + 1]]}
            </button>
          )}
          {stageIdx === STAGES.length - 1 && (
            <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>✅ All Done</span>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#475569" }}
          >
            {expanded ? "▲ Hide" : "▼ Tasks"}
          </button>
          {advMsg && <span style={{ fontSize: 11, color: "#22c55e" }}>{advMsg}</span>}
        </div>
      </div>

      {/* Expanded: task checklist */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Task Checklist</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 6 }}>
            {event.tasks.map(task => {
              const isDone = task.status === "DONE";
              return (
                <div key={task.taskKey} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: isDone ? "#f0fdf4" : "#fafafa",
                  border: `1px solid ${isDone ? "#bbf7d0" : "#e2e8f0"}`,
                  borderRadius: 8, padding: "8px 10px",
                }}>
                  <button
                    onClick={() => handleToggleTask(task.taskKey, task.status)}
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                      background: isDone ? "#22c55e" : "#fff",
                      border: `2px solid ${isDone ? "#22c55e" : "#d1d5db"}`,
                      color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >{isDone ? "✓" : ""}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isDone ? "#16a34a" : "#374151", textDecoration: isDone ? "line-through" : "none" }}>
                      {task.label}
                    </div>
                    {task.assignedTo && <div style={{ fontSize: 10, color: "#64748b" }}>👤 {task.assignedTo}</div>}
                    {task.completedAt && <div style={{ fontSize: 10, color: "#94a3b8" }}>✓ {new Date(task.completedAt).toLocaleDateString("en-IN")}</div>}
                  </div>
                  <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{task.requiredStage.replace("_", " ")}</span>
                </div>
              );
            })}
          </div>

          {/* Stage history */}
          {event.stageHistory?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Stage History</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {event.stageHistory.map((h, i) => (
                  <div key={i} style={{ background: STAGE_COLORS[h.stage] + "15", border: `1px solid ${STAGE_COLORS[h.stage]}40`, borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: STAGE_COLORS[h.stage] }}>{STAGE_LABELS[h.stage]}</span>
                    <span style={{ color: "#94a3b8", marginLeft: 4 }}>{new Date(h.changedAt).toLocaleDateString("en-IN")}</span>
                    {h.note && <span style={{ color: "#64748b", marginLeft: 4 }}>· {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export default function ManageReports() {
  const [tab,      setTab]      = useState("financial");
  const [tick,     setTick]     = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");
  const [filterTrek, setFilterTrek] = useState("");
  const [expandPerTrek, setExpandPerTrek] = useState(false);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    let active = true;
    hydrateTrekPaymentsFromBackend().then(() => {
      if (active) refresh();
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  /* ── Raw data ── */
  const bookings     = useMemo(() => getAllBookings(),      [tick]);
  const transactions = useMemo(() => getAllTransactions(),  [tick]);
  const customers    = useMemo(() => getAllCustomers(),     [tick]);
  const payments     = useMemo(() => getAllTrekPayments(),  [tick]);
  const incentives   = useMemo(() => getAllIncentives(),    [tick]);
  const earnings     = useMemo(() => getAllEarnings(),      [tick]);
  const trekEvents   = useMemo(() => syncFromTrekPayments(), [tick]);

  /* ── Trek name dropdown ── */
  const trekNames = useMemo(() => {
    const names = [...new Set([...bookings.map(b => b.trekName), ...payments.map(p => p.trekName)])].filter(Boolean);
    return names.sort();
  }, [bookings, payments]);

  /* ── Financial calculations ── */
  const filter   = { fromDate, toDate, trek: filterTrek };
  const totals   = useMemo(() => computeFinancials(bookings, payments, incentives, earnings, filter),            [bookings, payments, incentives, earnings, fromDate, toDate, filterTrek]);
  const perTrek  = useMemo(() => computePerTrekBreakdown(bookings, payments, incentives, earnings, { fromDate, toDate }), [bookings, payments, incentives, earnings, fromDate, toDate]);

  /* ── Chart data ── */
  const months = last6Months();
  const bookingTrend = (() => {
    const counts = {};
    bookings.forEach(b => { const k = monthKey(b.savedAt || b.bookingDate); counts[k] = (counts[k] || 0) + 1; });
    return months.map(m => ({ label: m.label, value: counts[m.key] || 0 }));
  })();

  const revenueTrend = (() => {
    const totals = {};
    transactions.filter(t => t.transactionStatus === "SUCCESS").forEach(t => {
      const k = monthKey(t.createdAt);
      totals[k] = (totals[k] || 0) + (t.grossAmount || 0);
    });
    return months.map(m => ({ label: m.label, value: totals[m.key] || 0 }));
  })();

  const customerGrowth = (() => {
    const counts = {};
    customers.forEach(c => { const k = monthKey(c.createdAt); counts[k] = (counts[k] || 0) + 1; });
    return months.map(m => ({ label: m.label, value: counts[m.key] || 0 }));
  })();

  const txnPie = [
    { label: "Success",  value: transactions.filter(t => t.transactionStatus === "SUCCESS").length,  color: "#22c55e" },
    { label: "Failed",   value: transactions.filter(t => t.transactionStatus === "FAILED").length,   color: "#ef4444" },
    { label: "Refunded", value: transactions.filter(t => t.transactionStatus === "REFUNDED").length, color: "#f59e0b" },
  ];

  const trekPopularity = useMemo(() => {
    const counts = {};
    bookings.forEach(b => { if (b.trekName) counts[b.trekName] = (counts[b.trekName] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,8).map(([label, value]) => ({ label: label.replace(" Trek","").replace(" Fort",""), value }));
  }, [bookings]);

  const paymentPie = useMemo(() => {
    const palette = ["#0891b2","#7c3aed","#f97316","#10b981","#ef4444"];
    const counts = {};
    transactions.forEach(t => { if (t.paymentMode) counts[t.paymentMode] = (counts[t.paymentMode] || 0) + 1; });
    return Object.entries(counts).map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));
  }, [transactions]);

  const clearFilters = () => { setFromDate(""); setToDate(""); setFilterTrek(""); };
  const hasFilter = fromDate || toDate || filterTrek;

  const profitColor = totals.netProfit >= 0 ? "#16a34a" : "#dc2626";
  const profitBg    = totals.netProfit >= 0 ? "#f0fdf4" : "#fef2f2";
  const profitIcon  = totals.netProfit >= 0 ? "📈" : "📉";
  return (
    <div className="adm-page">
      <h3 className="adm-page-title">📊 Reports & Analytics</h3>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e2e8f0", marginBottom: 24 }}>
        {[
          { id: "financial", icon: "💰", label: "Financial Summary" },
          { id: "lifecycle", icon: "🏔", label: "Trek Lifecycle", badge: trekEvents.filter(e => getMissingActions(e).length > 0).length || null },
          { id: "charts",    icon: "📊", label: "Analytics Charts" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            border: "none",
            borderBottom: `3px solid ${tab === t.id ? "#22c55e" : "transparent"}`,
            background: "none",
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? "#16a34a" : "#64748b",
            cursor: "pointer",
            position: "relative",
          }}>
            {t.icon} {t.label}
            {t.badge ? <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, fontSize: 9, padding: "1px 5px", marginLeft: 4, fontWeight: 700 }}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TAB: FINANCIAL SUMMARY
      ══════════════════════════════════ */}
      {tab === "financial" && (
        <div>
          {/* Filter bar */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-control form-control-sm" style={{ width: 148 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-control form-control-sm" style={{ width: 148 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Trek</label>
              <select value={filterTrek} onChange={e => setFilterTrek(e.target.value)} className="form-select form-select-sm" style={{ width: 200 }}>
                <option value="">— All Treks —</option>
                {trekNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {hasFilter && (
              <button onClick={clearFilters} className="btn btn-outline-secondary btn-sm" style={{ alignSelf: "flex-end" }}>
                ✕ Clear Filters
              </button>
            )}
            {hasFilter && (
              <span style={{ fontSize: 12, color: "#3b82f6", alignSelf: "flex-end", fontWeight: 600 }}>
                🔍 Filtered: {totals.bookingCount} bookings
              </span>
            )}
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 24 }}>
            <KPICard icon="💰" label="Total Revenue" value={fmt(totals.totalRevenue)} sub={`${totals.bookingCount} bookings${totals.legacyRevenue > 0 ? ` + ₹${totals.legacyRevenue.toLocaleString("en-IN")} other` : ""}`} color="#16a34a" />
            <KPICard icon="⏳" label="Pending Collection" value={fmt(totals.pendingCollection)} sub="Not yet collected" color="#d97706" />
            <KPICard icon="💸" label="Total Expenses" value={fmt(totals.totalExpenses)} sub="Leader + Food + Transport + Entry + Incentives" color="#dc2626" />
            <KPICard icon="🧾" label="GST (5%)" value={fmt(totals.gst)} sub="On collected revenue" color="#7c3aed" />
            <KPICard icon={profitIcon} label={totals.netProfit >= 0 ? "Net Profit" : "Net Loss"} value={fmt(Math.abs(totals.netProfit))} sub="Revenue − Expenses − GST" color={profitColor} bg={profitBg} />
          </div>

          {/* Expense breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Expense table */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                💸 Expense Breakdown
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {[
                    { icon: "👤", label: "Trek Leader Fees",    value: totals.leaderFees     },
                    { icon: "🍱", label: "Food Vendor Costs",   value: totals.foodCosts      },
                    { icon: "🚌", label: "Transport Costs",     value: totals.transportCosts },
                    { icon: "🎟", label: "Entry Fees",          value: totals.entryCosts     },
                    { icon: "🔗", label: "Referral Incentives", value: totals.incentiveTotal },
                    ...(totals.legacyExpenses > 0 ? [{ icon: "📋", label: "Other Earnings Expenses", value: totals.legacyExpenses }] : []),
                  ].map(row => (
                    <tr key={row.label} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 16px", color: "#64748b" }}>{row.icon} {row.label}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: row.value > 0 ? "#dc2626" : "#94a3b8" }}>
                        {fmt(row.value)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#fef2f2", fontWeight: 700, borderTop: "2px solid #fee2e2" }}>
                    <td style={{ padding: "12px 16px", color: "#991b1b" }}>TOTAL EXPENSES</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#dc2626", fontSize: 15 }}>{fmt(totals.totalExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* P&L summary */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                📋 P&L Summary
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 16px", color: "#64748b" }}>Total Booking Value</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>{fmt(totals.totalBookingValue)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 16px", color: "#16a34a", fontWeight: 600 }}>✅ Revenue Collected</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>{fmt(totals.totalRevenue)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 16px", color: "#d97706" }}>⏳ Pending Collection</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", color: "#d97706", fontWeight: 600 }}>{fmt(totals.pendingCollection)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 16px", color: "#dc2626" }}>💸 Total Expenses</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>− {fmt(totals.totalExpenses)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 16px", color: "#7c3aed" }}>🧾 GST (5%)</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", color: "#7c3aed", fontWeight: 600 }}>− {fmt(totals.gst)}</td>
                  </tr>
                  <tr style={{ background: totals.netProfit >= 0 ? "#f0fdf4" : "#fef2f2", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px", color: profitColor, fontSize: 14 }}>{profitIcon} Net {totals.netProfit >= 0 ? "Profit" : "Loss"}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: profitColor, fontSize: 16 }}>{fmt(Math.abs(totals.netProfit))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Trek breakdown table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>🥾 Per-Trek P&L Breakdown ({perTrek.length} treks)</span>
              <button onClick={() => setExpandPerTrek(v => !v)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#475569" }}>
                {expandPerTrek ? "▲ Collapse" : "▼ Expand"}
              </button>
            </div>
            {expandPerTrek && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Trek Name", "Bookings", "Revenue", "Expenses", "GST", "Net P&L", "Status"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: h === "Trek Name" ? "left" : "right", fontSize: 11, color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perTrek.map(row => (
                      <tr key={row.trekName} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1e293b" }}>{row.trekName}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>{row.bookingCount}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>{fmt(row.revenue)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#dc2626" }}>{fmt(row.totalExpenses)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#7c3aed" }}>{fmt(row.gst)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: row.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                          {row.netProfit >= 0 ? "+" : ""}{fmt(row.netProfit)}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <span style={{
                            background: row.netProfit >= 0 ? "#dcfce7" : "#fee2e2",
                            color: row.netProfit >= 0 ? "#166534" : "#991b1b",
                            padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700
                          }}>
                            {row.netProfit >= 0 ? "✅ Profit" : "❌ Loss"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {perTrek.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No data for selected filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!expandPerTrek && (
              <div style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>
                Click "Expand" to see per-trek profit/loss breakdown ({perTrek.length} treks available)
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          TAB: TREK LIFECYCLE
      ══════════════════════════════════ */}
      {tab === "lifecycle" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Trek Event Lifecycle</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {trekEvents.length} events synced · {trekEvents.filter(e => e.currentStage !== "PAYMENTS_SETTLED").length} active ·
                <span style={{ color: "#ef4444" }}> {trekEvents.filter(e => getMissingActions(e).some(a => a.severity === "high")).length} need attention</span>
              </div>
            </div>
            <button onClick={refresh} className="btn btn-outline-success btn-sm">🔄 Sync Events</button>
          </div>

          {/* Stage legend */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {STAGES.map(s => (
              <span key={s} style={{ background: STAGE_COLORS[s] + "20", color: STAGE_COLORS[s], padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: `1px solid ${STAGE_COLORS[s]}40` }}>
                {STAGE_LABELS[s]}
              </span>
            ))}
          </div>

          {trekEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏔</div>
              <div>No trek events yet. Initiate a trek payment to create lifecycle records.</div>
            </div>
          ) : (
            trekEvents
              .sort((a, b) => {
                const da = a.trekDate || "9999", db = b.trekDate || "9999";
                return da.localeCompare(db);
              })
              .map(event => (
                <TrekEventCard key={event.eventId} event={event} onUpdate={refresh} />
              ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          TAB: ANALYTICS CHARTS
      ══════════════════════════════════ */}
      {tab === "charts" && (
        <div>
          <div className="adm-kpi-row mb-4">
            <div className="adm-kpi"><span>{bookings.length}</span><small>Total Bookings</small></div>
            <div className="adm-kpi"><span>{bookings.filter(b => (b.bookingStatus||"CONFIRMED") === "CONFIRMED").length}</span><small>Confirmed</small></div>
            <div className="adm-kpi"><span>{customers.length}</span><small>Customers</small></div>
            <div className="adm-kpi"><span>₹{transactions.filter(t => t.transactionStatus === "SUCCESS").reduce((s, t) => s + (t.grossAmount||0), 0).toLocaleString("en-IN")}</span><small>Revenue</small></div>
            <div className="adm-kpi"><span>{transactions.length}</span><small>Transactions</small></div>
          </div>

          <div className="adm-reports-grid">
            <div className="adm-report-card">
              <h6 className="adm-report-title">📅 Booking Trends (Last 6 Months)</h6>
              <BarChart data={bookingTrend} color="#198754" />
            </div>
            <div className="adm-report-card">
              <h6 className="adm-report-title">💰 Revenue Analytics (Last 6 Months, ₹)</h6>
              <BarChart data={revenueTrend} color="#0891b2" />
            </div>
            <div className="adm-report-card">
              <h6 className="adm-report-title">👥 Customer Growth (Last 6 Months)</h6>
              <LineChart data={customerGrowth} color="#7c3aed" />
            </div>
            <div className="adm-report-card">
              <h6 className="adm-report-title">💳 Transaction Status Breakdown</h6>
              <PieChart data={txnPie} />
            </div>
            <div className="adm-report-card">
              <h6 className="adm-report-title">🥾 Trek Popularity (by Bookings)</h6>
              <BarChart data={trekPopularity} color="#f97316" height={160} />
            </div>
            <div className="adm-report-card">
              <h6 className="adm-report-title">💳 Payment Modes</h6>
              <PieChart data={paymentPie} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
