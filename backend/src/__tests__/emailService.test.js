/**
 * Unit tests for backend/src/services/emailService.js
 *
 * Run with: cd backend && npx vitest run
 *
 * All nodemailer calls are mocked — no real emails are sent.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ── Mock nodemailer before importing the service ── */
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
  },
}));

import nodemailer from "nodemailer";
import { createTransporter, sendTrekAssignmentEmail } from "../services/emailService.js";

/* ── Shared fixture ── */
const VALID_PAYLOAD = {
  leaderEmail: "rahul.patil@gadvede.com",
  leaderName: "Rahul Patil",
  trekName: "Kalsubai Trek",
  eventDate: "2026-05-15",
  participants: 20,
  leaderFee: 2500,
  whatsappGroupLink: "https://chat.whatsapp.com/test123",
};

/* ────────────────────────────────────────────────────────
   createTransporter
──────────────────────────────────────────────────────── */
describe("createTransporter", () => {
  it("calls nodemailer.createTransport with gmail service", () => {
    createTransporter();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ service: "gmail" })
    );
  });

  it("passes GMAIL_USER from env to auth.user", () => {
    process.env.GMAIL_USER = "test@gmail.com";
    createTransporter();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: expect.objectContaining({ user: "test@gmail.com" }) })
    );
    delete process.env.GMAIL_USER;
  });

  it("passes GMAIL_APP_PASSWORD from env to auth.pass", () => {
    process.env.GMAIL_APP_PASSWORD = "testpass123";
    createTransporter();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: expect.objectContaining({ pass: "testpass123" }) })
    );
    delete process.env.GMAIL_APP_PASSWORD;
  });
});

/* ────────────────────────────────────────────────────────
   sendTrekAssignmentEmail — env not configured
──────────────────────────────────────────────────────── */
describe("sendTrekAssignmentEmail — env not configured", () => {
  beforeEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    mockSendMail.mockReset();
  });

  it("returns { ok: false } when GMAIL_USER is missing", async () => {
    process.env.GMAIL_APP_PASSWORD = "somepass";
    const result = await sendTrekAssignmentEmail(VALID_PAYLOAD);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Email not configured");
  });

  it("returns { ok: false } when GMAIL_APP_PASSWORD is missing", async () => {
    process.env.GMAIL_USER = "test@gmail.com";
    const result = await sendTrekAssignmentEmail(VALID_PAYLOAD);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Email not configured");
  });

  it("returns { ok: false } when both env vars are missing", async () => {
    const result = await sendTrekAssignmentEmail(VALID_PAYLOAD);
    expect(result.ok).toBe(false);
  });

  it("does NOT call sendMail when env is not configured", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

/* ────────────────────────────────────────────────────────
   sendTrekAssignmentEmail — env configured, happy path
──────────────────────────────────────────────────────── */
describe("sendTrekAssignmentEmail — happy path", () => {
  beforeEach(() => {
    process.env.GMAIL_USER = "gadvedetrekkers@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "testapppassword";
    mockSendMail.mockReset().mockResolvedValue({ messageId: "msg-001" });
  });

  afterEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  it("returns { ok: true } on successful send", async () => {
    const result = await sendTrekAssignmentEmail(VALID_PAYLOAD);
    expect(result).toEqual({ ok: true });
  });

  it("calls sendMail once", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("sends to the correct leader email", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.to).toBe("rahul.patil@gadvede.com");
  });

  it("uses the correct sender name and email", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.from).toContain("Gadvede Trekkers");
    expect(mailOptions.from).toContain("gadvedetrekkers@gmail.com");
  });

  it("includes trek name in the subject", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.subject).toContain("Kalsubai Trek");
  });

  it("includes trek name in the HTML body", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).toContain("Kalsubai Trek");
  });

  it("includes leader name in the HTML body", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).toContain("Rahul Patil");
  });

  it("includes participant count in the HTML body", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).toContain("20");
  });

  it("includes formatted leader fee in the HTML body", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).toContain("2,500");
  });

  it("includes WhatsApp group link when provided", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).toContain("https://chat.whatsapp.com/test123");
  });

  it("omits WhatsApp section when no link provided", async () => {
    const payload = { ...VALID_PAYLOAD, whatsappGroupLink: "" };
    await sendTrekAssignmentEmail(payload);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).not.toContain("Join Group");
  });

  it("includes employee portal link in the HTML body", async () => {
    await sendTrekAssignmentEmail(VALID_PAYLOAD);
    const [mailOptions] = mockSendMail.mock.calls[0];
    expect(mailOptions.html).toContain("employee-login");
  });
});

/* ────────────────────────────────────────────────────────
   sendTrekAssignmentEmail — sendMail throws
──────────────────────────────────────────────────────── */
describe("sendTrekAssignmentEmail — transporter error", () => {
  beforeEach(() => {
    process.env.GMAIL_USER = "gadvedetrekkers@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "testapppassword";
    mockSendMail.mockReset().mockRejectedValue(new Error("SMTP connection refused"));
  });

  afterEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  it("throws when sendMail rejects", async () => {
    await expect(sendTrekAssignmentEmail(VALID_PAYLOAD)).rejects.toThrow("SMTP connection refused");
  });
});
