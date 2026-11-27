import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { blogPublicApi } from "../../api/blog.api";
import { useSeo } from "../../seo/useSeo";
import { DEFAULT_OG, SITE_ORIGIN, absoluteUrl } from "../../seo/publicSeo";
import { whatsappHref } from "../../config/contact";
import "./Blog.css";

/** Public /blog — published posts only (the API never returns drafts or archived posts). */
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function BlogList() {
  const [posts, setPosts] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    blogPublicApi.list().then((p) => live && setPosts(p || [])).catch(() => { if (live) { setFailed(true); setPosts([]); } });
    return () => { live = false; };
  }, []);

  const canonical = `${SITE_ORIGIN}/blog`;
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Blog", "@id": `${canonical}#blog`, name: "Gadvede Trekkers Blog", url: canonical, inLanguage: "en-IN",
        publisher: { "@type": "Organization", name: "Gadvede Trekkers", url: `${SITE_ORIGIN}/` },
        blogPost: (posts || []).slice(0, 20).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_ORIGIN}/blog/${p.slug}`, datePublished: p.publishedAt || undefined })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: canonical },
      ] },
    ],
  }), [posts, canonical]);

  useSeo({
    title: "Trek Guides & Travel Blog | Gadvede Trekkers",
    description: "Trek guides, camping tips and travel stories from Gadvede Trekkers, Pune — routes, best season, what to carry and how to book.",
    canonical,
    image: absoluteUrl(DEFAULT_OG.path),
    imageAlt: DEFAULT_OG.alt,
    jsonLd,
    robots: posts && posts.length ? "index, follow" : "noindex, follow",
  });

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <nav className="blog-crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> <span aria-hidden="true">/</span> <span>Blog</span></nav>
          <h1>Trek guides &amp; travel stories</h1>
          <p>Routes, seasons, what to carry and how to book — from the Gadvede Trekkers team in Pune.</p>
        </div>
      </section>
      <div className="container blog-body">
        {posts === null && <div className="blog-grid">{[0, 1, 2].map((i) => <div key={i} className="blog-card blog-card--skeleton" />)}</div>}
        {posts && posts.length === 0 && (
          <div className="blog-empty">
            {failed ? "We couldn't load the blog right now." : "New trek guides are coming soon."}{" "}
            See our <Link to="/treks">treks</Link> or message us on <a href={whatsappHref("Hi Gadvede Trekkers! I'd like trek suggestions.")} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
          </div>
        )}
        {posts && posts.length > 0 && (
          <div className="blog-grid">
            {posts.map((p) => (
              <article key={p.slug} className="blog-card">
                {p.coverImageUrl && (
                  <Link to={`/blog/${p.slug}`} className="blog-card-img" tabIndex={-1} aria-hidden="true">
                    <img src={p.coverImageUrl} alt={p.coverImageAlt || ""} loading="lazy" width="640" height="400" />
                  </Link>
                )}
                <div className="blog-card-body">
                  <div className="blog-card-meta">{p.category}{p.publishedAt ? ` · ${fmt(p.publishedAt)}` : ""}</div>
                  <h2><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
                  <p>{p.excerpt || p.metaDescription}</p>
                  <Link to={`/blog/${p.slug}`} className="blog-more">Read guide →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
