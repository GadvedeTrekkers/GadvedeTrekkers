import supabaseAdmin from "../config/supabaseAdminClient.js";
import { mapTrekEventRowToPaymentRecord } from "../utils/trekEventMapper.js";

function genEventId() {
  return "GT-EVT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function mapPaymentStatusToEventStatus(status) {
  switch (status) {
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    case "IN_PROGRESS":
    case "ONGOING":
      return "ONGOING";
    case "UPCOMING":
    case "PENDING":
    default:
      return "UPCOMING";
  }
}

function getPaymentConfig(rawConfig = {}) {
  if (rawConfig?.paymentConfig && typeof rawConfig.paymentConfig === "object") {
    return rawConfig.paymentConfig;
  }
  return rawConfig && typeof rawConfig === "object" ? rawConfig : {};
}

function buildMergedConfig(existingConfig = {}, updates = {}) {
  const currentPaymentConfig = getPaymentConfig(existingConfig);
  const nextPaymentConfig = updates.config
    ? { ...currentPaymentConfig, ...updates.config }
    : currentPaymentConfig;
  const nextMeta = {
    ...(existingConfig.meta || {}),
    ...(updates.meta || {}),
  };

  if (updates.status) {
    nextMeta.paymentStatus = updates.status;
  }

  return {
    paymentConfig: nextPaymentConfig,
    calculations: updates.calculations ?? existingConfig.calculations ?? {},
    payments: updates.payments ?? existingConfig.payments ?? [],
    lifecycle: updates.lifecycle
      ? { ...(existingConfig.lifecycle || {}), ...updates.lifecycle }
      : existingConfig.lifecycle || null,
    meta: nextMeta,
  };
}

export async function listTrekPayments(req, res) {
  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .select("*")
    .order("event_date", { ascending: false });
  if (error) return res.status(500).json({ success: false, error: error.message });
  const payments = (data || []).map(mapTrekEventRowToPaymentRecord);
  return res.json({ success: true, data: payments });
}

export async function createTrekPayment(req, res) {
  const p = req.body;
  if (!p?.trekName || !p?.eventDate) {
    return res.status(400).json({ success: false, error: "trekName and eventDate are required" });
  }
  const eventId = p.paymentId || genEventId();
  const createdAt = p.createdAt || new Date().toISOString();
  const paymentConfig = p.config && typeof p.config === "object" ? p.config : {};
  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .upsert({
      event_id:    eventId,
      trek_name:   p.trekName,
      event_date:  p.eventDate,
      leader_name: paymentConfig.trekLeaderName || p.leaderName || null,
      leader_id:   p.leaderId || null,
      seats_total: Number(p.participants || 0),
      status:      mapPaymentStatusToEventStatus(p.status),
      config: {
        paymentConfig,
        calculations:  p.calculations || {},
        payments:      p.payments || [],
        lifecycle:     p.lifecycle || null,
        meta: {
          createdBy:         p.createdBy,
          createdByUsername: p.createdByUsername,
          createdAt,
          trekId:            p.trekId || "",
          paymentStatus:     p.status || "PENDING",
        },
      },
    }, { onConflict: "event_id" })
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: mapTrekEventRowToPaymentRecord(data) });
}

export async function updateTrekPayment(req, res) {
  const { id } = req.params;
  const updates = req.body;
  // Fetch existing config first
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("trek_events")
    .select("*")
    .eq("event_id", id)
    .single();
  if (existingError) return res.status(500).json({ success: false, error: existingError.message });
  if (!existing) return res.status(404).json({ success: false, error: "Trek payment not found" });

  const mergedConfig = buildMergedConfig(existing.config || {}, updates);
  const nextPaymentConfig = getPaymentConfig(mergedConfig);
  const nextStatus = updates.status || mergedConfig.meta?.paymentStatus || existing.config?.meta?.paymentStatus || existing.status;

  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .update({
      trek_name: updates.trekName || existing.trek_name,
      event_date: updates.eventDate || existing.event_date,
      seats_total: updates.participants !== undefined ? Number(updates.participants) : existing.seats_total,
      leader_name: nextPaymentConfig.trekLeaderName || updates.leaderName || existing.leader_name,
      leader_id: updates.leaderId || existing.leader_id,
      config: mergedConfig,
      status: mapPaymentStatusToEventStatus(nextStatus),
    })
    .eq("event_id", id)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: mapTrekEventRowToPaymentRecord(data) });
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
