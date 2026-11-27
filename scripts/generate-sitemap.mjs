/**
 * Writes dist/sitemap.xml from every live product in the public API (runs after `vite build`).
 * - trek -> /treks/:slug, tour -> /tours/:slug, camping -> /camping/:slug (other types have no detail page).
 * - Products whose SEO canonical points elsewhere (rawItem.seo.canonicalPath) or that redirect
 *   (shared/seoRedirects.js) are left out.
 * - lastmod = build date (the public API does not expose updated_at). Rebuilds on every deploy.
 * - Destination hubs (/treks-near-pune, ...) are included only when they have >= 2 live trips (others are noindexed).
 * - /villas is included while at least one villa is active.
 * - Blog posts: there is no public blog route yet (blogs live only in admin), so none are listed.
 * If the API cannot be reached, the static public/sitemap.xml already copied into dist/ is kept and the build continues.
 */
import { writeFileSync, existsSync } from "node:fs";
import { DESTINATION_HUBS, hubTrips, hubIsIndexable } from "../shared/destinationHubs.js";
import { redirectTarget } from "../shared/seoRedirects.js";

const SITE = "https://www.gadvede.com";
const API = (process.env.VITE_API_BASE_URL || "https://gadvede-backend.onrender.com").replace(/\/+$/, "");
const OUT = new URL("../dist/sitemap.xml", import.meta.url);
const SECTION = { trek: "treks", tour: "tours", camping: "camping" };
const HUBS = [
  ["/", "1.0"],
  ["/treks", "0.9"],
  ["/tours", "0.9"],
  ["/camping", "0.9"],
  ["/trips", "0.8"],
  ["/contact", "0.5"],
];

async function fetchProducts() {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(`${API}/api/products`, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const items = Array.isArray(body) ? body : body?.data;
      if (!Array.isArray(items) || items.length === 0) throw new Error("empty product list");
      return items;
    } catch (error) {
      lastError = error;
      console.warn(`[sitemap] attempt ${attempt} failed: ${error.message}`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
  }
  throw lastError;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

try {
  const items = await fetchProducts();
  const today = new Date().toISOString().slice(0, 10);
  const urls = new Map(HUBS.map(([path, priority]) => [path, priority]));
  for (const item of items) {
    if (item?.active === false || !item?.slug) continue;
    const section = SECTION[item.productType];
    if (!section) continue;
    const canonicalPath = item?.seo?.canonicalPath;
    const path = `/${section}/${item.slug}`;
    if (canonicalPath && canonicalPath !== path) continue;
    if (redirectTarget(path)) continue;
    urls.set(path, "0.8");
  }
  if (items.some((item) => item?.active !== false && item?.productType === "villa")) urls.set("/villas", "0.7");
  const hubLog = [];
  for (const hub of DESTINATION_HUBS) {
    const trips = hubTrips(hub, items);
    hubLog.push(`${hub.slug}=${trips.length}`);
    if (hubIsIndexable(trips)) urls.set(hub.path, "0.9");
  }
  console.log(`[sitemap] hubs: ${hubLog.join(", ")}`);
  const body = [...urls.entries()]
    .map(
      ([path, priority]) =>
        `  <url>\n    <loc>${esc(SITE + path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join("\n");
  writeFileSync(OUT, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  console.log(`[sitemap] wrote ${urls.size} URLs to dist/sitemap.xml`);
} catch (error) {
  console.warn(`[sitemap] API unavailable (${error.message}); keeping static sitemap${existsSync(OUT) ? "" : " (none found)"}`);
}
