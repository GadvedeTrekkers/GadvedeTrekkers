/**
 * realtimeSync.service.js
 *
 * Subscribes to Supabase Realtime on the `products` and `listing_submissions`
 * tables. When is_active or status changes, triggers a full catalog sync so
 * every connected device updates within seconds — no manual refresh needed.
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.
 * If those vars are missing, Realtime is silently skipped (API-on-load sync
 * still handles cross-device updates on navigation/focus).
 */

import supabase from "../utils/supabase/client";
import { syncAllProductCatalogs } from "./productCatalogSync.service";

let channel = null;

export function startRealtimeSync() {
  if (!supabase || channel) return;

  let syncQueued = false;

  const triggerSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    // Small debounce so rapid CRM edits don't fire 10 syncs
    setTimeout(async () => {
      syncQueued = false;
      try {
        await syncAllProductCatalogs();
        // Notify all components that data may have changed
        window.dispatchEvent(new CustomEvent("gt:storage-updated", { detail: { source: "realtime" } }));
      } catch {
        // silent — page-load sync is the fallback
      }
    }, 400);
  };

  channel = supabase
    .channel("gt-product-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "products" },
      (payload) => {
        // Only re-sync if is_active changed — ignore price/name edits
        if (payload.old?.is_active !== payload.new?.is_active) {
          triggerSync();
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "products" },
      triggerSync
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "products" },
      triggerSync
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "listing_submissions" },
      (payload) => {
        if (payload.old?.status !== payload.new?.status) {
          triggerSync();
        }
      }
    )
    .subscribe();
}

export function stopRealtimeSync() {
  if (supabase && channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
