import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { listen } from "./support/fakeSupabase.js";
import { fakeReadDb } from "./support/fakeReadDb.js";
import { createReportsRouter, canViewReports, parseQuery, ROW_CAP } from "../routes/reports.routes.js";
import { bookingMoney, buildReports, classifySource, istDay, tripOptions } from "../services/reports/reportsAggregate.js";

const SECRET = "test-jwt-secret-for-reports-tests-0123456789abcdef";
beforeAll(() => { process.env.JWT_SECRET = SECRET; });
const tok = (role = "Management", username = "mgr") => jwt.sign({ username, name: role, role }, SECRET, { expiresIn: "5m" });

const KAL = "11111111-1111-4111-8111-111111111111";
const PAV = "22222222-2222-4222-8222-222222222222";
const products = [
  { id: KAL, name: "Kalsubai Trek", slug: "kalsubai-trek", product_type: "trek" },
  { id: PAV, name: "Pavna Lake Camping", slug: "pavna-lake-camping", product_type: "camping" },
];
const bk = (o) => ({ id: `b-${o.code}`, booking_code: `GT-${o.code}`, legacy_booking_id: null, status: "CONFIRMED", payment_status: "PAID", customer_id: null,
  product_id: KAL, lead_first_name: "Rahul", lead_last_name: "Sharma", lead_phone: "9876543210", lead_whatsapp: null, lead_email: null,
  ticket_quantity: 2, total_amount: 2000, remaining_amount: 0, transaction_at: "2026-10-05T10:00:00Z", created_at: "2026-10-05T10:00:00Z", ...o });
const enq = (o) => ({ id: `e-${o.n}`, status: "NEW_LEAD", phone: "", email: "", event_name: "", booked_event_name: null, booked_booking_id: null,
  page_url: "", tags: [], source: "website", created_at: "2026-10-01T10:00:00Z", ...o });

const bookings = [
  bk({ code: "1" }),                                                                                  // Rahul, Kalsubai, paid 2000
  bk({ code: "2", transaction_at: "2026-11-03T10:00:00Z", product_id: PAV, total_amount: 3000, remaining_amount: 1000, payment_status: "PARTIAL" }), // Rahul again, 2000 collected 1000 pending
  bk({ code: "3", lead_phone: "+91 98220 11223", lead_first_name: "Priya", lead_last_name: "Patil", lead_email: "priya@x.com", transaction_at: "2026-10-20T10:00:00Z", total_amount: 1500 }),
  bk({ code: "4", lead_phone: "9000000001", lead_first_name: "Amit", status: "CANCELLED", total_amount: 9999 }),
  bk({ code: "5", lead_phone: "9000000002", lead_first_name: "Neha", payment_status: "FAILED", total_amount: 5000 }),
  bk({ code: "6", lead_phone: "9000000003", lead_first_name: "Sam", status: "PENDING_APPROVAL", payment_status: "PAID", total_amount: 1000, product_id: PAV, transaction_at: "2026-09-15T10:00:00Z" }),
  bk({ code: "7", lead_phone: "919876543210", lead_first_name: "Rahul", transaction_at: "2026-09-10T22:30:00Z", total_amount: 1000 }), // 11 Sep IST; same person as Rahul (+91 prefix)
];
const enquiries = [
  enq({ n: 1, phone: "98220 11223", event_name: "Kalsubai Trek", source: "instagram_dm", created_at: "2026-10-10T10:00:00Z" }),       // matched booking 3 (20 Oct)
  enq({ n: 2, phone: "9111111111", event_name: "Kalsubai", source: "whatsapp", status: "CONVERTED" }),                                // converted by status
  enq({ n: 3, phone: "9222222222", event_name: "Pavna Lake Camping", source: "website", page_url: "https://www.gadvede.com/contact?utm_source=google&utm_medium=cpc" }),
  enq({ n: 4, phone: "9333333333", event_name: "Pavna Lake Camping", source: "website" }),
  enq({ n: 5, phone: "9444444444", event_name: "Unknown Trek", source: "website", page_url: "https://x/?ref=ABC", booked_booking_id: "GT-1" }), // linked by code
  enq({ n: 6, phone: "9555555555", source: "" }),                                                                                       // unknown
  enq({ n: 7, phone: "9876543210", event_name: "Kalsubai Trek", source: "website", created_at: "2026-09-01T10:00:00Z" }),             // Rahul enquired 1 Sep, booked later
];
const data = { bookings, enquiries, products };

