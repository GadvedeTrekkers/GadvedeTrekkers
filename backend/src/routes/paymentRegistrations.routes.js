import express from "express";
import crypto from "crypto";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import simpleRateLimit from "../utils/simpleRateLimit.js";
import { stripJpegMetadata } from "../utils/jpegStrip.js";
import {
  GENDERS,
  INDIAN_MOBILE_RE,
  MAX_PARTICIPANTS,
  OTHER_DATE,
  PAYMENT_MODES,
  REGISTRATION_STATUSES,
  datesForOption,
  isRegistrableEvent,
  normalizeIndianMobile,
  registrationOptionsFor,
} from "../../../shared/registrationOptions.js";

/**
 * "Already paid by bank transfer / UPI? Register your payment" (Pratik, t81u).
 *
 *   GET   /api/payment-registrations/events          public. Active trek/tour/camping/IV events with the price options,
 *                                                     batch dates and pickup points the form offers (no personal data).
 *   POST  /api/payment-registrations                 public, rate limited + honeypot. Saves one submission with status
 *                                                     'pending_verification'. Price/total are recomputed on the server.
 *   GET   /api/payment-registrations                 admin JWT. List + filters (status, event, date, search).
 *   GET   /api/payment-registrations/:id/screenshot  admin JWT. Short-lived signed URL of the payment screenshot.
 *   PATCH /api/payment-registrations/:id             admin JWT. { status: verified|rejected|pending_verification, adminNote }.
 * There is deliberately NO delete route.
 *
 * Storage (migration 017, NOT run yet): table public.payment_registrations (RLS on, no anon access) and the PRIVATE
 * bucket "payment-proofs". Submissions are never readable without the admin JWT.
 *
 * Options: db = async factory → supabase client (default: service-role client, imported lazily);
 *          listEvents = async () => active product items (default: listActiveProducts, same data as /api/products).
 */
export const TABLE = "payment_registrations";
export const BUCKET = "payment-proofs";
export const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const EVENTS_CACHE_MS = 5 * 60_000;

const s = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const longText = (v, max = 1000) => String(v ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTR_RE = /^[A-Za-z0-9][A-Za-z0-9/-]{3,39}$/;

function istToday(now = new Date()) {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function validIsoDate(v) {
  if (!ISO_DATE.test(String(v || ""))) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export function makeReference(now = new Date()) {
  const ymd = istToday(now).slice(2).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from(crypto.randomBytes(5), (b) => alphabet[b % alphabet.length]).join("");
  return `GTP-${ymd}-${rand}`;
}
/** Rightmost X-Forwarded-For hop = the address Render's proxy saw (left entries can be spoofed by the client). */
export function clientKey(req) {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",").map((p) => p.trim()).filter(Boolean);
  return xff[xff.length - 1] || req.ip || req.socket?.remoteAddress || "unknown";
}

function decodeScreenshot(dataUrl) {
  const m = /^data:image\/jpe?g;base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ""));
  if (!m) return { error: "Upload the payment screenshot as an image (JPG/PNG/screenshot)." };
  const raw = Buffer.from(m[1].replace(/\s/g, ""), "base64");
  if (raw.length > MAX_SCREENSHOT_BYTES) return { error: "Screenshot is larger than 2 MB after compression. Please crop it and try again." };
  const clean = stripJpegMetadata(raw);
  if (!clean) return { error: "The screenshot could not be read. Please upload a clear JPG/PNG screenshot." };
  return { buffer: clean };
}

