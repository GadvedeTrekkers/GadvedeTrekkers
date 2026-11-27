import supabaseAdmin from "../config/supabaseAdminClient.js";

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function safeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const fallback = new Date(`${value} GMT+0530`);
  return Number.isNaN(fallback.getTime())
    ? new Date().toISOString().slice(0, 10)
    : fallback.toISOString().slice(0, 10);
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureCustomer(booking) {
  const phone = String(booking.contactNumber || "").replace(/\D/g, "").slice(-10);
  const email = String(booking.email || "").trim().toLowerCase();
  if (!booking.customerId && !phone && !email) return null;

  let existing = null;
  if (booking.customerId && /^[0-9a-f-]{36}$/i.test(booking.customerId)) {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("id", booking.customerId).maybeSingle();
    existing = data || null;
  }
  if (!existing && phone) {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("phone", phone).maybeSingle();
    existing = data || null;
  }
  if (!existing && email) {
    const { data } = await supabaseAdmin.from("customers").select("*").eq("email", email).maybeSingle();
    existing = data || null;
  }

  const payload = {
    full_name: `${booking.firstName || ""} ${booking.lastName || ""}`.trim() || existing?.full_name || "Unknown",
    phone: phone || existing?.phone || null,
    email: email || existing?.email || null,
    last_contact_at: new Date().toISOString(),
  };

  const query = existing
    ? supabaseAdmin.from("customers").update(payload).eq("id", existing.id)
    : supabaseAdmin.from("customers").insert(payload);

  const { data } = await query.select("id").single();
  return data?.id || existing?.id || null;
}

async function resolveProductId(booking) {
  const slug = booking.trekSlug || slugify(booking.trekName || booking.eventName || booking.tourName || "");
  if (!slug) return null;
  const { data } = await supabaseAdmin.from("products").select("id").eq("slug", slug).maybeSingle();
  return data?.id || null;
}

async function resolveBatchId(productId, booking) {
  if (!productId) return null;
  const { data } = await supabaseAdmin
    .from("product_batches")
    .select("id")
    .eq("product_id", productId)
    .eq("batch_date", safeDate(booking.travelDate || booking.nextDate))
    .maybeSingle();
  return data?.id || null;
}

