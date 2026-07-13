/** Convert YYYY-MM-DD to API start_date (UTC midnight). */
export function toApiStartDate(dateStr: string): string {
  return `${dateStr}T00:00:00Z`;
}

/** Convert YYYY-MM-DD to API end_date (UTC end of day). */
export function toApiEndDate(dateStr: string): string {
  return `${dateStr}T23:59:59Z`;
}

/** Returns true when both dates are set and start is not after end. */
export function isValidDashboardDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  return startDate <= endDate;
}

/** Local calendar YYYY-MM-DD (avoids UTC day-shift from toISOString). */
function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD prefix from an API date string, or null if missing/invalid. */
export function getDashboardDateDay(dateStr: string | null | undefined): string | null {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;
  const day = dateStr.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * Default dashboard end_date: local tomorrow at 23:59:59.
 * Ensures "today" (and current time) stays inside the range sent to the API.
 */
export function getDefaultDashboardEndDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return `${toLocalYmd(d)}T23:59:59`;
}

/**
 * Default dashboard start_date: local start of day, 2 months before tomorrow
 * (same window as the dashboard date picker defaults).
 */
export function getDefaultDashboardStartDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setMonth(d.getMonth() - 2);
  return `${toLocalYmd(d)}T00:00:00`;
}

/** True when the date's calendar day is before local today (stale rolling end). */
export function isDashboardDateBeforeToday(
  dateStr: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const day = getDashboardDateDay(dateStr);
  if (!day) return false;
  return day < toLocalYmd(now);
}
