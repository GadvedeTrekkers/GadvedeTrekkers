const STORAGE_KEY = "gt_pickup_location_catalog";

function safeReadCatalog() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteCatalog(entries) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

function cleanValue(value) {
  return String(value || "").trim();
}

function buildIdentity(city, location) {
  return `${cleanValue(city).toLowerCase()}__${cleanValue(location).toLowerCase()}`;
}

export function getPickupLocationCatalog() {
  return safeReadCatalog()
    .filter((entry) => cleanValue(entry?.city) && cleanValue(entry?.location))
    .sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      return a.location.localeCompare(b.location);
    });
}

export function getPickupLocationsForCity(city) {
  const targetCity = cleanValue(city).toLowerCase();
  return getPickupLocationCatalog().filter((entry) => cleanValue(entry.city).toLowerCase() === targetCity);
}

export function rememberPickupLocations(entries = []) {
  const current = getPickupLocationCatalog();
  const byId = new Map(current.map((entry) => [buildIdentity(entry.city, entry.location), entry]));
  let changed = false;

  entries.forEach((entry) => {
    const city = cleanValue(entry?.city);
    const location = cleanValue(entry?.location);
    const mapUrl = cleanValue(entry?.mapUrl);

    if (!city || !location) return;

    const id = buildIdentity(city, location);
    const previous = byId.get(id);
    const next = {
      city,
      location,
      mapUrl: mapUrl || previous?.mapUrl || "",
      updatedAt: new Date().toISOString(),
    };

    if (!previous || previous.mapUrl !== next.mapUrl || previous.city !== next.city || previous.location !== next.location) {
      byId.set(id, next);
      changed = true;
    }
  });

  if (changed) {
    safeWriteCatalog(Array.from(byId.values()));
  }

  return changed;
}