export async function createOrUpdateBooking(req, res) {
  const booking = req.body || {};
  const bookingCode = booking.enhancedBookingId || booking.bookingId;

  if (!bookingCode) {
    return res.status(400).json({ success: false, error: "Booking id is required" });
  }

  const [customerId, productId] = await Promise.all([ensureCustomer(booking), resolveProductId(booking)]);
  const batchId = await resolveBatchId(productId, booking);

  const payload = {
    booking_code: bookingCode,
    legacy_booking_id: booking.bookingId || null,
    customer_id: customerId,
    product_id: productId,
    batch_id: batchId,
    booking_source: (() => {
      if (booking.manualBooking) return "direct";
      if (booking.bookingSource === "Customer Self-Service") return "customer_self_service";
      if (booking.bookingSource === "admin") return "admin";
      return "website";
    })(),
    status: (() => {
      const VALID_STATUSES = ["PENDING_APPROVAL", "CONFIRMED", "CANCELLED", "COMPLETED"];
      return VALID_STATUSES.includes(booking.bookingStatus) ? booking.bookingStatus : "PENDING_APPROVAL";
    })(),
    payment_status: (() => {
      if (booking.bookingStatus === "CANCELLED") return "FAILED";
      if (safeNumber(booking.payableNow) === 0 && safeNumber(booking.totalAmount) > 0) return "UNPAID";
      if (safeNumber(booking.remainingAmount) > 0) return "PARTIAL";
      return "PAID";
    })(),
    lead_first_name: booking.firstName || "Unknown",
    lead_last_name: booking.lastName || null,
    lead_whatsapp: booking.whatsappNumber || null,
    lead_phone: booking.contactNumber || "",
    lead_email: booking.email || null,
    emergency_contact: booking.emergencyContact || null,
    ticket_quantity: Math.max(1, safeNumber(booking.tickets, 1)),
    departure_origin: booking.departureOrigin || null,
    pickup_location: booking.pickupLocation || null,
    travel_date: safeDate(booking.travelDate || booking.nextDate),
    whatsapp_group_link: booking.whatsappGroupLink || null,
    payment_option: booking.paymentOption || null,
    payment_reference: booking.paymentReference || null,
    payment_screenshot_url: booking.paymentScreenshot || null,
    base_amount: safeNumber(booking.baseAmount),
    processing_fee: safeNumber(booking.processingFee),
    gst_amount: safeNumber(booking.taxAmount),
    total_amount: safeNumber(booking.totalAmount),
    payable_now: safeNumber(booking.payableNow),
    remaining_amount: safeNumber(booking.remainingAmount),
    referral_code: booking.referralCode || null,
    consent: booking.consent || {},
    traveler_pricing: booking.travelerPricing || [],
    notes: booking.notes || null,
    manual_booking: Boolean(booking.manualBooking),
    collected_offline: Boolean(booking.collectedOffline),
    tax_exempt: Boolean(booking.taxExempt),
    transaction_at: booking.savedAt || new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .upsert(payload, { onConflict: "booking_code" })
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const travelerRows = [
    {
      booking_id: data.id,
      is_lead: true,
      first_name: booking.firstName || "Unknown",
      last_name: booking.lastName || null,
      mobile_number: booking.contactNumber || null,
      email: booking.email || null,
      departure_origin: booking.departureOrigin || null,
      pickup_location: booking.pickupLocation || null,
    },
    ...((booking.additionalTravelers || []).map((traveler) => ({
      booking_id: data.id,
      is_lead: false,
      first_name: traveler.firstName || "Unknown",
      last_name: traveler.lastName || null,
      mobile_number: traveler.mobileNumber || null,
      email: traveler.email || null,
      departure_origin: traveler.departureOrigin || null,
      pickup_location: traveler.pickupLocation || null,
    }))),
  ];

  await supabaseAdmin.from("booking_travelers").delete().eq("booking_id", data.id);
  if (travelerRows.length) {
    await supabaseAdmin.from("booking_travelers").insert(travelerRows);
  }

  return res.status(201).json({ success: true, data: { id: data.id, bookingCode: data.booking_code } });
}

/* ── GET /api/bookings  (admin — requires x-admin-api-key) ── */
export async function listBookings(req, res) {
  const {
    search = "",
    status = "",
    payment_option = "",
    from_date = "",
    to_date = "",
    sort_by = "latest",
    limit = "500",
    offset = "0",
  } = req.query;

  let query = supabaseAdmin
    .from("bookings")
    .select(
      `id, booking_code, legacy_booking_id, status, payment_status,
       lead_first_name, lead_last_name, lead_phone, lead_email,
       ticket_quantity, departure_origin, pickup_location, travel_date,
       payment_option, payable_now, total_amount, remaining_amount,
       booking_source, manual_booking, transaction_at, created_at,
       customer_id, product_id`,
      { count: "exact" }
    )
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (status)         query = query.eq("status", status);
  if (payment_option) query = query.eq("payment_option", payment_option);
  if (from_date)      query = query.gte("transaction_at", from_date);
  if (to_date)        query = query.lte("transaction_at", `${to_date}T23:59:59Z`);

  if (search.trim()) {
    const q = search.trim();
    query = query.or(
      `booking_code.ilike.%${q}%,legacy_booking_id.ilike.%${q}%,lead_first_name.ilike.%${q}%,lead_last_name.ilike.%${q}%,lead_phone.ilike.%${q}%,lead_email.ilike.%${q}%`
    );
  }

  if (sort_by === "oldest")      query = query.order("transaction_at", { ascending: true });
  else if (sort_by === "amount-high") query = query.order("total_amount", { ascending: false });
  else if (sort_by === "amount-low")  query = query.order("total_amount", { ascending: true });
  else                           query = query.order("transaction_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ success: false, error: error.message });

  const bookings = (data || []).map((b) => ({
    bookingId:         b.legacy_booking_id || b.booking_code,
    enhancedBookingId: b.booking_code,
    supabaseId:        b.id,
    customerId:        b.customer_id,
    firstName:         b.lead_first_name,
    lastName:          b.lead_last_name || "",
    contactNumber:     b.lead_phone || "",
    email:             b.lead_email || "",
    trekName:          b.product_id ? null : null, // resolved separately if needed
    tickets:           b.ticket_quantity,
    departureOrigin:   b.departure_origin || "",
    pickupLocation:    b.pickup_location || "",
    travelDate:        b.travel_date || "",
    paymentOption:     b.payment_option || "",
    payableNow:        b.payable_now || 0,
    totalAmount:       b.total_amount || 0,
    remainingAmount:   b.remaining_amount || 0,
    bookingStatus:     b.status,
    bookingSource:     b.booking_source,
    savedAt:           b.transaction_at,
    bookingDate:       new Date(b.transaction_at).toLocaleDateString("en-IN"),
  }));

  return res.json({ success: true, total: count ?? bookings.length, data: bookings });
}

/* ── GET /api/bookings/:bookingCode ── */
export async function getBookingByCode(req, res) {
  const { bookingCode } = req.params;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(`*, booking_travelers (*)`)
    .eq("booking_code", bookingCode)
    .maybeSingle();

  if (error) return res.status(500).json({ success: false, error: error.message });
  if (!data)  return res.status(404).json({ success: false, error: "Booking not found" });

  return res.json({ success: true, data });
}

export async function updateBookingStatus(req, res) {
  const { bookingCode } = req.params;
  const { status } = req.body;

  const VALID = ["PENDING_APPROVAL", "CONFIRMED", "CANCELLED", "COMPLETED"];
  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID.join(", ")}` });
  }

  // Also update payment_status when status changes
  const paymentStatusMap = {
    CANCELLED:  "FAILED",
    CONFIRMED:  "PAID",
    COMPLETED:  "PAID",
    PENDING_APPROVAL: "UNPAID",
  };

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ status, payment_status: paymentStatusMap[status] ?? "UNPAID" })
    .eq("booking_code", bookingCode)
    .select("id, booking_code, status, payment_status")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  // WhatsApp Cloud API booking confirmation (once per booking; dry run unless WHATSAPP_API_LIVE=true). Never blocks.
  if (data && status === "CONFIRMED") {
    import("../services/whatsappCloud.js")
      .then(({ notifyBookingConfirmed }) => notifyBookingConfirmed(supabaseAdmin, data.id, { by: req.admin?.username }))
      .catch(() => {});
  }

  return res.json({ success: true, data });
}
