import { replaceTourDates } from "./tourDatesStorage";
import { replaceTrekDates } from "./trekDatesStorage";

function parseJsonValue(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function syncDerivedDateStores(key, items) {
  if (!Array.isArray(items)) return;

  if (key === "gt_treks") {
    items.forEach((item) => {
      replaceTrekDates(
        item.slug || item.name || "",
        item.name || item.slug || "",
        parseJsonValue(item.trekDateBatches, [])
      );
    });
  }

  if (key === "gt_tours") {
    items.forEach((item) => {
      replaceTourDates(
        item.slug || item.name || "",
        item.name || item.slug || "",
        parseJsonValue(item.tourDateBatches, [])
      );
    });
  }
}

function notifyStorageUpdate(key, items) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("gt:storage-updated", {
      detail: { key, items },
    })
  );
}

export function getAdminItems(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function saveAdminItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
  syncDerivedDateStores(key, items);
  notifyStorageUpdate(key, items);
}

export function normaliseItem(item) {
  return {
    ...item,
    price: Number(item.price) || 0,
    originalPrice: Number(item.originalPrice) || 0,
    rating: item.rating ? Number(item.rating) : 4.5,
    reviews: item.reviews ? Number(item.reviews) : 0,
  };
}
