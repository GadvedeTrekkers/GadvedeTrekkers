/** Meta config — read lazily from env so tests/env changes apply without restart logic. Never log these values. */
const int = (v, d) => (Number.isFinite(Number.parseInt(v, 10)) && Number.parseInt(v, 10) > 0 ? Number.parseInt(v, 10) : d);
const str = (v) => String(v ?? "").trim();

/** Webhook receiver (Instagram DMs/comments, Page lead ads, WhatsApp Cloud API messages). */
export function metaConfig(env = process.env) {
  return {
    appSecret: env.META_APP_SECRET || "",
    verifyToken: env.META_VERIFY_TOKEN || "",
    pageToken: env.META_PAGE_TOKEN || "",
    graphVersion: env.META_GRAPH_VERSION || "v23.0",
    rateLimitPerMinute: int(env.META_WEBHOOK_RATE_LIMIT, 600),
    maxBodyBytes: int(env.META_WEBHOOK_MAX_BYTES, 1024 * 1024),
    // Instagram DMs + WhatsApp messages become CRM enquiries only when this is exactly "true". Never auto-replies.
    leadsToCrm: env.META_LEADS_TO_CRM === "true",
  };
}

/**
 * Instagram feed on the website (Instagram Graph API, Business/Creator account).
 * IG_GRAPH_HOST: graph.instagram.com (Instagram Login token, default) or graph.facebook.com (Facebook Login token).
 */
export function instagramConfig(env = process.env) {
  const host = str(env.IG_GRAPH_HOST) === "graph.facebook.com" ? "graph.facebook.com" : "graph.instagram.com";
  const userId = str(env.IG_USER_ID);
  const token = str(env.IG_ACCESS_TOKEN);
  return {
    userId,
    token,
    host,
    graphVersion: env.META_GRAPH_VERSION || "v23.0",
    configured: /^\d{5,30}$/.test(userId) && token.length >= 20,
    limit: Math.min(int(env.IG_FEED_LIMIT, 12), 24),
    cacheSeconds: Math.max(int(env.IG_FEED_CACHE_SECONDS, 3600), 300),
    tokenExpiresAt: str(env.IG_TOKEN_EXPIRES_AT), // optional YYYY-MM-DD, only used for the admin reminder
    profileUrl: "https://www.instagram.com/gadvede_trekkers/",
  };
}

/** WhatsApp Cloud API (Meta's official API, no middleman). Sends only when WHATSAPP_API_LIVE is exactly "true". */
export function whatsappConfig(env = process.env) {
  const phoneNumberId = str(env.WHATSAPP_PHONE_NUMBER_ID);
  const token = str(env.WHATSAPP_ACCESS_TOKEN);
  const configured = /^\d{5,30}$/.test(phoneNumberId) && token.length >= 20;
  return {
    phoneNumberId,
    token,
    graphVersion: env.META_GRAPH_VERSION || "v23.0",
    configured,
    live: configured && env.WHATSAPP_API_LIVE === "true",
    templates: {
      bookingConfirmation: str(env.WHATSAPP_TEMPLATE_BOOKING_CONFIRMATION),
      preTripReminder: str(env.WHATSAPP_TEMPLATE_PRE_TRIP_REMINDER),
    },
    language: str(env.WHATSAPP_TEMPLATE_LANG) || "en",
  };
}

/** "••••1a2b" for an admin status card. Never returns more than the last 4 characters. */
export const maskSecret = (v) => {
  const s = str(v);
  return s ? `••••${s.length > 12 ? s.slice(-4) : ""}` : "";
};
