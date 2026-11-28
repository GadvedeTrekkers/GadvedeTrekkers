import test from "node:test";
import assert from "node:assert/strict";
import { parseLabelDate, isPastDateLabel, upcomingLabel, upcomingLabels } from "./upcomingDate.js";

const NOW = new Date("2026-11-28T10:00:00");

test("reads ISO and written dates", () => {
  assert.equal(parseLabelDate("2026-12-05").getDate(), 5);
  assert.equal(parseLabelDate("20 Sept 2025").getMonth(), 8);
  assert.equal(parseLabelDate("20-22 Sept 2025").getDate(), 20);
  assert.equal(parseLabelDate("Dec 5, 2026").getMonth(), 11);
  assert.equal(parseLabelDate("25 Mar 2026, 4:00 PM").getFullYear(), 2026);
});

test("labels without a year or text are unreadable (kept, not hidden)", () => {
  assert.equal(parseLabelDate("25 Mar, 4:00 PM"), null);
  assert.equal(parseLabelDate("On request"), null);
  assert.equal(isPastDateLabel("25 Mar, 4:00 PM", NOW), false);
  assert.equal(upcomingLabel("On request", NOW), "On request");
});

test("past dates are dropped; today and future stay", () => {
  assert.equal(isPastDateLabel("20 Sept 2025", NOW), true);
  assert.equal(isPastDateLabel("2026-10-30", NOW), true);
  assert.equal(isPastDateLabel("2026-03-27", NOW), true);
  assert.equal(isPastDateLabel("2026-11-28", NOW), false);
  assert.equal(isPastDateLabel("29 Nov 2026", NOW), false);
  assert.equal(upcomingLabel("20 Sept 2025", NOW), "");
  assert.equal(upcomingLabel("", NOW), "");
  assert.deepEqual(upcomingLabels(["20 Sept 2025", "5 Dec 2026", "On request"], NOW), ["5 Dec 2026", "On request"]);
});
