/**
 * Unit tests for dashboard date filter defaults + local→UTC API conversion.
 * Run with: node --test --experimental-strip-types src/utils/__tests__/dashboard-date.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  fillMissingDashboardDateFilters,
  getDashboardDateDay,
  isDashboardDateBeforeToday,
  localDayEndToUtcIso,
  localDayStartToUtcIso,
  toDashboardApiDateParams,
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

test("local day bounds convert to absolute UTC for the machine timezone", () => {
  const expectedStart = new Date(2026, 6, 30, 0, 0, 0, 0).toISOString();
  const expectedEnd = new Date(2026, 6, 30, 23, 59, 59, 999).toISOString();

  assert.equal(localDayStartToUtcIso("2026-07-30T00:00:00"), expectedStart);
  assert.equal(localDayEndToUtcIso("2026-07-30T23:59:59"), expectedEnd);
});

test("local end excludes timestamps that are next calendar day in local TZ", () => {
  const endUtc = localDayEndToUtcIso("2026-07-30");
  // One ms after local Jul 30 end — must be Jul 31 local.
  const justAfterLocalEnd = new Date(
    new Date(2026, 6, 30, 23, 59, 59, 999).getTime() + 1,
  ).toISOString();

  assert.ok(
    new Date(justAfterLocalEnd).getTime() > new Date(endUtc).getTime(),
  );
  assert.equal(
    new Date(justAfterLocalEnd).toLocaleDateString("en-CA"),
    "2026-07-31",
  );

  // Known production sample when TZ is UTC+3: 23:45Z Jul 30 → 02:45 Jul 31 local.
  if (new Date().getTimezoneOffset() === -180) {
    const lateUtcJuly30 = "2026-07-30T23:45:55.275554Z";
    assert.equal(endUtc, "2026-07-30T20:59:59.999Z");
    assert.ok(new Date(lateUtcJuly30).getTime() > new Date(endUtc).getTime());
    assert.equal(
      new Date(lateUtcJuly30).toLocaleDateString("en-CA"),
      "2026-07-31",
    );
  }
});

test("toDashboardApiDateParams converts both bounds and keeps other fields", () => {
  const api = toDashboardApiDateParams({
    owner_type: "owner",
    start_date: "2026-07-24T00:00:00",
    end_date: "2026-07-30T23:59:59",
    limit: 100,
  });

  assert.equal(
    api.start_date,
    new Date(2026, 6, 24, 0, 0, 0, 0).toISOString(),
  );
  assert.equal(
    api.end_date,
    new Date(2026, 6, 30, 23, 59, 59, 999).toISOString(),
  );
  assert.equal(api.owner_type, "owner");
  assert.equal(api.limit, 100);
});
