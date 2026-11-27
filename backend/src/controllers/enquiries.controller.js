import supabaseAdmin from "../config/supabaseAdminClient.js";

/* ─── Role helpers (backend copy — kept in sync with src/utils/roleHelpers.js) ── */
const MANAGEMENT_TIER = ["Super Admin", "Management"];

function canSeeAllEnquiries(role) {
  return MANAGEMENT_TIER.includes(role);
}

function toRow(e) {
  return {
    id:                         e.id,
    customer_id:                /^[0-9a-f-]{36}$/i.test(String(e.customerId || "")) ? e.customerId : null,
    name:                       e.name || "Unknown",
    phone:                      e.phone || e.contact || null,
    email:                      e.email || null,
    event_name:                 e.eventName || e.tour || null,
    category:                   e.category || null,
    location:                   e.location || null,
    page_key:                   e.pageKey || null,
    page_url:                   e.pageUrl || null,
    message:                    e.message || null,
    preferred_date:             e.preferredDate || null,
    group_size:                 String(e.groupSize || ""),
    status:                     e.status || "NEW_LEAD",
    tags:                       e.tags || [],
    assigned_sales_employee_id: e.assignedSalesEmployeeId || null,
    assigned_sales_name:        e.assignedSalesName || null,
    assigned_sales_username:    e.assignedSalesUsername || null,
    viewed_at:                  e.viewedAt || null,
    first_response_at:          e.firstResponseAt || null,
    converted_at:               e.convertedAt || null,
    archived_at:                e.archivedAt || null,
    booked_event_name:          e.bookedEventName || null,
    booked_booking_id:          e.bookedBookingId || null,
    created_at:                 e.createdAt || new Date().toISOString(),
  };
}

function toFrontend(r) {
  return {
    id:                       r.id,
    customerId:               r.customer_id || "",
    name:                     r.name,
    phone:                    r.phone || "",
    contact:                  r.phone || "",
    email:                    r.email || "",
    eventName:                r.event_name || "",
    tour:                     r.event_name || "",
    category:                 r.category || "",
    location:                 r.location || "",
    pageKey:                  r.page_key || "",
    pageUrl:                  r.page_url || "",
    message:                  r.message || "",
    preferredDate:            r.preferred_date || "",
    groupSize:                r.group_size || "",
    status:                   r.status,
    tags:                     r.tags || [],
    assignedSalesEmployeeId:  r.assigned_sales_employee_id || "",
    assignedSalesName:        r.assigned_sales_name || "",
    assignedSalesUsername:    r.assigned_sales_username || "",
    viewedAt:                 r.viewed_at || "",
    firstResponseAt:          r.first_response_at || "",
    convertedAt:              r.converted_at || "",
    archivedAt:               r.archived_at || "",
    bookedEventName:          r.booked_event_name || "",
    bookedBookingId:          r.booked_booking_id || "",
    createdAt:                r.created_at,
  };
}

