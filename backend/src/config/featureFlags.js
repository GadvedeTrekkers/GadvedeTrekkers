const FEATURE_ENV_KEYS = {
  canonicalEventMapper: "FEATURE_CANONICAL_EVENT_MAPPER",
};

function toBool(value) {
  return value === "true" || value === "1";
}

export function isFeatureEnabled(featureName) {
  const envKey = FEATURE_ENV_KEYS[featureName];
  if (!envKey) return false;
  return toBool(globalThis.process?.env?.[envKey]);
}
