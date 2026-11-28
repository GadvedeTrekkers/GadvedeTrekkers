import { describe, expect, it, vi } from "vitest";

const rowsByType = { trek: [{ id: "p1", slug: "test-trek", name: "TEST-Trek", product_type: "trek", base_price: 100 }], rental: [] };
let lastType = null;
vi.mock("../config/supabaseAdminClient.js", () => ({
  default: {
    from: () => {
      const q = {
        select: () => q,
        eq: (_c, v) => { lastType = v; return q; },
        order: () => q,
        then: (res) => res({ data: rowsByType[lastType] || [], error: null }),
      };
      return q;
    },
  },
}));

vi.mock("../config/supabasePublicClient.js", () => ({ default: { from: () => { const q = { select: () => q, eq: () => q, order: () => q, then: (res) => res({ data: [], error: null }) }; return q; } } }));

const mockRes = () => { const r = { _status: 200, status(c) { r._status = c; return r; }, json(b) { r._body = b; return r; } }; return r; };

describe("GET /api/products/admin/list needs ?storageKey= (the admin pages always send it)", () => {
  it("returns the items for a valid storageKey", async () => {
    const { getAdminProducts } = await import("../controllers/products.controller.js");
    const res = mockRes();
    await getAdminProducts({ query: { storageKey: "gt_treks" } }, res);
    expect(res._status).toBe(200);
    expect(res._body.data.map((p) => p.slug)).toEqual(["test-trek"]);
  });
  it("without storageKey answers 400 with a message that names the missing parameter", async () => {
    const { getAdminProducts } = await import("../controllers/products.controller.js");
    const res = mockRes();
    await getAdminProducts({ query: {} }, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/storageKey query parameter is required/);
  });
  it("an unknown storageKey is still rejected", async () => {
    const { getAdminProducts } = await import("../controllers/products.controller.js");
    const res = mockRes();
    await getAdminProducts({ query: { storageKey: "gt_nope" } }, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toBe("Invalid storage key");
  });
});