describe("helpers", () => {
  it("istDay shifts to Indian time", () => {
    expect(istDay("2026-09-10T22:30:00Z")).toBe("2026-09-11");
    expect(istDay("2026-09-10")).toBe("2026-09-10");
    expect(istDay("nope")).toBe("");
  });
  it("bookingMoney: collected = total - remaining; cancelled/failed excluded; pending approval = all pending", () => {
    expect(bookingMoney({ status: "CONFIRMED", payment_status: "PARTIAL", total_amount: 3000, remaining_amount: 1000 })).toMatchObject({ counted: true, booked: 3000, collected: 2000, pending: 1000 });
    expect(bookingMoney({ status: "CANCELLED", total_amount: 3000 }).counted).toBe(false);
    expect(bookingMoney({ status: "CONFIRMED", payment_status: "FAILED", total_amount: 3000 })).toMatchObject({ counted: false, reason: "failed" });
    expect(bookingMoney({ status: "PENDING_APPROVAL", payment_status: "PAID", total_amount: 1000, remaining_amount: 0 })).toMatchObject({ collected: 0, pending: 1000 });
    expect(bookingMoney({ status: "CONFIRMED", payment_status: "PAID", total_amount: 1000, remaining_amount: 5000 })).toMatchObject({ collected: 0, pending: 1000 }); // remaining never exceeds total
  });
  it("classifySource: stored source first, then utm / click ids, then tags", () => {
    expect(classifySource({ source: "instagram_dm" })).toBe("instagram");
    expect(classifySource({ source: "whatsapp", page_url: "?utm_source=google" })).toBe("whatsapp");
    expect(classifySource({ source: "website", page_url: "https://g.com/x?gclid=abc" })).toBe("google");
    expect(classifySource({ source: "website", page_url: "https://g.com/x?utm_source=Instagram" })).toBe("instagram");
    expect(classifySource({ source: "website", page_url: "https://g.com/x?utm_source=google&utm_medium=organic" })).toBe("google");
    expect(classifySource({ source: "website", page_url: "https://g.com/x?fbclid=1" })).toBe("referral_other");
    expect(classifySource({ source: "website", tags: ["Referral"] })).toBe("referral_other");
    expect(classifySource({ source: "website" })).toBe("website");
    expect(classifySource({ source: null })).toBe("unknown");
    expect(classifySource({})).toBe("unknown");
    expect(classifySource({ source: "weird", page_url: "not a url" })).toBe("unknown");
  });
  it("parseQuery validates dates and trip id", () => {
    expect(parseQuery({ from: "2026-01-01", to: "2026-02-01", trip: KAL })).toEqual({ from: "2026-01-01", to: "2026-02-01", trip: KAL });
    expect(parseQuery({})).toEqual({});
    expect(() => parseQuery({ from: "01/01/2026" })).toThrow();
    expect(() => parseQuery({ from: "2026-13-45" })).toThrow();
    expect(() => parseQuery({ from: "2026-03-01", to: "2026-02-01" })).toThrow();
    expect(() => parseQuery({ trip: "abc' or 1=1" })).toThrow();
    expect(() => parseQuery({ from: ["2026-01-01"] })).toThrow();
  });
  it("tripOptions sorts by name", () => {
    expect(tripOptions(products).map((t) => t.name)).toEqual(["Kalsubai Trek", "Pavna Lake Camping"]);
  });
});

