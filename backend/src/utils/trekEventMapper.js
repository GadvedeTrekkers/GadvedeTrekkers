function normalizeEventDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString().slice(0, 10);
}

function derivePaymentStatus(row, rawConfig) {
  const meta = rawConfig.meta && typeof rawConfig.meta === "object" ? rawConfig.meta : {};
  if (meta.paymentStatus) {
    return meta.paymentStatus;
  }

  const payments = Array.isArray(rawConfig.payments) ? rawConfig.payments : [];
  const allDone = payments.length > 0 && payments.every((payment) => payment?.status === "COMPLETED");
  const anyDone = payments.some((payment) => payment?.status === "COMPLETED");

  if (allDone) return "COMPLETED";
  if (anyDone) return "IN_PROGRESS";

  switch (row?.status) {
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    case "ONGOING":
      return "IN_PROGRESS";
    case "UPCOMING":
    default:
      return "PENDING";
  }
}

export function mapTrekEventRowToLeaderEvent(row) {
  const rawConfig = row?.config && typeof row.config === "object" ? row.config : {};
  const nestedPaymentConfig =
    rawConfig.paymentConfig && typeof rawConfig.paymentConfig === "object"
      ? rawConfig.paymentConfig
      : {};
  const { calculations, payments, meta, ...directConfig } = rawConfig;

  return {
    eventId: row?.event_id || "",
    paymentId: row?.event_id || row?.id || "",
    trekName: row?.trek_name || "",
    trekId: meta?.trekId || "",
    eventDate: normalizeEventDate(row?.event_date || ""),
    participants: Number(row?.seats_total ?? row?.seats_booked ?? 0),
    status: row?.status || "UPCOMING",
    config: {
      ...directConfig,
      ...nestedPaymentConfig,
      trekLeaderName: nestedPaymentConfig.trekLeaderName || directConfig.trekLeaderName || row?.leader_name || "",
      whatsappGroupLink: nestedPaymentConfig.whatsappGroupLink || directConfig.whatsappGroupLink || "",
    },
    calculations: calculations || {},
    payments: Array.isArray(payments) ? payments : [],
    createdAt: row?.created_at || "",
    canonicalEvent: true,
    source: "backend",
  };
}

export function mapTrekEventRowToPaymentRecord(row) {
  const rawConfig = row?.config && typeof row.config === "object" ? row.config : {};
  const paymentConfig =
    rawConfig.paymentConfig && typeof rawConfig.paymentConfig === "object"
      ? rawConfig.paymentConfig
      : rawConfig;
  const meta = rawConfig.meta && typeof rawConfig.meta === "object" ? rawConfig.meta : {};
  const lifecycle = rawConfig.lifecycle && typeof rawConfig.lifecycle === "object" ? rawConfig.lifecycle : null;

  return {
    eventId: row?.event_id || "",
    paymentId: row?.event_id || row?.id || "",
    trekName: row?.trek_name || "",
    trekId: meta.trekId || "",
    eventDate: normalizeEventDate(row?.event_date || ""),
    participants: Number(row?.seats_total ?? row?.seats_booked ?? 0),
    status: derivePaymentStatus(row, rawConfig),
    config: {
      ...paymentConfig,
      trekLeaderName: paymentConfig.trekLeaderName || row?.leader_name || "",
      whatsappGroupLink: paymentConfig.whatsappGroupLink || "",
    },
    calculations: rawConfig.calculations || {},
    payments: Array.isArray(rawConfig.payments) ? rawConfig.payments : [],
    lifecycle,
    createdAt: meta.createdAt || row?.created_at || "",
    createdBy: meta.createdBy || "Admin",
    createdByUsername: meta.createdByUsername || "admin",
  };
}
