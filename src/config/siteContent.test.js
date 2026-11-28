/* t129u: public copy and contact details come only from the admin API; nothing is built in. Run: node --test */
import test from "node:test";
import assert from "node:assert/strict";
import { getSiteContent, getSiteProfile, isSiteDataLoaded, loadSiteContent, setSiteData } from "./siteContent.js";
import { CONTACT } from "./contact.js";
import { OFFICIAL_WHATSAPP_NUMBER } from "./whatsappSetting.js";
import { organizationNode, pageSeo, TRIP_SEO } from "../seo/publicSeo.js";

const reset = () => setSiteData({ loaded: false, content: {}, profile: null });

test("before anything loads there is no copy and no contact detail except the admin WhatsApp default", () => {
  reset();
  assert.equal(isSiteDataLoaded(), false);
  assert.equal(getSiteContent("pages.about"), null);
  assert.equal(getSiteContent("home.stats"), null);
  assert.equal(CONTACT.email, "");
  assert.equal(CONTACT.companyName, "");
  assert.deepEqual(CONTACT.addressLines, []);
  assert.deepEqual(CONTACT.social, { instagram: "", youtube: "", facebook: "" });
  assert.deepEqual(CONTACT.phones, [OFFICIAL_WHATSAPP_NUMBER.slice(-10)]);
});

test("an empty section counts as not set", () => {
  setSiteData({ content: { "home.stats": { items: [] }, "pages.faq": { title: "", items: [] } } });
  assert.equal(getSiteContent("home.stats"), null);
  assert.equal(getSiteContent("pages.faq"), null);
});

test("loadSiteContent reads published content and the public profile from the API", async () => {
  reset();
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith("/api/site-content")) {
      return { ok: true, json: async () => ({ data: { "home.stats": { items: [{ value: "100+", label: "Trips" }] } } }) };
    }
    return { ok: true, json: async () => ({ data: { companyName: "Acme Treks", supportEmail: "hi@example.com", socials: { instagram: "https://instagram.com/x" }, address: { city: "Pune", state: "MH", country: "India" } } }) };
  };
  await loadSiteContent({ apiBase: "https://api.example.com", fetchImpl });
  assert.deepEqual(calls.sort(), ["https://api.example.com/api/settings/profile/public", "https://api.example.com/api/site-content"]);
  assert.equal(isSiteDataLoaded(), true);
  assert.equal(getSiteContent("home.stats").items[0].value, "100+");
  assert.equal(getSiteProfile().companyName, "Acme Treks");
  assert.equal(CONTACT.email, "hi@example.com");
  assert.deepEqual(CONTACT.addressLines, ["Acme Treks", "Pune, MH", "India"]);
  assert.equal(CONTACT.social.instagram, "https://instagram.com/x");
  const ld = JSON.parse(JSON.stringify(organizationNode));
  assert.equal(ld.email, "hi@example.com");
  assert.deepEqual(ld.sameAs, ["https://instagram.com/x"]);
  assert.equal(ld.address.addressLocality, "Pune");
  assert.equal(ld.priceRange, undefined);
});

test("a failing API leaves everything empty (no fallback copy) but marks loading done", async () => {
  reset();
  await loadSiteContent({ apiBase: "https://api.example.com", fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(isSiteDataLoaded(), true);
  assert.equal(getSiteContent("pages.about"), null);
  assert.equal(CONTACT.email, "");
  const ld = JSON.parse(JSON.stringify(organizationNode));
  assert.equal(ld.email, undefined);
  assert.equal(ld.sameAs, undefined);
  assert.equal(ld.address, undefined);
});

test("page titles come from admin; without them a plain title with no trip names or prices", () => {
  setSiteData({ loaded: true, content: {}, profile: { companyName: "Acme Treks" } });
  assert.deepEqual(pageSeo("treks"), { title: "Treks | Acme Treks", description: "" });
  assert.deepEqual(pageSeo("home"), { title: "Acme Treks", description: "" });
  assert.deepEqual(TRIP_SEO, {});
  setSiteData({ content: { "site.seo": { treksTitle: "Weekend treks", treksDescription: "From admin" } } });
  assert.deepEqual(pageSeo("treks"), { title: "Weekend treks", description: "From admin" });
  const ld = JSON.parse(JSON.stringify(organizationNode));
  assert.equal(ld.description, undefined);
});
