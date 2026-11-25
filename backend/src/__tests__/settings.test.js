import { afterEach, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { fakeDb, listen } from "./support/fakeSupabase.js";
import createSettingsRouter, { isSuperAdmin } from "../routes/settings.routes.js";
import { BANNED_NUMBERS } from "../utils/contactPolicy.js";

const SECRET = "test-jwt-secret-for-settings-tests-0123456789";
beforeAll(() => { process.env.JWT_SECRET = SECRET; });
const tok = (role) => jwt.sign({ username: `user_${role.replace(/\s/g, "")}`, name: role, role }, SECRET, { expiresIn: "5m" });

const servers = [];
afterEach(async () => { while (servers.length) await servers.pop().close(); });
async function mk(extra = {}) {
  const db = fakeDb({ site_settings: [], activity_logs: [], ...extra });
  const app = express();
  app.use(express.json());
  const r = createSettingsRouter({ db: async () => db, log: () => {} });
  app.use("/api/settings", r);
  app.use("/api/v1/settings", r);
  const srv = await listen(app); servers.push(srv);
  return { url: srv.url, db };
}
const put = (url, body, role) => fetch(`${url}/api/settings/contact`, {
  method: "PUT", headers: { "Content-Type": "application/json", ...(role !== undefined ? { Authorization: `Bearer ${tok(role)}` } : {}) }, body: JSON.stringify(body),
});
const getN = async (url, p = "/api/settings/contact") => (await (await fetch(url + p)).json()).data.whatsappNumber;

describe("WhatsApp contact setting (FR-FE-89 / SEC-41)", () => {
  it("public GET defaults to the official number (both paths) and is cacheable", async () => {
    const { url } = await mk();
    const r = await fetch(`${url}/api/settings/contact`);
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual({ whatsappNumber: "919856112727", display: "+91 98561 12727", waLink: "https://wa.me/919856112727" });
    expect(r.headers.get("cache-control")).toMatch(/max-age=300/);
    expect(await getN(url, "/api/v1/settings/contact")).toBe("919856112727");
  });

  it("only Super Admin can change it; the change is audited to activity_logs and served", async () => {
    const { url, db } = await mk();
    const body = { whatsappNumber: "919812345678" };
    expect((await put(url, body)).status).toBe(401);
    for (const role of ["Admin", "Operations", "Trek Leader", "Vendor", "Customer", ""]) expect((await put(url, body, role)).status, role).toBe(403);
    const ok = await put(url, body, "Super Admin");
    expect(ok.status).toBe(200);
    const a = db.tables.activity_logs.at(-1);
    expect(a).toMatchObject({ action: "SETTING_UPDATE", module: "settings", severity: "warning", performed_by: "user_SuperAdmin" });
    expect(JSON.parse(a.details)).toMatchObject({ key: "contact.whatsapp_number", before: "919856112727", after: "919812345678" });
    expect(await getN(url)).toBe("919812345678");
    expect(isSuperAdmin({ role: "super_admin" })).toBe(true);
  });

  it("rejects retired numbers and bad formats; reverts when the audit write fails", async () => {
    const { url, db } = await mk();
    for (const n of [`91${BANNED_NUMBERS[0]}`, `91${BANNED_NUMBERS[1].slice(2)}`, BANNED_NUMBERS[1], "12345", "919856112727x", "915123456789"]) {
      expect((await put(url, { whatsappNumber: n }, "Super Admin")).status, n).toBe(400);
    }
    const orig = db.from;
    db.from = (n) => { const q = orig(n); if (n === "activity_logs") q.insert = () => ({ then: (res) => res({ data: null, error: { message: "down" } }) }); return q; };
    expect((await put(url, { whatsappNumber: "919812345678" }, "Super Admin")).status).toBe(500);
    db.from = orig;
    expect(await getN(url)).toBe("919856112727");
  });

  it("never serves a stored retired number", async () => {
    const { url } = await mk({ site_settings: [{ key: "contact.whatsapp_number", value: { number: `91${BANNED_NUMBERS[0]}` } }] });
    expect(await getN(url)).toBe("919856112727");
  });
});
