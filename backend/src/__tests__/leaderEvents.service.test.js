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
  areSameLeaderEvent,
  getLegacyEventIdentity,
  getLocalLeaderTrekEvents,
  loadLeaderTrekEvents,
  mergeLeaderEvents,
  normalizeLeaderEventRecord,
} from "../../../src/services/leaderEvents.service.js";

function createStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));
  return {
    getItem: vi.fn((key) => (values.has(key) ? values.get(key) : null)),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
  };
}

function createLocalRecord(overrides = {}) {
  return {
    paymentId: "LOCAL-EVT-001",
    trekName: "Kalsubai Trek",
    eventDate: "2026-06-20",
    participants: 12,
    status: "UPCOMING",
    config: {
      trekLeaderName: "Rahul Patil",
      whatsappGroupLink: "https://chat.whatsapp.com/local",
    },
    ...overrides,
  };
}

function createBackendRecord(overrides = {}) {
  return {
    eventId: "GT-EVT-001",
    paymentId: "GT-EVT-001",
    trekName: "Kalsubai Trek",
    eventDate: "2026-06-20",
    participants: 24,
    status: "UPCOMING",
    canonicalEvent: true,
    source: "backend",
    config: {
      trekLeaderName: "Rahul Patil",
      whatsappGroupLink: "https://chat.whatsapp.com/backend",
    },
    ...overrides,
  };
}

describe("leaderEvents.service", () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockIsFeatureEnabled.mockReset();
    globalThis.localStorage = createStorage();
  });

  it("merges a local legacy record with the same backend event into one visible event", () => {
    const merged = mergeLeaderEvents(
      [createBackendRecord()],
      [createLocalRecord({ paymentId: "LOCAL-EVT-999" })]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        eventId: "GT-EVT-001",
        paymentId: "GT-EVT-001",
        source: "backend",
        participants: 24,
      })
    );
  });

  it("keeps records separate when both contain different canonical event ids", () => {
    const merged = mergeLeaderEvents(
      [createBackendRecord({ eventId: "GT-EVT-002", paymentId: "GT-EVT-002" })],
      [createLocalRecord({ eventId: "GT-EVT-001", paymentId: "GT-EVT-001" })]
    );

    expect(merged).toHaveLength(2);
    expect(merged.map((record) => record.eventId).sort()).toEqual(["GT-EVT-001", "GT-EVT-002"]);
  });

  it("merges legacy id-less records by trek name, normalized date, and leader", () => {
    const merged = mergeLeaderEvents(
      [createLocalRecord({ paymentId: "", eventDate: "2026-06-20T00:00:00.000Z" })],
      [createLocalRecord({ paymentId: "", eventDate: "2026-06-20" })]
    );

    expect(merged).toHaveLength(1);
    expect(getLegacyEventIdentity(merged[0])).toBe("kalsubai trek::2026-06-20::rahul patil");
  });

  it("preserves distinct records in mixed migration scenarios", () => {
    const merged = mergeLeaderEvents(
      [
        createBackendRecord(),
        createBackendRecord({
          eventId: "GT-EVT-003",
          paymentId: "GT-EVT-003",
          trekName: "Harihar Trek",
          eventDate: "2026-06-21",
          config: { trekLeaderName: "Rahul Patil" },
        }),
      ],
      [
        createLocalRecord({ paymentId: "", eventDate: "2026-06-20" }),
        createLocalRecord({
          paymentId: "LOCAL-EVT-004",
          trekName: "Ratangad Trek",
          eventDate: "2026-06-22",
        }),
      ]
    );

    expect(merged).toHaveLength(3);
    expect(merged.map((record) => record.trekName).sort()).toEqual([
      "Harihar Trek",
      "Kalsubai Trek",
      "Ratangad Trek",
    ]);
  });

  it("rejects malformed backend payloads instead of rendering ghost events", () => {
    expect(normalizeLeaderEventRecord({ foo: "bar" }, "backend")).toBeNull();
    expect(normalizeLeaderEventRecord({}, "backend")).toBeNull();
    expect(normalizeLeaderEventRecord({ trekName: "Kalsubai Trek" }, "backend")).toBeNull();
  });

  it("keeps valid legacy local records without canonical ids", () => {
    const normalized = normalizeLeaderEventRecord(createLocalRecord({ paymentId: "" }), "local");

    expect(normalized).toEqual(
      expect.objectContaining({
        eventId: "",
        trekName: "Kalsubai Trek",
        eventDate: "2026-06-20",
      })
    );
  });

  it("falls back to local records when backend reads are disabled", async () => {
    globalThis.localStorage.setItem("gt_trek_payments", JSON.stringify([createLocalRecord()]));
    mockIsFeatureEnabled.mockImplementation((flagName) => flagName === "backendEventReads" ? false : true);

    const events = await loadLeaderTrekEvents("Rahul Patil");

    expect(events).toHaveLength(1);
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("filters invalid backend payloads while keeping valid and local records", async () => {
    globalThis.localStorage.setItem("gt_trek_payments", JSON.stringify([createLocalRecord({ paymentId: "" })]));
    mockIsFeatureEnabled.mockImplementation((flagName) => {
      if (flagName === "backendEventReads") return true;
      if (flagName === "canonicalEventMapper") return true;
      return false;
    });
    mockApiRequest.mockResolvedValue([
      { foo: "bar" },
      createBackendRecord(),
      { eventId: "GT-EVT-BROKEN", paymentId: "GT-EVT-BROKEN", trekName: "", eventDate: "2026-06-20", canonicalEvent: true, config: { trekLeaderName: "Rahul Patil" } },
    ]);

    const events = await loadLeaderTrekEvents("Rahul Patil");

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(expect.objectContaining({ eventId: "GT-EVT-001", source: "backend" }));
  });

  it("uses the legacy fallback when only one side has a canonical id", () => {
    const backend = normalizeLeaderEventRecord(createBackendRecord(), "backend");
    const localLegacy = normalizeLeaderEventRecord(createLocalRecord({ paymentId: "" }), "local");

    expect(areSameLeaderEvent(backend, localLegacy)).toBe(true);
  });

  it("reads only the matching leader's local records", () => {
    globalThis.localStorage.setItem(
      "gt_trek_payments",
      JSON.stringify([
        createLocalRecord(),
        createLocalRecord({
          paymentId: "LOCAL-EVT-222",
          config: { trekLeaderName: "Other Leader" },
        }),
      ])
    );

    const events = getLocalLeaderTrekEvents("Rahul Patil");

    expect(events).toHaveLength(1);
    expect(events[0].paymentId).toBe("LOCAL-EVT-001");
  });
});
