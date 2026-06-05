import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("../config/supabaseAdminClient.js", () => ({
  default: { from: mockFrom },
}));

import { createTrekPayment, listTrekPayments, updateTrekPayment } from "../controllers/trekPayments.controller.js";

function mockRes() {
  return {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
}

describe("trekPayments.controller", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("lists normalized trek payment records with lifecycle and meta", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 1,
          event_id: "GT-EVT-001",
          trek_name: "Kalsubai Trek",
          event_date: "2026-06-20T00:00:00.000Z",
          leader_name: "Rahul Patil",
          seats_total: 24,
          status: "ONGOING",
          created_at: "2026-06-01T10:00:00.000Z",
          config: {
            paymentConfig: {
              trekLeaderName: "Rahul Patil",
              whatsappGroupLink: "https://chat.whatsapp.com/test",
            },
            calculations: { totalCost: 5200 },
            payments: [{ recipientType: "LEADER", amount: 2500 }],
            lifecycle: { currentStage: "DEPARTURE", notes: "Ready" },
            meta: { createdBy: "Admin", createdByUsername: "admin", trekId: "TREK-001", paymentStatus: "IN_PROGRESS" },
          },
        }],
        error: null,
      }),
    }));

    const res = mockRes();
    await listTrekPayments({}, res);

    expect(res._status).toBe(200);
    expect(res._body.data).toEqual([
      expect.objectContaining({
        paymentId: "GT-EVT-001",
        eventId: "GT-EVT-001",
        trekName: "Kalsubai Trek",
        trekId: "TREK-001",
        eventDate: "2026-06-20",
        status: "IN_PROGRESS",
        lifecycle: { currentStage: "DEPARTURE", notes: "Ready" },
        config: expect.objectContaining({
          trekLeaderName: "Rahul Patil",
          whatsappGroupLink: "https://chat.whatsapp.com/test",
        }),
      }),
    ]);
  });

  it("creates a canonical trek payment record in trek_events", async () => {
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          event_id: "GT-EVT-002",
          trek_name: "Harihar Trek",
          event_date: "2026-06-21",
          seats_total: 18,
          status: "UPCOMING",
          leader_name: "Rahul Patil",
          created_at: "2026-06-01T10:00:00.000Z",
          config: {
            paymentConfig: { trekLeaderName: "Rahul Patil" },
            calculations: { totalCost: 4000 },
            payments: [],
            lifecycle: { currentStage: "BOOKING_OPEN" },
            meta: { createdBy: "Admin", createdByUsername: "admin", trekId: "TREK-002", paymentStatus: "PENDING" },
          },
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const req = {
      body: {
        paymentId: "GT-EVT-002",
        trekName: "Harihar Trek",
        trekId: "TREK-002",
        eventDate: "2026-06-21",
        participants: 18,
        status: "PENDING",
        config: { trekLeaderName: "Rahul Patil" },
        calculations: { totalCost: 4000 },
        lifecycle: { currentStage: "BOOKING_OPEN" },
        createdBy: "Admin",
        createdByUsername: "admin",
      },
    };
    const res = mockRes();

    await createTrekPayment(req, res);

    expect(mockFrom).toHaveBeenCalledWith("trek_events");
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "GT-EVT-002",
        trek_name: "Harihar Trek",
        leader_name: "Rahul Patil",
        status: "UPCOMING",
        config: expect.objectContaining({
          paymentConfig: expect.objectContaining({ trekLeaderName: "Rahul Patil" }),
          lifecycle: { currentStage: "BOOKING_OPEN" },
          meta: expect.objectContaining({ trekId: "TREK-002", paymentStatus: "PENDING" }),
        }),
      }),
      { onConflict: "event_id" }
    );
    expect(res._body.data).toEqual(expect.objectContaining({ paymentId: "GT-EVT-002", trekId: "TREK-002" }));
  });

  it("merges config, payments, and lifecycle updates without losing nested data", async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          event_id: "GT-EVT-003",
          trek_name: "Ratangad Trek",
          event_date: "2026-06-22",
          seats_total: 15,
          leader_name: "Rahul Patil",
          leader_id: "EMP-001",
          status: "UPCOMING",
          config: {
            paymentConfig: {
              trekLeaderName: "Rahul Patil",
              whatsappGroupLink: "https://chat.whatsapp.com/original",
            },
            calculations: { totalCost: 3000 },
            payments: [{ recipientType: "LEADER", amount: 1500, status: "PENDING" }],
            lifecycle: {
              currentStage: "BOOKING_OPEN",
              stageHistory: [{ stage: "CREATED" }],
              tasks: [{ taskKey: "assign_leader", status: "PENDING" }],
              notes: "",
            },
            meta: { createdBy: "Admin", createdByUsername: "admin", trekId: "TREK-003", paymentStatus: "PENDING" },
          },
        },
        error: null,
      }),
    };

    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          event_id: "GT-EVT-003",
          trek_name: "Ratangad Trek",
          event_date: "2026-06-22",
          seats_total: 15,
          leader_name: "Rahul Patil",
          status: "ONGOING",
          created_at: "2026-06-01T10:00:00.000Z",
          config: {
            paymentConfig: {
              trekLeaderName: "Rahul Patil",
              whatsappGroupLink: "https://chat.whatsapp.com/updated",
            },
            calculations: { totalCost: 3000 },
            payments: [{ recipientType: "LEADER", amount: 1500, status: "COMPLETED" }],
            lifecycle: {
              currentStage: "DEPARTURE",
              stageHistory: [{ stage: "CREATED" }, { stage: "DEPARTURE" }],
              tasks: [{ taskKey: "assign_leader", status: "DONE" }],
              notes: "Updated from admin",
            },
            meta: { createdBy: "Admin", createdByUsername: "admin", trekId: "TREK-003", paymentStatus: "IN_PROGRESS" },
          },
        },
        error: null,
      }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    const req = {
      params: { id: "GT-EVT-003" },
      body: {
        config: { whatsappGroupLink: "https://chat.whatsapp.com/updated" },
        payments: [{ recipientType: "LEADER", amount: 1500, status: "COMPLETED" }],
        status: "IN_PROGRESS",
        lifecycle: {
          currentStage: "DEPARTURE",
          stageHistory: [{ stage: "CREATED" }, { stage: "DEPARTURE" }],
          tasks: [{ taskKey: "assign_leader", status: "DONE" }],
          notes: "Updated from admin",
        },
      },
    };
    const res = mockRes();

    await updateTrekPayment(req, res);

    expect(updateChain.select).toHaveBeenCalled();
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ONGOING",
        config: expect.objectContaining({
          meta: expect.objectContaining({ paymentStatus: "IN_PROGRESS" }),
        }),
      })
    );
    expect(res._status).toBe(200);
    expect(res._body.data).toEqual(
      expect.objectContaining({
        paymentId: "GT-EVT-003",
        status: "IN_PROGRESS",
        lifecycle: expect.objectContaining({ currentStage: "DEPARTURE", notes: "Updated from admin" }),
        payments: [{ recipientType: "LEADER", amount: 1500, status: "COMPLETED" }],
        config: expect.objectContaining({ whatsappGroupLink: "https://chat.whatsapp.com/updated" }),
      })
    );
  });
});
