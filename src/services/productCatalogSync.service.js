import { productService } from "./product.service";

export const PRODUCT_SYNC_TARGETS = [
  { type: "trek",       storageKey: "gt_treks" },
  { type: "tour",       storageKey: "gt_tours" },
  { type: "camping",    storageKey: "gt_camping" },
  { type: "heritage",   storageKey: "gt_heritage" },
  { type: "rental",     storageKey: "gt_rentals" },
  { type: "villa",      storageKey: "gt_villas" },
  { type: "industrial", storageKey: "gt_iv" },
];

export async function syncAllProductCatalogs({ force = false } = {}) {
  return Promise.allSettled(
    PRODUCT_SYNC_TARGETS.map(({ type, storageKey }) =>
      productService.sync(type, storageKey, { force })
    )
  );
}
