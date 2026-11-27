import test from "node:test";
import assert from "node:assert/strict";
import { villaStayTotal } from "./villaPricing.js";

const villa = { price: 7999, weekendPrice: 11999 };

test("defaults to one weekday night when no dates are picked", () => {
  assert.deepEqual(villaStayTotal(villa, "", ""), { nights: 1, weekdayNights: 1, weekendNights: 0, total: 7999 });
});
test("charges Fri and Sat nights at the weekend rate", () => {
  // Thu 3 Dec 2026 -> Sun 6 Dec 2026: Thu (weekday), Fri + Sat (weekend)
  assert.deepEqual(villaStayTotal(villa, "2026-12-03", "2026-12-06"), { nights: 3, weekdayNights: 1, weekendNights: 2, total: 7999 + 2 * 11999 });
});
test("uses the single price for every night when there is no weekend price", () => {
  assert.equal(villaStayTotal({ price: 5000 }, "2026-12-04", "2026-12-06").total, 10000);
});
