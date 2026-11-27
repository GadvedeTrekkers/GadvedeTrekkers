import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { listen } from "./support/fakeSupabase.js";
import { fakeReadDb } from "./support/fakeReadDb.js";
import { createMcpRouter } from "../routes/mcp.routes.js";
import { createMcpServer, TOOL_NAMES } from "../mcp/server.js";
import { createDataAccess, clampLimit, readOnly, MAX_PAGE_SIZE, seatsLeft } from "../mcp/dataAccess.js";
import { maskEmail, maskPhone, maskFullName, createMasker } from "../mcp/pii.js";
import { tokenMatches, configuredToken } from "../mcp/auth.js";

const TOKEN = "test-mcp-token-" + "x".repeat(24);
const NOW = () => new Date("2026-11-28T00:00:00Z");

function seed() {
  const products = [
    { id: "11111111-1111-4111-8111-111111111111", name: "Kalsubai Trek", slug: "kalsubai-trek", product_type: "trek", base_price: 1299, is_active: true, sort_order: 1, rating: 4.8 },
    { id: "22222222-2222-4222-8222-222222222222", name: "Pavna Lake Camping", slug: "pavna-lake-camping", product_type: "camping", base_price: 1499, is_active: true, sort_order: 2 },
    { id: "33333333-3333-4333-8333-333333333333", name: "Krishna Villa", slug: "krishna-villa", product_type: "villa", base_price: 8000, is_active: true, sort_order: 3 },
    { id: "44444444-4444-4444-8444-444444444444", name: "Old Trek", slug: "old-trek", product_type: "trek", base_price: 999, is_active: false, sort_order: 4 },
  ];
  const product_batches = [
    { id: "b1", product_id: products[0].id, batch_date: "2026-12-05", seats_total: 30, seats_booked: 12, price: 1299 },
    { id: "b2", product_id: products[0].id, batch_date: "2026-12-12", seats_total: 30, seats_available: 0, status: "SOLD_OUT" },
    { id: "b3", product_id: products[1].id, batch_date: "2026-12-06", seats_total: 40, seats_booked: 10, available: false },
    { id: "b0", product_id: products[0].id, batch_date: "2026-11-01", seats_total: 30, seats_booked: 30 },
  ];
  const bookings = Array.from({ length: 120 }, (_, i) => ({
    id: `bk-${i}`,
    booking_code: `GT-2026-${String(i + 1).padStart(6, "0")}`,
    legacy_booking_id: `GTK-${i}`,
    status: i % 10 === 0 ? "CANCELLED" : "CONFIRMED",
    payment_status: i % 3 === 0 ? "PARTIAL" : "PAID",
    lead_first_name: "Rahul", lead_last_name: "Sharma",
    lead_phone: "9876543210", lead_whatsapp: "919876543210", lead_email: "rahul.sharma@gmail.com",
    emergency_contact: "Mom 9999988888", payment_reference: "UTR123456", payment_screenshot_url: "https://x/s.jpg",
    ticket_quantity: 2,
    travel_date: i < 60 ? "2026-10-10" : "2026-11-15",
    transaction_at: "2026-09-01T10:00:00Z",
    total_amount: 2000, payable_now: 1000, remaining_amount: i % 3 === 0 ? 1000 : 0,
    product_id: i % 2 ? products[0].id : products[1].id,
    batch_id: "b1",
    booking_travelers: [{ is_lead: true, first_name: "Rahul", last_name: "Sharma", mobile_number: "9876543210", email: "rahul.sharma@gmail.com" }],
  }));
  const enquiries = [
    { id: "ENQ-1", name: "Priya Patil", phone: "+91 98220 11223", email: "priya@yahoo.in", event_name: "Kalsubai Trek", status: "NEW_LEAD", message: "Call me at 9822011223", created_at: "2026-11-20T09:00:00Z", tags: [] },
    { id: "ENQ-2", name: "Amit", phone: "9000000001", email: "amit@x.com", event_name: "Pavna Camping", status: "CONTACTED", created_at: "2026-11-21T09:00:00Z" },
  ];
  const feedback = [
    { id: "f1", trek_name: "Kalsubai Trek", rating: 5, comment: "Great", status: "APPROVED", created_at: "2026-11-01T00:00:00Z", customer_id: "c1" },
    { id: "f2", trek_name: "Pavna", rating: 2, comment: "Late bus", status: "PENDING", created_at: "2026-11-02T00:00:00Z" },
  ];
  return { products, product_batches, bookings, enquiries, feedback };
}

