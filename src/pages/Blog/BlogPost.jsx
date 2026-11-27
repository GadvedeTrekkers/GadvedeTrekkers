import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { blogPublicApi } from "../../api/blog.api";
import { useSeo } from "../../seo/useSeo";
import { DEFAULT_OG, SITE_ORIGIN, absoluteUrl } from "../../seo/publicSeo";
import { whatsappHref } from "../../config/contact";
import BlogContent from "../../components/blog/BlogContent";
import { blogPostJsonLd } from "../../../shared/blogPosts.js";
import { headingId, headingsOf } from "../../../shared/blogContent.js";
import "./Blog.css";

/** Public /blog/:slug — only published posts load (drafts/archived → 404 from the API → "not found", noindex). */
const pageTitle = (post) => {
  const base = post.metaTitle || post.title;
  return base.length <= 42 ? `${base} | Gadvede Trekkers` : base.slice(0, 70);
};
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "");

export default function BlogPost() {
  const { slug = "" } = useParams();
  const [state, setState] = useState({ slug: "", post: undefined });
  useEffect(() => {
    let live = true;
    blogPublicApi.bySlug(slug).then((p) => live && setState({ slug, post: p || null })).catch(() => live && setState({ slug, post: null }));
    return () => { live = false; };
  }, [slug]);
  const post = state.slug === slug ? state.post : undefined;

  const canonical = `${SITE_ORIGIN}/blog/${slug}`;
  const jsonLd = useMemo(() => (post ? blogPostJsonLd(post, { origin: SITE_ORIGIN }) : null), [post]);
  const image = post?.coverImageUrl ? absoluteUrl(post.coverImageUrl) : absoluteUrl(DEFAULT_OG.path);
  useSeo({
    title: post ? pageTitle(post) : post === null ? "Post not found | Gadvede Trekkers" : "Blog | Gadvede Trekkers",
    description: post?.metaDescription || post?.excerpt || "Trek guides from Gadvede Trekkers, Pune.",
    canonical,
    image,
    imageAlt: post?.coverImageAlt || DEFAULT_OG.alt,
    type: post ? "article" : "website",
    jsonLd,
    robots: post ? "index, follow" : "noindex, follow",
  });

  if (post === undefined) return <div className="blog-page"><div className="container blog-body"><div className="blog-card blog-card--skeleton" style={{ minHeight: 420 }} /></div></div>;
  if (post === null) {
    return (
      <div className="blog-page">
        <div className="container blog-body blog-empty">
          <h1>Post not found</h1>
          <p>This article isn't available. See all <Link to="/blog">trek guides</Link> or our <Link to="/treks">treks</Link>.</p>
        </div>
      </div>
    );
  }

  const toc = headingsOf(post.content).filter((h) => h.type === "h2");
  const faq = (post.faq || []).filter((f) => f.q && f.a);
  return (
    <div className="blog-page">
      <article className="blog-article">
        <header className="blog-hero">
          <div className="container blog-narrow">
            <nav className="blog-crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> <span aria-hidden="true">/</span> <Link to="/blog">Blog</Link></nav>
            <h1>{post.title}</h1>
            {post.excerpt && <p>{post.excerpt}</p>}
            <div className="blog-byline">{post.authorName}{post.publishedAt ? <> · <time dateTime={post.publishedAt}>{fmt(post.publishedAt)}</time></> : null} · {post.readingMinutes} min read</div>
          </div>
        </header>
        <div className="container blog-narrow blog-body">
          {post.coverImageUrl && <img className="blog-cover" src={post.coverImageUrl} alt={post.coverImageAlt || post.title} width="1200" height="675" />}
          {toc.length > 2 && (
            <nav className="blog-toc" aria-label="In this guide">
              <strong>In this guide</strong>
              <ol>{toc.map((h) => <li key={h.text}><a href={`#${headingId(h.text)}`}>{h.text}</a></li>)}</ol>
            </nav>
          )}
          <div className="blog-prose"><BlogContent markdown={post.content} /></div>
          {faq.length > 0 && (
            <section className="blog-faq" aria-labelledby="blog-faq-h">
              <h2 id="blog-faq-h">Frequently asked questions</h2>
              {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
          <aside className="blog-cta">
            <div>
              <strong>Planning this trip?</strong>
              <span>Check live dates and prices, or ask us anything on WhatsApp.</span>
            </div>
            <div className="blog-cta-actions">
              <a className="blog-btn" href={whatsappHref(`Hi Gadvede Trekkers! I read "${post.title}" and want to know the next dates.`)} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
              <Link className="blog-btn blog-btn--ghost" to="/trips">See open trips</Link>
            </div>
          </aside>
          <p className="blog-back"><Link to="/blog">← All trek guides</Link></p>
        </div>
      </article>
    </div>
  );
}
