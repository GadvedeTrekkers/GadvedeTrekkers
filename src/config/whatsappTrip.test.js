import test from "node:test";
import assert from "node:assert/strict";
import { buildChatMessage, clearWhatsappTrip, currentPageLink, departureLabels, getWhatsappTrip, pickupLabels, setWhatsappTrip, tripChatUrl, withWhatsappUtm } from "./whatsappTrip.js";

test("UTM tagging: utm_source=whatsapp, old campaign params replaced, ?ref kept, hash dropped", () => {
  const u = new URL(withWhatsappUtm("https://www.gadvede.com/treks/kalsubai?ref=AB12&utm_source=google&gclid=x#dates", { content: "Kalsubai Trek" }));
  assert.equal(u.searchParams.get("utm_source"), "whatsapp");
  assert.equal(u.searchParams.get("utm_medium"), "chat");
  assert.equal(u.searchParams.get("utm_campaign"), "website_chat");
  assert.equal(u.searchParams.get("utm_content"), "kalsubai-trek");
  assert.equal(u.searchParams.get("ref"), "AB12");
  assert.equal(u.searchParams.get("gclid"), null);
  assert.equal(u.hash, "");
  assert.match(currentPageLink("/treks/kalsubai", { id: "kalsubai" }), /^https:\/\/www\.gadvede\.com\/treks\/kalsubai\?utm_source=whatsapp&/);
});

test("trip message: name, chosen date and pickup, page link; goes to the official number only", () => {
  setWhatsappTrip({ id: "kalsubai", name: "  Kalsubai   Night Trek ", dates: ["6 Dec 2026", "6 Dec 2026", ""], pickups: ["FC Road (9:00 PM)"] });
  assert.deepEqual(getWhatsappTrip(), { id: "kalsubai", name: "Kalsubai Night Trek", type: "", dates: ["6 Dec 2026"], pickups: ["FC Road (9:00 PM)"] });
  const pageUrl = currentPageLink("/treks/kalsubai");
  const msg = buildChatMessage({ date: "6 Dec 2026", pickup: "FC Road (9:00 PM)", pageUrl });
  assert.equal(msg, `Hi Gadvede Trekkers, I'm interested in Kalsubai Night Trek.\nDate: 6 Dec 2026\nPickup point: FC Road (9:00 PM)\nPlease share the details.\n\nPage: ${pageUrl}`);
  assert.doesNotMatch(msg, /\p{Extended_Pictographic}/u);
  const url = tripChatUrl({ pageUrl });
  assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?phone=919856112727&text=/);
  assert.equal(new URL(url).searchParams.get("text"), buildChatMessage({ pageUrl }));
  clearWhatsappTrip("other-trip");
  assert.ok(getWhatsappTrip());
  clearWhatsappTrip("kalsubai");
  assert.equal(getWhatsappTrip(), null);
  assert.match(buildChatMessage({ pageUrl: "https://www.gadvede.com/" }), /^Hi Gadvede Trekkers, I have a question/);
  setWhatsappTrip({ name: "" });
  assert.equal(getWhatsappTrip(), null);
});

test("date and pickup choices", () => {
  assert.deepEqual(departureLabels([{ label: "Sat, 6 Dec", city: "Pune" }, { label: "Sun, 7 Dec" }, {}]), ["Sat, 6 Dec · Pune", "Sun, 7 Dec"]);
  assert.deepEqual(pickupLabels([{ city: "Pune", points: [{ location: "FC Road", time: "9:00 PM" }] }]), ["FC Road (9:00 PM)"]);
  assert.deepEqual(pickupLabels([{ city: "Pune", points: [{ location: "FC Road" }] }, { city: "Mumbai", points: [{ location: "Dadar", time: "8:00 PM" }] }]), ["Pune · FC Road", "Mumbai · Dadar (8:00 PM)"]);
});
