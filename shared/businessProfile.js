/**
 * Business profile (Admin → Profile Setup) — Pratik t84u + t85u.
 * One schema shared by the admin page (validation as you type) and the backend (authoritative validation).
 * Pure functions only: no DB, no secrets, no browser/Node APIs.
 *
 * Stored as one JSON value in public.site_settings (key "business.profile", migration 015/018).
 * The WhatsApp number keeps living in its own key "contact.whatsapp_number" (FR-FE-89) so the site has ONE number.
 */

export const DEFAULT_WHATSAPP = "919856112727";
export const DEFAULT_COMPANY_NAME = "Gadvede Trekkers";

export const THEME_PRESETS = [
  { id: "sahyadri", label: "Sahyadri green", primary: "#0C6E44", accent: "#F59E0B" },
  { id: "monsoon", label: "Monsoon teal", primary: "#0F766E", accent: "#22D3EE" },
  { id: "sunset", label: "Sunset trail", primary: "#C2410C", accent: "#FACC15" },
  { id: "night-sky", label: "Night sky", primary: "#1E3A8A", accent: "#A78BFA" },
  { id: "fort-stone", label: "Fort stone", primary: "#44403C", accent: "#EAB308" },
];
export const THEME_MODES = ["light", "dark"];
export const EMAIL_PURPOSES = [
  { key: "receipts", label: "Receipts", help: "Customer receipts and invoices are sent from / replied to here." },
  { key: "transactions", label: "Transactions", help: "Payment and transaction alerts." },
  { key: "refunds", label: "Refunds", help: "Refund requests and refund updates." },
  { key: "bookingConfirmation", label: "Booking confirmation", help: "Customers reply to booking and payment-registration confirmation emails here." },
];
export const IMAGE_KINDS = {
  logo:            { label: "Logo",                 visibility: "public",  maxBytes: 1024 * 1024,     maxSide: 800, format: "png" },
  favicon:         { label: "Favicon",              visibility: "public",  maxBytes: 256 * 1024,      maxSide: 256, format: "png" },
  paymentQr:       { label: "Payment QR",           visibility: "private", maxBytes: 1024 * 1024,     maxSide: 1200, format: "jpeg" },
  mtdcCertificate: { label: "MTDC certificate",     visibility: "private", maxBytes: 2 * 1024 * 1024, maxSide: 2000, format: "jpeg" },
};
/** Fields only a Super Admin may change (money goes to the bank/UPI; the number is the single customer line). */
export const SENSITIVE_FIELDS = ["whatsappNumber", "bank.accountName", "bank.bankName", "bank.accountNumber", "bank.ifsc", "bank.upiId", "images.paymentQr"];

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
export const PIN_RE = /^[1-9]\d{5}$/;
export const PAN_RE = /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/;
export const GSTIN_RE = /^(0[1-9]|[1-2]\d|3[0-8]|97|99)[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const UPI_RE = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}$/;
export const ACCOUNT_NO_RE = /^\d{9,18}$/;
export const RECEIPT_PREFIX_RE = /^[A-Z0-9][A-Z0-9/-]{0,11}$/;
export const MTDC_RE = /^[A-Za-z0-9][A-Za-z0-9/ .-]{3,59}$/;

const SOCIAL_HOSTS = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  youtube: ["youtube.com", "youtu.be"],
  googleMaps: ["google.com", "google.co.in", "maps.google.com", "goo.gl", "maps.app.goo.gl", "g.page"],
};

// eslint-disable-next-line no-control-regex
const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// eslint-disable-next-line no-control-regex
const cleanLong = (v, max = 5000) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);

