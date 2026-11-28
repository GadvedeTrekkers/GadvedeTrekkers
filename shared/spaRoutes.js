/**
 * Allow-list of URLs that the single-page app (src/routes/AppRoutes.jsx) answers.
 *
 * Why: a blanket "every missing path -> /index.html (200)" rule makes unknown URLs return
 * HTTP 200 with the home page (soft 404). Hosts must instead rewrite ONLY these paths to
 * /index.html and answer everything else with the static /404.html and status 404.
 *
 * Used by scripts/generate-host-config.mjs, which writes public/_redirects (Netlify) and the
 * render.yaml `routes:` block, and by src/routes/spaRoutes.test.js, which fails if a new <Route>
 * is added to AppRoutes.jsx without being listed here (or the host files drift).
 *
 * Product slugs under /treks/*, /tours/*, /camping/*, ... come from the live API, so the host
 * cannot tell a valid slug from a made-up one; those pages show the in-app 404 (noindex).
 */
import { DESTINATION_HUBS } from "./destinationHubs.js";
import { SEO_REDIRECTS } from "./seoRedirects.js";

/** Exact paths. */
export const SPA_EXACT_PATHS = [
  "/about",
  "/faq",            // content pages (Admin → Site Content); unpublished = in-app noindex 404
  "/terms",
  "/contact",
  "/book",
  "/booking/success",
  "/register",
  "/payment-registration",
  "/employee-login",
  "/vendor-register",
  "/partner",
  "/list-property",
  "/list-campsite",
  "/list-event",
  "/feedback",
  "/ticket",
  "/qa/weekend-trips",
  "/cancellation-policy",
  "/privacy",
  "/privacy-policy",
  "/villas",
  "/industrial-visits",
];

/** Sections that have a list page and sub-pages: both `/x` and `/x/*` are SPA routes. */
export const SPA_SECTIONS = [
  "trips",
  "treks",
  "tours",
  "heritage",
  "camping",
  "rentals",
  "blog",
  "corporate",
  "admin",
  "employee",
  "leader-training",
];

/** Every source path that must be rewritten to /index.html (deterministic order, no duplicates). */
export function spaRewriteSources() {
  const out = [];
  const add = (p) => { if (p && p !== "/" && !out.includes(p)) out.push(p); };
  SPA_EXACT_PATHS.forEach(add);
  SPA_SECTIONS.forEach((s) => { add(`/${s}`); add(`/${s}/*`); });
  DESTINATION_HUBS.forEach((hub) => add(hub.path));
  // SEO_REDIRECTS sources are real 301s on the host (see scripts/generate-host-config.mjs), not rewrites.
  return out;
}

/** Does `pathname` (e.g. "/treks/vasota-fort-trek") fall under an allow-listed source? */
export function isSpaPath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === "/") return true;
  return spaRewriteSources().some((src) =>
    src.endsWith("/*") ? path.startsWith(src.slice(0, -1)) : path === src
  );
}
