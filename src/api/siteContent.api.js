/**
 * siteContent.api.js — Admin → Settings → Site Content (Pratik t129u).
 * Public: getPublished() (published values only). Admin (JWT, Super Admin / Admin): list(), saveDraft(), publish(), hide().
 * No delete and no export.
 */
import { apiRequest } from "./backendClient";
import { getAdminToken } from "../data/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class SiteContentError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.status = status;
    this.errors = errors || {};
  }
}

async function send(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken() || ""}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new SiteContentError("No internet connection or the server is waking up. Please try again in a minute.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new SiteContentError(payload?.error || `Request failed (${res.status})`, { status: res.status, errors: payload?.errors });
  return payload?.data ?? payload;
}

const enc = encodeURIComponent;
export const siteContentApi = {
  getPublished: () => apiRequest("/api/site-content"),
  list: () => send("GET", "/api/site-content/admin"),
  saveDraft: (key, content) => send("PUT", `/api/site-content/admin/${enc(key)}`, { content }),
  publish: (key) => send("POST", `/api/site-content/admin/${enc(key)}/publish`, {}),
  hide: (key) => send("POST", `/api/site-content/admin/${enc(key)}/hide`, {}),
};