/* ── PII masking ─────────────────────────────────────────────── */
describe("PII masking", () => {
  it("phone keeps only the last 4 digits", () => {
    expect(maskPhone("9876543210")).toBe("******3210");
    expect(maskPhone("+91 98220 11223")).toMatch(/^\*+1223$/);
    expect(maskPhone("+91 98220 11223")).not.toMatch(/9822/);
    expect(maskPhone(null)).toBe(null);
  });
  it("email keeps the first character and the domain", () => {
    expect(maskEmail("rahul.sharma@gmail.com")).toBe("r***@gmail.com");
    expect(maskEmail("bad")).toBe("***");
  });
  it("names keep first name + last initial", () => {
    expect(maskFullName("Priya Patil")).toBe("Priya P.");
  });
  it("full PII only when MCP_ALLOW_PII=true", () => {
    expect(createMasker({}).phone("9876543210")).toBe("******3210");
    expect(createMasker({ MCP_ALLOW_PII: "1" }).allow).toBe(false);
    expect(createMasker({ MCP_ALLOW_PII: "true" }).phone("9876543210")).toBe("9876543210");
  });
  it("list_bookings / get_booking / list_enquiries mask by default", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW });
    const list = await data.listBookings({ limit: 5 });
    const txt = JSON.stringify(list);
    expect(list.piiMasked).toBe(true);
    expect(txt).not.toContain("9876543210");
    expect(txt).not.toContain("rahul.sharma@");
    expect(list.bookings[0].customer).toEqual({ firstName: "Rahul", lastName: "S.", phone: "******3210", email: "r***@gmail.com" });

    const one = JSON.stringify(await data.getBooking({ bookingCode: "GT-2026-000002" }));
    for (const secret of ["9876543210", "rahul.sharma@", "9999988888", "UTR123456", "https://x/s.jpg", "Sharma"]) expect(one).not.toContain(secret);

    const enq = JSON.stringify(await data.listEnquiries({}));
    for (const secret of ["98220", "priya@", "Patil", "9822011223"]) expect(enq).not.toContain(secret);
  });
  it("returns full values with MCP_ALLOW_PII=true", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: { MCP_ALLOW_PII: "true" }, now: NOW });
    const b = await data.getBooking({ bookingCode: "GT-2026-000002" });
    expect(b.customer.phone).toBe("9876543210");
    expect(b.customer.email).toBe("rahul.sharma@gmail.com");
    expect(b.piiMasked).toBe(false);
  });
});

