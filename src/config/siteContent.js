/**
 * siteContent.js — the public site's copy comes from the admin (Pratik t129u), never from code.
 *  - GET /api/site-content            published sections (Admin → Settings → Site Content)
 *  - GET /api/settings/profile/public company name, email, socials, city (Admin → Profile Setup)
 * Fetched once at startup. Until it arrives (or if it fails) every section is null and the page shows nothing for it:
 * there is deliberately NO built-in fallback copy. Only the WhatsApp number has a default (whatsappSetting.js).
 */
import { useSyncExternalStore } from "react";
import { isFilled } from "../../shared/siteContent.js";

let state = { loaded: false, content: {}, profile: null };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => state;

/** For tests and the admin preview. */
export function setSiteData(next = {}) {
  state = {
    loaded: next.loaded ?? true,
    content: next.content && typeof next.content === "object" ? next.content : state.content,
    profile: next.profile !== undefined ? next.profile : state.profile,
  };
  emit();
}

export const getSiteContent = (key) => (isFilled(key, state.content[key]) ? state.content[key] : null);
export const getSiteProfile = () => state.profile;
export const isSiteDataLoaded = () => state.loaded;

export async function loadSiteContent({ apiBase = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, ""), fetchImpl = globalThis.fetch, timeoutMs = 6000 } = {}) {
  if (!apiBase || !fetchImpl) { setSiteData({ loaded: true }); return state; }
  const get = async (path) => {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    try {
      const r = await fetchImpl(`${apiBase}${path}`, { signal: ctrl?.signal });
      return r.ok ? (await r.json())?.data ?? null : null;
    } catch { return null; } finally { if (t) clearTimeout(t); }
  };
  const [content, profile] = await Promise.all([get("/api/site-content"), get("/api/settings/profile/public")]);
  setSiteData({ loaded: true, content: content && typeof content === "object" ? content : {}, profile: profile || null });
  return state;
}

/** Published content for one section, or null (not set / not published / still loading). */
export function useSiteContent(key) {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return isFilled(key, s.content[key]) ? s.content[key] : null;
}
/** { loaded, content, profile } */
export function useSiteData() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