export function normalizeIndianMobile(value) {
  let d = String(value ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
/** "98561 12727" / "+91 9856112727" → "919856112727" ('' when not a valid Indian mobile). */
export function toWhatsapp91(value) {
  const d = normalizeIndianMobile(value);
  return INDIAN_MOBILE_RE.test(d) ? `91${d}` : "";
}
export const formatWhatsapp = (n91) => (/^91\d{10}$/.test(String(n91 || "")) ? `+91 ${n91.slice(2, 7)} ${n91.slice(7)}` : "");

/** GSTIN check digit (GSTN mod-36 algorithm). */
export function gstinChecksumOk(gstin) {
  const g = String(gstin || "").toUpperCase();
  if (!GSTIN_RE.test(g)) return false;
  const cs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const p = cs.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return cs[(36 - (sum % 36)) % 36] === g[14];
}

export function maskAccountNumber(n) {
  const d = String(n ?? "").replace(/\D/g, "");
  if (!d) return "";
  return `${"•".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}`;
}

function safeUrl(value) {
  const v = clean(value, 500);
  if (!v) return { ok: true, value: "" };
  let u;
  try { u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); } catch { return { ok: false }; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false };
  if (!u.hostname.includes(".") || u.username || u.password) return { ok: false };
  u.protocol = "https:";
  return { ok: true, value: u.toString(), host: u.hostname.toLowerCase().replace(/^www\.|^m\./, "") };
}
const hostAllowed = (host, list) => list.some((h) => host === h || host.endsWith(`.${h}`));

/** The full empty profile (every key present, all optional values ""). */
export function emptyProfile() {
  return {
    companyName: DEFAULT_COMPANY_NAME,
    ownerName: "",
    business: { legalName: "", tagline: "", gstin: "", pan: "", mtdcRegistrationNo: "", yearEstablished: "" },
    address: { line1: "", line2: "", city: "", state: "Maharashtra", pin: "", country: "India" },
    contact: { primaryPhone: "", alternatePhone: "", supportEmail: "", officeHours: "" },
    whatsappNumber: DEFAULT_WHATSAPP,
    emails: { receipts: "", transactions: "", refunds: "", bookingConfirmation: "" },
    online: { website: "https://www.gadvede.com/", instagram: "https://www.instagram.com/gadvede_trekkers/", facebook: "", youtube: "", googleMaps: "" },
    billing: { receiptPrefix: "GT-" },
    bank: { accountName: "", bankName: "", accountNumber: "", ifsc: "", upiId: "" },
    policies: { cancellation: "", terms: "", privacy: "" },
    branding: { emailSignature: "" },
    theme: { preset: "sahyadri", primary: "#0C6E44", accent: "#F59E0B", mode: "light" },
    images: { logo: null, favicon: null, paymentQr: null, mtdcCertificate: null },
  };
}

/** Deep-merge a stored/partial value onto the empty profile (unknown keys dropped). */
export function withDefaults(stored = {}) {
  const base = emptyProfile();
  const src = stored && typeof stored === "object" ? stored : {};
  for (const [k, v] of Object.entries(base)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const s = src[k] && typeof src[k] === "object" ? src[k] : {};
      for (const kk of Object.keys(v)) if (s[kk] !== undefined && s[kk] !== null) base[k][kk] = s[kk];
    } else if (src[k] !== undefined && src[k] !== null && src[k] !== "") base[k] = src[k];
  }
  return base;
}

/**
 * Validate + normalise a submitted profile. Returns { errors, profile }.
 * errors: { "path.to.field": "message" } (empty object = valid).
 * opts.currentAccountNumber: kept when the form sends an empty / masked account number.
 * opts.imagePrefixes: { kind: "prefix/" } — an image path must start with it (server-only check).
 */
