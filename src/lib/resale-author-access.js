/**
 * Hidden Units (resale / pending-approval) author visibility.
 *
 * - admin / owner → view all (no forced author)
 * - other roles with `resale.author_data_only` → own author only
 * - other roles without that action → view all (do not assume restriction)
 */

import {
  canViewAllDashboardLeads,
  getDashboardLoggedInEmail,
  isDashboardAdminRole,
} from "@/lib/dashboard-lead-access";
import {
  extractModuleActionList,
  moduleActionListIncludes,
} from "@/lib/whatsapp-bulk-access";

export const RESALE_MODULE = "resale";
export const RESALE_AUTHOR_DATA_ONLY_ACTION = "author_data_only";

/**
 * @param {Record<string, unknown>|null|undefined} moduleActions
 * @returns {boolean}
 */
export function hasResaleAuthorDataOnly(moduleActions) {
  if (
    !moduleActions ||
    typeof moduleActions !== "object" ||
    Array.isArray(moduleActions)
  ) {
    return false;
  }
  const actions = extractModuleActionList(moduleActions[RESALE_MODULE]);
  return moduleActionListIncludes(actions, RESALE_AUTHOR_DATA_ONLY_ACTION);
}

/**
 * Client-only: author email that must be applied for resale list fetches, or
 * null when the user may view all hidden units.
 *
 * @param {Record<string, unknown>|null|undefined} moduleActions
 * @returns {string | null}
 */
export function getRestrictedResaleAuthorEmail(moduleActions) {
  if (typeof window === "undefined") return null;
  if (canViewAllDashboardLeads()) return null;
  if (!hasResaleAuthorDataOnly(moduleActions)) return null;
  const email = getDashboardLoggedInEmail();
  return email || null;
}

/**
 * Server/client-safe: same rule using explicit role + email (no window).
 *
 * @param {string | null | undefined} role
 * @param {string | null | undefined} email
 * @param {Record<string, unknown>|null|undefined} moduleActions
 * @returns {string | null}
 */
export function getRestrictedResaleAuthorEmailForRole(
  role,
  email,
  moduleActions,
) {
  if (isDashboardAdminRole(role)) return null;
  if (!hasResaleAuthorDataOnly(moduleActions)) return null;
  const trimmed = typeof email === "string" ? email.trim() : "";
  return trimmed || null;
}

/**
 * Force `author` on pending-approval params when `resale.author_data_only`.
 *
 * @param {Record<string, unknown>} params
 * @param {Record<string, unknown>|null|undefined} moduleActions
 * @returns {Record<string, unknown>}
 */
export function enforceResaleAuthorOnParams(params, moduleActions) {
  const next = params && typeof params === "object" ? { ...params } : {};
  const restricted = getRestrictedResaleAuthorEmail(moduleActions);
  if (restricted) {
    next.author = restricted;
  }
  return next;
}
