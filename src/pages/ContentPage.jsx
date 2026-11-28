import { useSeo } from "../seo/useSeo";
import { SITE_ORIGIN } from "../seo/publicSeo";
import { useSiteData } from "../config/siteContent";
import { isFilled, sectionFor } from "../../shared/siteContent.js";
import NotFound from "./NotFound";

/**
 * About / FAQ / Terms / Privacy / Cancellation — the words come ONLY from Admin → Settings → Site Content (t129u).
 * Unpublished page → the 404 page (noindex). No built-in copy. Text is rendered as plain text (no HTML from the DB).
 */
const S = {
  wrap: { maxWidth: 860, margin: "0 auto", padding: "40px 20px 60px", lineHeight: 1.7, color: "#1f2d27" },
  h2: { fontSize: "1.2rem", marginTop: 28, color: "#103528" },
  q: { fontSize: "1.05rem", marginTop: 22, marginBottom: 6, color: "#103528", fontWeight: 700 },
  text: { whiteSpace: "pre-line" },
};

export default function ContentPage({ contentKey, path }) {
  const { loaded, content } = useSiteData();
  const page = isFilled(contentKey, content[contentKey]) ? content[contentKey] : null;
  const section = sectionFor(contentKey);
  const canonicalPath = path || section?.path || "/";

  useSeo(page
    ? { title: page.title, description: page.metaDescription || page.intro?.slice(0, 160) || page.title, canonical: `${SITE_ORIGIN}${canonicalPath}` }
    : { title: "Page not found", description: "This page could not be found.", canonical: null, robots: "noindex, nofollow" });

  if (!page) {
    if (!loaded) return <div className="container py-5 text-center text-muted" data-testid="content-loading">Loading…</div>;
    return <NotFound />;
  }

  return (
    <main style={S.wrap} data-testid={`content-page-${contentKey}`}>
      <h1>{page.title}</h1>
      {page.intro && <p style={S.text}>{page.intro}</p>}
      {Array.isArray(page.sections) && page.sections.map((s, i) => (
        <section key={i}>
          <h2 style={S.h2}>{s.heading}</h2>
          <p style={S.text}>{s.body}</p>
        </section>
      ))}
      {Array.isArray(page.items) && page.items.map((it, i) => (
        <section key={i}>
          <h2 style={S.q}>{it.question}</h2>
          <p style={S.text}>{it.answer}</p>
        </section>
      ))}
    </main>
  );
}
