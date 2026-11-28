import express from 'express';
import crypto from 'node:crypto';
import { metaConfig } from '../config/meta.js';
import simpleRateLimit from '../utils/simpleRateLimit.js';
import { defaultLookupIgProfile, isStopMessage, recordWhatsappOptOut, upsertSocialLead } from '../services/socialLeads.js';

/**
 * Meta (Instagram + Facebook Page + WhatsApp Cloud API) webhook.
 *   GET  .../webhooks/meta  subscription verification (hub.mode / hub.verify_token / hub.challenge). No auth.
 *   POST .../webhooks/meta  X-Hub-Signature-256 over the RAW body (META_APP_SECRET); 200 immediately; async processing.
 * Objects: instagram (DMs, comments — stored only), page (lead ads), whatsapp_business_account (messages, statuses).
 * With META_LEADS_TO_CRM=true, Instagram DMs and WhatsApp messages also create/update a CRM enquiry
 * (services/socialLeads.js). Nothing here ever sends a reply or touches comments (Logout Studio runs the IG automation).
 * Mounted at /api/v1/webhooks/meta and /api/webhooks/meta BEFORE cors/express.json in app.js
 * (server-to-server: no Origin/CORS check, own limiter, raw body).
 * `db` is an (async) factory returning a supabase client; default = service-role client, imported lazily.
 * Logging: event type + ids only. Never tokens, secrets, signatures, message text, phone or email.
 */

// ---------- helpers ----------
export const maskPhone = (p) => (p ? String(p).replace(/\d(?=\d{2})/g, '*') : p);
export const maskEmail = (e) => (e && String(e).includes('@') ? String(e).replace(/^(.).*(@.*)$/, '$1***$2') : e);

function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length || ba.length === 0) return false; // length guard before timingSafeEqual
  return crypto.timingSafeEqual(ba, bb);
}

export function verifySignature(rawBody, header, appSecret) {
  if (!appSecret || !header || typeof header !== 'string' || !header.startsWith('sha256=')) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return safeEqual(header, expected);
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);

