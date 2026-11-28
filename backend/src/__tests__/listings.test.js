import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { listen } from "./support/fakeSupabase.js";

/* Tiny fake of the insert/update chain the listings controller uses. */
const rows = [];
let lastInsert = null;
let lastPatch = null;
const chain = (result) => ({ select: () => ({ single: async () => result() }) });
const reads = [];
const fake = {
  from: () => ({
    select: (cols) => { const q = { eq: (c, v) => { reads.push([c, v]); return q; }, order: async () => ({ data: [{ id: "L-9", submission_type: "property", title: "Live Villa", status: "LIVE", location: "Lonavala", submitted_at: "2026-11-01T00:00:00Z" }], error: null }), cols }; reads.cols = cols; return q; },
    insert: (payload) => { lastInsert = payload; const row = { id: "L-1", submitted_at: "2026-11-28T00:00:00Z", ...payload }; rows.push(row); return chain(() => ({ data: row, error: null })); },
    update: (patch) => { lastPatch = patch; return { eq: () => chain(() => ({ data: { id: "L-1", submission_type: "property", title: "x", ...patch }, error: null })) }; },
  }),
};
vi.mock("../config/supabaseAdminClient.js", () => ({ default: fake }));
vi.mock("../config/supabasePublicClient.js", () => ({ default: { from: () => { throw new Error("public (anon) client must not be used for listings"); } } }));

let srv;
beforeAll(async () => {
  process.env.JWT_SECRET = "listings-test-secret-0123456789abcdef";
  const { default: router } = await import("../routes/listings.routes.js");
  const app = express();
  app.use(express.json());
  app.use("/api/listings", router);
  srv = await listen(app);
});
afterAll(() => srv?.close());

const post = (p, body) => fetch(`${srv.url}/api/listings${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("public listing submission", () => {
  it("keeps only the allowed columns, forces PENDING and the type from the URL", async () => {
    const r = await post("/property", {
      title: "Lake Villa", contact_name: "Owner", phone: "9000000000", capacity: 8, amenities: ["wifi"],
      status: "LIVE", admin_notes: "approved", published_at: "2020-01-01", id: "forged", contact_phone: "not a column", submission_type: "event",
    });
    expect(r.status).toBe(201);
    expect(lastInsert).toMatchObject({ title: "Lake Villa", contact_name: "Owner", capacity: 8, amenities: ["wifi"], submission_type: "property", status: "PENDING" });
    for (const k of ["admin_notes", "published_at", "id", "contact_phone"]) expect(lastInsert).not.toHaveProperty(k);
  });
  it("rejects an unknown listing type", async () => {
    expect((await post("/bogus", { title: "x" })).status).toBe(400);
  });
  it("admin update route requires the admin token", async () => {
    const r = await fetch(`${srv.url}/api/listings/admin/L-1`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "LIVE" }) });
    expect(r.status).toBe(401);
  });
});

describe("public listings read", () => {
  it("uses the backend client, only LIVE rows of the requested type, and no contact columns", async () => {
    const r = await fetch(`${srv.url}/api/listings/public/property`);
    expect(r.status).toBe(200);
    expect((await r.json()).data[0]).toMatchObject({ id: "L-9", propertyName: "Live Villa" });
    expect(reads).toEqual(expect.arrayContaining([["submission_type", "property"], ["status", "LIVE"]]));
    expect(reads.cols).not.toMatch(/phone|email|admin_notes|contact_name/);
  });
});

describe("listing_submissions migrations cover every column the backend and forms use", () => {
  const dir = path.resolve(import.meta.dirname, "../../../supabase/migrations");
  const sql = ["009_admin_config.sql", "024_listing_submissions_columns.sql"].map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  it("has submission_type, contact_name and every field the public form posts", async () => {
    const { PUBLIC_LISTING_FIELDS, ADMIN_LISTING_FIELDS } = await import("../controllers/listings.controller.js");
    const needed = new Set([...ADMIN_LISTING_FIELDS, "submission_type", "reviewed_at", "published_at", "status", "id"]);
    const missing = [...needed].filter((c) => !new RegExp(`\\b${c}\\b`).test(sql));
    expect(missing).toEqual([]);
    expect(PUBLIC_LISTING_FIELDS).toContain("contact_name");
  });
  it("migration 024 only adds things (no drop / delete / truncate / rename)", () => {
    const m = fs.readFileSync(path.join(dir, "024_listing_submissions_columns.sql"), "utf8").replace(/--.*$/gm, "");
    expect(m).not.toMatch(/\b(drop|delete|truncate|rename)\b/i);
  });
});
