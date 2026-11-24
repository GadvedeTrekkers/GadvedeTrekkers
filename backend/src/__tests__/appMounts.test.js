import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import { fakeDb, listen } from "./support/fakeSupabase.js";

const db = fakeDb({ site_settings: [], activity_logs: [], meta_webhook_events: [], instagram_messages: [], instagram_comments: [], meta_leads: [] });
vi.mock("../config/supabaseAdminClient.js", () => ({ default: db }));
vi.mock("../config/supabasePublicClient.js", () => ({ default: db }));

let srv;
const SECRET = "app-mount-secret-" + crypto.randomBytes(6).toString("hex");
beforeAll(async () => {
  process.env.META_APP_SECRET = SECRET;
  const { default: app } = await import("../app.js");
  srv = await listen(app);
});
afterAll(() => srv?.close());

describe("app.js wiring", () => {
  it("serves GET /api/settings/contact with the official default", async () => {
    const r = await fetch(`${srv.url}/api/settings/contact`, { headers: { Origin: "https://www.gadvede.com" } });
    expect(r.status).toBe(200);
    expect((await r.json()).data.whatsappNumber).toBe("919856112727");
  });
  it("Meta webhook is mounted before CORS/json: signed POST from a non-allow-listed origin gets 200", async () => {
    const raw = Buffer.from(JSON.stringify({ object: "instagram", entry: [] }));
    const sig = "sha256=" + crypto.createHmac("sha256", SECRET).update(raw).digest("hex");
    for (const p of ["/api/v1/webhooks/meta", "/api/webhooks/meta"]) {
      const r = await fetch(srv.url + p, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": sig, Origin: "https://evil.example" }, body: raw });
      expect(r.status, p).toBe(200);
    }
    const bad = await fetch(srv.url + "/api/v1/webhooks/meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: raw });
    expect(bad.status).toBe(403);
  });
});
