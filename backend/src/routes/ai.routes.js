import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { readAiConfig, resolveApiKey } from "../services/ai/aiConfig.js";
import { createUsageCounter } from "../services/ai/aiUsage.js";
import { AiError, createGeminiClient, redactKeys } from "../services/ai/geminiClient.js";
import { findTrip, tripChoices, tripFactsFor } from "../services/ai/tripFacts.js";
import { draftBlog, draftReplies, validateBlogRequest, validateReplyRequest } from "../services/ai/aiService.js";

/**
 * AI helpers for staff (Google Gemini). Mounted at /api/ai. Every route needs the admin JWT (any staff role).
 *
 *   GET  /status        AI switch, whether a key is configured (true/false + where from), models, today's usage.
 *                       Never returns the key or any part of it.
 *   GET  /trips         { slug, name, type } list for the trip picker (active trips only).
 *   POST /reply-draft   Draft 1–3 replies to an Instagram DM / WhatsApp / website enquiry using ONLY the trip's DB data.
 *   POST /blog-draft    Draft a blog/SEO article (title, meta description, slug, headings, FAQ). Not saved here.
 *
 * DRAFTS ONLY: there is no send route. Replies come back to the page, a person edits them, then copies them or opens
 * wa.me / mailto themselves. Every response carries { draft: true, autoSend: false }.
 * AI_ENABLED !== "true" → 503 AI_DISABLED and Google is never called. Missing key → 503 NO_KEY (no call).
 * Limits: AI_DAILY_LIMIT per IST day (whole backend), AI_USER_DAILY_LIMIT per user, 8 requests/minute per user,
 * AI_TIMEOUT_MS per call. Drafts are logged to activity_logs without message text, names or phone numbers.
 */
