import { OFFICIAL_WHATSAPP_NUMBER, waSendUrl, waUrl } from "./whatsappSetting.js";
import { withWhatsappUtm } from "./whatsappTrip.js";
/* ═══════════════════════════════════════════════════════════════
   BOOKING MODE CONFIGURATION
   ═══════════════════════════════════════════════════════════════
   Change BOOKING_MODE to instantly switch booking behaviour
   across the entire site — no other code changes needed.

   Public Book Now buttons always open WhatsApp. They do not
   route to /book, /booking, or a payment page.

   BOOKING_MODE stays "WHATSAPP".
   ─────────────────────────────────────────────────────────────── */

export const BOOKING_MODE = "WHATSAPP"; // public booking channel — keep WhatsApp

/* FR-FE-89 / SEC-41: ONE official number for booking, inquiry and sharing.
   These constants are the static default only; runtime value = getWhatsappNumber() (admin setting). */
export const BOOKING_WHATSAPP_NUMBER = OFFICIAL_WHATSAPP_NUMBER;

/* General inquiry number (existing) */
export const INQUIRY_WHATSAPP_NUMBER = OFFICIAL_WHATSAPP_NUMBER;

/* Referral share WhatsApp number (same as booking) */
export const SHARE_WHATSAPP_NUMBER = OFFICIAL_WHATSAPP_NUMBER;

/* ─── CTA Button Labels ───────────────────────────────────────── */
export const CTA_LABELS = {
  WHATSAPP: "Book on WhatsApp",
  DIRECT_BOOKING: "Book Now",
  PAYMENT_GATEWAY: "Proceed to Payment",
};

/* ─── Build booking WhatsApp URL with pre-filled message ────────
   Spec message:
     Hi 👋
     I want to book:
     📍 Trek: {trek_name}
     📅 Date: {selected_date}
     💰 Price: ₹{price}
     Please confirm availability.
   ─────────────────────────────────────────────────────────────── */
function bookingKindLabel(item = {}) {
  const type = String(item.productType || item.category || item.type || "").toLowerCase();
  if (type.includes("camp")) return "Camp";
  if (type.includes("tour")) return "Tour";
  if (type.includes("heritage")) return "Heritage walk";
  if (type.includes("villa")) return "Villa";
  if (type.includes("rental") || type.includes("gear")) return "Rental";
  if (type.includes("trek") || !type) return "Trek";
  return "Trip";
}

function formatFees(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  if (!raw || raw.toUpperCase() === "TBD") return "";
  return raw.startsWith("₹") ? raw : `₹${raw}`;
}

export function buildBookingWhatsAppUrl(trek, selectedDate = null) {
  const name = trek?.name || trek?.shortName || "Trek";
  const kind = bookingKindLabel(trek);
  const date = selectedDate || trek?.nextDate || trek?.date || "";
  const city = trek?.departureCity || trek?.location || trek?.destination || "";
  const fees = formatFees(trek?.fees ?? trek?.price);

  const lines = [
    "Hi 👋",
    "I want to book:",
    "",
    `📍 ${kind}: ${name}`,
  ];
  if (date) lines.push(`📅 Date: ${date}`);
  if (city) lines.push(`🏙 City: ${city}`);
  if (fees) lines.push(`💰 Fees: ${fees}`);
  if (trek?.guests) lines.push(`👥 Guests: ${trek.guests}`);
  if (trek?.note) lines.push(String(trek.note));
  if (trek?.referralCode) lines.push(`🎁 Referral: ${trek.referralCode}`);
  lines.push("", "Please confirm availability.");

  return waUrl(lines.join("\n"));
}

/* ─── Build referral share WhatsApp URL ─────────────────────────
   Message:
     Hi 👋  Join me on this trek!
     📍 Trek: {trek_name}
     📅 Date: {selected_date}
     💰 Price: ₹{price}
     👉 Book here: {referral_url}   (UTM-tagged: utm_source=whatsapp&utm_medium=share&utm_campaign=trip_share)
     Use my referral code for benefits.
   ─────────────────────────────────────────────────────────────── */
export function buildShareWhatsAppUrl(trek, referralUrl, selectedDate = null) {
  const trekName = trek?.name || "Trek";
  const price    = trek?.price ? `₹${trek.price}` : "TBD";
  const date     = selectedDate || trek?.nextDate || "Flexible";
  // utm_source=whatsapp: visits from shared chats show up as WhatsApp in Analytics (the ?ref= code is kept).
  const url      = withWhatsappUtm(referralUrl || (typeof window !== "undefined" ? window.location.href : "https://www.gadvede.com"),
    { medium: "share", campaign: "trip_share" });

  const message = [
    "Hi 👋  Join me on this trek!",
    "",
    `📍 Trek: ${trekName}`,
    `📅 Date: ${date}`,
    `💰 Price: ${price}`,
    "",
    `👉 Book here: ${url}`,
    "",
    "Use my referral code for benefits.",
  ].join("\n");

  return waSendUrl(message, ""); // share link: no recipient
}
