/**
 * Unit page trust helpers: arithmetic consistency + indexability.
 */

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function unitArithmetic(unit) {
  const total = num(unit?.totalPrice);
  const down = num(unit?.downPayment);
  const remaining = num(unit?.remainingAmount);
  if (total == null || down == null || remaining == null) {
    return { ok: true, skipped: true, delta: null, pct: null };
  }
  const sum = down + remaining;
  const delta = Math.abs(total - sum);
  const pct = total === 0 ? null : delta / Math.abs(total);
  const ok = pct != null && pct <= 0.01;
  return { ok, skipped: false, delta, pct, total, down, remaining, sum };
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

export function unitLastChecked(unit) {
  return (
    unit?.lastCheckedAt ||
    unit?.last_checked_at ||
    unit?.verifiedAt ||
    unit?.updatedAt ||
    null
  );
}

/**
 * Indexable opportunity pages need price, area, and delivery.
 * Paper/verification are rendered when present; mass-noindex on those
 * waits until the public catalog exposes them (see Phase 1 report).
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
  const arith = unitArithmetic(unit);
  if (!arith.skipped && !arith.ok) return false;
  return true;
}
