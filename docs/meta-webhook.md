# Meta webhook (Instagram DMs, Instagram comments, Facebook Page lead ads)

Status: implemented on branch `feat/meta-webhook`; **not deployed, migrations not run, Meta app not configured.**

## Endpoint
| | |
|---|---|
| Canonical | `https://gadvede-backend.onrender.com/api/v1/webhooks/meta` (planned callback URL) |
| Alias | `/api/webhooks/meta` (same router) |
| Alternative | `https://api.gadvede.com/api/v1/webhooks/meta` only if a custom domain is added on Render + DNS (nothing references api.gadvede.com today) |
| GET | Subscription check: `hub.mode=subscribe`, `hub.verify_token` must equal `META_VERIFY_TOKEN` (constant-time compare) → returns `hub.challenge` as `text/plain`; otherwise 403. |
| POST | Verifies `X-Hub-Signature-256` = `sha256=` HMAC-SHA256(raw body, `META_APP_SECRET`) (length guard + `timingSafeEqual`) → 403 if bad, 400 if not JSON, else **200 `EVENT_RECEIVED` immediately**, then processes asynchronously. |

Code: `backend/src/routes/metaWebhook.routes.js`, mounted in `backend/src/app.js` **before** `cors()` and `express.json()` (needs the raw body; Meta is server-to-server so the browser Origin allow-list must not apply). Own per-IP limiter (`META_WEBHOOK_RATE_LIMIT`/min, default 600) and body limit (`META_WEBHOOK_MAX_BYTES`, default 1 MB).

## What is stored (migration `supabase/migrations/016_meta_webhooks.sql`, RLS on, backend-only)
| Event | Dedupe key | Table |
|---|---|---|
| Instagram DM (`instagram` → `messaging[].message.mid`) | `ig_msg:<mid>` | `instagram_messages` |
| Instagram comment (`instagram` → `changes[field=comments]`) | `ig_comment:<comment id>` | `instagram_comments` |
| Page lead ad (`page` → `changes[field=leadgen]`) | `leadgen:<leadgen_id>` | `meta_leads` (status `new`; `fetch_failed` if the Graph fetch fails) |
| Anything else | `<kind>:<sha256>` | only `meta_webhook_events` |

Every event first goes into `meta_webhook_events` (unique `dedupe_key`, upsert ignore-duplicates) → Meta retries / duplicates are stored once. Lead details are fetched from `GET https://graph.facebook.com/{META_GRAPH_VERSION}/{leadgen_id}?fields=created_time,id,ad_id,form_id,field_data&appsecret_proof=…` with the Page token in the `Authorization` header (never in the URL). Field mapping: full_name/name (or first+last) → `name`; *phone*/*mobile*/*whatsapp* → `phone`; *email* → `email`; *trek*/*interest*/*destination*/which_trip → `trek_interest`; all answers → `answers` (jsonb).

Logs contain event types and ids only; phone/email are masked; message text, tokens, secrets and signatures are never logged.

## Environment variables (Render → gadvede-backend → Environment)
| Var | Value |
|---|---|
| `META_APP_SECRET` | App Dashboard → App settings → Basic → App secret |
| `META_VERIFY_TOKEN` | Random string; a candidate was generated locally (not in git). Paste the same value into the Meta webhook form. |
| `META_PAGE_TOKEN` | Long-lived **Page** access token for the Gadvede Facebook Page with `leads_retrieval` |
| `META_GRAPH_VERSION` | `v23.0` (default) |
| `META_WEBHOOK_RATE_LIMIT` | `600` (default) |
| `META_WEBHOOK_MAX_BYTES` | `1048576` (default) |

## Setup steps (to be done by Pratik — nothing here has been done)
1. Approve + merge the PR, run migrations `015_site_settings.sql` and `016_meta_webhooks.sql` in Supabase, set the env vars above on Render, deploy. Check `GET /api/health`.
2. Meta for Developers → create/open a **Business** app owned by the Gadvede Business portfolio. Add products **Webhooks**, **Instagram** (Instagram API with Facebook Login / messaging) and **Facebook Login for Business**.
3. Make sure the Instagram professional account is linked to the Gadvede Facebook Page; in the Instagram app (Settings → Messages and replies → Message controls / Connected tools) allow access to messages.
4. App settings → Basic: Privacy Policy URL `https://www.gadvede.com/privacy` (draft page — review first), User data deletion → "Data deletion instructions URL" `https://www.gadvede.com/privacy`.
5. Webhooks → object **Instagram** → Callback URL = planned URL above, Verify token = `META_VERIFY_TOKEN` → Verify and save → subscribe fields **`messages`** and **`comments`**.
6. Webhooks → object **Page** → same callback + verify token → subscribe field **`leadgen`**. Then subscribe the Page to the app (Graph API: `POST /{page-id}/subscribed_apps?subscribed_fields=leadgen` with the Page token) — or via the Leads Access / Business settings UI.
7. Permissions (App Review → advanced access for live use; confirm the current list in Meta docs): `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `leads_retrieval` (+ `pages_manage_ads` for lead-ad subscription). Business Manager → Leads Access: give the app access to the Page's leads.
8. Test: Meta "Test" button per field / **Lead Ads Testing Tool**; send a DM and a comment from a test account; check rows in `meta_webhook_events`, `instagram_messages`, `instagram_comments`, `meta_leads`.

Notes: Render free instances can cold-start; Meta expects a quick 200 and retries on failure (duplicates are deduped). Replies to DMs/comments and a CRM view of `meta_leads` are not built yet.
