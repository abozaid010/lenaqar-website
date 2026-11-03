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

/**
 * Installment duration for public display. CRM sometimes stores money
 * amounts in installment_years (e.g. LNk7qZIF → 293000). Only whole years
 * in a realistic Egyptian residential plan range are shown — never invent
 * a replacement.
 *
 * Ceiling evidence (independent of SITE.cashMultipleBounds, which is a
 * price/cash *ratio* max of 40×, not years):
 * - Catalog fixture TMG plan uses 11 years (validate-unit.test.js).
 * - Egyptian primary/resale developer plans in market practice are
 *   typically 3–15 years; values ≥100 are money-scale field pollution.
 * - 40 is an absolute hard ceiling above any known residential plan so
 *   valid 10–15y plans still show, while 293000-class typos do not.
 */
export const INSTALLMENT_YEARS_MAX = 40;

export function plausibleInstallmentYears(value) {
  const n = num(value);
  if (n == null) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > INSTALLMENT_YEARS_MAX) return null;
  return n;
}

/**
 * When down+remaining disagree with total(+over), strip split fields from
 * the public payload so they cannot leak via RSC/HTML/JSON-LD. Keeps
 * totalPrice. Also nulls installmentYears — a lone duration without amounts
 * still implies a plan in RSC. Sets paymentSplitHidden so UI can show the
 * inconsistency notice even after fields are null (arith would otherwise
 * look "skipped").
 */
export function applyPublicMoneyTrust(unit, evidence = {}) {
  if (!unit || typeof unit !== "object") return unit;
  const assessment = assessPublicMoney(unit, evidence);
  if (assessment.showSplit) {
    return unit;
  }
  return {
    ...unit,
    paymentSplitHidden: true,
    downPayment: null,
    remainingAmount: null,
    overPrice: null,
    installmentAmountYearly: null,
    installmentYears: null,
    cashMultiple: null,
  };
}

/** Internal evidence never becomes part of the public object.
 * A paid+remaining identity supports total, but cannot validate a conflicting
 * cash/down field. Keep the whole split hidden until those claims reconcile.
 */
export function assessPublicMoney(unit, evidence = {}) {
  const arithmetic = unitArithmetic({ ...unit, paidAmount: evidence.paidAmount ?? unit?.paidAmount });
  if (unit?.paymentSplitHidden) return { showSplit: false, reason: "already_hidden" };
  if (arithmetic.skipped) {
    // A complete annual schedule can establish the split without a separate
    // remaining-balance field. Do not infer any missing amount for publication.
    const total = num(unit?.totalPrice);
    const down = num(unit?.downPayment);
    const yearly = num(unit?.installmentAmountYearly);
    const years = plausibleInstallmentYears(unit?.installmentYears);
    const remaining = num(unit?.remainingAmount);
    const over = num(unit?.overPrice) ?? 0;
    if (remaining == null && total > 0 && down >= 0 && yearly > 0 && years &&
        withinPct(down + yearly * years, total + over)) {
      return { showSplit: true, reason: "annual_identity" };
    }
    const hasClaims = [unit?.downPayment, unit?.remainingAmount, unit?.overPrice,
      unit?.installmentAmountYearly, unit?.installmentYears, unit?.cashMultiple]
      .some(value => num(value) != null && num(value) !== 0);
    return { showSplit: !hasClaims, reason: hasClaims ? "incomplete_claims" : "no_split" };
  }
  if (arithmetic.okPrimary) return { showSplit: true, reason: "primary_identity" };
  return { showSplit: false, reason: arithmetic.okPaid ? "paid_identity_only" : "inconsistent" };
}

/** True when public UI/meta may expose cash / remaining / plan amounts. */
export function mayShowMoneySplit(unit) {
  if (!unit) return false;
  if (unit.paymentSplitHidden) return false;
  return assessPublicMoney(unit).showSplit;
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
    okPrimary,
    okPaid,
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
