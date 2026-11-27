/**
 * WhatsApp Cloud API message templates (drafts). Meta must approve each template before it can be sent; the approved
 * template NAME goes in the env var listed below. The text here is what we submit for approval, and it is also used
 * to show a readable copy of each sent message in the CRM log. Parameters are filled in this order ({{1}}, {{2}}, …).
 * Category UTILITY (transactional), language "en". No marketing content, no links that need a click to work.
 */
export const WHATSAPP_TEMPLATES = {
  bookingConfirmation: {
    suggestedName: "gadvede_booking_confirmation",
    envVar: "WHATSAPP_TEMPLATE_BOOKING_CONFIRMATION",
    category: "UTILITY",
    language: "en",
    params: ["Customer first name", "Trip name", "Trip date", "Booking / registration reference"],
    body: "Hi {{1}}, your booking for {{2}} on {{3}} is confirmed. Booking reference: {{4}}.\n\nWe'll send your pickup point and time before the trip. For any help, reply to this message or call +91 98561 12727.\n\n– Gadvede Trekkers",
    sample: ["Rahul", "Kalsubai Trek", "Sat, 6 Dec 2026", "GT-2412-0042"],
  },
  preTripReminder: {
    suggestedName: "gadvede_pre_trip_reminder",
    envVar: "WHATSAPP_TEMPLATE_PRE_TRIP_REMINDER",
    category: "UTILITY",
    language: "en",
    params: ["Customer first name", "Trip name", "Trip date", "Pickup point", "Pickup time"],
    body: "Hi {{1}}, a reminder that {{2}} is on {{3}}.\n\nPickup point: {{4}}\nPickup time: {{5}}\n\nPlease reach 15 minutes early and carry a valid ID, water and a torch. See you soon!\n\n– Gadvede Trekkers",
    sample: ["Rahul", "Kalsubai Trek", "Sat, 6 Dec 2026", "FC Road, Pune", "9:00 PM"],
  },
};

/** Template parameters must be non-empty single-line text (Meta rejects newlines/tabs and 4+ spaces in a row). */
export function cleanTemplateParam(v, max = 200) {
  const s = String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max);
  return s || "-";
}

/** Readable copy of a template message, e.g. for the CRM log. */
export function renderWhatsappTemplate(id, params = []) {
  const t = WHATSAPP_TEMPLATES[id];
  if (!t) return "";
  return t.body.replace(/\{\{(\d+)\}\}/g, (_, n) => cleanTemplateParam(params[Number(n) - 1]));
}