export function validateProfile(input = {}, { currentAccountNumber = "", imagePrefixes = null, now = new Date() } = {}) {
  const p = withDefaults(input);
  const errors = {};
  const err = (k, m) => { if (!errors[k]) errors[k] = m; };
  const out = emptyProfile();

  out.companyName = clean(input && "companyName" in input ? input.companyName : p.companyName, 120);
  if (out.companyName.length < 2) err("companyName", "Company name is required.");
  out.ownerName = clean(p.ownerName, 100);
  if (out.ownerName.length < 2) err("ownerName", "Owner name is required.");

  // Business
  const b = p.business;
  out.business.legalName = clean(b.legalName, 160);
  out.business.tagline = clean(b.tagline, 140);
  out.business.gstin = clean(b.gstin, 20).toUpperCase().replace(/\s/g, "");
  if (out.business.gstin && !gstinChecksumOk(out.business.gstin)) err("business.gstin", "Enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV).");
  out.business.pan = clean(b.pan, 12).toUpperCase().replace(/\s/g, "");
  if (out.business.pan && !PAN_RE.test(out.business.pan)) err("business.pan", "Enter a valid PAN (e.g. ABCDE1234F).");
  if (!errors["business.gstin"] && !errors["business.pan"] && out.business.gstin && out.business.pan && out.business.gstin.slice(2, 12) !== out.business.pan) {
    err("business.pan", "PAN does not match the PAN inside the GSTIN.");
  }
  out.business.mtdcRegistrationNo = clean(b.mtdcRegistrationNo, 60);
  if (out.business.mtdcRegistrationNo && !MTDC_RE.test(out.business.mtdcRegistrationNo)) err("business.mtdcRegistrationNo", "Use letters, numbers, / . - and spaces only.");
  const year = clean(b.yearEstablished, 4);
  if (year) {
    const y = Number(year);
    if (!/^\d{4}$/.test(year) || y < 1950 || y > now.getFullYear()) err("business.yearEstablished", `Enter a year between 1950 and ${now.getFullYear()}.`);
  }
  out.business.yearEstablished = year;

  // Address
  const a = p.address;
  out.address = {
    line1: clean(a.line1, 160), line2: clean(a.line2, 160), city: clean(a.city, 80),
    state: clean(a.state, 80), pin: clean(a.pin, 6).replace(/\s/g, ""), country: clean(a.country, 80) || "India",
  };
  if (out.address.pin && !PIN_RE.test(out.address.pin)) err("address.pin", "PIN code must be 6 digits.");

  // Contact
  const c = p.contact;
  const phone = normalizeIndianMobile(c.primaryPhone);
  if (!INDIAN_MOBILE_RE.test(phone)) err("contact.primaryPhone", "Enter a valid 10-digit Indian mobile number.");
  out.contact.primaryPhone = phone;
  const alt = normalizeIndianMobile(c.alternatePhone);
  if (alt && !/^[1-9]\d{9}$/.test(alt)) err("contact.alternatePhone", "Enter a valid 10-digit phone number.");
  out.contact.alternatePhone = alt;
  out.contact.supportEmail = clean(c.supportEmail, 120).toLowerCase();
  if (out.contact.supportEmail && !EMAIL_RE.test(out.contact.supportEmail)) err("contact.supportEmail", "Enter a valid email address.");
  out.contact.officeHours = clean(c.officeHours, 120);

  // WhatsApp (defaults to the single official number)
  const wa = String(p.whatsappNumber ?? "").trim() ? toWhatsapp91(p.whatsappNumber) : DEFAULT_WHATSAPP;
  if (!wa) err("whatsappNumber", "Enter a valid 10-digit Indian WhatsApp number.");
  out.whatsappNumber = wa || clean(p.whatsappNumber, 20);

  // Emails per purpose
  for (const { key, label } of EMAIL_PURPOSES) {
    const e = clean(p.emails[key], 120).toLowerCase();
    out.emails[key] = e;
    if (key === "bookingConfirmation" && !e) err("emails.bookingConfirmation", "Booking confirmation email is required.");
    else if (e && !EMAIL_RE.test(e)) err(`emails.${key}`, `Enter a valid email for ${label.toLowerCase()}.`);
  }

  // Online
  for (const k of Object.keys(out.online)) {
    const r = safeUrl(p.online[k]);
    if (!r.ok) { err(`online.${k}`, "Enter a valid web address (https://…)."); out.online[k] = clean(p.online[k], 500); continue; }
    if (r.value && SOCIAL_HOSTS[k] && !hostAllowed(r.host, SOCIAL_HOSTS[k])) {
      err(`online.${k}`, `This doesn't look like a ${k === "googleMaps" ? "Google Maps" : k[0].toUpperCase() + k.slice(1)} link.`);
    }
    out.online[k] = r.value;
  }

  // Billing / bank
  out.billing.receiptPrefix = clean(p.billing.receiptPrefix, 12).toUpperCase() || "GT-";
  if (!RECEIPT_PREFIX_RE.test(out.billing.receiptPrefix)) err("billing.receiptPrefix", "Up to 12 characters: A–Z, 0–9, / or -.");
  const bk = p.bank;
  out.bank.accountName = clean(bk.accountName, 120);
  out.bank.bankName = clean(bk.bankName, 120);
  const accRaw = String(bk.accountNumber ?? "").trim();
  const acc = accRaw.includes("•") || !accRaw ? String(currentAccountNumber || "") : accRaw.replace(/[\s-]/g, "");
  if (acc && !ACCOUNT_NO_RE.test(acc)) err("bank.accountNumber", "Account number must be 9–18 digits.");
  out.bank.accountNumber = acc;
  out.bank.ifsc = clean(bk.ifsc, 11).toUpperCase().replace(/\s/g, "");
  if (out.bank.ifsc && !IFSC_RE.test(out.bank.ifsc)) err("bank.ifsc", "Enter a valid IFSC (e.g. SBIN0001234).");
  out.bank.upiId = clean(bk.upiId, 120).replace(/\s/g, "");
  if (out.bank.upiId && !UPI_RE.test(out.bank.upiId)) err("bank.upiId", "Enter a valid UPI ID (e.g. gadvede@okaxis).");

  // Policies: a link or plain text
  for (const k of Object.keys(out.policies)) {
    const v = cleanLong(p.policies[k], 10000);
    if (/^https?:\/\//i.test(v) && !v.includes("\n")) {
      const r = safeUrl(v);
      if (!r.ok) err(`policies.${k}`, "Enter a valid link, or paste the policy text.");
      out.policies[k] = r.ok ? r.value : v;
    } else out.policies[k] = v;
  }
  out.branding.emailSignature = cleanLong(p.branding.emailSignature, 1000);

  // Theme
  const t = p.theme;
  out.theme.preset = THEME_PRESETS.some((x) => x.id === t.preset) ? t.preset : "custom";
  out.theme.primary = String(t.primary || "").toUpperCase();
  out.theme.accent = String(t.accent || "").toUpperCase();
  if (!HEX_RE.test(out.theme.primary)) err("theme.primary", "Pick a colour (#RRGGBB).");
  if (!HEX_RE.test(out.theme.accent)) err("theme.accent", "Pick a colour (#RRGGBB).");
  out.theme.mode = THEME_MODES.includes(t.mode) ? t.mode : "light";

  // Images: { path, url? } references returned by the upload endpoint
  for (const kind of Object.keys(IMAGE_KINDS)) {
    const img = p.images?.[kind];
    if (!img) { out.images[kind] = null; continue; }
    const path = clean(img.path, 200);
    const okPath = /^[a-z0-9/_.-]+\.(png|jpg)$/.test(path) && !path.includes("..");
    const okPrefix = !imagePrefixes || path.startsWith(imagePrefixes[kind]);
    if (!okPath || !okPrefix) { err(`images.${kind}`, "Upload the image again."); out.images[kind] = null; continue; }
    out.images[kind] = IMAGE_KINDS[kind].visibility === "public" ? { path, url: clean(img.url, 500) } : { path };
  }

  return { errors, profile: out };
}

