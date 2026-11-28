/**
 * reports.api.js — Admin → Reports insights. GET only (there is no write, export or download call).
 */
import { getAdminToken } from "../data/authStorage";
import { reportsQuery } from "../backend/reports/reportsView";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ReportsApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function reportsGet(path, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers: { Authorization: `Bearer ${getAdminToken() || ""}` }, signal });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ReportsApiError("No internet connection or the server is waking up. Please try again in a minute.", 0);
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ReportsApiError(payload?.error || `Request failed (${res.status})`, res.status);
  return payload?.data ?? null;
}

export const reportsApi = {
  /** Every section in one response: kpis, revenue, conversion, sources, repeat. */
  overview: (filters, opts) => reportsGet(`/api/reports/overview${reportsQuery(filters)}`, opts),
  /** Trip filter options [{ id, name, type }]. */
  trips: (opts) => reportsGet("/api/reports/trips", opts),
};
