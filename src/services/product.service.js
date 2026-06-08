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
import supabase, { SUPABASE_ANON_KEY, SUPABASE_URL } from "../utils/supabase/client";

const SYNC_TTL_MS = 60 * 1000; // 1 minute — keeps frontend in sync with admin changes

function getSyncedAt(storageKey) {
  try {
    return Number(localStorage.getItem(`${storageKey}_syncedAt`) || 0);
  } catch {
    return 0;
  }
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

function mapPublicProductRow(row) {
  const rawItem = row?.extra_content?.rawItem || {};
  return {
    ...rawItem,
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    price: row.base_price ?? rawItem.price ?? "",
    originalPrice: row.compare_at_price ?? rawItem.originalPrice ?? "",
    duration: row.duration_label ?? rawItem.duration ?? "",
    altitude: row.altitude_label ?? rawItem.altitude ?? "",
    difficulty: row.difficulty ?? rawItem.difficulty ?? "",
    enduranceLevel: row.endurance_level ?? rawItem.enduranceLevel ?? "",
    subtitle: row.short_description ?? rawItem.subtitle ?? "",
    description: row.description ?? rawItem.description ?? "",
    history: row.history ?? rawItem.history ?? "",
    mainAttractions: row.main_attractions ?? rawItem.mainAttractions ?? "",
    detailedHistory: row.detailed_history ?? rawItem.detailedHistory ?? "",
    image: row.primary_image_url ?? rawItem.image ?? "",
    imageGallery: JSON.stringify(row.gallery || []),
    active: row.is_active,
    sortOrder: row.sort_order,
    rating: row.rating ?? rawItem.rating ?? "",
    reviews: row.review_count ?? rawItem.reviews ?? "",
  };
}

function persistProductCache(storageKey, items) {
  try {
    saveAdminItems(storageKey, items);
    setSyncedAt(storageKey);
    return true;
  } catch (error) {
    console.warn(
      `productService.sync: Failed to persist ${storageKey} cache, rendering fetched data without cache`,
      error
    );
    return false;
  }
}

async function fetchPublicProductsFromSupabase(productType) {
  const fromSdk = async () => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .eq("product_type", productType);

    if (error || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data.map(mapPublicProductRow);
  };

  const fromRest = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || typeof fetch !== "function") return null;

    const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
    url.searchParams.set("select", "*");
    url.searchParams.set("is_active", "eq.true");
    url.searchParams.set("product_type", `eq.${productType}`);
    url.searchParams.set("order", "sort_order.asc,created_at.asc");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json().catch(() => null);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data.map(mapPublicProductRow);
  };

  try {
    const sdkItems = await fromSdk();
    if (sdkItems?.length) return sdkItems;
  } catch {}

  try {
    const restItems = await fromRest();
    if (restItems?.length) return restItems;
  } catch {}

  return null;
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
      if (!Array.isArray(items) || items.length === 0) {
        const directItems = await fetchPublicProductsFromSupabase(productType);
        if (!directItems) return getAdminItems(storageKey) || null;
        persistProductCache(storageKey, directItems);
        return directItems;
      }
      persistProductCache(storageKey, items);
      return items;
    } catch {
      const directItems = await fetchPublicProductsFromSupabase(productType);
      if (directItems) {
        persistProductCache(storageKey, directItems);
        return directItems;
      }
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
