/**
 * CRM automations (Pratik, t91u roadmap → "Build CRM follow-up and post-trip review automations").
 * Shared by the admin page (src/backend/settings/sections/AutomationSettings.jsx) and the backend
 * (backend/src/services/crmAutomations.js): defaults, validation and template rendering — one copy of the rules.
 *
 * Three automations, every one OFF by default:
 *   enquiryFollowup  enquiries with no booking get up to 3 follow-ups (after X hours each); stop on booking,
 *                    payment registration, opt-out, or when the enquiry is marked CONVERTED / LOST / archived.
 *   preTrip          reminder N days (default 2) before the trip with the pickup point and time.
 *   postTrip         "Welcome back" N days (default 1) after the trip with the Google review link, feedback link
 *                    and an optional next-trip offer code.
 * Channels: email (existing Gmail mailer) and a WhatsApp queue of prefilled wa.me links that a person sends by hand;
 * the pre-trip reminder can also go automatically through the WhatsApp Cloud API (services/whatsappCloud.js).
 * Stored in public.site_settings under key "crm.automations" (table from migration 015). No secrets in here.
 */
export const CRM_SETTINGS_KEY = "crm.automations";
export const AUTOMATION_IDS = ["enquiryFollowup", "preTrip", "postTrip"];
export const AUTOMATION_LABELS = {
  enquiryFollowup: "Enquiry follow-ups",
  preTrip: "Pre-trip reminder",
  postTrip: "Post-trip welcome back + review",
};
/** Message-log entries that don't come from a scheduled automation (WhatsApp Cloud API confirmations). */
export const EVENT_MESSAGE_LABELS = {
  bookingConfirmation: "Booking confirmed (WhatsApp API)",
  paymentVerified: "Payment verified (WhatsApp API)",
};
export const LOG_AUTOMATIONS = [...AUTOMATION_IDS, ...Object.keys(EVENT_MESSAGE_LABELS)];
export const MAX_FOLLOWUP_STEPS = 3;
export const LOG_STATUSES = ["sending", "sent", "failed", "queued", "sent_manual", "skipped"];
/** email = Gmail; whatsapp = wa.me queue sent by a person; whatsapp_api = automatic WhatsApp Cloud API template. */
export const LOG_CHANNELS = ["email", "whatsapp", "whatsapp_api"];
export const DEFAULT_FEEDBACK_URL = "https://www.gadvede.com/feedback";
export const DEFAULT_SITE_URL = "https://www.gadvede.com/";

/** Placeholders a template may use. Unknown {{tokens}} are left out (rendered as empty). */
export const PLACEHOLDERS = {
  common: [
    ["name", "Customer first name"],
    ["fullName", "Customer full name"],
    ["event", "Trek / tour name"],
    ["company", "Company name (Profile Setup)"],
    ["whatsappNumber", "Your WhatsApp number, e.g. +91 98561 12727"],
    ["whatsappLink", "wa.me link to your WhatsApp"],
    ["website", "Website link"],
  ],
  enquiryFollowup: [["eventLink", "Page the customer enquired from (or website)"]],
  preTrip: [["date", "Trip date"], ["pickupPoint", "Pickup point"], ["pickupTime", "Pickup time"]],
  postTrip: [
    ["date", "Trip date"], ["reviewLink", "Google review link"], ["feedbackLink", "Feedback form link"],
    ["offerCode", "Next-trip offer code"], ["offerLine", "Offer sentence (empty when no code)"],
  ],
};
export const placeholdersFor = (id) => [...PLACEHOLDERS.common, ...(PLACEHOLDERS[id] || [])];

const step = (delayHours, subject, body, waBody) => ({ delayHours, subject, body, waBody });

