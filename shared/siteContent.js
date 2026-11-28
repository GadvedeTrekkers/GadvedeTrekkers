/**
 * Site Content (Admin → Settings → Site Content) — Pratik t129u: "Nothing in site code; everything managed from admin."
 * One schema shared by the admin editor (renders the forms from it), the backend (authoritative validation) and the
 * public site (reads only PUBLISHED values). Pure functions only: no DB, no secrets, no browser/Node APIs.
 *
 * Storage: public.site_content (migration 023): one row per key with a `draft` JSON and a `published` JSON.
 * Nothing has a built-in value: an empty / unpublished section is simply not shown on the site.
 * (Contact number, email, address and social links live in Profile Setup, not here.)
 */

/** Field types: text (one line), textarea (multi-line), url (https:// or a site path like /treks), icon (emoji / short text). */
const T = (name, label, extra = {}) => ({ name, label, type: "text", max: 160, ...extra });
const TA = (name, label, extra = {}) => ({ name, label, type: "textarea", max: 4000, ...extra });
const U = (name, label, extra = {}) => ({ name, label, type: "url", max: 500, ...extra });
const I = (name, label = "Icon (emoji)") => ({ name, label, type: "icon", max: 8 });

const PAGE_FIELDS = [T("title", "Page title", { required: true, max: 120 }), T("metaDescription", "Search description (max 160)", { max: 160 }), TA("intro", "Intro paragraph", { max: 2000 })];
const PAGE_LIST = { name: "sections", label: "Sections", itemLabel: "Section", max: 30, fields: [T("heading", "Heading", { required: true }), TA("body", "Text", { required: true, max: 6000 })] };

