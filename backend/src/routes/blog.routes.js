import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { isProfileAdmin } from "./settings.routes.js";
import { BLOG_STATUSES, postFromRow, publishProblems, rowFromPost, validateBlogPost } from "../../../shared/blogPosts.js";

/**
 * Blog (Admin → Blog + public /blog pages). Mounted at /api/blog. Table public.blog_posts (migration 022, NOT run yet).
 *
 * Public (no auth, cached 5 min) — ONLY status = 'published' is ever returned:
 *   GET  /posts                     list (no article body)
 *   GET  /posts/:slug               one published post; drafts/archived → 404
 * Admin (admin JWT):
 *   GET  /admin/posts?status=       all posts (draft / published / archived)
 *   GET  /admin/posts/:id
 *   POST /admin/posts               create — ALWAYS saved as 'draft' (publish is off by default), any staff role
 *   PUT  /admin/posts/:id           edit content (status is ignored here). Published posts: Super Admin/Admin only, slug locked.
 *   PATCH /admin/posts/:id/status   { status: draft | published | archived } — Super Admin/Admin only; publishing checks
 *                                   title, meta description, ≥150 words and no placeholders. Audited (fail closed).
 * There is deliberately NO delete route and NO export: unpublish (→ draft) or archive instead.
 */
export const TABLE = "blog_posts";
const PUBLIC_COLUMNS = "id, slug, title, meta_title, meta_description, excerpt, category, cover_image_url, cover_image_alt, author_name, related_trip_slug, published_at, updated_at";
export const isMissingTable = (error) => /relation .* does not exist|schema cache|could not find the table/i.test(error?.message || "");
const isUniqueViolation = (error) => error?.code === "23505" || /duplicate key|unique/i.test(error?.message || "");
const canPublish = (admin) => isProfileAdmin(admin) || admin?.username === "admin";
const by = (req) => String(req.admin?.username || "unknown").slice(0, 80);