export function defaultCrmSettings() {
  return {
    version: 1,
    global: {
      googleReviewUrl: "",               // e.g. https://g.page/r/XXXX/review — falls back to env GOOGLE_REVIEW_URL
      feedbackUrl: DEFAULT_FEEDBACK_URL,
      sendWindow: { startHour: 9, endHour: 20 }, // IST hours; emails go out only inside this window
      maxPerRun: 100,
    },
    enquiryFollowup: {
      enabled: false,
      enabledAt: null,
      channels: { email: true, whatsapp: true },
      onlyNewEnquiries: true,            // only enquiries created after the automation was switched on
      maxAgeDays: 14,                    // never follow up enquiries older than this
      steps: [
        step(24,
          "Still planning {{event}}? We're here to help",
          "Hi {{name}},\n\nThanks for your enquiry about {{event}}. Do you have any questions about dates, pickup points, what to carry or the cost? Just reply to this email or WhatsApp us on {{whatsappNumber}} and we'll help you book.\n\nTrip details: {{eventLink}}\n\nTeam {{company}}",
          "Hi {{name}}, this is {{company}}. Thanks for asking about {{event}}! Any questions about dates, pickup or cost? Reply here and we'll help you book. {{eventLink}}"),
        step(72,
          "Seats for {{event}} are filling up",
          "Hi {{name}},\n\nJust checking in about {{event}}. Seats on the upcoming batches are filling up. If you'd like us to hold a seat for you or suggest another date, reply to this email or WhatsApp {{whatsappNumber}}.\n\nTrip details: {{eventLink}}\n\nTeam {{company}}",
          "Hi {{name}}, seats for {{event}} are filling up. Want us to hold a seat or suggest another date? Just reply here. – {{company}}"),
      ],
    },
    preTrip: {
      enabled: false,
      enabledAt: null,
      // whatsappApi: automatic send through the WhatsApp Cloud API (approved template, WHATSAPP_API_LIVE=true needed)
      channels: { email: true, whatsapp: true, whatsappApi: false },
      daysBefore: 2,
      pickupTimes: [],                   // [{ match: "FC Road", time: "7:00 PM" }] — first match on the pickup point wins
      defaultPickupTime: "We'll share the exact pickup time on WhatsApp the day before",
      subject: "{{event}} on {{date}}: your pickup details",
      body: "Hi {{name}},\n\nYour {{event}} trip is on {{date}}. Here are your pickup details:\n\nPickup point: {{pickupPoint}}\nPickup time: {{pickupTime}}\n\nPlease reach the pickup point 15 minutes early and carry a valid ID, water and a torch. For anything urgent, WhatsApp us on {{whatsappNumber}}.\n\nSee you soon!\nTeam {{company}}",
      waBody: "Hi {{name}}, reminder from {{company}}: {{event}} is on {{date}}. Pickup: {{pickupPoint}} at {{pickupTime}}. Please reach 15 minutes early and carry an ID, water and a torch. See you soon!",
    },
    postTrip: {
      enabled: false,
      enabledAt: null,
      channels: { email: true, whatsapp: true },
      daysAfter: 1,
      offerCode: "",
      offerText: "As a thank-you, use code {{offerCode}} on your next trip with us.",
      subject: "Welcome back from {{event}}, {{name}}!",
      body: "Hi {{name}},\n\nWelcome back from {{event}}! We hope you had a great time with us.\n\nIt would mean a lot if you could leave us a quick Google review: {{reviewLink}}\n\nTell us what went well and what we can do better: {{feedbackLink}}\n\n{{offerLine}}\n\nSee you on the next trail!\nTeam {{company}}",
      waBody: "Hi {{name}}, welcome back from {{event}}! Hope you loved it. Could you leave us a quick Google review? {{reviewLink}} Feedback: {{feedbackLink}} {{offerLine}} – {{company}}",
    },
  };
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
// eslint-disable-next-line no-control-regex -- strip control characters from admin-typed templates
const text = (v, max) => String(v ?? "").replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").slice(0, max);
// eslint-disable-next-line no-control-regex
const line = (v, max) => String(v ?? "").replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);
const int = (v, d) => (Number.isFinite(Number(v)) && String(v).trim() !== "" ? Math.round(Number(v)) : d);
const bool = (v, d) => (typeof v === "boolean" ? v : d);

