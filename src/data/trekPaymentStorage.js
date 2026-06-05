import { apiRequest } from "../api/backendClient";
import { isFeatureEnabled } from "./featureFlags";

const KEY = "gt_trek_payments";

function generateCanonicalId() {
  return `GT-EVT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("gt_user")) || { name: "Admin", username: "admin" };
  } catch {
    return { name: "Admin", username: "admin" };
  }
}

function shouldUseBackendWrites() {
  return isFeatureEnabled("backendEventWrites");
}

function normalizePaymentRecord(record) {
  if (!record || typeof record !== "object") return null;

  return {
    paymentId: record.paymentId || record.eventId || record.event_id || "",
    eventId: record.eventId || record.paymentId || record.event_id || "",
    trekName: record.trekName || record.trek_name || "",
    trekId: record.trekId || record.trek_id || "",
    eventDate: record.eventDate || record.event_date || "",
    participants: Number(record.participants || record.seats_total || 0),
    status: record.status || "PENDING",
    config: record.config && typeof record.config === "object" ? record.config : {},
    calculations: record.calculations && typeof record.calculations === "object" ? record.calculations : {},
    payments: Array.isArray(record.payments) ? record.payments : [],
    lifecycle: record.lifecycle && typeof record.lifecycle === "object" ? record.lifecycle : null,
    createdBy: record.createdBy || "Admin",
    createdByUsername: record.createdByUsername || "admin",
    createdAt: record.createdAt || new Date().toISOString(),
  };
}

function readLocalPayments() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalPayments(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function upsertLocalPayment(record) {
  const normalized = normalizePaymentRecord(record);
  if (!normalized) return null;

  const all = readLocalPayments();
  const index = all.findIndex((payment) => payment.paymentId === normalized.paymentId);
  if (index >= 0) {
    all[index] = { ...all[index], ...normalized };
  } else {
    all.unshift(normalized);
  }
  saveLocalPayments(all);
  return normalized;
}

function replaceLocalPayments(records) {
  const normalized = records.map(normalizePaymentRecord).filter(Boolean);
  saveLocalPayments(normalized);
  return normalized;
}

function buildPayments({ participants, config, overrides = {} }) {
  const p = Number(participants || 0);
  const leaderFee = Number(overrides.LEADER?.amount ?? config.leaderFee ?? 0);
  const foodTotal = Number(overrides.FOOD_VENDOR?.amount ?? (Number(config.foodCostPerPerson || 0) * p));
  const transportTotal = Number(overrides.BUS_VENDOR?.amount ?? config.transportCostFixed ?? 0);
  const entryTotal = Number(overrides.ENTRY_FEES?.amount ?? (Number(config.entryFees || 0) * p));
  const totalCost = leaderFee + foodTotal + transportTotal + entryTotal;

  const paymentLine = (recipientType, recipientName, amount, baseAmount) => ({
    recipientType,
    recipientName,
    amount,
    status: "PENDING",
    method: "",
    reference: "",
    paidAt: null,
    baseAmount,
    overrideReason: overrides[recipientType]?.reason || "",
    isOverridden:
      overrides[recipientType] && Number(overrides[recipientType].amount) !== Number(baseAmount),
  });

  const payments = [];
  if (leaderFee > 0) {
    payments.push(paymentLine("LEADER", config.trekLeaderName || "Trek Leader", leaderFee, Number(config.leaderFee || 0)));
  }
  if (foodTotal > 0) {
    payments.push(paymentLine("FOOD_VENDOR", config.foodVendorName || "Food Vendor", foodTotal, Number(config.foodCostPerPerson || 0) * p));
  }
  if (transportTotal > 0) {
    payments.push(paymentLine("BUS_VENDOR", config.busVendorName || "Bus Vendor", transportTotal, Number(config.transportCostFixed || 0)));
  }
  if (entryTotal > 0) {
    payments.push(paymentLine("ENTRY_FEES", "Entry Fees / Government", entryTotal, Number(config.entryFees || 0) * p));
  }

  return {
    calculations: { leaderFee, foodTotal, transportTotal, entryTotal, totalCost },
    payments,
  };
}

function buildLocalRecord({ trekName, trekId, eventDate, participants, config, overrides = {}, paymentId }) {
  const user = currentUser();
  const { calculations, payments } = buildPayments({ participants, config, overrides });
  const canonicalId = paymentId || generateCanonicalId();

  return normalizePaymentRecord({
    paymentId: canonicalId,
    eventId: canonicalId,
    trekName,
    trekId: trekId || "",
    eventDate,
    participants: Number(participants || 0),
    config: { ...config },
    calculations,
    payments,
    lifecycle: null,
    status: "PENDING",
    createdBy: user.name,
    createdByUsername: user.username,
    createdAt: new Date().toISOString(),
  });
}

async function patchRemotePayment(paymentId, updates) {
  return apiRequest(`/api/trek-payments/${encodeURIComponent(paymentId)}`, {
    method: "PATCH",
    body: updates,
    admin: true,
  });
}

export function getAllTrekPayments() {
  return readLocalPayments();
}

export async function hydrateTrekPaymentsFromBackend() {
  if (!shouldUseBackendWrites()) {
    return readLocalPayments();
  }

  try {
    const records = await apiRequest("/api/trek-payments", { admin: true });
    return Array.isArray(records) ? replaceLocalPayments(records) : readLocalPayments();
  } catch (error) {
    console.warn("hydrateTrekPaymentsFromBackend: falling back to local cache.", error.message);
    return readLocalPayments();
  }
}

export async function createTrekPayment({ trekName, trekId, eventDate, participants, config, overrides = {} }) {
  const localRecord = buildLocalRecord({ trekName, trekId, eventDate, participants, config, overrides });

  if (!shouldUseBackendWrites()) {
    upsertLocalPayment(localRecord);
    return localRecord;
  }

  try {
    const remoteRecord = await apiRequest("/api/trek-payments", {
      method: "POST",
      body: localRecord,
      admin: true,
    });
    return upsertLocalPayment(remoteRecord);
  } catch (error) {
    console.warn("createTrekPayment: backend write failed, keeping local compatibility copy.", error.message);
    upsertLocalPayment(localRecord);
    return localRecord;
  }
}

export async function markSubPaymentDone({ paymentId, recipientType, method, reference, finalAmount, overrideReason }) {
  const all = readLocalPayments();
  const existing = all.find((record) => record.paymentId === paymentId);
  if (!existing) return null;

  const payments = existing.payments.map((payment) =>
    payment.recipientType === recipientType
      ? {
          ...payment,
          status: "COMPLETED",
          method,
          reference,
          paidAt: new Date().toISOString(),
          ...(finalAmount !== undefined && Number(finalAmount) !== payment.amount
            ? { finalAmount: Number(finalAmount), overrideReason: overrideReason || "", isOverridden: true }
            : {}),
        }
      : payment
  );
  const allDone = payments.every((payment) => payment.status === "COMPLETED");
  const anyDone = payments.some((payment) => payment.status === "COMPLETED");
  const nextRecord = {
    ...existing,
    payments,
    status: allDone ? "COMPLETED" : anyDone ? "IN_PROGRESS" : "PENDING",
  };

  if (!shouldUseBackendWrites()) {
    return upsertLocalPayment(nextRecord);
  }

  try {
    const remoteRecord = await patchRemotePayment(paymentId, {
      payments,
      status: nextRecord.status,
    });
    return upsertLocalPayment(remoteRecord);
  } catch (error) {
    console.warn("markSubPaymentDone: backend write failed, keeping local compatibility copy.", error.message);
    return upsertLocalPayment(nextRecord);
  }
}

export async function deleteTrekPayment(paymentId) {
  if (!shouldUseBackendWrites()) {
    saveLocalPayments(readLocalPayments().filter((record) => record.paymentId !== paymentId));
    return true;
  }

  try {
    await apiRequest(`/api/trek-payments/${encodeURIComponent(paymentId)}`, {
      method: "DELETE",
      admin: true,
    });
    saveLocalPayments(readLocalPayments().filter((record) => record.paymentId !== paymentId));
    return true;
  } catch (error) {
    console.warn("deleteTrekPayment: backend delete failed, preserving local record.", error.message);
    return false;
  }
}

export async function updateTrekPaymentConfig(paymentId, configPatch) {
  const existing = readLocalPayments().find((record) => record.paymentId === paymentId);
  if (!existing) return null;

  const nextRecord = {
    ...existing,
    config: { ...existing.config, ...configPatch },
  };

  if (!shouldUseBackendWrites()) {
    return upsertLocalPayment(nextRecord);
  }

  try {
    const remoteRecord = await patchRemotePayment(paymentId, {
      config: configPatch,
    });
    return upsertLocalPayment(remoteRecord);
  } catch (error) {
    console.warn("updateTrekPaymentConfig: backend write failed, keeping local compatibility copy.", error.message);
    return upsertLocalPayment(nextRecord);
  }
}

export async function updateTrekPaymentLifecycle(paymentId, lifecyclePatch) {
  const existing = readLocalPayments().find((record) => record.paymentId === paymentId);
  if (!existing) return null;

  const nextRecord = {
    ...existing,
    lifecycle: {
      ...(existing.lifecycle || {}),
      ...lifecyclePatch,
    },
  };

  if (!shouldUseBackendWrites()) {
    return upsertLocalPayment(nextRecord);
  }

  try {
    const remoteRecord = await patchRemotePayment(paymentId, {
      lifecycle: lifecyclePatch,
    });
    return upsertLocalPayment(remoteRecord);
  } catch (error) {
    console.warn("updateTrekPaymentLifecycle: backend write failed, keeping local compatibility copy.", error.message);
    return upsertLocalPayment(nextRecord);
  }
}

export function getTrekPaymentStats() {
  const all = readLocalPayments();
  const totalOutgoing = all.reduce((sum, record) => sum + (record.calculations?.totalCost || 0), 0);
  const pending = all
    .filter((record) => record.status !== "COMPLETED")
    .reduce((sum, record) => sum + (record.calculations?.totalCost || 0), 0);
  const completed = all
    .filter((record) => record.status === "COMPLETED")
    .reduce((sum, record) => sum + (record.calculations?.totalCost || 0), 0);

  return { count: all.length, totalOutgoing, pending, completed };
}
