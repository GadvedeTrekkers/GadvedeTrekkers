/* global Buffer, process */
/* Profile Setup (t84u/t85u): validation, auth, public projection, uploads, email Reply-To. Mocked DB/storage only. */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import zlib from "zlib";
import { fakeDb, listen } from "./support/fakeSupabase.js";
import createSettingsRouter, { decodeProfileImage, isProfileAdmin } from "../routes/settings.routes.js";
import {
  changedFields, emptyProfile, gstinChecksumOk, maskAccountNumber, publicProfile, validateProfile,
} from "../../../shared/businessProfile.js";
import { emailRouting } from "../services/businessProfile.js";
import { sendRegistrationEmails } from "../services/registrationEmail.js";
import { hasExif } from "../utils/jpegStrip.js";
import { pngChunkTypes, stripPngMetadata } from "../utils/pngStrip.js";

const SECRET = "test-jwt-secret-for-profile-tests-0123456789";
beforeAll(() => { process.env.JWT_SECRET = SECRET; });
const tok = (role) => jwt.sign({ username: `user_${role.replace(/\s/g, "")}`, name: role, role }, SECRET, { expiresIn: "5m" });

function valid(over = {}) {
  const p = emptyProfile();
  p.companyName = "Gadvede Trekkers";
  p.ownerName = "Pratik Ubhe";
  p.contact.primaryPhone = "98561 12727";
  p.emails.bookingConfirmation = "bookings@gadvede.example";
  return { ...p, ...over };
}

