/** Tiny fixed-window per-IP limiter (no extra dependency). */
export default function simpleRateLimit({ windowMs = 60_000, limit = () => 600 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    let h = hits.get(key);
    if (!h || now - h.start >= windowMs) { h = { start: now, count: 0 }; hits.set(key, h); }
    h.count += 1;
    if (hits.size > 50_000) hits.clear();
    const max = typeof limit === "function" ? limit() : limit;
    if (h.count > max) { res.set("Retry-After", String(Math.ceil((h.start + windowMs - now) / 1000))); return res.status(429).send("Too many requests"); }
    next();
  };
}
