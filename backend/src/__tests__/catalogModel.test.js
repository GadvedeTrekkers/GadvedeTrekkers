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
