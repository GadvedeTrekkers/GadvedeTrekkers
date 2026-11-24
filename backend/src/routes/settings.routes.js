import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import { OFFICIAL_WHATSAPP_NUMBER, WHATSAPP_NUMBER_RE, formatDisplay, isBannedNumber } from "../utils/contactPolicy.js";

/**
 * FR-FE-89 / SEC-41 — one admin-managed WhatsApp number.
 *   GET /api/settings/contact          public; { whatsappNumber, display, waLink }; falls back to the official default.
 *   PUT /api/settings/contact          Super Admin only (requireAdminJWT + role); body { whatsappNumber: "91XXXXXXXXXX" }.
 *                                      Every change is written to activity_logs (before/after); if the audit write fails the
 *                                      change is reverted and 500 is returned (fail closed).
 * Storage: public.site_settings key 'contact.whatsapp_number', value {"number": "..."} (migration 015).
 * `db` = async factory returning a supabase client (default: service-role client, imported lazily).
 */
export const SETTING_KEY = "contact.whatsapp_number";
export const isSuperAdmin = (admin) => String(admin?.role ?? "").toLowerCase().replace(/[\s_-]/g, "") === "superadmin";

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

  return router;
}

export default createSettingsRouter;
