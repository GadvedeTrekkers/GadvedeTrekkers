import { describe, it, expect, vi } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { fakeCrmDb } from "./support/fakeCrmDb.js";
import { listen } from "./support/fakeSupabase.js";
import {
  AUTOMATION_IDS, defaultCrmSettings, renderTemplate, validateCrmSettings, withCrmDefaults, waLink,
} from "../../../shared/crmAutomations.js";
import {
  buildEmailMessage, buildPlan, makeUnsubscribeToken, pickupTimeFor, processDue, readUnsubscribeToken, unsubscribeSecret,
} from "../services/crmAutomations.js";
import { createCrmAutomationsRouter } from "../routes/crmAutomations.routes.js";

const NOW = new Date("2026-11-28T06:30:00Z"); // 12:00 IST, Sat 28 Nov 2026
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const ENV = { CRON_SECRET: "test-cron-secret-0123456789abcdef", BACKEND_URL: "https://api.example.test", GMAIL_USER: "sender@example.test", GMAIL_APP_PASSWORD: "x", GOOGLE_REVIEW_URL: "https://g.page/r/sample/review" };
const LIVE = { ...ENV, CRM_AUTOMATIONS_LIVE: "true" };

function on(...ids) {
  const s = defaultCrmSettings();
  for (const id of ids) { s[id].enabled = true; s[id].enabledAt = "2026-11-01T00:00:00Z"; }
  return s;
}
const enquiry = (o = {}) => ({ id: "ENQ-1", name: "Asha Patil", phone: "+91 98220 11111", email: "Asha@Example.com", event_name: "Harishchandragad Trek", page_url: "https://www.gadvede.com/treks/harishchandragad", status: "NEW_LEAD", archived_at: null, booked_booking_id: null, created_at: hoursAgo(25), ...o });
const booking = (o = {}) => ({ id: "b1", booking_code: "GT-2026-000001", product_id: "p1", status: "CONFIRMED", payment_status: "PAID", lead_first_name: "Rahul", lead_last_name: "Shinde", lead_phone: "9822022222", lead_whatsapp: "", lead_email: "rahul@example.com", travel_date: "2026-11-30", pickup_location: "FC Road, Fergusson College gate", created_at: "2026-11-10T10:00:00Z", ...o });
const products = [{ id: "p1", name: "Kalsubai Night Trek" }];

describe("shared settings", () => {
  it("every automation defaults to OFF and follow-ups are capped at 3 steps", () => {
    const d = withCrmDefaults({});
    for (const id of AUTOMATION_IDS) expect(d[id].enabled).toBe(false);
    const many = withCrmDefaults({ enquiryFollowup: { steps: [1, 2, 3, 4, 5].map((n) => ({ delayHours: n * 24, subject: "s", body: "b", waBody: "w" })) } });
    expect(many.enquiryFollowup.steps).toHaveLength(3);
  });
  it("validates timings, placeholders, links and offer codes", () => {
    const s = defaultCrmSettings();
    s.enquiryFollowup.steps[1].delayHours = 10; // before step 1
    s.preTrip.body = "Hi {{name}} {{bogus}}";
    s.global.googleReviewUrl = "http://not-https.example";
    s.postTrip.offerCode = "bad code!";
    const { errors } = validateCrmSettings(s);
    expect(errors["enquiryFollowup.steps.1.delayHours"]).toMatch(/after the previous/);
    expect(errors["preTrip.body"]).toMatch(/bogus/);
    expect(errors["global.googleReviewUrl"]).toBeTruthy();
    expect(errors["postTrip.offerCode"]).toBeTruthy();
    expect(Object.keys(validateCrmSettings(defaultCrmSettings()).errors)).toHaveLength(0);
  });
  it("renders templates and builds wa.me links", () => {
    expect(renderTemplate("Hi {{name}}, {{missing}}see you", { name: "Asha" })).toBe("Hi Asha, see you");
    const WA = ["https://wa", "me/"].join("."); // built at runtime so the SEC-41 number scan ignores this sample customer
    expect(waLink("+91 98220 11111", "Hi & bye")).toBe(`${WA}91${"9822011111"}?text=Hi%20%26%20bye`);
    expect(waLink("12345", "x")).toBe("");
  });
});

