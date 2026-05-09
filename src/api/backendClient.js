import { getAdminToken } from "../data/authStorage";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

if (!API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set. API calls will fail.");
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/**
 * Make a request to the backend API.
 *
 * @param {string} path - e.g. "/api/products"
 * @param {{ method?, body?, admin? }} options
 *   admin: true → attach the admin JWT from sessionStorage as a Bearer token.
 *          No token = request is sent without auth header (will get 401 from server).
 */
export async function apiRequest(path, { method = "GET", body, admin = false } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (admin) {
    const token = getAdminToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
  }

  return payload?.data ?? payload;
}