/** Deep-merges stored/partial settings onto the defaults (unknown keys dropped). Never throws. */
export function withCrmDefaults(input) {
  const d = defaultCrmSettings();
  const s = isObj(input) ? input : {};
  const g = isObj(s.global) ? s.global : {};
  const out = {
    version: 1,
    global: {
      googleReviewUrl: line(g.googleReviewUrl ?? d.global.googleReviewUrl, 500),
      feedbackUrl: line(g.feedbackUrl ?? d.global.feedbackUrl, 500),
      sendWindow: {
        startHour: int(g.sendWindow?.startHour, d.global.sendWindow.startHour),
        endHour: int(g.sendWindow?.endHour, d.global.sendWindow.endHour),
      },
      maxPerRun: int(g.maxPerRun, d.global.maxPerRun),
    },
  };
  for (const id of AUTOMATION_IDS) {
    const src = isObj(s[id]) ? s[id] : {};
    const def = d[id];
    const a = {
      ...def,
      enabled: bool(src.enabled, false),
      enabledAt: typeof src.enabledAt === "string" ? src.enabledAt : null,
      channels: {
        email: bool(src.channels?.email, def.channels.email),
        whatsapp: bool(src.channels?.whatsapp, def.channels.whatsapp),
      },
    };
    if (id === "enquiryFollowup") {
      a.onlyNewEnquiries = bool(src.onlyNewEnquiries, def.onlyNewEnquiries);
      a.maxAgeDays = int(src.maxAgeDays, def.maxAgeDays);
      const steps = Array.isArray(src.steps) ? src.steps.slice(0, MAX_FOLLOWUP_STEPS) : def.steps;
      a.steps = steps.map((st, i) => ({
        delayHours: int(st?.delayHours, def.steps[i]?.delayHours ?? 24),
        subject: line(st?.subject ?? def.steps[i]?.subject ?? "", 200),
        body: text(st?.body ?? def.steps[i]?.body ?? "", 4000),
        waBody: text(st?.waBody ?? def.steps[i]?.waBody ?? "", 1000),
      }));
    } else {
      a.subject = line(src.subject ?? def.subject, 200);
      a.body = text(src.body ?? def.body, 4000);
      a.waBody = text(src.waBody ?? def.waBody, 1000);
      if (id === "preTrip") {
        a.channels.whatsappApi = bool(src.channels?.whatsappApi, def.channels.whatsappApi);
        a.daysBefore = int(src.daysBefore, def.daysBefore);
        a.defaultPickupTime = line(src.defaultPickupTime ?? def.defaultPickupTime, 200);
        a.pickupTimes = (Array.isArray(src.pickupTimes) ? src.pickupTimes : def.pickupTimes).slice(0, 50)
          .map((p) => ({ match: line(p?.match, 120), time: line(p?.time, 40) }));
      } else {
        a.daysAfter = int(src.daysAfter, def.daysAfter);
        a.offerCode = line(src.offerCode ?? def.offerCode, 30).toUpperCase();
        a.offerText = line(src.offerText ?? def.offerText, 300);
      }
    }
    out[id] = a;
  }
  return out;
}

const httpsUrl = (v) => {
  if (!v) return true;
  try { const u = new URL(v); return u.protocol === "https:" && !!u.hostname && !/\s/.test(v); } catch { return false; }
};
const TOKEN_RE = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;
function unknownTokens(tpl, id) {
  const allowed = new Set(placeholdersFor(id).map(([k]) => k));
  return [...String(tpl || "").matchAll(TOKEN_RE)].map((m) => m[1]).filter((k) => !allowed.has(k));
}