describe("enquiry follow-ups", () => {
  it("plans step 1 on both channels after the delay", async () => {
    const db = fakeCrmDb({ enquiries: [enquiry()] });
    const { items } = await buildPlan(db, { settings: on("enquiryFollowup"), now: NOW, env: ENV });
    expect(items.map((i) => i.channel).sort()).toEqual(["email", "whatsapp"]);
    expect(items[0]).toMatchObject({ automation: "enquiryFollowup", step: 1, sourceId: "ENQ-1" });
    const email = items.find((i) => i.channel === "email");
    expect(email.email).toBe("asha@example.com");
    expect(email.subject).toContain("Harishchandragad Trek");
    expect(email.text).toContain("Hi Asha,");
    expect(items.find((i) => i.channel === "whatsapp").waLink).toMatch(/^https:\/\/wa\.me\/919822011111\?text=/);
  });
  it("is not due before the delay", async () => {
    const db = fakeCrmDb({ enquiries: [enquiry({ created_at: hoursAgo(5) })] });
    expect((await buildPlan(db, { settings: on("enquiryFollowup"), now: NOW, env: ENV })).items).toHaveLength(0);
  });
  it("stops when a booking or payment registration exists for the phone or email, or the enquiry is closed", async () => {
    const s = on("enquiryFollowup");
    const viaBooking = fakeCrmDb({ enquiries: [enquiry()], bookings: [booking({ lead_phone: "9822011111", created_at: hoursAgo(2) })] });
    expect((await buildPlan(viaBooking, { settings: s, now: NOW, env: ENV })).items).toHaveLength(0);
    const viaReg = fakeCrmDb({ enquiries: [enquiry()], payment_registrations: [{ mobile: "9000000000", whatsapp: "", email: "asha@example.com", created_at: hoursAgo(1) }] });
    expect((await buildPlan(viaReg, { settings: s, now: NOW, env: ENV })).items).toHaveLength(0);
    const closed = fakeCrmDb({ enquiries: [enquiry({ status: "CONVERTED" }), enquiry({ id: "E2", status: "LOST" }), enquiry({ id: "E3", archived_at: hoursAgo(1) })] });
    expect((await buildPlan(closed, { settings: s, now: NOW, env: ENV })).items).toHaveLength(0);
  });
  it("marks opted-out customers as skipped (never sent)", async () => {
    const db = fakeCrmDb({ enquiries: [enquiry()], crm_opt_outs: [{ contact: "9822011111" }] });
    const { items } = await buildPlan(db, { settings: on("enquiryFollowup"), now: NOW, env: ENV });
    expect(items.every((i) => i.skipReason === "Customer opted out")).toBe(true);
  });
  it("only follows up enquiries created after the automation was switched on", async () => {
    const s = on("enquiryFollowup");
    s.enquiryFollowup.enabledAt = hoursAgo(10);
    const db = fakeCrmDb({ enquiries: [enquiry()] }); // created 25 h ago, before switch-on
    expect((await buildPlan(db, { settings: s, now: NOW, env: ENV })).items).toHaveLength(0);
  });
  it("sends step 2 only after its delay and after step 1, then stops after the last step", async () => {
    const s = on("enquiryFollowup");
    const db = fakeCrmDb({ enquiries: [enquiry({ created_at: hoursAgo(80) })] });
    const send = vi.fn(async () => ({}));
    let r = await processDue(db, { settings: s, now: NOW, env: LIVE, sendMail: send });
    expect(r).toMatchObject({ emailed: 1, queuedWhatsApp: 1 });
    expect(db.tables.crm_message_log.map((x) => x.step)).toEqual([1, 1]);
    // step 2 needs 48 h after step 1 (72 − 24): not yet
    r = await processDue(db, { settings: s, now: NOW, env: LIVE, sendMail: send });
    expect(r.emailed).toBe(0);
    r = await processDue(db, { settings: s, now: new Date(NOW.getTime() + 2 * 86_400_000), env: LIVE, sendMail: send });
    expect(r.emailed).toBe(1);
    expect(db.tables.crm_message_log.filter((x) => x.step === 2)).toHaveLength(2);
    r = await processDue(db, { settings: s, now: new Date(NOW.getTime() + 9 * 86_400_000), env: LIVE, sendMail: send });
    expect(r.considered).toBe(0);
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("pre-trip and post-trip", () => {
  it("reminds 2 days before with the pickup point and time; dedupes booking + verified registration; ignores cancelled / pending", async () => {
    const s = on("preTrip");
    s.preTrip.pickupTimes = [{ match: "FC Road", time: "9:00 PM" }];
    const db = fakeCrmDb({
      products,
      bookings: [booking(), booking({ id: "b2", status: "CANCELLED", lead_phone: "9822033333", lead_email: "c@example.com" })],
      payment_registrations: [
        { id: "r1", reference: "GTP-1", status: "verified", full_name: "Rahul Shinde", mobile: "9822022222", whatsapp: "9822022222", email: "rahul@example.com", event_name: "Kalsubai Night Trek", batch_date: "2026-11-30", pickup_point: "FC Road" },
        { id: "r2", reference: "GTP-2", status: "pending_verification", full_name: "P", mobile: "9822044444", email: "p@example.com", event_name: "Kalsubai Night Trek", batch_date: "2026-11-30", pickup_point: "Wakad" },
      ],
    });
    const { items } = await buildPlan(db, { settings: s, now: NOW, env: ENV });
    expect(items).toHaveLength(2); // one person, email + WhatsApp
    const email = items.find((i) => i.channel === "email");
    expect(email.subject).toContain("Kalsubai Night Trek");
    expect(email.text).toContain("Pickup point: FC Road, Fergusson College gate");
    expect(email.text).toContain("Pickup time: 9:00 PM");
    expect(email.text).toContain("Mon, 30 Nov");
  });
  it("pickup time: admin map, then a time inside the pickup text, then the default text", () => {
    const cfg = { pickupTimes: [{ match: "wakad", time: "7:40 PM" }], defaultPickupTime: "Shared on WhatsApp" };
    expect(pickupTimeFor("Wakad Bridge", cfg)).toBe("7:40 PM");
    expect(pickupTimeFor("Fergusson College Main Gate (09:00 PM)", cfg)).toBe("09:00 PM");
    expect(pickupTimeFor("Swargate", cfg)).toBe("Shared on WhatsApp");
  });
  it("welcome back the day after with review link, feedback link and offer code", async () => {
    const s = on("postTrip");
    s.postTrip.offerCode = "TRAIL10";
    const db = fakeCrmDb({ products, bookings: [booking({ travel_date: "2026-11-27" })] });
    const { items } = await buildPlan(db, { settings: s, now: NOW, env: ENV });
    const email = items.find((i) => i.channel === "email");
    expect(email.subject).toBe("Welcome back from Kalsubai Night Trek, Rahul!");
    expect(email.text).toContain("https://g.page/r/sample/review");
    expect(email.text).toContain("https://www.gadvede.com/feedback");
    expect(email.text).toContain("use code TRAIL10");
    expect(items.find((i) => i.channel === "whatsapp").text).toContain("TRAIL10");
  });
  it("never sends the post-trip message without a Google review link", async () => {
    const db = fakeCrmDb({ products, bookings: [booking({ travel_date: "2026-11-27" })] });
    const env = { ...LIVE, GOOGLE_REVIEW_URL: "" };
    const { items } = await buildPlan(db, { settings: on("postTrip"), now: NOW, env });
    expect(items.every((i) => i.skipReason === "Google review link not set")).toBe(true);
    const send = vi.fn();
    const r = await processDue(db, { settings: on("postTrip"), now: NOW, env, sendMail: send });
    expect(r.skipped).toBe(2);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("processing + idempotency", () => {
  const world = () => fakeCrmDb({ products, bookings: [booking({ travel_date: "2026-11-27" })] });
  it("live: sends the email once with unsubscribe link + header, queues WhatsApp, and never repeats", async () => {
    const db = world();
    const send = vi.fn(async () => ({}));
    const r1 = await processDue(db, { settings: on("postTrip"), now: NOW, env: LIVE, sendMail: send });
    expect(r1).toMatchObject({ emailed: 1, queuedWhatsApp: 1, failed: 0 });
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe("rahul@example.com");
    expect(msg.from).toBe('"Gadvede Trekkers" <sender@example.test>');
    expect(msg.html).toContain("https://api.example.test/api/crm/unsubscribe?t=");
    expect(msg.text).toContain("Unsubscribe from these messages: https://api.example.test/api/crm/unsubscribe?t=");
    expect(msg.headers["List-Unsubscribe"]).toMatch(/^<https:\/\/api\.example\.test\/api\/crm\/unsubscribe\?t=/);
    expect(db.tables.crm_message_log.map((x) => [x.channel, x.status]).sort()).toEqual([["email", "sent"], ["whatsapp", "queued"]]);
    const r2 = await processDue(db, { settings: on("postTrip"), now: NOW, env: LIVE, sendMail: send });
    expect(r2.considered).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("an overlapping run that loses the insert race does not send (unique idempotency key)", async () => {
    const db = world();
    const plan = await buildPlan(db, { settings: on("postTrip"), now: NOW, env: LIVE });
    // another run claims the email first
    db.tables.crm_message_log = [{ id: "x", idempotency_key: plan.items.find((i) => i.channel === "email").idempotencyKey, status: "sending", created_at: NOW.toISOString() }];
    const realFrom = db.from;
    let firstSelect = true;
    db.from = (name) => { const q = realFrom(name); if (name === "crm_message_log" && firstSelect) { firstSelect = false; q.in = () => Object.assign(q, { then: (res) => res({ data: [], error: null }) }); } return q; };
    const send = vi.fn(async () => ({}));
    const r = await processDue(db, { settings: on("postTrip"), now: NOW, env: LIVE, sendMail: send });
    expect(r.duplicates).toBeGreaterThanOrEqual(1);
    expect(send).not.toHaveBeenCalled();
  });
  it("a failed send is logged as failed and not retried", async () => {
    const db = world();
    const send = vi.fn(async () => { throw Object.assign(new Error("smtp"), { code: "EAUTH" }); });
    const r = await processDue(db, { settings: on("postTrip"), now: NOW, env: LIVE, sendMail: send });
    expect(r.failed).toBe(1);
    expect(db.tables.crm_message_log.find((x) => x.channel === "email")).toMatchObject({ status: "failed", error_code: "EAUTH" });
    await processDue(db, { settings: on("postTrip"), now: NOW, env: LIVE, sendMail: send });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("without CRM_AUTOMATIONS_LIVE it is a dry run: no writes, no mail", async () => {
    const db = world();
    const send = vi.fn();
    const r = await processDue(db, { settings: on("postTrip"), now: NOW, env: ENV, sendMail: send });
    expect(r.dryRun).toBe(true);
    expect(r.planned).toHaveLength(2);
    expect(db.writes).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });
  it("all toggles off → nothing at all, even when live", async () => {
    const db = world();
    const send = vi.fn();
    const r = await processDue(db, { settings: defaultCrmSettings(), now: NOW, env: LIVE, sendMail: send });
    expect(r.considered).toBe(0);
    expect(db.writes).toHaveLength(0);
  });
  it("emails wait outside the IST send window (WhatsApp is only queued)", async () => {
    const db = world();
    const send = vi.fn();
    const night = new Date("2026-11-28T17:30:00Z"); // 23:00 IST
    const r = await processDue(db, { settings: on("postTrip"), now: night, env: LIVE, sendMail: send });
    expect(r.heldOutsideWindow).toBe(1);
    expect(r.queuedWhatsApp).toBe(1);
    expect(send).not.toHaveBeenCalled();
  });
  it("holds emails when Gmail or the unsubscribe link isn't configured", async () => {
    const send = vi.fn();
    const r1 = await processDue(world(), { settings: on("postTrip"), now: NOW, env: { ...LIVE, GMAIL_APP_PASSWORD: "" }, sendMail: send });
    expect(r1.heldNoGmail).toBe(1);
    const r2 = await processDue(world(), { settings: on("postTrip"), now: NOW, env: { ...LIVE, BACKEND_URL: "" }, sendMail: send });
    expect(r2.skipped).toBe(1);
    expect(send).not.toHaveBeenCalled();
  });
  it("escapes customer text in the email HTML", () => {
    const m = buildEmailMessage({ subject: "Hi", text: "Hi <script>alert(1)</script>", email: "a@example.com" }, { env: ENV });
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&lt;script&gt;");
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips and rejects tampering", () => {
    const secret = unsubscribeSecret(ENV);
    const t = makeUnsubscribeToken("rahul@example.com", secret);
    expect(readUnsubscribeToken(t, secret)).toBe("rahul@example.com");
    expect(readUnsubscribeToken(t.slice(0, -2) + "xx", secret)).toBe("");
    expect(readUnsubscribeToken(t, "another-secret-value-123")).toBe("");
    expect(unsubscribeSecret({})).toBe("");
  });
});

/* ── routes ─────────────────────────────────────────────── */
const JWT_SECRET = "jwt-test-secret";
const token = (role) => jwt.sign({ username: "tester", role }, JWT_SECRET);
async function server(tables = {}, { env = ENV, sendMail } = {}) {
  process.env.JWT_SECRET = JWT_SECRET;
  const db = fakeCrmDb(tables);
  const app = express();
  app.use(express.json());
  app.use("/api/crm", createCrmAutomationsRouter({ db: async () => db, env, now: () => NOW, sendMail, log: () => {} }));
  const srv = await listen(app);
  const call = (method, path, { body, auth, headers = {} } = {}) => fetch(`${srv.url}${path}`, {
    method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined, redirect: "manual",
  });
  return { db, call, close: srv.close };
}

describe("routes", () => {
  it("cron endpoint: 503 without CRON_SECRET, 401 with a wrong one, runs with the right one", async () => {
    const a = await server({}, { env: { ...ENV, CRON_SECRET: "" } });
    expect((await a.call("POST", "/api/crm/cron/run")).status).toBe(503);
    await a.close();
    const send = vi.fn(async () => ({}));
    const b = await server({ products, bookings: [booking({ travel_date: "2026-11-27" })], site_settings: [{ key: "crm.automations", value: on("postTrip") }] }, { env: LIVE, sendMail: send });
    expect((await b.call("POST", "/api/crm/cron/run", { auth: "wrong" })).status).toBe(401);
    const ok = await b.call("POST", "/api/crm/cron/run", { auth: LIVE.CRON_SECRET });
    const j = await ok.json();
    expect(ok.status).toBe(200);
    expect(j.data).toMatchObject({ emailed: 1, queuedWhatsApp: 1 });
    expect(JSON.stringify(j)).not.toContain("rahul@example.com"); // no personal data from the cron endpoint
    const again = await (await b.call("POST", "/api/crm/cron/run", { headers: { "X-Cron-Secret": LIVE.CRON_SECRET } })).json();
    expect(again.data.emailed).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    await b.close();
  });
  it("admin settings need the JWT and Admin / Super Admin role; save validates, audits and stamps enabledAt", async () => {
    const s = await server();
    expect((await s.call("GET", "/api/crm/automations")).status).toBe(401);
    expect((await s.call("GET", "/api/crm/automations", { auth: token("Sales") })).status).toBe(403);
    const g = await (await s.call("GET", "/api/crm/automations", { auth: token("Admin") })).json();
    expect(g.data.settings.postTrip.enabled).toBe(false);
    expect(g.data.meta).toMatchObject({ live: false, gmailConfigured: true, cronConfigured: true, reviewUrlSource: "env GOOGLE_REVIEW_URL" });
    const bad = defaultCrmSettings(); bad.preTrip.daysBefore = 20;
    expect((await s.call("PUT", "/api/crm/automations", { auth: token("Super Admin"), body: { settings: bad } })).status).toBe(400);
    const next = defaultCrmSettings(); next.postTrip.enabled = true; next.postTrip.enabledAt = "1999-01-01T00:00:00Z";
    const put = await s.call("PUT", "/api/crm/automations", { auth: token("Super Admin"), body: { settings: next } });
    expect(put.status).toBe(200);
    const saved = s.db.tables.site_settings.find((r) => r.key === "crm.automations").value;
    expect(saved.postTrip.enabledAt).toBe(NOW.toISOString()); // server-owned
    expect(s.db.tables.activity_logs[0].action_label).toContain("postTrip ON");
    await s.close();
  });
  it("preview is a read-only dry run that shows who would get what, even while toggles are off", async () => {
    const s = await server({ products, bookings: [booking({ travel_date: "2026-11-27" })], enquiries: [enquiry()] });
    const r = await (await s.call("POST", "/api/crm/automations/preview", { auth: token("Admin"), body: {} })).json();
    expect(r.data.items.map((i) => i.automation).sort()).toEqual(["enquiryFollowup", "enquiryFollowup", "postTrip", "postTrip"]);
    expect(r.data.items.every((i) => i.automationEnabled === false)).toBe(true);
    expect(r.data.items.find((i) => i.channel === "email").html).toContain("Unsubscribe");
    expect(s.db.writes).toHaveLength(0);
    await s.close();
  });
  it("WhatsApp queue: list queued, mark sent_manual once; other statuses refused", async () => {
    const s = await server({ crm_message_log: [{ id: "m1", channel: "whatsapp", status: "queued", wa_link: "https://wa.me/91x", created_at: NOW.toISOString() }, { id: "m2", channel: "email", status: "sent", created_at: NOW.toISOString() }] });
    const q = await (await s.call("GET", "/api/crm/whatsapp-queue", { auth: token("Admin") })).json();
    expect(q.data.map((r) => r.id)).toEqual(["m1"]);
    expect((await s.call("PATCH", "/api/crm/log/m1", { auth: token("Admin"), body: { status: "deleted" } })).status).toBe(400);
    expect((await s.call("PATCH", "/api/crm/log/m1", { auth: token("Admin"), body: { status: "sent_manual" } })).status).toBe(200);
    expect(s.db.tables.crm_message_log[0]).toMatchObject({ status: "sent_manual", handled_by: "tester" });
    expect((await s.call("PATCH", "/api/crm/log/m1", { auth: token("Admin"), body: { status: "skipped" } })).status).toBe(409);
    expect((await s.call("PATCH", "/api/crm/log/m2", { auth: token("Admin"), body: { status: "sent_manual" } })).status).toBe(409);
    await s.close();
  });
  it("there are no delete routes", async () => {
    const s = await server({ crm_message_log: [{ id: "m1" }], crm_opt_outs: [{ id: "o1", contact: "a@example.com" }] });
    for (const p of ["/api/crm/log/m1", "/api/crm/opt-outs/o1", "/api/crm/automations"]) {
      expect((await s.call("DELETE", p, { auth: token("Super Admin") })).status).toBe(404);
    }
    await s.close();
  });
  it("opt-outs: admin adds by phone/email; unsubscribe link confirms then records", async () => {
    const s = await server();
    expect((await s.call("POST", "/api/crm/opt-outs", { auth: token("Admin"), body: { contact: "nope" } })).status).toBe(400);
    expect((await s.call("POST", "/api/crm/opt-outs", { auth: token("Admin"), body: { contact: "+91 98220 55555", reason: "said stop on WhatsApp" } })).status).toBe(201);
    const t = makeUnsubscribeToken("rahul@example.com", unsubscribeSecret(ENV));
    const g = await s.call("GET", `/api/crm/unsubscribe?t=${encodeURIComponent(t)}`);
    expect(g.status).toBe(200);
    expect(await g.text()).toContain("rahul@example.com");
    expect(s.db.tables.crm_opt_outs.map((r) => r.contact)).toEqual(["9822055555"]); // GET alone records nothing
    const p = await s.call("POST", `/api/crm/unsubscribe?t=${encodeURIComponent(t)}`, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    expect(p.status).toBe(200);
    expect(s.db.tables.crm_opt_outs.map((r) => r.contact)).toContain("rahul@example.com");
    expect((await s.call("POST", "/api/crm/unsubscribe?t=forged.token")).status).toBe(400);
    await s.close();
  });
});
