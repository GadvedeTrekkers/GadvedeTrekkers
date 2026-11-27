/**
 * blogPosts.js — one definition of a blog post (admin Blog section + public /blog pages + backend).
 * Statuses: draft (default; never public) → published (public) → archived (hidden again, kept).
 * There is no delete: a post is unpublished (back to draft) or archived instead.
 */
import { plainText, readingMinutes, wordCount, safeHref } from "./blogContent.js";

export const BLOG_STATUSES = ["draft", "published", "archived"];
export const BLOG_CATEGORIES = ["Trek guides", "Camping", "Tours", "Heritage", "Travel tips", "Gear", "News"];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BLOG_LIMITS = { title: 120, metaTitle: 70, metaDescription: 170, excerpt: 320, content: 60000, keywords: 15, keyword: 60, faq: 12, faqQ: 200, faqA: 1200, author: 80, alt: 160 };
export const SITE = "https://www.gadvede.com";

// eslint-disable-next-line no-control-regex -- strips control characters on purpose
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
const oneLine = (v, max) => clean(v, max * 2).replace(/\s+/g, " ").slice(0, max);

export function slugifyBlog(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export const emptyPost = () => ({
  title: "", slug: "", metaTitle: "", metaDescription: "", excerpt: "", content: "", faq: [], keywords: [],
  category: "Trek guides", coverImageUrl: "", coverImageAlt: "", authorName: "Gadvede Trekkers", relatedTripSlug: "",
  status: "draft", aiGenerated: false, aiModel: "",
});

function keywordList(v) {
  const arr = Array.isArray(v) ? v : String(v ?? "").split(/[,\n]/);
  return [...new Set(arr.map((k) => oneLine(k, BLOG_LIMITS.keyword).toLowerCase()).filter(Boolean))].slice(0, BLOG_LIMITS.keywords);
}

function faqList(v) {
  return (Array.isArray(v) ? v : [])
    .map((f) => ({ q: oneLine(f?.q ?? f?.question, BLOG_LIMITS.faqQ), a: clean(f?.a ?? f?.answer, BLOG_LIMITS.faqA) }))
    .filter((f) => f.q && f.a)
    .slice(0, BLOG_LIMITS.faq);
}

/**
 * Validate + normalise what admin sends. Status is NOT taken from here (it changes only through the status route).
 * @returns {{ value, errors: Record<string,string> }}
 */
export function validateBlogPost(input = {}) {
  const errors = {};
  const title = oneLine(input.title, BLOG_LIMITS.title + 1);
  if (title.length < 5) errors.title = "Add a title (at least 5 characters).";
  else if (title.length > BLOG_LIMITS.title) errors.title = `Keep the title under ${BLOG_LIMITS.title} characters.`;
  const slug = oneLine(input.slug, 100).toLowerCase() || slugifyBlog(title);
  if (!SLUG_RE.test(slug) || slug.length > 80) errors.slug = "Slug: lowercase letters, numbers and dashes only (max 80).";
  const metaTitle = oneLine(input.metaTitle, BLOG_LIMITS.metaTitle + 1);
  if (metaTitle.length > BLOG_LIMITS.metaTitle) errors.metaTitle = `SEO title: max ${BLOG_LIMITS.metaTitle} characters.`;
  const metaDescription = oneLine(input.metaDescription, BLOG_LIMITS.metaDescription + 1);
  if (metaDescription.length > BLOG_LIMITS.metaDescription) errors.metaDescription = `Meta description: max ${BLOG_LIMITS.metaDescription} characters.`;
  const excerpt = oneLine(input.excerpt, BLOG_LIMITS.excerpt + 1);
  if (excerpt.length > BLOG_LIMITS.excerpt) errors.excerpt = `Excerpt: max ${BLOG_LIMITS.excerpt} characters.`;
  const content = clean(input.content, BLOG_LIMITS.content + 1);
  if (content.length > BLOG_LIMITS.content) errors.content = "The article is too long.";
  const category = BLOG_CATEGORIES.includes(input.category) ? input.category : BLOG_CATEGORIES[0];
  const coverImageUrl = oneLine(input.coverImageUrl, 600);
  if (coverImageUrl && !safeHref(coverImageUrl)) errors.coverImageUrl = "Cover image must be an https:// link or a site path like /trips/vasota.jpg.";
  const relatedTripSlug = oneLine(input.relatedTripSlug, 120).toLowerCase();
  if (relatedTripSlug && !SLUG_RE.test(relatedTripSlug)) errors.relatedTripSlug = "Related trip is not valid.";
  const value = {
    title: title.slice(0, BLOG_LIMITS.title), slug, metaTitle, metaDescription, excerpt, content,
    faq: faqList(input.faq), keywords: keywordList(input.keywords), category,
    coverImageUrl, coverImageAlt: oneLine(input.coverImageAlt, BLOG_LIMITS.alt),
    authorName: oneLine(input.authorName, BLOG_LIMITS.author) || "Gadvede Trekkers",
    relatedTripSlug, aiGenerated: Boolean(input.aiGenerated), aiModel: oneLine(input.aiModel, 60),
  };
  return { value, errors };
}

/** What is still missing before a post may be published (shown in admin; enforced by the server). */
export function publishProblems(post = {}) {
  const p = [];
  if (!post.title || post.title.length < 5) p.push("Title");
  if (!post.metaDescription || post.metaDescription.length < 50) p.push("Meta description (50–170 characters)");
  if (wordCount(post.content) < 150) p.push("Article text (at least 150 words)");
  if (/\[[^\]\n]{2,40}\](?!\()|\{\{[^}]*\}\}|\bTODO\b/.test(`${post.content} ${post.title}`)) p.push("Remove placeholders like [Name], {{…}} or TODO");
  return p;
}

