/**
 * Instagram feed, WhatsApp Cloud API, Instagram/WhatsApp → CRM leads, integrations status (migration 021).
 * Every Meta call is mocked: fetch is a spy, tokens are random test strings, nothing leaves the machine.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import { fakeCrmDb } from "./support/fakeCrmDb.js";
import { listen } from "./support/fakeSupabase.js";
import { captionSnippet, createInstagramFeed, fetchInstagramMedia, refreshInstagramToken, toPublicItem } from "../services/instagramFeed.js";
import createSocialRouter from "../routes/social.routes.js";
import { notifyBookingConfirmed, notifyPaymentVerified, sendLoggedTemplate, sendTemplate } from "../services/whatsappCloud.js";
import createMetaWebhookRouter, { parsePayload } from "../routes/metaWebhook.routes.js";
import { isStopMessage, upsertSocialLead } from "../services/socialLeads.js";
import createIntegrationsRouter, { integrationsStatus } from "../routes/integrations.routes.js";
import { defaultCrmSettings } from "../../../shared/crmAutomations.js";
import { WHATSAPP_TEMPLATES, renderWhatsappTemplate } from "../../../shared/whatsappTemplates.js";
import { buildPlan, processDue } from "../services/crmAutomations.js";

const rnd = (p) => `${p}-${crypto.randomBytes(12).toString("hex")}`;
const IG_TOKEN = rnd("igtok");
const WA_TOKEN = rnd("watok");
const APP_SECRET = rnd("appsecret");
const VERIFY = rnd("verify");
const IG_ENV = { IG_USER_ID: "17841400000000001", IG_ACCESS_TOKEN: IG_TOKEN };
const WA_ENV = { WHATSAPP_PHONE_NUMBER_ID: "109876543210987", WHATSAPP_ACCESS_TOKEN: WA_TOKEN, WHATSAPP_TEMPLATE_BOOKING_CONFIRMATION: "gadvede_booking_confirmation", WHATSAPP_TEMPLATE_PRE_TRIP_REMINDER: "gadvede_pre_trip_reminder" };
const WA_LIVE = { ...WA_ENV, WHATSAPP_API_LIVE: "true" };
const PHONE = "9822033333"; // sample customer

const json = (body, { ok = true, status = 200 } = {}) => ({ ok, status, json: async () => body });
const MEDIA = [
  { id: "1", caption: "Kalsubai sunrise batch! #kalsubai #treksnearpune @friend", media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/a.jpg", permalink: "https://www.instagram.com/p/AbC123/", timestamp: "2026-11-20T03:00:00+0000", like_count: 50, username: "gadvede_trekkers" },
  { id: "2", caption: "Harishchandragad reel", media_type: "VIDEO", media_product_type: "REELS", media_url: "https://scontent.cdninstagram.com/v.mp4", thumbnail_url: "https://scontent.cdninstagram.com/t.jpg", permalink: "https://www.instagram.com/reel/XyZ789/", timestamp: "2026-11-19T03:00:00+0000" },
  { id: "3", media_type: "CAROUSEL_ALBUM", media_url: "https://scontent.cdninstagram.com/c.jpg", permalink: "https://www.instagram.com/p/Car0001/", timestamp: "2026-11-18T03:00:00+0000" },
  { id: "4", media_type: "IMAGE", media_url: "http://insecure.example/x.jpg", permalink: "https://www.instagram.com/p/Bad0001/" },
  { id: "5", media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/e.jpg", permalink: "https://evil.example/p/1/" },
];

const servers = [];
afterEach(async () => { while (servers.length) await servers.pop().close(); });

/* ── Instagram feed ───────────────────────────────────────── */
describe("Instagram feed", () => {
  it("returns only safe fields; reels use the thumbnail; bad links/images are dropped", () => {
    const items = MEDIA.map(toPublicItem).filter(Boolean);
    expect(items).toHaveLength(3);
    expect(Object.keys(items[0]).sort()).toEqual(["caption", "image", "permalink", "timestamp", "type"]);
    expect(items[0]).toMatchObject({ type: "image", caption: "Kalsubai sunrise batch!" });
    expect(items[1]).toMatchObject({ type: "reel", image: "https://scontent.cdninstagram.com/t.jpg" });
    expect(items[2].type).toBe("carousel");
    expect(JSON.stringify(items)).not.toMatch(/like_count|username|"id"/);
    expect(captionSnippet("word ".repeat(60)).length).toBeLessThanOrEqual(121);
  });

  it("calls the Graph API with the token in the Authorization header, never in the URL", async () => {
    const fetchImpl = vi.fn(async () => json({ data: MEDIA }));
    await fetchInstagramMedia({ env: IG_ENV, fetchImpl });
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toMatch(/^https:\/\/graph\.instagram\.com\/v23\.0\/17841400000000001\/media\?fields=/);
    expect(url).not.toContain(IG_TOKEN);
    expect(opts.headers.Authorization).toBe(`Bearer ${IG_TOKEN}`);
  });

  it("caches for about an hour and serves the last good feed when Instagram fails", async () => {
    let t = 1_000_000;
    let fail = false;
    const fetchImpl = vi.fn(async () => (fail ? json({}, { ok: false, status: 500 }) : json({ data: MEDIA })));
    const getFeed = createInstagramFeed({ env: IG_ENV, fetchImpl, now: () => t });
    expect((await getFeed()).items).toHaveLength(3);
    t += 59 * 60_000; await getFeed();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    t += 2 * 60_000; fail = true;
    const stale = await getFeed();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(stale.items).toHaveLength(3);
    await getFeed(); // failed refresh backs off 5 minutes instead of retrying on every request
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("not configured → empty, no Meta call; the public endpoint never leaks the token", async () => {
    const fetchImpl = vi.fn();
    expect(await createInstagramFeed({ env: {}, fetchImpl })()).toMatchObject({ configured: false, items: [] });
    expect(fetchImpl).not.toHaveBeenCalled();

    const app = express();
    app.use("/api/social", createSocialRouter({ getFeed: createInstagramFeed({ env: IG_ENV, fetchImpl: async () => json({ data: MEDIA }) }) }));
    const srv = await listen(app); servers.push(srv);
    const r = await fetch(`${srv.url}/api/social/instagram/feed`);
    const text = await r.text();
    expect(r.status).toBe(200);
    expect(JSON.parse(text).data.items).toHaveLength(3);
    expect(text).not.toContain(IG_TOKEN);
    expect(text).not.toContain("17841400000000001");
    expect(r.headers.get("cache-control")).toMatch(/max-age=900/);
  });

  it("token refresh helper uses the ig_refresh_token endpoint (mocked)", async () => {
    const fetchImpl = vi.fn(async () => json({ access_token: "new-token-value-123456789", expires_in: 5_184_000 }));
    const r = await refreshInstagramToken({ env: IG_ENV, fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toMatch(/^https:\/\/graph\.instagram\.com\/refresh_access_token\?grant_type=ig_refresh_token&access_token=/);
    expect(r.expiresInDays).toBe(60);
    await expect(refreshInstagramToken({ env: { ...IG_ENV, IG_GRAPH_HOST: "graph.facebook.com" }, fetchImpl })).rejects.toMatchObject({ code: "wrong_host" });
  });
});

/* ── WhatsApp Cloud API ───────────────────────────────────── */
describe("WhatsApp Cloud API", () => {
  it("dry run unless WHATSAPP_API_LIVE=true: no Meta call", async () => {
    const fetchImpl = vi.fn();
    expect(await sendTemplate(PHONE, "gadvede_booking_confirmation", ["A"], { env: WA_ENV, fetchImpl })).toEqual({ dryRun: true });
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(sendTemplate(PHONE, "x", [], { env: {}, fetchImpl })).rejects.toMatchObject({ code: "not_configured" });
    await expect(sendTemplate("12345", "x", [], { env: WA_LIVE, fetchImpl })).rejects.toMatchObject({ code: "bad_phone" });
  });

  it("live: posts a template message to /{phone-number-id}/messages with cleaned parameters", async () => {
    const fetchImpl = vi.fn(async () => json({ messages: [{ id: "wamid.TEST1" }] }));
    const r = await sendTemplate(`+91 ${PHONE}`, "gadvede_booking_confirmation", ["Rahul", "Kalsubai\nTrek", ""], { env: WA_LIVE, fetchImpl });
    expect(r.messageId).toBe("wamid.TEST1");
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v23.0/109876543210987/messages");
    expect(opts.headers.Authorization).toBe(`Bearer ${WA_TOKEN}`);
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({ messaging_product: "whatsapp", to: `91${PHONE}`, type: "template", template: { name: "gadvede_booking_confirmation", language: { code: "en" } } });
    expect(body.template.components[0].parameters.map((p) => p.text)).toEqual(["Rahul", "Kalsubai Trek", "-"]);
  });

  it("Graph errors surface as a code only", async () => {
    const fetchImpl = async () => json({ error: { code: 131026, message: `secret ${WA_TOKEN}` } }, { ok: false, status: 400 });
    const e = await sendTemplate(PHONE, "t", [], { env: WA_LIVE, fetchImpl }).catch((x) => x);
    expect(e.code).toBe("graph_131026");
    expect(String(e.message)).not.toContain(WA_TOKEN);
  });

  const msg = { automation: "bookingConfirmation", templateId: "bookingConfirmation", sourceType: "booking", sourceId: "b1", phone: PHONE, name: "Rahul", params: ["Rahul", "Kalsubai", "Sat, 6 Dec 2026", "GT-1"] };

  it("logged send: dry run writes nothing; opt-outs are respected", async () => {
    const db = fakeCrmDb({ crm_opt_outs: [], crm_message_log: [] });
    const fetchImpl = vi.fn(); const logs = [];
    expect((await sendLoggedTemplate(db, msg, { env: WA_ENV, fetchImpl, log: (m) => logs.push(m) })).status).toBe("dry_run");
    expect(db.writes).toHaveLength(0);
    expect(logs.join("\n")).not.toContain(PHONE);
    const opted = fakeCrmDb({ crm_opt_outs: [{ contact: PHONE }], crm_message_log: [] });
    expect((await sendLoggedTemplate(opted, msg, { env: WA_LIVE, fetchImpl, log: () => {} })).status).toBe("opted_out");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect((await sendLoggedTemplate(db, msg, { env: {}, fetchImpl })).status).toBe("not_configured");
  });

  it("logged send: at most once per booking (unique idempotency key); a failed send is recorded and not retried", async () => {
    const db = fakeCrmDb({ crm_opt_outs: [], crm_message_log: [] });
    const fetchImpl = vi.fn(async () => json({ messages: [{ id: "wamid.OK" }] }));
    expect((await sendLoggedTemplate(db, msg, { env: WA_LIVE, fetchImpl, log: () => {} })).status).toBe("sent");
    expect((await sendLoggedTemplate(db, msg, { env: WA_LIVE, fetchImpl, log: () => {} })).status).toBe("duplicate");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const row = db.tables.crm_message_log[0];
    expect(row).toMatchObject({ idempotency_key: "bookingConfirmation:booking:b1:whatsapp_api", channel: "whatsapp_api", status: "sent", provider_message_id: "wamid.OK", template_name: "gadvede_booking_confirmation", recipient_phone: PHONE });
    expect(row.body).toBe(renderWhatsappTemplate("bookingConfirmation", msg.params));

    const db2 = fakeCrmDb({ crm_opt_outs: [], crm_message_log: [] });
    const failing = vi.fn(async () => json({ error: { code: 1 } }, { ok: false, status: 500 }));
    expect((await sendLoggedTemplate(db2, msg, { env: WA_LIVE, fetchImpl: failing, log: () => {} })).status).toBe("failed");
    expect((await sendLoggedTemplate(db2, msg, { env: WA_LIVE, fetchImpl: failing, log: () => {} })).status).toBe("duplicate");
    expect(failing).toHaveBeenCalledTimes(1);
    expect(db2.tables.crm_message_log[0]).toMatchObject({ status: "failed", error_code: "graph_1" });
  });

  it("before migration 020/021 nothing is sent", async () => {
    const db = fakeCrmDb({}, { failInsert: { crm_message_log: { message: 'relation "crm_message_log" does not exist' } } });
    const fetchImpl = vi.fn();
    expect((await sendLoggedTemplate(db, msg, { env: WA_LIVE, fetchImpl, log: () => {} })).status).toBe("log_unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("booking confirmed + payment verified fill the confirmation template", async () => {
    const db = fakeCrmDb({
      crm_opt_outs: [], crm_message_log: [],
      bookings: [{ id: "b9", booking_code: "GT-2026-000009", product_id: "p1", lead_first_name: "Rahul", lead_last_name: "Shinde", lead_phone: PHONE, lead_whatsapp: "", travel_date: "2026-12-06" }],
      products: [{ id: "p1", name: "Kalsubai Night Trek" }],
    });
    const fetchImpl = vi.fn(async () => json({ messages: [{ id: "wamid.B" }] }));
    expect((await notifyBookingConfirmed(db, "b9", { env: WA_LIVE, fetchImpl, log: () => {} })).status).toBe("sent");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).template.components[0].parameters.map((p) => p.text))
      .toEqual(["Rahul", "Kalsubai Night Trek", "Sun, 6 Dec, 2026", "GT-2026-000009"]);
    expect((await notifyPaymentVerified(db, { id: "r1", full_name: "Asha Patil", mobile: PHONE, event_name: "Harishchandragad Trek", batch_date: "2026-12-13", reference: "PR-1" }, { env: WA_LIVE, fetchImpl, log: () => {} })).status).toBe("sent");
    expect(db.tables.crm_message_log.map((r) => r.idempotency_key)).toEqual(["bookingConfirmation:booking:b9:whatsapp_api", "paymentVerified:payment_registration:r1:whatsapp_api"]);
  });

  it("template drafts: every {{n}} has a sample and a parameter name", () => {
    for (const t of Object.values(WHATSAPP_TEMPLATES)) {
      const n = Math.max(...[...t.body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])));
      expect(t.params).toHaveLength(n); expect(t.sample).toHaveLength(n);
      expect(t.body).not.toMatch(/https?:\/\//);
    }
  });
});

/* ── Webhook → CRM leads ──────────────────────────────────── */
const sign = (buf) => "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(buf).digest("hex");
const WA_MSG = (id, text, from = `91${PHONE}`) => ({ object: "whatsapp_business_account", entry: [{ id: "WABA1", changes: [{ field: "messages", value: {
  messaging_product: "whatsapp", metadata: { display_phone_number: "919856112727", phone_number_id: "109876543210987" },
  contacts: [{ wa_id: from, profile: { name: "Sneha K" } }],
  messages: [{ id, from, timestamp: "1764300000", type: "text", text: { body: text } }],
} }] }] });
const IG_DM = (mid, text, { echo = false, sender = "IGSID9001" } = {}) => ({ object: "instagram", entry: [{ id: "IGACC1", time: 1, messaging: [{ sender: { id: echo ? "IGACC1" : sender }, recipient: { id: echo ? sender : "IGACC1" }, timestamp: 1764300000000, message: { mid, text, ...(echo ? { is_echo: true } : {}) } }] }] });
const WA_STATUS = (id, status) => ({ object: "whatsapp_business_account", entry: [{ id: "WABA1", changes: [{ field: "messages", value: { statuses: [{ id, status, timestamp: "1764300000", recipient_id: `91${PHONE}` }] } }] }] });

describe("Meta webhook → CRM leads (Instagram DMs + WhatsApp)", () => {
  const saved = {};
  beforeEach(() => {
    for (const k of ["META_APP_SECRET", "META_VERIFY_TOKEN", "META_LEADS_TO_CRM"]) saved[k] = process.env[k];
    Object.assign(process.env, { META_APP_SECRET: APP_SECRET, META_VERIFY_TOKEN: VERIFY, META_LEADS_TO_CRM: "true" });
  });
  afterEach(() => { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });

  async function mk(tables = {}) {
    const db = fakeCrmDb({ meta_webhook_events: [], instagram_messages: [], whatsapp_messages: [], enquiries: [], crm_opt_outs: [], crm_message_log: [], ...tables },
      { unique: { meta_webhook_events: "dedupe_key", whatsapp_messages: "wamid", instagram_messages: "mid", crm_opt_outs: "contact", crm_message_log: "idempotency_key" } });
    const jobs = []; const logs = [];
    const lookupIgProfile = vi.fn(async () => ({ name: "Trek Fan", username: "trekfan" }));
    const router = createMetaWebhookRouter({ db: async () => db, fetchLead: async () => ({}), lookupIgProfile, log: (m) => logs.push(m), schedule: (fn) => jobs.push(fn()) });
    const app = express(); app.use("/api/v1/webhooks/meta", router);
    const srv = await listen(app); servers.push(srv);
    const post = async (payload, sig) => {
      const raw = Buffer.from(JSON.stringify(payload));
      const r = await fetch(`${srv.url}/api/v1/webhooks/meta`, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": sig ?? sign(raw) }, body: raw });
      await Promise.all(jobs);
      return r;
    };
    return { db, post, logs, lookupIgProfile };
  }

  it("parses WhatsApp messages and delivery statuses", () => {
    const ev = parsePayload(WA_MSG("wamid.A1", "Hi, Kalsubai dates?"))[0];
    expect(ev).toMatchObject({ kind: "whatsapp_message", dedupeKey: "wamid.A1".replace(/^/, "wa_msg:"), data: { wa_id: `91${PHONE}`, profile_name: "Sneha K", text: "Hi, Kalsubai dates?" } });
    expect(parsePayload(WA_STATUS("wamid.X", "read"))[0]).toMatchObject({ kind: "whatsapp_status", dedupeKey: "wa_status:wamid.X:read" });
  });

  it("rejects a bad X-Hub-Signature-256 and stores nothing", async () => {
    const { db, post } = await mk();
    expect((await post(WA_MSG("wamid.BAD", "hi"), "sha256=" + "0".repeat(64))).status).toBe(403);
    expect(db.writes).toHaveLength(0);
  });

  it("WhatsApp message → one 'whatsapp' enquiry; later messages update it; same wamid is stored once; never replies", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { db, post, logs } = await mk();
    fetchSpy.mockClear();
    expect((await post(WA_MSG("wamid.A1", "Hi, Kalsubai dates?"))).status).toBe(200);
    await post(WA_MSG("wamid.A1", "Hi, Kalsubai dates?")); // Meta retry
    await post(WA_MSG("wamid.A2", "And the price?"));
    expect(db.tables.whatsapp_messages.map((m) => m.wamid)).toEqual(["wamid.A1", "wamid.A2"]);
    expect(db.tables.enquiries).toHaveLength(1);
    expect(db.tables.enquiries[0]).toMatchObject({ source: "whatsapp", source_ref: `91${PHONE}`, phone: PHONE, name: "Sneha K", message: "Hi, Kalsubai dates?", status: "NEW_LEAD", tags: [] });
    const outgoing = fetchSpy.mock.calls.map(([u]) => String(u)).filter((u) => !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(u));
    expect(outgoing).toEqual([]); // nothing but our own test POSTs: no auto-reply, no Meta call
    expect(logs.join("\n")).not.toMatch(/Kalsubai dates|9822033333/);
    fetchSpy.mockRestore();
  });

  it("WhatsApp from a number that already has an open website enquiry updates that enquiry", async () => {
    const { db, post } = await mk({ enquiries: [{ id: "ENQ-WEB", name: "Sneha Kulkarni", phone: PHONE, status: "CONTACTED", tags: [], source: "website", archived_at: null, created_at: "2026-11-27T10:00:00Z" }] });
    await post(WA_MSG("wamid.B1", "Following up"));
    expect(db.tables.enquiries).toHaveLength(1);
    expect(db.tables.enquiries[0]).toMatchObject({ id: "ENQ-WEB", source: "website", name: "Sneha Kulkarni", status: "CONTACTED", tags: ["WhatsApp"] });
    expect(db.tables.enquiries[0].last_message_at).toBeTruthy();
  });

  it("a converted customer writing again becomes a new lead", async () => {
    const { db, post } = await mk({ enquiries: [{ id: "ENQ-OLD", name: "Sneha", phone: PHONE, status: "CONVERTED", tags: [], source: "whatsapp", source_ref: `91${PHONE}`, archived_at: null, created_at: "2026-10-01T10:00:00Z" }] });
    await post(WA_MSG("wamid.C1", "Next trek?"));
    expect(db.tables.enquiries).toHaveLength(2);
  });

  it("Instagram DM → 'instagram_dm' enquiry with @handle; echoes (our or Logout Studio's replies) are ignored", async () => {
    const { db, post, lookupIgProfile } = await mk();
    await post(IG_DM("mid.1", "Hi! Harishchandragad this weekend?"));
    await post(IG_DM("mid.2", "Auto reply from the automation", { echo: true }));
    await post(IG_DM("mid.3", "How much?"));
    expect(db.tables.instagram_messages).toHaveLength(3);
    expect(db.tables.enquiries).toHaveLength(1);
    expect(db.tables.enquiries[0]).toMatchObject({ source: "instagram_dm", source_ref: "IGSID9001", source_handle: "@trekfan", name: "Trek Fan", phone: null, message: "Hi! Harishchandragad this weekend?", tags: [] });
    expect(lookupIgProfile).toHaveBeenCalledTimes(1);
  });

  it("off by default: without META_LEADS_TO_CRM=true messages are stored but no enquiry is created", async () => {
    process.env.META_LEADS_TO_CRM = "";
    const { db, post } = await mk();
    await post(WA_MSG("wamid.D1", "hi")); await post(IG_DM("mid.D", "hi"));
    expect(db.tables.whatsapp_messages).toHaveLength(1);
    expect(db.tables.enquiries).toHaveLength(0);
  });

  it("STOP on WhatsApp records a CRM opt-out (and no reply)", async () => {
    expect(isStopMessage(" Stop ")).toBe(true); expect(isStopMessage("stop by tomorrow?")).toBe(false);
    const { db, post } = await mk();
    await post(WA_MSG("wamid.S1", "STOP"));
    expect(db.tables.crm_opt_outs).toEqual([expect.objectContaining({ contact: PHONE, source: "whatsapp_stop" })]);
    expect(db.tables.enquiries).toHaveLength(0);
  });

  it("delivery statuses only move forward on our sent messages", async () => {
    const { db, post } = await mk({ crm_message_log: [{ id: "l1", provider_message_id: "wamid.OUT", delivery_status: null }] });
    await post(WA_STATUS("wamid.OUT", "read"));
    await post(WA_STATUS("wamid.OUT", "delivered")); // late, lower rank
    expect(db.tables.crm_message_log[0].delivery_status).toBe("read");
  });

  it("two quick messages from a new person create exactly one enquiry", async () => {
    const db = fakeCrmDb({ enquiries: [] });
    await Promise.all([
      upsertSocialLead(db, { source: "whatsapp", ref: `91${PHONE}`, phone: `91${PHONE}`, text: "a" }),
      upsertSocialLead(db, { source: "whatsapp", ref: `91${PHONE}`, phone: `91${PHONE}`, text: "b" }),
    ]);
    expect(db.tables.enquiries).toHaveLength(1);
  });
});

/* ── Integrations status (admin) ──────────────────────────── */
describe("Settings → Integrations status", () => {
  const ALL = { ...IG_ENV, ...WA_ENV, META_APP_SECRET: APP_SECRET, META_VERIFY_TOKEN: VERIFY, META_LEADS_TO_CRM: "true", IG_TOKEN_EXPIRES_AT: "2027-01-20" };
  it("never contains a secret, only flags and the last 4 characters", () => {
    const text = JSON.stringify(integrationsStatus(ALL));
    for (const secret of [IG_TOKEN, WA_TOKEN, APP_SECRET, VERIFY]) {
      expect(text).not.toContain(secret);
      expect(text).not.toContain(secret.slice(0, 12));
    }
    const s = integrationsStatus(ALL);
    expect(s.instagramFeed).toMatchObject({ configured: true, token: `••••${IG_TOKEN.slice(-4)}` });
    expect(s.whatsappCloud).toMatchObject({ configured: true, live: false });
    expect(s.crmLeads).toMatchObject({ enabled: true, autoReply: false });
    expect(integrationsStatus({}).instagramFeed.token).toBe("");
  });
  it("needs an admin JWT with the Super Admin or Admin role; no write routes", async () => {
    const SECRET = "jwt-int-test"; process.env.JWT_SECRET = SECRET;
    const app = express(); app.use(express.json()); app.use("/api/settings/integrations", createIntegrationsRouter({ env: ALL }));
    const srv = await listen(app); servers.push(srv);
    const tok = (role) => jwt.sign({ username: "u", role }, SECRET);
    const get = (t) => fetch(`${srv.url}/api/settings/integrations/status`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
    expect((await get()).status).toBe(401);
    expect((await get(tok("Sales"))).status).toBe(403);
    expect((await get(tok("Admin"))).status).toBe(200);
    for (const method of ["PUT", "POST", "DELETE"]) {
      expect((await fetch(`${srv.url}/api/settings/integrations/status`, { method, headers: { Authorization: `Bearer ${tok("Super Admin")}` } })).status).toBe(404);
    }
  });
});

/* ── CRM pre-trip reminder via WhatsApp API ───────────────── */
describe("CRM pre-trip reminder: optional WhatsApp Cloud API channel", () => {
  const NOW = new Date("2026-11-28T06:30:00Z"); // 12:00 IST
  const CRM = { CRON_SECRET: "test-cron-secret-0123456789abcdef", BACKEND_URL: "https://api.example.test", GMAIL_USER: "s@example.test", GMAIL_APP_PASSWORD: "x" };
  const settings = () => {
    const s = defaultCrmSettings();
    s.preTrip.enabled = true; s.preTrip.enabledAt = "2026-11-01T00:00:00Z";
    s.preTrip.channels = { email: false, whatsapp: false, whatsappApi: true };
    return s;
  };
  const tables = () => ({
    bookings: [{ id: "b1", booking_code: "GT-1", product_id: "p1", status: "CONFIRMED", payment_status: "PAID", lead_first_name: "Rahul", lead_last_name: "S", lead_phone: PHONE, lead_whatsapp: "", lead_email: "", travel_date: "2026-11-30", pickup_location: "FC Road (9:00 PM)" }],
    products: [{ id: "p1", name: "Kalsubai Night Trek" }], payment_registrations: [], crm_opt_outs: [], crm_message_log: [],
  });

  it("is OFF by default and held when the API/template isn't set", async () => {
    expect(defaultCrmSettings().preTrip.channels.whatsappApi).toBe(false);
    const { items } = await buildPlan(fakeCrmDb(tables()), { settings: settings(), now: NOW, env: CRM });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ channel: "whatsapp_api", skipReason: "WhatsApp Cloud API or template not set" });
    expect(items[0].text).toContain("Pickup point: FC Road (9:00 PM)");
  });

  it("needs CRM_AUTOMATIONS_LIVE and WHATSAPP_API_LIVE; then sends once", async () => {
    const fetchImpl = vi.fn(async () => json({ messages: [{ id: "wamid.PT" }] }));
    const db = fakeCrmDb(tables());
    const dry = await processDue(db, { settings: settings(), now: NOW, env: { ...CRM, ...WA_ENV, CRM_AUTOMATIONS_LIVE: "true" }, fetchImpl });
    expect(dry.heldWhatsAppApiDryRun).toBe(1);
    expect(db.writes).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();

    const env = { ...CRM, ...WA_LIVE, CRM_AUTOMATIONS_LIVE: "true" };
    expect((await processDue(db, { settings: settings(), now: NOW, env, fetchImpl })).sentWhatsAppApi).toBe(1);
    await processDue(db, { settings: settings(), now: NOW, env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(db.tables.crm_message_log[0]).toMatchObject({ automation: "preTrip", channel: "whatsapp_api", status: "sent", template_name: "gadvede_pre_trip_reminder" });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).template.components[0].parameters.map((p) => p.text))
      .toEqual(["Rahul", "Kalsubai Night Trek", "Mon, 30 Nov, 2026", "FC Road (9:00 PM)", "9:00 PM"]);
  });
});
