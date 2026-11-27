/* t83u confirmation email. Mocked transports only — nothing is sent. */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import { readFileSync } from "fs";
import {
  adminNotifyRecipients,
  buildRegistrationEmail,
  escapeHtml,
  sendRegistrationEmails,
} from "../services/registrationEmail.js";
import { createPaymentRegistrationsRouter } from "../routes/paymentRegistrations.routes.js";
import { fakeRegistrationDb } from "./support/fakeRegistrationDb.js";
import { listen } from "./support/fakeSupabase.js";

const ENV = { GMAIL_USER: "sender@example.test", GMAIL_APP_PASSWORD: "x" };
const ROW = {
  reference: "GTP-261127-AB2CD",
  event_name: "Harishchandragad Trek",
  price_option: "Pune", price_option_label: "From Pune",
  batch_date: "2026-11-28", batch_label: "Sat, 28 Nov, 2026", date_was_typed: false,
  pickup_point: "Fergusson College Main Gate, FC Road (09:00 PM)",
  price_per_person: 1399, participants_count: 2, total_amount: 2798, amount_paid: 1000,
  payment_mode: "UPI", payment_date: "2026-11-26", utr: "612345678901",
  full_name: "Asha <script>alert(1)</script> Patil", age: 27, gender: "Female",
  email: "asha@example.com", mobile: "9822011111",
  participants: [{ name: "Neha \"><img src=x onerror=alert(2)>", age: 24, gender: "Female" }],
};
const mockTx = (impl = async () => ({ messageId: "m1" })) => ({ sendMail: vi.fn(impl) });

describe("buildRegistrationEmail", () => {
  const mail = buildRegistrationEmail(ROW);
  it("contains every required detail in HTML and text", () => {
    for (const part of ["GTP-261127-AB2CD", "Harishchandragad Trek", "From Pune", "Sat, 28 Nov, 2026", "Fergusson College Main Gate",
      "2 × ₹1,399", "₹2,798", "₹1,000", "₹1,798", "612345678901", "Pending verification – we'll confirm shortly",
      "+91 98561 12727", "https://www.gadvede.com/"]) {
      expect(mail.text).toContain(part);
      expect(mail.html).toContain(escapeHtml(part));
    }
    expect(mail.subject).toBe("Payment details received – GTP-261127-AB2CD – Harishchandragad Trek");
  });
  it("escapes everything the customer typed", () => {
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&quot;&gt;&lt;img");
  });
  it("says fully paid when there is no balance and marks a typed date", () => {
    const m = buildRegistrationEmail({ ...ROW, amount_paid: 2798, date_was_typed: true, batch_date: "2027-01-09" });
    expect(m.text).toContain("Balance: ₹0 — fully paid");
    expect(m.text).toContain("(date you entered)");
  });
  it("does not mention MTDC (not in the site code yet)", () => {
    expect(mail.html).not.toMatch(/mtdc/i);
  });
});

