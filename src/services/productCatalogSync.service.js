import { productService } from "./product.service";

export const PRODUCT_SYNC_TARGETS = [
  { type: "trek", storageKey: "gt_treks" },
  { type: "tour", storageKey: "gt_tours" },
  { type: "camping", storageKey: "gt_camping" },
  { type: "heritage", storageKey: "gt_heritage" },
  { type: "rental", storageKey: "gt_rentals" },
];

export async function syncAllProductCatalogs() {
  return Promise.allSettled(
    PRODUCT_SYNC_TARGETS.map(({ type, storageKey }) =>
      productService.sync(type, storageKey)
    )
  );
}
