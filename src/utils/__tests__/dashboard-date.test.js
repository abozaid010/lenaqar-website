/**
 * Unit tests for dashboard date filter defaults.
 * Run with: node --test src/utils/__tests__/dashboard-date.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  fillMissingDashboardDateFilters,
  getDashboardDateDay,
  isDashboardDateBeforeToday,
} from "../dashboardDate.ts";

test("fillMissingDashboardDateFilters keeps explicit end_date before today", () => {
  const now = new Date(2026, 6, 31, 17, 0, 0); // 31 Jul 2026 local
  const filters = {
    start_date: "2026-07-11T00:00:00",
    end_date: "2026-07-30T23:59:59",
  };

  assert.equal(isDashboardDateBeforeToday(filters.end_date, now), true);

  const result = fillMissingDashboardDateFilters(filters, now);

  assert.equal(result.start_date, "2026-07-11T00:00:00");
  assert.equal(result.end_date, "2026-07-30T23:59:59");
  assert.equal(getDashboardDateDay(result.end_date), "2026-07-30");
});

test("fillMissingDashboardDateFilters fills missing end_date with today EOD", () => {
  const now = new Date(2026, 6, 31, 17, 0, 0);
  const result = fillMissingDashboardDateFilters(
    { start_date: "2026-07-22T00:00:00" },
    now,
  );

  assert.equal(result.start_date, "2026-07-22T00:00:00");
  assert.equal(result.end_date, "2026-07-31T23:59:59");
});

test("fillMissingDashboardDateFilters fills missing start_date with 7 days ago", () => {
  const now = new Date(2026, 6, 31, 17, 0, 0);
  const result = fillMissingDashboardDateFilters(
    { end_date: "2026-07-30T23:59:59" },
    now,
  );

  assert.equal(result.start_date, "2026-07-24T00:00:00");
  assert.equal(result.end_date, "2026-07-30T23:59:59");
});

test("fillMissingDashboardDateFilters preserves 22 Jul–30 Jul range on 31 Jul", () => {
  const now = new Date(2026, 6, 31, 12, 0, 0);
  const result = fillMissingDashboardDateFilters(
    {
      start_date: "2026-07-22T00:00:00",
      end_date: "2026-07-30T23:59:59",
    },
    now,
  );

  assert.deepEqual(result, {
    start_date: "2026-07-22T00:00:00",
    end_date: "2026-07-30T23:59:59",
  });
});
