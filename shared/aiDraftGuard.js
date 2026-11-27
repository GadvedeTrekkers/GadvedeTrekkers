/**
 * aiDraftGuard.js — checks an AI reply draft against the real trip data BEFORE a person sends it.
 * Shared by the backend (warnings returned with every Gemini draft) and the admin page (re-checked live while staff
 * edit the text). It never blocks anything: it only lists what a person must double-check.
 *
 * Flags: prices not in the trip data, dates that are not real batch dates, phone numbers other than Gadvede's
 * official WhatsApp, star ratings / review counts / "1000+ happy trekkers" claims, links to other sites,
 * leftover placeholders like [Name], and drafts longer than the channel allows.
 */
export const OFFICIAL_WHATSAPP = "9856112727";
export const REPLY_CHANNELS = {
  whatsapp:  { label: "WhatsApp",              maxChars: 1000 },
  instagram: { label: "Instagram DM",          maxChars: 1000 },
  email:     { label: "Email",                 maxChars: 3000 },
  website:   { label: "Website enquiry reply", maxChars: 3000 },
};
export const REPLY_CHANNEL_IDS = Object.keys(REPLY_CHANNELS);
const ALLOWED_HOSTS = ["gadvede.com", "www.gadvede.com", "wa.me", "api.whatsapp.com", "instagram.com", "www.instagram.com", "g.page", "maps.app.goo.gl"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const num = (s) => Number(String(s).replace(/,/g, ""));
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

/** Every rupee amount written in the text (₹1,299 · Rs. 1299 · INR 1299 · 1299/- · 1,299 rupees). */
export function rupeeAmounts(text = "") {
  const out = [];
  const re = /(?:₹|\brs\.?|\binr)\s*(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*)\s*(?:\/-|rupees\b)/gi;
  let m;
  while ((m = re.exec(String(text)))) {
    const n = num(m[1] ?? m[2]);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

/** Day+month pairs written in the text ("12 Dec", "Dec 12", "12th December", "12/12"; "-" and "." are not used so "2-3 days" and "9.10 PM" are not dates). → ["12-12", ...] (dd-mm). */
export function dayMonths(text = "") {
  const out = [];
  const t = String(text).toLowerCase();
  const a = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?${MONTH_RE}\\b`, "g");
  const b = new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "g");
  const c = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
  const mm = (name) => String(MONTHS.indexOf(name.slice(0, 3)) + 1).padStart(2, "0");
  const dd = (d) => String(Number(d)).padStart(2, "0");
  let m;
  while ((m = a.exec(t))) if (Number(m[1]) >= 1 && Number(m[1]) <= 31) out.push(`${dd(m[1])}-${mm(m[2])}`);
  while ((m = b.exec(t))) if (Number(m[2]) >= 1 && Number(m[2]) <= 31) out.push(`${dd(m[2])}-${mm(m[1])}`);
  while ((m = c.exec(t))) {
    const d = Number(m[1]); const mo = Number(m[2]);
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) out.push(`${dd(d)}-${String(mo).padStart(2, "0")}`);
  }
  return [...new Set(out)];
}

/** Indian mobile numbers written in the text, as 10 digits. */
export function phoneNumbers(text = "") {
  const out = [];
  const re = /(?:\+?91[\s-]?)?(?<![\d])([6-9]\d{4})[\s-]?(\d{5})(?![\d])/g;
  let m;
  while ((m = re.exec(String(text)))) out.push(`${m[1]}${m[2]}`);
  return [...new Set(out)];
}

export function linkHosts(text = "") {
  const out = [];
  const re = /\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/[^\s)]*)?/gi;
  let m;
  while ((m = re.exec(String(text)))) {
    const host = m[1].toLowerCase();
    if (/^\d/.test(host) || !/[a-z]/.test(host.replace(/\.[a-z]+$/, ""))) continue;
    if (!/\.(com|in|me|org|net|co|io|page|gl|link|app|ly|site|info|travel)$/.test(host)) continue;
    out.push(host);
  }
  return [...new Set(out)];
}

/**
 * @param {string} text  the draft
 * @param {{ prices?: number[], dates?: string[] (YYYY-MM-DD), maxGroup?: number, channel?: string }} facts
 * @returns {{ code: string, message: string }[]}
 */
export function checkDraft(text = "", facts = {}) {
  const warnings = [];
  const body = String(text || "");
  const add = (code, message) => { if (!warnings.some((w) => w.message === message)) warnings.push({ code, message }); };
  if (!body.trim()) return [{ code: "empty", message: "The draft is empty." }];

  const prices = [...new Set((facts.prices || []).map(Number).filter((n) => n > 0))];
  const maxGroup = Math.min(Math.max(Number(facts.maxGroup) || 20, 1), 50);
  const allowedAmounts = new Set();
  prices.forEach((p) => { for (let k = 1; k <= maxGroup; k += 1) allowedAmounts.add(p * k); });
  for (const n of rupeeAmounts(body)) {
    if (!allowedAmounts.has(n)) {
      add("price", prices.length
        ? `${fmt(n)} is not a price in this trip's data (${prices.map(fmt).join(", ")}). Check before sending.`
        : `${fmt(n)} is mentioned, but this trip has no price in admin. Check before sending.`);
    }
  }

  const real = new Set((facts.dates || []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d))).map((d) => `${d.slice(8, 10)}-${d.slice(5, 7)}`));
  for (const dm of dayMonths(body)) {
    if (!real.has(dm)) {
      const [d, m] = dm.split("-");
      add("date", `The date ${Number(d)} ${MONTHS[Number(m) - 1][0].toUpperCase()}${MONTHS[Number(m) - 1].slice(1)} is not one of this trip's batch dates. Check before sending.`);
    }
  }

  for (const p of phoneNumbers(body)) {
    if (p !== OFFICIAL_WHATSAPP) add("phone", `The number ${p} is not Gadvede's official WhatsApp (${OFFICIAL_WHATSAPP}).`);
  }

  if (/\b\d(?:\.\d)?\s*(?:★|⭐|stars?\b|\/\s*5\b|out of 5)|\b\d[\d,]*\s*\+?\s*(?:k\+?\s*)?(?:happy\s+|satisfied\s+)?(?:trekkers|customers|travell?ers|clients|reviews|ratings|participants)\b|\b(?:top[- ]rated|highest[- ]rated|best[- ]rated|#\s?1|number one)\b/i.test(body)) {
    add("claim", "Mentions a rating, review count or customer count. Gadvede only uses real, verifiable numbers — remove or check it.");
  }

  for (const host of linkHosts(body)) {
    if (!ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) add("link", `Links to ${host}, which is not a Gadvede link.`);
  }

  if (/\[[^\]\n]{2,40}\](?!\()|\{\{[^}]*\}\}|<[A-Z][A-Za-z ]{1,30}>|\bXX+\b/.test(body)) add("placeholder", "Has a placeholder like [Name] or {{…}} that must be filled in.");

  const max = REPLY_CHANNELS[facts.channel]?.maxChars;
  if (max && body.length > max) add("length", `Long for ${REPLY_CHANNELS[facts.channel].label} (${body.length} characters; aim for under ${max}).`);
  return warnings;
}