export const SITE_CONTENT_SECTIONS = [
  /* ── Home page ── */
  { key: "home.hero", group: "Home page", label: "Hero slides", help: "The big banner at the top of the home page. No slides = a plain heading.",
    fields: [], list: { name: "slides", label: "Slides", itemLabel: "Slide", max: 5, fields: [
      T("kicker", "Small label above the heading", { max: 60 }), T("headline", "Heading", { required: true, max: 80 }), T("accent", "Highlighted part of the heading", { max: 60 }),
      TA("subtitle", "Sub-heading", { max: 300 }), U("image", "Background image URL"), T("ctaLabel", "Button text", { max: 40 }), U("ctaLink", "Button link"),
      T("cta2Label", "Second button text", { max: 40 }), U("cta2Link", "Second button link")] } },
  { key: "home.stats", group: "Home page", label: "Headline numbers", help: "Shown only if you add them. Use only numbers you can prove.",
    fields: [], list: { name: "items", label: "Numbers", itemLabel: "Number", max: 6, fields: [T("value", "Number (e.g. 500+)", { required: true, max: 20 }), T("label", "Label (e.g. Treks completed)", { required: true, max: 40 })] } },
  { key: "home.testimonials", group: "Home page", label: "Testimonials", help: "Real customer words only, with their permission.",
    fields: [T("eyebrow", "Small label", { max: 40 }), T("title", "Section heading", { max: 80 }), T("subtitle", "Section sub-heading", { max: 200 })],
    list: { name: "items", label: "Testimonials", itemLabel: "Testimonial", max: 12, fields: [T("name", "Customer name (e.g. Priya M.)", { required: true, max: 60 }), T("trip", "Trip", { max: 80 }), TA("text", "What they said", { required: true, max: 600 })] } },
  { key: "home.services", group: "Home page", label: "Services", help: "The 'What we offer' cards.",
    fields: [T("eyebrow", "Small label", { max: 40 }), T("title", "Section heading", { max: 80 }), T("subtitle", "Section sub-heading", { max: 200 })],
    list: { name: "items", label: "Services", itemLabel: "Service", max: 12, fields: [I("icon"), T("title", "Title", { required: true, max: 60 }), TA("text", "Description", { max: 300 }), U("link", "Link (e.g. /treks)")] } },
  { key: "home.cta", group: "Home page", label: "Bottom call-to-action", help: "The banner near the bottom of the home page.",
    fields: [T("title", "Heading", { required: true, max: 80 }), TA("subtitle", "Text", { max: 300 }), T("buttonLabel", "Button text", { max: 40 }), U("buttonLink", "Button link"), T("whatsappLabel", "WhatsApp button text (empty = no WhatsApp button)", { max: 40 })] },
  { key: "home.localSeo", group: "Home page", label: "Pickup cities and search tags", help: "The small strip at the very bottom of the home page.",
    fields: [TA("text", "Text (e.g. Treks available from Pune, Mumbai …)", { max: 400 })], list: { name: "chips", label: "Tags", itemLabel: "Tag", max: 12, fields: [T("label", "Tag", { required: true, max: 40 })] } },

  /* ── Whole site ── */
  { key: "site.announcement", group: "Whole site", label: "Announcement bar", help: "A one-line notice at the top of every public page.",
    fields: [T("text", "Text", { required: true, max: 160 }), T("linkLabel", "Link text", { max: 40 }), U("link", "Link")] },
  { key: "site.trustBadges", group: "Whole site", label: "Trust badges / claims", help: "Short claims shown on trip pages (e.g. 'Best price guaranteed'). Shown only if you add them — use only what you can stand behind.",
    fields: [], list: { name: "items", label: "Badges", itemLabel: "Badge", max: 8, fields: [I("icon"), T("text", "Text", { required: true, max: 60 })] } },
  { key: "site.whyChoose", group: "Whole site", label: "Why choose us", help: "Points shown on trek pages (e.g. trek leader ratio, years running). Only add what is true.",
    fields: [T("title", "Heading", { max: 80 })], list: { name: "items", label: "Points", itemLabel: "Point", max: 12, fields: [TA("text", "Point", { required: true, max: 240 })] } },
  { key: "site.footer", group: "Whole site", label: "Footer text", help: "The short paragraph under the logo in the footer.",
    fields: [TA("about", "About text", { required: true, max: 400 })] },
  { key: "site.seo", group: "Whole site", label: "Search titles & descriptions", help: "What Google shows for the main pages. Title up to 65 characters, description up to 160. Empty = a plain title with the company name.",
    fields: [
      T("homeTitle", "Home — title", { max: 65 }), T("homeDescription", "Home — description", { max: 160 }),
      T("treksTitle", "Treks page — title", { max: 65 }), T("treksDescription", "Treks page — description", { max: 160 }),
      T("tripsTitle", "Trips page — title", { max: 65 }), T("tripsDescription", "Trips page — description", { max: 160 }),
      T("toursTitle", "Tours page — title", { max: 65 }), T("toursDescription", "Tours page — description", { max: 160 }),
      T("campingTitle", "Camping page — title", { max: 65 }), T("campingDescription", "Camping page — description", { max: 160 }),
    ] },
  { key: "treks.intro", group: "Whole site", label: "Treks page intro", help: "The text block on the /treks page.",
    fields: [T("title", "Heading", { required: true, max: 120 }), TA("intro", "Intro", { max: 2000 })], list: PAGE_LIST },

  /* ── Pages (each has its own URL; hidden until published) ── */
  { key: "pages.about", group: "Pages", label: "About us (/about)", path: "/about", fields: PAGE_FIELDS, list: PAGE_LIST },
  { key: "pages.faq", group: "Pages", label: "FAQ (/faq)", path: "/faq", fields: PAGE_FIELDS,
    list: { name: "items", label: "Questions", itemLabel: "Question", max: 60, fields: [T("question", "Question", { required: true, max: 200 }), TA("answer", "Answer", { required: true, max: 3000 })] } },
  { key: "pages.terms", group: "Pages", label: "Terms & conditions (/terms)", path: "/terms", fields: PAGE_FIELDS, list: PAGE_LIST },
  { key: "pages.privacy", group: "Pages", label: "Privacy policy (/privacy-policy)", path: "/privacy-policy", fields: PAGE_FIELDS, list: PAGE_LIST },
  { key: "pages.cancellation", group: "Pages", label: "Cancellation policy (/cancellation-policy)", path: "/cancellation-policy", fields: PAGE_FIELDS, list: PAGE_LIST },
];

