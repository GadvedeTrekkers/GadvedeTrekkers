/**
 * blog.api.js — public blog (published posts only) + Admin → Blog. No delete and no export calls exist.
 */
import { aiSend } from "./ai.api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function publicGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (res.status === 404) return null;
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload?.data ?? null;
}

export const blogPublicApi = {
  list: () => publicGet("/api/blog/posts"),
  bySlug: (slug) => publicGet(`/api/blog/posts/${encodeURIComponent(slug)}`),
};

export const blogAdminApi = {
  list: (status = "") => aiSend("GET", `/api/blog/admin/posts${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  create: (post) => aiSend("POST", "/api/blog/admin/posts", post),
  update: (id, post) => aiSend("PUT", `/api/blog/admin/posts/${encodeURIComponent(id)}`, post),
  setStatus: (id, status) => aiSend("PATCH", `/api/blog/admin/posts/${encodeURIComponent(id)}/status`, { status }),
};
