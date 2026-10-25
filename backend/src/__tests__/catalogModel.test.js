import { describe, expect, it, vi } from "vitest";
import {
  buildBatchRows,
  productItemFromRow,
  productRowFromItem,
} from "../utils/productMapper.js";
import { inferHubSlug, toPublicTripCard } from "../../../shared/catalogHubs.js";

const trip = {
  name: "Lohagad Dawn Ridge",
  slug: "lohagad-dawn-ridge",
  hubSlug: "pune-weekend",
  destination: "Lonavala, Maharashtra",
  category: "Pune Weekend",
  region: "pune",
  location: "Lonavala, Maharashtra",
  difficulty: "Easy",
  duration: "1 Day",
  price: 899,
  image: "https://example.com/lohagad.jpg",
  imageGallery: JSON.stringify(["https://example.com/lohagad.jpg"]),
  active: true,
  trekDateBatches: JSON.stringify([
    {
      date: "2026-11-07",
      endDate: "2026-11-07",
      label: "Pune sunrise batch",
      departureCity: "Pune",
      price: 899,
      status: "OPEN",
    },
  ]),
};

describe("catalog trip mapping", () => {
  it("writes hub, destination, category, and media onto the product row", () => {
    const row = productRowFromItem("gt_treks", trip);

    expect(row.slug).toBe("lohagad-dawn-ridge");
    expect(row.hub_slug).toBe("pune-weekend");
    expect(row.destination).toBe("Lonavala, Maharashtra");
    expect(row.category).toBe("Pune Weekend");
    expect(row.media).toEqual([
      { url: "https://example.com/lohagad.jpg", alt: "Lohagad Dawn Ridge", kind: "image" },
    ]);
    expect(row.extra_content.rawItem.hubSlug).toBe("pune-weekend");
  });

  it("writes batch dates, departure city, and end date", () => {
    const [batch] = buildBatchRows("product-1", trip);

    expect(batch).toMatchObject({
      product_id: "product-1",
      batch_date: "2026-11-07",
      end_date: "2026-11-07",
      departure_city: "Pune",
      batch_label: "Pune sunrise batch",
      price: 899,
      status: "OPEN",
    });
  });

  it("round-trips a saved row into a public trip card", () => {
    const row = productRowFromItem("gt_treks", trip);
    const item = productItemFromRow({ ...row, id: "product-1", gallery: row.gallery });
    item.trekDateBatches = JSON.stringify(
      buildBatchRows("product-1", trip).map((batch) => ({
        date: batch.batch_date,
        endDate: batch.end_date,
        label: batch.batch_label,
        departureCity: batch.departure_city,
        price: batch.price,
        status: batch.status,
      }))
    );

    const card = toPublicTripCard(item);

    expect(card).toMatchObject({
      slug: "lohagad-dawn-ridge",
      hubSlug: "pune-weekend",
      hubName: "Pune Weekend",
      destination: "Lonavala, Maharashtra",
      category: "Pune Weekend",
      productType: "trek",
      price: 899,
    });
    expect(card.nextBatch).toMatchObject({
      date: "2026-11-07",
      departureCity: "Pune",
      label: "Pune sunrise batch",
    });
  });

  it("infers a hub for older listings that have no hub slug", () => {
    expect(inferHubSlug({ productType: "trek", region: "pune", location: "Khed" })).toBe("pune-weekend");
    expect(inferHubSlug({ productType: "camping", location: "Pawna" })).toBe("camping");
    expect(inferHubSlug({ productType: "tour", region: "kerala" })).toBe("kerala-south");
    expect(inferHubSlug({ hubSlug: "seasonal-nye", region: "pune" })).toBe("seasonal-nye");
  });

  it("keeps a normal cover URL and drops inline image blobs from the public card", () => {
    const blob = `data:image/jpeg;base64,${"A".repeat(5000)}`;
    const card = toPublicTripCard({
      ...trip,
      id: "b2100000-0000-0000-0000-000000000001",
      image: blob,
      media: [
        { url: blob, alt: "Lohagad Dawn Ridge", kind: "image" },
        { url: "https://example.com/lohagad.jpg", alt: "Lohagad Dawn Ridge", kind: "image" },
      ],
    });

    expect(card.id).toBe("b2100000-0000-0000-0000-000000000001");
    expect(card.image).toBe("https://example.com/lohagad.jpg");
    expect(card.media).toEqual([
      { url: "https://example.com/lohagad.jpg", alt: "Lohagad Dawn Ridge", kind: "image" },
    ]);
    expect(JSON.stringify(card)).not.toContain("data:image");
    expect(JSON.stringify(card).length).toBeLessThan(2000);
  });
});

