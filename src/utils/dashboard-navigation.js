/**
 * Dashboard list/detail URL helpers — preserve filters when switching views.
 */

export function buildDashboardListHref(searchParams, { exclude = ["userId", "tab"] } = {}) {
  const params = new URLSearchParams(searchParams.toString());
  for (const key of exclude) {
    params.delete(key);
  }
  const query = params.toString();
  return `/dashboard${query ? `?${query}` : ""}`;
}

export function buildDashboardLeadHref(userId, searchParams) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("userId");
  const query = params.toString();
  const encodedUserId = encodeURIComponent(userId);
  return `/dashboard/${encodedUserId}${query ? `?${query}` : ""}`;
}

export function buildDashboardSplitHref(userId, searchParams) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("userId", userId);
  return `/dashboard?${params.toString()}`;
}
