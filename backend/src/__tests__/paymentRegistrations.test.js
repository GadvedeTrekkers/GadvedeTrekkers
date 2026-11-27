import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { createPaymentRegistrationsRouter, validateSubmission } from "../routes/paymentRegistrations.routes.js";
import { stripJpegMetadata, hasExif } from "../utils/jpegStrip.js";
import { registrationOptionsFor, OTHER_DATE, OTHER_PICKUP } from "../../../shared/registrationOptions.js";
import { fakeRegistrationDb } from "./support/fakeRegistrationDb.js";
import { listen } from "./support/fakeSupabase.js";

const EVENTS = JSON.parse(readFileSync(new URL("./fixtures/registrationEvents.json", import.meta.url), "utf8"));
const NOW = new Date("2026-11-27T12:00:00+05:30");
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";

// Minimal JPEG: SOI, APP1 "Exif" with fake GPS bytes, a COM segment, SOS + 2 data bytes, EOI.
function jpegWithExif() {
  const app1Body = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), Buffer.from("GPS-LAT-18.52-LON-73.85", "latin1")]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([(app1Body.length + 2) >> 8, (app1Body.length + 2) & 255]), app1Body]);
  const app0Body = Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1");
  const app0 = Buffer.concat([Buffer.from([0xff, 0xe0, 0, app0Body.length + 2]), app0Body]);
  const com = Buffer.concat([Buffer.from([0xff, 0xfe, 0, 7]), Buffer.from("hello", "latin1")]);
  const sos = Buffer.from([0xff, 0xda, 0, 2, 0x12, 0x34, 0xff, 0xd9]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, app1, com, sos]);
}
const shot = () => `data:image/jpeg;base64,${jpegWithExif().toString("base64")}`;

function validBody(over = {}) {
  return {
    eventSlug: "harishchandragad-trek", priceOption: "Pune", dateValue: "2026-11-28",
    pickupPoint: "Fergusson College Main Gate, FC Road (09:00 PM)",
    fullName: "Asha Patil", mobile: "+91 98220 11111", whatsappSameAsMobile: true, email: "asha@example.com",
    age: 27, gender: "Female", city: "Pune", emergencyName: "Ravi Patil", emergencyPhone: "9822022222",
    participantsCount: 2, participants: [{ name: "Neha Patil", age: 24, gender: "Female", mobile: "" }],
    amountPaid: 2798, paymentDate: "2026-11-26", paymentMode: "UPI", utr: "6123 4567 8901",
    screenshot: shot(), consent: true, website: "", formOpenMs: 60000, ...over,
  };
}

describe("registrationOptionsFor", () => {
  const by = (slug) => registrationOptionsFor(EVENTS.find((e) => e.slug === slug), { now: NOW });
  it("uses departure plans for price and pickup points (Pune vs Kasara)", () => {
    const o = by("harishchandragad-trek");
    expect(o.priceOptions.map((p) => [p.key, p.price])).toEqual([["Pune", 1399], ["Kasara", 1399]]);
    expect(o.pickupsByOption.Kasara).toEqual(["Kasara Station (11:15 PM)", "Kasara Ghat (11:45 PM)", OTHER_PICKUP]);
    expect(o.dates.map((d) => d.date)).toEqual(["2026-11-28", "2026-12-05"]);
  });
  it("uses pricingOptions lines for tours and matches pickup strings by city", () => {
    const o = by("malvan-tarkarli-with-scuba-diving-and-watersports");
    expect(o.priceOptions.map((p) => [p.key, p.price])).toEqual([["Pune", 5500], ["Mumbai", 6500], ["Malvan to Malvan", 4500]]);
    expect(o.pickupsByOption.Mumbai[0]).toMatch(/^Mumbai/);
    expect(o.pickupsByOption["Malvan to Malvan"]).toEqual([OTHER_PICKUP]);
  });
  it("falls back to base price when there are no plans or options", () => {
    expect(by("alibaug-camping").priceOptions).toEqual([{ key: "Per person", label: "Per person", price: 1000 }]);
  });
});

describe("jpegStrip", () => {
  it("removes EXIF/GPS and comments but keeps image data", () => {
    const raw = jpegWithExif();
    expect(hasExif(raw)).toBe(true);
    const clean = stripJpegMetadata(raw);
    expect(hasExif(clean)).toBe(false);
    expect(clean.toString("latin1")).not.toContain("GPS-LAT");
    expect(clean.toString("latin1")).not.toContain("hello");
    expect(clean.subarray(-4)).toEqual(Buffer.from([0x12, 0x34, 0xff, 0xd9]));
  });
  it("rejects non-JPEG data", () => {
    expect(stripJpegMetadata(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});

describe("validateSubmission", () => {
  const ev = EVENTS.find((e) => e.slug === "harishchandragad-trek");
  it("recomputes price and total on the server", () => {
    const { row, errors } = validateSubmission(validBody({ pricePerPerson: 1, totalAmount: 1 }), ev, { now: NOW });
    expect(errors).toBeUndefined();
    expect(row.price_per_person).toBe(1399);
    expect(row.total_amount).toBe(2798);
    expect(row.mobile).toBe("9822011111");
    expect(row.whatsapp).toBe("9822011111");
    expect(row.utr).toBe("612345678901");
    expect(row.status).toBe("pending_verification");
  });
  it("rejects a pickup that belongs to another departure, bad mobile, missing extra participant", () => {
    const { errors } = validateSubmission(validBody({ pickupPoint: "Kasara Station (11:15 PM)", mobile: "12345", participants: [] }), ev, { now: NOW });
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["pickupPoint", "mobile", "participants.0.name"]));
  });
  it("accepts 'other date' with a typed date", () => {
    const { row } = validateSubmission(validBody({ dateValue: OTHER_DATE, otherDate: "2027-01-09" }), ev, { now: NOW });
    expect(row.batch_date).toBe("2027-01-09");
    expect(row.date_was_typed).toBe(true);
  });
  it("requires consent, UTR and a screenshot (except cash)", () => {
    const { errors } = validateSubmission(validBody({ consent: false, utr: "", screenshot: "" }), ev, { now: NOW });
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["consent", "utr", "screenshot"]));
    const cash = validateSubmission(validBody({ paymentMode: "Cash", screenshot: "", utr: "RCPT-12" }), ev, { now: NOW });
    expect(cash.errors).toBeUndefined();
  });
});