export function createAiRouter({
  env = process.env,
  listTrips,          // async () => public product items (default: listActiveProducts)
  secrets,            // { getSecret(name) } — default: services/secretsStore.js if present
  clientFactory = (apiKey) => createGeminiClient({ apiKey }),
  db,                 // async () => supabase client, for the activity log (best effort)
  now = () => new Date(),
  log = (m) => console.log(m),
} = {}) {
  const router = express.Router();
  const usage = createUsageCounter({ now });
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);
  const loadTrips = listTrips ?? (async () => {
    const { listActiveProducts } = await import("../controllers/products.controller.js");
    const { data, error } = await listActiveProducts();
    if (error) throw new Error("catalog read failed");
    return data || [];
  });
  let cache = { at: 0, items: null };
  const trips = async () => {
    if (cache.items && Date.now() - cache.at < 120_000) return cache.items;
    const items = await loadTrips();
    cache = { at: Date.now(), items };
    return items;
  };

  const userOf = (req) => String(req.admin?.username || "unknown").slice(0, 80);
  const perMinute = simpleRateLimit({ windowMs: 60_000, limit: 8, key: (req) => `ai:${userOf(req)}`, message: { success: false, code: "RATE_LIMITED", error: "Too many AI requests. Wait a minute and try again." } });
  const noStore = (req, res, next) => { res.set("Cache-Control", "no-store"); next(); };

  router.use(requireAdminJWT, noStore);

  // Keys seen by this router, kept in memory ONLY so error logs can be scrubbed of them. Never returned or logged.
  const seenKeys = new Set();
  const fail = (res, e, what) => {
    if (e instanceof AiError) return res.status(e.status).json({ success: false, code: e.code, error: e.message, draft: true, autoSend: false });
    log(`ai ${what} failed: ${redactKeys(e?.message || "error", [...seenKeys]).slice(0, 160)}`);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", error: "Something went wrong. Please try again.", draft: true, autoSend: false });
  };

  async function audit(req, action, details) {
    try {
      const client = await getDb();
      await client.from("activity_logs").insert([{
        action, action_label: action === "AI_REPLY_DRAFT" ? "AI reply draft created (not sent)" : "AI blog draft created (not published)",
        details: JSON.stringify(details), module: "ai", severity: "info", performed_by: userOf(req),
      }]).then((r) => r, () => null);
    } catch { /* audit is best effort for drafts: nothing is sent or saved */ }
  }

  /** Common gate: switch → key → limits. Returns { client, cfg } or throws AiError. */
  async function gate(req) {
    const cfg = readAiConfig(env);
    if (!cfg.enabled) throw new AiError("AI_DISABLED", "AI is switched off. The owner can turn it on with AI_ENABLED=true on the backend.", { status: 503 });
    const { key } = await resolveApiKey({ env, secrets });
    if (key) { seenKeys.clear(); seenKeys.add(key); }
    if (!key) throw new AiError("NO_KEY", "No Gemini API key is set yet. The owner needs to add GEMINI_API_KEY (free from aistudio.google.com/apikey).", { status: 503 });
    const t = usage.take(userOf(req), cfg);
    if (!t.ok) {
      throw new AiError(t.scope === "day" ? "DAILY_LIMIT" : "USER_LIMIT", t.scope === "day"
        ? `Today's AI limit (${cfg.dailyLimit}) is used up. It resets at midnight IST.`
        : `You've used your ${cfg.userDailyLimit} AI drafts for today. It resets at midnight IST.`, { status: 429 });
    }
    return { client: clientFactory(key), cfg };
  }

  router.get("/status", async (req, res) => {
    const cfg = readAiConfig(env);
    const { source } = await resolveApiKey({ env, secrets });
    return res.json({ success: true, data: {
      enabled: cfg.enabled, keyConfigured: Boolean(source), keySource: source, model: cfg.model, blogModel: cfg.blogModel,
      dailyLimit: cfg.dailyLimit, userDailyLimit: cfg.userDailyLimit, ...usage.stats(userOf(req)), provider: "Google Gemini",
      autoSend: false,
    } });
  });

  router.get("/trips", async (req, res) => {
    try {
      return res.json({ success: true, data: tripChoices(await trips()) });
    } catch (e) {
      return fail(res, e, "trips");
    }
  });

  router.post("/reply-draft", perMinute, async (req, res) => {
    try {
      const input = validateReplyRequest(req.body || {});
      const { client, cfg } = await gate(req);
      let items = [];
      try { items = await trips(); } catch { items = []; }
      const trip = findTrip(items, { slug: input.tripSlug, name: input.eventName });
      const facts = tripFactsFor(trip, { now: now() });
      const out = await draftReplies(client, input, { facts, model: cfg.model, timeoutMs: cfg.timeoutMs });
      audit(req, "AI_REPLY_DRAFT", { channel: input.channel, trip: facts?.slug || null, enquiryId: input.enquiryId || null, variants: out.drafts.length, model: out.model });
      return res.json({ success: true, data: {
        drafts: out.drafts, subject: out.subject, channel: input.channel,
        trip: facts ? { slug: facts.slug, name: facts.name, url: facts.url } : null,
        factsUsed: facts ? { prices: facts.prices, upcomingDates: facts.upcomingDates.map((d) => d.label), pickups: facts.pickups } : null,
        guard: facts ? { prices: facts.prices.map((p) => p.price), dates: facts.upcomingDates.flatMap((d) => [d.date, d.endDate].filter(Boolean)) } : { prices: [], dates: [] },
        model: out.model, draft: true, autoSend: false,
      } });
    } catch (e) {
      return fail(res, e, "reply-draft");
    }
  });

  router.post("/blog-draft", perMinute, async (req, res) => {
    try {
      const input = validateBlogRequest(req.body || {});
      const { client, cfg } = await gate(req);
      let facts = null;
      if (input.tripSlug) {
        let items = [];
        try { items = await trips(); } catch { items = []; }
        facts = tripFactsFor(findTrip(items, { slug: input.tripSlug }), { now: now() });
      }
      const out = await draftBlog(client, input, { facts, model: cfg.blogModel, timeoutMs: cfg.timeoutMs * 2 });
      audit(req, "AI_BLOG_DRAFT", { trip: facts?.slug || null, keywords: input.keywords.length, model: out.model });
      return res.json({ success: true, data: { ...out.draft, warnings: out.warnings, model: out.model, aiGenerated: true, status: "draft", draft: true, autoSend: false } });
    } catch (e) {
      return fail(res, e, "blog-draft");
    }
  });

  return router;
}

export default createAiRouter;
