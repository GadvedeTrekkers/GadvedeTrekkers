import { apiRequest } from "../api/backendClient";

/* ─────────────────────────────────────────────────────────────
   Booking Storage Service
   - Generates human-readable GT-YYYY-XXXXXX IDs
   - Persists ALL bookings (not just latestBooking)
   - Backward-compatible: existing latestBooking key is untouched
   - bookingStatus: 'CONFIRMED' | 'CANCELLED'  (additive field)
───────────────────────────────────────────────────────────── */

const COUNTER_KEY  = "gt_booking_counter";
/* Booking records are never written to localStorage. A visitor's own bookings
   from this tab are kept in sessionStorage (for the ticket page); the admin
   panel loads the real list from GET /api/bookings via hydrateBookings(). */
const OWN_KEY      = "gt_my_bookings";

function _readOwn() {
  try { return JSON.parse(sessionStorage.getItem(OWN_KEY) || "[]"); } catch { return []; }
}

let _bookings = _readOwn();
let _ownIds   = new Set(_bookings.map((b) => b.bookingId));

/* ── ID generation ───────────────────────────────────────────
   Format: GT-2026-000001  (sequential, zero-padded to 6 digits)
─────────────────────────────────────────────────────────── */
function _nextCounter() {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return next;
}

export function generateBookingId() {
  const year = new Date().getFullYear();
  const seq  = String(_nextCounter()).padStart(6, "0");
  return `GT-${year}-${seq}`;
}

/* ── raw helpers ── */
export function getAllBookings() {
  return _bookings.slice();
}

function _save(bookings) {
  _bookings = Array.isArray(bookings) ? bookings.slice() : [];
  try {
    sessionStorage.setItem(OWN_KEY, JSON.stringify(_bookings.filter((b) => _ownIds.has(b.bookingId))));
  } catch { /* ignore */ }
}

/* Admin/staff: replace the in-memory list with records from the backend. */
export function hydrateBookings(list) {
  const remote = Array.isArray(list) ? list : [];
  const remoteIds = new Set(remote.map((b) => b.bookingId));
  _save([..._bookings.filter((b) => _ownIds.has(b.bookingId) && !remoteIds.has(b.bookingId)), ...remote]);
}

/* ── persist booking ─────────────────────────────────────────
   Enriches the existing bookingRecord with:
     enhancedBookingId  – GT-YYYY-XXXXXX format
     customerId         – from customer service
     bookingStatus      – 'CONFIRMED' (default) | 'CANCELLED'
   Does NOT replace or remove any existing fields.
─────────────────────────────────────────────────────────── */
export function saveBookingRecord(enrichedRecord) {
  const all = getAllBookings();
  // idempotent: don't duplicate same bookingId
  if (all.some((b) => b.bookingId === enrichedRecord.bookingId)) return;
  _ownIds.add(enrichedRecord.bookingId);
  _save([{
    ...enrichedRecord,
    bookingStatus: enrichedRecord.bookingStatus || "CONFIRMED",
    savedAt: new Date().toISOString(),
  }, ...all]);
  apiRequest("/api/bookings", {
    method: "POST",
    body: {
    ...enrichedRecord,
    bookingStatus: enrichedRecord.bookingStatus || "CONFIRMED",
    savedAt: enrichedRecord.savedAt || new Date().toISOString(),
    },
  }).catch((error) => console.warn("Booking sync failed", error));
}

/* ── Update booking status ───────────────────────────────────
   status: 'CONFIRMED' | 'CANCELLED'
   Additive — does not remove any other fields.
─────────────────────────────────────────────────────────── */
export function updateBookingStatus(bookingId, status) {
  const all = getAllBookings();
  const updated = all.map((b) =>
    (b.bookingId === bookingId || b.enhancedBookingId === bookingId)
      ? { ...b, bookingStatus: status }
      : b
  );
  _save(updated);
  const booking = updated.find((b) => b.bookingId === bookingId || b.enhancedBookingId === bookingId) || null;
  if (booking) {
    apiRequest("/api/bookings", {
      method: "POST",
      body: booking,
    }).catch((error) => console.warn("Booking status sync failed", error));
  }
  return booking;
}

/* Local-only field update (e.g. leader cash collection in the employee portal). */
export function replaceBookings(bookings) {
  _save(bookings);
}

/* ── look-ups ── */
export function getBookingById(id) {
  return (
    getAllBookings().find(
      (b) => b.bookingId === id || b.enhancedBookingId === id
    ) || null
  );
}

/* ── query / filter / sort ──────────────────────────────────
   Filters:  trekName, departureOrigin, paymentOption, fromDate, toDate, status
   Search:   bookingId, enhancedBookingId, name, phone
   Sort:     latest (default) | oldest | amount-high | amount-low
─────────────────────────────────────────────────────────── */
export function queryBookings({
  trekName,
  departureOrigin,
  paymentOption,
  fromDate,
  toDate,
  search,
  status,
  sortBy = "latest",
} = {}) {
  let results = getAllBookings();

  if (trekName)        results = results.filter((b) => b.trekName === trekName);
  if (departureOrigin) results = results.filter((b) => b.departureOrigin === departureOrigin);
  if (paymentOption)   results = results.filter((b) => b.paymentOption === paymentOption);
  if (status)          results = results.filter((b) => (b.bookingStatus || "CONFIRMED") === status);

  if (fromDate) {
    const from = new Date(fromDate).getTime();
    results = results.filter((b) => new Date(b.savedAt || b.bookingDate).getTime() >= from);
  }
  if (toDate) {
    const to = new Date(toDate).getTime() + 86_400_000;
    results = results.filter((b) => new Date(b.savedAt || b.bookingDate).getTime() <= to);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (b) =>
        b.bookingId?.toLowerCase().includes(q) ||
        b.enhancedBookingId?.toLowerCase().includes(q) ||
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(q) ||
        b.contactNumber?.includes(q) ||
        b.email?.toLowerCase().includes(q)
    );
  }

  if (sortBy === "latest")      results.sort((a, b) => new Date(b.savedAt || b.bookingDate) - new Date(a.savedAt || a.bookingDate));
  else if (sortBy === "oldest") results.sort((a, b) => new Date(a.savedAt || a.bookingDate) - new Date(b.savedAt || b.bookingDate));
  else if (sortBy === "amount-high") results.sort((a, b) => b.totalAmount - a.totalAmount);
  else if (sortBy === "amount-low")  results.sort((a, b) => a.totalAmount - b.totalAmount);

  return results;
}
