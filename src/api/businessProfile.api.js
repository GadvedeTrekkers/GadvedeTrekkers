/**
 * businessProfile.api.js — Admin → Profile Setup (t84u/t85u).
 * Admin (JWT): get(), save(), uploadImage(). Public: getPublic() (display-safe fields only). No delete, no export.
 */
import { apiRequest } from "./backendClient";
import { getAdminToken } from "../data/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ProfileSaveError extends Error {
  constructor(message, { status, errors, fields } = {}) {
    super(message);
    this.status = status;
    this.errors = errors || {};
    this.fields = fields || [];
  }
}

async function send(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken() || ""}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ProfileSaveError("No internet connection or the server is waking up. Please try again in a minute.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ProfileSaveError(payload?.error || `Request failed (${res.status})`, { status: res.status, errors: payload?.errors, fields: payload?.fields });
  }
  return payload?.data ?? payload;
}

export const businessProfileApi = {
  get: () => apiRequest("/api/settings/profile", { admin: true }),
  getPublic: () => apiRequest("/api/settings/profile/public"),
  /** Keeps field errors (400) and blocked sensitive fields (403) so the page can highlight them. */
  save: (profile) => send("PUT", "/api/settings/profile", { profile }),
  uploadImage: (kind, dataUrl) => send("POST", "/api/settings/profile/image", { kind, dataUrl }),
};
