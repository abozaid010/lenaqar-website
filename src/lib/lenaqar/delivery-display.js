/**
 * What a public unit card says about delivery.
 *
 * A delivery date already in the past means the unit is handed over: the card says
 * "ready" instead of an old month. A date still ahead is shown as it is. Pure, with
 * `now` passed in, so `node --test` can pin the day.
 */

function parsedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  const year = date.getFullYear();
  return Number.isNaN(date.getTime()) || year <= 1900 || year >= 2100 ? null : date;
}

/**
 * @param {{deliveryDate?: unknown, deliveryYear?: unknown, isDelivered?: unknown}} unit
 * @param {Date} [now]
 * @returns {{ready: true} | {ready: false, date: Date | null, year: number | null}}
 */
export function deliveryDisplay(unit, now = new Date()) {
  const date = parsedDate(unit?.deliveryDate);
  const year = Number(unit?.deliveryYear);
  const hasYear = Number.isFinite(year) && year > 1900 && year < 2100;
  if (unit?.isDelivered === true) return { ready: true };
  if (date) {
    return date.getTime() < now.getTime()
      ? { ready: true }
      : { ready: false, date, year: hasYear ? year : null };
  }
  // No date: a year before this one is also in the past.
  if (hasYear && year < now.getFullYear()) return { ready: true };
  return { ready: false, date: null, year: hasYear ? year : null };
}
