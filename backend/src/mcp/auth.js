import crypto from "crypto";

export const MIN_TOKEN_LENGTH = 24;

export function mcpEnabled(env = process.env) {
  return String(env?.MCP_ENABLED || "").trim().toLowerCase() === "true";
}

/** The configured token, or null when it is missing / too short to be safe. Never logged. */
export function configuredToken(env = process.env) {
  const t = String(env?.MCP_API_TOKEN || "").trim();
  return t.length >= MIN_TOKEN_LENGTH ? t : null;
}

/** Constant-time comparison (hash both sides first so lengths never leak). */
export function tokenMatches(given, want) {
  if (!given || !want) return false;
  const a = crypto.createHash("sha256").update(String(given)).digest();
  const b = crypto.createHash("sha256").update(String(want)).digest();
  return crypto.timingSafeEqual(a, b);
}

export function bearerFrom(req) {
  const h = String(req.headers?.authorization || "");
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : "";
}

/** Express middleware: 401 without a matching bearer token; 503 if the server has no (valid) token configured. */
export function requireMcpToken({ env = process.env } = {}) {
  return (req, res, next) => {
    const want = configuredToken(env);
    if (!want) return res.status(503).json({ error: "MCP server is not configured" });
    if (!tokenMatches(bearerFrom(req), want)) {
      res.set("WWW-Authenticate", 'Bearer realm="gadvede-mcp"');
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
  };
}