describe("buildReports", () => {
  const r = buildReports(data, {});

  it("revenue totals: leaves out cancelled and failed, splits collected and pending", () => {
    // counted: 1 (2000), 2 (3000: 2000 + 1000 pending), 3 (1500), 6 (1000 pending), 7 (1000)
    expect(r.revenue.totals).toMatchObject({ bookings: 5, booked: 8500, collected: 6500, pending: 2000, cancelled: 1, failed: 1, pax: 10 });
    expect(r.kpis).toMatchObject({ bookedValue: 8500, collected: 6500, pending: 2000, bookings: 5, avgBookingValue: 1700 });
  });
  it("revenue per trip, sorted by value, with share", () => {
    expect(r.revenue.byTrip.map((t) => [t.name, t.bookings, t.booked, t.collected, t.pending])).toEqual([
      ["Kalsubai Trek", 3, 4500, 4500, 0], ["Pavna Lake Camping", 2, 4000, 2000, 2000],
    ]);
    expect(r.revenue.byTrip[0].share).toBe(52.9);
    expect(r.kpis.topTrip).toEqual({ name: "Kalsubai Trek", booked: 4500 });
  });
  it("revenue per month uses the Indian date and fills empty months", () => {
    expect(r.revenue.byMonth.map((m) => m.month)).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(r.revenue.byMonth[0]).toMatchObject({ bookings: 2, booked: 2000, pending: 1000 }); // 6 (15 Sep) and 7 (10 Sep 22:30 UTC = 11 Sep IST)
    expect(r.revenue.byMonth[2]).toMatchObject({ booked: 3000, collected: 2000, pending: 1000 });
  });
  it("month gaps are filled with zero rows", () => {
    const g = buildReports({ products, enquiries: [], bookings: [bk({ code: "a", transaction_at: "2026-05-02T00:00:00Z" }), bk({ code: "b", transaction_at: "2026-08-02T00:00:00Z" })] }, {});
    expect(g.revenue.byMonth.map((m) => [m.month, m.bookings])).toEqual([["2026-05", 1], ["2026-06", 0], ["2026-07", 0], ["2026-08", 1]]);
  });
  it("conversion: status, linked booking code, and phone match after the enquiry date all count", () => {
    // e1 matched by phone (booking 3), e2 CONVERTED, e5 linked GT-1, e7 matched (Rahul booked after 1 Sep). e3, e4, e6 not.
    expect(r.conversion.overall).toEqual({ enquiries: 7, converted: 4, rate: 57.1 });
    const byTrip = Object.fromEntries(r.conversion.byTrip.map((t) => [t.name, t]));
    expect(byTrip["Kalsubai Trek"]).toMatchObject({ enquiries: 4, converted: 4 }); // e1, e2, e7 + e5 (trip taken from its linked booking)
  });
  it("a booking made before the enquiry does not count as its conversion", () => {
    const x = buildReports({ products, bookings: [bk({ code: "z", lead_phone: "9777777777", transaction_at: "2026-09-01T10:00:00Z" })], enquiries: [enq({ n: 9, phone: "9777777777", created_at: "2026-10-01T10:00:00Z" })] }, {});
    expect(x.conversion.overall.converted).toBe(0);
  });
  it("lead sources with conversion per source", () => {
    const s = Object.fromEntries(r.sources.bySource.map((x) => [x.key, x]));
    expect(s.instagram).toMatchObject({ enquiries: 1, converted: 1, rate: 100, bookedValue: 1500 });
    expect(s.whatsapp).toMatchObject({ enquiries: 1, converted: 1 });
    expect(s.google).toMatchObject({ enquiries: 1, converted: 0, rate: 0 });
    expect(s.website).toMatchObject({ enquiries: 2, converted: 1 });
    expect(s.referral_other).toMatchObject({ enquiries: 1, converted: 1 });
    expect(s.unknown).toMatchObject({ enquiries: 1, converted: 0 });
    expect(r.sources.bySource.reduce((a, x) => a + x.enquiries, 0)).toBe(r.sources.total);
    expect(r.sources.unknownShare).toBe(14.3);
    expect(r.sources.bySource.map((x) => x.label)).toEqual(["Instagram", "WhatsApp", "Google / organic", "Website form", "Referral / other", "Unknown"]);
  });
  it("one booking is credited to one enquiry only", () => {
    const x = buildReports({ products, bookings: [bk({ code: "d", lead_phone: "9888888888", total_amount: 700 })],
      enquiries: [enq({ n: 1, phone: "9888888888", source: "instagram_dm" }), enq({ n: 2, phone: "9888888888", source: "whatsapp" })] }, {});
    expect(x.sources.bySource.reduce((a, s) => a + s.bookedValue, 0)).toBe(700);
  });
  it("repeat customers: same mobile with or without +91, share of revenue, masked display", () => {
    // Rahul: bookings 1, 2, 7 -> 3 bookings, 2000 + 3000 + 1000 = 6000 of 8500
    expect(r.repeat).toMatchObject({ uniqueCustomers: 3, repeatCustomers: 1, repeatRate: 33.3, repeatBookings: 3, repeatBookedValue: 6000, revenueShare: 70.6, avgBookingsPerRepeat: 3, piiMasked: true });
    const top = r.repeat.top[0];
    expect(top).toMatchObject({ name: "Rahul S.", phone: "******3210", bookings: 3, trips: 2, bookedValue: 6000, firstBooking: "2026-09-11", lastBooking: "2026-11-03" });
    const json = JSON.stringify(r);
    expect(json).not.toContain("9876543210");
    expect(json).not.toContain("98220");
    expect(json).not.toContain("priya@x.com");
    expect(json).not.toContain("Sharma");
  });
  it("repeat identity falls back to email, then customer id; bookings with no identity are skipped", () => {
    const x = buildReports({ products, enquiries: [], bookings: [
      bk({ code: "e1", lead_phone: null, lead_email: "A@B.com" }), bk({ code: "e2", lead_phone: "", lead_email: "a@b.com" }),
      bk({ code: "c1", lead_phone: null, customer_id: "cust-1" }), bk({ code: "c2", lead_phone: null, customer_id: "cust-1" }),
      bk({ code: "n1", lead_phone: null }),
    ] }, {});
    expect(x.repeat).toMatchObject({ uniqueCustomers: 2, repeatCustomers: 2 });
    expect(x.repeat.top[0].email).toBe("a***@b.com");
  });
  it("date range filters bookings by booking day and enquiries by created day", () => {
    const o = buildReports(data, { from: "2026-10-01", to: "2026-10-31" });
    expect(o.revenue.totals).toMatchObject({ bookings: 2, booked: 3500 }); // bookings 1 and 3
    expect(o.conversion.overall.enquiries).toBe(6); // e7 is from September
    // enquiry from October that converted with a booking made in November still counts as converted
    const late = buildReports({ products, bookings: [bk({ code: "L", lead_phone: "9666666666", transaction_at: "2026-11-20T10:00:00Z" })], enquiries: [enq({ n: 8, phone: "9666666666" })] }, { from: "2026-10-01", to: "2026-10-31" });
    expect(late.conversion.overall).toMatchObject({ enquiries: 1, converted: 1 });
    expect(late.revenue.totals.bookings).toBe(0);
  });
  it("trip filter limits revenue, conversion, sources and repeat customers to that trip", () => {
    const k = buildReports(data, { trip: KAL });
    expect(k.revenue.totals).toMatchObject({ bookings: 3, booked: 4500 });
    expect(k.revenue.byTrip).toHaveLength(1);
    expect(k.conversion.byTrip.every((t) => t.name === "Kalsubai Trek")).toBe(true);
    expect(k.repeat.repeatCustomers).toBe(1); // Rahul has two Kalsubai bookings (1 and 7)
    expect(buildReports(data, { trip: "99999999-9999-4999-8999-999999999999" }).range.trip).toBe(null); // unknown trip id is ignored
  });
  it("empty data gives zeros, not NaN", () => {
    const e = buildReports({}, {});
    expect(e.kpis).toMatchObject({ bookedValue: 0, bookings: 0, avgBookingValue: 0, enquiries: 0, conversionRate: 0, repeatRate: 0, topTrip: null, topSource: null });
    expect(e.revenue.byMonth).toEqual([]);
    expect(JSON.stringify(e)).not.toMatch(/NaN|null,"rate"/);
  });
});

