import supabasePublic from "../config/supabasePublicClient.js";
import supabaseAdmin from "../config/supabaseAdminClient.js";
import {
  batchItemFromRow,
  buildBatchRows,
  buildDepartureRows,
  productItemFromRow,
  productRowFromItem,
  productTypeFromStorageKey,
  slugify,
} from "../utils/productMapper.js";
import { inferHubSlug, isCatalogHubSlug, publicCardImage } from "../../../shared/catalogHubs.js";

const PRODUCT_OPTIONAL_COLUMNS = ["hub_slug", "destination", "category", "media"];
const BATCH_OPTIONAL_COLUMNS = ["end_date", "departure_city"];

function isMissingColumnError(error) {
  const message = String(error?.message || "");
  return /column .* does not exist/i.test(message) || /schema cache/i.test(message);
}

function withoutColumns(row, columns) {
  const next = { ...row };
  columns.forEach((column) => {
    delete next[column];
  });
  return next;
}

async function upsertProductRow(row) {
  const attempt = (payload) =>
    supabaseAdmin.from("products").upsert(payload, { onConflict: "slug" }).select("*").single();

  let result = await attempt(row);
  if (result.error && isMissingColumnError(result.error)) {
    result = await attempt(withoutColumns(row, PRODUCT_OPTIONAL_COLUMNS));
  }
  return result;
}

async function insertBatchRows(rows) {
  let result = await supabaseAdmin.from("product_batches").insert(rows);
  if (result.error && isMissingColumnError(result.error)) {
    result = await supabaseAdmin
      .from("product_batches")
      .insert(rows.map((row) => withoutColumns(row, BATCH_OPTIONAL_COLUMNS)));
  }
  if (result.error) {
    console.error("upsertAdminProduct: batch insert failed", result.error);
  }
  return result;
}

async function enrichProduct(productRow) {
  const item = productItemFromRow(productRow);

  const batchQuery = supabasePublic
    .from("product_batches")
    .select("*")
    .eq("product_id", productRow.id)
    .order("batch_date", { ascending: true });

  const departureQuery =
    productRow.product_type === "trek"
      ? supabasePublic
          .from("product_departure_plans")
          .select("departure_origin, price, pickup_points, itinerary_text")
          .eq("product_id", productRow.id)
      : Promise.resolve({ data: [] });

  const [{ data: batches }, { data: departures }] = await Promise.all([batchQuery, departureQuery]);
  const batchJson = JSON.stringify((batches || []).map(batchItemFromRow));

  return {
    ...item,
    trekDateBatches: batchJson,
    ...(productRow.product_type === "tour" ? { tourDateBatches: batchJson } : {}),
    departurePlans: JSON.stringify(
      Object.fromEntries(
        (departures || []).map((entry) => [
          entry.departure_origin,
          {
            price: entry.price ?? 0,
            pickupPoints: entry.pickup_points || [],
            itinerary: entry.itinerary_text || "",
          },
        ])
      )
    ),
  };
}

export async function listActiveProducts({ type, hub } = {}) {
  let query = supabasePublic
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (type) query = query.eq("product_type", type);

  const { data, error } = await query;
  if (error) return { error };

  let items = await Promise.all((data || []).map(enrichProduct));
  if (hub) {
    items = items.filter((item) => inferHubSlug(item) === hub);
  }
  return { data: items };
}

const TRIP_PRODUCT_TYPES = ["trek", "tour", "camping"];

// Scalar columns only. gallery, media, and extra_content store inline
// data-URL images (and extra_content copies the whole admin form). Selecting
// them makes Postgres cancel the list with statement_timeout.
const CATALOG_TRIP_COLUMNS = [
  "id",
  "slug",
  "name",
  "product_type",
  "region",
  "location",
  "hub_slug",
  "destination",
  "category",
  "difficulty",
  "duration_label",
  "base_price",
  "sort_order",
  "created_at",
];

const CATALOG_TRIP_OPTIONAL_COLUMNS = ["hub_slug", "destination", "category", "difficulty"];
const CATALOG_TRIP_IMAGE_COLUMN = "primary_image_url";

