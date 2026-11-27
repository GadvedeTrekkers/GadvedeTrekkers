/**
 * WhatsApp Cloud API (Meta's official API, no paid middleman): template messages from the business number.
 *
 * Env (Render → gadvede-backend → Environment; never logged, never sent to the browser):
 *   WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN       Cloud API number + System User token
 *   WHATSAPP_TEMPLATE_BOOKING_CONFIRMATION                 approved template name (booking confirmed / payment verified)
 *   WHATSAPP_TEMPLATE_PRE_TRIP_REMINDER                    optional, approved template name (CRM pre-trip reminder)
 *   WHATSAPP_TEMPLATE_LANG                                 default "en"
 *   WHATSAPP_API_LIVE=true                                 the ONLY switch that lets a message go out. Otherwise every
 *                                                          send is a dry run: one log line, no DB write, no Meta call.
 *
 * Safety: CRM opt-outs (crm_opt_outs) are respected; every real send first INSERTs a crm_message_log row with a unique
 * idempotency_key (migration 020 + 021), so the same message can never go out twice; a failed send is not retried.
 * The server never replies to incoming messages.
 */
import { whatsappConfig } from "../config/meta.js";
import { phone10 } from "../../../shared/crmAutomations.js";
import { cleanTemplateParam, renderWhatsappTemplate } from "../../../shared/whatsappTemplates.js";

export const LOG_TABLE = "crm_message_log";
const maskPhone = (p) => (p ? `+91******${String(p).slice(-2)}` : "-");
const isMissingTable = (error) => /relation .* does not exist|schema cache|could not find the table/i.test(error?.message || "");
const isDuplicate = (error) => error?.code === "23505" || /duplicate key/i.test(error?.message || "");

/**
 * Send one approved template. Returns { messageId } or, when WHATSAPP_API_LIVE isn't "true", { dryRun: true } without
 * calling Meta. Throws { code } on bad input or a Graph error (code only, never the token or the response body).
 */
export async function sendTemplate(to, templateName, params = [], { env = process.env, fetchImpl = globalThis.fetch, language } = {}) {
  const cfg = whatsappConfig(env);
  if (!cfg.configured) throw Object.assign(new Error("WhatsApp Cloud API not configured"), { code: "not_configured" });
  const p10 = phone10(to);
  if (!p10) throw Object.assign(new Error("not an Indian mobile number"), { code: "bad_phone" });
  if (!/^[a-z0-9_]{1,512}$/.test(String(templateName || ""))) throw Object.assign(new Error("bad template name"), { code: "bad_template" });
  if (!cfg.live) return { dryRun: true };
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `91${p10}`,
    type: "template",
    template: {
      name: templateName,
      language: { code: language || cfg.language },
      ...(params.length ? { components: [{ type: "body", parameters: params.map((t) => ({ type: "text", text: cleanTemplateParam(t) })) }] } : {}),
    },
  };
  const url = `https://graph.facebook.com/${encodeURIComponent(cfg.graphVersion)}/${encodeURIComponent(cfg.phoneNumberId)}/messages`;
  const r = await fetchImpl(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error("WhatsApp send failed"), { code: `graph_${json?.error?.code ?? r.status}` });
  return { messageId: String(json?.messages?.[0]?.id || "") };
}

/** True when the 10-digit phone is on the CRM opt-out list. Throws "log_unavailable" when migration 020 isn't run. */
async function optedOut(client, p10) {
  const { data, error } = await client.from("crm_opt_outs").select("contact").eq("contact", p10).limit(1);
  if (error) throw Object.assign(new Error("opt-out list unavailable"), { code: isMissingTable(error) ? "log_unavailable" : "optout_read_failed" });
  return (data || []).length > 0;
}

/**
 * Claim → send → record. `msg` = { automation, templateId, sourceType, sourceId, phone, name, params, tripDate, createdBy,
 * idempotencyKey? } (default key: `<automation>:<sourceType>:<sourceId>:whatsapp_api`).
 * Returns { status } — one of: not_configured, no_phone, opted_out, dry_run, duplicate, sent, failed, log_unavailable.
 * Never throws (safe to fire-and-forget next to the existing emails).
 */
