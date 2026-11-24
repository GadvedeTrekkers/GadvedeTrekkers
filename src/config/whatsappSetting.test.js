import test from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_WHATSAPP_NUMBER, getWhatsappNumber, waBase, waUrl, loadWhatsappSetting, setWhatsappNumber, formatWhatsappDisplay } from "./whatsappSetting.js";

test("defaults to the official number and builds wa.me links", () => {
  assert.equal(OFFICIAL_WHATSAPP_NUMBER, "919856112727");
  assert.equal(getWhatsappNumber(), "919856112727");
  assert.equal(waBase(), "https://wa.me/919856112727");
  assert.equal(waUrl("Hi there"), "https://wa.me/919856112727?text=Hi%20there");
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
