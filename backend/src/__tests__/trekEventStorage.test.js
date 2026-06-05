import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIsFeatureEnabled, mockGetAllTrekPayments, mockUpdateTrekPaymentLifecycle } = vi.hoisted(() => ({
  mockIsFeatureEnabled: vi.fn(),
  mockGetAllTrekPayments: vi.fn(),
  mockUpdateTrekPaymentLifecycle: vi.fn(),
}));

vi.mock("../../../src/data/featureFlags.js", () => ({
  isFeatureEnabled: mockIsFeatureEnabled,
}));

vi.mock("../../../src/data/trekPaymentStorage.js", () => ({
  getAllTrekPayments: mockGetAllTrekPayments,
  updateTrekPaymentLifecycle: mockUpdateTrekPaymentLifecycle,
}));

import { advanceStage, getAllTrekEvents, syncFromTrekPayments, updateTask } from "../../../src/data/trekEventStorage.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: vi.fn((key) => (values.has(key) ? values.get(key) : null)),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
}

describe("trekEventStorage", () => {
  beforeEach(() => {
    globalThis.localStorage = createStorage();
    globalThis.sessionStorage = createStorage();
    globalThis.sessionStorage.setItem("gt_user", JSON.stringify({ name: "Admin", username: "admin" }));
    mockIsFeatureEnabled.mockReset();
    mockGetAllTrekPayments.mockReset();
    mockUpdateTrekPaymentLifecycle.mockReset();
  });

  it("rebuilds linked lifecycle events from canonical trek payment records", () => {
    mockGetAllTrekPayments.mockReturnValue([
      {
        paymentId: "GT-EVT-001",
        eventId: "GT-EVT-001",
        trekName: "Kalsubai Trek",
        eventDate: "2026-06-20",
        participants: 24,
        status: "PENDING",
        config: { trekLeaderName: "Rahul Patil" },
        calculations: { totalCost: 5000 },
        payments: [],
        createdAt: "2026-06-01T10:00:00.000Z",
        createdBy: "Admin",
        lifecycle: {
          currentStage: "DEPARTURE",
          stageHistory: [{ stage: "CREATED" }, { stage: "DEPARTURE" }],
          tasks: [{ taskKey: "assign_leader", status: "DONE" }],
          notes: "Synced from backend",
        },
      },
    ]);

    const events = syncFromTrekPayments();

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        eventId: "EVT-GT-EVT-001",
        currentStage: "DEPARTURE",
        notes: "Synced from backend",
        _linkedPaymentId: "GT-EVT-001",
      })
    );
  });

  it("pushes stage changes back into the canonical trek payment lifecycle when writes are enabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetAllTrekPayments.mockReturnValue([
      {
        paymentId: "GT-EVT-002",
        eventId: "GT-EVT-002",
        trekName: "Harihar Trek",
        eventDate: "2026-06-21",
        participants: 18,
        status: "PENDING",
        config: { trekLeaderName: "Rahul Patil" },
        calculations: { totalCost: 4100 },
        payments: [],
        lifecycle: {
          currentStage: "BOOKING_OPEN",
          stageHistory: [{ stage: "CREATED" }, { stage: "BOOKING_OPEN" }],
          tasks: [{ taskKey: "assign_leader", status: "PENDING" }],
          notes: "",
        },
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    ]);

    const [event] = syncFromTrekPayments();
    await advanceStage(event.eventId);

    expect(mockUpdateTrekPaymentLifecycle).toHaveBeenCalledWith(
      "GT-EVT-002",
      expect.objectContaining({
        currentStage: "DEPARTURE",
        eventId: "EVT-GT-EVT-002",
      })
    );
  });

  it("pushes task changes back into the canonical trek payment lifecycle when writes are enabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    mockGetAllTrekPayments.mockReturnValue([
      {
        paymentId: "GT-EVT-003",
        eventId: "GT-EVT-003",
        trekName: "Ratangad Trek",
        eventDate: "2026-06-22",
        participants: 15,
        status: "PENDING",
        config: { trekLeaderName: "Rahul Patil" },
        calculations: { totalCost: 3900 },
        payments: [],
        lifecycle: {
          currentStage: "BOOKING_OPEN",
          stageHistory: [{ stage: "CREATED" }, { stage: "BOOKING_OPEN" }],
          tasks: [{ taskKey: "assign_leader", status: "PENDING" }],
          notes: "",
        },
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    ]);

    const [event] = syncFromTrekPayments();
    await updateTask(event.eventId, "assign_leader", { status: "DONE" });

    expect(mockUpdateTrekPaymentLifecycle).toHaveBeenCalledWith(
      "GT-EVT-003",
      expect.objectContaining({
        tasks: [expect.objectContaining({ taskKey: "assign_leader", status: "DONE" })],
      })
    );
    expect(getAllTrekEvents()[0].tasks[0].status).toBe("DONE");
  });
});
