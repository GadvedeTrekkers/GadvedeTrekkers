const FEATURE_KEYS = {
  heritageEnabled: "gt_feature_heritage_enabled",
  backendEventReads: "gt_feature_backend_event_reads",
  backendEventWrites: "gt_feature_backend_event_writes",
  canonicalEventMapper: "gt_feature_canonical_event_mapper",
  normalizedDateParsing: "gt_feature_normalized_date_parsing",
};

const ENV_DEFAULTS = {
  heritageEnabled: import.meta.env.VITE_FEATURE_HERITAGE_ENABLED,
  backendEventReads: import.meta.env.VITE_FEATURE_BACKEND_EVENT_READS,
  backendEventWrites: import.meta.env.VITE_FEATURE_BACKEND_EVENT_WRITES,
  canonicalEventMapper: import.meta.env.VITE_FEATURE_CANONICAL_EVENT_MAPPER,
  normalizedDateParsing: import.meta.env.VITE_FEATURE_NORMALIZED_DATE_PARSING,
};

function toBool(value, fallback = false) {
  if (value === "true" || value === true || value === "1" || value === 1) return true;
  if (value === "false" || value === false || value === "0" || value === 0) return false;
  return fallback;
}

function getFeatureStorage() {
  if (typeof window === "undefined" || !("localStorage" in window)) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isFeatureEnabled(featureName) {
  const key = FEATURE_KEYS[featureName];
  if (!key || typeof window === "undefined") return false;

  const storage = getFeatureStorage();
  if (storage) {
    try {
      const storedValue = storage.getItem(key);
      if (storedValue != null) {
        return toBool(storedValue, false);
      }
    } catch {
      return toBool(ENV_DEFAULTS[featureName], false);
    }
  }

  return toBool(ENV_DEFAULTS[featureName], false);
}

export function setFeatureEnabled(featureName, enabled) {
  const key = FEATURE_KEYS[featureName];
  if (!key || typeof window === "undefined") return;
  const storage = getFeatureStorage();
  if (!storage) return;

  try {
    storage.setItem(key, enabled ? "true" : "false");
  } catch {
    // Storage is unavailable (Safari private mode, security restrictions, etc).
  }
}

export function isHeritageEnabled() {
  return isFeatureEnabled("heritageEnabled");
}

export function setHeritageEnabled(val) {
  setFeatureEnabled("heritageEnabled", val);
}
