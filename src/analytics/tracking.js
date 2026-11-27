/**
 * Analytics for the public site: Google Tag Manager (preferred), direct GA4 gtag (fallback) and Meta Pixel.
 *
 * Build-time env (Render → frontend static site → Environment):
 *   VITE_GTM_ID              "GTM-XXXXXXX"  → loads GTM; every event is pushed to window.dataLayer.
 *   VITE_GA_MEASUREMENT_ID   "G-XXXXXXXXXX" → used ONLY when VITE_GTM_ID is empty (direct gtag.js).
 *   VITE_META_PIXEL_ID       "1234567890…"  → loads the Meta Pixel from code (do NOT also add Pixel tags in GTM).
 * Nothing loads when the IDs are empty, so local/dev builds send nothing.
 *
 * Privacy rules (enforced here, not by callers):
 * - Never runs on private routes (/admin, /employee*, /leader-training, /ticket, /qa/).
 * - Consent defaults: ad storage / ad personalisation denied, analytics granted, IP anonymised, Google signals off.
 * - Page URLs are sent without query strings (only utm_* and gclid/fbclid are kept).
 * - Event parameters are allow-listed; strings that look like an email or phone number are dropped.
 *   Names, phones, emails, UTRs and booking/registration references can never be sent.
 * - Pixel: no advanced matching, autoConfig off, automatic SPA PageView off (we send our own).
 * - Visitors can opt out with localStorage "gt_ga_optout" = "1"; Do-Not-Track / Global Privacy Control is respected.
 */

const env = import.meta.env || {};
const GTM_ID = String(env.VITE_GTM_ID || "").trim();
const GA_ID = String(env.VITE_GA_MEASUREMENT_ID || "").trim();
const PIXEL_ID = String(env.VITE_META_PIXEL_ID || "").trim();

const VALID_GTM = /^GTM-[A-Z0-9]{4,12}$/i;
const VALID_GA = /^G-[A-Z0-9]{4,20}$/i;
const VALID_PIXEL = /^\d{10,20}$/;

const PRIVATE_PREFIXES = ["/admin", "/employee", "/leader-training", "/ticket", "/qa/"];
const KEEP_QUERY = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

/** Only these keys may ever be sent as event parameters. */
const ALLOWED_PARAMS = new Set([
  "item_id", "item_name", "item_category", "item_list_name", "currency", "value", "price",
  "items", "link_location", "link_type", "form_name", "trip_type", "departure_city",
  "participants", "page_path", "page_title", "hub",
  // Instagram feed + WhatsApp button (trip names/ids are catalogue data, never personal)
  "placement", "trip_name", "trip_id", "media_type", "position",
]);
const ALLOWED_ITEM_KEYS = new Set(["item_id", "item_name", "item_category", "price", "quantity", "item_variant"]);

const mode = () => (VALID_GTM.test(GTM_ID) ? "gtm" : VALID_GA.test(GA_ID) ? "gtag" : null);
const pixelOn = () => VALID_PIXEL.test(PIXEL_ID);

let googleReady = false;
let pixelReady = false;
let viewItemTimer = null;
let viewItemSent = "";

function isPrivatePath(pathname = "") {
  const p = String(pathname || "/").toLowerCase();
  return PRIVATE_PREFIXES.some((prefix) => p.startsWith(prefix));
}

function optedOut() {
  try {
    if (localStorage.getItem("gt_ga_optout") === "1") return true;
  } catch {
    /* storage blocked */
  }
  const nav = typeof navigator !== "undefined" ? navigator : {};
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1" || window.doNotTrack === "1";
}

/** True when at least one tracker is configured and the visitor has not opted out. */
export function analyticsEnabled() {
  return typeof window !== "undefined" && (mode() !== null || pixelOn()) && !optedOut();
}

/** Strip query/hash except campaign params so no form data or references reach analytics. */
function cleanLocation(href = typeof window !== "undefined" ? window.location.href : "/") {
  try {
    const url = new URL(href, window.location.origin);
    const kept = new URLSearchParams();
    KEEP_QUERY.forEach((k) => {
      if (url.searchParams.has(k)) kept.set(k, url.searchParams.get(k).slice(0, 100));
    });
    const qs = kept.toString();
    return `${url.origin}${url.pathname}${qs ? `?${qs}` : ""}`;
  } catch {
    return `${window.location.origin}${window.location.pathname}`;
  }
}

const looksPersonal = (text) => /@/.test(text) || /\d{7,}/.test(text.replace(/[\s()+-]/g, ""));

function sanitize(params = {}) {
  const out = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (!ALLOWED_PARAMS.has(key) || value == null || value === "") return;
    if (key === "items" && Array.isArray(value)) {
      out.items = value.slice(0, 10).map((item) => {
        const clean = {};
        Object.entries(item || {}).forEach(([k, v]) => {
          if (!ALLOWED_ITEM_KEYS.has(k) || v == null || v === "") return;
          if (typeof v === "number") clean[k] = v;
          else if (!looksPersonal(String(v))) clean[k] = String(v).slice(0, 100);
        });
        return clean;
      });
      return;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
      return;
    }
    const text = String(value).slice(0, 100);
    if (!looksPersonal(text)) out[key] = text;
  });
  return out;
}

