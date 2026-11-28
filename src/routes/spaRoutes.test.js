import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { isSpaPath, spaRewriteSources } from "../../shared/spaRoutes.js";
import { buildRedirects, applyRenderRoutes } from "../../scripts/generate-host-config.mjs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

/** Concrete example URL for every static <Route path="..."> in AppRoutes.jsx. */
function appRoutePaths() {
  const src = read("src/routes/AppRoutes.jsx");
  const top = [];
  let inAdmin = false;
  for (const m of src.matchAll(/<Route\s+(?:key=\{[^}]+\}\s+)?path="([^"]+)"/g)) {
    const raw = m[1];
    if (raw === "*") continue;
    if (raw === "/admin/*") { inAdmin = true; top.push("/admin/dashboard"); continue; }
    if (inAdmin && !raw.startsWith("/")) { top.push(`/admin/${raw}`); continue; }
    top.push(raw.replace(/\/\*$/, "/x").replace(/:[A-Za-z]+/g, "some-slug"));
  }
  return top;
}

test("every static <Route> in AppRoutes.jsx is covered by the host allow-list", () => {
  const paths = appRoutePaths();
  assert.ok(paths.length > 60, "route scan found the routes");
  const missing = paths.filter((p) => !isSpaPath(p));
  assert.deepEqual(missing, [], `add these to shared/spaRoutes.js: ${missing.join(", ")}`);
});

test("hub and SEO-redirect routes are covered", () => {
  for (const p of ["/treks-near-pune", "/weekend-treks", "/rajasthan-tours", "/treks/pawna-lake-camping"]) {
    assert.ok(isSpaPath(p), p);
  }
});

test("unknown paths are NOT allow-listed (so the host answers 404)", () => {
  for (const p of ["/this-page-does-not-exist-xyz123", "/blogs", "/sitemap_index.xml", "/favicon.png", "/wp-login.php", "/admin-old"]) {
    assert.equal(isSpaPath(p), false, p);
  }
});

test("real product URLs stay allow-listed", () => {
  for (const p of ["/treks/vasota-fort-trek", "/tours/manali-kullu-kasol", "/camping/pawna-lake-camping-2026", "/blog/some-post", "/"]) {
    assert.ok(isSpaPath(p), p);
  }
});

test("public/_redirects and render.yaml are generated from the allow-list (no drift)", () => {
  assert.equal(read("public/_redirects"), buildRedirects());
  assert.equal(read("render.yaml"), applyRenderRoutes(read("render.yaml")));
});

test("no blanket SPA rewrite remains in any host file", () => {
  const redirects = read("public/_redirects");
  const lines = redirects.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  assert.match(lines.at(-1), /^\/\*\s+\/404\.html\s+404$/);
  assert.equal(lines.filter((l) => /^\/\*\s+\/index\.html/.test(l)).length, 0);

  const render = read("render.yaml");
  assert.doesNotMatch(render, /source:\s*\/\*\s*\n\s*destination:\s*\/index\.html/);
  const toml = read("netlify.toml");
  assert.doesNotMatch(toml, /from\s*=\s*"\/\*"\s*\n\s*to\s*=\s*"\/index\.html"/);
  assert.ok(spaRewriteSources().length > 40);
});

test("render.yaml sends HSTS (no includeSubDomains/preload) and frame/referrer headers", () => {
  const render = read("render.yaml");
  assert.match(render, /name: Strict-Transport-Security\s*\n\s*value: max-age=31536000\s*\n/);
  assert.doesNotMatch(render, /value:.*(includeSubDomains|preload)/);
  assert.match(render, /name: X-Frame-Options/);
});

test("404.html is a standalone noindex page without canonical or product JSON-LD", () => {
  const html = read("public/404.html");
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json|<script/i);
  assert.doesNotMatch(html, /(?:href|src)="(?!\/|https:\/\/wa\.me)/, "root-relative links only");
  assert.match(html, /919856112727/);
  assert.doesNotMatch(html, /Vasota|TouristTrip/);
});

test("favicon, icons and manifest are real, small files", () => {
  assert.ok(statSync(new URL("../../public/favicon.ico", import.meta.url)).size < 20_000);
  assert.ok(statSync(new URL("../../public/favicon-32x32.png", import.meta.url)).size < 5_000);
  const ico = readFileSync(new URL("../../public/favicon.ico", import.meta.url));
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0], "ICO header");
  const png = readFileSync(new URL("../../public/apple-touch-icon.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");

  const manifest = JSON.parse(read("public/manifest.json"));
  assert.equal(manifest.name, "Gadvede Trekkers");
  assert.equal(manifest.start_url, "https://www.gadvede.com/");
  assert.ok(manifest.icons.length >= 2);
  for (const icon of manifest.icons) {
    assert.ok(statSync(new URL(`../../public${icon.src}`, import.meta.url)).size > 0, icon.src);
  }

  const index = read("index.html");
  assert.match(index, /rel="icon"[^>]*href="\/favicon\.ico"/);
  assert.match(index, /rel="manifest"\s+href="\/manifest\.json"/);
  assert.doesNotMatch(index, /rel="(?:icon|shortcut icon|apple-touch-icon)"[^>]*gadvedelogo\.png/);
});

test("the duplicate Pawna URL is a real 301 on both hosts, not a rewrite", () => {
  const redirects = read("public/_redirects");
  const render = read("render.yaml");
  assert.match(redirects, /^\/treks\/pawna-lake-camping\s+\/camping\/pawna-lake-camping-2026\s+301$/m);
  assert.match(render, /type: redirect\n\s+source: \/treks\/pawna-lake-camping\n\s+destination: \/camping\/pawna-lake-camping-2026/);
  assert.doesNotMatch(redirects, /^\/treks\/pawna-lake-camping\s+\/index\.html/m);
});
