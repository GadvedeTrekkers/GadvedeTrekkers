import test from "node:test";
import assert from "node:assert/strict";
import { readBookParams, productDetailPath, futureDateLabel, bookingSubject } from "./bookingLink.js";
import { buildBookingWhatsAppUrl } from "../../config/bookingConfig.js";

test("readBookParams accepts trekId, slug or trekName and ref", () => {
  assert.deepEqual(readBookParams("?trekId=vasota-fort-trek"), { slug: "vasota-fort-trek", ref: "" });
  assert.deepEqual(readBookParams("?trekName=Kalsubai%20Peak%20Trek&ref=REF-RP001"), { slug: "kalsubai-peak-trek", ref: "REF-RP001" });
  assert.deepEqual(readBookParams(""), { slug: "", ref: "" });
  assert.equal(readBookParams("?trekId=../../etc/passwd").slug, "etc-passwd");
});

test("productDetailPath goes to the right section", () => {
  assert.equal(productDetailPath({ productType: "trek" }, "a"), "/treks/a");
  assert.equal(productDetailPath({ productType: "tour" }, "a"), "/tours/a");
  assert.equal(productDetailPath({ productType: "camping" }, "a"), "/camping/a");
  assert.equal(productDetailPath({}, ""), "/treks");
});

test("futureDateLabel drops past dates and keeps future ones", () => {
  const now = new Date("2026-11-28T10:00:00");
  assert.equal(futureDateLabel("2026-10-30", now), "");
  assert.equal(futureDateLabel("2025-09-20", now), "");
  assert.equal(futureDateLabel("2026-12-05", now), "2026-12-05");
  assert.equal(futureDateLabel("", now), "");
});

test("the WhatsApp booking message carries the live product, no past date, only the official number", () => {
  const now = new Date("2026-11-28T10:00:00");
  const url = buildBookingWhatsAppUrl(
    bookingSubject({ name: "Vasota Fort Trek", productType: "trek", price: 1400, nextDate: "2026-10-30", location: "Pune" }, { ref: "REF-RP001", now })
  );
  const text = decodeURIComponent(url);
  assert.match(text, /Vasota Fort Trek/);
  assert.match(text, /₹1400/);
  assert.match(text, /Referral: REF-RP001/);
  assert.doesNotMatch(text, /2026-10-30/);
  assert.match(url, /919856112727/);
});
