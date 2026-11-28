/**
 * Admin Reports: pure aggregation (no I/O, no writes).
 *
 * Inputs are plain row arrays (bookings, enquiries, products) read elsewhere; the output is plain JSON with
 * masked personal data only. Everything here is deterministic so it can be unit tested.
 *
 * Definitions (also shown on the Reports page):
 *  - Dates are IST calendar days. Revenue is bucketed by the booking date (bookings.transaction_at), enquiries by created_at.
 *  - CANCELLED bookings and FAILED payments are left out of revenue; they are only counted.
 *  - Booked value = total_amount. Collected = total_amount - remaining_amount. Pending = the balance still to be paid.
 *    Bookings that are PENDING_APPROVAL or UNPAID count fully as pending until someone verifies the payment.
 *  - Enquiry converted = status CONVERTED, or it points at a booking (booked_booking_id), or the same mobile number /
 *    email made a booking on or after the enquiry date.
 *  - Customer identity = last 10 digits of the mobile number, else the email, else the customer id.
 *    A repeat customer has 2 or more bookings in the selected range.
 */
import { normEmail, phone10 } from "../../../../shared/crmAutomations.js";
import { maskEmail, maskFullName, maskPhone } from "../../mcp/pii.js";

export const SOURCE_KEYS = ["instagram", "whatsapp", "google", "website", "referral_other", "unknown"];
export const SOURCE_LABELS = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  google: "Google / organic",
  website: "Website form",
  referral_other: "Referral / other",
  unknown: "Unknown",
};
const NOT_LINKED = "Not linked to a trip";
const IST_OFFSET_MS = 330 * 60 * 1000;
export const TOP_REPEAT_LIMIT = 25;

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const money = (v) => Math.round(num(v) * 100) / 100;
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isoDay = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : null);

