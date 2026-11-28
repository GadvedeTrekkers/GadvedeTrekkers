/**
 * ai.api.js — Gemini helpers for staff (admin JWT). Drafts only: there is no send call here or on the server.
 */
import { getAdminToken } from "../data/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class AiApiError extends Error {
  constructor(message, { status, code, errors } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors || {};
  }
}

export async function aiSend(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${getAdminToken() || ""}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AiApiError("No internet connection or the server is waking up. Please try again in a minute.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new AiApiError(payload?.error || `Request failed (${res.status})`, { status: res.status, code: payload?.code, errors: payload?.errors });
  return payload?.data ?? null;
}

export const aiApi = {
  status: () => aiSend("GET", "/api/ai/status"),
  trips: () => aiSend("GET", "/api/ai/trips"),
  /** { channel, customerMessage, customerName, eventName, tripSlug, preferredDate, groupSize, staffNote, variants, enquiryId } */
  replyDraft: (body) => aiSend("POST", "/api/ai/reply-draft", body),
  /** { topic, tripSlug, keywords, audience, length, staffNote } */
  blogDraft: (body) => aiSend("POST", "/api/ai/blog-draft", body),
};
