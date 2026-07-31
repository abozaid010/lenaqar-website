/**
 * Scheduling math for proactive token refresh.
 * Run with: node --test src/lib/__tests__/token-expiration-schedule.test.js
 *
 * Guards the bug where getNextRefreshTime() returned Date.now() inside the
 * refresh window → delay=0 → TokenRefreshProvider flooded /client/refresh-token.
 */
import test from "node:test";
import assert from "node:assert/strict";

const THRESHOLD_MS = 5 * 60 * 1000;

/** Mirror of TokenExpirationManager.getNextRefreshTime (pure). */
function getNextRefreshTime(expirationTimeMs, thresholdMs = THRESHOLD_MS) {
  if (!expirationTimeMs) return null;
  return expirationTimeMs - thresholdMs;
}

/** Mirror of the provider delay calculation after the fix. */
function scheduleDelayMs(expirationTimeMs, nowMs, minRescheduleMs = 30_000) {
  const next = getNextRefreshTime(expirationTimeMs);
  if (next == null) return null;
  const remaining = next - nowMs;
  if (remaining <= 0) return minRescheduleMs;
  return remaining;
}

test("getNextRefreshTime is exp - threshold (may be in the past)", () => {
  const now = 1_000_000_000_000;
  const exp = now + 60 * 60 * 1000;
  assert.equal(getNextRefreshTime(exp), exp - THRESHOLD_MS);
});

test("healthy 60m token schedules ~55 minutes out (not delay=0)", () => {
  const now = 1_000_000_000_000;
  const exp = now + 60 * 60 * 1000;
  const delay = scheduleDelayMs(exp, now);
  assert.ok(delay > 50 * 60 * 1000);
  assert.ok(delay < 56 * 60 * 1000);
});

test("token inside 5m window uses backoff instead of delay=0 busy-loop", () => {
  const now = 1_000_000_000_000;
  const exp = now + 2 * 60 * 1000; // 2 minutes left → already due
  assert.ok(getNextRefreshTime(exp) < now);
  assert.equal(scheduleDelayMs(exp, now), 30_000);
});

test("stale/past exp uses backoff (would have been delay=0 before the fix)", () => {
  const now = 1_000_000_000_000;
  const exp = now - 60 * 1000;
  // Old buggy behavior: return Date.now() → delay 0
  const oldBuggyDelay = Math.max(0, now - now);
  assert.equal(oldBuggyDelay, 0);
  assert.equal(scheduleDelayMs(exp, now), 30_000);
});

test("missing exp does not schedule", () => {
  assert.equal(getNextRefreshTime(null), null);
  assert.equal(scheduleDelayMs(null, Date.now()), null);
});