// ---------- parsing ----------
/** Turn a webhook payload into normalised events: { kind, dedupeKey, object, ids, data }. Unknown items => kind 'other'. */
export function parsePayload(body) {
  const out = [];
  if (!body || typeof body !== 'object' || !Array.isArray(body.entry)) return out;
  for (const entry of body.entry) {
    if (body.object === 'instagram') {
      for (const m of entry.messaging ?? []) {
        if (m.message?.mid) {
          out.push({
            kind: 'instagram_message', object: 'instagram', dedupeKey: `ig_msg:${m.message.mid}`,
            ids: { mid: m.message.mid, sender_id: m.sender?.id, recipient_id: m.recipient?.id },
            data: {
              mid: m.message.mid, sender_id: m.sender?.id ?? null, recipient_id: m.recipient?.id ?? null, ig_account_id: entry.id ?? null,
              text: m.message.text ?? null, attachments: m.message.attachments ?? null, is_echo: !!m.message.is_echo,
              sent_at: m.timestamp ? new Date(Number(m.timestamp)).toISOString() : null,
            },
          });
        } else {
          out.push({ kind: 'other', object: 'instagram', dedupeKey: `ig_other:${sha(JSON.stringify(m))}`, ids: { sender_id: m.sender?.id }, data: m });
        }
      }
      for (const c of entry.changes ?? []) {
        if (c.field === 'comments' && c.value?.id) {
          const v = c.value;
          out.push({
            kind: 'instagram_comment', object: 'instagram', dedupeKey: `ig_comment:${v.id}`,
            ids: { comment_id: v.id, media_id: v.media?.id },
            data: {
              comment_id: v.id, text: v.text ?? null, from_id: v.from?.id ?? null, from_username: v.from?.username ?? null,
              media_id: v.media?.id ?? null, media_product_type: v.media?.media_product_type ?? null, parent_id: v.parent_id ?? null,
              ig_account_id: entry.id ?? null,
            },
          });
        } else {
          out.push({ kind: 'other', object: 'instagram', dedupeKey: `ig_change:${sha(JSON.stringify(c))}`, ids: { field: c.field }, data: c });
        }
      }
    } else if (body.object === 'page') {
      for (const c of entry.changes ?? []) {
        if (c.field === 'leadgen' && c.value?.leadgen_id) {
          const v = c.value;
          out.push({
            kind: 'meta_lead', object: 'page', dedupeKey: `leadgen:${v.leadgen_id}`,
            ids: { leadgen_id: String(v.leadgen_id), form_id: v.form_id, page_id: v.page_id, ad_id: v.ad_id },
            data: {
              leadgen_id: String(v.leadgen_id), form_id: v.form_id ? String(v.form_id) : null, page_id: v.page_id ? String(v.page_id) : String(entry.id ?? ''),
              ad_id: v.ad_id ? String(v.ad_id) : null, adgroup_id: v.adgroup_id ? String(v.adgroup_id) : null,
              created_time: v.created_time ? new Date(Number(v.created_time) * 1000).toISOString() : null,
            },
          });
        } else {
          out.push({ kind: 'other', object: 'page', dedupeKey: `page_change:${sha(JSON.stringify(c))}`, ids: { field: c.field }, data: c });
        }
      }
    } else if (body.object === 'whatsapp_business_account') {
      for (const c of entry.changes ?? []) {
        const v = c.value ?? {};
        if (c.field !== 'messages') {
          out.push({ kind: 'other', object: 'whatsapp', dedupeKey: `wa_change:${sha(JSON.stringify(c))}`, ids: { field: c.field }, data: c });
          continue;
        }
        const names = new Map((v.contacts ?? []).map((ct) => [String(ct.wa_id ?? ''), ct.profile?.name ?? null]));
        for (const m of v.messages ?? []) {
          if (!m?.id) continue;
          out.push({
            kind: 'whatsapp_message', object: 'whatsapp', dedupeKey: `wa_msg:${m.id}`,
            ids: { wamid: m.id, type: m.type },
            data: {
              wamid: String(m.id), wa_id: String(m.from ?? ''), profile_name: names.get(String(m.from ?? '')) ?? null,
              phone_number_id: v.metadata?.phone_number_id ? String(v.metadata.phone_number_id) : null, type: m.type ?? null,
              text: m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? m.image?.caption ?? null,
              sent_at: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : null,
            },
          });
        }
        for (const st of v.statuses ?? []) {
          if (!st?.id || !st.status) continue;
          out.push({
            kind: 'whatsapp_status', object: 'whatsapp', dedupeKey: `wa_status:${st.id}:${st.status}`,
            ids: { wamid: st.id, status: st.status },
            data: { wamid: String(st.id), status: String(st.status), error_code: st.errors?.[0]?.code ?? null },
          });
        }
      }
    } else {
      out.push({ kind: 'other', object: String(body.object ?? 'unknown'), dedupeKey: `unknown:${sha(JSON.stringify(entry))}`, ids: {}, data: entry });
    }
  }
  return out;
}

/** Map Graph lead `field_data` [{name, values[]}] to our columns. Unknown questions go to `answers`. */
export function mapLeadFields(fieldData = []) {
  const answers = {};
  for (const f of fieldData) answers[f.name] = Array.isArray(f.values) ? (f.values.length > 1 ? f.values : f.values[0]) : f.values;
  const pick = (...re) => { for (const [k, v] of Object.entries(answers)) if (re.some(r => r.test(k))) return Array.isArray(v) ? v.join(', ') : v; return null; };
  const first = pick(/^first_?name$/i); const last = pick(/^last_?name$/i);
  return {
    name: pick(/^full_?name$/i, /^name$/i) ?? ([first, last].filter(Boolean).join(' ') || null),
    phone: pick(/phone/i, /mobile/i, /whatsapp/i),
    email: pick(/e-?mail/i),
    trek_interest: pick(/trek/i, /interest/i, /destination/i, /which_?(trip|tour|camp)/i),
    answers,
  };
}

