/**
 * product.service.js
 *
 * Business logic for product data across all listing types
 * (treks, tours, camping, rentals, heritage, villas, IV).
 *
 * Responsibilities:
 *   - Offline-first strategy: API first, localStorage fallback.
 *   - Hydration: fill empty fields from seed data on first load.
 *   - Admin CRUD: optimistic local update + async backend sync.
 *
 * Components and hooks talk to this service.
 * This service talks to productsApi for HTTP and adminStorage for persistence.
 * Neither components nor hooks know about HTTP paths or localStorage keys.
 */

import { getAdminItems, saveAdminItems, normaliseItem } from "../data/adminStorage";
import { productsApi } from "../api/products.api";

const SYNC_TTL_MS = 60 * 1000; // 1 minute — keeps frontend in sync with admin changes

function getSyncedAt(storageKey) {
  return Number(localStorage.getItem(`${storageKey}_syncedAt`) || 0);
}

function setSyncedAt(storageKey) {
  localStorage.setItem(`${storageKey}_syncedAt`, Date.now().toString());
}

function isCacheStale(storageKey) {
  return Date.now() - getSyncedAt(storageKey) > SYNC_TTL_MS;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const productService = {
  /* ── Public listing pages ─────────────────────────────────────────────── */

  /**
   * Fetch products for a listing page.
   * Always fetches from API on page mount (force=true by default).
   * Writes API result back to localStorage so the app works offline.
   * Returns null if the API is unreachable (caller should use getLocal).
   */
  async sync(productType, storageKey, { force = true } = {}) {
    if (!force && !isCacheStale(storageKey)) {
      return getAdminItems(storageKey) || null;
    }
    try {
      const items = await productsApi.getAll(productType);
      if (!Array.isArray(items) || items.length === 0) return null;
      saveAdminItems(storageKey, items);
      setSyncedAt(storageKey);
      return items;
    } catch {
      // API unreachable — return cached data silently
      return getAdminItems(storageKey) || null;
    }
  },

  /** Read the locally-cached product list (synchronous, never throws). */
  getLocal(storageKey) {
    return getAdminItems(storageKey);
  },

  /** True when cache is older than TTL — useful for conditional refresh UI. */
  isCacheStale,

  /** Fetch a single product by slug (detail pages). */
  async getBySlug(slug) {
    return productsApi.getBySlug(slug);
  },

  /* ── Admin CRUD (used by useAdminData hook) ───────────────────────────── */

  /**
   * Fetch the admin-view list for a storageKey.
   * Falls back to localStorage when offline.
   */
  async adminList(storageKey) {
    const remote = await productsApi.adminList(storageKey);
    if (!Array.isArray(remote)) return getAdminItems(storageKey);
    if (remote.length === 0) return getAdminItems(storageKey); // don't wipe local on empty response
    saveAdminItems(storageKey, remote);
    return remote;
  },

  /**
   * Persist a new item locally (optimistic) then sync to backend.
   * Returns the locally-created item immediately for optimistic UI.
   *
   * @param {string}   storageKey
   * @param {object}   item         — item without id
   * @param {Function} onSynced     — called with the backend-confirmed item
   */
  async save(storageKey, item, onSynced) {
    const remote = await productsApi.upsert(storageKey, item);
    if (remote && typeof onSynced === "function") onSynced(remote);
    return remote;
  },

  /**
   * Delete an item from the backend.
   * Local removal is handled optimistically by the caller before this runs.
   */
  async remove(storageKey, item) {
    const identifier = item?.id || slugify(item?.name || item?.title || "");
    return productsApi.remove(storageKey, identifier);
  },

  /* ── Seed / hydration helpers (used by useAdminData) ─────────────────── */

  /**
   * Seed localStorage from seedData when it is empty.
   * Returns the seeded array.
   */
  seedIfEmpty(storageKey, seedData) {
    const stored = getAdminItems(storageKey);
    if (stored.length > 0 || seedData.length === 0) return stored;
    const seeded = seedData.map((item, i) => ({
      ...normaliseItem(item),
      active: true,
      id: `seed_${storageKey}_${i}`,
    }));
    saveAdminItems(storageKey, seeded);
    return seeded;
  },

  /**
   * Fill empty/null fields in stored items from the matching seed record.
   * Matches by name or title. Returns the hydrated array.
   */
  hydrate(storageKey, seedData) {
    const stored = getAdminItems(storageKey);
    if (stored.length === 0 || seedData.length === 0) return stored;

    const seedByName = new Map(
      seedData.map((item) => [
        String(item.name || item.title || "").toLowerCase(),
        item,
      ])
    );

    let changed = false;
    const hydrated = stored.map((item) => {
      const match = seedByName.get(String(item.name || item.title || "").toLowerCase());
      if (!match) return item;
      const next = { ...item };
      Object.entries(match).forEach(([field, value]) => {
        if (field === "id") return;
        if ((next[field] === "" || next[field] == null) && value !== "" && value != null) {
          next[field] = value;
          changed = true;
        }
      });
      return next;
    });

    if (changed) saveAdminItems(storageKey, hydrated);
    return hydrated;
  },
};