/** Returns { settings, errors } — errors keyed by dotted path (same keys on the page and the server). */
export function validateCrmSettings(input) {
  const settings = withCrmDefaults(input);
  const errors = {};
  const err = (k, m) => { if (!errors[k]) errors[k] = m; };
  const g = settings.global;
  if (!httpsUrl(g.googleReviewUrl)) err("global.googleReviewUrl", "Enter the Google review link (https://…).");
  if (!g.feedbackUrl) err("global.feedbackUrl", "Enter the feedback form link.");
  else if (!httpsUrl(g.feedbackUrl)) err("global.feedbackUrl", "Enter a valid https:// link.");
  const { startHour, endHour } = g.sendWindow;
  if (!(startHour >= 0 && startHour <= 23 && endHour >= 1 && endHour <= 24 && startHour < endHour)) err("global.sendWindow", "Send window must be between 0 and 24 hours, start before end.");
  if (!(g.maxPerRun >= 1 && g.maxPerRun <= 500)) err("global.maxPerRun", "Max messages per run must be 1–500.");

  const tpl = (id, key, value, { required = true, label = "This" } = {}) => {
    if (required && !String(value).trim()) return err(key, `${label} can't be empty.`);
    const bad = unknownTokens(value, id);
    if (bad.length) err(key, `Unknown placeholder: {{${bad[0]}}}`);
  };
  for (const id of AUTOMATION_IDS) {
    const a = settings[id];
    if (a.enabled && !a.channels.email && !a.channels.whatsapp && !a.channels.whatsappApi) err(`${id}.channels`, "Pick at least one channel (email or WhatsApp).");
    if (id === "enquiryFollowup") {
      if (!a.steps.length) err(`${id}.steps`, "Add at least one follow-up step.");
      let prev = 0;
      a.steps.forEach((st, i) => {
        if (!(st.delayHours >= 1 && st.delayHours <= 24 * 30)) err(`${id}.steps.${i}.delayHours`, "Delay must be 1 hour to 30 days.");
        else if (st.delayHours <= prev) err(`${id}.steps.${i}.delayHours`, "Each step must come after the previous one.");
        prev = st.delayHours;
        tpl(id, `${id}.steps.${i}.subject`, st.subject, { label: "Subject" });
        tpl(id, `${id}.steps.${i}.body`, st.body, { label: "Email text" });
        tpl(id, `${id}.steps.${i}.waBody`, st.waBody, { label: "WhatsApp text" });
      });
      if (!(a.maxAgeDays >= 1 && a.maxAgeDays <= 60)) err(`${id}.maxAgeDays`, "Must be 1–60 days.");
      if (a.steps.length && a.maxAgeDays * 24 < a.steps.at(-1).delayHours) err(`${id}.maxAgeDays`, "Must be longer than the last follow-up delay.");
    } else {
      tpl(id, `${id}.subject`, a.subject, { label: "Subject" });
      tpl(id, `${id}.body`, a.body, { label: "Email text" });
      tpl(id, `${id}.waBody`, a.waBody, { label: "WhatsApp text" });
      if (id === "preTrip") {
        if (!(a.daysBefore >= 1 && a.daysBefore <= 7)) err(`${id}.daysBefore`, "Must be 1–7 days.");
        a.pickupTimes.forEach((p, i) => { if (!p.match || !p.time) err(`${id}.pickupTimes.${i}`, "Fill both the pickup point text and the time."); });
      } else {
        if (!(a.daysAfter >= 1 && a.daysAfter <= 7)) err(`${id}.daysAfter`, "Must be 1–7 days.");
        if (a.offerCode && !/^[A-Z0-9-]{3,30}$/.test(a.offerCode)) err(`${id}.offerCode`, "Use 3–30 letters, digits or dashes.");
        tpl(id, `${id}.offerText`, a.offerText, { required: Boolean(a.offerCode), label: "Offer sentence" });
      }
    }
  }
  return { settings, errors };
}

/** {{token}} → vars[token] (missing → ""). Plain text in, plain text out; escaping is the caller's job. */
export function renderTemplate(tpl, vars = {}) {
  return String(tpl ?? "")
    .replace(TOKEN_RE, (_, k) => (vars[k] == null ? "" : String(vars[k])))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Indian mobile → last 10 digits (or "" when it isn't one). */
export function phone10(v) {
  const d = String(v ?? "").replace(/\D/g, "");
  const ten = d.length > 10 ? d.slice(-10) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : "";
}
export function normEmail(v) {
  const e = String(v ?? "").trim().toLowerCase();
  return /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(e) ? e : "";
}
/** wa.me link with the message prefilled. */
export function waLink(phone, message) {
  const p = phone10(phone);
  return p ? `https://wa.me/91${p}?text=${encodeURIComponent(String(message || ""))}` : "";
}