/** Default Graph fetch. Token sent in the Authorization header (never in a URL that might be logged) + appsecret_proof. */
export function defaultFetchLead({ fetchImpl = globalThis.fetch } = {}) {
  return async (leadgenId) => {
    const { pageToken, appSecret, graphVersion } = metaConfig();
    if (!pageToken) throw new Error('META_PAGE_TOKEN not configured');
    const proof = appSecret ? crypto.createHmac('sha256', appSecret).update(pageToken).digest('hex') : null;
    const url = `https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(leadgenId)}` +
      `?fields=${encodeURIComponent('created_time,id,ad_id,form_id,field_data')}${proof ? `&appsecret_proof=${proof}` : ''}`;
    const r = await fetchImpl(url, { headers: { Authorization: `Bearer ${pageToken}` } });
    if (!r.ok) throw new Error(`graph lead fetch failed: HTTP ${r.status}`);
    return r.json();
  };
}

// ---------- processing ----------
const DELIVERY_RANK = { sent: 1, delivered: 2, read: 3, failed: 4 };

/** IG DM / WhatsApp message → CRM enquiry (only with META_LEADS_TO_CRM=true). Echoes (our own/automation replies) are skipped. */
async function toCrmLead(client, ev, { lookupIgProfile, log }) {
  if (!metaConfig().leadsToCrm) return;
  const d = ev.data;
  if (ev.kind === 'instagram_message') {
    if (d.is_echo || !d.sender_id || d.sender_id === d.ig_account_id) return;
    await upsertSocialLead(client, { source: 'instagram_dm', ref: d.sender_id, text: d.text ?? (d.attachments ? '[attachment]' : ''), at: d.sent_at }, { lookupIgProfile, log });
  } else if (ev.kind === 'whatsapp_message') {
    if (!d.wa_id) return;
    if (isStopMessage(d.text)) { await recordWhatsappOptOut(client, d.wa_id); log(`crm opt-out recorded source=whatsapp wamid=${d.wamid}`); return; }
    await upsertSocialLead(client, { source: 'whatsapp', ref: d.wa_id, phone: d.wa_id, name: d.profile_name, text: d.text ?? `[${d.type || 'message'}]`, at: d.sent_at }, { log });
  }
}

