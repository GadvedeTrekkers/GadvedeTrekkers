import { afterEach, beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { fakeDb, listen } from "./support/fakeSupabase.js";
import createMetaWebhookRouter, { parsePayload, mapLeadFields, verifySignature, maskPhone, maskEmail, defaultFetchLead } from "../routes/metaWebhook.routes.js";

const SECRET = "test-app-secret-" + crypto.randomBytes(8).toString("hex");
const VERIFY = "test-verify-" + crypto.randomBytes(8).toString("hex");
const PAGE = "test-page-token-" + crypto.randomBytes(8).toString("hex");
beforeAll(() => { Object.assign(process.env, { META_APP_SECRET: SECRET, META_VERIFY_TOKEN: VERIFY, META_PAGE_TOKEN: PAGE, META_GRAPH_VERSION: "v23.0" }); });

const sign = (buf) => "sha256=" + crypto.createHmac("sha256", SECRET).update(buf).digest("hex");
const DM = { object: "instagram", entry: [{ id: "IG1", time: 1, messaging: [{ sender: { id: "S1" }, recipient: { id: "IG1" }, timestamp: 1764000000000, message: { mid: "MID1", text: "Kalsubai dates?", attachments: [{ type: "image", payload: { url: "https://x/y.jpg" } }] } }] }] };
const COMMENT = { object: "instagram", entry: [{ id: "IG1", time: 1, changes: [{ field: "comments", value: { id: "C1", text: "Price?", from: { id: "U1", username: "trekfan" }, media: { id: "M1", media_product_type: "REELS" } } }] }] };
const LEAD = { object: "page", entry: [{ id: "P1", time: 1, changes: [{ field: "leadgen", value: { leadgen_id: "L1", form_id: "F1", page_id: "P1", ad_id: "A1", adgroup_id: "G1", created_time: 1764000000 } }] }] };
const GRAPH_LEAD = { id: "L1", field_data: [
  { name: "full_name", values: ["Asha Patil"] }, { name: "phone_number", values: ["+919812345678"] },
  { name: "email", values: ["asha@example.com"] }, { name: "which_trek_are_you_interested_in?", values: ["Kalsubai"] },
  { name: "group_size", values: ["4"] }] };

const servers = [];
afterEach(async () => { while (servers.length) await servers.pop().close(); });

/** Mirrors app.js: webhook mounted (both paths) BEFORE a CORS allow-list that rejects unknown origins, and express.json. */
async function mk({ fetchLead, db: sharedDb } = {}) {
  const db = sharedDb ?? fakeDb({ meta_webhook_events: [], instagram_messages: [], instagram_comments: [], meta_leads: [] });
  const logs = []; const jobs = []; const graphCalls = [];
  const fl = fetchLead ?? (async (id) => { graphCalls.push(id); return GRAPH_LEAD; });
  const router = createMetaWebhookRouter({ db: async () => db, fetchLead: fl, log: (m) => logs.push(m), schedule: (fn) => jobs.push(fn()) });
  const app = express();
  app.use("/api/v1/webhooks/meta", router);
  app.use("/api/webhooks/meta", router);
  app.use(cors({ origin: (o, cb) => (!o || o === "https://www.gadvede.com" ? cb(null, true) : cb(new Error("CORS"))) }));
  app.use(express.json());
  const srv = await listen(app); servers.push(srv);
  return { url: srv.url, db, logs, graphCalls, flush: () => Promise.all(jobs) };
}
const V1 = "/api/v1/webhooks/meta";
const post = (url, payload, { sig, path = V1, origin } = {}) => {
  const raw = Buffer.from(JSON.stringify(payload));
  const headers = { "Content-Type": "application/json" };
  if (sig !== null) headers["X-Hub-Signature-256"] = sig ?? sign(raw);
  if (origin) headers.Origin = origin;
  return fetch(url + path, { method: "POST", headers, body: raw });
};
const verify = (url, q, path = V1) => fetch(`${url}${path}?${new URLSearchParams(q)}`);

describe("Meta webhook — verification (GET)", () => {
  it("returns the raw challenge as text/plain for the right token; 403 otherwise; /api alias", async () => {
    const { url } = await mk();
    const ok = await verify(url, { "hub.mode": "subscribe", "hub.verify_token": VERIFY, "hub.challenge": "1158201444" });
    expect(ok.status).toBe(200); expect(await ok.text()).toBe("1158201444"); expect(ok.headers.get("content-type")).toMatch(/text\/plain/);
    expect(await (await verify(url, { "hub.mode": "subscribe", "hub.verify_token": VERIFY, "hub.challenge": "abc" }, "/api/webhooks/meta")).text()).toBe("abc");
    for (const q of [{ "hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "x" }, { "hub.mode": "unsubscribe", "hub.verify_token": VERIFY, "hub.challenge": "x" }, {}]) {
      expect((await verify(url, q)).status, JSON.stringify(q)).toBe(403);
    }
  });
  it("403 when META_VERIFY_TOKEN is not configured", async () => {
    const saved = process.env.META_VERIFY_TOKEN; process.env.META_VERIFY_TOKEN = "";
    const { url } = await mk();
    expect((await verify(url, { "hub.mode": "subscribe", "hub.verify_token": "", "hub.challenge": "x" })).status).toBe(403);
    process.env.META_VERIFY_TOKEN = saved;
  });
});

describe("Meta webhook — signature + CORS exemption (POST)", () => {
  it("valid => 200 EVENT_RECEIVED; invalid/missing/short/other-body => 403 and nothing stored", async () => {
    const { url, db, flush } = await mk();
    const r = await post(url, DM); expect(r.status).toBe(200); expect(await r.text()).toBe("EVENT_RECEIVED");
    for (const sig of ["sha256=" + "a".repeat(64), "sha256=abc", "md5=xyz", null]) expect((await post(url, COMMENT, { sig })).status, String(sig)).toBe(403);
    expect((await post(url, COMMENT, { sig: sign(Buffer.from("{}")) })).status).toBe(403);
    await flush();
    expect(db.tables.instagram_comments).toHaveLength(0);
    expect(verifySignature(Buffer.from("x"), "sha256=" + "a".repeat(64), "")).toBe(false);
  });
  it("is not blocked by the browser CORS allow-list and works under the /api alias", async () => {
    const { url } = await mk();
    expect((await post(url, DM, { origin: "https://evil.example" })).status).toBe(200);
    expect((await post(url, DM, { path: "/api/webhooks/meta" })).status).toBe(200);
  });
  it("rejects malformed JSON with a valid signature (400)", async () => {
    const { url } = await mk();
    const raw = Buffer.from("{not json");
    const r = await fetch(url + V1, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": sign(raw) }, body: raw });
    expect(r.status).toBe(400);
  });
});

describe("Meta webhook — parse, store, dedupe", () => {
  it("Instagram DM", async () => {
    const { url, db, flush } = await mk();
    await post(url, DM); await flush();
    const m = db.tables.instagram_messages[0];
    expect([m.mid, m.sender_id, m.text, m.attachments[0].type]).toEqual(["MID1", "S1", "Kalsubai dates?", "image"]);
    expect(db.tables.meta_webhook_events[0]).toMatchObject({ dedupe_key: "ig_msg:MID1", status: "processed" });
  });
  it("Instagram comment", async () => {
    const { url, db, flush } = await mk();
    await post(url, COMMENT); await flush();
    const c = db.tables.instagram_comments[0];
    expect([c.comment_id, c.text, c.from_id, c.from_username, c.media_id]).toEqual(["C1", "Price?", "U1", "trekfan", "M1"]);
  });
  it("page leadgen with mocked Graph fetch and field mapping", async () => {
    const { url, db, flush, graphCalls } = await mk();
    await post(url, LEAD); await flush();
    expect(graphCalls).toEqual(["L1"]);
    const l = db.tables.meta_leads[0];
    expect([l.leadgen_id, l.form_id, l.page_id, l.ad_id, l.status]).toEqual(["L1", "F1", "P1", "A1", "new"]);
    expect([l.name, l.phone, l.email, l.trek_interest]).toEqual(["Asha Patil", "+919812345678", "asha@example.com", "Kalsubai"]);
    expect(l.answers.group_size).toBe("4");
    expect(l.created_time).toBe(new Date(1764000000 * 1000).toISOString());
  });
  it("Graph failure stores the lead as fetch_failed", async () => {
    const { url, db, flush } = await mk({ fetchLead: async () => { throw new Error("graph lead fetch failed: HTTP 400"); } });
    await post(url, LEAD); await flush();
    expect(db.tables.meta_leads[0]).toMatchObject({ status: "fetch_failed", leadgen_id: "L1" });
  });
  it("dedupes by mid / comment id / leadgen_id (memory, and DB unique key across instances)", async () => {
    const { url, db, flush, graphCalls } = await mk();
    for (const p of [DM, DM, COMMENT, COMMENT, LEAD, LEAD]) await post(url, p);
    await flush();
    expect([db.tables.instagram_messages.length, db.tables.instagram_comments.length, db.tables.meta_leads.length, graphCalls.length]).toEqual([1, 1, 1, 1]);
    const second = await mk({ db });
    await post(second.url, DM); await second.flush();
    expect(db.tables.instagram_messages).toHaveLength(1);
    expect(second.logs.some((l) => l.includes("dup(db)"))).toBe(true);
  });
});

describe("Meta webhook — Graph fetch, logging, units", () => {
  it("default Graph fetch: version + id in URL, token only in Authorization header, appsecret_proof", async () => {
    const calls = [];
    const fetchImpl = async (u, init) => { calls.push({ u, init }); return new Response(JSON.stringify(GRAPH_LEAD), { status: 200 }); };
    expect((await defaultFetchLead({ fetchImpl })("L1")).id).toBe("L1");
    expect(calls[0].u).toMatch(/^https:\/\/graph\.facebook\.com\/v23\.0\/L1\?fields=/);
    expect(calls[0].u.includes(PAGE)).toBe(false);
    expect(calls[0].init.headers.Authorization).toBe(`Bearer ${PAGE}`);
    expect(calls[0].u).toMatch(/appsecret_proof=[0-9a-f]{64}/);
  });
  it("logs ids/types only — no secrets, tokens, signatures, message text, raw phone or email", async () => {
    const { url, logs, flush } = await mk();
    const sig = sign(Buffer.from(JSON.stringify(LEAD)));
    await post(url, DM); await post(url, COMMENT); await post(url, LEAD);
    await post(url, DM, { sig: "sha256=" + "b".repeat(64) });
    await verify(url, { "hub.mode": "subscribe", "hub.verify_token": VERIFY, "hub.challenge": "x" });
    await flush();
    const all = logs.join("\n");
    for (const s of [SECRET, VERIFY, PAGE, sig, "Kalsubai dates?", "Price?", "+919812345678", "9812345678", "asha@example.com", "Asha Patil"]) expect(all.includes(s), `leaked ${s.slice(0, 6)}`).toBe(false);
    expect(all).toContain("leadgen_id=L1"); expect(all).toContain("*********78"); expect(all).toContain("a***@example.com");
  });
  it("parsePayload ignores junk; mapLeadFields first/last fallback; masks", () => {
    expect(parsePayload(null)).toEqual([]);
    expect(parsePayload({ object: "page" })).toEqual([]);
    expect(parsePayload({ object: "instagram", entry: [{ messaging: [{ sender: { id: "S" }, read: { mid: "x" } }] }] })[0].kind).toBe("other");
    expect(mapLeadFields([{ name: "first_name", values: ["A"] }, { name: "last_name", values: ["B"] }]).name).toBe("A B");
    expect(maskPhone("+919812345678")).toBe("+**********78");
    expect(maskEmail("asha@example.com")).toBe("a***@example.com");
  });
  it("rate limiter returns 429 above META_WEBHOOK_RATE_LIMIT", async () => {
    process.env.META_WEBHOOK_RATE_LIMIT = "3";
    const { url } = await mk();
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await verify(url, {})).status);
    delete process.env.META_WEBHOOK_RATE_LIMIT;
    expect(codes).toEqual([403, 403, 403, 429, 429]);
  });
});