/** ISO timestamp (or date) -> IST "YYYY-MM-DD", "" when it is not a date. */
export function istDay(v) {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return "";
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/* ───────────── bookings ───────────── */

export function bookingMoney(b) {
  const status = String(b.status || "").toUpperCase();
  const pay = String(b.payment_status || "").toUpperCase();
  if (status === "CANCELLED") return { counted: false, reason: "cancelled", booked: 0, collected: 0, pending: 0 };
  if (pay === "FAILED") return { counted: false, reason: "failed", booked: 0, collected: 0, pending: 0 };
  const total = Math.max(0, num(b.total_amount));
  const awaiting = status === "PENDING_APPROVAL" || pay === "UNPAID";
  const collected = awaiting ? 0 : Math.min(total, Math.max(0, total - num(b.remaining_amount)));
  return { counted: true, reason: null, booked: total, collected, pending: total - collected };
}

function bookingKey(b) {
  const p = phone10(b.lead_phone) || phone10(b.lead_whatsapp);
  if (p) return `p:${p}`;
  const e = normEmail(b.lead_email);
  if (e) return `e:${e}`;
  if (b.customer_id) return `c:${b.customer_id}`;
  return "";
}

/* ───────────── enquiries ───────────── */

function urlParams(raw) {
  try {
    const u = new URL(String(raw || ""), "https://www.gadvede.com");
    return u.searchParams;
  } catch { return new URLSearchParams(); }
}

/** Where an enquiry came from. `source` is enquiries.source (migration 021); the page link is read for UTM / click ids. */
export function classifySource(e) {
  const src = String(e.source ?? "").trim().toLowerCase();
  if (src === "instagram_dm") return "instagram";
  if (src === "whatsapp") return "whatsapp";
  const q = urlParams(e.page_url);
  const utm = String(q.get("utm_source") || "").toLowerCase();
  const medium = String(q.get("utm_medium") || "").toLowerCase();
  if (/instagram|^ig$/.test(utm)) return "instagram";
  if (/whatsapp/.test(utm)) return "whatsapp";
  if (/google/.test(utm) || q.get("gclid") || medium === "organic") return "google";
  if (utm || q.get("fbclid") || q.get("ref") || medium === "referral") return "referral_other";
  const tags = Array.isArray(e.tags) ? e.tags.map((t) => String(t).toLowerCase()) : [];
  if (tags.some((t) => t.includes("referral") || t.includes("refer"))) return "referral_other";
  if (src === "website") return "website";
  return "unknown";
}

function resolveTrip(name, products) {
  const n = norm(name);
  if (!n) return null;
  let hit = products.find((p) => norm(p.name) === n);
  if (!hit && n.length >= 4) hit = products.find((p) => { const pn = norm(p.name); return pn.length >= 4 && (pn.includes(n) || n.includes(pn)); });
  return hit || null;
}

function enquiryTrip(e, products) {
  const byName = resolveTrip(e.event_name, products) || resolveTrip(e.booked_event_name, products);
  if (byName) return byName;
  const url = String(e.page_url || "").toLowerCase();
  if (url) return products.find((p) => p.slug && url.includes(`/${String(p.slug).toLowerCase()}`)) || null;
  return null;
}

/* ───────────── main ───────────── */

function monthsBetween(fromMonth, toMonth) {
  const out = [];
  let [y, m] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < 120) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

/**
 * @param {{bookings:object[], enquiries:object[], products:object[]}} data
 *   bookings: all non-deleted bookings from the range start onwards (later bookings are needed to see conversions).
 * @param {{from?:string, to?:string, trip?:string}} opts   trip = product id
 */
export function buildReports({ bookings = [], enquiries = [], products = [] } = {}, { from, to, trip } = {}) {
  const f = isoDay(from); const t = isoDay(to);
  const inRange = (day) => Boolean(day) && (!f || day >= f) && (!t || day <= t);
  const productById = new Map(products.map((p) => [String(p.id), p]));
  const tripId = trip && productById.has(String(trip)) ? String(trip) : null;

  // ---- bookings, with their money, for matching (all) and reporting (in range + trip filter)
  const all = bookings.map((b) => ({ b, day: istDay(b.transaction_at || b.created_at), m: bookingMoney(b), key: bookingKey(b) }));
  const live = all.filter((x) => x.m.counted);
  const inScope = (x) => inRange(x.day) && (!tripId || String(x.b.product_id) === tripId);
  const scoped = all.filter(inScope);
  const counted = scoped.filter((x) => x.m.counted);

  // ---- 1. revenue per trip and per month
  const tripRows = new Map();
  const monthRows = new Map();
  const blank = () => ({ bookings: 0, pax: 0, booked: 0, collected: 0, pending: 0 });
  const add = (row, x) => {
    row.bookings += 1; row.pax += Math.max(0, num(x.b.ticket_quantity));
    row.booked += x.m.booked; row.collected += x.m.collected; row.pending += x.m.pending;
  };
  for (const x of counted) {
    const p = productById.get(String(x.b.product_id));
    const k = p ? String(p.id) : "none";
    if (!tripRows.has(k)) tripRows.set(k, { tripId: p ? String(p.id) : null, name: p?.name || NOT_LINKED, type: p?.product_type || null, ...blank() });
    add(tripRows.get(k), x);
    const mk = x.day.slice(0, 7);
    if (!monthRows.has(mk)) monthRows.set(mk, { month: mk, ...blank() });
    add(monthRows.get(mk), x);
  }
  const round = (r) => ({ ...r, booked: money(r.booked), collected: money(r.collected), pending: money(r.pending) });
  const total = counted.reduce((s, x) => ({ bookings: s.bookings + 1, pax: s.pax + Math.max(0, num(x.b.ticket_quantity)), booked: s.booked + x.m.booked, collected: s.collected + x.m.collected, pending: s.pending + x.m.pending }), blank());
  const byTrip = [...tripRows.values()].sort((a, b) => b.booked - a.booked || a.name.localeCompare(b.name)).map((r) => ({ ...round(r), share: pct(r.booked, total.booked) }));
  let monthKeys = [...monthRows.keys()].sort();
  if (monthKeys.length) monthKeys = monthsBetween(monthKeys[0], monthKeys[monthKeys.length - 1]);
  const byMonth = monthKeys.map((k) => round(monthRows.get(k) || { month: k, ...blank() }));
  const revenue = {
    totals: { ...round(total), cancelled: scoped.filter((x) => x.m.reason === "cancelled").length, failed: scoped.filter((x) => x.m.reason === "failed").length },
    byTrip, byMonth,
  };

  // ---- enquiries in scope, with conversion matching
  const byRef = new Map();
  for (const x of live) for (const ref of [x.b.id, x.b.booking_code, x.b.legacy_booking_id]) if (ref) byRef.set(String(ref), x);
  const byPhone = new Map(); const byEmail = new Map();
  for (const x of live) {
    for (const p of [phone10(x.b.lead_phone), phone10(x.b.lead_whatsapp)]) if (p) { if (!byPhone.has(p)) byPhone.set(p, []); byPhone.get(p).push(x); }
    const e = normEmail(x.b.lead_email); if (e) { if (!byEmail.has(e)) byEmail.set(e, []); byEmail.get(e).push(x); }
  }
  const attributed = new Set();
  const enq = [];
  for (const e of enquiries) {
    const day = istDay(e.created_at);
    if (!inRange(day)) continue;
    let p = enquiryTrip(e, products);
    const linked = e.booked_booking_id ? byRef.get(String(e.booked_booking_id)) : null;
    const candidates = [...(byPhone.get(phone10(e.phone)) || []), ...(byEmail.get(normEmail(e.email)) || [])]
      .filter((x) => !x.day || x.day >= day).sort((a, c) => String(a.b.transaction_at).localeCompare(String(c.b.transaction_at)));
    const matched = linked || candidates[0] || null;
    const status = String(e.status || "").toUpperCase();
    const converted = status === "CONVERTED" || Boolean(e.booked_booking_id) || Boolean(matched);
    if (!p && matched) p = productById.get(String(matched.b.product_id)) || null;
    if (tripId && String(p?.id) !== tripId) continue;
    let value = 0;
    if (matched && !attributed.has(matched.b.id)) { attributed.add(matched.b.id); value = matched.m.booked; }
    enq.push({ source: classifySource(e), trip: p, converted, value });
  }
  const rate = (rows) => ({ enquiries: rows.length, converted: rows.filter((r) => r.converted).length, rate: pct(rows.filter((r) => r.converted).length, rows.length) });

  // ---- 2. conversion overall + per trip
  const tripConv = new Map();
  for (const r of enq) {
    const k = r.trip ? String(r.trip.id) : "none";
    if (!tripConv.has(k)) tripConv.set(k, { tripId: r.trip ? String(r.trip.id) : null, name: r.trip?.name || NOT_LINKED, rows: [] });
    tripConv.get(k).rows.push(r);
  }
  const conversion = {
    overall: rate(enq),
    byTrip: [...tripConv.values()].map((g) => ({ tripId: g.tripId, name: g.name, ...rate(g.rows) }))
      .sort((a, b) => b.enquiries - a.enquiries || a.name.localeCompare(b.name)),
  };

  // ---- 3. lead sources
  const sourceRows = SOURCE_KEYS.map((key) => {
    const rows = enq.filter((r) => r.source === key);
    return { key, label: SOURCE_LABELS[key], ...rate(rows), share: pct(rows.length, enq.length), bookedValue: money(rows.reduce((s, r) => s + r.value, 0)) };
  });
  const sources = {
    total: enq.length,
    bySource: sourceRows,
    unknownShare: pct(sourceRows.find((s) => s.key === "unknown").enquiries, enq.length),
    bookingsWithoutEnquiry: counted.filter((x) => !attributed.has(x.b.id)).length,
  };

  // ---- 4. repeat customers
  const people = new Map();
  for (const x of counted) {
    if (!x.key) continue;
    if (!people.has(x.key)) people.set(x.key, { rows: [], phone: "", email: "", name: "" });
    const g = people.get(x.key);
    g.rows.push(x);
    g.phone = g.phone || x.b.lead_phone || x.b.lead_whatsapp || "";
    g.email = g.email || normEmail(x.b.lead_email) || "";
    g.name = g.name || [x.b.lead_first_name, x.b.lead_last_name].filter((v) => v && v !== "Unknown").join(" ");
  }
  const repeaters = [...people.values()].filter((g) => g.rows.length >= 2);
  const repeatBooked = repeaters.reduce((s, g) => s + g.rows.reduce((a, x) => a + x.m.booked, 0), 0);
  const repeatBookings = repeaters.reduce((s, g) => s + g.rows.length, 0);
  const repeat = {
    uniqueCustomers: people.size,
    repeatCustomers: repeaters.length,
    repeatRate: pct(repeaters.length, people.size),
    repeatBookings,
    repeatBookedValue: money(repeatBooked),
    revenueShare: pct(repeatBooked, total.booked),
    avgBookingsPerRepeat: repeaters.length ? Math.round((repeatBookings / repeaters.length) * 10) / 10 : 0,
    piiMasked: true,
    top: repeaters.map((g) => {
      const days = g.rows.map((x) => x.day).filter(Boolean).sort();
      const booked = g.rows.reduce((s, x) => s + x.m.booked, 0);
      return {
        name: maskFullName(g.name) || "Customer",
        phone: g.phone ? maskPhone(g.phone) : null,
        email: g.email ? maskEmail(g.email) : null,
        bookings: g.rows.length,
        trips: new Set(g.rows.map((x) => String(x.b.product_id || ""))).size,
        bookedValue: money(booked),
        share: pct(booked, total.booked),
        firstBooking: days[0] || null,
        lastBooking: days[days.length - 1] || null,
      };
    }).sort((a, b) => b.bookings - a.bookings || b.bookedValue - a.bookedValue).slice(0, TOP_REPEAT_LIMIT),
  };

  // ---- 5. KPIs
  const topTrip = byTrip.find((r) => r.tripId) || null;
  const topSource = [...sourceRows].filter((s) => s.key !== "unknown").sort((a, b) => b.enquiries - a.enquiries)[0];
  const kpis = {
    bookedValue: revenue.totals.booked,
    collected: revenue.totals.collected,
    pending: revenue.totals.pending,
    bookings: revenue.totals.bookings,
    travellers: revenue.totals.pax,
    avgBookingValue: revenue.totals.bookings ? money(revenue.totals.booked / revenue.totals.bookings) : 0,
    enquiries: conversion.overall.enquiries,
    conversionRate: conversion.overall.rate,
    repeatRate: repeat.repeatRate,
    repeatRevenueShare: repeat.revenueShare,
    topTrip: topTrip ? { name: topTrip.name, booked: topTrip.booked } : null,
    topSource: topSource && topSource.enquiries ? { key: topSource.key, label: topSource.label, enquiries: topSource.enquiries } : null,
  };

  return { range: { from: f, to: t, trip: tripId }, kpis, revenue, conversion, sources, repeat };
}

/** Trip filter options: id, name, type. */
export function tripOptions(products = []) {
  return products.map((p) => ({ id: String(p.id), name: p.name, type: p.product_type || null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
