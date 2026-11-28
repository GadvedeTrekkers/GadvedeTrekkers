/**
 * Duplicate public URLs and the page that replaces them.
 * The SPA redirects these on the client (canonical → target, noindex), and both the sitemap
 * and the destination hubs skip them. Add a matching 301 in Render (Redirects/Rewrites) if wanted.
 */
export const SEO_REDIRECTS = {
  "/treks/pawna-lake-camping": "/camping/pawna-lake-camping-2026",
};

export const redirectTarget = (path) => SEO_REDIRECTS[String(path || "").replace(/\/+$/, "")] || null;
