import { Fragment } from "react";
import { Link } from "react-router-dom";
import { headingId, parseBlocks, parseInline } from "../../../shared/blogContent.js";

/**
 * Renders the blog's safe Markdown subset as React elements (never dangerouslySetInnerHTML).
 * Site links ("/treks/…") use the router; https links open in a new tab with rel="noopener noreferrer nofollow"
 * unless they point to gadvede.com.
 */
function Inline({ text }) {
  return parseInline(text).map((tok, i) => {
    if (tok.t === "b") return <strong key={i}>{tok.v}</strong>;
    if (tok.t === "i") return <em key={i}>{tok.v}</em>;
    if (tok.t === "a") {
      if (tok.href.startsWith("/")) return <Link key={i} to={tok.href}>{tok.v}</Link>;
      const own = /^https:\/\/(www\.)?gadvede\.com(\/|$)/i.test(tok.href);
      return <a key={i} href={tok.href} {...(own ? {} : { target: "_blank", rel: "noopener noreferrer nofollow" })}>{tok.v}</a>;
    }
    return <Fragment key={i}>{tok.v}</Fragment>;
  });
}

export default function BlogContent({ markdown = "" }) {
  return parseBlocks(markdown).map((b, i) => {
    switch (b.type) {
      case "h2": return <h2 key={i} id={headingId(b.text)}><Inline text={b.text} /></h2>;
      case "h3": return <h3 key={i} id={headingId(b.text)}><Inline text={b.text} /></h3>;
      case "ul": return <ul key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
      case "ol": return <ol key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ol>;
      case "quote": return <blockquote key={i}><Inline text={b.text} /></blockquote>;
      default: return <p key={i}><Inline text={b.text} /></p>;
    }
  });
}