/** The ONLY fields the public site may read. Never bank details or internal emails. */
export function publicProfile(profile) {
  const p = withDefaults(profile);
  return {
    companyName: p.companyName || DEFAULT_COMPANY_NAME,
    tagline: p.business.tagline,
    logoUrl: p.images.logo?.url || "",
    faviconUrl: p.images.favicon?.url || "",
    theme: { primary: p.theme.primary, accent: p.theme.accent, mode: p.theme.mode },
    whatsappNumber: p.whatsappNumber,
    whatsappDisplay: formatWhatsapp(p.whatsappNumber),
    waLink: `https://wa.me/${p.whatsappNumber}`,
    supportEmail: p.contact.supportEmail,
    // City / state / country only (shown in the footer and contact page). Street address and phones stay private.
    address: { city: p.address.city, state: p.address.state, country: p.address.country },
    website: p.online.website,
    socials: { instagram: p.online.instagram, facebook: p.online.facebook, youtube: p.online.youtube, googleMaps: p.online.googleMaps },
  };
}

/** Dotted paths whose value differs (used for the audit log and the Super Admin check). */
export function changedFields(before, after) {
  const out = [];
  const a = withDefaults(before); const b = withDefaults(after);
  for (const k of Object.keys(a)) {
    if (a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) && k !== "images") {
      for (const kk of Object.keys(a[k])) if (JSON.stringify(a[k][kk] ?? "") !== JSON.stringify(b[k]?.[kk] ?? "")) out.push(`${k}.${kk}`);
    } else if (k === "images") {
      for (const kk of Object.keys(IMAGE_KINDS)) if ((a.images[kk]?.path || "") !== (b.images[kk]?.path || "")) out.push(`images.${kk}`);
    } else if (JSON.stringify(a[k] ?? "") !== JSON.stringify(b[k] ?? "")) out.push(k);
  }
  return out;
}
