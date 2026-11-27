/**
 * Trip context for the floating WhatsApp button + the prefilled chat message.
 *
 * Trip pages call useWhatsappTrip({ id, name, type, dates, pickups }) (src/hooks/useWhatsappTrip.js); the floating
 * button and the whatsapp_click analytics event read the current trip from here. Off trip pages there is no trip.
 * The chat always goes to the ONE official number through waUrl() (whatsappSetting.js, default +91 98561 12727).
 * The page link inside the message carries utm_source=whatsapp so visits from shared chats show up in Analytics.
 */
import { waUrl } from "./whatsappSetting.js";

export const SITE_ORIGIN = "https://www.gadvede.com";
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

let current = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(current));
const clean = (v, max = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const list = (v) => [...new Set((Array.isArray(v) ? v : []).map((x) => clean(x)).filter(Boolean))].slice(0, 30);

export const getWhatsappTrip = () => current;
export const subscribeWhatsappTrip = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Register the trip shown on the current page. Ignored without a name. */
export function setWhatsappTrip(trip) {
  const name = clean(trip?.name);
  if (!name) return;
  current = { id: clean(trip.id, 80), name, type: clean(trip.type, 30), dates: list(trip.dates), pickups: list(trip.pickups) };
  emit();
}
/** Clear on leaving the page (only if it is still the same trip). */
export function clearWhatsappTrip(id) {
  if (!current || (id && current.id !== clean(id, 80))) return;
  current = null;
  emit();
}

/**
 * Page URL on the public site with WhatsApp campaign tags. Existing campaign params are replaced, other params
 * (e.g. ?ref= referral codes) are kept, the hash is dropped.
 */
export function withWhatsappUtm(url, { medium = "chat", campaign = "website_chat", content = "" } = {}) {
  let u;
  try { u = new URL(url || "/", SITE_ORIGIN); } catch { u = new URL("/", SITE_ORIGIN); }
  CAMPAIGN_KEYS.forEach((k) => u.searchParams.delete(k));
  u.searchParams.set("utm_source", "whatsapp");
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", campaign);
  if (content) u.searchParams.set("utm_content", clean(content, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  u.hash = "";
  return u.toString();
}

/** Public page link for the message: always the www.gadvede.com address of the current path. */
export function currentPageLink(pathname = typeof window !== "undefined" ? window.location.pathname : "/", trip = current) {
  return withWhatsappUtm(`${SITE_ORIGIN}${pathname || "/"}`, { campaign: "website_chat", content: trip?.id || "" });
}

/** The prefilled chat text. Plain text, no emoji (stays readable in every WhatsApp version). */
export function buildChatMessage({ trip = current, date = "", pickup = "", pageUrl = currentPageLink() } = {}) {
  if (!trip?.name) return `Hi Gadvede Trekkers, I have a question about your trips.\n\nPage: ${pageUrl}`;
  const lines = [`Hi Gadvede Trekkers, I'm interested in ${trip.name}.`];
  if (clean(date)) lines.push(`Date: ${clean(date)}`);
  if (clean(pickup)) lines.push(`Pickup point: ${clean(pickup)}`);
  lines.push("Please share the details.", "", `Page: ${pageUrl}`);
  return lines.join("\n");
}

/** Chat link to the official number with the message prefilled. */
export const tripChatUrl = (opts = {}) => waUrl(buildChatMessage(opts));

/** Departure rows ({ label, city }) → date choices for the chat card. */
export const departureLabels = (departures = []) =>
  (Array.isArray(departures) ? departures : []).map((d) => (d?.city ? `${d.label} · ${d.city}` : d?.label)).filter(Boolean);

/** pickupGroups() output → pickup choices ("Pune · FC Road (9:00 PM)"); the city is left out when there is only one. */
export function pickupLabels(groups = []) {
  const many = Array.isArray(groups) && groups.length > 1;
  return (Array.isArray(groups) ? groups : []).flatMap((g) => (g.points || []).map((p) => {
    const place = [many ? g.city : "", p.location].filter(Boolean).join(" · ");
    return place ? `${place}${p.time ? ` (${p.time})` : ""}` : "";
  })).filter(Boolean);
}
