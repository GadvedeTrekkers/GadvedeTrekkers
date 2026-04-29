import supabaseAdmin from "../config/supabaseAdminClient.js";

function toRow(v) {
  return {
    id:                  v.id,
    name:                v.name,
    service_type:        v.serviceType || v.service_type || "Other",
    address:             v.address || null,
    google_map_location: v.googleMapLocation || null,
    contact_number:      v.contactNumber || null,
    rates:               v.rates || null,
    images:              v.images || [],
    is_active:           v.isActive !== false,
    notes:               JSON.stringify({ rateAmount: v.rateAmount, rateUnit: v.rateUnit, bankDetails: v.bankDetails }),
  };
}

function fromRow(row) {
  let extra = {};
  try { extra = JSON.parse(row.notes || "{}"); } catch {}
  return {
    id:                row.id,
    name:              row.name,
    serviceType:       row.service_type,
    address:           row.address || "",
    googleMapLocation: row.google_map_location || "",
    contactNumber:     row.contact_number || "",
    rates:             row.rates || "",
    rateAmount:        extra.rateAmount || "",
    rateUnit:          extra.rateUnit || "",
    bankDetails:       extra.bankDetails || {},
    images:            row.images || [],
    isActive:          row.is_active,
    createdAt:         row.created_at,
  };
}

export async function listVendors(req, res) {
  const { data, error } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: data.map(fromRow) });
}

export async function upsertVendor(req, res) {
  const v = req.body;
  if (!v?.id || !v?.name) {
    return res.status(400).json({ success: false, error: "id and name are required" });
  }
  const { data, error } = await supabaseAdmin
    .from("vendors")
    .upsert(toRow(v), { onConflict: "id" })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: fromRow(data) });
}

export async function deleteVendor(req, res) {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("vendors")
    .delete()
    .eq("id", id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
}