const CATALOG_BATCH_COLUMNS = [
  "product_id",
  "batch_date",
  "end_date",
  "batch_label",
  "status",
  "departure_city",
  "price",
];

const CATALOG_BATCH_REQUIRED_COLUMNS = ["product_id", "batch_date"];

function isStatementTimeout(error) {
  return /statement timeout/i.test(String(error?.message || ""));
}

function withoutNamedColumns(columns, names) {
  const drop = new Set(names);
  return columns.filter((column) => !drop.has(column));
}

function queryActiveProducts(type, columns) {
  let query = supabasePublic
    .from("products")
    .select(columns.join(","))
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (type) query = query.eq("product_type", type);
  else query = query.in("product_type", TRIP_PRODUCT_TYPES);

  return query;
}

async function loadCatalogProductRows(type) {
  let columns = [...CATALOG_TRIP_COLUMNS, CATALOG_TRIP_IMAGE_COLUMN];
  let droppedImage = false;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await queryActiveProducts(type, columns);
    if (!result.error) return { data: result.data || [] };

    const message = String(result.error.message || "");
    if (!droppedImage && isStatementTimeout(result.error) && columns.includes(CATALOG_TRIP_IMAGE_COLUMN)) {
      droppedImage = true;
      columns = withoutNamedColumns(columns, [CATALOG_TRIP_IMAGE_COLUMN]);
      continue;
    }

    if (isMissingColumnError(result.error)) {
      const named = CATALOG_TRIP_OPTIONAL_COLUMNS.filter((column) => message.includes(column));
      const next = withoutNamedColumns(columns, named.length ? named : CATALOG_TRIP_OPTIONAL_COLUMNS);
      if (next.join(",") !== columns.join(",")) {
        columns = next;
        continue;
      }
    }

    return { error: result.error };
  }

  return { error: { message: "Could not load catalog trips" } };
}

function queryBatches(productIds, columns) {
  return supabasePublic
    .from("product_batches")
    .select(columns.join(","))
    .in("product_id", productIds)
    .order("batch_date", { ascending: true });
}

async function loadCatalogBatches(productIds) {
  if (!productIds.length) return [];

  // price/available are not on every production product_batches table.
  // Drop whichever optional column PostgREST says is missing and retry,
  // instead of returning trips with no dates.
  let columns = [...CATALOG_BATCH_COLUMNS];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await queryBatches(productIds, columns);
    if (!result.error) return result.data || [];
    if (!isMissingColumnError(result.error)) {
      console.error("listCatalogTripItems: batch lookup failed", result.error.message);
      return [];
    }

    const message = String(result.error.message || "");
    const named = columns.filter(
      (column) => !CATALOG_BATCH_REQUIRED_COLUMNS.includes(column) && message.includes(column)
    );
    const next = named.length
      ? withoutNamedColumns(columns, named)
      : columns.filter((column) => CATALOG_BATCH_REQUIRED_COLUMNS.includes(column) || column === "batch_label" || column === "status");
    if (next.join(",") === columns.join(",")) {
      console.error("listCatalogTripItems: batch lookup failed", result.error.message);
      return [];
    }
    columns = next;
  }

  return [];
}

export function catalogItemFromLeanRow(row, batches = []) {
  const batchJson = JSON.stringify((batches || []).map(batchItemFromRow));
  const image = publicCardImage(row.primary_image_url);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    productType: row.product_type,
    location: row.location || "",
    region: row.region || "",
    hubSlug: row.hub_slug || "",
    destination: row.destination || row.location || "",
    category: row.category || "",
    difficulty: row.difficulty || "",
    duration: row.duration_label || "",
    price: row.base_price ?? null,
    image,
    media: image ? [{ url: image, alt: row.name || "", kind: "image" }] : [],
    trekDateBatches: batchJson,
    ...(row.product_type === "tour" ? { tourDateBatches: batchJson } : {}),
  };
}

