import supabaseAdmin from "../config/supabaseAdminClient.js";

function genEventId() {
  return "GT-EVT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// Store full trek payment record in trek_events.config JSONB
export async function listTrekPayments(req, res) {
  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .select("*")
    .order("event_date", { ascending: false });
  if (error) return res.status(500).json({ success: false, error: error.message });
  // Return the config which holds the full payment record shape
  const payments = data.map(row => ({
    paymentId:    row.event_id,
    trekName:     row.trek_name,
    eventDate:    row.event_date,
    participants: row.seats_total,
    status:       row.status,
    config:       row.config?.paymentConfig || row.config || {},
    calculations: row.config?.calculations || {},
    payments:     row.config?.payments || [],
    createdAt:    row.created_at,
    ...( row.config?.meta || {} ),
  }));
  return res.json({ success: true, data: payments });
}

export async function createTrekPayment(req, res) {
  const p = req.body;
  if (!p?.trekName || !p?.eventDate) {
    return res.status(400).json({ success: false, error: "trekName and eventDate are required" });
  }
  const eventId = p.paymentId || genEventId();
  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .upsert({
      event_id:    eventId,
      trek_name:   p.trekName,
      event_date:  p.eventDate,
      leader_name: p.config?.trekLeaderName || null,
      leader_id:   p.leaderId || null,
      seats_total: Number(p.participants || 0),
      status:      p.status || "UPCOMING",
      config: {
        paymentConfig: p.config || {},
        calculations:  p.calculations || {},
        payments:      p.payments || [],
        meta: {
          createdBy:         p.createdBy,
          createdByUsername: p.createdByUsername,
          createdAt:         p.createdAt || new Date().toISOString(),
          trekId:            p.trekId || "",
        },
      },
    }, { onConflict: "event_id" })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: { paymentId: data.event_id, ...data } });
}

export async function updateTrekPayment(req, res) {
  const { id } = req.params;
  const updates = req.body;
  // Fetch existing config first
  const { data: existing } = await supabaseAdmin
    .from("trek_events")
    .select("config, status")
    .eq("event_id", id)
    .single();
  if (!existing) return res.status(404).json({ success: false, error: "Trek payment not found" });

  const mergedConfig = { ...(existing.config || {}), ...(updates.config || {}) };
  if (updates.payments) mergedConfig.payments = updates.payments;

  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .update({ config: mergedConfig, status: updates.status || existing.status })
    .eq("event_id", id)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
}

export async function deleteTrekPayment(req, res) {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from("trek_events")
    .delete()
    .eq("event_id", id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
}