/** DB row (snake_case) → API object. `admin` adds the internal fields. */
export function postFromRow(r = {}, { admin = false } = {}) {
  const base = {
    id: r.id, slug: r.slug, title: r.title, metaTitle: r.meta_title || "", metaDescription: r.meta_description || "",
    excerpt: r.excerpt || "", content: r.content || "", faq: Array.isArray(r.faq) ? r.faq : [],
    keywords: Array.isArray(r.keywords) ? r.keywords : [], category: r.category || BLOG_CATEGORIES[0],
    coverImageUrl: r.cover_image_url || "", coverImageAlt: r.cover_image_alt || "", authorName: r.author_name || "Gadvede Trekkers",
    relatedTripSlug: r.related_trip_slug || "", publishedAt: r.published_at || null, updatedAt: r.updated_at || null,
    readingMinutes: readingMinutes(r.content || ""),
  };
  if (!admin) return base;
  return { ...base, status: r.status, aiGenerated: Boolean(r.ai_generated), aiModel: r.ai_model || "", createdAt: r.created_at || null,
    createdBy: r.created_by || "", updatedBy: r.updated_by || "", wordCount: wordCount(r.content || "") };
}

export function rowFromPost(v) {
  return {
    slug: v.slug, title: v.title, meta_title: v.metaTitle || null, meta_description: v.metaDescription || null, excerpt: v.excerpt || null,
    content: v.content || "", faq: v.faq || [], keywords: v.keywords || [], category: v.category, cover_image_url: v.coverImageUrl || null,
    cover_image_alt: v.coverImageAlt || null, author_name: v.authorName || "Gadvede Trekkers", related_trip_slug: v.relatedTripSlug || null,
    ai_generated: Boolean(v.aiGenerated), ai_model: v.aiModel || null,
  };
}

/** Article (+ FAQPage when the post has FAQs) + BreadcrumbList JSON-LD for /blog/:slug. No ratings, ever. */
export function blogPostJsonLd(post, { origin = SITE, logo = `${SITE}/gadvedelogo.png` } = {}) {
  const url = `${origin}/blog/${post.slug}`;
  const image = post.coverImageUrl ? (post.coverImageUrl.startsWith("/") ? `${origin}${post.coverImageUrl}` : post.coverImageUrl) : undefined;
  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: String(post.metaTitle || post.title).slice(0, 110),
      description: post.metaDescription || post.excerpt || plainText(post.content).slice(0, 160),
      mainEntityOfPage: url,
      url,
      ...(image ? { image: [image] } : {}),
      datePublished: post.publishedAt || undefined,
      dateModified: post.updatedAt || post.publishedAt || undefined,
      author: { "@type": "Organization", name: post.authorName || "Gadvede Trekkers", url: origin },
      publisher: { "@type": "Organization", name: "Gadvede Trekkers", url: origin, logo: { "@type": "ImageObject", url: logo } },
      ...(post.keywords?.length ? { keywords: post.keywords.join(", ") } : {}),
      articleSection: post.category || undefined,
      wordCount: wordCount(post.content),
      inLanguage: "en-IN",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": JSON.parse(JSON.stringify(graph)) };
}
