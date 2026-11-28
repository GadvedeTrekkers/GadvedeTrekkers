import supabaseAdmin from "../config/supabaseAdminClient.js";
import { mapListingRowToLocal } from "../utils/listingMapper.js";

const VALID_TYPES = new Set(["event", "property", "campsite"]);

/* Columns a visitor may set when submitting a listing. status, admin_notes, submitted_at and the review/publish
   stamps are always set by the server, and unknown keys are dropped (an unknown column used to turn into a 500). */
export const PUBLIC_LISTING_FIELDS = [
  "title", "subtype", "contact_name", "phone", "email", "location", "description",
  "event_date", "expected_attendees", "entry_fee", "capacity", "price_per_night", "price_per_person",
  "nearby_trek", "pickup_points", "amenities", "facilities", "images",
];
/* The admin may also change the review fields. */
export const ADMIN_LISTING_FIELDS = [...PUBLIC_LISTING_FIELDS, "status", "admin_notes", "submitted_at"];

export function pickListingFields(body, allowed) {
  const out = {};
  for (const key of allowed) {
    if (body && Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

function normalizeType(rawType) {
  const value = String(rawType || "").toLowerCase();
  return VALID_TYPES.has(value) ? value : null;
}

export async function getPublicListings(req, res) {
  const type = normalizeType(req.params.type);

  if (!type) {
    return res.status(400).json({ success: false, error: "Invalid submission type" });
  }

  /* Read with the backend (service-role) client: listing_submissions has an RLS "deny_anon_read" policy (migration 009),
     so the anon client always saw zero rows and approved listings never showed. Only LIVE rows and these public-safe
     columns (no phone, email or notes) are returned. */
  const { data, error } = await supabaseAdmin
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
    ...pickListingFields(req.body, PUBLIC_LISTING_FIELDS),
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
  const patch = pickListingFields(req.body, ADMIN_LISTING_FIELDS);

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