/** Validates the public payload against the event's real options. Returns { errors } or { row, screenshot }. */
export function validateSubmission(body = {}, event, { now = new Date() } = {}) {
  const errors = {};
  const err = (field, message) => { if (!errors[field]) errors[field] = message; };
  if (!event) err("eventSlug", "Please choose the event you paid for.");

  const options = event ? registrationOptionsFor(event, { now }) : null;
  const optionKey = s(body.priceOption, 120);
  const option = options?.priceOptions.find((o) => o.key === optionKey);
  if (options && !option) err("priceOption", "Please choose the package / departure you paid for.");

  // Date: one of the event's batch dates for this option, or "other" with a typed date.
  let batchDate = null; let batchLabel = "";
  const dateValue = s(body.dateValue, 80);
  const today = istToday(now);
  if (option) {
    if (dateValue === OTHER_DATE) {
      const other = s(body.otherDate, 10);
      if (!validIsoDate(other) || other < addDays(today, -60) || other > addDays(today, 400)) err("otherDate", "Enter the trip date you booked.");
      else { batchDate = other; batchLabel = "Other date (typed by customer)"; }
    } else {
      const hit = datesForOption(options, option.key).find((d) => d.value === dateValue);
      if (!hit) err("dateValue", "Please choose the trip date.");
      else { batchDate = hit.date; batchLabel = hit.label; }
    }
  }

  const pickup = s(body.pickupPoint, 200);
  if (option && !(options.pickupsByOption[option.key] || []).includes(pickup)) err("pickupPoint", "Please choose your pickup point.");

  const fullName = s(body.fullName, 100);
  if (fullName.length < 2) err("fullName", "Enter your full name.");
  const mobile = normalizeIndianMobile(body.mobile);
  if (!INDIAN_MOBILE_RE.test(mobile)) err("mobile", "Enter a valid 10-digit Indian mobile number.");
  const whatsapp = body.whatsappSameAsMobile ? mobile : normalizeIndianMobile(body.whatsapp);
  if (!INDIAN_MOBILE_RE.test(whatsapp)) err("whatsapp", "Enter a valid 10-digit WhatsApp number.");
  const email = s(body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) err("email", "Enter a valid email address.");
  const age = Number(body.age);
  if (!Number.isInteger(age) || age < 5 || age > 90) err("age", "Enter your age (5–90).");
  const gender = s(body.gender, 10);
  if (!GENDERS.includes(gender)) err("gender", "Choose gender.");
  const city = s(body.city, 80);
  if (city.length < 2) err("city", "Enter your city.");
  const emergencyName = s(body.emergencyName, 100);
  if (emergencyName.length < 2) err("emergencyName", "Enter an emergency contact name.");
  const emergencyPhone = normalizeIndianMobile(body.emergencyPhone);
  if (!INDIAN_MOBILE_RE.test(emergencyPhone)) err("emergencyPhone", "Enter a valid 10-digit emergency contact number.");
  else if (emergencyPhone === mobile) err("emergencyPhone", "Emergency contact must be a different number from yours.");

  const count = Number(body.participantsCount);
  if (!Number.isInteger(count) || count < 1 || count > MAX_PARTICIPANTS) err("participantsCount", `Number of participants must be 1–${MAX_PARTICIPANTS}.`);
  const extras = Array.isArray(body.participants) ? body.participants.slice(0, MAX_PARTICIPANTS) : [];
  const participants = [];
  if (Number.isInteger(count) && count >= 1) {
    for (let i = 0; i < count - 1; i += 1) {
      const p = extras[i] || {};
      const name = s(p.name, 100); const pAge = Number(p.age); const pGender = s(p.gender, 10);
      const pMobile = p.mobile ? normalizeIndianMobile(p.mobile) : "";
      if (name.length < 2) err(`participants.${i}.name`, `Enter participant ${i + 2}'s name.`);
      if (!Number.isInteger(pAge) || pAge < 1 || pAge > 90) err(`participants.${i}.age`, `Enter participant ${i + 2}'s age.`);
      if (!GENDERS.includes(pGender)) err(`participants.${i}.gender`, `Choose participant ${i + 2}'s gender.`);
      if (pMobile && !INDIAN_MOBILE_RE.test(pMobile)) err(`participants.${i}.mobile`, `Participant ${i + 2}'s mobile must be 10 digits.`);
      participants.push({ name, age: pAge, gender: pGender, mobile: pMobile || null });
    }
  }

  const pricePerPerson = option?.price ?? null;
  const totalAmount = pricePerPerson && Number.isInteger(count) ? pricePerPerson * count : null;
  const amountPaid = Number(String(body.amountPaid ?? "").replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(amountPaid) || amountPaid < 1 || amountPaid > 1_000_000) err("amountPaid", "Enter the amount you paid.");
  const paymentDate = s(body.paymentDate, 10);
  if (!validIsoDate(paymentDate) || paymentDate > addDays(today, 1) || paymentDate < addDays(today, -365)) err("paymentDate", "Enter the date you made the payment (not in the future).");
  const paymentMode = s(body.paymentMode, 20);
  if (!PAYMENT_MODES.includes(paymentMode)) err("paymentMode", "Choose how you paid.");
  const utr = s(body.utr, 40).replace(/\s/g, "").toUpperCase();
  if (!UTR_RE.test(utr)) err("utr", "Enter the UTR / transaction reference number (4–40 letters or digits).");

  let screenshot = null;
  if (body.screenshot) {
    const decoded = decodeScreenshot(body.screenshot);
    if (decoded.error) err("screenshot", decoded.error); else screenshot = decoded.buffer;
  } else if (paymentMode !== "Cash") {
    err("screenshot", "Upload the payment screenshot.");
  }
  if (body.consent !== true) err("consent", "Please accept the terms and cancellation policy.");

  if (Object.keys(errors).length) return { errors };
  return {
    screenshot,
    row: {
      status: "pending_verification",
      event_slug: options.slug,
      event_name: options.name,
      event_type: options.type,
      price_option: option.key,
      price_option_label: option.label,
      batch_date: batchDate,
      batch_label: batchLabel,
      date_was_typed: dateValue === OTHER_DATE,
      pickup_point: pickup,
      price_per_person: pricePerPerson,
      participants_count: count,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      payment_date: paymentDate,
      payment_mode: paymentMode,
      utr,
      full_name: fullName,
      mobile,
      whatsapp,
      email,
      age,
      gender,
      city,
      emergency_name: emergencyName,
      emergency_phone: emergencyPhone,
      medical_conditions: longText(body.medicalConditions, 500) || null,
      notes: longText(body.notes, 1000) || null,
      participants,
      consent_at: now.toISOString(),
    },
  };
}

