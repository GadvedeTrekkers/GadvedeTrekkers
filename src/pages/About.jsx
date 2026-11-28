import { useSeo } from "../seo/useSeo";
import { SITE_ORIGIN } from "../seo/publicSeo";

/* Placeholder until the About copy is approved (FIX-07). It must not look like a finished page in
   search results, so it carries its own title and is noindexed rather than reusing the homepage tags. */
function About() {
  useSeo({
    title: "About | Gadvede Trekkers",
    description: "About Gadvede Trekkers.",
    canonical: `${SITE_ORIGIN}/about`,
    robots: "noindex, follow",
  });
  return (
    <div className="container mt-5">
      <h1>About Page</h1>
    </div>
  );
}

export default About;
