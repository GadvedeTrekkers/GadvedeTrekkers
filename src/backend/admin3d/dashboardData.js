/* Pure data helpers for the 3D dashboard widgets (no React, no three.js). */
import { getAdminItems } from "../../data/adminStorage";
import { getAllTrekDates } from "../../data/trekDatesStorage";
import { getAllTourDates } from "../../data/tourDatesStorage";
import { resolveTripGallery, coverUrlForTrip } from "../../utils/tripDisplay";

export const CHART_COLORS = ["#198754", "#0d6efd", "#f97316", "#7c3aed", "#0891b2", "#dc2626", "#ca8a04", "#db2777"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isLive = (b) => String(b?.bookingStatus || b?.status || "").toUpperCase() !== "CANCELLED";
export const amountOf = (b) => Number(b?.totalAmount ?? b?.pricePaid ?? b?.payableNow ?? 0) || 0;
export const seatsOf = (b) => {
  const t = Number(b?.tickets);
  if (Number.isFinite(t) && t > 0) return t;
  return 1 + (Array.isArray(b?.additionalTravelers) ? b.additionalTravelers.length : 0);
};
const dayKey = (value) => {
  const d = new Date(value || "");
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const norm = (s) => String(s || "").trim().toLowerCase();

/** Bookings or revenue for the last `months` months (oldest → newest). */
export function seriesByMonth(bookings, metric = "bookings", months = 6, now = new Date()) {
  const rows = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], value: 0, color: i === months - 1 ? "#198754" : "#0d6efd" };
  });
  bookings.filter(isLive).forEach((b) => {
    const d = new Date(b.bookingDate || b.savedAt || b.createdAt || "");
    if (Number.isNaN(d.getTime())) return;
    const row = rows.find((r) => r.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (row) row.value += metric === "revenue" ? amountOf(b) : 1;
  });
  return rows.some((r) => r.value) ? rows : [];
}

/** Bookings or revenue per trip (top `limit`). */
export function seriesByTrip(bookings, metric = "bookings", limit = 6) {
  const map = new Map();
  bookings.filter(isLive).forEach((b) => {
    const k = b.trekName || "Other";
    map.set(k, (map.get(k) || 0) + (metric === "revenue" ? amountOf(b) : 1));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([label, value], i) => ({ key: label, label, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
}

function findListing(name, slug) {
  const n = norm(name), s = norm(slug);
  for (const key of ["gt_treks", "gt_tours", "gt_camping", "gt_heritage", "gt_rentals"]) {
    const hit = getAdminItems(key).find((it) => (s && norm(it.slug) === s) || (n && norm(it.name || it.title) === n));
    if (hit) return hit;
  }
  return null;
}

/**
 * Upcoming batches = scheduled trek/tour dates + upcoming trek events + future booking travel dates,
 * one card per trip+date, with seats booked and booking total from the loaded bookings.
 */
export function upcomingBatches(bookings, trekEvents = [], limit = 8, today = new Date()) {
  const start = dayKey(today);
  const map = new Map();
  const add = (name, slug, date) => {
    const day = dayKey(date);
    if (!name || !day || day < start) return;
    const key = `${norm(name)}|${day}`;
    if (!map.has(key)) map.set(key, { key, name, slug, date: day });
  };
  getAllTrekDates().forEach((d) => add(d.trekName, d.trekSlug, d.date));
  getAllTourDates().forEach((d) => add(d.tourName, d.tourSlug, d.date));
  trekEvents.forEach((e) => add(e.trekName, e.trekSlug, e.trekDate));
  bookings.filter(isLive).forEach((b) => add(b.trekName, "", b.travelDate));

  const live = bookings.filter(isLive);
  return [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((batch) => {
      const matches = live.filter((b) => norm(b.trekName) === norm(batch.name) && dayKey(b.travelDate) === batch.date);
      const listing = findListing(batch.name, batch.slug);
      const cover = listing ? (resolveTripGallery(listing)[0] || coverUrlForTrip(listing)) : "";
      const days = Math.round((new Date(`${batch.date}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000);
      return {
        ...batch,
        cover,
        price: Number(listing?.price) || 0,
        seats: matches.reduce((s, b) => s + seatsOf(b), 0),
        bookings: matches.length,
        total: matches.reduce((s, b) => s + amountOf(b), 0),
        days,
      };
    });
}