export async function processEvents({ db, events, fetchLead, lookupIgProfile, log, seen }) {
  let client;
  try { client = await db(); } catch (err) { log(`meta db unavailable: ${String(err.message).slice(0, 120)}`); return; }
  for (const ev of events) {
    if (seen.has(ev.dedupeKey)) { log(`meta dup(mem) type=${ev.kind} key=${ev.dedupeKey}`); continue; }
    seen.add(ev.dedupeKey);
    if (seen.size > 10_000) seen.delete(seen.values().next().value);
    try {
      // DB-level dedupe: unique dedupe_key; ignoreDuplicates => empty result when already stored.
      const { data: ins, error } = await client.from('meta_webhook_events')
        .upsert([{ dedupe_key: ev.dedupeKey, object: ev.object, event_type: ev.kind, payload: ev.data, status: 'received' }], { onConflict: 'dedupe_key', ignoreDuplicates: true })
        .select();
      if (error) throw error;
      if (!ins || ins.length === 0) { log(`meta dup(db) type=${ev.kind} key=${ev.dedupeKey}`); continue; }

      if (ev.kind === 'instagram_message') {
        const { error: e } = await client.from('instagram_messages').insert([ev.data]); if (e) throw e;
        await toCrmLead(client, ev, { lookupIgProfile, log });
      } else if (ev.kind === 'whatsapp_message') {
        const { error: e } = await client.from('whatsapp_messages').insert([ev.data]); if (e) throw e;
        await toCrmLead(client, ev, { lookupIgProfile, log });
      } else if (ev.kind === 'whatsapp_status') {
        // Delivery receipts for our Cloud API sends: only move forward (sent → delivered → read; failed is final).
        const cur = await client.from('crm_message_log').select('id, delivery_status').eq('provider_message_id', ev.data.wamid).limit(1);
        const row = cur.data?.[0];
        if (row && (DELIVERY_RANK[ev.data.status] ?? 0) > (DELIVERY_RANK[row.delivery_status] ?? 0)) {
          await client.from('crm_message_log').update({ delivery_status: ev.data.status }).eq('id', row.id);
        }
      } else if (ev.kind === 'instagram_comment') {
        const { error: e } = await client.from('instagram_comments').insert([ev.data]); if (e) throw e;
      } else if (ev.kind === 'meta_lead') {
        let mapped = {}; let status = 'new'; let fetchError = null;
        try {
          const lead = await fetchLead(ev.data.leadgen_id);
          mapped = mapLeadFields(lead.field_data);
        } catch (err) { status = 'fetch_failed'; fetchError = err.message.replace(/access_token=[^&\s]+/g, 'access_token=***'); }
        const { error: e } = await client.from('meta_leads').insert([{ ...ev.data, ...mapped, status, fetch_error: fetchError }]); if (e) throw e;
        log(`meta lead stored leadgen_id=${ev.data.leadgen_id} form_id=${ev.data.form_id} status=${status} phone=${maskPhone(mapped.phone) ?? '-'} email=${maskEmail(mapped.email) ?? '-'}`);
      }
      await client.from('meta_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('dedupe_key', ev.dedupeKey);
      log(`meta processed type=${ev.kind} ids=${JSON.stringify(ev.ids)}`);
    } catch (err) {
      seen.delete(ev.dedupeKey); // allow a Meta retry to re-attempt
      log(`meta processing error type=${ev.kind} key=${ev.dedupeKey}: ${String(err.message).slice(0, 200)}`);
      try { await client.from('meta_webhook_events').update({ status: 'error', error: String(err.message).slice(0, 500) }).eq('dedupe_key', ev.dedupeKey); } catch { /* ignore */ }
    }
  }
}

// ---------- router ----------
export default function metaWebhookRouter({ db, fetchLead, lookupIgProfile, schedule = setImmediate, log = (m) => console.log(m) } = {}) {
  const router = express.Router();
  const seen = new Set();
  const getLead = fetchLead ?? defaultFetchLead();
  const igProfile = lookupIgProfile ?? defaultLookupIgProfile();
  const cfg = () => metaConfig();
  const getDb = db ?? (async () => (await import('../config/supabaseAdminClient.js')).default);

  router.use(simpleRateLimit({ windowMs: 60_000, limit: () => cfg().rateLimitPerMinute }));

  router.get('/', (req, res) => {
    const q = req.query ?? {};
    const mode = q['hub.mode'] ?? q.hub?.mode;
    const token = q['hub.verify_token'] ?? q.hub?.verify_token;
    const challenge = q['hub.challenge'] ?? q.hub?.challenge;
    const expected = cfg().verifyToken;
    if (mode === 'subscribe' && expected && typeof token === 'string' && safeEqual(token, expected) && typeof challenge === 'string' && challenge.length <= 1024) {
      log('meta verify ok');
      return res.status(200).type('text/plain').send(challenge);
    }
    log('meta verify rejected');
    return res.sendStatus(403);
  });

  router.post('/', express.raw({ type: () => true, limit: cfg().maxBodyBytes }), (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!verifySignature(raw, req.get('x-hub-signature-256'), cfg().appSecret)) {
      log('meta signature rejected');
      return res.sendStatus(403);
    }
    let body;
    try { body = JSON.parse(raw.toString('utf8')); } catch { return res.sendStatus(400); }
    res.status(200).send('EVENT_RECEIVED'); // ack fast; Meta retries on slow/non-200
    const events = parsePayload(body);
    log(`meta received object=${body.object} events=${events.length} kinds=${[...new Set(events.map(e => e.kind))].join(',')}`);
    schedule(() => processEvents({ db: getDb, events, fetchLead: getLead, lookupIgProfile: igProfile, log, seen }));
  });

  return router;
}
