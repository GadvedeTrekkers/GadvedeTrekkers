export function selectOptionValue(option) {
  return typeof option === "string" ? option : option?.value;
}

/** True when a stored select value would otherwise render as a blank required select. */
export function isSavedSelectValueMissing(options, value) {
  if (value === undefined || value === null || value === "") return false;
  return !(options || []).some((option) => selectOptionValue(option) === value);
}

export function numberInputStep(type, step) {
  if (type !== "number") return undefined;
  return step ?? "any";
}

export function nativeInvalidToastMessage(labelText, validationMessage) {
  const label = String(labelText || "").replace("*", "").trim();
  return `${label || "A field"}: ${validationMessage || "invalid value"}`;
}