describe("GET /api/reports", () => {
  let srv; let db;
  const app = () => express();
  beforeAll(async () => {
    db = fakeReadDb({ bookings, enquiries, products });
    const a = app(); a.use("/api/reports", createReportsRouter({ db: async () => db })); srv = await listen(a);
  });
  afterAll(() => srv.close());
  const get = (path, token) => fetch(`${srv.url}/api/reports${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  it("needs the admin JWT", async () => {
    for (const p of ["/overview", "/trips", "/revenue", "/conversion", "/sources", "/repeat-customers"]) expect((await get(p)).status, p).toBe(401);
    expect((await get("/overview", "garbage")).status).toBe(401);
  });
  it("Sales and unknown roles are refused; Management, Admin and Super Admin are allowed", async () => {
    expect((await get("/overview", tok("Sales"))).status).toBe(403);
    expect((await get("/overview", tok("Guest"))).status).toBe(403);
    expect((await get("/overview", tok(""))).status).toBe(403);
    for (const role of ["Management", "Admin", "Super Admin"]) expect((await get("/overview", tok(role))).status, role).toBe(200);
    expect(canViewReports({ role: "super_admin" })).toBe(true);
    expect(canViewReports({ role: "Sales" })).toBe(false);
    expect(canViewReports(undefined)).toBe(false);
  });
  it("returns every section, no-store, with masked customers only", async () => {
    const res = await get("/overview?from=2026-09-01&to=2026-11-30", tok());
    expect(res.headers.get("cache-control")).toBe("no-store");
    const { success, data: d } = await res.json();
    expect(success).toBe(true);
    expect(Object.keys(d).sort()).toEqual(["conversion", "kpis", "meta", "range", "repeat", "revenue", "sources"]);
    expect(d.meta).toMatchObject({ sourceColumn: true, truncated: false, rowCap: ROW_CAP });
    expect(d.kpis.bookings).toBe(5);
    const text = JSON.stringify(d);
    expect(text).not.toContain("9876543210");
    expect(text).not.toContain("priya@x.com");
  });
  it("section endpoints return just their part", async () => {
    for (const [p, key] of [["/revenue", "revenue"], ["/conversion", "conversion"], ["/sources", "sources"], ["/repeat-customers", "repeat"]]) {
      const d = (await (await get(p, tok())).json()).data;
      expect(Object.keys(d).sort(), p).toEqual(["meta", key, "range"].sort());
    }
  });
  it("lists trips for the filter", async () => {
    const d = (await (await get("/trips", tok())).json()).data;
    expect(d).toEqual([{ id: KAL, name: "Kalsubai Trek", type: "trek" }, { id: PAV, name: "Pavna Lake Camping", type: "camping" }]);
  });
  it("applies the trip filter from the query", async () => {
    const d = (await (await get(`/overview?trip=${PAV}`, tok())).json()).data;
    expect(d.range.trip).toBe(PAV);
    expect(d.revenue.byTrip.map((t) => t.name)).toEqual(["Pavna Lake Camping"]);
  });
  it("bad query values are 400 and nothing is read", async () => {
    const before = db.calls.length;
    for (const q of ["from=yesterday", "to=2026-99-99", "trip=1;drop table bookings", "from=2026-12-01&to=2026-01-01"]) expect((await get(`/overview?${q}`, tok())).status, q).toBe(400);
    expect(db.calls.length).toBe(before);
  });
  it("is read only: every non-GET is 405 and no write call is ever made", async () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const r = await fetch(`${srv.url}/api/reports/overview`, { method, headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" }, body: method === "DELETE" ? undefined : "{}" });
      expect(r.status, method).toBe(405);
    }
    const ops = db.calls.flatMap((c) => c.ops.map((o) => o[0]));
    expect(ops.length).toBeGreaterThan(0);
    expect(ops.filter((o) => ["insert", "update", "upsert", "delete", "rpc"].includes(o))).toEqual([]);
  });
  it("has no export, download or csv routes", async () => {
    for (const p of ["/export", "/download", "/csv", "/pdf", "/overview.csv"]) expect((await get(p, tok())).status, p).toBe(404);
  });
  it("works before migration 021: no source column means unknown sources, not an error", async () => {
    const plain = fakeReadDb({ bookings, products, enquiries: enquiries.map((e) => { const c = { ...e }; delete c.source; return c; }) });
    const real = plain.from;
    plain.from = (name) => {
      const q = real(name);
      if (name !== "enquiries") return q;
      const select = q.select;
      q.select = (cols, opts) => (String(cols).includes("source") ? Object.assign(Promise.resolve({ data: null, error: { message: "column enquiries.source does not exist" } }), { range: () => Promise.resolve({ data: null, error: { message: "column enquiries.source does not exist" } }), order() { return this; }, gte() { return this; }, lte() { return this; } }) : select(cols, opts));
      return q;
    };
    const a = express(); a.use("/api/reports", createReportsRouter({ db: async () => plain }));
    const s2 = await listen(a);
    try {
      const d = (await (await fetch(`${s2.url}/api/reports/sources`, { headers: { Authorization: `Bearer ${tok()}` } })).json()).data;
      expect(d.meta.sourceColumn).toBe(false);
      expect(d.sources.total).toBe(7);
      const by = Object.fromEntries(d.sources.bySource.map((x) => [x.key, x.enquiries]));
      expect(by.unknown).toBe(5); // google (utm) and referral (ref=) are still read from the page link
      expect(by.google).toBe(1);
    } finally { await s2.close(); }
  });
  it("database errors give a generic 500 without leaking details", async () => {
    const bad = { from: () => ({ select: () => ({ order() { return this; }, gte() { return this; }, lte() { return this; }, range: () => Promise.resolve({ data: null, error: { message: "secret table detail" } }) }) }) };
    const a = express(); a.use("/api/reports", createReportsRouter({ db: async () => bad }));
    const s2 = await listen(a);
    try {
      const r = await fetch(`${s2.url}/api/reports/overview`, { headers: { Authorization: `Bearer ${tok()}` } });
      expect(r.status).toBe(500);
      expect(JSON.stringify(await r.json())).not.toContain("secret");
    } finally { await s2.close(); }
  });
});
