/* ══════════════════════════════════════════════
   trekEventStorage.js — Gadvede Trekkers
   Trek Lifecycle Tracking: stage transitions + task management
══════════════════════════════════════════════ */

import { isFeatureEnabled } from "./featureFlags";
import { getAllTrekPayments, updateTrekPaymentLifecycle } from "./trekPaymentStorage";

const KEY = "gt_trek_events";

export const STAGES = [
  "CREATED",
  "BOOKING_OPEN",
  "DEPARTURE",
  "ONGOING",
  "COMPLETED",
  "PAYMENTS_SETTLED",
];

export const STAGE_LABELS = {
  CREATED:           "Created",
  BOOKING_OPEN:      "Booking Open",
  DEPARTURE:         "Departure",
  ONGOING:           "Ongoing",
  COMPLETED:         "Completed",
  PAYMENTS_SETTLED:  "Payments Settled",
};

export const STAGE_COLORS = {
  CREATED:           "#94a3b8",
  BOOKING_OPEN:      "#3b82f6",
  DEPARTURE:         "#f59e0b",
  ONGOING:           "#8b5cf6",
  COMPLETED:         "#22c55e",
  PAYMENTS_SETTLED:  "#059669",
};

/* Standard task checklist for every trek event */
export const DEFAULT_TASKS = [
  { taskKey: "assign_leader",    label: "Assign Trek Leader",          requiredStage: "BOOKING_OPEN"     },
  { taskKey: "confirm_food",     label: "Confirm Food Vendor",         requiredStage: "BOOKING_OPEN"     },
  { taskKey: "book_transport",   label: "Book Transport",              requiredStage: "BOOKING_OPEN"     },
  { taskKey: "collect_payments", label: "Collect All Payments",        requiredStage: "DEPARTURE"        },
  { taskKey: "send_briefing",    label: "Send Pre-Trek Briefing",      requiredStage: "DEPARTURE"        },
  { taskKey: "complete_trek",    label: "Mark Trek Completed",         requiredStage: "COMPLETED"        },
  { taskKey: "settle_leader",    label: "Settle Leader Payment",       requiredStage: "PAYMENTS_SETTLED" },
  { taskKey: "settle_vendors",   label: "Settle Vendor Payments",      requiredStage: "PAYMENTS_SETTLED" },
  { taskKey: "settle_incentives",label: "Settle Referral Incentives",  requiredStage: "PAYMENTS_SETTLED" },
];

/* ── helpers ─────────────────────────── */

function _currentUser() {
  try { return JSON.parse(sessionStorage.getItem("gt_user")) || { name: "Admin", username: "admin" }; }
  catch { return { name: "Admin", username: "admin" }; }
}

