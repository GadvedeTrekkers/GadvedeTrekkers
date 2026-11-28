import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { readOnly } from "../mcp/dataAccess.js";
import { buildReports, tripOptions } from "../services/reports/reportsAggregate.js";

/**
 * Admin Reports (read only). Mounted at /api/reports.
 *
 *   GET /trips             trip filter options [{ id, name, type }]
 *   GET /overview          every section below in one response (the Reports page uses this)
 *   GET /revenue           revenue per trip and per month (collected vs pending)
 *   GET /conversion        enquiry -> booking conversion, overall and per trip
 *   GET /sources           lead sources (Instagram, WhatsApp, Google, website form, referral/other, unknown) with conversion
 *   GET /repeat-customers  repeat customers (mobile number / email, masked) with their share of revenue
 *   Query: from=YYYY-MM-DD  to=YYYY-MM-DD  trip=<trip id>  (all optional; dates are IST days)
 *
 * Access: admin JWT, role Super Admin, Admin or Management. Sales (and any other role) get 403, because these reports hold
 * revenue figures (same rule as financials). Customer names, phones and emails are always masked.
 * Reads only: the database handle is wrapped so insert / update / delete / rpc are unreachable, and every non-GET is 405.
 * There is no export or download route.
 */
export const REPORT_ROLES = ["superadmin", "admin", "management"];
export const ROW_CAP = 10_000;
const CHUNK = 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const roleKey = (admin) => String(admin?.role ?? "").toLowerCase().replace(/[\s_-]/g, "");
export const canViewReports = (admin) => REPORT_ROLES.includes(roleKey(admin));

const BOOKING_COLS = "id,booking_code,legacy_booking_id,status,payment_status,customer_id,product_id,lead_first_name,lead_last_name,lead_phone,lead_whatsapp,lead_email,ticket_quantity,total_amount,remaining_amount,transaction_at,created_at";
const ENQUIRY_COLS = "id,status,phone,email,event_name,booked_event_name,booked_booking_id,page_url,tags,created_at";

class BadQuery extends Error {}
const istStart = (d) => new Date(`${d}T00:00:00+05:30`).toISOString();
const istEnd = (d) => new Date(`${d}T23:59:59.999+05:30`).toISOString();

export function parseQuery(q = {}) {
  const out = {};
  for (const k of ["from", "to"]) {
    const v = q[k];
    if (v === undefined || v === "") continue;
    if (typeof v !== "string" || !DAY.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) throw new BadQuery(`${k} must be a date like 2026-11-28`);
    out[k] = v;
  }
  if (out.from && out.to && out.from > out.to) throw new BadQuery("from must be on or before to");
  if (q.trip !== undefined && q.trip !== "") {
    if (typeof q.trip !== "string" || !UUID.test(q.trip)) throw new BadQuery("trip must be a trip id");
    out.trip = q.trip;
  }
  return out;
}

export function createReportsRouter({ db } = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);

  router.use(requireAdminJWT);
  router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  router.use((req, res, next) => (req.method === "GET" ? next() : res.status(405).set("Allow", "GET").json({ success: false, error: "Reports are read only" })));
  router.use((req, res, next) => (canViewReports(req.admin) ? next() : res.status(403).json({ success: false, error: "Reports are available to Management and Admin roles only" })));
  router.use(simpleRateLimit({ windowMs: 60_000, limit: 40, key: (req) => `reports:${String(req.admin?.username || "unknown").slice(0, 80)}`, message: { success: false, error: "Too many report requests. Wait a minute and try again." } }));

  async function readAll(ro, table, cols, build) {
    const rows = [];
    let truncated = false;
    for (let off = 0; off < ROW_CAP; off += CHUNK) {
      let q = ro.from(table).select(cols);
      q = build(q).range(off, off + CHUNK - 1);
      const r = await q;
      if (r?.error) return { rows, error: r.error, truncated };
      const chunk = r?.data || [];
      rows.push(...chunk);
      if (chunk.length < CHUNK) return { rows, error: null, truncated };
    }
    truncated = true;
    return { rows, error: null, truncated };
  }

  async function load({ from, to }) {
    const ro = readOnly(await getDb());
    const [bk, pr] = await Promise.all([
      // Bookings from the start of the range onwards: later bookings are needed to see which enquiries converted.
      readAll(ro, "bookings", BOOKING_COLS, (q) => { if (from) q = q.gte("transaction_at", istStart(from)); return q.order("transaction_at", { ascending: false }); }),
      readAll(ro, "products", "id,name,slug,product_type", (q) => q.order("name", { ascending: true })),
    ]);
    if (bk.error) throw new Error("bookings read failed");
    if (pr.error) throw new Error("products read failed");
    const enqRange = (q) => { if (from) q = q.gte("created_at", istStart(from)); if (to) q = q.lte("created_at", istEnd(to)); return q.order("created_at", { ascending: false }); };
    let en = await readAll(ro, "enquiries", `${ENQUIRY_COLS},source`, enqRange);
    let sourceColumn = true;
    if (en.error && /source/i.test(en.error.message || "")) { // migration 021 not applied yet: every source is "unknown" unless the page link says otherwise
      sourceColumn = false;
      en = await readAll(ro, "enquiries", ENQUIRY_COLS, enqRange);
    }
    if (en.error) throw new Error("enquiries read failed");
    return {
      data: { bookings: bk.rows, enquiries: en.rows, products: pr.rows },
      meta: { sourceColumn, truncated: bk.truncated || en.truncated, rowCap: ROW_CAP },
    };
  }

  const PICK = { overview: null, revenue: "revenue", conversion: "conversion", sources: "sources", "repeat-customers": "repeat" };
  router.get("/trips", async (req, res) => {
    try {
      const ro = readOnly(await getDb());
      const r = await readAll(ro, "products", "id,name,slug,product_type", (q) => q.order("name", { ascending: true }));
      if (r.error) throw new Error("products read failed");
      return res.json({ success: true, data: tripOptions(r.rows) });
    } catch (e) {
      console.error("reports trips failed:", e?.message || e);
      return res.status(500).json({ success: false, error: "Could not load trips" });
    }
  });

  for (const [path, part] of Object.entries(PICK)) {
    router.get(`/${path}`, async (req, res) => {
      let opts;
      try { opts = parseQuery(req.query); } catch (e) { if (e instanceof BadQuery) return res.status(400).json({ success: false, error: e.message }); throw e; }
      try {
        const { data, meta } = await load(opts);
        const full = buildReports(data, opts);
        const body = part ? { range: full.range, [part]: full[part] } : full;
        return res.json({ success: true, data: { ...body, meta } });
      } catch (e) {
        console.error(`reports ${path} failed:`, e?.message || e);
        return res.status(500).json({ success: false, error: "Could not build the report. Please try again." });
      }
    });
  }

  return router;
}

export default createReportsRouter;