export function createBlogRouter({ db, now = () => new Date(), log = (m) => console.log(m) } = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);
  const publicLimiter = simpleRateLimit({ windowMs: 60_000, limit: 240 });

  /* ── public ─────────────────────────────────────────────── */
  router.get("/posts", publicLimiter, async (req, res) => {
    try {
      const client = await getDb();
      const { data, error } = await client.from(TABLE).select(PUBLIC_COLUMNS).eq("status", "published").order("published_at", { ascending: false }).limit(100);
      if (error) {
        if (isMissingTable(error)) { res.set("Cache-Control", "public, max-age=300"); return res.json({ success: true, data: [] }); }
        throw new Error("blog list read failed");
      }
      const posts = (data || []).filter((r) => r.status === undefined || r.status === "published").map((r) => {
        const p = postFromRow(r);
        delete p.content;
        return p;
      });
      res.set("Cache-Control", "public, max-age=300");
      return res.json({ success: true, data: posts });
    } catch (e) {
      log(`blog public list failed: ${e?.message || "error"}`);
      return res.status(503).json({ success: false, error: "The blog is unavailable right now." });
    }
  });

  router.get("/posts/:slug", publicLimiter, async (req, res) => {
    const slug = String(req.params.slug || "").toLowerCase().slice(0, 100);
    try {
      const client = await getDb();
      const { data, error } = await client.from(TABLE).select("*").eq("slug", slug).eq("status", "published").maybeSingle();
      if (error && !isMissingTable(error)) throw new Error("blog post read failed");
      if (!data || data.status !== "published") return res.status(404).json({ success: false, error: "Post not found" });
      res.set("Cache-Control", "public, max-age=300");
      return res.json({ success: true, data: postFromRow(data) });
    } catch (e) {
      log(`blog public post failed: ${e?.message || "error"}`);
      return res.status(503).json({ success: false, error: "The blog is unavailable right now." });
    }
  });

  /* ── admin ──────────────────────────────────────────────── */
  const admin = express.Router();
  admin.use(requireAdminJWT, (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  const missing = (res) => res.status(501).json({ success: false, error: "The blog table is not created yet (migration 022 pending)." });

  async function audit(client, req, action, label, details) {
    return client.from("activity_logs").insert([{ action, action_label: label, details: JSON.stringify(details), module: "blog", severity: action === "BLOG_PUBLISHED" ? "warning" : "info", performed_by: by(req) }])
      .then((r) => r, (e) => ({ error: e }));
  }

  admin.get("/posts", async (req, res) => {
    try {
      const client = await getDb();
      let q = client.from(TABLE).select("*");
      const status = String(req.query.status || "");
      if (BLOG_STATUSES.includes(status)) q = q.eq("status", status);
      const { data, error } = await q.order("updated_at", { ascending: false }).limit(500);
      if (error) return isMissingTable(error) ? missing(res) : res.status(500).json({ success: false, error: "Could not load posts" });
      return res.json({ success: true, data: (data || []).map((r) => postFromRow(r, { admin: true })) });
    } catch {
      return res.status(500).json({ success: false, error: "Could not load posts" });
    }
  });

  admin.get("/posts/:id", async (req, res) => {
    const client = await getDb();
    const { data, error } = await client.from(TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (error) return isMissingTable(error) ? missing(res) : res.status(500).json({ success: false, error: "Could not load the post" });
    if (!data) return res.status(404).json({ success: false, error: "Post not found" });
    return res.json({ success: true, data: postFromRow(data, { admin: true }) });
  });

  async function slugTaken(client, slug, exceptId) {
    const { data } = await client.from(TABLE).select("id").eq("slug", slug).maybeSingle();
    return Boolean(data && String(data.id) !== String(exceptId ?? ""));
  }

  admin.post("/posts", async (req, res) => {
    const { value, errors } = validateBlogPost(req.body || {});
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: "Please fix the highlighted fields", errors });
    try {
      const client = await getDb();
      if (await slugTaken(client, value.slug)) return res.status(409).json({ success: false, error: "Another post already uses this slug", errors: { slug: "Slug already used — change it." } });
      const at = now().toISOString();
      const row = { ...rowFromPost(value), status: "draft", published_at: null, created_by: by(req), updated_by: by(req), created_at: at, updated_at: at };
      const { data, error } = await client.from(TABLE).insert([row]).select("*").single();
      if (error) {
        if (isMissingTable(error)) return missing(res);
        if (isUniqueViolation(error)) return res.status(409).json({ success: false, error: "Another post already uses this slug", errors: { slug: "Slug already used — change it." } });
        return res.status(500).json({ success: false, error: "Could not save the draft" });
      }
      audit(client, req, "BLOG_DRAFT_CREATED", `Blog draft created: ${value.title}`, { id: data?.id, slug: value.slug, aiGenerated: value.aiGenerated });
      return res.status(201).json({ success: true, data: postFromRow(data, { admin: true }) });
    } catch {
      return res.status(500).json({ success: false, error: "Could not save the draft" });
    }
  });

  admin.put("/posts/:id", async (req, res) => {
    try {
      const client = await getDb();
      const before = await client.from(TABLE).select("*").eq("id", req.params.id).maybeSingle();
      if (before.error) return isMissingTable(before.error) ? missing(res) : res.status(500).json({ success: false, error: "Could not load the post" });
      if (!before.data) return res.status(404).json({ success: false, error: "Post not found" });
      // no slug in the body = keep the current one (a title edit never silently changes the link)
      const { value, errors } = validateBlogPost({ ...(req.body || {}), slug: String(req.body?.slug || "").trim() || before.data.slug });
      if (Object.keys(errors).length) return res.status(400).json({ success: false, error: "Please fix the highlighted fields", errors });
      const live = before.data.status === "published";
      if (live && !canPublish(req.admin)) return res.status(403).json({ success: false, error: "This post is live. Only Super Admin or Admin can edit it (or unpublish it first)." });
      if (live && value.slug !== before.data.slug) return res.status(409).json({ success: false, error: "The post is live, so its link (slug) can't change. Unpublish it first.", errors: { slug: "Locked while published." } });
      if (value.slug !== before.data.slug && await slugTaken(client, value.slug, req.params.id)) return res.status(409).json({ success: false, error: "Another post already uses this slug", errors: { slug: "Slug already used — change it." } });
      const patch = { ...rowFromPost(value), updated_by: by(req), updated_at: now().toISOString() };
      if (live && publishProblems(value).length) return res.status(400).json({ success: false, error: `A live post needs: ${publishProblems(value).join(", ")}` });
      const { data, error } = await client.from(TABLE).update(patch).eq("id", req.params.id).select("*").maybeSingle();
      if (error) return res.status(isUniqueViolation(error) ? 409 : 500).json({ success: false, error: isUniqueViolation(error) ? "Another post already uses this slug" : "Could not save the post" });
      audit(client, req, "BLOG_POST_UPDATED", `Blog post edited: ${value.title}`, { id: req.params.id, status: before.data.status });
      return res.json({ success: true, data: postFromRow(data, { admin: true }) });
    } catch {
      return res.status(500).json({ success: false, error: "Could not save the post" });
    }
  });

  admin.patch("/posts/:id/status", async (req, res) => {
    const status = String(req.body?.status || "");
    if (!BLOG_STATUSES.includes(status)) return res.status(400).json({ success: false, error: "Status must be draft, published or archived" });
    if (!canPublish(req.admin)) return res.status(403).json({ success: false, error: "Only Super Admin or Admin can publish, unpublish or archive posts" });
    try {
      const client = await getDb();
      const before = await client.from(TABLE).select("*").eq("id", req.params.id).maybeSingle();
      if (before.error) return isMissingTable(before.error) ? missing(res) : res.status(500).json({ success: false, error: "Could not load the post" });
      if (!before.data) return res.status(404).json({ success: false, error: "Post not found" });
      const prev = before.data.status;
      if (prev === status) return res.json({ success: true, data: postFromRow(before.data, { admin: true }) });
      if (status === "published") {
        const problems = publishProblems(postFromRow(before.data, { admin: true }));
        if (problems.length) return res.status(400).json({ success: false, error: `Before publishing, add: ${problems.join(", ")}`, problems });
      }
      const at = now().toISOString();
      const patch = { status, updated_by: by(req), updated_at: at, ...(status === "published" && !before.data.published_at ? { published_at: at } : {}) };
      const { data, error } = await client.from(TABLE).update(patch).eq("id", req.params.id).select("*").maybeSingle();
      if (error) return res.status(500).json({ success: false, error: "Could not change the status" });
      const action = status === "published" ? "BLOG_PUBLISHED" : status === "archived" ? "BLOG_ARCHIVED" : "BLOG_UNPUBLISHED";
      const a = await audit(client, req, action, `Blog post ${prev} → ${status}: ${before.data.title}`, { id: req.params.id, slug: before.data.slug, before: prev, after: status });
      if (a?.error) {
        await client.from(TABLE).update({ status: prev, published_at: before.data.published_at ?? null, updated_at: before.data.updated_at }).eq("id", req.params.id);
        return res.status(500).json({ success: false, error: "Could not write the audit log, so the status was not changed" });
      }
      return res.json({ success: true, data: postFromRow(data, { admin: true }) });
    } catch {
      return res.status(500).json({ success: false, error: "Could not change the status" });
    }
  });

  router.use("/admin", admin);
  return router;
}

export default createBlogRouter;
