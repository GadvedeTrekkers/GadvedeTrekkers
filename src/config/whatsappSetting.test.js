import test from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_WHATSAPP_NUMBER, getWhatsappNumber, waBase, waUrl, waSendUrl, toWellFormedText, loadWhatsappSetting, setWhatsappNumber, formatWhatsappDisplay } from "./whatsappSetting.js";

test("defaults to the official number; plain chat stays wa.me, prefilled text uses api.whatsapp.com/send", () => {
  assert.equal(OFFICIAL_WHATSAPP_NUMBER, "919856112727");
  assert.equal(getWhatsappNumber(), "919856112727");
  assert.equal(waBase(), "https://wa.me/919856112727");
  assert.equal(waUrl(), "https://wa.me/919856112727");
  assert.equal(waUrl("Hi there"), "https://api.whatsapp.com/send?phone=919856112727&text=Hi%20there");
  assert.equal(formatWhatsappDisplay(), "+91 98561 12727");
});

test("loads the admin setting; ignores failures and invalid values", async () => {
  await loadWhatsappSetting({ apiBase: "https://api.example", fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(getWhatsappNumber(), "919856112727");
  await loadWhatsappSetting({ apiBase: "https://api.example", fetchImpl: async () => ({ ok: true, json: async () => ({ data: { whatsappNumber: "12345" } }) }) });
  assert.equal(getWhatsappNumber(), "919856112727");
  let seen;
  await loadWhatsappSetting({ apiBase: "https://api.example", fetchImpl: async (u) => { seen = u; return { ok: true, json: async () => ({ data: { whatsappNumber: "919812345678" } }) }; } });
  assert.equal(seen, "https://api.example/api/settings/contact");
  assert.equal(getWhatsappNumber(), "919812345678");
  setWhatsappNumber("919856112727");
});

test("prefilled text with emoji round-trips exactly (no U+FFFD, no double encoding)", () => {
  const msg = "Hi 👋\nI want to book:\n\n📍 Tour: Malvan Tarkarli\n📅 Date: 30 Oct 2026\n🏙 City: Pune\n💰 Fees: ₹5500\n👥 Guests: 2\n🎁 Referral: AB12\n👨‍👩‍👧 ✔️ 🇮🇳";
  const url = waSendUrl(msg);
  assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?phone=919856112727&text=/);
  assert.doesNotMatch(url, /wa\.me/);
  const text = new URL(url).searchParams.get("text");
  assert.equal(text, msg);
  const raw = url.split("&text=")[1];
  assert.equal(decodeURIComponent(raw), msg);
  assert.ok(!decodeURIComponent(raw).includes("\uFFFD"));
  assert.ok(raw.includes("%F0%9F%91%8B"), "👋 encoded once as UTF-8");
  assert.ok(!raw.includes("%25"), "not double-encoded");
  assert.ok(!raw.includes("%EF%BF%BD"), "no replacement char");
});

test("share link has no phone; lone surrogates are dropped instead of throwing", () => {
  assert.equal(waSendUrl("Hi 👋", ""), "https://api.whatsapp.com/send?text=Hi%20%F0%9F%91%8B");
  const broken = "Trek 👋".slice(0, -1); // lone high surrogate
  assert.equal(toWellFormedText(broken), "Trek ");
  assert.equal(decodeURIComponent(waSendUrl(broken).split("&text=")[1]), "Trek ");
  assert.equal(waSendUrl("hi", "+91 98561-12727"), "https://api.whatsapp.com/send?phone=919856112727&text=hi");
});