export function toAdminView(r) {
  return {
    id: r.id,
    reference: r.reference,
    status: r.status,
    eventSlug: r.event_slug,
    eventName: r.event_name,
    eventType: r.event_type,
    priceOption: r.price_option,
    priceOptionLabel: r.price_option_label,
    batchDate: r.batch_date,
    batchLabel: r.batch_label,
    dateWasTyped: Boolean(r.date_was_typed),
    pickupPoint: r.pickup_point,
    pricePerPerson: Number(r.price_per_person),
    participantsCount: r.participants_count,
    totalAmount: Number(r.total_amount),
    amountPaid: Number(r.amount_paid),
    paymentDate: r.payment_date,
    paymentMode: r.payment_mode,
    utr: r.utr,
    hasScreenshot: Boolean(r.screenshot_path),
    fullName: r.full_name,
    mobile: r.mobile,
    whatsapp: r.whatsapp,
    email: r.email,
    age: r.age,
    gender: r.gender,
    city: r.city,
    emergencyName: r.emergency_name,
    emergencyPhone: r.emergency_phone,
    medicalConditions: r.medical_conditions || "",
    notes: r.notes || "",
    participants: Array.isArray(r.participants) ? r.participants : [],
    adminNote: r.admin_note || "",
    verifiedBy: r.verified_by || "",
    verifiedAt: r.verified_at || "",
    createdAt: r.created_at,
  };
}

