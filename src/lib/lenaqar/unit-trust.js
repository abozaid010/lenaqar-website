/**
 * Unit page trust helpers: arithmetic consistency + indexability.
 *
 * Egyptian resale identity (when over/أوفر is present):
 *   downPayment + remaining ≈ totalPrice + overPrice
 * because buyer cash (down) usually includes paid-to-developer + over.
 * Fallback: paidAmount + remaining ≈ totalPrice when paid is available.
 */

function num(value) {
  // Number(null) === 0 — treat null/undefined/blank as missing.
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function withinPct(a, b, pct = 0.01) {
  if (a == null || b == null) return false;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / denom <= pct;
}

export function unitArithmetic(unit) {
  const total = num(unit?.totalPrice ?? unit?.total_price);
  const down = num(unit?.downPayment ?? unit?.down_payment);
  const remaining = num(unit?.remainingAmount ?? unit?.remaining_amount);
  const over = num(unit?.overPrice ?? unit?.over_price) ?? 0;
  const paid = num(unit?.paidAmount ?? unit?.paid_amount);

  if (total == null || down == null || remaining == null) {
    return { ok: true, skipped: true, delta: null, pct: null };
  }

  // Incomplete breakdown (zeros) — do not treat as inconsistent.
  if (down === 0 && remaining === 0) {
    return { ok: true, skipped: true, delta: null, pct: null, total, down, remaining, over };
  }

  const expected = total + over;
  const sum = down + remaining;
  const okPrimary = withinPct(sum, expected);
  const okPaid =
    paid != null ? withinPct(paid + remaining, total) : false;
  const ok = okPrimary || okPaid;
  const delta = Math.abs(expected - sum);
  const pct = expected === 0 ? null : delta / Math.abs(expected);

  return {
    ok,
    skipped: false,
    delta,
    pct,
    total,
    down,
    remaining,
    over,
    sum,
    expected,
  };
}

/** Optional trust fields — shown only when the catalog provides them. */
export function unitPaperStatus(unit) {
  return (
    unit?.paperStatus ||
    unit?.papersStatus ||
    unit?.contractStatus ||
    unit?.ownershipStatus ||
    null
  );
}

export function unitVerificationLevel(unit) {
  return (
    unit?.verificationLevel ||
    unit?.verifyLevel ||
    unit?.trustLevel ||
    null
  );
}

/**
 * Explicit verification timestamps only — never fall back to updatedAt
 * (that would falsely label every listing as "checked").
 */
export function unitLastChecked(unit) {
  return (
    unit?.lastCheckedAt ||
    unit?.last_checked_at ||
    unit?.verifiedAt ||
    null
  );
}

/**
 * Indexable opportunity pages need price, area, and delivery.
 * Arithmetic failures hide inconsistent money splits in the UI; they must
 * not alone remove a otherwise-complete listing from the index.
 */
export function isOpportunityIndexable(unit) {
  if (!unit) return false;
  const price = num(unit.totalPrice);
  const area = num(unit.landArea);
  const delivery =
    unit.deliveryDate || unit.deliveryYear || unit.delivery || null;
  if (!(price > 0)) return false;
  if (!(area > 0)) return false;
  if (!delivery) return false;
  return true;
}
