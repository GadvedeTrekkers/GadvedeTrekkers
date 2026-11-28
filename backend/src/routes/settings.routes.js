/* global Buffer */
import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import crypto from "crypto";
import { OFFICIAL_WHATSAPP_NUMBER, WHATSAPP_NUMBER_RE, formatDisplay, isBannedNumber } from "../utils/contactPolicy.js";
import { stripJpegMetadata } from "../utils/jpegStrip.js";
import { stripPngMetadata } from "../utils/pngStrip.js";
import {
  IMAGE_KINDS, SENSITIVE_FIELDS, changedFields, maskAccountNumber, publicProfile, validateProfile,
} from "../../../shared/businessProfile.js";
import {
  PRIVATE_BUCKET, PROFILE_KEY, PUBLIC_BUCKET, WHATSAPP_KEY, readBusinessProfile, readReceiptCounter,
} from "../services/businessProfile.js";

/**
 * FR-FE-89 / SEC-41 — one admin-managed WhatsApp number.
 *   GET /api/settings/contact          public; { whatsappNumber, display, waLink }; falls back to the official default.
 *   PUT /api/settings/contact          Super Admin only (requireAdminJWT + role); body { whatsappNumber: "91XXXXXXXXXX" }.
 *                                      Every change is written to activity_logs (before/after); if the audit write fails the
 *                                      change is reverted and 500 is returned (fail closed).
 * Storage: public.site_settings key 'contact.whatsapp_number', value {"number": "..."} (migration 015).
 *
 * Business profile (Admin → Profile Setup, Pratik t84u/t85u):
 *   GET  /api/settings/profile/public  public; ONLY display-safe fields (name, tagline, logo, favicon, theme, WhatsApp,
 *                                      website, socials, public support email). Never bank details or internal emails.
 *   GET  /api/settings/profile         admin JWT, role Super Admin or Admin. Bank account number is returned MASKED only.
 *   PUT  /api/settings/profile         admin JWT, Super Admin or Admin. WhatsApp number, bank/UPI details and the payment QR
 *                                      can only be changed by a Super Admin. Audited to activity_logs (fail closed + revert).
 *   POST /api/settings/profile/image   admin JWT. { kind: logo|favicon|paymentQr|mtdcCertificate, dataUrl } (JPEG/PNG data URL).
 *                                      Metadata (EXIF/GPS/text chunks) stripped. Logo/favicon → public bucket site-images/branding/,
 *                                      QR/certificate → PRIVATE bucket business-docs (migration 018). Never overwrites or deletes.
 *   There is deliberately no delete route and no export.
 * `db` = async factory returning a supabase client (default: service-role client, imported lazily).
 */
export const SETTING_KEY = "contact.whatsapp_number";
const roleKey = (admin) => String(admin?.role ?? "").toLowerCase().replace(/[\s_-]/g, "");
export const isSuperAdmin = (admin) => roleKey(admin) === "superadmin";
export const isProfileAdmin = (admin) => ["superadmin", "admin"].includes(roleKey(admin));
export const IMAGE_PREFIXES = { logo: "branding/logo-", favicon: "branding/favicon-", paymentQr: "payment-qr/qr-", mtdcCertificate: "mtdc/certificate-" };
const bucketFor = (kind) => (IMAGE_KINDS[kind].visibility === "public" ? PUBLIC_BUCKET : PRIVATE_BUCKET);

/** data:image/(png|jpeg);base64,... → { buffer, ext } with metadata stripped, or { error }. */
export function decodeProfileImage(kind, dataUrl) {
  const spec = IMAGE_KINDS[kind];
  if (!spec) return { error: "Unknown image type" };
  const m = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ""));
  if (!m) return { error: "Upload a JPG or PNG image." };
  const raw = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  if (raw.length > spec.maxBytes) return { error: `${spec.label} must be under ${Math.round(spec.maxBytes / 1024)} KB.` };
  const isPng = m[1] === "png";
  const clean = isPng ? stripPngMetadata(raw) : stripJpegMetadata(raw);
  if (!clean) return { error: "The image could not be read. Please upload a clear JPG or PNG." };
  return { buffer: clean, ext: isPng ? "png" : "jpg", contentType: isPng ? "image/png" : "image/jpeg" };
}

const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

const payload = (n) => ({ whatsappNumber: n, display: formatDisplay(n), waLink: `https://wa.me/${n}` });

