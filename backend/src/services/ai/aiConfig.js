/**
 * aiConfig.js — Gemini settings, read from env on every request (so a Render env change needs no code change).
 *   AI_ENABLED        master switch. Anything but "true" = OFF (default). OFF = no call to Google, ever.
 *   GEMINI_API_KEY    fallback key. The Settings hub encrypted store (services/secretsStore.js, when it exists) wins.
 *   GEMINI_MODEL      reply drafts. Default gemini-3.5-flash-lite (free tier, highest daily quota).
 *   GEMINI_BLOG_MODEL blog/SEO writer. Default gemini-3.8-flash (free tier, better long-form writing, low daily quota).
 *   AI_DAILY_LIMIT    max Gemini calls per IST day for the whole backend. Default 100.
 *   AI_USER_DAILY_LIMIT max per admin user per IST day. Default 40.
 *   AI_TIMEOUT_MS     per call. Default 25000 (blog: x2).
 * The key itself never leaves this module except as the x-goog-api-key header to generativelanguage.googleapis.com.
 */
export const DEFAULT_REPLY_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_BLOG_MODEL = "gemini-3.8-flash";
export const MODEL_RE = /^[a-z0-9][a-z0-9.\-]{2,63}$/;
export const SECRET_NAME = "GEMINI_API_KEY";

const int = (v, d, min, max) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : d;
};

export function readAiConfig(env = process.env) {
  const model = MODEL_RE.test(String(env.GEMINI_MODEL || "")) ? env.GEMINI_MODEL : DEFAULT_REPLY_MODEL;
  const blogModel = MODEL_RE.test(String(env.GEMINI_BLOG_MODEL || "")) ? env.GEMINI_BLOG_MODEL : DEFAULT_BLOG_MODEL;
  return {
    enabled: String(env.AI_ENABLED || "").trim().toLowerCase() === "true",
    model,
    blogModel,
    dailyLimit: int(env.AI_DAILY_LIMIT, 100, 1, 5000),
    userDailyLimit: int(env.AI_USER_DAILY_LIMIT, 40, 1, 5000),
    timeoutMs: int(env.AI_TIMEOUT_MS, 25000, 2000, 120000),
  };
}

/** Default secrets reader: the Settings hub store if that module exists, else nothing (env fallback is used). */
async function defaultSecrets() {
  try {
    const mod = await import("../secretsStore.js");
    return typeof mod.getSecret === "function" ? mod : null;
  } catch {
    return null;
  }
}

/**
 * → { key, source: "settings" | "env" | null }. Never throws, never logs the key.
 * `secrets` (tests / the Settings hub) = { getSecret(name) => Promise<string|null> }.
 */
export async function resolveApiKey({ env = process.env, secrets } = {}) {
  try {
    const store = secrets === undefined ? await defaultSecrets() : secrets;
    const fromStore = store ? await store.getSecret(SECRET_NAME) : null;
    if (typeof fromStore === "string" && fromStore.trim().length >= 20) return { key: fromStore.trim(), source: "settings" };
  } catch {
    /* store unavailable → env fallback */
  }
  const fromEnv = String(env.GEMINI_API_KEY || "").trim();
  if (fromEnv.length >= 20) return { key: fromEnv, source: "env" };
  return { key: null, source: null };
}