export const SITE_CONTENT_KEYS = SITE_CONTENT_SECTIONS.map((s) => s.key);
export const sectionFor = (key) => SITE_CONTENT_SECTIONS.find((s) => s.key === key) || null;
/** Pages that have their own public URL, by path. */
export const CONTENT_PAGE_BY_PATH = Object.fromEntries(SITE_CONTENT_SECTIONS.filter((s) => s.path).map((s) => [s.path, s.key]));

/** Roles that may edit and publish site content. */
const roleKey = (r) => String(r ?? "").toLowerCase().replace(/[\s_-]/g, "");
export const canEditSiteContent = (admin) => ["superadmin", "admin"].includes(roleKey(admin?.role));

// eslint-disable-next-line no-control-regex
const oneLine = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// eslint-disable-next-line no-control-regex
const multiLine = (v, max) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);

/** https URL or a root-relative site path; anything else (javascript:, data:, http:) is rejected. */
export function safeLink(value) {
  const v = oneLine(value, 500);
  if (!v) return { ok: true, value: "" };
  if (/^\/(?!\/)[A-Za-z0-9\-._~/?#=&%+]*$/.test(v)) return { ok: true, value: v };
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return { ok: false };
    return { ok: true, value: u.toString() };
  } catch { return { ok: false }; }
}

function cleanField(field, raw, errors, path) {
  if (field.type === "url") {
    const r = safeLink(raw);
    if (!r.ok) { errors[path] = "Use an https:// link or a site path that starts with /"; return ""; }
    return r.value;
  }
  const max = field.max ?? 160;
  const v = field.type === "textarea" ? multiLine(raw, max) : oneLine(raw, max);
  if (String(raw ?? "").trim().length > max) errors[path] = `Keep this under ${max} characters`;
  return v;
}

/** An empty value for a section (every field ""; the list empty). */
export function emptyContent(key) {
  const s = sectionFor(key);
  if (!s) return null;
  const out = {};
  for (const f of s.fields) out[f.name] = "";
  if (s.list) out[s.list.name] = [];
  return out;
}

/**
 * Validate + normalise submitted content for `key`. Returns { errors, content }.
 * Unknown keys/fields are dropped. Fully empty list items are dropped. Required fields are only enforced when
 * the section has something in it (so an empty draft can always be saved).
 */
export function validateContent(key, input) {
  const s = sectionFor(key);
  if (!s) return { errors: { key: "Unknown section" }, content: null };
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = {};
  const content = {};
  for (const f of s.fields) content[f.name] = cleanField(f, src[f.name], errors, f.name);
  if (s.list) {
    const rawItems = Array.isArray(src[s.list.name]) ? src[s.list.name] : [];
    if (rawItems.length > s.list.max) errors[s.list.name] = `At most ${s.list.max} ${s.list.label.toLowerCase()}`;
    const items = [];
    rawItems.slice(0, s.list.max).forEach((it, i) => {
      const item = {};
      const obj = it && typeof it === "object" ? it : {};
      for (const f of s.list.fields) item[f.name] = cleanField(f, obj[f.name], errors, `${s.list.name}.${i}.${f.name}`);
      if (Object.values(item).some((v) => v !== "")) {
        for (const f of s.list.fields) if (f.required && !item[f.name]) errors[`${s.list.name}.${i}.${f.name}`] = `${f.label} is required`;
        items.push(item);
      }
    });
    content[s.list.name] = items;
  }
  const hasAnything = isFilled(key, content);
  if (hasAnything) for (const f of s.fields) if (f.required && !content[f.name]) errors[f.name] = `${f.label} is required`;
  return { errors, content };
}

/** True when the section has any text or list item (an empty section is never shown). */
export function isFilled(key, content) {
  const s = sectionFor(key);
  if (!s || !content || typeof content !== "object") return false;
  if (s.fields.some((f) => String(content[f.name] ?? "").trim())) return true;
  return Boolean(s.list && Array.isArray(content[s.list.name]) && content[s.list.name].length);
}