describe("routes", () => {
  let srv; let db; const token = () => jwt.sign({ username: "pratik.ubhe", role: "Super Admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  beforeAll(async () => {
    db = fakeRegistrationDb();
    const app = express();
    app.use(express.json({ limit: "10mb" }));
    app.use("/api/payment-registrations", createPaymentRegistrationsRouter({ db: async () => db, listEvents: async () => EVENTS, now: () => NOW, submitLimitPer15Min: 4, log: () => {} }));
    srv = await listen(app);
  });
  afterAll(() => srv.close());
  const post = (body, headers = {}) => fetch(`${srv.url}/api/payment-registrations`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

  it("GET /events lists only registrable events (no villa)", async () => {
    const r = await (await fetch(`${srv.url}/api/payment-registrations/events`)).json();
    expect(r.data.map((e) => e.slug)).not.toContain("krishna-villa");
    expect(r.data.map((e) => e.slug)).toContain("harishchandragad-trek");
  });
  it("POST saves pending_verification with a stripped screenshot; duplicate UTR → 409", async () => {
    const res = await post(validBody(), { "x-forwarded-for": "1.1.1.1" });
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.reference).toMatch(/^GTP-261127-[A-Z2-9]{5}$/);
    const saved = db.tables.payment_registrations[0];
    expect(saved.status).toBe("pending_verification");
    expect(saved.screenshot_path).toBe(`2026-11/${data.reference}.jpg`);
    expect(hasExif(db.objects.get(`payment-proofs/${saved.screenshot_path}`))).toBe(false);
    expect((await post(validBody(), { "x-forwarded-for": "1.1.1.1" })).status).toBe(409);
  });
  it("honeypot pretends success and stores nothing", async () => {
    const before = db.tables.payment_registrations.length;
    const res = await post(validBody({ website: "http://spam", utr: "HONEY1234" }), { "x-forwarded-for": "2.2.2.2" });
    expect(res.status).toBe(201);
    expect(db.tables.payment_registrations.length).toBe(before);
  });
  it("rate limits per client", async () => {
    const codes = [];
    for (let i = 0; i < 6; i += 1) codes.push((await post(validBody({ utr: `RL${i}0000` }), { "x-forwarded-for": "9.9.9.9" })).status);
    expect(codes.slice(0, 4).every((c) => c === 201)).toBe(true);
    expect(codes[5]).toBe(429);
  });
  it("admin routes need the admin JWT; there is no delete route", async () => {
    expect((await fetch(`${srv.url}/api/payment-registrations`)).status).toBe(401);
    const id = db.tables.payment_registrations[0].id;
    expect((await fetch(`${srv.url}/api/payment-registrations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" })).status).toBe(401);
    expect((await fetch(`${srv.url}/api/payment-registrations/${id}/screenshot`)).status).toBe(401);
    expect((await fetch(`${srv.url}/api/payment-registrations/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } })).status).toBe(404);
  });
  it("admin can list, filter, open screenshot and verify/reject", async () => {
    const auth = { Authorization: `Bearer ${token()}` };
    const list = await (await fetch(`${srv.url}/api/payment-registrations?status=pending_verification&event=harishchandragad-trek`, { headers: auth })).json();
    expect(list.data.length).toBeGreaterThan(0);
    expect(list.data[0]).not.toHaveProperty("screenshot_path");
    const id = list.data[0].id;
    const shotRes = await (await fetch(`${srv.url}/api/payment-registrations/${id}/screenshot`, { headers: auth })).json();
    expect(shotRes.data.url).toContain("payment-proofs/");
    const bad = await fetch(`${srv.url}/api/payment-registrations/${id}`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) });
    expect(bad.status).toBe(400);
    const ok = await (await fetch(`${srv.url}/api/payment-registrations/${id}`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ status: "verified", adminNote: "UTR matched in bank" }) })).json();
    expect(ok.data.status).toBe("verified");
    expect(ok.data.verifiedBy).toBe("pratik.ubhe");
    expect(db.tables.activity_logs.at(-1).module).toBe("payment-registrations");
  });
});
