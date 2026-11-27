import express from "express";
import crypto from "crypto";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { isProfileAdmin } from "./settings.routes.js";
import { readBusinessProfile } from "../services/businessProfile.js";
import {
  AUTOMATION_IDS, CRM_SETTINGS_KEY, LOG_STATUSES, normEmail, phone10, validateCrmSettings, withCrmDefaults,
} from "../../../shared/crmAutomations.js";
import {
  LOG_TABLE, OPT_OUT_TABLE, buildEmailMessage, buildPlan, escapeHtml, gmailConfigured, isLive, isMissingTable,
  processDue, readCrmSettings, readUnsubscribeToken, resolveReviewUrl, unsubscribeSecret,
} from "../services/crmAutomations.js";

/**
 * CRM automations (enquiry follow-ups, pre-trip reminder, post-trip welcome back + Google review).
 * Mounted at /api/crm.
 *
 *   POST  /cron/run                 CRON_SECRET (Authorization: Bearer … or X-Cron-Secret). Processes due messages.
 *                                   Sends/queues ONLY when env CRM_AUTOMATIONS_LIVE === "true"; otherwise a dry run.
 *   GET   /automations              admin (Super Admin / Admin): settings + status (Gmail, cron, live, review link).
 *   PUT   /automations              admin: save settings/templates/toggles (validated, audited to activity_logs).
 *   POST  /automations/preview      admin: DRY RUN — who WOULD get what right now (optionally with unsaved settings).
 *                                   Read only: never writes, never sends.
 *   GET   /log                      admin: sent-message log (filters automation, channel, status).
 *   GET   /whatsapp-queue           admin: queued WhatsApp messages with prefilled wa.me links.
 *   PATCH /log/:id                  admin: mark a queued WhatsApp message sent_manual or skipped (nothing else).
 *   GET   /opt-outs, POST /opt-outs admin: list / add an opt-out (e.g. customer said "stop" on WhatsApp).
 *   GET   /unsubscribe?t=…          public: confirm page.   POST /unsubscribe?t=… public: records the opt-out
 *                                   (also RFC 8058 one-click from the List-Unsubscribe header).
 * There is deliberately NO delete route and NO export.
 */
const s = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const requireCrmAdmin = (req, res, next) => (isProfileAdmin(req.admin) || req.admin?.username === "admin"
  ? next()
  : res.status(403).json({ success: false, error: "Only Super Admin or Admin can manage automations" }));

