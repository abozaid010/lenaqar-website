/** URL / filter param for dashboard lead list sort. */
export const DASHBOARD_SORT_PARAM = "sort";

/** Legacy score-only toggle param (migrated to {@link DASHBOARD_SORT_PARAM}). */
export const LEGACY_SORT_SCORE_PARAM = "sort_score";

export const DASHBOARD_SORT = {
  RECENT: "recent",
  OLDEST: "oldest",
  SCORE: "score",
};

const VALID_SORTS = new Set(Object.values(DASHBOARD_SORT));

/** Matches Homey tenant id — kept local to avoid circular imports. */
const HOMEY_CLIENT_ID = "homey";

/**
 * @param {string | null | undefined} clientId
 * @returns {"recent" | "oldest"}
 */
export function getDefaultDashboardSort(clientId) {
  return String(clientId || "").trim().toLowerCase() === HOMEY_CLIENT_ID
    ? DASHBOARD_SORT.OLDEST
    : DASHBOARD_SORT.RECENT;
}

/**
 * Normalize URL/filter sort values, including legacy `sort_score`.
 * @param {string | null | undefined} sort
 * @param {string | null | undefined} legacySortScore
 * @returns {"recent" | "oldest" | "score" | null}
 */
export function normalizeDashboardSort(sort, legacySortScore) {
  const normalized = typeof sort === "string" ? sort.trim().toLowerCase() : "";
  if (VALID_SORTS.has(normalized)) return normalized;

  const legacy =
    typeof legacySortScore === "string"
      ? legacySortScore.trim().toLowerCase()
      : "";
  if (legacy === "desc" || legacy === "asc") {
    return DASHBOARD_SORT.SCORE;
  }

  return null;
}

/**
 * Resolve effective sort mode (explicit URL value or client default).
 * @param {string | null | undefined} sort
 * @param {string | null | undefined} clientId
 * @param {string | null | undefined} [legacySortScore]
 * @returns {"recent" | "oldest" | "score"}
 */
export function resolveDashboardSort(sort, clientId, legacySortScore) {
  return (
    normalizeDashboardSort(sort, legacySortScore) ??
    getDefaultDashboardSort(clientId)
  );
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toTimestampMs(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * @param {{
 *   updated_at?: unknown,
 *   updatedAt?: unknown,
 *   last_user_message_at?: unknown,
 *   last_followup_at?: unknown,
 * }} user
 * @returns {number}
 */
function getSortTimeMs(user) {
  return Math.max(
    toTimestampMs(user?.updated_at ?? user?.updatedAt),
    toTimestampMs(user?.last_user_message_at),
    toTimestampMs(user?.last_followup_at),
  );
}

/**
 * Stable tie-break so equal timestamps don't flicker between renders.
 * @param {{ user_id?: unknown }} user
 * @returns {string}
 */
function getUserIdKey(user) {
  return user?.user_id != null ? String(user.user_id) : "";
}

/**
 * Sort dashboard leads. Returns a new array; does not mutate input.
 * Client-only — never sent to the leads API.
 * @param {Array} users
 * @param {"recent" | "oldest" | "score" | null | undefined} sort
 * @returns {Array}
 */
export function sortDashboardLeads(users, sort) {
  if (!Array.isArray(users) || users.length === 0) return users ?? [];
  if (!VALID_SORTS.has(sort)) return users;

  return [...users].sort((a, b) => {
    if (sort === DASHBOARD_SORT.SCORE) {
      const aScore = Number(a?.score) || 0;
      const bScore = Number(b?.score) || 0;
      if (bScore !== aScore) return bScore - aScore;
      // Same score → freshest activity first.
      const timeDiff = getSortTimeMs(b) - getSortTimeMs(a);
      if (timeDiff !== 0) return timeDiff;
      return getUserIdKey(a).localeCompare(getUserIdKey(b));
    }

    const aTime = getSortTimeMs(a);
    const bTime = getSortTimeMs(b);
    const timeDiff =
      sort === DASHBOARD_SORT.RECENT ? bTime - aTime : aTime - bTime;
    if (timeDiff !== 0) return timeDiff;
    return getUserIdKey(a).localeCompare(getUserIdKey(b));
  });
}

/**
 * @deprecated Use {@link sortDashboardLeads} with resolveDashboardSort.
 */
export function sortDashboardLeadsByScore(users, direction) {
  if (direction !== "asc" && direction !== "desc") return users ?? [];
  return sortDashboardLeads(users, DASHBOARD_SORT.SCORE);
}