function gtagShim() {
  window.dataLayer.push(arguments);
}

function loadScript(src, tag) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.dataset.gt = tag;
  document.head.appendChild(script);
}

function initGoogle() {
  const m = mode();
  if (googleReady || !m) return;
  googleReady = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || gtagShim;
  // Consent Mode v2 defaults (read by both GTM and gtag).
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  if (m === "gtm") {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`, "gtm");
    return;
  }
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_flags: "SameSite=Lax;Secure",
  });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`, "ga4");
}

function initPixel() {
  if (pixelReady || !pixelOn()) return;
  pixelReady = true;
  /* Meta's standard loader, unminified. */
  if (!window.fbq) {
    const fbq = function fbqShim(...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js", "meta-pixel");
  }
  window.fbq.disablePushState = true; // the SPA sends its own PageView per route
  window.fbq("set", "autoConfig", false, PIXEL_ID);
  window.fbq("init", PIXEL_ID); // no advanced matching (no user data object)
}

function pushGoogle(name, params) {
  const m = mode();
  if (!m) return;
  initGoogle();
  if (m === "gtm") {
    if (params.items) window.dataLayer.push({ ecommerce: null }); // GA4 ecommerce reset
    const { items, currency, value, ...rest } = params;
    window.dataLayer.push({
      event: name,
      ...rest,
      ...(items ? { ecommerce: { currency: currency || "INR", ...(value != null ? { value } : {}), items } } : { ...(currency ? { currency } : {}), ...(value != null ? { value } : {}) }),
    });
    return;
  }
  window.gtag("event", name, params);
}

/** GA4/GTM event name → Meta standard event. */
const PIXEL_EVENT = {
  view_item: "ViewContent",
  enquiry_submit: "Lead",
  whatsapp_click: "Contact",
  phone_click: "Contact",
};

function pushPixel(name, params) {
  const pixelName = PIXEL_EVENT[name];
  if (!pixelName || !pixelOn()) return;
  initPixel();
  const item = params.items?.[0] || {};
  const data = {};
  if (name === "view_item") {
    if (item.item_id) data.content_ids = [item.item_id];
    data.content_type = "product";
    if (item.item_name) data.content_name = item.item_name;
    if (item.item_category) data.content_category = item.item_category;
  } else {
    if (params.item_name) data.content_name = params.item_name;
    if (params.item_category || params.form_name) data.content_category = params.item_category || params.form_name;
    if (params.link_location) data.content_category = `${name}:${params.link_location}`;
  }
  if (params.value != null) {
    data.value = params.value;
    data.currency = params.currency || "INR";
  }
  window.fbq("track", pixelName, data);
}

/** Called on every route change. */
export function trackPageView(pathname = window.location.pathname) {
  if (!analyticsEnabled()) return;
  if (!String(viewItemSent).startsWith(`${pathname}|`)) viewItemSent = "";
  if (isPrivatePath(pathname)) {
    if (GA_ID && googleReady) window[`ga-disable-${GA_ID}`] = true;
    return;
  }
  if (GA_ID) window[`ga-disable-${GA_ID}`] = false;
  const params = { page_location: cleanLocation(), page_path: pathname, page_title: document.title };
  const m = mode();
  if (m) {
    initGoogle();
    if (m === "gtm") window.dataLayer.push({ event: "page_view", ...params });
    else window.gtag("event", "page_view", params);
  }
  if (pixelOn()) {
    initPixel();
    window.fbq("track", "PageView");
  }
}

/** Fire an event with allow-listed, non-personal parameters only. */
export function trackEvent(name, params = {}) {
  try {
    if (!analyticsEnabled() || isPrivatePath(window.location.pathname)) return;
    const clean = sanitize(params);
    pushGoogle(name, clean);
    pushPixel(name, clean);
  } catch {
    /* analytics must never break the page */
  }
}

/** GA4 recommended item shape for a trip. */
export function tripItem({ slug, name, productType, price } = {}) {
  const n = Number(price);
  return {
    item_id: slug || "",
    item_name: name || "",
    item_category: productType || "",
    ...(Number.isFinite(n) && n > 0 ? { price: n } : {}),
  };
}

/**
 * view_item / ViewContent once per trip page visit. Trip pages render cached data first and the live
 * record a moment later, so this waits for the data to settle and keeps the last (live) values.
 */
export function trackViewItem(trip = {}) {
  if (!trip?.slug || typeof window === "undefined") return;
  const key = `${window.location.pathname}|${trip.slug}`;
  if (viewItemSent === key) return;
  clearTimeout(viewItemTimer);
  viewItemTimer = setTimeout(() => {
    if (viewItemSent === key || `${window.location.pathname}|${trip.slug}` !== key) return;
    viewItemSent = key;
    const item = tripItem(trip);
    trackEvent("view_item", {
      currency: "INR",
      ...(item.price ? { value: item.price } : {}),
      items: [item],
    });
  }, 1500);
}
