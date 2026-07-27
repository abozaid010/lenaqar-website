/**
 * Progressive pending-units loading for restricted roles (editor / sales /
 * marketing / viewer): show page 1 immediately, then merge up to 3 pages total
 * in the background. Admin / owner keep single-page fetches.
 */

import { isDashboardAdminRole } from "@/lib/dashboard-lead-access";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";
import { safeMergeParams } from "@/utils/safeJsonParser";

export const PENDING_APPROVAL_PROGRESSIVE_MAX_PAGES = 3;

/** Roles that get progressive multi-page pending-units loading. */
const PROGRESSIVE_PENDING_ROLES = Object.freeze([
  "editor",
  "sales",
  "marketing",
  "viewer",
  "view",
]);

/**
 * @param {string | null | undefined} [role]
 * @returns {boolean}
 */
export function shouldProgressivePendingUnitsFetch(role) {
  if (typeof window === "undefined") return false;
  const resolved =
    role != null && String(role).trim() !== ""
      ? String(role).trim().toLowerCase()
      : String(getRoleFromToken() || "")
          .trim()
          .toLowerCase();
  if (!resolved) return false;
  if (isDashboardAdminRole(resolved)) return false;
  return PROGRESSIVE_PENDING_ROLES.includes(resolved);
}

/**
 * @param {unknown} unit
 * @returns {string}
 */
export function getPendingUnitMergeId(unit) {
  if (!unit || typeof unit !== "object") return "";
  const id = unit.unitId ?? unit.unit_id ?? unit.id ?? unit.code ?? "";
  return id != null ? String(id).trim() : "";
}

/**
 * @param {unknown[]} existing
 * @param {unknown[]} incoming
 * @returns {unknown[]}
 */
export function mergePendingUnitPages(existing, incoming) {
  const base = Array.isArray(existing) ? existing : [];
  const next = Array.isArray(incoming) ? incoming : [];
  if (next.length === 0) return base;

  /** @type {Set<string>} */
  const seen = new Set();
  const merged = [];

  for (const unit of base) {
    const id = getPendingUnitMergeId(unit);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    merged.push(unit);
  }

  for (const unit of next) {
    const id = getPendingUnitMergeId(unit);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    merged.push(unit);
  }

  return merged;
}

/**
 * @param {Record<string, unknown> | null | undefined} response
 * @returns {{ hasMore: boolean, cursor: string | null, pageSize: number, unitCount: number }}
 */
export function readPendingPageMeta(response) {
  const pagination =
    response?.data && typeof response.data === "object"
      ? response.data.pagination
      : null;
  const units = Array.isArray(response?.data?.units) ? response.data.units : [];
  const nextCursor =
    pagination && typeof pagination.next_cursor === "string"
      ? pagination.next_cursor.trim()
      : "";
  const hasMore = Boolean(pagination?.has_more_next && nextCursor);
  const pageSizeRaw =
    pagination && pagination.page_size != null
      ? Number(pagination.page_size)
      : NaN;

  return {
    hasMore,
    cursor: hasMore ? nextCursor : null,
    pageSize: Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 16,
    unitCount: units.length,
  };
}

/**
 * Whether background pages should still be requested.
 * Stops when max pages reached, no cursor, empty page, or enough units collected.
 *
 * @param {{
 *   pagesFetched: number,
 *   maxPages?: number,
 *   hasMore: boolean,
 *   lastPageUnitCount: number,
 *   mergedUnitCount: number,
 *   pageSize: number,
 * }} args
 */
export function shouldContinuePendingProgressiveFetch({
  pagesFetched,
  maxPages = PENDING_APPROVAL_PROGRESSIVE_MAX_PAGES,
  hasMore,
  lastPageUnitCount,
  mergedUnitCount,
  pageSize,
}) {
  if (pagesFetched >= maxPages) return false;
  if (!hasMore) return false;
  if (lastPageUnitCount <= 0) return false;
  const target = Math.max(1, Number(pageSize) || 16) * maxPages;
  if (mergedUnitCount >= target) return false;
  return true;
}

/**
 * @param {string | object} searchParams
 * @returns {{ parsed: Record<string, unknown>, hasCursor: boolean, pageSize: number }}
 */
export function parsePendingProgressiveParams(searchParams) {
  const parsed = safeMergeParams(searchParams, {});
  const cursor =
    typeof parsed.cursor === "string" ? parsed.cursor.trim() : parsed.cursor;
  const pageSize = Number(parsed.page_size) || 16;
  return {
    parsed,
    hasCursor: cursor != null && cursor !== "",
    pageSize,
  };
}
