function parseStoredJson(value, fallback) {
  if (value && typeof value === "object") return value;
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function validatePickupRowsByCity(parsed = {}) {
  const issues = [];

  Object.entries(parsed || {}).forEach(([city, rows]) => {
    if (!Array.isArray(rows)) return;

    rows.forEach((row, index) => {
      const time = String(row?.time || "").trim();
      const location = String(row?.location || "").trim();
      const mapUrl = String(row?.mapUrl || "").trim();
      const hasAnyValue = time || location || mapUrl;

      if (!hasAnyValue) return;
      if (!location) {
        issues.push(`${city} pickup ${index + 1}: add a pickup location.`);
      }
      if (mapUrl && !/^https?:\/\//i.test(mapUrl)) {
        issues.push(`${city} pickup ${index + 1}: Google Maps link should start with http:// or https://.`);
      }
    });
  });

  return issues;
}

function pickupRowsFromDeparturePlans(plans) {
  return Object.fromEntries(
    Object.entries(plans || {}).map(([city, plan]) => [
      city,
      Array.isArray(plan?.pickupPoints) ? plan.pickupPoints : [],
    ])
  );
}

export function validateTrekDates(rows = []) {
  const issues = [];

  (rows || []).forEach((row, index) => {
    const hasAnyValue = String(row?.date || "").trim() || String(row?.label || "").trim() || String(row?.whatsappGroupLink || "").trim();
    if (!hasAnyValue) return;
    if (!String(row?.date || "").trim()) {
      issues.push(`Batch ${index + 1}: date is required.`);
    }
    if (String(row?.whatsappGroupLink || "").trim() && !/^https?:\/\//i.test(String(row.whatsappGroupLink).trim())) {
      issues.push(`Batch ${index + 1}: WhatsApp link should start with http:// or https://.`);
    }
  });

  return issues;
}

export function validateAdminForm(fields, form) {
  const nextErrors = {};

  fields.forEach((field) => {
    if (field.type === "departurePlans") {
      const plans = parseStoredJson(form?.[field.key], {});
      const issues = validatePickupRowsByCity(pickupRowsFromDeparturePlans(plans));
      if (issues.length) nextErrors[field.key] = issues;
    } else if (field.type === "pickups") {
      const parsed = parseStoredJson(form?.[field.key], {});
      const issues = validatePickupRowsByCity(parsed);
      if (issues.length) nextErrors[field.key] = issues;
    } else if (field.type === "trekDates") {
      const rows = parseStoredJson(form?.[field.key], []);
      const issues = validateTrekDates(rows);
      if (issues.length) nextErrors[field.key] = issues;
    } else if (field.required && !String(form?.[field.key] ?? "").trim()) {
      nextErrors[field.key] = [`${field.label} is required.`];
    }
  });

  return nextErrors;
}
