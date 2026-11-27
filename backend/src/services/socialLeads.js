/**
 * Instagram DMs and WhatsApp messages → CRM enquiries (Admin → Enquiries), source "instagram_dm" / "whatsapp".
 * Called by the Meta webhook only when META_LEADS_TO_CRM=true. Never replies to anyone and touches no comments.
 *
 * Dedupe (one open enquiry per person):
 *   instagram_dm  same IG user (IGSID in enquiries.source_ref)
 *   whatsapp      same WhatsApp id, or the same 10-digit mobile on ANY open enquiry (e.g. one made on the website)
 * "Open" = not archived and not CONVERTED / LOST. A match gets last_message_at (+ a "WhatsApp"/"Instagram" tag when it came
 * from another channel, e.g. the website); its first message,
 * name and status are kept. Otherwise a new NEW_LEAD enquiry is created with the first message text.
 * Logs carry ids only (phone masked), never message text.
 */
import { instagramConfig } from "../config/meta.js";
import { phone10 } from "../../../shared/crmAutomations.js";

const CLOSED = new Set(["CONVERTED", "LOST"]);
const TAG = { instagram_dm: "Instagram", whatsapp: "WhatsApp" };
const placeholderName = (source, ref) => (source === "whatsapp" ? `WhatsApp …${String(ref).slice(-4)}` : `Instagram user …${String(ref).slice(-4)}`);
const isPlaceholder = (n) => !n || n === "Unknown" || /^(WhatsApp|Instagram user) …/.test(n);
 
const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Optional Instagram profile lookup (name + @username) with the IG token. Returns {} on any problem. */
export function defaultLookupIgProfile({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async (igsid) => {
    const cfg = instagramConfig(env);
    if (!cfg.token || !/^\d{5,40}$/.test(String(igsid))) return {};
    try {
      const r = await fetchImpl(`https://${cfg.host}/${encodeURIComponent(cfg.graphVersion)}/${encodeURIComponent(igsid)}?fields=name,username`,
        { headers: { Authorization: `Bearer ${cfg.token}` } });
      if (!r.ok) return {};
      const j = await r.json();
      return { name: line(j?.name, 80), username: line(j?.username, 60).replace(/[^A-Za-z0-9._]/g, "") };
    } catch { return {}; }
  };
}

const locks = new Map();
/** Serialise work per person so two quick messages can't create two enquiries. */
function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  const done = next.finally(() => { if (locks.get(key) === done) locks.delete(key); });
  locks.set(key, done);
  return next;
}

async function findOpen(client, { source, ref, p10 }) {
  const pick = (rows) => (rows || []).find((r) => !r.archived_at && !CLOSED.has(String(r.status || "").toUpperCase()));
  const cols = "id, name, phone, status, tags, archived_at, source, source_handle, created_at";
  const byRef = await client.from("enquiries").select(cols).eq("source", source).eq("source_ref", String(ref))
    .is("archived_at", null).order("created_at", { ascending: false }).limit(5);
  if (byRef.error) throw Object.assign(new Error("enquiries read failed"), { code: /source/.test(byRef.error.message || "") ? "migration_021_pending" : "read_failed" });
  const hit = pick(byRef.data);
  if (hit || !p10) return hit || null;
  const byPhone = await client.from("enquiries").select(cols).in("phone", [p10, `91${p10}`, `+91${p10}`, `+91 ${p10}`])
    .is("archived_at", null).order("created_at", { ascending: false }).limit(5);
  if (byPhone.error) throw Object.assign(new Error("enquiries read failed"), { code: "read_failed" });
  return pick(byPhone.data) || null;
}

/**
 * lead = { source: "instagram_dm"|"whatsapp", ref, name?, handle?, phone?, text?, at? }
 * → { action: "created"|"updated", id }. Throws { code } on DB problems (the webhook records it on the event row).
 */
export function upsertSocialLead(client, lead, { lookupIgProfile, now = () => new Date(), log = () => {} } = {}) {
  const source = lead.source === "whatsapp" ? "whatsapp" : "instagram_dm";
  const ref = line(lead.ref, 64);
  if (!ref) return Promise.reject(Object.assign(new Error("missing sender id"), { code: "no_ref" }));
  const p10 = source === "whatsapp" ? phone10(lead.phone || ref) : "";
  const at = lead.at && Number.isFinite(Date.parse(lead.at)) ? new Date(lead.at).toISOString() : now().toISOString();

  return withLock(`${source}:${ref}`, async () => {
    const existing = await findOpen(client, { source, ref, p10 });
    let name = line(lead.name, 80);
    let handle = line(lead.handle, 60);
    if (source === "instagram_dm" && (!existing || isPlaceholder(existing.name)) && !name && lookupIgProfile) {
      const prof = await lookupIgProfile(ref);
      name = prof.name || (prof.username ? `@${prof.username}` : "");
      handle = prof.username ? `@${prof.username}` : handle;
    }

    if (existing) {
      const tags = Array.isArray(existing.tags) ? existing.tags : [];
      const patch = { last_message_at: at };
      // Tag only when the channel differs from the lead's own source badge (e.g. a website enquiry that then messaged on WhatsApp).
      if ((existing.source || "website") !== source && !tags.includes(TAG[source])) patch.tags = [...tags, TAG[source]];
      if (name && isPlaceholder(existing.name)) patch.name = name;
      if (handle && !existing.source_handle) patch.source_handle = handle;
      const { error } = await client.from("enquiries").update(patch).eq("id", existing.id);
      if (error) throw Object.assign(new Error("enquiry update failed"), { code: "write_failed" });
      log(`crm lead updated source=${source} enquiry=${existing.id}`);
      return { action: "updated", id: existing.id };
    }

    const id = `ENQ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const row = {
      id,
      name: name || placeholderName(source, ref),
      phone: p10 || null,
      message: String(lead.text ?? "").slice(0, 1000) || null,
      page_key: source,
      status: "NEW_LEAD",
      tags: [], // the source badge already says Instagram DM / WhatsApp
      source,
      source_ref: ref,
      source_handle: handle || null,
      last_message_at: at,
      created_at: at,
    };
    const { error } = await client.from("enquiries").insert([row]);
    if (error) throw Object.assign(new Error("enquiry insert failed"), { code: /source/.test(error.message || "") ? "migration_021_pending" : "write_failed" });
    log(`crm lead created source=${source} enquiry=${id}${p10 ? ` phone=******${p10.slice(-2)}` : ""}`);
    return { action: "created", id };
  });
}

/** "STOP" / "unsubscribe" on WhatsApp → CRM opt-out (no reply is sent). */
export const isStopMessage = (text) => /^\s*(stop|unsubscribe|stop all|band karo|बंद)\s*[.!]*\s*$/i.test(String(text || ""));
export async function recordWhatsappOptOut(client, waId) {
  const contact = phone10(waId);
  if (!contact) return false;
  const { error } = await client.from("crm_opt_outs")
    .upsert([{ contact, channel: "all", source: "whatsapp_stop", reason: "Sent STOP on WhatsApp", created_by: "customer" }], { onConflict: "contact", ignoreDuplicates: true });
  return !error;
}
