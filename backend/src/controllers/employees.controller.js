import supabaseAdmin from "../config/supabaseAdminClient.js";

// Map frontend employee object → Supabase columns
function toRow(emp) {
  return {
    employee_id:        emp.employeeId,
    full_name:          emp.fullName,
    role:               emp.role || "guide",
    email:              emp.email || null,
    contact_number:     emp.contactNumber || null,
    username:           emp.username || null,
    expertise:          emp.expertise || null,
    experience_years:   Number(emp.experience?.years || 0),
    location:           emp.address || null,
    status:             emp.status || "active",
    performance_rating: Number(emp.performanceRating || 0),
    events_handled:     Number(emp.eventsHandled || 0),
    // Store extra frontend fields in notes as JSON
    notes: JSON.stringify({
      skills:         emp.skills || [],
      certifications: emp.certifications || [],
      expDesc:        emp.experience?.description || "",
      linkedin:       emp.linkedin || "",
      instagram:      emp.instagram || "",
    }),
  };
}

// Map Supabase row → frontend employee object
function fromRow(row) {
  let extra = {};
  try { extra = JSON.parse(row.notes || "{}"); } catch {}
  return {
    employeeId:        row.employee_id,
    fullName:          row.full_name,
    role:              row.role,
    email:             row.email || "",
    contactNumber:     row.contact_number || "",
    username:          row.username || "",
    expertise:         row.expertise || "",
    experience: {
      years:       row.experience_years || 0,
      description: extra.expDesc || "",
    },
    address:           row.location || "",
    status:            row.status,
    performanceRating: Number(row.performance_rating || 0),
    eventsHandled:     Number(row.events_handled || 0),
    skills:            extra.skills || [],
    certifications:    extra.certifications || [],
    linkedin:          extra.linkedin || "",
    instagram:         extra.instagram || "",
    createdAt:         row.created_at,
  };
}

export async function listEmployees(req, res) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: data.map(fromRow) });
}

export async function upsertEmployee(req, res) {
  const emp = req.body;
  if (!emp?.employeeId || !emp?.fullName) {
    return res.status(400).json({ success: false, error: "employeeId and fullName are required" });
  }
  const row = toRow(emp);
  const { data, error } = await supabaseAdmin
    .from("employees")
    .upsert(row, { onConflict: "employee_id" })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: fromRow(data) });
}

export async function deleteEmployee(req, res) {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("employees")
    .delete()
    .eq("employee_id", id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
}