function secretMatches(given, want) {
  if (!given || !want) return false;
  const a = crypto.createHash("sha256").update(String(given)).digest();
  const b = crypto.createHash("sha256").update(String(want)).digest();
  return crypto.timingSafeEqual(a, b);
}

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:24px;"><div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;text-align:center;">${body}</div></body></html>`;
}

export function createCrmAutomationsRouter({
  db, env = process.env, now = () => new Date(), sendMail, log = (m) => console.log(m),
} = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);
  let running = false;

  async function profileOf(client) {
    try { return (await readBusinessProfile(client)).profile; } catch { return null; }
  }
  function status(settings, profile) {
    const review = resolveReviewUrl(settings, env, profile);
    return {
      live: isLive(env),
      gmailConfigured: gmailConfigured(env),
      cronConfigured: Boolean(env.CRON_SECRET && env.CRON_SECRET.length >= 24),
      unsubscribeConfigured: Boolean(unsubscribeSecret(env)) && /^https?:\/\//.test(String(env.BACKEND_URL || "")),
      reviewUrlSource: review.source,
      reviewUrlSet: Boolean(review.url),
    };
  }

  /* ── cron ─────────────────────────────────────────────── */
  router.post("/cron/run", async (req, res) => {
    const want = env.CRON_SECRET;
    if (!want || want.length < 24) return res.status(503).json({ success: false, error: "CRON_SECRET is not configured" });
    const auth = String(req.header("Authorization") || "");
    const given = auth.startsWith("Bearer ") ? auth.slice(7) : req.header("X-Cron-Secret");
    if (!secretMatches(given, want)) return res.status(401).json({ success: false, error: "Unauthorized" });
    if (running) return res.status(409).json({ success: false, error: "A run is already in progress" });
    running = true;
    try {
      const client = await getDb();
      const { settings } = await readCrmSettings(client);
      const summary = await processDue(client, { settings, profile: await profileOf(client), now: now(), env, ...(sendMail ? { sendMail } : {}), log });
      const { planned, ...counts } = summary; // never return personal data from the cron endpoint
      return res.json({ success: true, data: { ...counts, planned: planned ? planned.length : undefined } });
    } catch (e) {
      log(`crm cron failed: ${e?.message || "error"}`);
      return res.status(500).json({ success: false, error: e?.message || "Run failed" });
    } finally { running = false; }
  });

  /* ── admin: settings ──────────────────────────────────── */
  router.get("/automations", requireAdminJWT, requireCrmAdmin, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const r = await readCrmSettings(client);
    const profile = await profileOf(client);
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, data: { settings: r.settings, meta: { stored: r.stored, updatedAt: r.updatedAt, updatedBy: r.updatedBy, ...status(r.settings, profile) } } });
  });

  router.put("/automations", requireAdminJWT, requireCrmAdmin, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const body = req.body && typeof req.body === "object" ? (req.body.settings ?? req.body) : {};
    const { settings: next, errors } = validateCrmSettings(body);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: "Please fix the highlighted fields", errors });
    const before = await readCrmSettings(client);
    const at = now().toISOString();
    for (const id of AUTOMATION_IDS) {
      // enabledAt is server-owned: set when switched ON, kept while on, cleared when OFF.
      next[id].enabledAt = next[id].enabled ? (before.settings[id].enabled && before.settings[id].enabledAt ? before.settings[id].enabledAt : at) : null;
    }
    const by = s(req.admin?.username || "unknown", 80);
    const { error } = await client.from("site_settings").upsert([{ key: CRM_SETTINGS_KEY, value: next, updated_by: by, updated_at: at }], { onConflict: "key" });
    if (error) return res.status(isMissingTable(error) ? 501 : 500).json({ success: false, error: "Could not save automations (has migration 015/020 been run?)" });
    const toggles = AUTOMATION_IDS.filter((id) => before.settings[id].enabled !== next[id].enabled).map((id) => `${id} ${next[id].enabled ? "ON" : "OFF"}`);
    const audit = await client.from("activity_logs").insert([{
      action: "CRM_AUTOMATIONS_UPDATED",
      action_label: `CRM automations saved${toggles.length ? `: ${toggles.join(", ")}` : ""}`,
      details: JSON.stringify({ enabled: Object.fromEntries(AUTOMATION_IDS.map((id) => [id, next[id].enabled])) }),
      module: "crm-automations", severity: toggles.some((t) => t.endsWith("ON")) ? "warning" : "info", performed_by: by,
    }]).then((r) => r, (e) => ({ error: e }));
    if (audit?.error) {
      // fail closed: put the previous settings back
      await client.from("site_settings").upsert([{ key: CRM_SETTINGS_KEY, value: before.settings, updated_by: by, updated_at: new Date().toISOString() }], { onConflict: "key" });
      return res.status(500).json({ success: false, error: "Could not write the audit log, so nothing was changed" });
    }
    const profile = await profileOf(client);
    return res.json({ success: true, data: { settings: next, meta: { stored: true, updatedAt: at, updatedBy: by, ...status(next, profile) } } });
  });

  /* ── admin: dry run / preview (read only) ─────────────── */
  router.post("/automations/preview", requireAdminJWT, requireCrmAdmin, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    let settings;
    if (req.body?.settings) {
      const v = validateCrmSettings(req.body.settings);
      if (Object.keys(v.errors).length) return res.status(400).json({ success: false, error: "Please fix the highlighted fields", errors: v.errors });
      settings = v.settings;
    } else settings = (await readCrmSettings(client)).settings;
    const profile = await profileOf(client);
    try {
      const plan = await buildPlan(client, { settings, profile, now: now(), env, ignoreToggles: true });
      const items = plan.items.slice(0, 300).map((it) => (it.channel === "email" ? { ...it, html: buildEmailMessage(it, { profile, env }).html } : it));
      return res.json({ success: true, data: { items, total: plan.items.length, notes: plan.notes, today: plan.today, reviewUrlSource: plan.reviewUrlSource, ...status(settings, profile) } });
    } catch (e) {
      return res.status(500).json({ success: false, error: e?.message || "Preview failed" });
    }
  });

  /* ── admin: log + WhatsApp queue ──────────────────────── */
  async function listLog(req, res, { queueOnly = false } = {}) {
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    let q = client.from(LOG_TABLE).select("*", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (queueOnly) q = q.eq("channel", "whatsapp").eq("status", "queued");
    else {
      if (AUTOMATION_IDS.includes(req.query.automation)) q = q.eq("automation", req.query.automation);
      if (["email", "whatsapp"].includes(req.query.channel)) q = q.eq("channel", req.query.channel);
      if (LOG_STATUSES.includes(req.query.status)) q = q.eq("status", req.query.status);
    }
    const { data, error, count } = await q;
    if (error) {
      const missing = isMissingTable(error);
      return res.status(missing ? 501 : 500).json({ success: false, error: missing ? "crm_message_log table not created yet (migration 020 pending)" : "Could not load the log" });
    }
    return res.json({ success: true, data: data || [], total: count ?? (data || []).length });
  }
  router.get("/log", requireAdminJWT, requireCrmAdmin, (req, res) => listLog(req, res));
  router.get("/whatsapp-queue", requireAdminJWT, requireCrmAdmin, (req, res) => listLog(req, res, { queueOnly: true }));

  router.patch("/log/:id", requireAdminJWT, requireCrmAdmin, async (req, res) => {
    const next = s(req.body?.status, 20);
    if (!["sent_manual", "skipped"].includes(next)) return res.status(400).json({ success: false, error: "status must be sent_manual or skipped" });
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const id = s(req.params.id, 64);
    const cur = await client.from(LOG_TABLE).select("id, channel, status").eq("id", id).maybeSingle();
    if (cur.error) return res.status(500).json({ success: false, error: "Could not load" });
    if (!cur.data) return res.status(404).json({ success: false, error: "Not found" });
    if (cur.data.channel !== "whatsapp" || cur.data.status !== "queued") return res.status(409).json({ success: false, error: "Only queued WhatsApp messages can be marked" });
    const by = s(req.admin?.username || "unknown", 80);
    const patch = { status: next, sent_at: next === "sent_manual" ? now().toISOString() : null, handled_by: by };
    const upd = await client.from(LOG_TABLE).update(patch).eq("id", id).eq("status", "queued");
    if (upd?.error) return res.status(500).json({ success: false, error: "Could not update" });
    return res.json({ success: true, data: { id, ...patch } });
  });

  /* ── admin: opt-outs (add only, no delete) ────────────── */
  router.get("/opt-outs", requireAdminJWT, requireCrmAdmin, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const { data, error } = await client.from(OPT_OUT_TABLE).select("*").order("created_at", { ascending: false }).limit(500);
    if (error) return res.status(isMissingTable(error) ? 501 : 500).json({ success: false, error: isMissingTable(error) ? "crm_opt_outs table not created yet (migration 020 pending)" : "Could not load opt-outs" });
    return res.json({ success: true, data: data || [] });
  });
  router.post("/opt-outs", requireAdminJWT, requireCrmAdmin, async (req, res) => {
    const contact = normEmail(req.body?.contact) || phone10(req.body?.contact);
    if (!contact) return res.status(400).json({ success: false, error: "Enter a valid email or 10-digit mobile number", errors: { contact: "Enter a valid email or 10-digit mobile number" } });
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const row = { contact, channel: "all", source: "admin", reason: s(req.body?.reason, 200) || null, created_by: s(req.admin?.username || "unknown", 80) };
    const { error } = await client.from(OPT_OUT_TABLE).upsert([row], { onConflict: "contact", ignoreDuplicates: true });
    if (error) return res.status(isMissingTable(error) ? 501 : 500).json({ success: false, error: "Could not save the opt-out" });
    return res.status(201).json({ success: true, data: row });
  });

  /* ── public: unsubscribe ──────────────────────────────── */
  const unsubLimiter = simpleRateLimit({ windowMs: 60_000, limit: 30, message: "Too many requests" });
  router.get("/unsubscribe", unsubLimiter, (req, res) => {
    const token = String(req.query.t || "");
    const contact = readUnsubscribeToken(token, unsubscribeSecret(env));
    res.set("Cache-Control", "no-store");
    if (!contact) return res.status(400).type("html").send(page("Link not valid", "<h2>This unsubscribe link is not valid</h2><p>Please WhatsApp us on +91 98561 12727 and we'll stop the messages.</p>"));
    return res.type("html").send(page("Unsubscribe", `<h2>Stop follow-up messages?</h2><p style="color:#475569;">We'll stop sending reminders and follow-ups to <b>${escapeHtml(contact)}</b>.</p>
