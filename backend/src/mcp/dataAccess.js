/**
 * Read-only data access for the MCP server.
 *
 * Every query goes through `readOnly(db)`, which only exposes `from(table).select(...)`.
 * insert / update / upsert / delete / rpc are simply not reachable from here.
 * Uses the same Supabase service client and table/column names as the existing controllers
 * (bookings.controller.js, enquiries.controller.js, products.controller.js).
 */
import { createMasker } from "./pii.js";

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_OFFSET = 10_000;
export const SUMMARY_ROW_CAP = 10_000;
const SUMMARY_CHUNK = 1000;

export const TRIP_TYPES = ["trek", "tour", "camping", "villa", "rental", "heritage", "industrial"];
export const BOOKING_STATUSES = ["PENDING_APPROVAL", "CONFIRMED", "CANCELLED", "COMPLETED"];
export const PAYMENT_STATUSES = ["PAID", "PARTIAL", "UNPAID", "FAILED"];
export const ENQUIRY_STATUSES = ["NEW_LEAD", "CONTACTED", "QUOTED", "CONVERTED", "LOST"];

/** Columns from migration 002 that exist on every products table (no heavy image/gallery blobs). */
const PRODUCT_COLUMNS = [
  "id", "name", "slug", "product_type", "region", "location", "duration_label", "altitude_label",
  "base_price", "compare_at_price", "rating", "review_count", "is_active", "is_featured", "sort_order",
];
const PRODUCT_DETAIL_COLUMNS = [...PRODUCT_COLUMNS, "short_description", "created_at", "updated_at"];

const BOOKING_LIST_COLUMNS = [
  "id", "booking_code", "legacy_booking_id", "status", "payment_status",
  "lead_first_name", "lead_last_name", "lead_phone", "lead_email",
  "ticket_quantity", "departure_origin", "pickup_location", "travel_date",
  "payment_option", "payable_now", "total_amount", "remaining_amount",
  "booking_source", "manual_booking", "transaction_at", "created_at", "product_id", "batch_id",
];

export function readOnly(db) {
  if (!db || typeof db.from !== "function") throw new Error("MCP data access needs a Supabase client");
  return Object.freeze({
    from(table) {
      const t = db.from(table);
      return Object.freeze({ select: (...args) => t.select(...args) });
    },
  });
}

export function clampLimit(limit) {
  const n = Math.floor(Number(limit));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(n, MAX_PAGE_SIZE);
}

export function clampOffset(offset) {
  const n = Math.floor(Number(offset));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_OFFSET);
}

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ""));
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : null);
const today = (now) => now().toISOString().slice(0, 10);
/** Escape PostgREST ilike wildcards in user text. */
const likeSafe = (v) => String(v || "").replace(/[\\%_,()*]/g, " ").trim().slice(0, 100);

class DataError extends Error {}
function check(result, what) {
  if (result?.error) throw new DataError(`Could not load ${what}: ${result.error.message || "database error"}`);
  return result;
}

export function seatsLeft(b) {
  if (b == null) return null;
  if (b.seats_available !== undefined && b.seats_available !== null && Number.isFinite(Number(b.seats_available))) {
    return Math.max(0, Number(b.seats_available));
  }
  if (b.seats_total !== undefined && b.seats_total !== null) {
    return Math.max(0, num(b.seats_total) - num(b.seats_booked));
  }
  return null;
}

function batchStatus(b) {
  if (b.status) return b.status;
  if (b.available === false) return "CLOSED";
  return seatsLeft(b) === 0 ? "SOLD_OUT" : "OPEN";
}

function mapBatch(b, product) {
  return {
    batchId: b.id,
    tripId: b.product_id,
    ...(product ? { tripName: product.name, tripSlug: product.slug, tripType: product.product_type } : {}),
    date: b.batch_date,
    endDate: b.end_date ?? null,
    label: b.batch_label ?? null,
    departureCity: b.departure_city ?? null,
    price: b.price ?? product?.base_price ?? null,
    seatsTotal: b.seats_total ?? null,
    seatsBooked: b.seats_booked ?? null,
    seatsLeft: seatsLeft(b),
    status: batchStatus(b),
  };
}