/* ── Data access ─────────────────────────────────────────────── */
describe("data access (read-only, paginated)", () => {
  it("readOnly() exposes no write methods", () => {
    const ro = readOnly(fakeReadDb({}));
    const t = ro.from("bookings");
    expect(Object.keys(t)).toEqual(["select"]);
    for (const w of ["insert", "update", "upsert", "delete", "rpc"]) { expect(t[w]).toBeUndefined(); expect(ro[w]).toBeUndefined(); }
  });
  it("caps page size at 50 at the database query", async () => {
    expect(clampLimit(1000)).toBe(MAX_PAGE_SIZE);
    expect(clampLimit(0)).toBe(20);
    const db = fakeReadDb(seed());
    const res = await createDataAccess(db, { env: {}, now: NOW }).listBookings({ limit: 500 });
    expect(res.bookings).toHaveLength(50);
    expect(res.limit).toBe(50);
    expect(res.total).toBe(120);
    const rangeOp = db.calls.find((c) => c.table === "bookings").ops.find((o) => o[0] === "range");
    expect(rangeOp).toEqual(["range", 0, 49]);
    const page3 = await createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW }).listBookings({ limit: 50, offset: 100 });
    expect(page3.bookings).toHaveLength(20);
  });
  it("filters bookings by trip slug, status, payment status and travel date range", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW });
    const r = await data.listBookings({ trip: "kalsubai-trek", status: "CONFIRMED", paymentStatus: "PAID", from: "2026-11-01", to: "2026-11-30", limit: 50 });
    expect(r.bookings.length).toBeGreaterThan(0);
    for (const b of r.bookings) {
      expect(b.trip.slug).toBe("kalsubai-trek");
      expect(b.status).toBe("CONFIRMED");
      expect(b.paymentStatus).toBe("PAID");
      expect(b.travelDate).toBe("2026-11-15");
    }
    expect((await data.listBookings({ trip: "nope" })).note).toBe("Trip not found");
  });
  it("lists trips of every type with upcoming dates and seats left", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW });
    const r = await data.listTrips({});
    expect(r.trips.map((t) => t.type).sort()).toEqual(["camping", "trek", "villa"]);
    const k = r.trips.find((t) => t.slug === "kalsubai-trek");
    expect(k.price).toBe(1299);
    expect(k.nextDates.map((d) => d.date)).toEqual(["2026-12-05", "2026-12-12"]);
    expect(k.nextDates[0].seatsLeft).toBe(18);
    expect((await data.listTrips({ type: "villa" })).trips).toHaveLength(1);
    expect((await data.listTrips({ activeOnly: false })).total).toBe(4);
  });
  it("get_trip and list_batches compute seats left and status", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW });
    const t = await data.getTrip({ trip: "kalsubai-trek" });
    expect(t.upcomingBatches.map((b) => [b.date, b.seatsLeft, b.status])).toEqual([["2026-12-05", 18, "OPEN"], ["2026-12-12", 0, "SOLD_OUT"]]);
    const all = await data.listBatches({});
    expect(all.batches.map((b) => b.batchId)).toEqual(["b1", "b3", "b2"]);
    expect(all.batches.find((b) => b.batchId === "b3").status).toBe("CLOSED");
    expect((await data.listBatches({ openOnly: true })).batches.map((b) => b.batchId)).toEqual(["b1"]);
    expect(seatsLeft({ seats_total: 10, seats_booked: 15 })).toBe(0);
  });
  it("booking_summary aggregates by trip and month, excluding cancelled from revenue", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW });
    const s = await data.bookingSummary({});
    expect(s.rowsScanned).toBe(120);
    expect(s.totals.cancelled).toBe(12);
    expect(s.totals.bookings).toBe(108);
    expect(s.totals.bookedValue).toBe(108 * 2000);
    expect(s.byMonth.map((m) => m.month)).toEqual(["2026-10", "2026-11"]);
    expect(s.byTrip.map((t) => t.name).sort()).toEqual(["Kalsubai Trek", "Pavna Lake Camping"]);
    expect(JSON.stringify(s)).not.toContain("9876543210");
    const booked = await data.bookingSummary({ dateField: "booked" });
    expect(booked.byMonth.map((m) => m.month)).toEqual(["2026-09"]);
  });
  it("list_reviews filters by status and rating", async () => {
    const data = createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW });
    expect((await data.listReviews({ status: "APPROVED" })).reviews.map((r) => r.reviewId)).toEqual(["f1"]);
    expect((await data.listReviews({ minRating: 4 })).reviews).toHaveLength(1);
    expect(JSON.stringify(await data.listReviews({}))).not.toContain("customer_id");
  });
  it("never calls a write method on the database", async () => {
    const db = fakeReadDb(seed());
    const data = createDataAccess(db, { env: {}, now: NOW });
    await data.listTrips({}); await data.getTrip({ trip: "kalsubai-trek" }); await data.listBatches({});
    await data.listBookings({}); await data.getBooking({ bookingCode: "GTK-3" }); await data.listEnquiries({});
    await data.bookingSummary({}); await data.listReviews({});
    const ops = db.calls.flatMap((c) => c.ops.map((o) => o[0]));
    expect(ops.some((o) => ["insert", "update", "upsert", "delete", "rpc"].includes(o))).toBe(false);
  });
});

/* ── MCP server: tool registry ───────────────────────────────── */
describe("MCP tool registry", () => {
  let client;
  beforeAll(async () => {
    const server = createMcpServer({ data: createDataAccess(fakeReadDb(seed()), { env: {}, now: NOW }) });
    const [a, b] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "1" });
    await Promise.all([server.connect(a), client.connect(b)]);
  });
  afterAll(() => client?.close());

  it("registers exactly the read-only tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint, t.name).toBe(true);
      expect(t.annotations?.destructiveHint, t.name).toBe(false);
    }
  });
  it("registers no write / delete / export tools", async () => {
    const { tools } = await client.listTools();
    const banned = /(create|update|delete|remove|insert|upsert|write|set_|edit|cancel|confirm|send|export|bulk|import|patch|approve)/i;
    expect(tools.filter((t) => banned.test(t.name))).toEqual([]);
  });
  it("tools return JSON and errors as isError", async () => {
    const r = await client.callTool({ name: "list_trips", arguments: { type: "trek" } });
    expect(JSON.parse(r.content[0].text).trips[0].slug).toBe("kalsubai-trek");
    const nf = await client.callTool({ name: "get_booking", arguments: { bookingCode: "GT-NOPE" } });
    expect(nf.isError).toBe(true);
    const capped = JSON.parse((await client.callTool({ name: "list_bookings", arguments: { limit: 999 } })).content[0].text);
    expect(capped.bookings).toHaveLength(50);
  });
});

