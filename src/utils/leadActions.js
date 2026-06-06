import { saveEnquiry } from "../data/enquiryStorage";

export const DEFAULT_SALES_SMS =
  "Hi, I’m interested in outing packages near Pune/Mumbai.\nPlease share details.";
export const DEFAULT_WHATSAPP_NUMBER = "919856112727";

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
  window.open(href, "_self");
}

export function createWhatsAppInquiryUrl({
  phoneNumber = DEFAULT_WHATSAPP_NUMBER,
  packageName,
  location,
  category,
}) {
  const message = buildWhatsAppMessage({
    packageName,
    location,
    category,
  });
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
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

  const enquiry = saveEnquiry({
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
  const apiResult = {
    ok: true,
    source: "saveEnquiry",
  };

  if (window.dataLayer?.push) {
    window.dataLayer.push({
      event: "whatsapp_lead_created",
      packageName,
      location,
      category,
      source,
    });
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
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return {
    ok: true,
    enquiry,
    apiResult,
  };
}
