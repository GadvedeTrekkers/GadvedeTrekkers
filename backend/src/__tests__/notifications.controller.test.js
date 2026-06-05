/**
 * Unit tests for backend/src/controllers/notifications.controller.js
 *
 * Run with: cd backend && npx vitest run
 *
 * Supabase admin client and emailService are fully mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockSendEmail } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSendEmail: vi.fn(),
}));

function buildChain(terminalResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(terminalResult),
    order: vi.fn().mockResolvedValue(terminalResult),
  };
}

vi.mock("../config/supabaseAdminClient.js", () => ({
  default: { from: mockFrom },
}));

vi.mock("../services/emailService.js", () => ({
  sendTrekAssignmentEmail: mockSendEmail,
}));

import { notifyTrekAssigned, getLeaderTreks } from "../controllers/notifications.controller.js";

function mockRes() {
  return {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
}

const VALID_BODY = {
  leaderEmail: "rahul.patil@gadvede.com",
  leaderName: "Rahul Patil",
  leaderId: "EMP-SEED-001",
  trekName: "Kalsubai Trek",
  trekId: "TREK-001",
  eventDate: "2026-05-15",
  participants: 20,
  leaderFee: 2500,
  whatsappGroupLink: "https://chat.whatsapp.com/test",
  config: { trekLeaderName: "Rahul Patil", leaderFee: 2500 },
};

describe("notifyTrekAssigned - input validation", () => {
  it("returns 400 when leaderEmail is missing", async () => {
    const req = { body: { ...VALID_BODY, leaderEmail: undefined } };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.error).toMatch(/leaderEmail/);
  });

  it("returns 400 when trekName is missing", async () => {
    const req = { body: { ...VALID_BODY, trekName: undefined } };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it("returns 400 when eventDate is missing", async () => {
    const req = { body: { ...VALID_BODY, eventDate: undefined } };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it("returns 400 when body is empty", async () => {
    const req = { body: {} };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(400);
  });

  it("returns 400 when body is null/undefined", async () => {
    const req = { body: null };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(400);
  });
});

describe("notifyTrekAssigned - happy path", () => {
  beforeEach(() => {
    mockFrom.mockImplementation(() => buildChain({ data: { id: 1, event_id: "GT-EVT-TEST" }, error: null }));
    mockSendEmail.mockResolvedValue({ ok: true });
  });

  it("returns 200 with success: true", async () => {
    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  it("returns email: { ok: true } when email sends successfully", async () => {
    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._body.data.email).toEqual({ ok: true });
  });

  it("passes correct fields to sendTrekAssignmentEmail", async () => {
    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        leaderEmail: "rahul.patil@gadvede.com",
        leaderName: "Rahul Patil",
        trekName: "Kalsubai Trek",
        eventDate: "2026-05-15",
        participants: 20,
        leaderFee: 2500,
      })
    );
  });

  it("queries Supabase with trek_name and event_date to check for existing record", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(mockFrom).toHaveBeenCalledWith("trek_events");
  });
});

describe("notifyTrekAssigned - graceful failure", () => {
  it("still returns 200 when Supabase upsert fails", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    }));
    mockSendEmail.mockResolvedValue({ ok: true });

    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  it("still returns 200 when Supabase throws an exception", async () => {
    mockFrom.mockImplementation(() => { throw new Error("Network error"); });
    mockSendEmail.mockResolvedValue({ ok: true });

    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  it("still returns 200 when email sending throws", async () => {
    mockFrom.mockImplementation(() => buildChain({ data: { id: 1 }, error: null }));
    mockSendEmail.mockRejectedValue(new Error("SMTP error"));

    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.data.email.ok).toBe(false);
    expect(res._body.data.email.reason).toContain("SMTP error");
  });

  it("reports supabase: false when DB save fails", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    }));
    mockSendEmail.mockResolvedValue({ ok: true });

    const req = { body: VALID_BODY };
    const res = mockRes();
    await notifyTrekAssigned(req, res);
    expect(res._body.data.supabase).toBe(false);
  });
});

describe("getLeaderTreks", () => {
  const TREK_ROWS = [
    { id: 1, trek_name: "Kalsubai Trek", event_date: "2026-05-15", leader_name: "Rahul Patil" },
    { id: 2, trek_name: "Harishchandragad", event_date: "2026-06-20", leader_name: "Rahul Patil" },
  ];

  beforeEach(() => {
    delete globalThis.process.env.FEATURE_CANONICAL_EVENT_MAPPER;
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: TREK_ROWS, error: null }),
    }));
  });

  it("returns 200 with the leader's treks", async () => {
    const req = { params: { leaderName: "Rahul Patil" } };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.data).toHaveLength(2);
  });

  it("decodes URL-encoded leader name", async () => {
    const req = { params: { leaderName: "Rahul%20Patil" } };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(res._body.success).toBe(true);
  });

  it("returns empty array when leader has no assigned treks", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));
    const req = { params: { leaderName: "Unknown Leader" } };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(res._body.data).toEqual([]);
  });

  it("returns 400 when leaderName param is missing", async () => {
    const req = { params: {} };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it("returns 500 when Supabase returns an error", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "Connection failed" } }),
    }));
    const req = { params: { leaderName: "Rahul Patil" } };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
    expect(res._body.error).toContain("Connection failed");
  });

  it("returns treks ordered by event_date ascending", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: TREK_ROWS, error: null }),
    };
    mockFrom.mockReturnValue(chain);
    const req = { params: { leaderName: "Rahul Patil" } };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(chain.order).toHaveBeenCalledWith("event_date", { ascending: true });
  });

  it("queries trek_events table with correct leader_name", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: TREK_ROWS, error: null }),
    };
    mockFrom.mockReturnValue(chain);
    const req = { params: { leaderName: "Rahul Patil" } };
    const res = mockRes();
    await getLeaderTreks(req, res);
    expect(mockFrom).toHaveBeenCalledWith("trek_events");
    expect(chain.eq).toHaveBeenCalledWith("leader_name", "Rahul Patil");
  });

  it("returns canonical leader event records when canonicalEventMapper flag is enabled", async () => {
    globalThis.process.env.FEATURE_CANONICAL_EVENT_MAPPER = "true";
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 1,
          event_id: "GT-EVT-TEST",
          trek_name: "Kalsubai Trek",
          event_date: "2026-05-15T00:00:00.000Z",
          leader_name: "Rahul Patil",
          seats_total: 24,
          status: "UPCOMING",
          config: {
            paymentConfig: {
              trekLeaderName: "Rahul Patil",
              whatsappGroupLink: "https://chat.whatsapp.com/test",
            },
            calculations: { leaderFee: 2500 },
            payments: [{ recipientType: "LEADER", amount: 2500 }],
            meta: { trekId: "TREK-001" },
          },
          created_at: "2026-05-01T10:00:00.000Z",
        }],
        error: null,
      }),
    }));

    const req = { params: { leaderName: "Rahul Patil" } };
    const res = mockRes();
    await getLeaderTreks(req, res);

    expect(res._status).toBe(200);
    expect(res._body.data).toEqual([
      expect.objectContaining({
        paymentId: "GT-EVT-TEST",
        trekName: "Kalsubai Trek",
        trekId: "TREK-001",
        eventDate: "2026-05-15",
        participants: 24,
        status: "UPCOMING",
        canonicalEvent: true,
        source: "backend",
        config: expect.objectContaining({
          trekLeaderName: "Rahul Patil",
          whatsappGroupLink: "https://chat.whatsapp.com/test",
        }),
        calculations: { leaderFee: 2500 },
      }),
    ]);
  });
});