describe("sendRegistrationEmails", () => {
  it("sends only to the customer's email, from 'Gadvede Trekkers'", async () => {
    const tx = mockTx();
    const out = await sendRegistrationEmails(ROW, { env: ENV, transporter: tx, log: () => {} });
    expect(out).toEqual({ customer: "sent", admin: "off" });
    expect(tx.sendMail).toHaveBeenCalledTimes(1);
    const msg = tx.sendMail.mock.calls[0][0];
    expect(msg.to).toBe("asha@example.com");
    expect(msg.from).toEqual({ name: "Gadvede Trekkers", address: "sender@example.test" });
    expect(msg.cc).toBeUndefined();
    expect(msg.bcc).toBeUndefined();
    expect(msg.text).toBeTruthy();
    expect(msg.html).toBeTruthy();
  });
  it("admin notice is off by default and on with ADMIN_NOTIFY_EMAIL", async () => {
    expect(adminNotifyRecipients({})).toEqual([]);
    expect(adminNotifyRecipients({ ADMIN_NOTIFY_EMAIL: "a@x.in, bad, b@y.com" })).toEqual(["a@x.in", "b@y.com"]);
    const tx = mockTx();
    const out = await sendRegistrationEmails(ROW, { env: { ...ENV, ADMIN_NOTIFY_EMAIL: "ops@example.test" }, transporter: tx, log: () => {} });
    expect(out).toEqual({ customer: "sent", admin: "sent" });
    expect(tx.sendMail.mock.calls[1][0].to).toEqual(["ops@example.test"]);
    expect(tx.sendMail.mock.calls[1][0].html).not.toContain("<script>");
  });
  it("skips when the mailer is not configured", async () => {
    const tx = mockTx(); const log = vi.fn();
    const out = await sendRegistrationEmails(ROW, { env: {}, transporter: tx, log });
    expect(out.customer).toBe("skipped");
    expect(tx.sendMail).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain("GTP-261127-AB2CD");
  });
  it("never throws and logs no personal data when sending fails", async () => {
    const tx = mockTx(async () => { const e = new Error("Invalid login asha@example.com"); e.code = "EAUTH"; throw e; });
    const log = vi.fn();
    const out = await sendRegistrationEmails(ROW, { env: ENV, transporter: tx, log });
    expect(out.customer).toBe("failed");
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain("EAUTH");
    for (const pii of ["asha@example.com", "Asha", "9822011111", "612345678901"]) expect(logged).not.toContain(pii);
  });
});

describe("POST /api/payment-registrations + email", () => {
  const EVENTS = JSON.parse(readFileSync(new URL("./fixtures/registrationEvents.json", import.meta.url), "utf8"));
  const NOW = new Date("2026-11-27T12:00:00+05:30");
  const shot = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9]).toString("base64")}`;
  const body = (utr) => ({
    eventSlug: "harishchandragad-trek", priceOption: "Pune", dateValue: "2026-11-28",
    pickupPoint: "Fergusson College Main Gate, FC Road (09:00 PM)", fullName: "Asha Patil", mobile: "9822011111",
    whatsappSameAsMobile: true, email: "asha@example.com", age: 27, gender: "Female", city: "Pune",
    emergencyName: "Ravi Patil", emergencyPhone: "9822022222", participantsCount: 1, participants: [],
    amountPaid: 1399, paymentDate: "2026-11-26", paymentMode: "UPI", utr, screenshot: shot, consent: true, formOpenMs: 60000,
  });
  let srv; let db; const calls = []; let mode = "ok";
  beforeAll(async () => {
    db = fakeRegistrationDb();
    const app = express();
    app.use(express.json({ limit: "10mb" }));
    app.use("/api/payment-registrations", createPaymentRegistrationsRouter({
      db: async () => db, listEvents: async () => EVENTS, now: () => NOW, log: () => {},
      sendEmails: (row) => { calls.push(row); if (mode === "fail") return Promise.reject(new Error("smtp down")); if (mode === "hang") return new Promise(() => {}); return Promise.resolve(); },
    }));
    srv = await listen(app);
  });
  afterAll(() => srv.close());
  const post = (b) => fetch(`${srv.url}/api/payment-registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

  it("emails the saved row after a successful save", async () => {
    expect((await post(body("EMAILOK1"))).status).toBe(201);
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.at(-1).email).toBe("asha@example.com");
    expect(calls.at(-1).reference).toMatch(/^GTP-/);
  });
  it("still saves and returns 201 when the email fails or hangs", async () => {
    mode = "fail";
    expect((await post(body("EMAILFAIL1"))).status).toBe(201);
    mode = "hang";
    expect((await post(body("EMAILHANG1"))).status).toBe(201);
    expect(db.tables.payment_registrations.map((r) => r.utr)).toEqual(expect.arrayContaining(["EMAILFAIL1", "EMAILHANG1"]));
  });
  it("sends nothing for honeypot or invalid submissions", async () => {
    const before = calls.length; mode = "ok";
    await post({ ...body("HONEY0001"), website: "spam" });
    await post({ ...body("BAD00001"), email: "nope" });
    expect(calls.length).toBe(before);
  });
});
