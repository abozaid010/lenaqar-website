import { SITE } from "../../config/site.js";
import { cashMultiple } from "./metrics.js";

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function yearFromDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  if (year <= 1900 || year >= 2100) return null;
  return year;
}

/**
 * Slim listing gate: enough to render a card. Payment-plan fields stay
 * optional — they surface on the card only when the payload has them.
 */
export function isListableOpportunity(unit) {
  const code = String(unit?.code || "").trim();
  if (!code) return false;
  const totalPrice = toNumber(unit?.totalPrice);
  return totalPrice > 0;
}

/**
 * Strategy §18 gate for cash-plan claims. Optional fields never fail a
 * unit for being absent — only for being inconsistent. Listing uses
 * `isListableOpportunity`; this gate only decides whether cash-multiple
 * may be shown.
 */
export function validateUnit(unit, now = new Date()) {
  const code = unit?.code || "(no-code)";

  const totalPrice = toNumber(unit?.totalPrice);
  if (!(totalPrice > 0)) {
    return { ok: false, code, reason: "totalPrice_missing_or_not_positive" };
  }

  const downPayment = toNumber(unit?.downPayment);
  if (!(downPayment > 0)) {
    return { ok: false, code, reason: "downPayment_missing_or_not_positive" };
  }
  if (downPayment > totalPrice) {
    return { ok: false, code, reason: "downPayment_exceeds_totalPrice" };
  }

  const installmentYears = toNumber(unit?.installmentYears);
  if (installmentYears != null && !(installmentYears > 0)) {
    return { ok: false, code, reason: "installmentYears_not_positive" };
  }

  const installmentAmountYearly = toNumber(unit?.installmentAmountYearly);
  if (
    installmentAmountYearly != null &&
    !(installmentAmountYearly < totalPrice)
  ) {
    return { ok: false, code, reason: "installmentAmountYearly_not_below_total" };
  }

  if (
    downPayment != null &&
    installmentAmountYearly != null &&
    installmentYears != null
  ) {
    const expected = downPayment + installmentAmountYearly * installmentYears;
    const drift = Math.abs(expected - totalPrice) / totalPrice;
    if (drift > 0.02) {
      return { ok: false, code, reason: "plan_does_not_reconcile" };
    }
  }

  const multiple = cashMultiple(totalPrice, downPayment);
  const { min, max } = SITE.cashMultipleBounds;
  if (multiple == null || multiple < min || multiple > max) {
    return { ok: false, code, reason: "cash_multiple_out_of_bounds" };
  }

  const developer = String(unit?.developer || unit?.developerAr || "").trim();
  if (!developer) {
    return { ok: false, code, reason: "developer_empty" };
  }

  const isDelivered = unit?.isDelivered === true;
  if (!isDelivered) {
    const deliveryYear =
      toNumber(unit?.deliveryYear) ?? yearFromDate(unit?.deliveryDate);
    if (deliveryYear != null && deliveryYear < now.getFullYear()) {
      return { ok: false, code, reason: "delivery_year_in_the_past" };
    }
  }

  return { ok: true, code, cashMultiple: multiple };
}