export function createPaymentRegistrationsRouter({
  db,
  listEvents,
  now = () => new Date(),
  submitLimitPer15Min = 8,
  log = (...a) => console.log(...a),
} = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);
  const loadEvents = listEvents ?? (async () => {
    const { listActiveProducts } = await import("../controllers/products.controller.js");
    const { data, error } = await listActiveProducts();
    if (error) throw new Error(error.message || "catalog read failed");
    return data || [];
  });

  let cache = { at: 0, items: null };
  async function registrableEvents() {
    if (cache.items && Date.now() - cache.at < EVENTS_CACHE_MS) return cache.items;
    const items = (await loadEvents()).filter(isRegistrableEvent);
    cache = { at: Date.now(), items };
    return items;
  }

  const eventsLimiter = simpleRateLimit({ windowMs: 60_000, limit: 120, key: clientKey });
  const submitLimiter = simpleRateLimit({
    windowMs: 15 * 60_000, limit: submitLimitPer15Min, key: clientKey,
    message: { success: false, error: "Too many submissions from this network. Please wait 15 minutes or WhatsApp us on 9856112727." },
  });
  const globalSubmitLimiter = simpleRateLimit({ windowMs: 60 * 60_000, limit: 300, key: () => "all" });

  router.get("/events", eventsLimiter, async (req, res) => {
    try {
      const at = now();
      const data = (await registrableEvents())
        .map((item) => registrationOptionsFor(item, { now: at }))
        .filter((o) => o.slug && o.name && o.priceOptions.length);
      res.set("Cache-Control", "public, max-age=120");
      return res.json({ success: true, data });
    } catch (e) {
      log("payment-registrations/events failed:", e?.message);
      return res.status(503).json({ success: false, error: "Events are unavailable right now. Please WhatsApp us on 9856112727." });
    }
  });

  router.post("/", globalSubmitLimiter, submitLimiter, async (req, res) => {
    const body = req.body || {};
    // Honeypot: real visitors never see or fill "website". Pretend success, store nothing.
    if (s(body.website)) return res.status(201).json({ success: true, data: { reference: makeReference(now()), status: "pending_verification" } });
    // Bots that post instantly: the form sends how long it was open (ms).
    if (Number(body.formOpenMs) > 0 && Number(body.formOpenMs) < 3000) return res.status(400).json({ success: false, error: "Please take a moment to check the form and submit again." });

    let events;
    try { events = await registrableEvents(); } catch { return res.status(503).json({ success: false, error: "Could not load events. Please try again or WhatsApp us on 9856112727." }); }
    const event = events.find((e) => e.slug === s(body.eventSlug, 200)) || null;
    const at = now();
    const result = validateSubmission(body, event, { now: at });
    if (result.errors) return res.status(400).json({ success: false, error: "Please fix the highlighted fields.", errors: result.errors });

    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Service unavailable. Please WhatsApp us on 9856112727." }); }

    const dup = await client.from(TABLE).select("id").eq("utr", result.row.utr).limit(1);
    if (dup.error) { log("payment-registrations dup check failed:", dup.error.message); return res.status(503).json({ success: false, error: "Could not save right now. Please try again in a few minutes or WhatsApp us on 9856112727." }); }
    if ((dup.data || []).length) return res.status(409).json({ success: false, error: "This UTR / transaction number is already registered. If you think this is wrong, WhatsApp us on 9856112727.", errors: { utr: "Already registered." } });

    const reference = makeReference(at);
    let screenshotPath = null;
    if (result.screenshot) {
      screenshotPath = `${istToday(at).slice(0, 7)}/${reference}.jpg`;
      const up = await client.storage.from(BUCKET).upload(screenshotPath, result.screenshot, { contentType: "image/jpeg", upsert: false });
      if (up.error) { log("payment-registrations screenshot upload failed:", up.error.message); return res.status(503).json({ success: false, error: "Could not upload the screenshot. Please try again or WhatsApp it to 9856112727." }); }
    }

    const row = { ...result.row, reference, screenshot_path: screenshotPath, user_agent: s(req.headers["user-agent"], 300) };
    const ins = await client.from(TABLE).insert([row]).select("id, reference").single();
    if (ins.error) { log("payment-registrations insert failed:", ins.error.message); return res.status(503).json({ success: false, error: "Could not save right now. Please try again or WhatsApp us on 9856112727." }); }

    // Best effort: admin bell notification. Never blocks the customer.
    try {
      await client.from("notifications").insert([{
        type: "PAYMENT",
        title: `Payment registration ${reference}`,
        message: `${row.full_name} · ${row.event_name} · ₹${row.amount_paid} via ${row.payment_mode}`,
        meta: { reference, module: "payment-registrations" },
      }]);
    } catch { /* ignore */ }

    return res.status(201).json({
      success: true,
      data: {
        reference,
        status: "pending_verification",
        eventName: row.event_name,
        batchDate: row.batch_date,
        batchLabel: row.batch_label,
        priceOptionLabel: row.price_option_label,
        pickupPoint: row.pickup_point,
        participantsCount: row.participants_count,
        pricePerPerson: row.price_per_person,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid,
      },
    });
  });

  router.get("/", requireAdminJWT, async (req, res) => {
    const { status = "", event = "", date = "", search = "" } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    let q = client.from(TABLE).select("*", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (status && REGISTRATION_STATUSES.includes(status)) q = q.eq("status", status);
    if (event) q = q.eq("event_slug", s(event, 200));
    if (date && validIsoDate(date)) q = q.eq("batch_date", date);
    const term = s(search, 60).replace(/[%,()*]/g, "");
    if (term) q = q.or(`full_name.ilike.%${term}%,mobile.ilike.%${term}%,utr.ilike.%${term}%,reference.ilike.%${term}%,email.ilike.%${term}%`);
    const { data, error, count } = await q;
    if (error) {
      const missing = /relation .* does not exist|schema cache|could not find the table/i.test(error.message || "");
      return res.status(missing ? 501 : 500).json({ success: false, error: missing ? "payment_registrations table not created yet (migration 017 pending)" : "Could not load registrations" });
    }
    return res.json({ success: true, data: (data || []).map(toAdminView), total: count ?? (data || []).length });
  });

  router.get("/:id/screenshot", requireAdminJWT, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const { data, error } = await client.from(TABLE).select("screenshot_path").eq("id", s(req.params.id, 64)).maybeSingle();
    if (error) return res.status(500).json({ success: false, error: "Could not load" });
    if (!data?.screenshot_path) return res.status(404).json({ success: false, error: "No screenshot" });
    const signed = await client.storage.from(BUCKET).createSignedUrl(data.screenshot_path, 300);
    if (signed.error) return res.status(500).json({ success: false, error: "Could not open screenshot" });
    return res.json({ success: true, data: { url: signed.data.signedUrl, expiresIn: 300 } });
  });

  router.patch("/:id", requireAdminJWT, async (req, res) => {
    const status = s(req.body?.status, 30);
    if (!REGISTRATION_STATUSES.includes(status)) return res.status(400).json({ success: false, error: "status must be verified, rejected or pending_verification" });
    const adminNote = longText(req.body?.adminNote, 500);
    if (status === "rejected" && adminNote.length < 3) return res.status(400).json({ success: false, error: "Add a short reason when rejecting" });
    let client;
    try { client = await getDb(); } catch { return res.status(503).json({ success: false, error: "Database unavailable" }); }
    const id = s(req.params.id, 64);
    const before = await client.from(TABLE).select("id, reference, status").eq("id", id).maybeSingle();
    if (before.error) return res.status(500).json({ success: false, error: "Could not load" });
    if (!before.data) return res.status(404).json({ success: false, error: "Not found" });
    const by = s(req.admin?.username || "unknown", 80);
    const patch = {
      status,
      admin_note: adminNote || null,
      verified_by: status === "pending_verification" ? null : by,
      verified_at: status === "pending_verification" ? null : now().toISOString(),
      updated_at: now().toISOString(),
    };
    const upd = await client.from(TABLE).update(patch).eq("id", id);
    if (upd?.error) return res.status(500).json({ success: false, error: "Could not update" });
    try {
      await client.from("activity_logs").insert([{
        action: "PAYMENT_REGISTRATION_STATUS",
        action_label: `Payment registration ${before.data.reference}: ${before.data.status} → ${status}`,
        details: adminNote || null,
        module: "payment-registrations",
        severity: status === "rejected" ? "warning" : "success",
        performed_by: by,
      }]);
    } catch { /* audit is best effort */ }
    const after = await client.from(TABLE).select("*").eq("id", id).maybeSingle();
    return res.json({ success: true, data: after.data ? toAdminView(after.data) : { id, ...patch } });
  });

  return router;
}

export default createPaymentRegistrationsRouter;
