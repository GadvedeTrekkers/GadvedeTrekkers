import test from "node:test";
import assert from "node:assert/strict";
import { findRentalEntry, rentalPath, rentalSlug } from "./rentalLookup.js";

const rentals = [
  { id: "8b3a", slug: "test-trek-shoes-rental", name: "TEST-Trek Shoes Rental" },
  { id: "r2", name: "Two Person Tent" },
  { id: "r3", slug: "hidden-tent", name: "Hidden Tent", active: false },
];
const villas = [{ id: "fbec", slug: "test-krishna-villa-lonavala", name: "TEST-Krishna Villa Lonavala" }];

test("finds a rental by slug and by id", () => {
  assert.equal(findRentalEntry("test-trek-shoes-rental", { rentals, villas }).id, "8b3a");
  assert.equal(findRentalEntry("8b3a", { rentals, villas }).id, "8b3a");
});

test("falls back to the slug made from the name when the record has no slug", () => {
  assert.equal(findRentalEntry("two-person-tent", { rentals, villas }).id, "r2");
});

test("villas listed on /rentals resolve too, flagged as Villas", () => {
  const v = findRentalEntry("test-krishna-villa-lonavala", { rentals, villas });
  assert.equal(v.id, "fbec");
  assert.equal(v.category, "Villas");
});

test("hidden (inactive) and unknown items are not found", () => {
  assert.equal(findRentalEntry("hidden-tent", { rentals, villas }), null);
  assert.equal(findRentalEntry("nope", { rentals, villas }), null);
  assert.equal(findRentalEntry("", { rentals, villas }), null);
  assert.equal(findRentalEntry("x"), null);
});

test("links use the slug, else the id", () => {
  assert.equal(rentalPath(rentals[0]), "/rentals/test-trek-shoes-rental");
  assert.equal(rentalPath({ id: "abc" }), "/rentals/abc");
  assert.equal(rentalSlug({ name: "A  B!" }), "a-b");
});