export async function readWhatsappNumber(client) {
  try {
    const { data, error } = await client.from("site_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
    const n = data?.value?.number;
    if (error || !WHATSAPP_NUMBER_RE.test(String(n ?? "")) || isBannedNumber(n)) return OFFICIAL_WHATSAPP_NUMBER;
    return n;
  } catch {
    return OFFICIAL_WHATSAPP_NUMBER;
  }
}

export function createSettingsRouter({ db, log = (m) => console.log(m) } = {}) {
  const router = express.Router();
  const getDb = db ?? (async () => (await import("../config/supabaseAdminClient.js")).default);

  router.get("/contact", async (req, res) => {
    let n = OFFICIAL_WHATSAPP_NUMBER;
    try { n = await readWhatsappNumber(await getDb()); } catch { /* default */ }
    res.set("Cache-Control", "public, max-age=300");
    res.json({ success: true, data: payload(n) });
  });

  router.put("/contact", requireAdminJWT, async (req, res) => {
    if (!isSuperAdmin(req.admin)) return res.status(403).json({ success: false, error: "Only Super Admin can change the WhatsApp number" });
    const n = String(req.body?.whatsappNumber ?? "").replace(/[\s+-]/g, "");
    if (!WHATSAPP_NUMBER_RE.test(n)) return res.status(400).json({ success: false, error: "whatsappNumber must be 91 followed by a 10-digit Indian mobile number" });
    if (isBannedNumber(n)) return res.status(400).json({ success: false, error: "This number is retired and cannot be used" });

    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    const before = await readWhatsappNumber(client);
    const by = String(req.admin?.username ?? "unknown");
    const now = new Date().toISOString();

    const { error: upErr } = await client.from("site_settings")
      .upsert([{ key: SETTING_KEY, value: { number: n }, updated_by: by, updated_at: now }], { onConflict: "key" });
    if (upErr) return res.status(500).json({ success: false, error: "Could not save setting" });

    const { error: auditErr } = await client.from("activity_logs").insert([{
      action: "SETTING_UPDATE",
      action_label: "WhatsApp number changed",
      module: "settings",
      severity: "warning",
      performed_by: by,
      details: JSON.stringify({ key: SETTING_KEY, before, after: n, role: req.admin?.role ?? null }),
    }]);
    if (auditErr) {
      await client.from("site_settings").upsert([{ key: SETTING_KEY, value: { number: before }, updated_by: by, updated_at: new Date().toISOString() }], { onConflict: "key" });
      log("settings: audit write failed — WhatsApp number change reverted");
      return res.status(500).json({ success: false, error: "Audit log failed; change reverted" });
    }
    log(`settings: ${SETTING_KEY} changed by ${by}`);
    res.json({ success: true, data: payload(n) });
  });

  /* ---------------- Business profile (Profile Setup) ---------------- */
  const publicUrl = (client, path) => {
    try { return client.storage.from(PUBLIC_BUCKET).getPublicUrl(path)?.data?.publicUrl || ""; } catch { return ""; }
  };
  const requireProfileAdmin = (req, res, next) => (isProfileAdmin(req.admin)
    ? next()
    : res.status(403).json({ success: false, error: "Only Super Admin or Admin can open Profile Setup" }));

  async function adminView(client, admin) {
    const { profile, updatedAt, updatedBy, stored } = await readBusinessProfile(client);
    const view = JSON.parse(JSON.stringify(profile));
    view.bank.accountNumber = maskAccountNumber(profile.bank.accountNumber);
    for (const kind of Object.keys(IMAGE_KINDS)) {
      const img = profile.images[kind];
      if (!img?.path) continue;
      if (IMAGE_KINDS[kind].visibility === "public") view.images[kind] = { path: img.path, url: publicUrl(client, img.path) };
      else {
        let previewUrl = "";
        try { previewUrl = (await client.storage.from(PRIVATE_BUCKET).createSignedUrl(img.path, 300))?.data?.signedUrl || ""; } catch { /* none */ }
        view.images[kind] = { path: img.path, previewUrl };
      }
    }
    const next = await readReceiptCounter(client);
    return {
      profile: view,
      meta: {
        updatedAt, updatedBy, stored,
        nextReceiptNumber: `${profile.billing.receiptPrefix}${String(next).padStart(5, "0")}`,
        canEditSensitive: isSuperAdmin(admin),
        sensitiveFields: SENSITIVE_FIELDS,
      },
    };
  }

  router.get("/profile/public", async (req, res) => {
    let data;
    try {
      const client = await getDb();
      const { profile } = await readBusinessProfile(client);
      for (const kind of ["logo", "favicon"]) if (profile.images[kind]?.path) profile.images[kind].url = publicUrl(client, profile.images[kind].path);
      data = publicProfile(profile);
    } catch { data = publicProfile({}); }
    res.set("Cache-Control", "public, max-age=300");
    res.json({ success: true, data });
  });

  router.get("/profile", requireAdminJWT, requireProfileAdmin, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: await adminView(client, req.admin) });
  });

  router.put("/profile", requireAdminJWT, requireProfileAdmin, async (req, res) => {
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    const { profile: before, stored } = await readBusinessProfile(client);
    const body = req.body && typeof req.body === "object" ? (req.body.profile ?? req.body) : {};
    const { errors, profile: after } = validateProfile(body, { currentAccountNumber: before.bank.accountNumber, imagePrefixes: IMAGE_PREFIXES });
    if (after.whatsappNumber && isBannedNumber(after.whatsappNumber)) errors.whatsappNumber = "This number is retired and cannot be used";
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: "Please fix the highlighted fields", errors });

    // Public image URLs are always re-derived from the path on the server (never trust a client URL).
    for (const kind of ["logo", "favicon"]) if (after.images[kind]?.path) after.images[kind].url = publicUrl(client, after.images[kind].path);

    const changed = changedFields(before, after);
    const blocked = changed.filter((f) => SENSITIVE_FIELDS.includes(f));
    if (blocked.length && !isSuperAdmin(req.admin)) {
      return res.status(403).json({ success: false, error: "Only Super Admin can change the WhatsApp number, bank / UPI details or payment QR", fields: blocked });
    }
    if (!changed.length && stored) return res.json({ success: true, data: await adminView(client, req.admin), unchanged: true });

    const by = String(req.admin?.username ?? "unknown");
    const now = new Date().toISOString();
    const { whatsappNumber, ...toStore } = after;
    const { whatsappNumber: _w, ...beforeStored } = before;
    const waChanged = changed.includes("whatsappNumber");

    const { error: upErr } = await client.from("site_settings")
      .upsert([{ key: PROFILE_KEY, value: toStore, updated_by: by, updated_at: now }], { onConflict: "key" });
    if (upErr) return res.status(500).json({ success: false, error: "Could not save the profile (has migration 018 been run?)" });
    if (waChanged) {
      const { error: waErr } = await client.from("site_settings")
        .upsert([{ key: WHATSAPP_KEY, value: { number: whatsappNumber }, updated_by: by, updated_at: now }], { onConflict: "key" });
      if (waErr) {
        await client.from("site_settings").upsert([{ key: PROFILE_KEY, value: beforeStored, updated_by: by, updated_at: new Date().toISOString() }], { onConflict: "key" });
        return res.status(500).json({ success: false, error: "Could not save the WhatsApp number; nothing was changed" });
      }
    }

    // Audit: field names + non-secret before/after. Bank account number is masked; long texts are summarised.
    const show = (p, f) => {
      const v = getPath(p, f);
      if (f === "bank.accountNumber") return maskAccountNumber(v);
      if (f.startsWith("images.")) return v?.path || null;
      const t = typeof v === "string" ? v : JSON.stringify(v ?? "");
      return t.length > 120 ? `${t.slice(0, 117)}…` : t;
    };
    const { error: auditErr } = await client.from("activity_logs").insert([{
      action: "SETTING_UPDATE",
      action_label: "Business profile updated",
      module: "settings",
      severity: blocked.length ? "warning" : "info",
      performed_by: by,
      details: JSON.stringify({ key: PROFILE_KEY, role: req.admin?.role ?? null, changes: changed.map((f) => ({ field: f, before: show(before, f), after: show(after, f) })) }),
    }]);
    if (auditErr) {
      await client.from("site_settings").upsert([{ key: PROFILE_KEY, value: beforeStored, updated_by: by, updated_at: new Date().toISOString() }], { onConflict: "key" });
      if (waChanged) await client.from("site_settings").upsert([{ key: WHATSAPP_KEY, value: { number: before.whatsappNumber }, updated_by: by, updated_at: new Date().toISOString() }], { onConflict: "key" });
      log("settings: audit write failed — business profile change reverted");
      return res.status(500).json({ success: false, error: "Audit log failed; change reverted" });
    }
    log(`settings: ${PROFILE_KEY} changed by ${by} (${changed.length} field(s))`);
    res.json({ success: true, data: await adminView(client, req.admin) });
  });

  router.post("/profile/image", requireAdminJWT, requireProfileAdmin, async (req, res) => {
    const kind = String(req.body?.kind || "");
    if (!IMAGE_KINDS[kind]) return res.status(400).json({ success: false, error: "kind must be logo, favicon, paymentQr or mtdcCertificate" });
    if (SENSITIVE_FIELDS.includes(`images.${kind}`) && !isSuperAdmin(req.admin)) {
      return res.status(403).json({ success: false, error: "Only Super Admin can change the payment QR" });
    }
    const img = decodeProfileImage(kind, req.body?.dataUrl);
    if (img.error) return res.status(400).json({ success: false, error: img.error });
    let client;
    try { client = await getDb(); } catch { return res.status(500).json({ success: false, error: "Database unavailable" }); }
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const path = `${IMAGE_PREFIXES[kind]}${stamp}-${crypto.randomBytes(5).toString("hex")}.${img.ext}`;
    const bucket = bucketFor(kind);
    const up = await client.storage.from(bucket).upload(path, img.buffer, { contentType: img.contentType, upsert: false, cacheControl: "31536000" });
    if (up?.error) return res.status(500).json({ success: false, error: "Upload failed (has migration 018 been run?)" });
    let url = ""; let previewUrl = "";
    if (bucket === PUBLIC_BUCKET) url = publicUrl(client, path);
    else { try { previewUrl = (await client.storage.from(bucket).createSignedUrl(path, 300))?.data?.signedUrl || ""; } catch { /* none */ } }
    log(`settings: profile image ${kind} uploaded by ${String(req.admin?.username ?? "unknown")}`);
    res.status(201).json({ success: true, data: { kind, path, url, previewUrl, bytes: img.buffer.length } });
  });

  return router;
}

export default createSettingsRouter;
