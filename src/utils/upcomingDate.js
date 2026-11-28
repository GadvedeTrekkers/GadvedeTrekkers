/* Helpers so the public site never shows a "next" date that is already in the past (FIX-09).
   Labels come from admin text fields and the API: "2026-12-05", "20 Sept 2025", "25 Mar 2026, 4:00 PM".
   A label we cannot read (for example "25 Mar, 4:00 PM" with no year, or "On request") is kept as-is:
   hiding a date we cannot judge would be worse than showing it. */

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function startOfDay(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Date for a label, or null when it has no year / cannot be read. Time of day is ignored. */
export function parseLabelDate(label) {
  if (label == null) return null;
  const text = String(label).trim();
  if (!text) return null;
  let m = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // "20 Sept 2025", "5 March, 2026", "20-22 Sept 2025" (the first day counts), "Sat, 5 Dec 2026"
  m = text.match(/(\d{1,2})(?:\s*(?:-|–|to)\s*\d{1,2})?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/);
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return new Date(Number(m[3]), month, Number(m[1]));
  }
  // "Dec 5, 2026"
  m = text.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) {
    const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) return new Date(Number(m[3]), month, Number(m[2]));
  }
  return null;
}

/** True only when the label is readable and its day is before today. Today is not past. */
export function isPastDateLabel(label, now = new Date()) {
  const d = parseLabelDate(label);
  return d ? d < startOfDay(now) : false;
}

/** The label if it is still upcoming (or unreadable), else "". */
export function upcomingLabel(label, now = new Date()) {
  if (label == null || String(label).trim() === "") return "";
  return isPastDateLabel(label, now) ? "" : String(label);
}

/** Keep only upcoming (or unreadable) labels. */
export function upcomingLabels(labels, now = new Date()) {
  return (Array.isArray(labels) ? labels : []).filter((l) => !isPastDateLabel(l, now));
}
