import { sendTrekAssignmentEmail } from "../services/emailService.js";
import supabaseAdmin from "../config/supabaseAdminClient.js";
import { isFeatureEnabled } from "../config/featureFlags.js";
import { mapTrekEventRowToLeaderEvent } from "../utils/trekEventMapper.js";

function generateEventId() {
  return "GT-EVT-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function notifyTrekAssigned(req, res) {
  const { leaderEmail, leaderName, leaderId, trekName, eventDate, participants, leaderFee, whatsappGroupLink, config } = req.body || {};

  if (!leaderEmail || !trekName || !eventDate) {
    return res.status(400).json({ success: false, error: "leaderEmail, trekName, and eventDate are required" });
  }

  // 1. Save to Supabase trek_events so it syncs across devices
  let supabaseResult = null;
  try {
    // Check if a record already exists for this trek_name + event_date
    const { data: existing } = await supabaseAdmin
      .from("trek_events")
      .select("id, event_id")
      .eq("trek_name", trekName)
      .eq("event_date", eventDate)
      .maybeSingle();

    const eventId = existing?.event_id || generateEventId();

    const { data, error } = await supabaseAdmin
      .from("trek_events")
      .upsert({
        event_id: eventId,
        trek_name: trekName,
        event_date: eventDate,
        leader_id: leaderId || null,
        leader_name: leaderName || null,
        seats_total: Number(participants) || 0,
        seats_booked: 0,
        status: "UPCOMING",
        config: config || {},
      }, { onConflict: "event_id" })
      .select()
      .single();

    if (error) console.warn("Supabase upsert warning:", error.message);
    else supabaseResult = data;
  } catch (err) {
    console.warn("Supabase trek_events save failed:", err.message);
  }

  // 2. Send email notification
  let emailResult = { ok: false, reason: "Not attempted" };
  try {
    emailResult = await sendTrekAssignmentEmail({ leaderEmail, leaderName, trekName, eventDate, participants, leaderFee, whatsappGroupLink });
  } catch (err) {
    console.error("Email send failed:", err.message);
    emailResult = { ok: false, reason: err.message };
  }

  return res.json({
    success: true,
    data: { supabase: !!supabaseResult, email: emailResult },
  });
}

export async function getLeaderTreks(req, res) {
  const { leaderName } = req.params;
  if (!leaderName) return res.status(400).json({ success: false, error: "leaderName is required" });

  const { data, error } = await supabaseAdmin
    .from("trek_events")
    .select("*")
    .eq("leader_name", decodeURIComponent(leaderName))
    .order("event_date", { ascending: true });

  if (error) return res.status(500).json({ success: false, error: error.message });

  const rows = data || [];
  const payload = isFeatureEnabled("canonicalEventMapper")
    ? rows.map(mapTrekEventRowToLeaderEvent)
    : rows;

  return res.json({ success: true, data: payload });
}
