import { apiRequest } from "../api/backendClient";
import { isFeatureEnabled } from "../data/featureFlags";

export function normalizeLeaderEventDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
}

function cleanValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extractLeaderName(record, config = {}) {
  return cleanValue(config.trekLeaderName || record?.leaderName || record?.leader_name);
}

function extractCanonicalEventId(record, source = "local") {
  if (!record || typeof record !== "object") return "";

  if (record.eventId) return cleanValue(record.eventId);
  if (record.event_id) return cleanValue(record.event_id);
  if (record.canonicalEvent && record.paymentId) return cleanValue(record.paymentId);

  // During migration, some local caches may already carry the backend event id in paymentId.
  if (source === "local" && /^GT-EVT-/i.test(cleanValue(record.paymentId))) {
    return cleanValue(record.paymentId);
  }

  return "";
}

export function getLegacyEventIdentity(record) {
  return [
    cleanValue(record?.trekName).toLowerCase(),
    normalizeLeaderEventDate(record?.eventDate),
    cleanValue(record?.config?.trekLeaderName).toLowerCase(),
  ].join("::");
}

function logInvalidEventRecord(record, source, missingFields) {
  console.warn("leaderEvents: rejecting invalid event payload", {
    source,
    missingFields,
    record,
  });
}

export function normalizeLeaderEventRecord(record, source = "local") {
  if (!record || typeof record !== "object") return null;

  if (record.canonicalEvent) {
    const normalized = {
      ...record,
      eventId: extractCanonicalEventId(record, source),
      eventDate: normalizeLeaderEventDate(record.eventDate),
      source: record.source || source,
    };
    const missingFields = [];
    if (!normalized.eventId) missingFields.push("event_id");
    if (!cleanValue(normalized.trekName)) missingFields.push("trekName");
    if (!cleanValue(normalized.eventDate)) missingFields.push("eventDate");
    if (!cleanValue(normalized.config?.trekLeaderName)) missingFields.push("leaderName");
    if (missingFields.length > 0) {
      logInvalidEventRecord(record, source, missingFields);
      return null;
    }
    return normalized;
  }

  const rawConfig = record.config && typeof record.config === "object" ? record.config : {};
  const nestedPaymentConfig =
    rawConfig.paymentConfig && typeof rawConfig.paymentConfig === "object"
      ? rawConfig.paymentConfig
      : {};
  const config = {
    ...rawConfig,
    ...nestedPaymentConfig,
  };
  const trekName = cleanValue(record.trekName || record.trek_name);
  const eventDate = normalizeLeaderEventDate(record.eventDate || record.event_date || "");
  const leaderName = extractLeaderName(record, config);
  const eventId = extractCanonicalEventId(record, source);
  const paymentId = cleanValue(record.paymentId) || eventId || `${trekName || "event"}__${eventDate || "undated"}`;
  const requireCanonicalId = source !== "local";
  const missingFields = [];

  if (requireCanonicalId && !eventId) missingFields.push("event_id");
  if (!trekName) missingFields.push("trekName");
  if (!eventDate) missingFields.push("eventDate");
  if (!leaderName) missingFields.push("leaderName");

  if (missingFields.length > 0) {
    logInvalidEventRecord(record, source, missingFields);
    return null;
  }

  return {
    eventId,
    paymentId,
    trekName,
    trekId: record.trekId || record.trek_id || rawConfig?.meta?.trekId || "",
    eventDate,
    participants: Number(record.participants ?? record.seats_total ?? record.seats_booked ?? 0),
    status: record.status || "UPCOMING",
    config: {
      ...config,
      trekLeaderName: leaderName,
      whatsappGroupLink: config.whatsappGroupLink || "",
    },
    calculations: record.calculations || rawConfig.calculations || {},
    payments: Array.isArray(record.payments) ? record.payments : Array.isArray(rawConfig.payments) ? rawConfig.payments : [],
    createdAt: record.createdAt || record.created_at || "",
    canonicalEvent: Boolean(record.canonicalEvent),
    source,
  };
}

export function areSameLeaderEvent(existingRecord, incomingRecord) {
  if (!existingRecord || !incomingRecord) return false;

  if (existingRecord.eventId && incomingRecord.eventId) {
    return existingRecord.eventId === incomingRecord.eventId;
  }

  return getLegacyEventIdentity(existingRecord) === getLegacyEventIdentity(incomingRecord);
}

export function mergeLeaderEvents(primaryRecords, fallbackRecords) {
  const merged = [];

  [...fallbackRecords, ...primaryRecords].forEach((record) => {
    const normalized = normalizeLeaderEventRecord(record, record?.source || "local");
    if (!normalized) return;
    const existingIndex = merged.findIndex((existingRecord) => areSameLeaderEvent(existingRecord, normalized));

    if (existingIndex >= 0) {
      merged[existingIndex] = normalized;
      return;
    }

    merged.push(normalized);
  });

  return merged;
}

export function getLocalLeaderTrekEvents(empName) {
  try {
    const payments = JSON.parse(localStorage.getItem("gt_trek_payments") || "[]");
    return payments
      .filter((payment) => payment?.config?.trekLeaderName === empName)
      .map((payment) => normalizeLeaderEventRecord(payment, "local"))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function loadLeaderTrekEvents(empName) {
  const localEvents = getLocalLeaderTrekEvents(empName);

  if (!isFeatureEnabled("backendEventReads")) {
    return localEvents;
  }

  try {
    const remote = await apiRequest(`/api/notify/leader-treks/${encodeURIComponent(empName)}`);
    const remoteEvents = Array.isArray(remote)
      ? remote.map((record) =>
          normalizeLeaderEventRecord(
            record,
            isFeatureEnabled("canonicalEventMapper") ? "backend" : "backend-legacy"
          )
        ).filter(Boolean)
      : [];

    return mergeLeaderEvents(remoteEvents, localEvents);
  } catch (error) {
    console.warn("loadLeaderTrekEvents: backend unreachable, falling back to local trek events.", error.message);
    return localEvents;
  }
}
