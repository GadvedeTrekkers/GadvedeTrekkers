import supabasePublic from "../config/supabasePublicClient.js";
import { listActiveProducts } from "./products.controller.js";
import { CATALOG_HUBS, isCatalogHubSlug, toPublicTripCard } from "../../../shared/catalogHubs.js";

const TRIP_TYPES = new Set(["trek", "tour", "camping"]);

function hubFromRow(row) {
  return {
    slug: row.slug,
    name: row.name,
    kind: row.hub_kind || row.kind,
    description: row.description || "",
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
  };
}

export async function getCatalogHubs(req, res) {
  const { data, error } = await supabasePublic
    .from("catalog_hubs")
    .select("slug, name, hub_kind, description, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !Array.isArray(data) || data.length === 0) {
    return res.json({ success: true, source: "builtin", data: CATALOG_HUBS });
  }

  return res.json({
    success: true,
    source: "database",
    data: data.map(hubFromRow),
  });
}

export async function getCatalogTrips(req, res) {
  const { hub, type } = req.query;

  if (hub && !isCatalogHubSlug(hub)) {
    return res.status(400).json({ success: false, error: "Unknown catalog hub" });
  }

  const { data, error } = await listActiveProducts({ type, hub });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const trips = (data || [])
    .filter((item) => TRIP_TYPES.has(item.productType))
    .map(toPublicTripCard);

  return res.json({ success: true, data: trips });
}