/* ── HTTP route: enable flag, auth, rate limit ───────────────── */
describe("/api/mcp HTTP route", () => {
  let srv; let env;
  const logSpy = vi.spyOn(console, "log");
  const errSpy = vi.spyOn(console, "error");
  beforeEach(() => { env = { MCP_ENABLED: "true", MCP_API_TOKEN: TOKEN, MCP_RATE_LIMIT_PER_MIN: "1000" }; });
  async function start(e) {
    const app = express();
    app.use(express.json());
    app.use("/api/mcp", createMcpRouter({ env: e, data: createDataAccess(fakeReadDb(seed()), { env: e, now: NOW }) }));
    srv = await listen(app);
    return srv;
  }
  const rpc = (url, headers = {}) => fetch(`${url}/api/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  afterAll(() => { logSpy.mockRestore(); errSpy.mockRestore(); });

  it("is OFF (404) unless MCP_ENABLED=true", async () => {
    const s = await start({ ...env, MCP_ENABLED: "false" });
    expect((await rpc(s.url, { Authorization: `Bearer ${TOKEN}` })).status).toBe(404);
    await s.close();
  });
  it("returns 401 with no token or a wrong token", async () => {
    const s = await start(env);
    expect((await rpc(s.url)).status).toBe(401);
    expect((await rpc(s.url, { Authorization: "Bearer wrong" })).status).toBe(401);
    expect((await rpc(s.url, { Authorization: `Basic ${TOKEN}` })).status).toBe(401);
    await s.close();
  });
  it("returns 503 when enabled but no (or a too-short) token is configured", async () => {
    const s = await start({ ...env, MCP_API_TOKEN: "short" });
    expect((await rpc(s.url, { Authorization: "Bearer short" })).status).toBe(503);
    await s.close();
    expect(configuredToken({})).toBe(null);
  });
  it("returns 200 with the right token and lists the tools", async () => {
    const s = await start(env);
    const r = await rpc(s.url, { Authorization: `Bearer ${TOKEN}` });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.result.tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    await s.close();
  });
  it("works end to end with the official Streamable HTTP client", async () => {
    const s = await start(env);
    const client = new Client({ name: "bot", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${s.url}/api/mcp`), { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } }));
    const r = await client.callTool({ name: "booking_summary", arguments: {} });
    expect(JSON.parse(r.content[0].text).totals.bookings).toBe(108);
    await client.close();
    await s.close();
  });
  it("GET is 405 (stateless, no streams)", async () => {
    const s = await start(env);
    expect((await fetch(`${s.url}/api/mcp`, { headers: { Authorization: `Bearer ${TOKEN}` } })).status).toBe(405);
    await s.close();
  });
  it("rate-limits per client (429 after MCP_RATE_LIMIT_PER_MIN), even for bad tokens", async () => {
    const s = await start({ ...env, MCP_RATE_LIMIT_PER_MIN: "3" });
    const codes = [];
    for (let i = 0; i < 5; i += 1) codes.push((await rpc(s.url, { Authorization: i % 2 ? `Bearer ${TOKEN}` : "Bearer nope" })).status);
    expect(codes.slice(0, 3)).toEqual([401, 200, 401]);
    expect(codes.slice(3)).toEqual([429, 429]);
    await s.close();
  });
  it("never logs the token", () => {
    const logged = [...logSpy.mock.calls, ...errSpy.mock.calls].flat().map(String).join("\n");
    expect(logged).not.toContain(TOKEN);
  });
  it("token compare is exact", () => {
    expect(tokenMatches(TOKEN, TOKEN)).toBe(true);
    expect(tokenMatches(TOKEN + "a", TOKEN)).toBe(false);
    expect(tokenMatches("", TOKEN)).toBe(false);
  });
});
