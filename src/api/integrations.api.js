/**
 * integrations.api.js — Admin → Settings → Integrations (read-only status of Instagram + WhatsApp).
 * The server never returns a secret: only "set" flags and at most the last 4 characters.
 */
import { getAdminToken } from "../data/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function getIntegrationsStatus() {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/settings/integrations/status`, { headers: { Authorization: `Bearer ${getAdminToken() || ""}` } });
  } catch {
    throw new Error("No internet connection or the server is waking up. Please try again in a minute.");
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload?.data ?? null;
}