function createLeadBackfillEnquiry(lead = {}) {
  return {
    id: `ENQ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: lead.customerName || "Unknown",
    phone: lead.customerPhone || "",
    email: lead.customerEmail || "",
    eventName: lead.packageName || lead.eventName || "",
    category: lead.category || "",
    location: lead.location || "",
    pageUrl: lead.pageUrl || "",
    message: lead.message || "",
    preferredDate: lead.preferredDate || "",
    groupSize: String(lead.pax || lead.groupSize || ""),
    status: "NEW_LEAD",
    tags: [],
    createdAt: lead.timestamp || new Date().toISOString(),
  };
}

/* ── GET /api/enquiries ── */
export async function listEnquiries(req, res) {
  const {
    search          = "",
    status          = "",
    include_archived = "false",
    limit           = "500",
    offset          = "0",
    assigned_to     = "",   // set by the frontend for Sales-role users
  } = req.query;

  // req.admin is populated by requireAdminJWT: { username, name, role }
  const callerRole     = req.admin?.role     || "";
  const callerUsername = req.admin?.username || "";

  let query = supabaseAdmin
    .from("enquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (status) query = query.eq("status", status);
  if (include_archived !== "true") query = query.is("archived_at", null);

  if (search.trim()) {
    const q = search.trim();
    query = query.or(
      `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,event_name.ilike.%${q}%,id.ilike.%${q}%`
    );
  }

  /**
   * Role-based data scoping (enforced server-side — this is the security gate):
   *
   *   Management / Super Admin → no restriction, sees all enquiries
   *   Sales                    → restricted to enquiries where assigned_sales_username
   *                              matches the authenticated caller's username.
   *
   * Even if a Sales user crafts a request without ?assigned_to, the server
   * applies the filter using their JWT identity — they cannot bypass this.
   */
  if (!canSeeAllEnquiries(callerRole)) {
    // Use the JWT identity, NOT the query param — query params are untrusted.
    query = query.eq("assigned_sales_username", callerUsername);
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ success: false, error: error.message });

  return res.json({
    success: true,
    total: count ?? (data || []).length,
    data: (data || []).map(toFrontend),
  });
}

/* ── POST /api/enquiries  (upsert by id) ── */
/* Create the customer for a public enquiry server-side (POST /api/customers/upsert
   is staff-only). Never overwrites an existing customer's name or contact details. */
async function ensureEnquiryCustomer(enquiry) {
  const phone = String(enquiry.phone || enquiry.contact || "").replace(/\D/g, "").slice(-10);
  const email = String(enquiry.email || "").trim().toLowerCase();
  if (!phone && !email) return;

  let existing = null;
  if (phone) {
    const { data } = await supabaseAdmin.from("customers").select("id").eq("phone", phone).maybeSingle();
    existing = data || null;
  }
  if (!existing && email) {
    const { data } = await supabaseAdmin.from("customers").select("id").eq("email", email).maybeSingle();
    existing = data || null;
  }

  const activity = {
    last_contact_at: new Date().toISOString(),
    latest_enquiry_event: enquiry.eventName || enquiry.tour || null,
    latest_enquiry_status: enquiry.status || "NEW_LEAD",
  };

  if (existing) {
    await supabaseAdmin.from("customers").update(activity).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("customers").insert({
      full_name: enquiry.name || "Unknown",
      phone: phone || null,
      email: email || null,
      ...activity,
    });
  }
}

export async function upsertEnquiry(req, res) {
  const enquiry = req.body || {};
  if (!enquiry.id) return res.status(400).json({ success: false, error: "Enquiry id is required" });

  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .upsert(toRow(enquiry), { onConflict: "id" })
    .select("*")
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });

  try {
    await ensureEnquiryCustomer(enquiry);
  } catch (customerError) {
    console.warn("Enquiry customer upsert failed", customerError?.message);
  }

  return res.status(201).json({ success: true, data: toFrontend(data) });
}

/* ── POST /api/leads (legacy alias) ── */
export async function captureLead(req, res) {
  const enquiry = createLeadBackfillEnquiry(req.body || {});

  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .upsert(toRow(enquiry), { onConflict: "id" })
    .select("*")
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.status(201).json({ success: true, data: toFrontend(data) });
}

/* ── PATCH /api/enquiries/:id ── */
export async function updateEnquiry(req, res) {
  const { id } = req.params;
  const updates = req.body || {};

  const patch = {};
  if (updates.status            !== undefined) patch.status              = updates.status;
  if (updates.tags              !== undefined) patch.tags                = updates.tags;
  if (updates.viewedAt          !== undefined) patch.viewed_at           = updates.viewedAt;
  if (updates.firstResponseAt   !== undefined) patch.first_response_at   = updates.firstResponseAt;
  if (updates.convertedAt       !== undefined) patch.converted_at        = updates.convertedAt;
  if (updates.archivedAt        !== undefined) patch.archived_at         = updates.archivedAt;
  if (updates.bookedEventName   !== undefined) patch.booked_event_name   = updates.bookedEventName;
  if (updates.bookedBookingId   !== undefined) patch.booked_booking_id   = updates.bookedBookingId;
  if (updates.assignedSalesEmployeeId !== undefined) patch.assigned_sales_employee_id = updates.assignedSalesEmployeeId;
  if (updates.assignedSalesName       !== undefined) patch.assigned_sales_name        = updates.assignedSalesName;
  if (updates.assignedSalesUsername   !== undefined) patch.assigned_sales_username    = updates.assignedSalesUsername;

  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  if (!data)  return res.status(404).json({ success: false, error: "Enquiry not found" });

  return res.json({ success: true, data: toFrontend(data) });
}