describe("admin upsert accepts a trip and its batch", () => {
  it("rejects an unknown hub and persists a known one", async () => {
    vi.resetModules();
    const single = vi.fn();
    const batchInsert = vi.fn().mockResolvedValue({ error: null });
    const batchDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const departureDeleteEq = vi.fn().mockResolvedValue({ error: null });

    vi.doMock("../config/supabaseAdminClient.js", () => ({
      default: {
        from: (table) => {
          if (table === "products") {
            return {
              upsert: () => ({
                select: () => ({
                  single,
                }),
              }),
            };
          }
          if (table === "product_batches") {
            return { delete: () => ({ eq: batchDeleteEq }), insert: batchInsert };
          }
          return { delete: () => ({ eq: departureDeleteEq }), insert: vi.fn() };
        },
      },
    }));

    vi.doMock("../config/supabasePublicClient.js", () => ({
      default: {
        from: (table) => {
          if (table === "product_batches") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({
                    data: [{
                      id: "batch-1",
                      batch_date: "2026-11-07",
                      end_date: "2026-11-07",
                      batch_label: "Pune sunrise batch",
                      departure_city: "Pune",
                      status: "OPEN",
                      price: 899,
                    }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
        },
      },
    }));

    const { upsertAdminProduct } = await import("../controllers/products.controller.js");

    const badRes = mockRes();
    await upsertAdminProduct(
      { body: { storageKey: "gt_treks", item: { ...trip, hubSlug: "not-a-hub" } } },
      badRes
    );
    expect(badRes._status).toBe(400);

    single.mockResolvedValue({
      data: {
        ...productRowFromItem("gt_treks", trip),
        id: "product-1",
      },
      error: null,
    });

    const okRes = mockRes();
    await upsertAdminProduct({ body: { storageKey: "gt_treks", item: trip } }, okRes);

    expect(okRes._status).toBe(200);
    expect(okRes._body.success).toBe(true);
    expect(okRes._body.data.hubSlug).toBe("pune-weekend");
    expect(JSON.parse(okRes._body.data.trekDateBatches)[0]).toMatchObject({
      date: "2026-11-07",
      departureCity: "Pune",
    });
    expect(batchDeleteEq).toHaveBeenCalledWith("product_id", "product-1");
    expect(batchInsert).toHaveBeenCalled();
    const inserted = batchInsert.mock.calls[0][0];
    expect(inserted[0].departure_city).toBe("Pune");
  });
});

describe("GET /api/catalog/trips", () => {
  const lohagad = {
    id: "b2100000-0000-0000-0000-000000000001",
    slug: "lohagad-dawn-ridge",
    name: "Lohagad Dawn Ridge",
    product_type: "trek",
    region: "pune",
    location: "Lonavala, Maharashtra",
    hub_slug: "pune-weekend",
    destination: "Lonavala, Maharashtra",
    category: "Pune Weekend",
    difficulty: "Easy",
    duration_label: "1 Day",
    base_price: 899,
    primary_image_url: `data:image/jpeg;base64,${"B".repeat(8000)}`,
    sort_order: 41,
    created_at: "2026-01-01T00:00:00Z",
  };
  const matheran = {
    id: "b2100000-0000-0000-0000-000000000002",
    slug: "matheran-forest-walk",
    name: "Matheran Forest Walk",
    product_type: "trek",
    region: "mumbai",
    location: "Matheran, Maharashtra",
    hub_slug: "mumbai-weekend",
    destination: "Matheran, Maharashtra",
    category: "Mumbai Weekend",
    difficulty: "Easy",
    duration_label: "1 Day",
    base_price: 999,
    primary_image_url: "https://example.com/matheran.jpg",
    sort_order: 42,
    created_at: "2026-01-02T00:00:00Z",
  };
  const batches = [
    {
      product_id: lohagad.id,
      batch_date: "2026-11-07",
      end_date: "2026-11-07",
      batch_label: "Pune sunrise batch",
      departure_city: "Pune",
      status: "OPEN",
      price: 899,
    },
  ];

  async function loadTrips(query, { timeoutOnImage = false, productRows = [lohagad, matheran] } = {}) {
    vi.resetModules();
    const calls = [];

    function builder(table) {
      let selected = "";
      const api = {
        select(value) {
          selected = value;
          calls.push({ table, op: "select", value });
          return api;
        },
        eq(column, value) {
          calls.push({ table, op: "eq", column, value });
          return api;
        },
        in(column, value) {
          calls.push({ table, op: "in", column, value });
          return api;
        },
        order() {
          return api;
        },
        then(onFulfilled, onRejected) {
          let result;
          if (table === "product_batches") {
            result = { data: batches, error: null };
          } else if (timeoutOnImage && selected.includes("primary_image_url")) {
            result = { data: null, error: { message: "canceling statement due to statement timeout" } };
          } else {
            result = { data: productRows, error: null };
          }
          return Promise.resolve(result).then(onFulfilled, onRejected);
        },
      };
      return api;
    }

    vi.doMock("../config/supabasePublicClient.js", () => ({
      default: { from: (table) => builder(table) },
    }));
    vi.doMock("../config/supabaseAdminClient.js", () => ({
      default: { from: () => ({}) },
    }));

    const { getCatalogTrips } = await import("../controllers/catalog.controller.js");
    const res = mockRes();
    await getCatalogTrips({ query }, res);
    return { res, calls };
  }

  it("returns lean trip cards and does not select gallery, media, or extra_content", async () => {
    const { res, calls } = await loadTrips({ hub: "pune-weekend" });
    const productSelect = calls.find((call) => call.table === "products" && call.op === "select")?.value || "";
    const selected = productSelect.split(",");

    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.data).toHaveLength(1);
    expect(res._body.data[0]).toMatchObject({
      id: "b2100000-0000-0000-0000-000000000001",
      slug: "lohagad-dawn-ridge",
      hubSlug: "pune-weekend",
      productType: "trek",
      price: 899,
      image: "",
    });
    expect(res._body.data[0].nextBatch).toMatchObject({
      date: "2026-11-07",
      departureCity: "Pune",
      label: "Pune sunrise batch",
    });
    expect(JSON.stringify(res._body)).not.toContain("data:image");
    expect(selected).not.toContain("*");
    expect(selected).not.toContain("gallery");
    expect(selected).not.toContain("media");
    expect(selected).not.toContain("extra_content");
    expect(selected).toContain("hub_slug");
    expect(selected).toContain("primary_image_url");
    expect(calls.some((call) => call.table === "products" && call.op === "in" && call.column === "product_type")).toBe(true);
  });

  it("keeps an https cover and still applies the type filter", async () => {
    const { res, calls } = await loadTrips({ type: "trek" });

    expect(res._status).toBe(200);
    expect(res._body.data.map((item) => item.slug)).toEqual([
      "lohagad-dawn-ridge",
      "matheran-forest-walk",
    ]);
    expect(res._body.data[1].image).toBe("https://example.com/matheran.jpg");
    expect(calls).toContainEqual({ table: "products", op: "eq", column: "product_type", value: "trek" });
  });

  it("retries without the cover column when that read hits statement_timeout", async () => {
    const { res, calls } = await loadTrips({}, { timeoutOnImage: true });
    const selects = calls.filter((call) => call.table === "products" && call.op === "select").map((call) => call.value);

    expect(selects).toHaveLength(2);
    expect(selects[0].split(",")).toContain("primary_image_url");
    expect(selects[1].split(",")).not.toContain("primary_image_url");
    expect(selects[1].split(",")).not.toContain("gallery");
    expect(res._status).toBe(200);
    expect(res._body.data.map((item) => item.id)).toContain("b2100000-0000-0000-0000-000000000001");
    expect(JSON.stringify(res._body)).not.toContain("data:image");
  });

  it("rejects an unknown hub before querying products", async () => {
    const { res, calls } = await loadTrips({ hub: "not-a-hub" });

    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

function mockRes() {
  return {
    _status: 200,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
}
