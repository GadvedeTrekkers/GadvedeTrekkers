/**
 * aiService.js — turns a validated request into Gemini prompts, calls the client and post-checks the answer.
 * Every result is a DRAFT for a person to review: nothing here sends anything to a customer.
 */
import { checkDraft, REPLY_CHANNELS } from "../../../../shared/aiDraftGuard.js";
import { slugifyBlog, SLUG_RE, BLOG_LIMITS } from "../../../../shared/blogPosts.js";
import { AiError } from "./geminiClient.js";
import { buildBlogPrompt, buildReplyPrompt, BLOG_SCHEMA, REPLY_SCHEMA } from "./prompts.js";
import { guardFacts } from "./tripFacts.js";

const s = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const oneLine = (v, max) => s(v, max * 2).replace(/\s+/g, " ").slice(0, max);

export function validateReplyRequest(body = {}) {
  const channel = Object.hasOwn(REPLY_CHANNELS, body.channel) ? body.channel : null;
  if (!channel) throw new AiError("BAD_INPUT", "Choose a channel: WhatsApp, Instagram DM, Email or Website.", { status: 400 });
  const customerMessage = s(body.customerMessage, 2500);
  const tripSlug = oneLine(body.tripSlug, 120).toLowerCase();
  const eventName = oneLine(body.eventName, 160);
  if (!customerMessage && !tripSlug && !eventName) throw new AiError("BAD_INPUT", "Paste the customer's message or pick a trip first.", { status: 400 });
  return {
    channel, customerMessage, tripSlug, eventName,
    customerName: oneLine(body.customerName, 80),
    preferredDate: oneLine(body.preferredDate, 60),
    groupSize: oneLine(body.groupSize, 20),
    staffNote: s(body.staffNote, 400),
    variants: Math.min(Math.max(Number.parseInt(body.variants, 10) || 1, 1), 3),
    enquiryId: oneLine(body.enquiryId, 80),
  };
}

export function validateBlogRequest(body = {}) {
  const topic = oneLine(body.topic, 200);
  if (topic.length < 4) throw new AiError("BAD_INPUT", "Write a topic (at least 4 characters), e.g. \"Kalsubai night trek guide\".", { status: 400 });
  const kw = Array.isArray(body.keywords) ? body.keywords : String(body.keywords ?? "").split(/[,\n]/);
  return {
    topic,
    keywords: [...new Set(kw.map((k) => oneLine(k, 60).toLowerCase()).filter(Boolean))].slice(0, 10),
    tripSlug: oneLine(body.tripSlug, 120).toLowerCase(),
    audience: oneLine(body.audience, 160),
    length: ["short", "medium", "long"].includes(body.length) ? body.length : "medium",
    staffNote: s(body.staffNote, 400),
  };
}

/** → { drafts: [{ label, text, warnings }], subject } */
export async function draftReplies(client, req, { facts, model, timeoutMs }) {
  const { system, prompt } = buildReplyPrompt({ ...req, facts });
  const out = await client.generate({ model, system, prompt, schema: REPLY_SCHEMA, temperature: 0.6, maxOutputTokens: 2048, timeoutMs });
  const replies = Array.isArray(out.json?.replies) ? out.json.replies : [];
  const gf = { ...guardFacts(facts), channel: req.channel, maxGroup: Number.parseInt(req.groupSize, 10) || 20 };
  const drafts = replies
    .map((r, i) => ({ label: oneLine(r?.label, 40) || `Option ${i + 1}`, text: s(r?.text, 4000) }))
    .filter((r) => r.text)
    .slice(0, req.variants)
    .map((r) => ({ ...r, warnings: checkDraft(r.text, gf) }));
  if (!drafts.length) throw new AiError("BAD_OUTPUT", "The AI returned no usable reply. Please try again.");
  return { drafts, subject: oneLine(out.json?.subject, 120), model: out.model, usage: out.usage };
}

const safeSlug = (v, title) => {
  const raw = slugifyBlog(v || "") || slugifyBlog(title || "");
  return SLUG_RE.test(raw) ? raw.slice(0, 80).replace(/-+$/, "") : "";
};

/** Gemini sections → one Markdown article (## headings). */
export function sectionsToMarkdown(sections = []) {
  return sections
    .map((sec) => {
      const h = oneLine(sec?.heading, 120).replace(/^#+\s*/, "");
      const body = s(sec?.body, 8000).replace(/^#{1,6}\s+/gm, "");   // no headings inside a section body
      return h && body ? `## ${h}\n\n${body}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** → { draft: {title, metaTitle, metaDescription, slug, excerpt, content, faq, keywords, headings}, warnings } */
export async function draftBlog(client, req, { facts, model, timeoutMs }) {
  const { system, prompt } = buildBlogPrompt({ ...req, facts });
  const out = await client.generate({ model, system, prompt, schema: BLOG_SCHEMA, temperature: 0.7, maxOutputTokens: 8192, timeoutMs });
  const j = out.json || {};
  const title = oneLine(j.title, BLOG_LIMITS.title);
  const sections = Array.isArray(j.sections) ? j.sections.slice(0, 12) : [];
  const content = sectionsToMarkdown(sections);
  if (!title || !content) throw new AiError("BAD_OUTPUT", "The AI draft was incomplete. Please try again.");
  const faq = (Array.isArray(j.faq) ? j.faq : []).map((f) => ({ q: oneLine(f?.q, BLOG_LIMITS.faqQ), a: s(f?.a, BLOG_LIMITS.faqA) })).filter((f) => f.q && f.a).slice(0, BLOG_LIMITS.faq);
  const draft = {
    title,
    metaTitle: oneLine(j.metaTitle, BLOG_LIMITS.metaTitle),
    metaDescription: oneLine(j.metaDescription, BLOG_LIMITS.metaDescription),
    slug: safeSlug(j.slug, title),
    excerpt: oneLine(j.excerpt, BLOG_LIMITS.excerpt),
    content,
    faq,
    keywords: [...new Set([...(req.keywords || []), ...(Array.isArray(j.keywords) ? j.keywords : [])].map((k) => oneLine(k, 60).toLowerCase()).filter(Boolean))].slice(0, BLOG_LIMITS.keywords),
    headings: sections.map((x) => oneLine(x?.heading, 120)).filter(Boolean),
    relatedTripSlug: facts?.slug || "",
  };
  const gf = guardFacts(facts);
  const all = [draft.title, draft.metaDescription, draft.excerpt, content, ...faq.map((f) => `${f.q} ${f.a}`)].join("\n");
  const warnings = checkDraft(all, gf).filter((w) => w.code !== "length");
  return { draft, warnings, model: out.model, usage: out.usage };
}
