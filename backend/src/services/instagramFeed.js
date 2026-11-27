/**
 * Instagram feed for the public website (latest posts + reels of @gadvede_trekkers).
 *
 * Instagram Graph API, Business/Creator account: GET /{IG_USER_ID}/media with a long-lived token (env only, never sent
 * to the browser). Results are cached in memory for IG_FEED_CACHE_SECONDS (default 1 hour). When a refresh fails the
 * last good result is served; with nothing cached the feed is empty and the website hides the section.
 *
 * Only display-safe fields leave the server: permalink, image (media_url, or thumbnail_url for videos/reels),
 * a short caption snippet, type and timestamp. No ids, usernames, like counts or tokens.
 */
import { instagramConfig } from "../config/meta.js";

const FIELDS = "caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp";
const PERMALINK_RE = /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;

const httpsUrl = (v) => {
  try { const u = new URL(String(v)); return u.protocol === "https:" ? u.toString() : ""; } catch { return ""; }
};

/** First ~120 characters of the caption on one line, cut at a word, hashtags and mentions removed. */
export function captionSnippet(caption, max = 120) {
  const clean = String(caption ?? "")
    .replace(/[#@][\p{L}\p{N}_.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 60 ? cut.lastIndexOf(" ") : max).trim()}…`;
}

/** Graph media item → safe public item, or null when it can't be shown. */
export function toPublicItem(m) {
  const permalink = String(m?.permalink ?? "");
  if (!PERMALINK_RE.test(permalink)) return null;
  const mediaType = String(m?.media_type ?? "").toUpperCase();
  const isVideo = mediaType === "VIDEO";
  const image = httpsUrl(isVideo ? m?.thumbnail_url : m?.media_url || m?.thumbnail_url);
  if (!image) return null;
  const type = String(m?.media_product_type ?? "").toUpperCase() === "REELS" ? "reel"
    : isVideo ? "video" : mediaType === "CAROUSEL_ALBUM" ? "carousel" : "image";
  const ts = Date.parse(m?.timestamp ?? "");
  return { permalink, image, type, caption: captionSnippet(m?.caption), timestamp: Number.isFinite(ts) ? new Date(ts).toISOString() : null };
}

/** One Graph call. Token in the Authorization header, never in a URL that could be logged. */
export async function fetchInstagramMedia({ env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const cfg = instagramConfig(env);
  if (!cfg.configured) throw Object.assign(new Error("instagram feed not configured"), { code: "not_configured" });
  const url = `https://${cfg.host}/${encodeURIComponent(cfg.graphVersion)}/${encodeURIComponent(cfg.userId)}/media`
    + `?fields=${encodeURIComponent(FIELDS)}&limit=${cfg.limit}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, { headers: { Authorization: `Bearer ${cfg.token}` }, signal: ctrl.signal });
    if (!r.ok) throw Object.assign(new Error(`instagram media HTTP ${r.status}`), { code: `http_${r.status}` });
    const body = await r.json();
    return (Array.isArray(body?.data) ? body.data : []).map(toPublicItem).filter(Boolean).slice(0, cfg.limit);
  } finally { clearTimeout(timer); }
}

/** Cached feed: { configured, items, cachedAt, stale }. Never throws. */
export function createInstagramFeed({ env = process.env, fetchImpl = globalThis.fetch, now = () => Date.now(), log = () => {} } = {}) {
  let cache = null; // { at, items }
  let inflight = null;
  return async function getFeed() {
    const cfg = instagramConfig(env);
    if (!cfg.configured) return { configured: false, items: [], profileUrl: cfg.profileUrl };
    const fresh = cache && now() - cache.at < cfg.cacheSeconds * 1000;
    if (!fresh) {
      inflight ||= fetchInstagramMedia({ env, fetchImpl })
        .then((items) => { cache = { at: now(), items }; })
        .catch((e) => {
          log(`instagram feed refresh failed: ${e?.code || e?.name || "error"}`);
          // keep serving the last good result; retry in 5 minutes instead of on every request
          if (cache) cache = { ...cache, at: now() - (cfg.cacheSeconds - 300) * 1000 };
          else cache = { at: now() - (cfg.cacheSeconds - 300) * 1000, items: [], failed: true };
        })
        .finally(() => { inflight = null; });
      await inflight;
    }
    return { configured: true, items: cache?.items ?? [], cachedAt: cache ? new Date(cache.at).toISOString() : null, profileUrl: cfg.profileUrl };
  };
}

/**
 * Long-lived Instagram token refresh (tokens last 60 days; refresh any time after they are 24 hours old).
 * Instagram Login tokens: GET graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token.
 * Facebook Login tokens can't be refreshed this way (re-exchange with fb_exchange_token instead; see README).
 * Returns { token, expiresInDays }. The caller decides where the new token goes; it is never logged here.
 */
export async function refreshInstagramToken({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const cfg = instagramConfig(env);
  if (!cfg.token) throw Object.assign(new Error("IG_ACCESS_TOKEN not set"), { code: "not_configured" });
  if (cfg.host !== "graph.instagram.com") throw Object.assign(new Error("only Instagram Login tokens can be refreshed here"), { code: "wrong_host" });
  // Documented form: the token goes in the query string. This runs from a one-off script (never in request logs);
  // the URL is never printed.
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(cfg.token)}`;
  const r = await fetchImpl(url);
  if (!r.ok) throw Object.assign(new Error(`refresh HTTP ${r.status}`), { code: `http_${r.status}` });
  const body = await r.json();
  if (!body?.access_token) throw Object.assign(new Error("refresh returned no token"), { code: "no_token" });
  return { token: String(body.access_token), expiresInDays: Math.round(Number(body.expires_in || 0) / 86400) };
}
