/**
 * geminiClient.js — minimal server-side client for the Gemini REST API (generativelanguage.googleapis.com, v1beta
 * models/{model}:generateContent). No SDK dependency.
 *
 * Safety rules:
 *  - The API key goes ONLY in the x-goog-api-key request header (never in the URL, so it is not in proxy/access logs).
 *  - Errors never include the key, the request body or Google's raw response; they carry a short code + message.
 *  - Every call has a hard timeout (AbortController).
 */
export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class AiError extends Error {
  /** code: AI_DISABLED | NO_KEY | DAILY_LIMIT | USER_LIMIT | RATE_LIMITED | TIMEOUT | BLOCKED | BAD_OUTPUT | BAD_KEY | PROVIDER_ERROR | BAD_INPUT | NO_TRIP_DATA */
  constructor(code, message, { status = 502 } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Remove anything that looks like a Google API key from a string (defence in depth for logs/messages). */
/** Removes API keys from text before it is logged: any Google-style key, ?key=…, and any exact key passed in `known`. */
export const redactKeys = (s = "", known = []) => {
  let out = String(s);
  for (const k of known) if (typeof k === "string" && k.length >= 8) out = out.split(k).join("[redacted]");
  return out.replace(/AIza[0-9A-Za-z_-]{10,}/g, "[redacted]").replace(/([?&]key=)[^&\s]+/gi, "$1[redacted]");
};

/** Strip ```json fences and parse. Throws AiError BAD_OUTPUT. */
export function parseJsonText(text) {
  const t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try { return JSON.parse(t.slice(a, b + 1)); } catch { /* fall through */ }
    }
    throw new AiError("BAD_OUTPUT", "The AI answer could not be read. Please try again.");
  }
}

/**
 * @param {{ apiKey: string, fetchImpl?: typeof fetch, baseUrl?: string }} opts
 * @returns {{ generate(args): Promise<{ text: string, json?: any, model: string, usage?: object, finishReason?: string }> }}
 */
export function createGeminiClient({ apiKey, fetchImpl = globalThis.fetch, baseUrl = GEMINI_BASE } = {}) {
  if (!apiKey) throw new AiError("NO_KEY", "No Gemini API key is set.", { status: 503 });
  return {
    async generate({ model, system, prompt, json = true, schema, temperature = 0.6, maxOutputTokens = 2048, timeoutMs = 25000 }) {
      const body = {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          ...(json ? { responseMimeType: "application/json" } : {}),
          ...(json && schema ? { responseSchema: schema } : {}),
        },
      };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      let res;
      try {
        res = await fetchImpl(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
      } catch (e) {
        if (e?.name === "AbortError") throw new AiError("TIMEOUT", "The AI took too long to answer. Please try again.", { status: 504 });
        throw new AiError("PROVIDER_ERROR", "Could not reach the AI service. Please try again in a minute.");
      } finally {
        clearTimeout(timer);
      }
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const reason = String(payload?.error?.status || "");
        if (res.status === 429 || reason === "RESOURCE_EXHAUSTED") throw new AiError("RATE_LIMITED", "Gemini's free quota is used up for now. Try again later (the free daily quota resets around 12:30–1:30 PM IST).", { status: 429 });
        if (res.status === 400 && /API_KEY_INVALID|API key/i.test(JSON.stringify(payload?.error || {}))) throw new AiError("BAD_KEY", "The Gemini API key was rejected. Ask the owner to check the key.", { status: 503 });
        if (res.status === 401 || res.status === 403) throw new AiError("BAD_KEY", "The Gemini API key was rejected. Ask the owner to check the key.", { status: 503 });
        if (res.status === 404) throw new AiError("PROVIDER_ERROR", `The AI model "${model}" is not available. Ask the owner to check GEMINI_MODEL.`);
        throw new AiError("PROVIDER_ERROR", `The AI service returned an error (${res.status}). Please try again.`);
      }
      if (payload?.promptFeedback?.blockReason) throw new AiError("BLOCKED", "The AI declined this request. Rephrase the message and try again.", { status: 422 });
      const cand = payload?.candidates?.[0];
      const finishReason = cand?.finishReason || "";
      if (["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"].includes(finishReason)) {
        throw new AiError("BLOCKED", "The AI stopped this answer for safety reasons. Rephrase and try again.", { status: 422 });
      }
      const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
      if (!text) throw new AiError("BAD_OUTPUT", finishReason === "MAX_TOKENS" ? "The AI answer was cut off. Try a shorter request." : "The AI returned an empty answer. Please try again.");
      const out = { text, model: payload?.modelVersion || model, finishReason, usage: payload?.usageMetadata ? {
        promptTokens: payload.usageMetadata.promptTokenCount || 0, outputTokens: payload.usageMetadata.candidatesTokenCount || 0,
      } : undefined };
      if (json) {
        try { out.json = parseJsonText(text); } catch (e) {
          if (finishReason === "MAX_TOKENS") throw new AiError("BAD_OUTPUT", "The AI answer was cut off. Try a shorter request.");
          throw e;
        }
      }
      return out;
    },
  };
}
