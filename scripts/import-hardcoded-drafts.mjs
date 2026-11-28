#!/usr/bin/env node
/**
 * One-time helper (Pratik t129u): re-create the listings that used to be hard-coded in the site code as
 * UNPUBLISHED drafts in the admin (active = false), so nothing is lost and nothing goes live by itself.
 *
 *   node scripts/import-hardcoded-drafts.mjs --from <export-dir>            # DRY RUN (default): prints the plan, writes nothing
 *   node scripts/import-hardcoded-drafts.mjs --from <export-dir> --apply \
 *        --i-have-pratiks-ok                                               # writes, ONLY with Pratik's own OK
 *
 * Rules built in:
 *  - Never runs on its own (not wired into build, start, postinstall or CI).
 *  - Every item is saved with active = false (a draft). Publish each one yourself in Admin → Listings after checking it.
 *  - A slug that already exists in the database (published OR unpublished) is SKIPPED, never overwritten.
 *  - Never deletes anything. Never sends trip dates (old dates are stale), ratings or review counts (unverified claims).
 *  - --apply needs GT_API_BASE (backend URL) and GT_ADMIN_TOKEN (an admin login token) in the environment.
 *    The token is read from the environment only; it is never printed or written anywhere.
 *  - Uses the normal admin endpoint (POST /api/products/admin/upsert), so the same validation applies.
 * Not "Re-import Seed Data": that admin button is not used and must not be used.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const FROM = opt("--from");
const APPLY = flag("--apply");
const OK = flag("--i-have-pratiks-ok");
const ONLY = (opt("--only") || "").split(",").filter(Boolean); // e.g. --only treks,tours

if (!FROM || !fs.existsSync(FROM)) {
  console.error("Usage: node scripts/import-hardcoded-drafts.mjs --from <hardcoded-content-export dir> [--only treks,tours,...] [--apply --i-have-pratiks-ok]");
  process.exit(2);
}
if (APPLY && !OK) {
  console.error("Refusing to write: --apply also needs --i-have-pratiks-ok (Pratik's own approval).");
  process.exit(2);
}

const load = (file, key) => {
  const p = path.join(FROM, `${file}.json`);
  if (!fs.existsSync(p)) return [];
  const v = JSON.parse(fs.readFileSync(p, "utf8"))?.exports?.[key];
  return Array.isArray(v) ? v : [];
};
const slugify = (s) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const lines = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.text || x?.title || x?.name || "")).filter(Boolean).join("\n") : String(v ?? ""));
const usableImage = (u) => (typeof u === "string" && /^https:\/\//.test(u) ? u : ""); // bundled /src/assets images must be re-uploaded

function draft(base, extra = {}) {
  const image = usableImage(base.image);
  const gallery = (Array.isArray(base.gallery) ? base.gallery : []).map(usableImage).filter(Boolean);
  const item = {
    slug: base.slug || slugify(base.name || base.title),
    name: base.name || base.title || "",
    subtitle: base.subtitle || base.shortName || "",
    location: base.location || "",
    duration: base.duration || "",
    difficulty: base.difficulty || "",
    altitude: base.altitude || "",
    category: base.category || "",
    price: base.price ?? "",
    originalPrice: base.originalPrice ?? "",
    image,
    imageGallery: JSON.stringify(gallery.length ? gallery : image ? [image] : []),
    description: base.description || "",
    highlights: lines(base.highlights),
    ...extra,
    rating: "",
    reviews: "",
    active: false, // DRAFT — never published by this script
    sortOrder: 999,
    importNote: "Re-created from the old hard-coded site data (t129u). Check every field and photo before publishing.",
  };
  return item;
}

const SOURCES = {
  treks: { storageKey: "gt_treks", items: () => load("treks", "uniqueTreks").map((t) => draft(t, { trekDateBatches: "[]", departurePlans: "{}" })) },
  tours: { storageKey: "gt_tours", items: () => load("tours", "toursList").map((t) => draft(t, { region: t.region || "" })) },
  camping: { storageKey: "gt_camping", items: () => load("camping-details", "CAMPING_SEED_DATA").map((c) => draft(c, {
    shortName: c.shortName || "", overview: c.overview || "", howToReach: c.howToReach || "", itinerary: c.itinerary || "",
    included: lines(c.included), notIncluded: lines(c.notIncluded), thingsToCarry: lines(c.thingsToCarry),
    faqs: c.faqs || "", cancellationPolicy: c.cancellationPolicy || "", rules: c.rules || "", badge: c.badge || "",
  })) },
  rentals: { storageKey: "gt_rentals", items: () => load("rentals", "rentalsList").map((r) => draft(r)) },
  heritage: { storageKey: "gt_heritage", items: () => load("heritage", "heritageList").map((h) => draft(h, { type: h.type || "" })) },
  industrial: { storageKey: "gt_iv", items: () => load("industrial-visits", "ivDestinations").map((d) => draft({ ...d, slug: d.id, name: d.title, image: (d.images || [])[0]?.src }, {
    icon: d.icon || "", bestFor: d.bestFor || "", industries: lines(d.industries),
    included: lines(d.includes), notIncluded: lines(d.excludes),
    itinerary: typeof d.itinerary === "string" ? d.itinerary : JSON.stringify(d.itinerary || []),
  })) },
};

async function existingSlugs() {
  const base = (process.env.GT_API_BASE || "").replace(/\/$/, "");
  const token = process.env.GT_ADMIN_TOKEN || "";
  if (!base) return { slugs: null, note: "GT_API_BASE not set: cannot check which slugs already exist (dry run only)." };
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const url = token ? `${base}/api/products/admin/list` : `${base}/api/products`;
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`Could not list existing products (${r.status})`);
  const j = await r.json();
  const rows = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
  return { slugs: new Set(rows.map((p) => p.slug).filter(Boolean)), note: token ? "checked against ALL products (admin list)" : "checked against PUBLISHED products only (no admin token) — unpublished ones are not visible" };
}

const { slugs, note } = await existingSlugs().catch((e) => ({ slugs: null, note: e.message }));
console.log(`Mode: ${APPLY ? "APPLY (writes drafts)" : "DRY RUN (writes nothing)"}; existing-slug check: ${note}`);
if (APPLY && (!slugs || !process.env.GT_ADMIN_TOKEN)) {
  console.error("Refusing to write: need GT_API_BASE and GT_ADMIN_TOKEN so existing listings can be checked and skipped.");
  process.exit(2);
}

let planned = 0; let skipped = 0; let written = 0; let failed = 0;
for (const [name, src] of Object.entries(SOURCES)) {
  if (ONLY.length && !ONLY.includes(name)) continue;
  const seen = new Set();
  for (const item of src.items()) {
    if (!item.slug || !item.name || seen.has(item.slug)) continue;
    seen.add(item.slug);
    if (slugs?.has(item.slug)) { skipped += 1; console.log(`  skip  ${name.padEnd(10)} ${item.slug} (already in the database — left untouched)`); continue; }
    planned += 1;
    if (!APPLY) { console.log(`  draft ${name.padEnd(10)} ${item.slug}${item.image ? "" : "  [no usable photo — upload one in admin]"}`); continue; }
    const r = await fetch(`${process.env.GT_API_BASE.replace(/\/$/, "")}/api/products/admin/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GT_ADMIN_TOKEN}` },
      body: JSON.stringify({ storageKey: src.storageKey, item }),
    });
    if (r.ok) { written += 1; console.log(`  saved ${name.padEnd(10)} ${item.slug} (unpublished)`); } else { failed += 1; console.log(`  FAIL  ${name.padEnd(10)} ${item.slug} (${r.status})`); }
  }
}
console.log(`\nPlanned drafts: ${planned}; skipped (already exist): ${skipped}${APPLY ? `; saved: ${written}; failed: ${failed}` : ""}`);
if (!APPLY) console.log("Nothing was written. Re-run with --apply --i-have-pratiks-ok only after Pratik approves.");