/* ---------- fixtures ---------- */
function jpegWithExif() {
  const app1Body = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), Buffer.from("GPS-LAT-18.52-LON-73.85", "latin1")]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([(app1Body.length + 2) >> 8, (app1Body.length + 2) & 255]), app1Body]);
  const app0Body = Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1");
  const app0 = Buffer.concat([Buffer.from([0xff, 0xe0, 0, app0Body.length + 2]), app0Body]);
  const sos = Buffer.from([0xff, 0xda, 0, 2, 0x12, 0x34, 0xff, 0xd9]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, app1, sos]);
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, c]);
}
function pngWithText() {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  const idat = zlib.deflateSync(Buffer.from([0, 255, 0, 0, 128]));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("tEXt", Buffer.from("Comment\0GPS 18.52,73.85", "latin1")),
    chunk("eXIf", Buffer.from("MM\0*GPSDATA", "latin1")), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- app ---------- */
const servers = [];
afterEach(async () => { while (servers.length) await servers.pop().close(); });
async function mk(extra = {}) {
  const db = fakeDb({ site_settings: [], activity_logs: [], ...extra });
  const objects = new Map();
  db.storage = {
    from: (bucket) => ({
      upload: async (path, buf, opts) => { if (objects.has(`${bucket}/${path}`)) return { error: { message: "exists" } }; objects.set(`${bucket}/${path}`, { buf, opts }); return { data: { path }, error: null }; },
      getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example.test/${bucket}/${path}` } }),
      createSignedUrl: async (path, secs) => ({ data: { signedUrl: `https://signed.example.test/${bucket}/${path}?e=${secs}` }, error: null }),
    }),
  };
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/settings", createSettingsRouter({ db: async () => db, log: () => {} }));
  const srv = await listen(app); servers.push(srv);
  return { url: srv.url, db, objects };
}
const call = (url, path, { method = "GET", body, role } = {}) => fetch(`${url}/api/settings${path}`, {
  method,
  headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(role !== undefined ? { Authorization: `Bearer ${tok(role)}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

/* ---------- validation ---------- */
describe("validateProfile", () => {
  it("requires only company name, owner name, phone and the booking-confirmation email", () => {
    const { errors } = validateProfile({ companyName: "", ownerName: "", contact: { primaryPhone: "" }, emails: { bookingConfirmation: "" } });
    expect(Object.keys(errors).sort()).toEqual(["companyName", "contact.primaryPhone", "emails.bookingConfirmation", "ownerName"]);
    expect(validateProfile(valid()).errors).toEqual({});
  });

  it("normalises phones and WhatsApp (defaults to 9856112727)", () => {
    const { profile } = validateProfile(valid({ whatsappNumber: "" }));
    expect(profile.whatsappNumber).toBe("919856112727");
    expect(profile.contact.primaryPhone).toBe("9856112727");
    expect(validateProfile(valid({ whatsappNumber: "+91 98220 11111" })).profile.whatsappNumber).toBe("919822011111");
    expect(validateProfile(valid({ whatsappNumber: "12345" })).errors.whatsappNumber).toBeTruthy();
    expect(validateProfile(valid({ whatsappNumber: "5123456789" })).errors.whatsappNumber).toBeTruthy();
  });

  it("validates each purpose email separately", () => {
    const p = valid(); p.emails = { receipts: "not-an-email", transactions: "tx@x.co", refunds: "a@b", bookingConfirmation: "BOOK@Gadvede.Example" };
    const { errors, profile } = validateProfile(p);
    expect(Object.keys(errors).sort()).toEqual(["emails.receipts", "emails.refunds"]);
    expect(profile.emails.bookingConfirmation).toBe("book@gadvede.example");
  });

  it("checks GSTIN checksum, PAN, PAN-in-GSTIN, IFSC, UPI, PIN, year and account number", () => {
    expect(gstinChecksumOk("27AAPFU0939F1ZV")).toBe(true);
    expect(gstinChecksumOk("27AAPFU0939F1ZW")).toBe(false);
    const p = valid();
    p.business = { ...p.business, gstin: "27aapfu0939f1zv", pan: "AAPFU0939F", yearEstablished: "2016" };
    p.bank = { accountName: "Gadvede Trekkers", bankName: "SBI", accountNumber: "1234 5678 9012", ifsc: "sbin0001234", upiId: "gadvede@okaxis" };
    p.address = { ...p.address, pin: "411004" };
    const ok = validateProfile(p);
    expect(ok.errors).toEqual({});
    expect(ok.profile.business.gstin).toBe("27AAPFU0939F1ZV");
    expect(ok.profile.bank).toMatchObject({ accountNumber: "123456789012", ifsc: "SBIN0001234" });

    const bad = valid();
    bad.business = { ...bad.business, gstin: "27AAPFU0939F1ZW", pan: "ABC", yearEstablished: "1800" };
    bad.bank = { ...bad.bank, accountNumber: "12ab", ifsc: "SBIN1001234", upiId: "no-at-sign" };
    bad.address = { ...bad.address, pin: "011004" };
    expect(Object.keys(validateProfile(bad).errors).sort()).toEqual([
      "address.pin", "bank.accountNumber", "bank.ifsc", "bank.upiId", "business.gstin", "business.pan", "business.yearEstablished",
    ]);
    const mismatch = valid(); mismatch.business = { ...mismatch.business, gstin: "27AAPFU0939F1ZV", pan: "ABCPE1234F" };
    expect(validateProfile(mismatch).errors["business.pan"]).toMatch(/does not match/);
  });

  it("keeps the stored account number when the form sends it masked or empty", () => {
    const p = valid(); p.bank = { ...p.bank, accountNumber: maskAccountNumber("123456789012") };
    expect(validateProfile(p, { currentAccountNumber: "123456789012" }).profile.bank.accountNumber).toBe("123456789012");
    expect(maskAccountNumber("123456789012")).toBe("••••••••9012");
  });

  it("checks social hosts, https-ifies links and rejects javascript: URLs; colours must be hex", () => {
    const p = valid();
    p.online = { website: "gadvede.com", instagram: "https://instagram.com/gadvede_trekkers", facebook: "https://evil.example/fb", youtube: "javascript:alert(1)", googleMaps: "https://maps.app.goo.gl/abc" };
    p.theme = { preset: "x", primary: "red", accent: "#ffcc00", mode: "neon" };
    const { errors, profile } = validateProfile(p);
    expect(Object.keys(errors).sort()).toEqual(["online.facebook", "online.youtube", "theme.primary"]);
    expect(profile.online.website).toBe("https://gadvede.com/");
    expect(profile.theme).toMatchObject({ preset: "custom", accent: "#FFCC00", mode: "light" });
  });

  it("only accepts image paths with the expected prefix", () => {
    const p = valid(); p.images = { logo: { path: "../etc/passwd.png" }, favicon: { path: "other/x.png" }, paymentQr: null, mtdcCertificate: null };
    const { errors } = validateProfile(p, { imagePrefixes: { logo: "branding/logo-", favicon: "branding/favicon-" } });
    expect(Object.keys(errors).sort()).toEqual(["images.favicon", "images.logo"]);
  });

  it("public projection never contains bank details or internal emails", () => {
    const p = validateProfile(valid({ bank: { accountName: "A", bankName: "B", accountNumber: "123456789012", ifsc: "SBIN0001234", upiId: "x@okaxis" } })).profile;
    p.emails = { receipts: "r@x.co", transactions: "t@x.co", refunds: "f@x.co", bookingConfirmation: "b@x.co" };
    p.contact.supportEmail = "hello@gadvede.example";
    const pub = JSON.stringify(publicProfile(p));
    for (const secret of ["123456789012", "SBIN0001234", "x@okaxis", "r@x.co", "t@x.co", "f@x.co", "b@x.co", "Pratik"]) expect(pub).not.toContain(secret);
    expect(pub).toContain("hello@gadvede.example");
  });

  it("changedFields lists dotted paths", () => {
    const a = valid(); const b = valid(); b.bank = { ...b.bank, ifsc: "SBIN0001234" }; b.companyName = "GT";
    expect(changedFields(a, b).sort()).toEqual(["bank.ifsc", "companyName"]);
  });
});

/* ---------- routes / auth ---------- */
describe("profile routes", () => {
  it("admin GET/PUT need a JWT and the Super Admin or Admin role", async () => {
    const { url } = await mk();
    expect((await call(url, "/profile")).status).toBe(401);
    expect((await call(url, "/profile", { method: "PUT", body: valid() })).status).toBe(401);
    for (const role of ["Operations", "Trek Leader", "Vendor", "Customer", ""]) {
      expect((await call(url, "/profile", { role })).status, role).toBe(403);
      expect((await call(url, "/profile", { method: "PUT", body: valid(), role })).status, role).toBe(403);
      expect((await call(url, "/profile/image", { method: "POST", body: { kind: "logo", dataUrl: "x" }, role })).status, role).toBe(403);
    }
    const r = await call(url, "/profile", { role: "Admin" });
    expect(r.status).toBe(200);
    const { data } = await r.json();
    expect(data.profile.whatsappNumber).toBe("919856112727");
    expect(data.meta).toMatchObject({ canEditSensitive: false, nextReceiptNumber: "GT-00001", stored: false });
    expect(isProfileAdmin({ role: "super_admin" })).toBe(true);
    const bad = await call(url, "/profile", { method: "GET", role: "Bogus" });
    expect(bad.status).toBe(403);
    const forged = await fetch(`${url}/api/settings/profile`, { headers: { Authorization: `Bearer ${jwt.sign({ role: "Super Admin" }, "wrong-secret")}` } });
    expect(forged.status).toBe(401);
  });

  it("PUT validates, saves, audits and masks the account number in responses and logs", async () => {
    const { url, db } = await mk();
    const res400 = await call(url, "/profile", { method: "PUT", role: "Super Admin", body: { ...valid(), ownerName: "" } });
    expect(res400.status).toBe(400);
    expect((await res400.json()).errors.ownerName).toBeTruthy();

    const body = valid(); body.bank = { ...body.bank, accountNumber: "123456789012", ifsc: "SBIN0001234" }; body.whatsappNumber = "9822011111";
    const ok = await call(url, "/profile", { method: "PUT", role: "Super Admin", body });
    expect(ok.status).toBe(200);
    const out = (await ok.json()).data;
    expect(out.profile.bank.accountNumber).toBe("••••••••9012");
    const stored = db.tables.site_settings.find((r) => r.key === "business.profile").value;
    expect(stored.bank.accountNumber).toBe("123456789012");
    expect(stored.whatsappNumber).toBeUndefined();
    expect(db.tables.site_settings.find((r) => r.key === "contact.whatsapp_number").value.number).toBe("919822011111");
    const log = db.tables.activity_logs.at(-1);
    expect(log).toMatchObject({ action: "SETTING_UPDATE", module: "settings", performed_by: "user_SuperAdmin", severity: "warning" });
    expect(log.details).not.toContain("123456789012");
    expect(log.details).toContain("9012");

    // contact endpoint and public profile agree on the number
    const contact = await (await fetch(`${url}/api/settings/contact`)).json();
    expect(contact.data.whatsappNumber).toBe("919822011111");
  });

  it("Admin (not Super Admin) can edit normal fields but not WhatsApp, bank or the payment QR", async () => {
    const { url } = await mk();
    const ok = await call(url, "/profile", { method: "PUT", role: "Admin", body: valid({ companyName: "Gadvede Trekkers Pvt" }) });
    expect(ok.status).toBe(200);
    const wa = await call(url, "/profile", { method: "PUT", role: "Admin", body: valid({ whatsappNumber: "9822011111" }) });
    expect(wa.status).toBe(403);
    const bankBody = valid(); bankBody.bank = { ...bankBody.bank, upiId: "attacker@okaxis" };
    const bank = await call(url, "/profile", { method: "PUT", role: "Admin", body: bankBody });
    expect(bank.status).toBe(403);
    expect((await bank.json()).fields).toEqual(["bank.upiId"]);
    expect((await call(url, "/profile/image", { method: "POST", role: "Admin", body: { kind: "paymentQr", dataUrl: "x" } })).status).toBe(403);
  });

  it("reverts the change when the audit write fails", async () => {
    const { url, db } = await mk();
    const orig = db.from;
    db.from = (n) => { const q = orig(n); if (n === "activity_logs") q.insert = () => ({ then: (res) => res({ data: null, error: { message: "down" } }) }); return q; };
    const r = await call(url, "/profile", { method: "PUT", role: "Super Admin", body: valid({ companyName: "Changed Name", whatsappNumber: "9822011111" }) });
    expect(r.status).toBe(500);
    db.from = orig;
    const now = (await (await call(url, "/profile", { role: "Super Admin" })).json()).data.profile;
    expect(now.companyName).toBe("Gadvede Trekkers");
    expect(now.whatsappNumber).toBe("919856112727");
  });

  it("public GET exposes only safe fields, and falls back to defaults when the DB fails", async () => {
    const { url, db } = await mk();
    const body = valid(); body.bank = { ...body.bank, accountNumber: "123456789012", upiId: "gadvede@okaxis" };
    body.emails = { receipts: "r@x.co", transactions: "t@x.co", refunds: "f@x.co", bookingConfirmation: "b@x.co" };
    body.contact.supportEmail = "hello@gadvede.example";
    expect((await call(url, "/profile", { method: "PUT", role: "Super Admin", body })).status).toBe(200);
    const r = await fetch(`${url}/api/settings/profile/public`);
    expect(r.headers.get("cache-control")).toMatch(/max-age=300/);
    const txt = await r.text();
    for (const s of ["123456789012", "gadvede@okaxis", "r@x.co", "t@x.co", "f@x.co", "b@x.co", "Pratik", "primaryPhone"]) expect(txt).not.toContain(s);
    const data = JSON.parse(txt).data;
    expect(Object.keys(data).sort()).toEqual(["address", "companyName", "faviconUrl", "logoUrl", "socials", "supportEmail", "tagline", "theme", "waLink", "website", "whatsappDisplay", "whatsappNumber"]);
    db.from = () => { throw new Error("db down"); };
    const fb = await (await fetch(`${url}/api/settings/profile/public`)).json();
    expect(fb.data).toMatchObject({ companyName: "Gadvede Trekkers", whatsappNumber: "919856112727" });
  });

  it("image upload strips EXIF/PNG text, enforces size, never overwrites, and private kinds use the private bucket", async () => {
    const { url, objects } = await mk();
    const logo = await call(url, "/profile/image", { method: "POST", role: "Admin", body: { kind: "logo", dataUrl: `data:image/png;base64,${pngWithText().toString("base64")}` } });
    expect(logo.status).toBe(201);
    const l = (await logo.json()).data;
    expect(l.path).toMatch(/^branding\/logo-\d{8}-[0-9a-f]{10}\.png$/);
    expect(l.url).toBe(`https://cdn.example.test/site-images/${l.path}`);
    const savedPng = objects.get(`site-images/${l.path}`);
    expect(savedPng.opts.upsert).toBe(false);
    expect(pngChunkTypes(savedPng.buf)).toEqual(["IHDR", "IDAT", "IEND"]);

    const qr = await call(url, "/profile/image", { method: "POST", role: "Super Admin", body: { kind: "paymentQr", dataUrl: `data:image/jpeg;base64,${jpegWithExif().toString("base64")}` } });
    expect(qr.status).toBe(201);
    const q = (await qr.json()).data;
    expect(q.url).toBe("");
    expect(q.previewUrl).toContain("business-docs/payment-qr/");
    expect(hasExif(objects.get(`business-docs/${q.path}`).buf)).toBe(false);

    const big = Buffer.concat([jpegWithExif().subarray(0, 2), Buffer.alloc(300 * 1024)]);
    expect((await call(url, "/profile/image", { method: "POST", role: "Admin", body: { kind: "favicon", dataUrl: `data:image/jpeg;base64,${big.toString("base64")}` } })).status).toBe(400);
    expect((await call(url, "/profile/image", { method: "POST", role: "Admin", body: { kind: "logo", dataUrl: "data:image/svg+xml;base64,PHN2Zz4=" } })).status).toBe(400);
    expect((await call(url, "/profile/image", { method: "POST", role: "Admin", body: { kind: "logo", dataUrl: "data:image/png;base64,AAAA" } })).status).toBe(400);
    expect((await call(url, "/profile/image", { method: "POST", role: "Admin", body: { kind: "banner", dataUrl: "x" } })).status).toBe(400);
  });

  it("decodeProfileImage + stripPngMetadata reject corrupt files", () => {
    const png = pngWithText(); png[png.length - 20] ^= 0xff;
    expect(stripPngMetadata(png)).toBeNull();
    expect(decodeProfileImage("logo", `data:image/png;base64,${png.toString("base64")}`).error).toBeTruthy();
  });
});

/* ---------- email wiring ---------- */
describe("emails use the profile's booking-confirmation address for Reply-To", () => {
  const ENV = { GMAIL_USER: "sender@example.test", GMAIL_APP_PASSWORD: "x" };
  const ROW = { reference: "GTP-261128-AB2CD", event_name: "Kalsubai Trek", email: "asha@example.com", full_name: "Asha", participants_count: 1, price_per_person: 1000, total_amount: 1000, amount_paid: 1000, payment_mode: "UPI", utr: "6123456789", mobile: "9822011111" };

  it("sets Reply-To and the display name; the sending account stays GMAIL_USER", async () => {
    const tx = { sendMail: vi.fn(async () => ({})) };
    const profile = valid({ companyName: "Gadvede Trekkers" });
    await sendRegistrationEmails(ROW, { env: ENV, transporter: tx, log: () => {}, profile });
    const msg = tx.sendMail.mock.calls[0][0];
    expect(msg.from).toEqual({ name: "Gadvede Trekkers", address: "sender@example.test" });
    expect(msg.replyTo).toBe("bookings@gadvede.example");
  });

  it("falls back to the old behaviour without a profile or with an invalid email", async () => {
    const tx = { sendMail: vi.fn(async () => ({})) };
    await sendRegistrationEmails(ROW, { env: ENV, transporter: tx, log: () => {} });
    expect(tx.sendMail.mock.calls[0][0].replyTo).toBeUndefined();
    expect(tx.sendMail.mock.calls[0][0].from.name).toBe("Gadvede Trekkers");
    const r = emailRouting({ companyName: "X\r\nBcc: evil", emails: { bookingConfirmation: "bad" }, contact: { supportEmail: "help@x.co" } });
    expect(r.senderName).not.toMatch(/[\r\n]/);
    expect(r.replyTo.bookingConfirmation).toBe("help@x.co");
    expect(emailRouting(null).replyTo.bookingConfirmation).toBeNull();
  });
});
