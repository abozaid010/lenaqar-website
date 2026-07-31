/** Convert YYYY-MM-DD to API start_date (UTC midnight). */
export function toApiStartDate(dateStr: string): string {
  return `${dateStr}T00:00:00Z`;
}

/** Convert YYYY-MM-DD to API end_date (UTC end of day). */
export function toApiEndDate(dateStr: string): string {
  return `${dateStr}T23:59:59Z`;
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

/** Dashboard filter start datetime for a calendar day (00:00:00). */
export function toDashboardStartDateTime(ymd: string): string {
  return `${ymd}T00:00:00`;
}

/** Dashboard filter end datetime for a calendar day (23:59:59). */
export function toDashboardEndDateTime(ymd: string): string {
  return `${ymd}T23:59:59`;
}

/**
 * Force a filter datetime onto calendar-day start: YYYY-MM-DDT00:00:00.
 * Any hour/minute on that day is discarded so the range always covers a full day.
 */
export function normalizeDashboardStartDate(
  dateStr: string | null | undefined,
): string | null {
  const day = getDashboardDateDay(dateStr);
  return day ? toDashboardStartDateTime(day) : null;
}

/**
 * Force a filter datetime onto calendar-day end: YYYY-MM-DDT23:59:59.
 * Any hour/minute on that day is discarded so the range always covers a full day.
 */
export function normalizeDashboardEndDate(
  dateStr: string | null | undefined,
): string | null {
  const day = getDashboardDateDay(dateStr);
  return day ? toDashboardEndDateTime(day) : null;
}

/**
 * Returns true when both dates are set and start day is not after end day.
 * Same calendar day is allowed (start 00:00 < end 23:59).
 */
export function isValidDashboardDateRange(startDate: string, endDate: string): boolean {
  const startDay = getDashboardDateDay(startDate);
  const endDay = getDashboardDateDay(endDate);
  if (!startDay || !endDay) return false;
  return startDay <= endDay;
}

/**
 * Default dashboard end_date: local today at 23:59:59.
 * Keeps "today" inside the range sent to the API.
 */
export function getDefaultDashboardEndDate(now: Date = new Date()): string {
  return toDashboardEndDateTime(toLocalYmd(now));
}

/**
 * Default dashboard start_date: local start of day, 7 days before today
 * (last week inclusive of today).
 */
export function getDefaultDashboardStartDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 7);
  return toDashboardStartDateTime(toLocalYmd(d));
}

/**
 * Build a rolling range ending today: start = today - daysAgo, end = today EOD.
 */
export function buildDashboardDateRangeDaysAgo(
  daysAgo: number,
  now: Date = new Date(),
): { start_date: string; end_date: string } {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - Math.max(0, daysAgo));
  return {
    start_date: toDashboardStartDateTime(toLocalYmd(start)),
    end_date: toDashboardEndDateTime(toLocalYmd(end)),
  };
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

/**
 * Fill missing dashboard start/end dates with defaults.
 * Never overwrites an explicit end_date — even when it ends before today —
 * so a user-chosen historical range stays intact for the leads API.
 */
export function fillMissingDashboardDateFilters<
  T extends { start_date?: string; end_date?: string },
>(filters: T, now: Date = new Date()): T {
  const next = { ...filters };
  if (!next.start_date) {
    next.start_date = getDefaultDashboardStartDate(now);
  }
  if (!next.end_date) {
    next.end_date = getDefaultDashboardEndDate(now);
  }
  return next;
}

/**
 * Local calendar-day start → absolute UTC ISO for the API.
 * Example (Africa/Cairo, UTC+3): 2026-07-30 → 2026-07-29T21:00:00.000Z
 */
export function localDayStartToUtcIso(dateStr: string | null | undefined): string | null {
  const day = getDashboardDateDay(dateStr);
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

/**
 * Local calendar-day end → absolute UTC ISO for the API.
 * Example (Africa/Cairo, UTC+3): 2026-07-30 → 2026-07-30T20:59:59.999Z
 *
 * Without this, naive `YYYY-MM-DDT23:59:59` is treated as UTC by the backend and
 * includes early-morning *local* next-day activity (e.g. Jul 31 02:45 Cairo).
 */
export function localDayEndToUtcIso(dateStr: string | null | undefined): string | null {
  const day = getDashboardDateDay(dateStr);
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/**
 * Convert dashboard filter start/end (local calendar datetimes in the URL)
 * to UTC ISO strings for GET messages/v2/all. Leaves other params untouched.
 */
export function toDashboardApiDateParams<
  T extends { start_date?: string; end_date?: string },
>(params: T): T {
  const next = { ...params };
  const startUtc = localDayStartToUtcIso(next.start_date);
  const endUtc = localDayEndToUtcIso(next.end_date);
  if (startUtc) next.start_date = startUtc;
  if (endUtc) next.end_date = endUtc;
  return next;
}