<form method="post" action="?t=${encodeURIComponent(token)}"><button type="submit" style="background:#0C6E44;color:#fff;border:0;border-radius:8px;padding:12px 24px;font-size:16px;cursor:pointer;">Unsubscribe</button></form>`));
  });
  router.post("/unsubscribe", unsubLimiter, express.urlencoded({ extended: false }), async (req, res) => {
    const contact = readUnsubscribeToken(String(req.query.t || ""), unsubscribeSecret(env));
    if (!contact) return res.status(400).type("html").send(page("Link not valid", "<h2>This unsubscribe link is not valid</h2>"));
    try {
      const client = await getDb();
      const { error } = await client.from(OPT_OUT_TABLE).upsert([{ contact, channel: "all", source: "email_link", reason: null, created_by: "customer" }], { onConflict: "contact", ignoreDuplicates: true });
      if (error) throw new Error("opt-out write failed");
    } catch (e) {
      log(`crm unsubscribe failed: ${e?.message || "error"}`);
      return res.status(503).type("html").send(page("Try again", "<h2>Sorry, something went wrong</h2><p>Please try again, or WhatsApp us on +91 98561 12727.</p>"));
    }
    return res.type("html").send(page("Unsubscribed", "<h2>You're unsubscribed</h2><p style=\"color:#475569;\">You won't get any more follow-ups or reminders from Gadvede Trekkers.</p>"));
  });

  return router;
}

export default createCrmAutomationsRouter;
