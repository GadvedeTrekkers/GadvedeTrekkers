/* global process */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { fakeDb, listen } from "./support/fakeSupabase.js";
import createSiteContentRouter from "../routes/siteContent.routes.js";
import { SITE_CONTENT_SECTIONS, safeLink, validateContent } from "../../../shared/siteContent.js";

const SECRET = "test-jwt-secret-for-site-content-0123456789";
beforeAll(() => { process.env.JWT_SECRET = SECRET; });
const tok = (role) => jwt.sign({ username: `user_${role.replace(/\s/g, "")}`, role }, SECRET, { expiresIn: "5m" });

const servers = [];
afterEach(async () => { while (servers.length) await servers.pop().close(); });
async function mk(extra = {}) {
  const db = fakeDb({ site_content: [], activity_logs: [], ...extra });
  const app = express();
  app.use(express.json());
  app.use("/api/site-content", createSiteContentRouter({ db: async () => db, log: () => {} }));
  const srv = await listen(app); servers.push(srv);
  return { url: srv.url, db };
}
const call = (url, method, path, role, body) => fetch(`${url}/api/site-content${path}`, {
  method, headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${tok(role)}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
const publicData = async (url) => (await (await fetch(`${url}/api/site-content`)).json()).data;
const STATS = { items: [{ value: "120+", label: "Treks run" }] };

describe("site content (t129u)", () => {
  it("public GET is empty by default and cacheable — nothing has a built-in value", async () => {
    const { url } = await mk();
    const r = await fetch(`${url}/api/site-content`);
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual({});
    expect(r.headers.get("cache-control")).toMatch(/max-age=60/);
  });

  it("only Super Admin / Admin can read the admin view or write", async () => {
    const { url } = await mk();
    expect((await call(url, "GET", "/admin")).status).toBe(401);
    expect((await call(url, "PUT", "/admin/home.stats", null, { content: STATS })).status).toBe(401);
    for (const role of ["Operations", "Trek Leader", "Vendor", "Customer", "Management", ""]) {
      expect((await call(url, "PUT", "/admin/home.stats", role, { content: STATS })).status, role).toBe(role ? 403 : 401);
      if (role) expect((await call(url, "GET", "/admin", role)).status, role).toBe(403);
    }
    expect((await call(url, "PUT", "/admin/home.stats", "Admin", { content: STATS })).status).toBe(200);
    expect((await call(url, "PUT", "/admin/home.stats", "Super Admin", { content: STATS })).status).toBe(200);
    const list = (await (await call(url, "GET", "/admin", "Admin")).json()).data;
    expect(list.map((s) => s.key)).toEqual(SITE_CONTENT_SECTIONS.map((s) => s.key));
  });

  it("a saved draft is NOT public until published; publish and hide are audited; hide keeps the draft", async () => {
    const { url, db } = await mk();
    expect((await call(url, "PUT", "/admin/home.stats", "Admin", { content: STATS })).status).toBe(200);
    expect(await publicData(url)).toEqual({});
    expect(db.tables.activity_logs.at(-1)).toMatchObject({ action: "SITE_CONTENT_DRAFT", module: "site_content", performed_by: "user_Admin" });

    const pub = await call(url, "POST", "/admin/home.stats/publish", "Admin");
    expect(pub.status).toBe(200);
    expect(await publicData(url)).toEqual({ "home.stats": STATS });
    expect(db.tables.activity_logs.at(-1).action).toBe("SITE_CONTENT_PUBLISH");

    // editing the draft does not change the live copy
    await call(url, "PUT", "/admin/home.stats", "Admin", { content: { items: [{ value: "1", label: "x" }] } });
    expect(await publicData(url)).toEqual({ "home.stats": STATS });
    const v = (await (await call(url, "GET", "/admin", "Admin")).json()).data.find((s) => s.key === "home.stats");
    expect(v.hasUnpublishedChanges).toBe(true);

    expect((await call(url, "POST", "/admin/home.stats/hide", "Admin")).status).toBe(200);
    expect(await publicData(url)).toEqual({});
    expect(db.tables.site_content[0].draft.items[0].value).toBe("1");
    expect(db.tables.activity_logs.at(-1).action).toBe("SITE_CONTENT_HIDE");
  });

  it("validates: unknown key 404, bad links / missing required fields 400, cannot publish an empty draft", async () => {
    const { url } = await mk();
    expect((await call(url, "PUT", "/admin/not.a.key", "Admin", { content: {} })).status).toBe(404);
    const bad = await call(url, "PUT", "/admin/home.cta", "Admin", { content: { title: "Go", buttonLink: "javascript:alert(1)" } });
    expect(bad.status).toBe(400);
    expect((await bad.json()).errors.buttonLink).toBeTruthy();
    expect((await call(url, "PUT", "/admin/home.stats", "Admin", { content: { items: [{ value: "5" }] } })).status).toBe(400);
    expect((await call(url, "POST", "/admin/pages.faq/publish", "Admin")).status).toBe(400);
    expect((await call(url, "PUT", "/admin/pages.faq", "Admin", { content: { title: "", items: [] } })).status).toBe(200);
    expect((await call(url, "POST", "/admin/pages.faq/publish", "Admin")).status).toBe(400);
  });

  it("reverts when the audit write fails (fail closed)", async () => {
    const { url, db } = await mk();
    await call(url, "PUT", "/admin/home.stats", "Admin", { content: STATS });
    await call(url, "POST", "/admin/home.stats/publish", "Admin");
    const orig = db.from;
    db.from = (n) => { const q = orig(n); if (n === "activity_logs") q.insert = () => ({ then: (res) => res({ data: null, error: { message: "down" } }) }); return q; };
    expect((await call(url, "POST", "/admin/home.stats/hide", "Admin")).status).toBe(500);
    expect((await call(url, "PUT", "/admin/site.footer", "Admin", { content: { about: "New" } })).status).toBe(500);
    db.from = orig;
    expect(await publicData(url)).toEqual({ "home.stats": STATS });
    expect(db.tables.site_content.find((r) => r.key === "site.footer")?.draft ?? null).toBeNull();
  });

  it("has no delete route and no export route", async () => {
    const { url } = await mk();
    expect((await call(url, "DELETE", "/admin/home.stats", "Super Admin")).status).toBe(404);
    expect((await call(url, "GET", "/admin/export", "Super Admin")).status).toBe(404);
  });

  it("public output is re-cleaned and ignores unknown keys", async () => {
    const { url } = await mk({ site_content: [
      { key: "home.cta", published: { title: "Hi", buttonLink: "javascript:x", extra: "<script>" } },
      { key: "secret.thing", published: { a: 1 } },
    ] });
    expect(await publicData(url)).toEqual({ "home.cta": { title: "Hi", subtitle: "", buttonLabel: "", buttonLink: "", whatsappLabel: "" } });
  });

  it("schema helpers", () => {
    expect(safeLink("/treks").ok).toBe(true);
    expect(safeLink("https://www.gadvede.com/x").ok).toBe(true);
    for (const v of ["http://x.com", "javascript:alert(1)", "//evil.com", "data:text/html,1"]) expect(safeLink(v).ok, v).toBe(false);
    const { content } = validateContent("pages.faq", { title: " FAQ ", items: [{ question: "Q?", answer: "A" }, { question: "", answer: "" }] });
    expect(content).toEqual({ title: "FAQ", metaDescription: "", intro: "", items: [{ question: "Q?", answer: "A" }] });
  });
});
