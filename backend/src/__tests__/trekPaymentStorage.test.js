import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockApiRequest, mockIsFeatureEnabled } = vi.hoisted(() => ({
  mockApiRequest: vi.fn(),
  mockIsFeatureEnabled: vi.fn(),
}));

vi.mock("../../../src/api/backendClient.js", () => ({
  apiRequest: mockApiRequest,
}));

vi.mock("../../../src/data/featureFlags.js", () => ({
  isFeatureEnabled: mockIsFeatureEnabled,
}));

import {
  createTrekPayment,
  deleteTrekPayment,
  getAllTrekPayments,
  hydrateTrekPaymentsFromBackend,
  markSubPaymentDone,
  updateTrekPaymentConfig,
  updateTrekPaymentLifecycle,
} from "../../../src/data/trekPaymentStorage.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: vi.fn((key) => (values.has(key) ? values.get(key) : null)),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
}

function seedSession() {
  globalThis.sessionStorage.setItem("gt_user", JSON.stringify({ name: "Admin", username: "admin" }));
}

function basePayload() {
  return {
    trekName: "Kalsubai Trek",
    trekId: "TREK-001",
    eventDate: "2026-06-20",
    participants: 12,
    config: {
      trekLeaderName: "Rahul Patil",
      leaderFee: 2500,
      foodVendorName: "Food Vendor",
      foodCostPerPerson: 100,
      whatsappGroupLink: "https://chat.whatsapp.com/original",
    },
  };
}

describe("trekPaymentStorage", () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockIsFeatureEnabled.mockReset();
    globalThis.localStorage = createStorage();
    globalThis.sessionStorage = createStorage();
    seedSession();
  });

  it("creates a local-only payment record when backend writes are disabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    const record = await createTrekPayment(basePayload());

    expect(record.paymentId).toMatch(/^GT-EVT-/);
    expect(getAllTrekPayments()).toHaveLength(1);
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("posts to the backend and caches the returned canonical payment record when writes are enabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockApiRequest.mockResolvedValue({
      paymentId: "GT-EVT-REMOTE-1",
      eventId: "GT-EVT-REMOTE-1",
      trekName: "Kalsubai Trek",
      eventDate: "2026-06-20",
      participants: 12,
      status: "PENDING",
      config: { trekLeaderName: "Rahul Patil" },
      calculations: { totalCost: 3700 },
      payments: [],
      createdAt: "2026-06-01T10:00:00.000Z",
      createdBy: "Admin",
      createdByUsername: "admin",
    });

    const record = await createTrekPayment(basePayload());

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/trek-payments",
      expect.objectContaining({ method: "POST", admin: true })
    );
    expect(record.paymentId).toBe("GT-EVT-REMOTE-1");
    expect(getAllTrekPayments()[0].paymentId).toBe("GT-EVT-REMOTE-1");
  });

  it("hydrates the local cache from backend trek payment records", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockApiRequest.mockResolvedValue([
      {
        paymentId: "GT-EVT-REMOTE-2",
        eventId: "GT-EVT-REMOTE-2",
        trekName: "Harihar Trek",
        eventDate: "2026-06-21",
        participants: 18,
        status: "IN_PROGRESS",
        config: { trekLeaderName: "Rahul Patil" },
        calculations: { totalCost: 4100 },
        payments: [],
      },
    ]);

    const records = await hydrateTrekPaymentsFromBackend();

    expect(records).toHaveLength(1);
    expect(getAllTrekPayments()[0].trekName).toBe("Harihar Trek");
  });

  it("patches config updates through the backend and keeps local compatibility data in sync", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const created = await createTrekPayment(basePayload());

    mockIsFeatureEnabled.mockReturnValue(true);
    mockApiRequest.mockResolvedValue({
      ...created,
      config: { ...created.config, whatsappGroupLink: "https://chat.whatsapp.com/updated" },
    });

    const updated = await updateTrekPaymentConfig(created.paymentId, {
      whatsappGroupLink: "https://chat.whatsapp.com/updated",
    });

    expect(updated.config.whatsappGroupLink).toBe("https://chat.whatsapp.com/updated");
    expect(getAllTrekPayments()[0].config.whatsappGroupLink).toBe("https://chat.whatsapp.com/updated");
  });

  it("persists completed sub-payments through the backend when writes are enabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const created = await createTrekPayment(basePayload());

    mockIsFeatureEnabled.mockReturnValue(true);
    mockApiRequest.mockResolvedValue({
      ...created,
      status: "IN_PROGRESS",
      payments: created.payments.map((payment) =>
        payment.recipientType === "LEADER"
          ? { ...payment, status: "COMPLETED", method: "UPI", reference: "REF123", paidAt: "2026-06-01T12:00:00.000Z" }
          : payment
      ),
    });

    const updated = await markSubPaymentDone({
      paymentId: created.paymentId,
      recipientType: "LEADER",
      method: "UPI",
      reference: "REF123",
    });

    expect(updated.status).toBe("IN_PROGRESS");
    expect(updated.payments.find((payment) => payment.recipientType === "LEADER").status).toBe("COMPLETED");
  });

  it("patches lifecycle updates for linked events", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const created = await createTrekPayment(basePayload());

    mockIsFeatureEnabled.mockReturnValue(true);
    mockApiRequest.mockResolvedValue({
      ...created,
      lifecycle: { currentStage: "DEPARTURE", notes: "Ready" },
    });

    const updated = await updateTrekPaymentLifecycle(created.paymentId, {
      currentStage: "DEPARTURE",
      notes: "Ready",
    });

    expect(updated.lifecycle).toEqual({ currentStage: "DEPARTURE", notes: "Ready" });
  });

  it("keeps the local cache when backend delete fails", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const created = await createTrekPayment(basePayload());

    mockIsFeatureEnabled.mockReturnValue(true);
    mockApiRequest.mockRejectedValue(new Error("delete failed"));

    const deleted = await deleteTrekPayment(created.paymentId);

    expect(deleted).toBe(false);
    expect(getAllTrekPayments()).toHaveLength(1);
  });
});
