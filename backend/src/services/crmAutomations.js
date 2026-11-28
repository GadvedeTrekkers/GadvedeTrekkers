/**
 * CRM automations engine: who is due for which message, building the messages, and processing them with
 * idempotency (nobody gets the same message twice). Settings/templates/validation live in shared/crmAutomations.js.
 *
 * Tables (migration 020, NOT run yet): crm_message_log (unique idempotency_key = the at-most-once guarantee),
 * crm_opt_outs. Settings: site_settings key "crm.automations". Reads bookings, payment_registrations, enquiries,
 * products (all existing tables) — read only.
 *
 * Safety:
 *   - every automation is OFF by default; the cron only writes/sends when CRM_AUTOMATIONS_LIVE === "true",
 *     otherwise a cron run is a dry run (no DB writes, no mail).
 *   - a log row is INSERTED (claimed) before an email is sent; a duplicate key means someone else already handled it.
 *     A failed or interrupted send is never retried automatically (at most once).
 *   - emails always carry an unsubscribe link; without an unsubscribe secret no email is sent.
 *   - The "whatsapp" channel is never sent by the server: it only queues prefilled wa.me links for a person to send.
 *   - The optional "whatsapp_api" channel (pre-trip reminder only, OFF by default) sends an approved template through
 *     the WhatsApp Cloud API, and only when CRM_AUTOMATIONS_LIVE=true AND WHATSAPP_API_LIVE=true.
 */
import crypto from "crypto";
import {
  AUTOMATION_IDS, CRM_SETTINGS_KEY, DEFAULT_SITE_URL, normEmail, phone10, renderTemplate, waLink, withCrmDefaults,
} from "../../../shared/crmAutomations.js";
import { renderWhatsappTemplate } from "../../../shared/whatsappTemplates.js";
import { whatsappConfig } from "../config/meta.js";
import { sendLoggedTemplate } from "./whatsappCloud.js";

export const LOG_TABLE = "crm_message_log";
export const OPT_OUT_TABLE = "crm_opt_outs";
const CLOSED_ENQUIRY = new Set(["CONVERTED", "LOST", "CLOSED", "SPAM"]);
const DEAD_BOOKING = new Set(["CANCELLED", "CANCELED", "REFUNDED", "FAILED", "REJECTED"]);

/* ── time helpers (IST) ─────────────────────────────────────── */
const IST_MS = 330 * 60_000;
export const istToday = (now) => new Date(now.getTime() + IST_MS).toISOString().slice(0, 10);
export const istHour = (now) => new Date(now.getTime() + IST_MS).getUTCHours();
export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function prettyDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "there";
const eventKey = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "trip";
export const isMissingTable = (error) => /relation .* does not exist|schema cache|could not find the table/i.test(error?.message || "");

/* ── settings ───────────────────────────────────────────────── */
export async function readCrmSettings(client) {
  try {
    const { data, error } = await client.from("site_settings").select("value, updated_at, updated_by").eq("key", CRM_SETTINGS_KEY).maybeSingle();
    if (error) return { settings: withCrmDefaults({}), stored: false, updatedAt: null, updatedBy: null };
    return { settings: withCrmDefaults(data?.value || {}), stored: Boolean(data), updatedAt: data?.updated_at || null, updatedBy: data?.updated_by || null };
  } catch {
    return { settings: withCrmDefaults({}), stored: false, updatedAt: null, updatedBy: null };
  }
}

/** Google review link: Automations setting → env GOOGLE_REVIEW_URL → Profile Setup online.googleReview (if added later). */
export function resolveReviewUrl(settings, env = process.env, profile = null) {
  const ok = (v) => { try { return new URL(v).protocol === "https:" ? String(v) : ""; } catch { return ""; } };
  if (ok(settings?.global?.googleReviewUrl)) return { url: settings.global.googleReviewUrl, source: "automations setting" };
  if (ok(env.GOOGLE_REVIEW_URL)) return { url: env.GOOGLE_REVIEW_URL, source: "env GOOGLE_REVIEW_URL" };
  if (ok(profile?.online?.googleReview)) return { url: profile.online.googleReview, source: "profile" };
  return { url: "", source: "" };
}

