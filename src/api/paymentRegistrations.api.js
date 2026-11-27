/**
 * paymentRegistrations.api.js — HTTP transport for /api/payment-registrations (t81u).
 * Public: events() + submit(). Admin (JWT): list(), screenshotUrl(), setStatus(). There is no delete.
 */
import { apiRequest } from "./backendClient";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class SubmitError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.status = status;
    this.errors = errors || {};
  }
}

export const paymentRegistrationsApi = {
  events: () => apiRequest("/api/payment-registrations/events"),

  /** Keeps the field errors from a 400 so the form can highlight them. */
  submit: async (body) => {
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/api/payment-registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new SubmitError("No internet connection or our server is waking up. Please try again in a minute.");
    }
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new SubmitError(payload?.error || `Could not submit (${res.status}). Please try again.`, { status: res.status, errors: payload?.errors });
    }
    return payload?.data ?? payload;
  },

  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null)).toString();
    return apiRequest(`/api/payment-registrations${qs ? `?${qs}` : ""}`, { admin: true });
  },
  screenshotUrl: (id) => apiRequest(`/api/payment-registrations/${encodeURIComponent(id)}/screenshot`, { admin: true }),
  setStatus: (id, status, adminNote = "") =>
    apiRequest(`/api/payment-registrations/${encodeURIComponent(id)}`, { method: "PATCH", admin: true, body: { status, adminNote } }),
};
