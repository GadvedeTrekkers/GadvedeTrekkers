/* Display helpers for the Reports insights page (no React, no I/O) so they can be unit tested. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = 330 * 60 * 1000;

/** Roles the server allows (keep in step with backend/src/routes/reports.routes.js). */
export function canViewReportInsights(role) {
  const k = String(role ?? "").toLowerCase().replace(/[\s_-]/g, "");
  return k === "superadmin" || k === "admin" || k === "management";
}

export function fmtINR(n) {
  return "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
}

/** ₹1,23,456 → ₹1.23L ; ₹12,34,56,789 → ₹12.35Cr ; small amounts stay whole. */
export function fmtCompactINR(n) {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const trim = (x) => String(Math.round(x * 100) / 100);
  if (a >= 1e7) return `${sign}₹${trim(a / 1e7)}Cr`;
  if (a >= 1e5) return `${sign}₹${trim(a / 1e5)}L`;
  if (a >= 1e3) return `${sign}₹${trim(a / 1e3)}k`;
  return `${sign}₹${Math.round(a)}`;
}

export function fmtPct(n) {
  const v = Number(n) || 0;
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}

export function monthLabel(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  if (!m) return String(key || "");
  return `${MONTHS[Number(m[2]) - 1] || m[2]} ${m[1].slice(2)}`;
}

export function dayLabel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1].slice(2)}`;
}

/** Today in IST as YYYY-MM-DD. */
export function istToday(now = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(day, delta) {
  const t = Date.parse(`${day}T00:00:00Z`) + delta * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

export const PRESETS = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "all", label: "All time" },
];

export function presetRange(id, now = new Date()) {
  const today = istToday(now);
  if (id === "30d") return { from: addDays(today, -29), to: today };
  if (id === "90d") return { from: addDays(today, -89), to: today };
  if (id === "12m") {
    const [y, m, d] = today.split("-").map(Number);
    const from = new Date(Date.UTC(y - 1, m - 1, d + 1)).toISOString().slice(0, 10);
    return { from, to: today };
  }
  return { from: "", to: "" };
}

export function rangeProblem({ from, to }) {
  if (from && to && from > to) return "The start date must be on or before the end date.";
  return "";
}

/** Width in percent for a bar (0 when there is nothing to show, at least `min` when there is). */
export function barPct(value, max, min = 2) {
  const v = Number(value) || 0;
  const m = Number(max) || 0;
  if (v <= 0 || m <= 0) return 0;
  return Math.min(100, Math.max(min, (v / m) * 100));
}

export const SOURCE_COLORS = {
  instagram: "#c13584",
  whatsapp: "#25a244",
  google: "#3b82f6",
  website: "#0f766e",
  referral_other: "#f59e0b",
  unknown: "#94a3b8",
};

/** Nice round upper bound for a chart axis. */
export function niceMax(v) {
  const x = Number(v) || 0;
  if (x <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const f = x / p;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return step * p;
}

/** Query string for the report endpoints; only values that are set are sent. */
export function reportsQuery({ from, to, trip } = {}) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (trip) q.set("trip", trip);
  const s = q.toString();
  return s ? `?${s}` : "";
}
