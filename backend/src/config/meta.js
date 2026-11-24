/** Meta webhook config — read lazily from env so tests/env changes apply without restart logic. Never log these values. */
const int = (v, d) => (Number.isFinite(Number.parseInt(v, 10)) && Number.parseInt(v, 10) > 0 ? Number.parseInt(v, 10) : d);
export function metaConfig() {
  return {
    appSecret: process.env.META_APP_SECRET || "",
    verifyToken: process.env.META_VERIFY_TOKEN || "",
    pageToken: process.env.META_PAGE_TOKEN || "",
    graphVersion: process.env.META_GRAPH_VERSION || "v23.0",
    rateLimitPerMinute: int(process.env.META_WEBHOOK_RATE_LIMIT, 600),
    maxBodyBytes: int(process.env.META_WEBHOOK_MAX_BYTES, 1024 * 1024),
  };
}
