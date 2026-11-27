import { afterEach, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { fakeDb, listen } from "./support/fakeSupabase.js";
import createBlogRouter from "../routes/blog.routes.js";
import { blogPostJsonLd, publishProblems, slugifyBlog, validateBlogPost, postFromRow } from "../../../shared/blogPosts.js";
import { parseBlocks, parseInline, safeHref, wordCount, plainText } from "../../../shared/blogContent.js";
import { checkDraft, dayMonths, phoneNumbers, rupeeAmounts } from "../../../shared/aiDraftGuard.js";

const SECRET = "test-jwt-secret-for-blog-tests-0123456789abcdef";
beforeAll(() => { process.env.JWT_SECRET = SECRET; });
const tok = (role, username = `u_${role.replace(/\s/g, "")}`) => jwt.sign({ username, name: role, role }, SECRET, { expiresIn: "5m" });
const LONG = Array.from({ length: 170 }, (_, i) => `word${i}`).join(" ");
const POST = { title: "Kalsubai Night Trek Guide", metaDescription: "Everything about the Kalsubai night trek from Pune: route, difficulty, best season, what to carry and how to book.", content: `## Route\n\n${LONG}`, keywords: "kalsubai, night trek", faq: [{ q: "Beginner friendly?", a: "Yes." }] };

const servers = [];
afterEach(async () => { while (servers.length) await servers.pop().close(); });
async function mk(tables = {}) {
  const db = fakeDb({ blog_posts: [], activity_logs: [], ...tables });
  const app = express();
  app.use(express.json());
  app.use("/api/blog", createBlogRouter({ db: async () => db, now: () => new Date("2026-11-28T08:00:00Z"), log: () => {} }));
  const srv = await listen(app); servers.push(srv);
  const call = (path, { method = "GET", body, role } = {}) => fetch(`${srv.url}/api/blog${path}`, {
    method, headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${tok(role)}` } : {}) }, body: body ? JSON.stringify(body) : undefined,
  });
  return { db, call };
}

describe("blog — drafts by default, published-only public API, no delete", () => {
  it("a new post is ALWAYS a draft (status in the body is ignored) and is hidden from the public API", async () => {
    const { call, db } = await mk();
    const r = await call("/admin/posts", { method: "POST", role: "Sales", body: { ...POST, status: "published", published_at: "2020-01-01" } });
    expect(r.status).toBe(201);
    const { data } = await r.json();
    expect(data).toMatchObject({ status: "draft", slug: "kalsubai-night-trek-guide", publishedAt: null, createdBy: "u_Sales" });
    expect(db.tables.blog_posts[0].status).toBe("draft");
    expect((await (await call("/posts")).json()).data).toEqual([]);
    expect((await call("/posts/kalsubai-night-trek-guide")).status).toBe(404);
  });

  it("only Super Admin/Admin can publish; publishing checks the content; public sees published only", async () => {
    const { call, db } = await mk();
    const { data } = await (await call("/admin/posts", { method: "POST", role: "Sales", body: POST })).json();
    const { data: thin } = await (await call("/admin/posts", { method: "POST", role: "Sales", body: { title: "Thin draft post", content: "short" } })).json();
    for (const role of ["Sales", "Operations", "Trek Leader"]) {
      expect((await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role, body: { status: "published" } })).status, role).toBe(403);
    }
    const t = await call(`/admin/posts/${thin.id}/status`, { method: "PATCH", role: "Admin", body: { status: "published" } });
    expect(t.status).toBe(400);
    expect((await t.json()).problems).toEqual(expect.arrayContaining(["Meta description (50–170 characters)", "Article text (at least 150 words)"]));
    const p = await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Super Admin", body: { status: "published" } });
    expect(p.status).toBe(200);
    expect((await p.json()).data).toMatchObject({ status: "published", publishedAt: "2026-11-28T08:00:00.000Z" });
    expect(db.tables.activity_logs.at(-1)).toMatchObject({ action: "BLOG_PUBLISHED", module: "blog", performed_by: "u_SuperAdmin" });
    const list = (await (await call("/posts")).json()).data;
    expect(list.map((x) => x.slug)).toEqual(["kalsubai-night-trek-guide"]);
    expect(list[0].content).toBeUndefined();
    expect(list[0].status).toBeUndefined();
    const one = await call("/posts/kalsubai-night-trek-guide");
    expect(one.status).toBe(200);
    expect(one.headers.get("cache-control")).toMatch(/max-age=300/);
    const body = (await one.json()).data;
    expect(body.content).toMatch(/## Route/);
    expect(body).not.toHaveProperty("createdBy");
    expect(body).not.toHaveProperty("aiModel");
    expect((await call(`/posts/${slugifyBlog("Thin draft post")}`)).status).toBe(404);
  });

  it("unpublish and archive hide the post again (nothing is deleted)", async () => {
    const { call, db } = await mk();
    const { data } = await (await call("/admin/posts", { method: "POST", role: "Admin", body: POST })).json();
    await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Admin", body: { status: "published" } });
    expect((await call("/posts/kalsubai-night-trek-guide")).status).toBe(200);
    await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Admin", body: { status: "archived" } });
    expect((await call("/posts/kalsubai-night-trek-guide")).status).toBe(404);
    expect((await (await call("/posts")).json()).data).toEqual([]);
    expect(db.tables.blog_posts).toHaveLength(1);
    expect(db.tables.activity_logs.at(-1).action).toBe("BLOG_ARCHIVED");
    await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Admin", body: { status: "draft" } });
    expect(db.tables.blog_posts[0].status).toBe("draft");
    expect((await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Admin", body: { status: "deleted" } })).status).toBe(400);
  });

  it("has NO delete route and no export (public or admin)", async () => {
    const { call, db } = await mk();
    const { data } = await (await call("/admin/posts", { method: "POST", role: "Super Admin", body: POST })).json();
    for (const p of [`/admin/posts/${data.id}`, `/posts/${data.slug}`, "/admin/posts", `/admin/posts/${data.id}/status`]) {
      expect((await call(p, { method: "DELETE", role: "Super Admin" })).status, p).toBe(404);
    }
    for (const p of ["/admin/posts/export", "/admin/export", "/admin/posts.csv"]) {
      const r = await call(p, { role: "Super Admin" });
      expect([404, 500]).toContain(r.status);   // "/admin/posts/export" is read as an id → not found
      expect(r.headers.get("content-type") || "").not.toMatch(/csv|spreadsheet|pdf/);
    }
    expect(db.tables.blog_posts).toHaveLength(1);
  });

  it("admin routes need the JWT; drafts list shows all statuses", async () => {
    const { call } = await mk();
    expect((await call("/admin/posts")).status).toBe(401);
    expect((await call("/admin/posts", { method: "POST", body: POST })).status).toBe(401);
    await call("/admin/posts", { method: "POST", role: "Admin", body: POST });
    const l = await (await call("/admin/posts", { role: "Sales" })).json();
    expect(l.data[0]).toMatchObject({ status: "draft", wordCount: 171 });
    expect((await (await call("/admin/posts?status=published", { role: "Sales" })).json()).data).toEqual([]);
  });

  it("validation, duplicate slugs, live posts lock their slug and need an Admin to edit", async () => {
    const { call } = await mk();
    const bad = await call("/admin/posts", { method: "POST", role: "Admin", body: { title: "x", slug: "Bad Slug!", coverImageUrl: "javascript:alert(1)" } });
    expect(bad.status).toBe(400);
    expect(Object.keys((await bad.json()).errors).sort()).toEqual(["coverImageUrl", "slug", "title"]);
    const { data } = await (await call("/admin/posts", { method: "POST", role: "Admin", body: POST })).json();
    expect((await call("/admin/posts", { method: "POST", role: "Admin", body: POST })).status).toBe(409);
    expect((await call(`/admin/posts/${data.id}`, { method: "PUT", role: "Sales", body: { ...POST, title: "Kalsubai Night Trek Guide 2026" } })).status).toBe(200);
    await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Admin", body: { status: "published" } });
    expect((await call(`/admin/posts/${data.id}`, { method: "PUT", role: "Sales", body: { ...POST, slug: "kalsubai-night-trek-guide" } })).status).toBe(403);
    expect((await call(`/admin/posts/${data.id}`, { method: "PUT", role: "Admin", body: { ...POST, slug: "new-slug" } })).status).toBe(409);
    const ok = await call(`/admin/posts/${data.id}`, { method: "PUT", role: "Admin", body: { ...POST, slug: "kalsubai-night-trek-guide", excerpt: "Updated" } });
    expect(ok.status).toBe(200);
    expect((await ok.json()).data).toMatchObject({ status: "published", excerpt: "Updated" });
  });

  it("status change is reverted when the audit log cannot be written (fail closed)", async () => {
    const { call, db } = await mk();
    const { data } = await (await call("/admin/posts", { method: "POST", role: "Admin", body: POST })).json();
    const orig = db.from;
    db.from = (n) => { const q = orig(n); if (n === "activity_logs") q.insert = () => ({ then: (res) => res({ data: null, error: { message: "down" } }) }); return q; };
    expect((await call(`/admin/posts/${data.id}/status`, { method: "PATCH", role: "Admin", body: { status: "published" } })).status).toBe(500);
    db.from = orig;
    expect(db.tables.blog_posts[0].status).toBe("draft");
    expect((await call("/posts/kalsubai-night-trek-guide")).status).toBe(404);
  });

  it("before migration 022: public list is empty (200), admin gets a clear 501", async () => {
    const missing = { message: 'relation "public.blog_posts" does not exist' };
    const db = { from: () => { const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, maybeSingle: async () => ({ data: null, error: missing }), then: (r) => r({ data: null, error: missing }) }; return q; } };
    const app = express(); app.use(express.json());
    app.use("/api/blog", createBlogRouter({ db: async () => db, log: () => {} }));
    const srv = await listen(app); servers.push(srv);
    const l = await fetch(`${srv.url}/api/blog/posts`);
    expect(l.status).toBe(200);
    expect((await l.json()).data).toEqual([]);
    expect((await fetch(`${srv.url}/api/blog/posts/x`)).status).toBe(404);
    const a = await fetch(`${srv.url}/api/blog/admin/posts`, { headers: { Authorization: `Bearer ${tok("Admin")}` } });
    expect(a.status).toBe(501);
    expect((await a.json()).error).toMatch(/migration 022/);
  });
});

describe("shared blog helpers", () => {
  it("Markdown subset never yields unsafe links", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("http://x.com")).toBeNull();
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("https://www.gadvede.com/treks/kalsubai")).toBe("https://www.gadvede.com/treks/kalsubai");
    expect(safeHref("/treks/kalsubai")).toBe("/treks/kalsubai");
    expect(parseInline("a **b** [x](javascript:void) [y](/treks)")).toEqual([
      { t: "text", v: "a " }, { t: "b", v: "b" }, { t: "text", v: " " }, { t: "text", v: "x" }, { t: "text", v: " " }, { t: "a", v: "y", href: "/treks" },
    ]);
    expect(parseBlocks("# Big\npara one\nline two\n\n- a\n- b\n1. c\n> q\n### Small")).toEqual([
      { type: "h2", text: "Big" }, { type: "p", text: "para one line two" }, { type: "ul", items: ["a", "b"] }, { type: "ol", items: ["c"] }, { type: "quote", text: "q" }, { type: "h3", text: "Small" },
    ]);
    expect(plainText("## H\n**bold** [l](/x)")).toBe("H bold l");
    expect(wordCount(POST.content)).toBe(171);
  });
  it("slugify, validate, publish problems, JSON-LD (Article + FAQ + breadcrumbs, no ratings)", () => {
    expect(slugifyBlog("Kalsubai & Harihar: Treks near Pune!")).toBe("kalsubai-and-harihar-treks-near-pune");
    const { value, errors } = validateBlogPost({ ...POST, status: "published" });
    expect(errors).toEqual({});
    expect(value).not.toHaveProperty("status");
    expect(value.keywords).toEqual(["kalsubai", "night trek"]);
    expect(publishProblems(value)).toEqual([]);
    expect(publishProblems({ ...value, content: `${LONG} [Name]` })).toContain("Remove placeholders like [Name], {{…}} or TODO");
    expect(publishProblems({ ...value, content: `${LONG} See the [trek page](/treks/x).` })).not.toContain("Remove placeholders like [Name], {{…}} or TODO");
    const post = postFromRow({ id: "1", slug: "kalsubai-night-trek-guide", title: value.title, meta_description: value.metaDescription, content: value.content, faq: value.faq, keywords: value.keywords, category: "Trek guides", cover_image_url: "/trips/kalsubai.jpg", published_at: "2026-11-28T08:00:00Z", updated_at: "2026-11-28T09:00:00Z" });
    const ld = blogPostJsonLd(post);
    const types = ld["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(["BlogPosting", "BreadcrumbList", "FAQPage"]);
    expect(ld["@graph"][0]).toMatchObject({ headline: value.title, url: "https://www.gadvede.com/blog/kalsubai-night-trek-guide", image: ["https://www.gadvede.com/trips/kalsubai.jpg"], datePublished: "2026-11-28T08:00:00Z" });
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|ratingValue|reviewCount/);
  });
});

describe("shared AI draft guard", () => {
  it("finds rupee amounts, dates and phone numbers", () => {
    expect(rupeeAmounts("₹1,399 or Rs. 2800 / INR 500, 1200/- and 99 rupees; 2 people")).toEqual([1399, 2800, 500, 1200, 99]);
    expect(dayMonths("Sat 28 Nov, Dec 5th, 12/12, 2-3 days, 9.10 PM")).toEqual(["28-11", "05-12", "12-12"]);
    expect(phoneNumbers("+91 98561 12727, 9822012345, 1399, 20261128")).toEqual(["9856112727", "9822012345"]);
  });
  it("allows real prices (and group totals) and real dates; flags the rest", () => {
    const facts = { prices: [1399], dates: ["2026-11-28", "2026-12-05"], channel: "whatsapp" };
    expect(checkDraft("Hi! ₹1,399 pp, for 2 it's ₹2,798. Batches 28 Nov and 5 Dec. WhatsApp +91 98561 12727 or gadvede.com/treks", facts)).toEqual([]);
    expect(checkDraft("Only ₹999! 12 Dec batch.", facts).map((w) => w.code)).toEqual(["price", "date"]);
    expect(checkDraft("Hi [Name], join 10,000+ happy trekkers", facts).map((w) => w.code).sort()).toEqual(["claim", "placeholder"]);
    // A Markdown link is not a placeholder.
    expect(checkDraft("See the [trek page](/treks/x) for details.", facts).map((w) => w.code)).not.toContain("placeholder");
    expect(checkDraft("x".repeat(1200), facts).map((w) => w.code)).toEqual(["length"]);
    expect(checkDraft("₹500", { prices: [] })[0].message).toMatch(/no price in admin/);
    expect(checkDraft("", facts)[0].code).toBe("empty");
  });
});
