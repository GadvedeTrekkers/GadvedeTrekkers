/**
 * Business profile storage helpers (Admin → Profile Setup, Pratik t84u/t85u).
 * Value lives in public.site_settings key "business.profile" (table from migration 015; 018 re-creates it if missing).
 * The WhatsApp number stays in "contact.whatsapp_number" so /api/settings/contact and the profile always agree.
 * Every reader falls back to safe defaults (never throws), so the site and emails keep working before 018 is run.
 */
import { withDefaults, EMAIL_RE } from "../../../shared/businessProfile.js";
import { OFFICIAL_WHATSAPP_NUMBER, WHATSAPP_NUMBER_RE, isBannedNumber } from "../utils/contactPolicy.js";

export const PROFILE_KEY = "business.profile";
export const RECEIPT_COUNTER_KEY = "billing.receipt_counter";
export const WHATSAPP_KEY = "contact.whatsapp_number";
export const PUBLIC_BUCKET = "site-images";      // existing public bucket (logo, favicon)
export const PRIVATE_BUCKET = "business-docs";   // new private bucket (payment QR, MTDC certificate) — migration 018

async function readKey(client, key) {
  const { data, error } = await client.from("site_settings").select("value, updated_at, updated_by").eq("key", key).maybeSingle();
  if (error) throw new Error("settings read failed");
  return data || null;
}

/** Returns { profile, updatedAt, updatedBy, stored } — stored=false when nothing is saved yet / table missing. */
export async function readBusinessProfile(client) {
  let row = null; let wa = null;
  try { row = await readKey(client, PROFILE_KEY); } catch { /* defaults */ }
  try { wa = (await readKey(client, WHATSAPP_KEY))?.value?.number; } catch { /* defaults */ }
  const profile = withDefaults(row?.value || {});
  profile.whatsappNumber = WHATSAPP_NUMBER_RE.test(String(wa ?? "")) && !isBannedNumber(wa) ? wa : OFFICIAL_WHATSAPP_NUMBER;
  return { profile, updatedAt: row?.updated_at || null, updatedBy: row?.updated_by || null, stored: Boolean(row) };
}

export async function readReceiptCounter(client) {
  try {
    const n = Number((await readKey(client, RECEIPT_COUNTER_KEY))?.value?.next);
    return Number.isInteger(n) && n > 0 ? n : 1;
  } catch { return 1; }
}

/**
 * Email routing for outgoing mail. The SENDING account is always GMAIL_USER (unchanged);
 * the profile only sets the display name and the Reply-To per purpose. Unset/invalid → current behaviour.
 */
export function emailRouting(profile, { fallbackName = "Gadvede Trekkers" } = {}) {
  const p = withDefaults(profile || {});
  const ok = (e) => (EMAIL_RE.test(String(e || "")) ? String(e) : null);
  const support = ok(p.contact.supportEmail);
  return {
    senderName: String(p.companyName || "").replace(/["<>\r\n]/g, "").trim().slice(0, 80) || fallbackName,
    replyTo: {
      bookingConfirmation: ok(p.emails.bookingConfirmation) || support,
      receipts: ok(p.emails.receipts) || support,
      transactions: ok(p.emails.transactions) || support,
      refunds: ok(p.emails.refunds) || support,
    },
  };
}

/** Best-effort profile load for mailers (default: service-role client). Never throws. */
export async function loadProfileForEmail(getDb) {
  try {
    const client = getDb ? await getDb() : (await import("../config/supabaseAdminClient.js")).default;
    return (await readBusinessProfile(client)).profile;
  } catch { return null; }
}