/* ── unsubscribe tokens (HMAC, no DB lookup needed) ─────────── */
export function unsubscribeSecret(env = process.env) {
  if (env.CRM_UNSUBSCRIBE_SECRET && env.CRM_UNSUBSCRIBE_SECRET.length >= 16) return env.CRM_UNSUBSCRIBE_SECRET;
  if (env.CRON_SECRET && env.CRON_SECRET.length >= 16) return crypto.createHmac("sha256", env.CRON_SECRET).update("crm-unsubscribe-v1").digest("hex");
  return "";
}
const b64u = (s) => Buffer.from(s).toString("base64url");
export function makeUnsubscribeToken(contact, secret) {
  const body = b64u(JSON.stringify({ c: contact, v: 1 }));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url").slice(0, 32);
  return `${body}.${sig}`;
}
/** → normalized contact (email or 10-digit phone) or "" when the token is bad. */
export function readUnsubscribeToken(token, secret) {
  if (!secret) return "";
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig || body.length > 400) return "";
  const want = crypto.createHmac("sha256", secret).update(body).digest("base64url").slice(0, 32);
  const a = Buffer.from(sig); const b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "";
  try { const c = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))?.c; return normEmail(c) || phone10(c); } catch { return ""; }
}
export function unsubscribeUrl(contact, env = process.env) {
  const secret = unsubscribeSecret(env);
  const base = String(env.BACKEND_URL || "").replace(/\/$/, "");
  if (!secret || !/^https?:\/\//.test(base)) return "";
  return `${base}/api/crm/unsubscribe?t=${encodeURIComponent(makeUnsubscribeToken(contact, secret))}`;
}

/* ── message building ───────────────────────────────────────── */
export function escapeHtml(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function linkify(escaped) {
  return escaped.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (u) => `<a href="${u}" style="color:#0C6E44;">${u}</a>`);
}
export function emailHtml({ subject, body, company, whatsappDisplay, whatsappHref, website, unsubscribe }) {
  const paras = String(body).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">${linkify(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f1f5f9;padding:16px;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#0C6E44,#065f46);padding:24px;text-align:center;"><div style="color:#fff;font-size:22px;font-weight:700;">${escapeHtml(company)}</div></div>
<div style="padding:24px;">${paras}</div>
<div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;text-align:center;line-height:1.6;">
${escapeHtml(company)} · WhatsApp <a href="${escapeHtml(whatsappHref)}" style="color:#0C6E44;">${escapeHtml(whatsappDisplay)}</a> · <a href="${escapeHtml(website)}" style="color:#0C6E44;">${escapeHtml(website.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a><br>
You're getting this because you enquired or booked with us. <a href="${escapeHtml(unsubscribe)}" style="color:#64748b;">Unsubscribe</a> from these messages.
</div></div></body></html>`;
}

function brand(profile) {
  const wa = String(profile?.whatsappNumber || "919856112727");
  const d = wa.replace(/^91/, "");
  return {
    company: String(profile?.companyName || "Gadvede Trekkers").replace(/["<>\r\n]/g, "").slice(0, 80) || "Gadvede Trekkers",
    whatsappNumber: `+91 ${d.slice(0, 5)} ${d.slice(5)}`,
    whatsappLink: `https://wa.me/${wa}`,
    website: profile?.online?.website || DEFAULT_SITE_URL,
  };
}

/** The exact email (subject/html/text) an item would produce — used by sending and by the admin preview. */
export function buildEmailMessage(item, { profile = null, env = process.env } = {}) {
  const b = brand(profile);
  const unsub = unsubscribeUrl(item.email, env) || "https://(backend)/api/crm/unsubscribe?t=…";
  return {
    subject: item.subject,
    text: `${item.text}\n\n—\nUnsubscribe from these messages: ${unsub}`,
    html: emailHtml({ subject: item.subject, body: item.text, company: b.company, whatsappDisplay: b.whatsappNumber, whatsappHref: b.whatsappLink, website: b.website, unsubscribe: unsub }),
    unsubscribe: unsub,
  };
}

/* ── candidate loading (read only) ─────────────────────────── */
async function rows(q, label) {
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(`${label} read failed`);
  }
  return data || [];
}

async function loadOptOuts(client) {
  const list = await rows(client.from(OPT_OUT_TABLE).select("contact").limit(10000), "opt-outs");
  return new Set(list.map((r) => normEmail(r.contact) || phone10(r.contact)).filter(Boolean));
}

async function loadExistingKeys(client, keys) {
  const out = new Map();
  for (let i = 0; i < keys.length; i += 200) {
    const part = keys.slice(i, i + 200);
    if (!part.length) continue;
    const list = await rows(client.from(LOG_TABLE).select("idempotency_key, status, created_at, source_id, step").in("idempotency_key", part), "message log");
    list.forEach((r) => out.set(r.idempotency_key, r));
  }
  return out;
}

/** People on a trip date window: bookings (not cancelled) + VERIFIED payment registrations, de-duplicated per person+date+trip. */
async function loadTravellers(client, from, to) {
  const bookings = await rows(client.from("bookings")
    .select("id, booking_code, product_id, status, payment_status, lead_first_name, lead_last_name, lead_phone, lead_whatsapp, lead_email, travel_date, pickup_location, notes")
    .gte("travel_date", from).lte("travel_date", to).limit(5000), "bookings");
  const productIds = [...new Set(bookings.map((b) => b.product_id).filter(Boolean))];
  const products = productIds.length ? await rows(client.from("products").select("id, name").in("id", productIds), "products") : [];
  const pname = new Map(products.map((p) => [p.id, p.name]));
  const regs = await rows(client.from("payment_registrations")
    .select("id, reference, status, full_name, mobile, whatsapp, email, event_name, batch_date, pickup_point")
    .eq("status", "verified").gte("batch_date", from).lte("batch_date", to).limit(5000), "payment registrations");

  const people = new Map();
  const add = (p) => {
    if (!p.phone && !p.email) return;
    const key = `${p.date}:${p.phone || p.email}:${eventKey(p.event)}`;
    if (!people.has(key)) people.set(key, { ...p, personKey: key });
  };
  for (const b of bookings) {
    if (DEAD_BOOKING.has(String(b.status || "").toUpperCase()) || String(b.payment_status || "").toUpperCase() === "FAILED") continue;
    add({
      sourceType: "booking", sourceId: String(b.id), ref: b.booking_code,
      fullName: [b.lead_first_name, b.lead_last_name].filter((x) => x && x !== "Unknown").join(" "),
      phone: phone10(b.lead_whatsapp) || phone10(b.lead_phone), email: normEmail(b.lead_email),
      event: pname.get(b.product_id) || "your trip", date: b.travel_date, pickupPoint: b.pickup_location || "",
    });
  }
  for (const r of regs) {
    add({
      sourceType: "payment_registration", sourceId: String(r.id), ref: r.reference,
      fullName: r.full_name || "", phone: phone10(r.whatsapp) || phone10(r.mobile), email: normEmail(r.email),
      event: r.event_name || "your trip", date: r.batch_date, pickupPoint: r.pickup_point || "",
    });
  }
  return [...people.values()];
}

/** Contacts that already booked or registered a payment (stops enquiry follow-ups). */
async function loadBookedContacts(client, sinceIso) {
  const set = new Set();
  const b = await rows(client.from("bookings").select("lead_phone, lead_whatsapp, lead_email, created_at").gte("created_at", sinceIso).limit(10000), "bookings");
  b.forEach((x) => [phone10(x.lead_phone), phone10(x.lead_whatsapp), normEmail(x.lead_email)].forEach((c) => c && set.add(c)));
  const r = await rows(client.from("payment_registrations").select("mobile, whatsapp, email, created_at").gte("created_at", sinceIso).limit(10000), "payment registrations");
  r.forEach((x) => [phone10(x.mobile), phone10(x.whatsapp), normEmail(x.email)].forEach((c) => c && set.add(c)));
  return set;
}

export function pickupTimeFor(pickupPoint, cfg) {
  const p = String(pickupPoint || "").toLowerCase();
  const hit = (cfg.pickupTimes || []).find((m) => m.match && p.includes(m.match.toLowerCase()));
  if (hit) return hit.time;
  const inText = /\b(\d{1,2}[:.]\d{2}\s*(?:AM|PM)?|\d{1,2}\s*(?:AM|PM))\b/i.exec(String(pickupPoint || ""));
  if (inText) return inText[1].toUpperCase().replace(".", ":");
  return cfg.defaultPickupTime;
}

/* ── planning ───────────────────────────────────────────────── */
/**
 * Works out every message that is due now. Pure read: never writes.
 * opts.ignoreToggles: preview mode — plan every automation even when it is OFF (items carry automationEnabled).
 * Returns { items, skipped, notes } where items = [{ automation, step, channel, idempotencyKey, ... , skipReason? }].
 */
export async function buildPlan(client, { settings: rawSettings, profile = null, now = new Date(), env = process.env, ignoreToggles = false } = {}) {
  const settings = withCrmDefaults(rawSettings);
  const b = brand(profile);
  const review = resolveReviewUrl(settings, env, profile);
  const today = istToday(now);
  const optOuts = await loadOptOuts(client);
  const items = []; const notes = [];
  const unsubOk = Boolean(unsubscribeSecret(env)) && /^https?:\/\//.test(String(env.BACKEND_URL || ""));
  if (!unsubOk) notes.push("Emails are held: set CRON_SECRET (or CRM_UNSUBSCRIBE_SECRET) and BACKEND_URL so every email can carry an unsubscribe link.");

  const wa = whatsappConfig(env);
  const pushFor = (base, person, vars, tpl) => {
    const contacts = [person.phone, person.email].filter(Boolean);
    const optedOut = contacts.some((c) => optOuts.has(c));
    const cfg = settings[base.automation];
    const channels = [];
    if (cfg.channels.email && person.email) channels.push("email");
    if (cfg.channels.whatsapp && person.phone) channels.push("whatsapp");
    if (cfg.channels.whatsappApi && person.phone && base.waTemplate) channels.push("whatsapp_api");
    for (const channel of channels) {
      const allVars = { ...b, ...vars };
      const item = {
        ...base, channel, automationEnabled: cfg.enabled,
        idempotencyKey: `${base.keyPrefix}:${channel}`,
        recipientName: person.fullName || "", email: person.email || "", phone: person.phone || "",
        subject: channel === "email" ? renderTemplate(tpl.subject, allVars).replace(/[\r\n]+/g, " ").slice(0, 200) : "",
        text: channel === "whatsapp_api"
          ? renderWhatsappTemplate(base.waTemplate.id, base.waTemplate.params)
          : renderTemplate(channel === "email" ? tpl.body : tpl.waBody, allVars),
      };
      if (channel === "whatsapp") item.waLink = waLink(person.phone, item.text);
      if (channel === "whatsapp_api") item.waTemplate = base.waTemplate;
      if (optedOut) item.skipReason = "Customer opted out";
      else if (channel === "email" && !unsubOk) item.skipReason = "Unsubscribe link not configured";
      else if (channel === "whatsapp_api" && !(wa.configured && wa.templates[base.waTemplate.id])) item.skipReason = "WhatsApp Cloud API or template not set";
      else if (base.requiresReview && !review.url) item.skipReason = "Google review link not set";
      delete item.keyPrefix; delete item.requiresReview; if (channel !== "whatsapp_api") delete item.waTemplate;
      items.push(item);
    }
  };

  // 1. Enquiry follow-ups
  const ef = settings.enquiryFollowup;
  if ((ef.enabled || ignoreToggles) && ef.steps.length) {
    let since = new Date(now.getTime() - ef.maxAgeDays * 86_400_000);
    if (ef.enabled && ef.onlyNewEnquiries && ef.enabledAt && new Date(ef.enabledAt) > since) since = new Date(ef.enabledAt);
    const enquiries = await rows(client.from("enquiries")
      .select("id, name, phone, email, event_name, page_url, status, archived_at, booked_booking_id, created_at")
      .gte("created_at", since.toISOString()).limit(5000), "enquiries");
    const open = enquiries.filter((e) => !e.archived_at && !e.booked_booking_id && !CLOSED_ENQUIRY.has(String(e.status || "").toUpperCase()));
    const booked = open.length ? await loadBookedContacts(client, new Date(since.getTime() - 120 * 86_400_000).toISOString()) : new Set();
    const keys = open.flatMap((e) => ef.steps.flatMap((_, i) => ["email", "whatsapp"].map((ch) => `enquiryFollowup:enquiry:${e.id}:step${i + 1}:${ch}`)));
    const logged = await loadExistingKeys(client, keys);
    for (const e of open) {
      const person = { fullName: e.name || "", phone: phone10(e.phone), email: normEmail(e.email) };
      if ([person.phone, person.email].some((c) => c && booked.has(c))) continue; // already booked / paid → stop
      // next step = first step with no log row on any channel
      let stepIdx = -1; let prevAt = null;
      for (let i = 0; i < ef.steps.length; i += 1) {
        const rowsForStep = ["email", "whatsapp"].map((ch) => logged.get(`enquiryFollowup:enquiry:${e.id}:step${i + 1}:${ch}`)).filter(Boolean);
        if (!rowsForStep.length) { stepIdx = i; break; }
        prevAt = rowsForStep.map((r) => new Date(r.created_at).getTime()).filter(Number.isFinite).sort((a, z) => z - a)[0] ?? null;
      }
      if (stepIdx < 0) continue;
      const st = ef.steps[stepIdx];
      const created = new Date(e.created_at).getTime();
      let due = created + st.delayHours * 3_600_000;
      if (stepIdx > 0 && prevAt) due = Math.max(due, prevAt + (st.delayHours - ef.steps[stepIdx - 1].delayHours) * 3_600_000);
      if (due > now.getTime()) continue;
      pushFor({ automation: "enquiryFollowup", step: stepIdx + 1, sourceType: "enquiry", sourceId: String(e.id), dueAt: new Date(due).toISOString(),
        context: e.event_name || "", keyPrefix: `enquiryFollowup:enquiry:${e.id}:step${stepIdx + 1}` },
      person, { name: firstName(e.name), fullName: e.name || "", event: e.event_name || "your trip", eventLink: e.page_url && /^https:\/\//.test(e.page_url) ? e.page_url : b.website }, st);
    }
  }

  // 2. Pre-trip reminders: trips from tomorrow up to daysBefore ahead (a missed cron day still gets a reminder)
  const pt = settings.preTrip;
  if (pt.enabled || ignoreToggles) {
    const people = await loadTravellers(client, addDays(today, 1), addDays(today, pt.daysBefore));
    const keys = people.flatMap((p) => ["email", "whatsapp", "whatsapp_api"].map((ch) => `preTrip:${p.personKey}:${ch}`));
    const logged = await loadExistingKeys(client, keys);
    for (const p of people) {
      const pickup = p.pickupPoint || "As mentioned on your ticket";
      const vars = { name: firstName(p.fullName), fullName: p.fullName, event: p.event, date: prettyDate(p.date), pickupPoint: pickup, pickupTime: pickupTimeFor(p.pickupPoint, pt) };
      const waTemplate = { id: "preTripReminder", params: [vars.name, vars.event, vars.date, vars.pickupPoint, vars.pickupTime] };
      const before = items.length;
      pushFor({ automation: "preTrip", step: 1, sourceType: p.sourceType, sourceId: p.sourceId, dueAt: `${addDays(p.date, -pt.daysBefore)}T09:00:00+05:30`,
        context: `${p.event} · ${p.date}`, tripDate: p.date, keyPrefix: `preTrip:${p.personKey}`, waTemplate }, p, vars, pt);
      for (let i = items.length - 1; i >= before; i -= 1) if (logged.has(items[i].idempotencyKey)) items.splice(i, 1);
    }
  }

  // 3. Post-trip welcome back: trips that ended daysAfter ago (2-day catch-up window, never before the switch-on date)
  const po = settings.postTrip;
  if (po.enabled || ignoreToggles) {
    const to = addDays(today, -po.daysAfter);
    let from = addDays(to, -2);
    if (po.enabled && po.enabledAt) { const on = addDays(istToday(new Date(po.enabledAt)), -po.daysAfter); if (on > from) from = on; }
    const people = from <= to ? await loadTravellers(client, from, to) : [];
    const keys = people.flatMap((p) => ["email", "whatsapp"].map((ch) => `postTrip:${p.personKey}:${ch}`));
    const logged = await loadExistingKeys(client, keys);
    const offerLine = po.offerCode ? renderTemplate(po.offerText, { offerCode: po.offerCode }) : "";
    for (const p of people) {
      const vars = { name: firstName(p.fullName), fullName: p.fullName, event: p.event, date: prettyDate(p.date), reviewLink: review.url, feedbackLink: settings.global.feedbackUrl, offerCode: po.offerCode, offerLine };
      const before = items.length;
      pushFor({ automation: "postTrip", step: 1, sourceType: p.sourceType, sourceId: p.sourceId, dueAt: `${addDays(p.date, po.daysAfter)}T09:00:00+05:30`,
        context: `${p.event} · ${p.date}`, tripDate: p.date, keyPrefix: `postTrip:${p.personKey}`, requiresReview: true }, p, vars, po);
      for (let i = items.length - 1; i >= before; i -= 1) if (logged.has(items[i].idempotencyKey)) items.splice(i, 1);
    }
  }

  return { items, notes, reviewUrlSource: review.source, today };
}

/* ── processing ─────────────────────────────────────────────── */
/** Default mailer: existing Gmail transport from emailService.js (GMAIL_USER / GMAIL_APP_PASSWORD). */
export async function defaultSendMail(msg) {
  const { createTransporter } = await import("./emailService.js");
  return createTransporter().sendMail(msg);
}
export const gmailConfigured = (env = process.env) => Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
export const isLive = (env = process.env) => env.CRM_AUTOMATIONS_LIVE === "true";

/**
 * Processes due messages. live=false → returns the plan only (dry run, zero writes).
 * live=true → for each item: INSERT log row (claim; unique idempotency_key) → send email / queue WhatsApp → update status.
 * Returns counts only (no personal data) plus, for dry runs, the planned items.
 */
export async function processDue(client, {
  settings, profile = null, now = new Date(), env = process.env, live = isLive(env), sendMail = defaultSendMail, fetchImpl = globalThis.fetch, log = () => {},
} = {}) {
  const s = withCrmDefaults(settings);
  const summary = { live, today: istToday(now), considered: 0, emailed: 0, queuedWhatsApp: 0, sentWhatsAppApi: 0, failed: 0, duplicates: 0, skipped: 0, heldOutsideWindow: 0, heldNoGmail: 0, heldWhatsAppApiDryRun: 0, notes: [] };
  const waLive = whatsappConfig(env).live;
  if (!AUTOMATION_IDS.some((id) => s[id].enabled)) { summary.notes.push("All automations are off."); return summary; }
  const plan = await buildPlan(client, { settings: s, profile, now, env });
  summary.notes.push(...plan.notes);
  const hour = istHour(now);
  const inWindow = hour >= s.global.sendWindow.startHour && hour < s.global.sendWindow.endHour;
  const routing = (await import("./businessProfile.js")).emailRouting(profile);
  let budget = s.global.maxPerRun;
  summary.considered = plan.items.length;
  if (!live) { summary.dryRun = true; summary.planned = plan.items; return summary; }

  for (const item of plan.items) {
    if (item.skipReason) { summary.skipped += 1; continue; }
    if (item.channel !== "whatsapp" && !inWindow) { summary.heldOutsideWindow += 1; continue; }
    if (item.channel === "email" && !gmailConfigured(env)) { summary.heldNoGmail += 1; continue; }
    if (item.channel === "whatsapp_api" && !waLive) { summary.heldWhatsAppApiDryRun += 1; continue; } // no write, no send
    if (budget <= 0) { summary.notes.push(`Stopped at ${s.global.maxPerRun} messages for this run; the rest go next run.`); break; }
    budget -= 1;
    if (item.channel === "whatsapp_api") {
      const r = await sendLoggedTemplate(client, {
        idempotencyKey: item.idempotencyKey, automation: item.automation, templateId: item.waTemplate.id, sourceType: item.sourceType,
        sourceId: item.sourceId, phone: item.phone, name: item.recipientName, params: item.waTemplate.params, tripDate: item.tripDate, createdBy: "cron",
      }, { env, fetchImpl, log });
      if (r.status === "sent") summary.sentWhatsAppApi += 1;
      else if (r.status === "duplicate") summary.duplicates += 1;
      else if (r.status === "log_unavailable") throw new Error("crm_message_log table missing (migration 020/021 pending)");
      else if (r.status === "failed") summary.failed += 1;
      else summary.skipped += 1;
      continue;
    }
    const row = {
      idempotency_key: item.idempotencyKey, automation: item.automation, step: item.step, channel: item.channel,
      source_type: item.sourceType, source_id: item.sourceId, recipient_name: item.recipientName || null,
      recipient_email: item.channel === "email" ? item.email : null, recipient_phone: item.channel === "whatsapp" ? item.phone : null,
      subject: item.subject || null, body: item.text, wa_link: item.waLink || null, trip_date: item.tripDate || null,
      status: item.channel === "email" ? "sending" : "queued", created_by: "cron",
    };
    const ins = await client.from(LOG_TABLE).insert([row]).select("id").single();
    if (ins.error) {
      if (ins.error.code === "23505" || /duplicate key/i.test(ins.error.message || "")) { summary.duplicates += 1; continue; }
      throw new Error(isMissingTable(ins.error) ? "crm_message_log table missing (migration 020 pending)" : "message log write failed");
    }
    if (item.channel === "whatsapp") { summary.queuedWhatsApp += 1; continue; }
    const msg = buildEmailMessage(item, { profile, env });
    try {
      await sendMail({
        from: `"${routing.senderName}" <${env.GMAIL_USER}>`,
        to: item.email,
        ...(routing.replyTo.bookingConfirmation ? { replyTo: routing.replyTo.bookingConfirmation } : {}),
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        headers: { "List-Unsubscribe": `<${msg.unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      await client.from(LOG_TABLE).update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", ins.data.id);
      summary.emailed += 1;
    } catch (e) {
      summary.failed += 1;
      log(`crm email failed (${item.automation} step ${item.step}): ${e?.code || "error"}`);
      await client.from(LOG_TABLE).update({ status: "failed", error_code: String(e?.code || "error").slice(0, 60) }).eq("id", ins.data.id);
    }
  }
  return summary;
}
