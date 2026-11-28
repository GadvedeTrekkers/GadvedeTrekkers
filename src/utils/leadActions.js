import { saveEnquiry } from "../data/enquiryStorage";
import { OFFICIAL_WHATSAPP_NUMBER, getWhatsappNumber, waSendUrl } from "../config/whatsappSetting";
import { trackEvent } from "../analytics/tracking";

export const DEFAULT_SALES_SMS =
  "Hi, I’m interested in outing packages near Pune/Mumbai.\nPlease share details.";
/** The admin WhatsApp setting (its default lives in config/whatsappSetting.js, not here). */
export const DEFAULT_WHATSAPP_NUMBER = OFFICIAL_WHATSAPP_NUMBER;

function getDeviceType() {
  const width = window.innerWidth;
  if (width <= 640) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

function collectUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
  };
}

export function buildWhatsAppMessage({
  packageName,
  location,
  category,
  customerName,
  customerPhone,
  customerEmail,
  pax,
  preferredDate,
}) {
  return [
    "Hi 👋",
    "",
    "I’m interested in:",
    "",
    `📍 Location: ${location}`,
    `📦 Package: ${packageName}`,
    `👥 Type: ${category}`,
    customerName ? `🙋 Name: ${customerName}` : null,
    customerPhone ? `📞 Contact: ${customerPhone}` : null,
    customerEmail ? `✉️ Email: ${customerEmail}` : null,
    pax ? `👤 Travellers: ${pax}` : null,
    preferredDate ? `📅 Preferred Date: ${preferredDate}` : null,
    "",
    "Please share price and details.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSalesFollowUpWhatsAppMessage({
  eventName,
  location,
  category,
  customerName,
}) {
  const eventLabel = eventName || "our event";
  const locationLabel = location || "your preferred location";
  const categoryLabel = category || "experience";

  return [
    `Hi${customerName ? ` ${customerName}` : ""} 👋`,
    "",
    `You had enquired about ${eventLabel}${category ? ` (${categoryLabel})` : ""} in ${locationLabel}.`,
    "",
    "Would you like to join us for this event?",
    "I can share more details, pricing, available batches, and inclusions.",
    "If you prefer, we can also arrange a quick call.",
    "",
    "Regards,",
    "Gadvede Trekkers",
  ].join("\n");
}

export function openSmsWithMessage(phone, message = DEFAULT_SALES_SMS) {
  const encoded = encodeURIComponent(message);
  const href = `sms:${phone}?body=${encoded}`;
  window.location.assign(href);
}

/**
 * Open a wa.me chat in the current tab.
 * location.assign stays allowed on iOS Safari after async work.
 * window.open is often blocked once a lead save has yielded.
 */
export function openWhatsAppUrl(url) {
  if (typeof window === "undefined" || !url) return;
  trackEvent("whatsapp_click", { link_location: "lead_form", page_path: window.location.pathname });
  window.location.assign(url);
}

export function createWhatsAppInquiryUrl({
  phoneNumber = getWhatsappNumber(),
  packageName,
  location,
  category,
}) {
  const message = buildWhatsAppMessage({
    packageName,
    location,
    category,
  });
  return waSendUrl(message, phoneNumber);
}

export async function handleWhatsAppLead({
  phoneNumber,
  packageName,
  location,
  category,
  source = "Website",
  customerName,
  customerPhone,
  customerEmail,
  pax,
  preferredDate,
  openWhatsApp = true,
}) {
  let enquiry = null;
  let saveError = null;
  try {
    const payload = {
      packageName,
      location,
      category,
      source,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      pax: pax || "",
      preferredDate: preferredDate || "",
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      deviceType: getDeviceType(),
      ...collectUtmParams(),
    };

    enquiry = saveEnquiry({
      eventName: packageName,
      category,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      pax,
      date: preferredDate || "Flexible",
      source,
      pageUrl: payload.pageUrl,
    });

    trackEvent("enquiry_submit", { form_name: String(source || "website").toLowerCase(), item_name: packageName, item_category: category });

    if (window.dataLayer?.push) {
      window.dataLayer.push({
        event: "whatsapp_lead_created",
        packageName,
        location,
        category,
        source,
      });
    }
  } catch (error) {
    saveError = error;
    console.warn("WhatsApp lead save failed; opening WhatsApp anyway", error);
  }

  if (openWhatsApp) {
    const message = buildWhatsAppMessage({
      packageName,
      location,
      category,
      customerName,
      customerPhone,
      customerEmail,
      pax,
      preferredDate,
    });
    const phone = phoneNumber || getWhatsappNumber();
    const waUrl = waSendUrl(message, phone);
    openWhatsAppUrl(waUrl);
  }

  return {
    ok: !saveError,
    enquiry,
    apiResult: saveError
      ? { ok: false, source: "saveEnquiry", error: saveError?.message || "save failed" }
      : { ok: true, source: "saveEnquiry" },
  };
}