export async function listCatalogTripItems({ type, hub } = {}) {
  const products = await loadCatalogProductRows(type);
  if (products.error) return { error: products.error };

  const rows = products.data || [];
  const batches = await loadCatalogBatches(rows.map((row) => row.id).filter(Boolean));
  const batchesByProduct = new Map();
  for (const batch of batches) {
    const list = batchesByProduct.get(batch.product_id) || [];
    list.push(batch);
    batchesByProduct.set(batch.product_id, list);
  }

  let items = rows.map((row) => catalogItemFromLeanRow(row, batchesByProduct.get(row.id) || []));
  if (hub) {
    items = items.filter((item) => inferHubSlug(item) === hub);
  }
  return { data: items };
}

export async function getAllProducts(req, res) {
  const { type, hub } = req.query;

  if (hub && !isCatalogHubSlug(hub)) {
    return res.status(400).json({ success: false, error: "Unknown catalog hub" });
  }

  const { data, error } = await listActiveProducts({ type, hub });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data });
}

export async function getProductBySlug(req, res) {
  const { slug } = req.params;

  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }

  return res.json({ success: true, data: await enrichProduct(data) });
}

export async function getAdminProducts(req, res) {
  const { storageKey } = req.query;
  const productType = productTypeFromStorageKey(storageKey);

  if (!productType) {
    return res.status(400).json({ success: false, error: "Invalid storage key" });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("product_type", productType)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({
    success: true,
    data: await Promise.all((data || []).map(enrichProduct)),
  });
}

export async function upsertAdminProduct(req, res) {
  try {
    const { storageKey, item } = req.body;
    console.log("upsertAdminProduct: Received request", { storageKey, itemId: item?.id, itemName: item?.name || item?.title });
    
    const productRow = productRowFromItem(storageKey, item);

    if (!productRow) {
      console.error("upsertAdminProduct: Invalid product payload");
      return res.status(400).json({ success: false, error: "Invalid product payload" });
    }

    if (productRow.hub_slug && !isCatalogHubSlug(productRow.hub_slug)) {
      return res.status(400).json({ success: false, error: "Unknown catalog hub" });
    }

    console.log("upsertAdminProduct: Upserting to Supabase", { slug: productRow.slug });

    const saved = await upsertProductRow(productRow);

    if (saved.error) {
      console.error("upsertAdminProduct: Supabase error", saved.error);
      return res.status(500).json({ success: false, error: saved.error.message });
    }

    const data = saved.data;
    console.log("upsertAdminProduct: Upsert successful", { id: data.id });

    const shouldSyncBatches =
      productRow.product_type === "trek" ||
      (productRow.product_type === "tour" && item.tourDateBatches != null) ||
      (productRow.product_type === "camping" && item.trekDateBatches != null);

    if (shouldSyncBatches) {
      console.log("upsertAdminProduct: Processing trip batches");
      const batchSource =
        productRow.product_type === "tour"
          ? { tourDateBatches: item.tourDateBatches || "[]" }
          : { trekDateBatches: item.trekDateBatches || "[]" };
      const batchRows = buildBatchRows(data.id, batchSource);

      await supabaseAdmin.from("product_batches").delete().eq("product_id", data.id);
      if (batchRows.length) {
        await insertBatchRows(batchRows);
      }
    }

    if (productRow.product_type === "trek") {
      const departureRows = buildDepartureRows(data.id, item);
      await supabaseAdmin.from("product_departure_plans").delete().eq("product_id", data.id);
      if (departureRows.length) {
        await supabaseAdmin.from("product_departure_plans").insert(departureRows);
      }
    }

    console.log("upsertAdminProduct: Enriching product data");
    const enrichedData = await enrichProduct(data);
    console.log("upsertAdminProduct: Success");
    return res.json({ success: true, data: enrichedData });
  } catch (err) {
    console.error("upsertAdminProduct: Unexpected error", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}

export async function deleteAdminProduct(req, res) {
  const { storageKey, identifier } = req.params;
  const productType = productTypeFromStorageKey(storageKey);

  if (!productType) {
    return res.status(400).json({ success: false, error: "Invalid storage key" });
  }

  let query = supabaseAdmin.from("products").delete().eq("product_type", productType);

  if (/^[0-9a-f-]{36}$/i.test(identifier)) {
    query = query.eq("id", identifier);
  } else {
    query = query.eq("slug", slugify(decodeURIComponent(identifier)));
  }

  const { error } = await query;

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(204).send();
}
