import { isFeatureEnabled } from "../data/featureFlags";

function parseNormalizedDate(value) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseLegacyDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseEventDate(value) {
  return isFeatureEnabled("normalizedDateParsing")
    ? parseNormalizedDate(value)
    : parseLegacyDate(value);
}

export function getTodayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function isEventPast(eventDate) {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return false;
  return parsed < getTodayStart();
}

export function isEventUpcomingOrUndated(eventDate) {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return true;
  return parsed >= getTodayStart();
}

export function compareEventsAscending(a, b) {
  const left = parseEventDate(a?.eventDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const right = parseEventDate(b?.eventDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  return left - right;
}

export function compareEventsDescending(a, b) {
  const left = parseEventDate(a?.eventDate)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const right = parseEventDate(b?.eventDate)?.getTime() ?? Number.NEGATIVE_INFINITY;
  return right - left;
}

export function getDaysUntilEvent(eventDate) {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return null;
  return Math.round((parsed.getTime() - Date.now()) / 86400000);
}
