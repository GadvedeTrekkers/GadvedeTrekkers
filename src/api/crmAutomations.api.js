/**
 * crmAutomations.api.js — Admin → Automations (enquiry follow-ups, pre-trip reminder, post-trip review).
 * All calls need the admin JWT. No delete, no export. preview() is a read-only dry run on the server.
 */
import { getAdminToken } from "../data/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class CrmApiError extends Error {
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
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${getAdminToken() || ""}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new CrmApiError("No internet connection or the server is waking up. Please try again in a minute.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new CrmApiError(payload?.error || `Request failed (${res.status})`, { status: res.status, errors: payload?.errors });
  return { data: payload?.data ?? null, total: payload?.total };
}
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null)).toString();

export const crmAutomationsApi = {
  get: () => send("GET", "/api/crm/automations").then((r) => r.data),
  save: (settings) => send("PUT", "/api/crm/automations", { settings }).then((r) => r.data),
  /** Dry run with the (possibly unsaved) settings on screen. Never sends anything. */
  preview: (settings) => send("POST", "/api/crm/automations/preview", { settings }).then((r) => r.data),
  log: (filters = {}) => send("GET", `/api/crm/log?${qs(filters)}`),
  whatsappQueue: () => send("GET", "/api/crm/whatsapp-queue?limit=200"),
  markWhatsapp: (id, status) => send("PATCH", `/api/crm/log/${encodeURIComponent(id)}`, { status }).then((r) => r.data),
  optOuts: () => send("GET", "/api/crm/opt-outs").then((r) => r.data),
  addOptOut: (contact, reason) => send("POST", "/api/crm/opt-outs", { contact, reason }).then((r) => r.data),
};