function _uid() {
  return `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function _save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function _linkedPaymentIdFromEvent(event) {
  return event?._linkedPaymentId || event?.eventId?.replace(/^EVT-/, "") || "";
}

function _makeTasks(eventId, overrides = {}) {
  return DEFAULT_TASKS.map(t => ({
    taskId:      `${eventId}-${t.taskKey}`,
    taskKey:     t.taskKey,
    label:       t.label,
    requiredStage: t.requiredStage,
    status:      overrides[t.taskKey]?.status      || "PENDING",
    assignedTo:  overrides[t.taskKey]?.assignedTo  || "",
    completedAt: overrides[t.taskKey]?.completedAt || null,
    completedBy: overrides[t.taskKey]?.completedBy || null,
    note:        overrides[t.taskKey]?.note        || "",
  }));
}

/* ── CRUD ────────────────────────────── */

export function getAllTrekEvents() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function getTrekEventById(eventId) {
  return getAllTrekEvents().find(e => e.eventId === eventId) || null;
}

export function getTrekEventsByName(trekName) {
  return getAllTrekEvents().filter(e => e.trekName === trekName);
}

export function createTrekEvent({ trekName, trekDate, createdBy }) {
  const all = getAllTrekEvents();
  const user = _currentUser();
  const eventId = _uid();
  const event = {
    eventId,
    trekName,
    trekDate,
    currentStage: "CREATED",
    stageHistory: [{ stage: "CREATED", changedAt: new Date().toISOString(), changedBy: createdBy || user.name }],
    tasks: _makeTasks(eventId),
    notes: "",
    createdAt: new Date().toISOString(),
    createdBy: createdBy || user.name,
  };
  all.push(event);
  _save(all);
  return event;
}

async function _persistLifecycle(event) {
  const linkedPaymentId = _linkedPaymentIdFromEvent(event);
  if (!isFeatureEnabled("backendEventWrites") || !linkedPaymentId) {
    return event;
  }

  await updateTrekPaymentLifecycle(linkedPaymentId, {
    eventId: event.eventId,
    currentStage: event.currentStage,
    stageHistory: event.stageHistory,
    tasks: event.tasks,
    notes: event.notes || "",
  });

  return event;
}

export async function advanceStage(eventId, { note = "" } = {}) {
  const all = getAllTrekEvents();
  const idx = all.findIndex(e => e.eventId === eventId);
  if (idx === -1) return null;
  const event = all[idx];
  const stageIdx = STAGES.indexOf(event.currentStage);
  if (stageIdx >= STAGES.length - 1) return event;
  const user = _currentUser();
  const newStage = STAGES[stageIdx + 1];
  event.currentStage = newStage;
  event.stageHistory.push({ stage: newStage, changedAt: new Date().toISOString(), changedBy: user.name, note });
  all[idx] = event;
  _save(all);
  return _persistLifecycle(event);
}

export async function setStage(eventId, stage, { note = "" } = {}) {
  if (!STAGES.includes(stage)) return null;
  const all = getAllTrekEvents();
  const idx = all.findIndex(e => e.eventId === eventId);
  if (idx === -1) return null;
  const user = _currentUser();
  all[idx].currentStage = stage;
  all[idx].stageHistory.push({ stage, changedAt: new Date().toISOString(), changedBy: user.name, note });
  _save(all);
  return _persistLifecycle(all[idx]);
}

export async function updateTask(eventId, taskKey, { status, assignedTo, note } = {}) {
  const all = getAllTrekEvents();
  const idx = all.findIndex(e => e.eventId === eventId);
  if (idx === -1) return null;
  const user = _currentUser();
  all[idx].tasks = all[idx].tasks.map(t => {
    if (t.taskKey !== taskKey) return t;
    const isDone = status === "DONE";
    return {
      ...t,
      ...(status    !== undefined ? { status }    : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      ...(note      !== undefined ? { note }      : {}),
      ...(isDone
        ? { completedAt: new Date().toISOString(), completedBy: user.name }
        : status === "PENDING"
          ? { completedAt: null, completedBy: null }
          : {}),
    };
  });
  _save(all);
  return _persistLifecycle(all[idx]);
}

export async function updateEventNotes(eventId, notes) {
  const all = getAllTrekEvents();
  const idx = all.findIndex(e => e.eventId === eventId);
  if (idx === -1) return null;
  all[idx].notes = notes;
  _save(all);
  return _persistLifecycle(all[idx]);
}

export function deleteTrekEvent(eventId) {
  _save(getAllTrekEvents().filter(e => e.eventId !== eventId));
}

/* ── Auto-sync from trek payment records ── */
export function syncFromTrekPayments() {
  const payments = getAllTrekPayments();
  const existingEvents = getAllTrekEvents();
  const linkedEvents = new Map();
  const manualEvents = existingEvents.filter(event => !_linkedPaymentIdFromEvent(event));
  let changed = false;

  payments.forEach(p => {
    const linkedPaymentId = p.eventId || p.paymentId;
    const eventId = `EVT-${linkedPaymentId}`;
    const hasLeader  = !!p.config?.trekLeaderName;
    const hasFood    = !!(p.config?.foodVendorName  || (p.calculations?.foodTotal  > 0));
    const hasBus     = !!(p.config?.busVendorName   || (p.calculations?.transportTotal > 0));

    // Determine auto-complete status for tasks
    const payDone   = p.status === "COMPLETED";
    const taskOverrides = {
      assign_leader:    hasLeader ? { status: "DONE", assignedTo: p.config?.trekLeaderName,   completedAt: p.createdAt, completedBy: "admin" } : {},
      confirm_food:     hasFood   ? { status: "DONE", assignedTo: p.config?.foodVendorName,    completedAt: p.createdAt, completedBy: "admin" } : {},
      book_transport:   hasBus    ? { status: "DONE", assignedTo: p.config?.busVendorName,     completedAt: p.createdAt, completedBy: "admin" } : {},
      settle_leader:    payDone   ? { status: "DONE", completedAt: p.createdAt, completedBy: "admin" } : {},
      settle_vendors:   payDone   ? { status: "DONE", completedAt: p.createdAt, completedBy: "admin" } : {},
    };

    // Determine stage from payment status + trek date
    const trekDateObj = p.eventDate ? new Date(p.eventDate) : null;
    const now = new Date(); now.setHours(0,0,0,0);
    let stage = "BOOKING_OPEN";
    if (p.status === "COMPLETED") stage = "PAYMENTS_SETTLED";
    else if (trekDateObj && trekDateObj < now) stage = "COMPLETED";

    const fallbackStageHistory = [
      { stage: "CREATED",      changedAt: p.createdAt, changedBy: "admin", note: "Synced from payment record" },
      { stage: "BOOKING_OPEN", changedAt: p.createdAt, changedBy: "admin", note: "Auto-advanced" },
    ];
    if (stage !== "BOOKING_OPEN") {
      fallbackStageHistory.push({ stage, changedAt: p.createdAt, changedBy: "admin", note: "Auto-detected" });
    }

    const lifecycle = p.lifecycle && typeof p.lifecycle === "object" ? p.lifecycle : {};
    const nextEvent = {
      eventId,
      trekName: p.trekName,
      trekDate: p.eventDate,
      currentStage: lifecycle.currentStage || stage,
      stageHistory: Array.isArray(lifecycle.stageHistory) && lifecycle.stageHistory.length > 0 ? lifecycle.stageHistory : fallbackStageHistory,
      tasks: Array.isArray(lifecycle.tasks) && lifecycle.tasks.length > 0 ? lifecycle.tasks : _makeTasks(eventId, taskOverrides),
      notes: lifecycle.notes || "",
      createdAt: p.createdAt,
      createdBy: p.createdBy || "admin",
      _linkedPaymentId: linkedPaymentId,
    };

    linkedEvents.set(linkedPaymentId, nextEvent);
  });

  const nextEvents = [...manualEvents, ...linkedEvents.values()];
  const serializedExisting = JSON.stringify(existingEvents);
  const serializedNext = JSON.stringify(nextEvents);
  if (serializedExisting !== serializedNext) {
    _save(nextEvents);
    changed = true;
  }

  return changed ? nextEvents : existingEvents;
}

/* ── Missing-action detection ── */
export function getMissingActions(event) {
  const alerts = [];
  const stageIdx = STAGES.indexOf(event.currentStage);
  const today = new Date(); today.setHours(0,0,0,0);
  const trekDate = event.trekDate ? new Date(event.trekDate) : null;

  // 1. Trek date passed but not moved beyond BOOKING_OPEN
  if (trekDate && trekDate < today && stageIdx < STAGES.indexOf("COMPLETED")) {
    alerts.push({ severity: "high", msg: "Trek date has passed — mark as Completed" });
  }

  // 2. Departure approaching (≤7 days) but key tasks pending
  const daysToTrek = trekDate ? Math.round((trekDate - today) / 86400000) : null;
  if (daysToTrek !== null && daysToTrek >= 0 && daysToTrek <= 7) {
    const unfinished = event.tasks
      .filter(t => ["assign_leader","confirm_food","book_transport","send_briefing"].includes(t.taskKey) && t.status === "PENDING")
      .map(t => t.label);
    if (unfinished.length > 0) {
      alerts.push({ severity: "high", msg: `${daysToTrek}d to departure — pending: ${unfinished.join(", ")}` });
    }
  }

  // 3. Booking open but no leader assigned
  if (stageIdx >= STAGES.indexOf("BOOKING_OPEN")) {
    const leaderTask = event.tasks.find(t => t.taskKey === "assign_leader");
    if (leaderTask?.status === "PENDING") {
      alerts.push({ severity: "medium", msg: "No trek leader assigned yet" });
    }
  }

  // 4. Completed but payments not settled within 7 days
  const completedEntry = event.stageHistory.find(h => h.stage === "COMPLETED");
  if (completedEntry) {
    const daysSinceComplete = Math.round((today - new Date(completedEntry.changedAt)) / 86400000);
    if (stageIdx < STAGES.indexOf("PAYMENTS_SETTLED") && daysSinceComplete > 7) {
      alerts.push({ severity: "medium", msg: `Trek completed ${daysSinceComplete}d ago — payments not settled` });
    }
  }

  return alerts;
}

/* ── Financial helpers (pulled from bookings + payments + incentives) ── */
export function computeEventFinancials(event) {
  const bookings  = JSON.parse(localStorage.getItem("gt_bookings") || "[]")
    .filter(b => b.status !== "CANCELLED" && b.trekName === event.trekName);
  const payments  = JSON.parse(localStorage.getItem("gt_trek_payments") || "[]")
    .filter(p => p.trekName === event.trekName && (!event.trekDate || p.eventDate === event.trekDate));
  const incentives = JSON.parse(localStorage.getItem("gt_incentives") || "[]")
    .filter(i => i.trekName === event.trekName);

  const revenue          = bookings.reduce((s, b) => s + Number(b.pricePaid || 0), 0);
  const totalBookingValue = bookings.reduce((s, b) => s + Number(b.totalPrice || b.price || 0), 0);
  const pendingCollection = totalBookingValue - revenue;

  const latestPayment = payments[0] || {};
  const calc          = latestPayment.calculations || {};
  const leaderFee      = Number(calc.leaderFee      || 0);
  const foodTotal      = Number(calc.foodTotal       || 0);
  const transportTotal = Number(calc.transportTotal  || 0);
  const entryTotal     = Number(calc.entryTotal      || 0);
  const incentiveAmt   = incentives.reduce((s, i) => s + Number(i.amount || 0), 0);

  const totalExpenses  = leaderFee + foodTotal + transportTotal + entryTotal + incentiveAmt;
  const gst            = Math.round(revenue * 0.05);
  const netProfit      = revenue - totalExpenses - gst;

  return {
    bookingCount: bookings.length,
    revenue, totalBookingValue, pendingCollection,
    leaderFee, foodTotal, transportTotal, entryTotal, incentiveAmt,
    totalExpenses, gst, netProfit,
  };
}
