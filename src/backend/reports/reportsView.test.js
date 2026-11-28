import test from "node:test";
import assert from "node:assert/strict";
import {
  barPct, canViewReportInsights, dayLabel, fmtCompactINR, fmtINR, fmtPct, istToday, monthLabel, niceMax, presetRange, rangeProblem, reportsQuery, SOURCE_COLORS,
} from "./reportsView.js";

test("only Super Admin, Admin and Management see the insights", () => {
  for (const r of ["Super Admin", "super_admin", "Admin", "Management"]) assert.equal(canViewReportInsights(r), true, r);
  for (const r of ["Sales", "", undefined, "Guest"]) assert.equal(canViewReportInsights(r), false, String(r));
});

test("money and percent formatting", () => {
  assert.equal(fmtINR(123456.4), "₹1,23,456");
  assert.equal(fmtINR(null), "₹0");
  assert.equal(fmtCompactINR(950), "₹950");
  assert.equal(fmtCompactINR(12500), "₹12.5k");
  assert.equal(fmtCompactINR(123456), "₹1.23L");
  assert.equal(fmtCompactINR(25000000), "₹2.5Cr");
  assert.equal(fmtPct(50), "50%");
  assert.equal(fmtPct(33.333), "33.3%");
  assert.equal(fmtPct(undefined), "0%");
});

test("month and day labels", () => {
  assert.equal(monthLabel("2026-09"), "Sep 26");
  assert.equal(monthLabel("bad"), "bad");
  assert.equal(dayLabel("2026-11-03"), "3 Nov 26");
  assert.equal(dayLabel(null), "");
});

test("preset ranges are IST days", () => {
  const now = new Date("2026-11-27T20:00:00Z"); // 28 Nov 01:30 IST
  assert.equal(istToday(now), "2026-11-28");
  assert.deepEqual(presetRange("30d", now), { from: "2026-10-30", to: "2026-11-28" });
  assert.deepEqual(presetRange("90d", now), { from: "2026-08-31", to: "2026-11-28" });
  assert.deepEqual(presetRange("12m", now), { from: "2025-11-29", to: "2026-11-28" });
  assert.deepEqual(presetRange("all", now), { from: "", to: "" });
});

test("range problems", () => {
  assert.equal(rangeProblem({ from: "2026-02-01", to: "2026-01-01" }) !== "", true);
  assert.equal(rangeProblem({ from: "2026-01-01", to: "2026-01-01" }), "");
  assert.equal(rangeProblem({ from: "", to: "2026-01-01" }), "");
});

test("bar widths", () => {
  assert.equal(barPct(0, 100), 0);
  assert.equal(barPct(50, 100), 50);
  assert.equal(barPct(1, 1000), 2);
  assert.equal(barPct(5, 0), 0);
  assert.equal(barPct(500, 100), 100);
  assert.equal(niceMax(0), 1);
  assert.equal(niceMax(730), 1000);
  assert.equal(niceMax(1800), 2000);
  assert.equal(niceMax(4100), 5000);
});

test("query string only carries what is set, and every source has a colour", () => {
  assert.equal(reportsQuery({}), "");
  assert.equal(reportsQuery({ from: "2026-01-01", to: "", trip: "abc" }), "?from=2026-01-01&trip=abc");
  for (const k of ["instagram", "whatsapp", "google", "website", "referral_other", "unknown"]) assert.match(SOURCE_COLORS[k], /^#[0-9a-f]{6}$/);
});
