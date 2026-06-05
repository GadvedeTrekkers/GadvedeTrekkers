import { getAdminToken, clearAdminSession } from "../data/authStorage";

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
    if (!token) {
      console.error("apiRequest: No authentication token found");
      clearAdminSession();
      // Redirect to login page
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
      throw new Error("No authentication token found. Please log in again.");
    }
    headers["Authorization"] = `Bearer ${token}`;
    console.log("apiRequest: Making authenticated request to", path);
  }

  try {
    const url = buildUrl(path);
    console.log("apiRequest: Fetching", method, url);
    
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    console.log(`apiRequest: Response status ${response.status} for ${path}`);

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && admin) {
      console.error("apiRequest: 401 Unauthorized - clearing session and redirecting to login");
      clearAdminSession();
      // Redirect to login page
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
      throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 204) {
      return null;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = payload?.error || payload?.message || `Request failed: ${response.status}`;
      console.error("apiRequest: Request failed -", errorMsg);
      throw new Error(errorMsg);
    }

    return payload?.data ?? payload;
  } catch (error) {
    // Real network failures from fetch itself (backend down, CORS, DNS, etc.)
    if (error instanceof TypeError) {
      console.error("apiRequest: Network error - backend might be down", error);
      throw new Error("Cannot connect to backend. Please ensure the backend server is running at " + API_BASE_URL);
    }
    throw error;
  }
}