function mapTrip(p) {
  return {
    tripId: p.id,
    name: p.name,
    slug: p.slug,
    type: p.product_type,
    region: p.region ?? null,
    location: p.location ?? null,
    duration: p.duration_label ?? null,
    altitude: p.altitude_label ?? null,
    price: p.base_price ?? null,
    compareAtPrice: p.compare_at_price ?? null,
    rating: p.rating ?? null,
    reviewCount: p.review_count ?? null,
    status: p.is_active === false ? "INACTIVE" : "ACTIVE",
    featured: Boolean(p.is_featured),
  };
}

export function createDataAccess(db, { env = process.env, now = () => new Date() } = {}) {
  const ro = readOnly(db);
  const mask = () => createMasker(env);

  async function resolveTrip(trip) {
    if (!trip) return null;
    const q = ro.from("products").select(PRODUCT_DETAIL_COLUMNS.join(","));
    const r = check(await (isUuid(trip) ? q.eq("id", trip) : q.eq("slug", String(trip).trim().toLowerCase())).maybeSingle(), "trip");
    return r.data || null;
  }

  async function productsById(ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return new Map();
    const r = check(await ro.from("products").select("id,name,slug,product_type,base_price").in("id", unique), "trips");
    return new Map((r.data || []).map((p) => [p.id, p]));
  }

  async function upcomingBatches(productIds, { from, to, perTrip } = {}) {
    if (!productIds.length) return [];
    let q = ro.from("product_batches").select("*").in("product_id", productIds).gte("batch_date", from || today(now));
    if (to) q = q.lte("batch_date", to);
    const r = check(await q.order("batch_date", { ascending: true }).limit(perTrip ? perTrip * productIds.length + 200 : 500), "batches");
    return r.data || [];
  }

  return {
    async listTrips({ type, activeOnly = true, limit, offset } = {}) {
      const lim = clampLimit(limit); const off = clampOffset(offset);
      let q = ro.from("products").select(PRODUCT_COLUMNS.join(","), { count: "exact" });
      if (type) q = q.eq("product_type", type);
      if (activeOnly) q = q.eq("is_active", true);
      q = q.order("product_type", { ascending: true }).order("sort_order", { ascending: true }).range(off, off + lim - 1);
      const r = check(await q, "trips");
      const trips = (r.data || []).map(mapTrip);
      const batches = await upcomingBatches(trips.map((t) => t.tripId), { perTrip: 3 });
      const byTrip = new Map();
      for (const b of batches) {
        const arr = byTrip.get(b.product_id) || [];
        if (arr.length < 3) arr.push({ date: b.batch_date, seatsLeft: seatsLeft(b), status: batchStatus(b), price: b.price ?? null });
        byTrip.set(b.product_id, arr);
      }
      return {
        total: r.count ?? trips.length, limit: lim, offset: off,
        trips: trips.map((t) => ({ ...t, nextDates: byTrip.get(t.tripId) || [] })),
      };
    },

    async getTrip({ trip }) {
      const p = await resolveTrip(trip);
      if (!p) return null;
      const batches = await upcomingBatches([p.id], {});
      return { ...mapTrip(p), shortDescription: p.short_description ?? null, upcomingBatches: batches.map((b) => mapBatch(b)) };
    },

    async listBatches({ trip, from, to, openOnly = false, limit, offset } = {}) {
      const lim = clampLimit(limit); const off = clampOffset(offset);
      let product = null;
      if (trip) {
        product = await resolveTrip(trip);
        if (!product) return { total: 0, limit: lim, offset: off, batches: [], note: "Trip not found" };
      }
      let q = ro.from("product_batches").select("*", { count: "exact" }).gte("batch_date", isoDate(from) || today(now));
      if (product) q = q.eq("product_id", product.id);
      if (isoDate(to)) q = q.lte("batch_date", isoDate(to));
      q = q.order("batch_date", { ascending: true }).range(off, off + lim - 1);
      const r = check(await q, "batches");
      const rows = r.data || [];
      const products = product ? new Map([[product.id, product]]) : await productsById(rows.map((b) => b.product_id));
      let batches = rows.map((b) => mapBatch(b, products.get(b.product_id)));
      if (openOnly) batches = batches.filter((b) => b.status === "OPEN" && b.seatsLeft !== 0);
      return { total: r.count ?? batches.length, limit: lim, offset: off, batches };
    },

    async listBookings({ trip, from, to, dateField = "travel", status, paymentStatus, limit, offset } = {}) {
      const lim = clampLimit(limit); const off = clampOffset(offset);
      const m = mask();
      let product = null;
      if (trip) {
        product = await resolveTrip(trip);
        if (!product) return { total: 0, limit: lim, offset: off, bookings: [], note: "Trip not found" };
      }
      const col = dateField === "booked" ? "transaction_at" : "travel_date";
      let q = ro.from("bookings").select(BOOKING_LIST_COLUMNS.join(","), { count: "exact" });
      if (product) q = q.eq("product_id", product.id);
      if (status) q = q.eq("status", status);
      if (paymentStatus) q = q.eq("payment_status", paymentStatus);
      if (isoDate(from)) q = q.gte(col, isoDate(from));
      if (isoDate(to)) q = q.lte(col, col === "transaction_at" ? `${isoDate(to)}T23:59:59Z` : isoDate(to));
      q = q.order(col, { ascending: false }).range(off, off + lim - 1);
      const r = check(await q, "bookings");
      const rows = r.data || [];
      const products = await productsById(rows.map((b) => b.product_id));
      const bookings = rows.map((b) => {
        const p = products.get(b.product_id);
        return {
          bookingCode: b.booking_code,
          legacyBookingId: b.legacy_booking_id ?? null,
          trip: p ? { tripId: p.id, name: p.name, slug: p.slug, type: p.product_type } : null,
          travelDate: b.travel_date ?? null,
          bookedAt: b.transaction_at ?? b.created_at ?? null,
          status: b.status,
          paymentStatus: b.payment_status,
          paymentOption: b.payment_option ?? null,
          tickets: b.ticket_quantity,
          totalAmount: num(b.total_amount),
          paidNow: num(b.payable_now),
          remainingAmount: num(b.remaining_amount),
          source: b.booking_source ?? null,
          manual: Boolean(b.manual_booking),
          customer: {
            firstName: b.lead_first_name,
            lastName: m.lastName(b.lead_last_name),
            phone: m.phone(b.lead_phone),
            email: m.email(b.lead_email),
          },
          pickupLocation: b.pickup_location ?? null,
          departureOrigin: b.departure_origin ?? null,
        };
      });
      return { total: r.count ?? bookings.length, limit: lim, offset: off, piiMasked: !m.allow, bookings };
    },

    async getBooking({ bookingCode }) {
      const m = mask();
      const code = String(bookingCode || "").trim();
      if (!code) return null;
      let r = check(await ro.from("bookings").select("*, booking_travelers (*)").eq("booking_code", code).maybeSingle(), "booking");
      if (!r.data) r = check(await ro.from("bookings").select("*, booking_travelers (*)").eq("legacy_booking_id", code).maybeSingle(), "booking");
      const b = r.data;
      if (!b) return null;
      const products = await productsById([b.product_id]);
      const p = products.get(b.product_id);
      let batch = null;
      if (b.batch_id) {
        const br = check(await ro.from("product_batches").select("*").eq("id", b.batch_id).maybeSingle(), "batch");
        batch = br.data ? mapBatch(br.data, p) : null;
      }
      return {
        bookingCode: b.booking_code,
        legacyBookingId: b.legacy_booking_id ?? null,
        trip: p ? { tripId: p.id, name: p.name, slug: p.slug, type: p.product_type } : null,
        batch,
        travelDate: b.travel_date ?? null,
        bookedAt: b.transaction_at ?? b.created_at ?? null,
        status: b.status,
        paymentStatus: b.payment_status,
        paymentOption: b.payment_option ?? null,
        paymentReference: m.sensitive(b.payment_reference),
        paymentScreenshot: m.sensitive(b.payment_screenshot_url),
        amounts: {
          base: num(b.base_amount), processingFee: num(b.processing_fee), gst: num(b.gst_amount),
          total: num(b.total_amount), paidNow: num(b.payable_now), remaining: num(b.remaining_amount),
        },
        tickets: b.ticket_quantity,
        source: b.booking_source ?? null,
        manual: Boolean(b.manual_booking),
        collectedOffline: Boolean(b.collected_offline),
        referralCode: b.referral_code ?? null,
        pickupLocation: b.pickup_location ?? null,
        departureOrigin: b.departure_origin ?? null,
        whatsappGroupLink: m.sensitive(b.whatsapp_group_link),
        notes: m.allow ? (b.notes ?? null) : (b.notes ? "[hidden]" : null),
        customer: {
          firstName: b.lead_first_name,
          lastName: m.lastName(b.lead_last_name),
          phone: m.phone(b.lead_phone),
          whatsapp: m.phone(b.lead_whatsapp),
          email: m.email(b.lead_email),
          emergencyContact: m.allow ? (b.emergency_contact ?? null) : (b.emergency_contact ? "[hidden]" : null),
        },
        travelers: (b.booking_travelers || []).map((t) => ({
          isLead: Boolean(t.is_lead),
          firstName: t.first_name,
          lastName: m.lastName(t.last_name),
          phone: m.phone(t.mobile_number),
          email: m.email(t.email),
          pickupLocation: t.pickup_location ?? null,
        })),
        piiMasked: !m.allow,
      };
    },

    async listEnquiries({ status, from, to, trip, limit, offset } = {}) {
      const lim = clampLimit(limit); const off = clampOffset(offset);
      const m = mask();
      let q = ro.from("enquiries").select(
        "id,name,phone,email,event_name,category,location,page_url,message,preferred_date,group_size,status,tags,assigned_sales_name,first_response_at,converted_at,archived_at,booked_booking_id,created_at",
        { count: "exact" },
      );
      if (status) q = q.eq("status", status);
      if (isoDate(from)) q = q.gte("created_at", isoDate(from));
      if (isoDate(to)) q = q.lte("created_at", `${isoDate(to)}T23:59:59Z`);
      if (trip && likeSafe(trip)) q = q.ilike("event_name", `%${likeSafe(trip)}%`);
      q = q.order("created_at", { ascending: false }).range(off, off + lim - 1);
      const r = check(await q, "enquiries");
      const enquiries = (r.data || []).map((e) => ({
        enquiryId: e.id,
        createdAt: e.created_at,
        status: e.status,
        trip: e.event_name ?? null,
        category: e.category ?? null,
        location: e.location ?? null,
        preferredDate: e.preferred_date ?? null,
        groupSize: e.group_size ?? null,
        message: m.allow ? (e.message ?? null) : (e.message ? "[hidden]" : null),
        tags: e.tags || [],
        assignedTo: e.assigned_sales_name ?? null,
        firstResponseAt: e.first_response_at ?? null,
        convertedAt: e.converted_at ?? null,
        archivedAt: e.archived_at ?? null,
        bookedBookingId: e.booked_booking_id ?? null,
        pageUrl: e.page_url ?? null,
        customer: { name: m.fullName(e.name), phone: m.phone(e.phone), email: m.email(e.email) },
      }));
      return { total: r.count ?? enquiries.length, limit: lim, offset: off, piiMasked: !m.allow, enquiries };
    },

    async bookingSummary({ from, to, dateField = "travel", trip } = {}) {
      const col = dateField === "booked" ? "transaction_at" : "travel_date";
      let product = null;
      if (trip) {
        product = await resolveTrip(trip);
        if (!product) return { note: "Trip not found", totals: null, byTrip: [], byMonth: [] };
      }
      const rows = [];
      let truncated = false;
      for (let off = 0; off < SUMMARY_ROW_CAP; off += SUMMARY_CHUNK) {
        let q = ro.from("bookings").select("product_id,status,payment_status,ticket_quantity,total_amount,payable_now,remaining_amount,travel_date,transaction_at");
        if (product) q = q.eq("product_id", product.id);
        if (isoDate(from)) q = q.gte(col, isoDate(from));
        if (isoDate(to)) q = q.lte(col, col === "transaction_at" ? `${isoDate(to)}T23:59:59Z` : isoDate(to));
        const r = check(await q.order(col, { ascending: true }).range(off, off + SUMMARY_CHUNK - 1), "bookings");
        const chunk = r.data || [];
        rows.push(...chunk);
        if (chunk.length < SUMMARY_CHUNK) break;
        if (off + SUMMARY_CHUNK >= SUMMARY_ROW_CAP) truncated = true;
      }
      const products = await productsById(rows.map((b) => b.product_id));
      const blank = () => ({ bookings: 0, cancelled: 0, travelers: 0, bookedValue: 0, collected: 0, outstanding: 0 });
      const add = (acc, b) => {
        if (b.status === "CANCELLED") { acc.cancelled += 1; return; }
        acc.bookings += 1;
        acc.travelers += num(b.ticket_quantity) || 1;
        const total = num(b.total_amount); const remaining = num(b.remaining_amount);
        acc.bookedValue += total;
        acc.outstanding += remaining;
        acc.collected += Math.max(0, total - remaining);
      };
      const totals = blank(); const byTrip = new Map(); const byMonth = new Map(); const byStatus = {}; const byPayment = {};
      for (const b of rows) {
        add(totals, b);
        byStatus[b.status || "UNKNOWN"] = (byStatus[b.status || "UNKNOWN"] || 0) + 1;
        byPayment[b.payment_status || "UNKNOWN"] = (byPayment[b.payment_status || "UNKNOWN"] || 0) + 1;
        const key = b.product_id || "unlinked";
        if (!byTrip.has(key)) {
          const p = products.get(b.product_id);
          byTrip.set(key, { tripId: b.product_id || null, name: p?.name || "Not linked to a trip", slug: p?.slug || null, ...blank() });
        }
        add(byTrip.get(key), b);
        const month = String(b[col] || "").slice(0, 7) || "unknown";
        if (!byMonth.has(month)) byMonth.set(month, { month, ...blank() });
        add(byMonth.get(month), b);
      }
      return {
        range: { from: isoDate(from), to: isoDate(to), dateField: col === "transaction_at" ? "booked" : "travel" },
        rowsScanned: rows.length, truncated,
        note: "Revenue excludes CANCELLED bookings. collected = total - remaining (INR).",
        totals, byStatus, byPaymentStatus: byPayment,
        byTrip: [...byTrip.values()].sort((a, b) => b.bookedValue - a.bookedValue),
        byMonth: [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)),
      };
    },

    async listReviews({ status, minRating, trip, limit, offset } = {}) {
      const lim = clampLimit(limit); const off = clampOffset(offset);
      let q = ro.from("feedback").select("id,booking_id,trek_name,rating,comment,source,status,created_at", { count: "exact" });
      if (status) q = q.eq("status", status);
      if (minRating) q = q.gte("rating", Math.max(1, Math.min(5, Math.floor(Number(minRating)) || 1)));
      if (trip && likeSafe(trip)) q = q.ilike("trek_name", `%${likeSafe(trip)}%`);
      q = q.order("created_at", { ascending: false }).range(off, off + lim - 1);
      const r = check(await q, "reviews");
      const reviews = (r.data || []).map((f) => ({
        reviewId: f.id, trip: f.trek_name ?? null, rating: f.rating ?? null, comment: f.comment ?? null,
        source: f.source ?? null, status: f.status, bookingId: f.booking_id ?? null, createdAt: f.created_at,
      }));
      return { total: r.count ?? reviews.length, limit: lim, offset: off, reviews };
    },
  };
}

export { DataError };
