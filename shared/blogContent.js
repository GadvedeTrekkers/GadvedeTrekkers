/**
 * blogContent.js — a tiny, safe Markdown subset for blog posts (no HTML is ever rendered).
 * Supported: "## H2", "### H3", paragraphs, "- " / "* " bullet lists, "1. " numbered lists, "> " quotes,
 * **bold**, *italic*, and [text](link). Links are kept only when they are https:// or a site path ("/treks/…");
 * anything else (javascript:, data:, http:, mailto:) is shown as plain text. "# H1" is turned into H2 because
 * the page already has the post title as its only H1.
 * Used by the public /blog/:slug page, the admin preview and the server (word count, validation).
 */
export function safeHref(href = "") {
  const h = String(href).trim();
  if (/^https:\/\/[^\s"'<>]+$/i.test(h)) return h;
  if (/^\/(?!\/)[^\s"'<>]*$/.test(h)) return h;
  return null;
}

/** "a **b** [c](https://x)" → [{t:"text",v:"a "},{t:"b",v:"b"},{t:"text",v:" "},{t:"a",v:"c",href:"https://x"}] */
export function parseInline(text = "") {
  const out = [];
  const re = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  const src = String(text);
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[1] != null) out.push({ t: "b", v: m[1] });
    else if (m[2] != null) out.push({ t: "i", v: m[2] });
    else {
      const href = safeHref(m[4]);
      out.push(href ? { t: "a", v: m[3], href } : { t: "text", v: m[3] });
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

/** Markdown → blocks: {type:"h2"|"h3"|"p"|"quote", text} | {type:"ul"|"ol", items:[text]} */
export function parseBlocks(markdown = "") {
  const lines = String(markdown).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let para = [];
  let list = null;
  const flushPara = () => { if (para.length) { blocks.push({ type: "p", text: para.join(" ").trim() }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    let m;
    if ((m = /^(#{1,3})\s+(.+)$/.exec(line))) {
      flushPara(); flushList();
      blocks.push({ type: m[1].length === 3 ? "h3" : "h2", text: m[2].replace(/\s*#+\s*$/, "").trim() });
    } else if ((m = /^[-*•]\s+(.+)$/.exec(line))) {
      flushPara();
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push(m[1]);
    } else if ((m = /^\d+[.)]\s+(.+)$/.exec(line))) {
      flushPara();
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
      list.items.push(m[1]);
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      flushPara(); flushList();
      blocks.push({ type: "quote", text: m[1] });
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return blocks;
}

export function plainText(markdown = "") {
  return parseBlocks(markdown)
    .map((b) => (b.items ? b.items.join(" ") : b.text))
    .join(" ")
    .replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, "$1$2")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const wordCount = (markdown = "") => (plainText(markdown).match(/\S+/g) || []).length;
export const readingMinutes = (markdown = "") => Math.max(1, Math.round(wordCount(markdown) / 200));
export const headingsOf = (markdown = "") => parseBlocks(markdown).filter((b) => b.type === "h2" || b.type === "h3");
export const headingId = (text = "") => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
