import supabaseAdmin from "../config/supabaseAdminClient.js";
import supabasePublic from "../config/supabasePublicClient.js";
import { mapListingRowToLocal } from "../utils/listingMapper.js";

const VALID_TYPES = new Set(["event", "property", "campsite"]);

function normalizeType(rawType) {
  const value = String(rawType || "").toLowerCase();
  return VALID_TYPES.has(value) ? value : null;
}

export async function getPublicListings(req, res) {
  const type = normalizeType(req.params.type);

  if (!type) {
    return res.status(400).json({ success: false, error: "Invalid submission type" });
  }

  const { data, error } = await supabasePublic
    .from("listing_submissions")
    .select("id, submission_type, title, subtype, location, event_date, entry_fee, description, pickup_points, images, submitted_at")
    .eq("submission_type", type)
    .eq("status", "LIVE")
    .order("submitted_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({
    success: true,
    data: (data || []).map(mapListingRowToLocal),
  });
}

export async function createListing(req, res) {
  const type = normalizeType(req.params.type);

  if (!type) {
    return res.status(400).json({ success: false, error: "Invalid submission type" });
  }

  const payload = {
    ...req.body,
    submission_type: type,
    status: "PENDING",
  };

  const { data, error } = await supabaseAdmin
    .from("listing_submissions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data: mapListingRowToLocal(data) });
}

export async function getAdminListings(req, res) {
  const type = normalizeType(req.query.type);

  if (!type) {
    return res.status(400).json({ success: false, error: "Invalid submission type" });
  }

  const { data, error } = await supabaseAdmin
    .from("listing_submissions")
    .select("*")
    .eq("submission_type", type)
    .order("submitted_at", { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({
    success: true,
    data: (data || []).map(mapListingRowToLocal),
  });
}

export async function updateAdminListing(req, res) {
  const { id } = req.params;
  const patch = { ...req.body };

  if (patch.status === "LIVE" && !patch.published_at) {
    patch.published_at = new Date().toISOString();
  }
  if ((patch.status === "APPROVED" || patch.status === "REJECTED") && !patch.reviewed_at) {
    patch.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("listing_submissions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.json({ success: true, data: mapListingRowToLocal(data) });
}

export async function deleteAdminListing(req, res) {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("listing_submissions").delete().eq("id", id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(204).send();
}
