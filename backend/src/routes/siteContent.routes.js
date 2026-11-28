import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import { SITE_CONTENT_KEYS, canEditSiteContent, isFilled, sectionFor, validateContent } from "../../../shared/siteContent.js";

/**
 * Site Content (Pratik t129u) — admin-managed copy for the public site, with draft → publish.
 *   GET  /api/site-content                     public. { key: content } for PUBLISHED sections only. Cacheable (60 s).
 *   GET  /api/site-content/admin               admin JWT, Super Admin / Admin. Every section: draft, published, who/when.
 *   PUT  /api/site-content/admin/:key          admin JWT, Super Admin / Admin. Body { content }. Validated; saves the DRAFT only.
 *   POST /api/site-content/admin/:key/publish  admin JWT, Super Admin / Admin. Copies the saved draft to published.
 *   POST /api/site-content/admin/:key/hide     admin JWT, Super Admin / Admin. Takes the section off the site (draft is kept).
 * Every write is audited to activity_logs (action SITE_CONTENT_*). If the audit write fails the change is reverted and 500
 * is returned (fail closed). There is deliberately no delete route and no export.
 * Storage: public.site_content (migration 023). `db` = async factory returning a supabase client.
 */
const TABLE = "site_content";

export function createSiteContentRouter({ db, log = (m) => console.log(m) } = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);

  const requireEditor = (req, res, next) => (canEditSiteContent(req.admin)
    ? next()
    : res.status(403).json({ success: false, error: "Only Super Admin or Admin can change site content" }));
  const requireKnownKey = (req, res, next) => (sectionFor(req.params.key)
    ? next()
    : res.status(404).json({ success: false, error: "Unknown section" }));

  async function readRow(client, key) {
    const { data, error } = await client.from(TABLE).select("*").eq("key", key).maybeSingle();
    if (error) throw new Error("read failed");
    return data ? JSON.parse(JSON.stringify(data)) : null; // a copy, so a later revert restores the real old row
  }

  async function audit(client, req, action, label, details) {
    const { error } = await client.from("activity_logs").insert([{
      action, action_label: label, module: "site_content", severity: "info",
      performed_by: String(req.admin?.username ?? "unknown"),
      details: JSON.stringify({ ...details, role: req.admin?.role ?? null }),
    }]);
    return !error;
  }

  /** Write `patch` to the row, audit it, and put the old row back if the audit fails. */
  async function writeAudited(client, req, key, patch, action, label, details) {
    const before = await readRow(client, key);
    const row = { key, ...(before ? { draft: before.draft ?? null, published: before.published ?? null } : { draft: null, published: null }), ...patch };
    const { error: upErr } = await client.from(TABLE).upsert([row], { onConflict: "key" });
    if (upErr) return { status: 500, error: "Could not save (has migration 023 been run?)" };
    if (!(await audit(client, req, action, label, { key, ...details }))) {
      if (before) await client.from(TABLE).upsert([before], { onConflict: "key" });
      else await client.from(TABLE).upsert([{ key, draft: null, published: null, updated_by: "revert", updated_at: new Date().toISOString() }], { onConflict: "key" });
      log(`site-content: audit write failed — ${key} change reverted`);
      return { status: 500, error: "Audit log failed; change reverted" };
    }
    return { row: await readRow(client, key) };
  }

  const view = (key, row) => ({
    key,
    draft: row?.draft ?? null,
    published: row?.published ?? null,
    updatedAt: row?.updated_at ?? null, updatedBy: row?.updated_by ?? null,
    publishedAt: row?.published_at ?? null, publishedBy: row?.published_by ?? null,
    hasUnpublishedChanges: JSON.stringify(row?.draft ?? null) !== JSON.stringify(row?.published ?? null),
  });

  router.get("/", async (req, res) => {
    const out = {};
    try {
      const client = await getDb();
      const { data, error } = await client.from(TABLE).select("key, published");
      if (!error && Array.isArray(data)) {
        for (const r of data) {
          if (!SITE_CONTENT_KEYS.includes(r.key) || !isFilled(r.key, r.published)) continue;
          const { content } = validateContent(r.key, r.published); // re-clean on the way out (defence in depth)
          if (isFilled(r.key, content)) out[r.key] = content;
        }
      }
    } catch { /* empty = nothing shown */ }
    res.set("Cache-Control", "public, max-age=60");
    res.json({ success: true, data: out });
  });

  router.get("/admin", requireAdminJWT, requireEditor, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    const { data, error } = await client.from(TABLE).select("*");
    if (error) return res.status(500).json({ success: false, error: "Could not load site content (has migration 023 been run?)" });
    const byKey = new Map((data || []).map((r) => [r.key, r]));
    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: SITE_CONTENT_KEYS.map((k) => view(k, byKey.get(k))) });
  });

  router.put("/admin/:key", requireAdminJWT, requireEditor, requireKnownKey, async (req, res) => {
    const { key } = req.params;
    const { errors, content } = validateContent(key, req.body?.content);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: "Please fix the highlighted fields", errors });
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    const by = String(req.admin?.username ?? "unknown");
    const r = await writeAudited(client, req, key, { draft: content, updated_by: by, updated_at: new Date().toISOString() },
      "SITE_CONTENT_DRAFT", `Site content draft saved: ${sectionFor(key).label}`, { filled: isFilled(key, content) });
    if (r.error) return res.status(r.status).json({ success: false, error: r.error });
    log(`site-content: draft ${key} saved by ${by}`);
    res.json({ success: true, data: view(key, r.row) });
  });

  router.post("/admin/:key/publish", requireAdminJWT, requireEditor, requireKnownKey, async (req, res) => {
    const { key } = req.params;
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    let row;
    try { row = await readRow(client, key); } catch { return res.status(500).json({ success: false, error: "Could not read the draft" }); }
    const { errors, content } = validateContent(key, row?.draft);
    if (!row?.draft || !isFilled(key, content)) return res.status(400).json({ success: false, error: "Save some content before publishing" });
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: "The draft has errors; fix and save it first", errors });
    const by = String(req.admin?.username ?? "unknown");
    const r = await writeAudited(client, req, key, { published: content, published_by: by, published_at: new Date().toISOString() },
      "SITE_CONTENT_PUBLISH", `Site content published: ${sectionFor(key).label}`, { wasPublished: Boolean(row?.published) });
    if (r.error) return res.status(r.status).json({ success: false, error: r.error });
    log(`site-content: ${key} published by ${by}`);
    res.json({ success: true, data: view(key, r.row) });
  });

  router.post("/admin/:key/hide", requireAdminJWT, requireEditor, requireKnownKey, async (req, res) => {
    const { key } = req.params;
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    const by = String(req.admin?.username ?? "unknown");
    const r = await writeAudited(client, req, key, { published: null, published_by: by, published_at: new Date().toISOString() },
      "SITE_CONTENT_HIDE", `Site content hidden from the site: ${sectionFor(key).label}`, {});
    if (r.error) return res.status(r.status).json({ success: false, error: r.error });
    log(`site-content: ${key} hidden by ${by}`);
    res.json({ success: true, data: view(key, r.row) });
  });

  return router;
}

export default createSiteContentRouter;
