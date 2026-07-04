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