export async function sendLoggedTemplate(client, msg, { env = process.env, fetchImpl = globalThis.fetch, log = (m) => console.log(m) } = {}) {
  const cfg = whatsappConfig(env);
  const templateName = cfg.templates[msg.templateId];
  const tag = `${msg.automation} ${msg.sourceType}:${msg.sourceId}`;
  try {
    if (!cfg.configured || !templateName) return { status: "not_configured" };
    const p10 = phone10(msg.phone);
    if (!p10) return { status: "no_phone" };
    if (await optedOut(client, p10)) { log(`whatsapp api skipped (opted out) ${tag}`); return { status: "opted_out" }; }
    if (!cfg.live) {
      log(`whatsapp api DRY RUN (WHATSAPP_API_LIVE is not true): would send template=${templateName} ${tag} to=${maskPhone(p10)}`);
      return { status: "dry_run" };
    }
    const row = {
      idempotency_key: msg.idempotencyKey || `${msg.automation}:${msg.sourceType}:${msg.sourceId}:whatsapp_api`,
      automation: msg.automation, step: 1, channel: "whatsapp_api", status: "sending",
      source_type: msg.sourceType, source_id: String(msg.sourceId), recipient_name: msg.name || null, recipient_phone: p10,
      body: renderWhatsappTemplate(msg.templateId, msg.params) || templateName, template_name: templateName,
      trip_date: /^\d{4}-\d{2}-\d{2}$/.test(String(msg.tripDate || "")) ? msg.tripDate : null, created_by: msg.createdBy || "system",
    };
    const ins = await client.from(LOG_TABLE).insert([row]).select("id").single();
    if (ins.error) {
      if (isDuplicate(ins.error)) return { status: "duplicate" };
      log(`whatsapp api not sent (${isMissingTable(ins.error) ? "migration 020/021 pending" : "log write failed"}) ${tag}`);
      return { status: "log_unavailable" };
    }
    try {
      const { messageId } = await sendTemplate(p10, templateName, msg.params, { env, fetchImpl });
      await client.from(LOG_TABLE).update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: messageId || null }).eq("id", ins.data.id);
      log(`whatsapp api sent template=${templateName} ${tag} to=${maskPhone(p10)}`);
      return { status: "sent" };
    } catch (e) {
      await client.from(LOG_TABLE).update({ status: "failed", error_code: String(e?.code || "error").slice(0, 60) }).eq("id", ins.data.id);
      log(`whatsapp api failed (${e?.code || "error"}) ${tag}`);
      return { status: "failed" };
    }
  } catch (e) {
    log(`whatsapp api not sent (${e?.code || "error"}) ${tag}`);
    return { status: e?.code === "log_unavailable" ? "log_unavailable" : "failed" };
  }
}

const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "there";
const prettyDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))
  ? new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
  : String(iso || "") || "your trip date");

/** Booking marked CONFIRMED in admin → booking confirmation template (once per booking). */
export async function notifyBookingConfirmed(client, bookingId, opts = {}) {
  const { data: b, error } = await client.from("bookings")
    .select("id, booking_code, product_id, lead_first_name, lead_last_name, lead_phone, lead_whatsapp, travel_date")
    .eq("id", bookingId).maybeSingle();
  if (error || !b) return { status: "failed" };
  let trip = "your trip";
  if (b.product_id) {
    const p = await client.from("products").select("name").eq("id", b.product_id).maybeSingle();
    if (p.data?.name) trip = p.data.name;
  }
  return sendLoggedTemplate(client, {
    automation: "bookingConfirmation", templateId: "bookingConfirmation", sourceType: "booking", sourceId: b.id,
    phone: b.lead_whatsapp || b.lead_phone, name: [b.lead_first_name, b.lead_last_name].filter(Boolean).join(" "),
    params: [firstName(b.lead_first_name), trip, prettyDate(b.travel_date), b.booking_code || "-"], tripDate: b.travel_date,
    createdBy: opts.by || "system",
  }, opts);
}

/** Payment registration marked VERIFIED in admin → same confirmation template (once per registration). */
export async function notifyPaymentVerified(client, reg, opts = {}) {
  return sendLoggedTemplate(client, {
    automation: "paymentVerified", templateId: "bookingConfirmation", sourceType: "payment_registration", sourceId: reg.id,
    phone: reg.whatsapp || reg.mobile, name: reg.full_name,
    params: [firstName(reg.full_name), reg.event_name || "your trip", prettyDate(reg.batch_date), reg.reference || "-"], tripDate: reg.batch_date,
    createdBy: opts.by || "system",
  }, opts);
}

