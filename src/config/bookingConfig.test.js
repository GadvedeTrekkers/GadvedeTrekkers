import test from "node:test";
import assert from "node:assert/strict";
import { buildBookingWhatsAppUrl, buildShareWhatsAppUrl } from "./bookingConfig.js";

test("booking URL keeps every emoji intact (regression: emoji showed as � in WhatsApp)", () => {
  const url = buildBookingWhatsAppUrl(
    { name: "Malvan Tarkarli with Scuba Diving and Watersports", productType: "tour", location: "Pune", price: 5500, guests: 2, referralCode: "AB12" },
    "30 Oct 2026",
  );
  assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?phone=919856112727&text=/);
  const text = decodeURIComponent(url.split("&text=")[1]);
  assert.equal(text, new URL(url).searchParams.get("text"));
  assert.ok(!text.includes("\uFFFD"));
  assert.equal(
    text,
    "Hi 👋\nI want to book:\n\n📍 Tour: Malvan Tarkarli with Scuba Diving and Watersports\n📅 Date: 30 Oct 2026\n🏙 City: Pune\n💰 Fees: ₹5500\n👥 Guests: 2\n🎁 Referral: AB12\n\nPlease confirm availability.",
  );
});

test("share URL has no recipient and keeps emoji", () => {
  const url = buildShareWhatsAppUrl({ name: "Kalsubai", price: 1200, nextDate: "6 Dec 2026" }, "https://www.gadvede.com/treks/kalsubai?ref=AB12");
  assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?text=/);
  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.ok(text.startsWith("Hi 👋  Join me on this trek!\n\n📍 Trek: Kalsubai\n📅 Date: 6 Dec 2026\n💰 Price: ₹1200\n\n👉 Book here: https://www.gadvede.com/treks/kalsubai?ref=AB12"));
  assert.ok(!text.includes("\uFFFD"));
});
