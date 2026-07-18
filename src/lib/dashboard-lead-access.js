/**
 * Centralized Leads (dashboard) + Units visibility and default-filter rules.
 *
 * - admin / owner → view all; full author filter
 * - all other roles → only own records (author forced to logged-in email)
 * - Leads default status filter → "New" (`action=new`) on first visit / Reset
 *
 * Client helpers read CLIENT_INFO (UX). Prefer JWT on the server for real auth;
 * always force `author` in list fetches for non-admins as defense in depth.
 */

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";
import { NEW_LEAD_ACTION } from "@/utils/actions";

/** Roles that may view and filter all leads. */
export const DASHBOARD_ADMIN_ROLES = Object.freeze(["admin", "owner"]);

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isDashboardAdminRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();
  return DASHBOARD_ADMIN_ROLES.includes(normalized);
}

/**
 * Client-only: whether the current user can view/filter all leads.
 * @returns {boolean}
 */
export function canViewAllDashboardLeads() {
  if (typeof window === "undefined") return false;
  return isDashboardAdminRole(getRoleFromToken());
}

/**
 * Client-only: logged-in email from CLIENT_INFO.
 * @returns {string}
 */
export function getDashboardLoggedInEmail() {
  if (typeof window === "undefined") return "";
  const email = LenaCookiesManager.getClientInfo()?.email;
  return typeof email === "string" ? email.trim() : "";
}

/**
 * Client-only: author email that must be applied for non-admins, or null when
 * the user may view all leads (admin/owner).
 * @returns {string | null}
 */
export function getRestrictedDashboardAuthorEmail() {
  if (typeof window === "undefined") return null;
  if (canViewAllDashboardLeads()) return null;
  const email = getDashboardLoggedInEmail();
  return email || null;
}

/**
 * Whether `author` is allowed for the current user.
 * Admins/owners: any email (or empty = all). Non-admins: only own email.
 *
 * @param {string | null | undefined} author
 * @returns {boolean}
 */
export function isAllowedDashboardAuthor(author) {
  const restricted = getRestrictedDashboardAuthorEmail();
  if (restricted == null) return true;
  const next = typeof author === "string" ? author.trim() : "";
  if (!next) return false;
  return next.toLowerCase() === restricted.toLowerCase();
}

/**
 * Apply lead visibility + optional default status to a filter map.
 * Non-admins always get `author` forced to their email when enforceAuthor.
 *
 * @param {Record<string, string> | null | undefined} filters
 * @param {{
 *   applyStatusDefault?: boolean,
 *   enforceAuthor?: boolean,
 * }} [options]
 * @returns {Record<string, string>}
 */
export function applyDashboardLeadAccessDefaults(
  filters,
  { applyStatusDefault = false, enforceAuthor = true } = {},
) {
  const next =
    filters && typeof filters === "object" ? { ...filters } : {};

  if (typeof window === "undefined") return next;

  if (enforceAuthor) {
    const restricted = getRestrictedDashboardAuthorEmail();
    if (restricted) {
      next.author = restricted;
    }
  }

  if (applyStatusDefault) {
    const existingAction =
      typeof next.action === "string" ? next.action.trim() : "";
    if (!existingAction) {
      next.action = NEW_LEAD_ACTION;
    }
  }

  return next;
}

/**
 * Force `author` on API params for non-admin users (client fetch path).
 * @param {Record<string, unknown>} params
 * @returns {Record<string, unknown>}
 */
export function enforceDashboardAuthorOnParams(params) {
  const next = params && typeof params === "object" ? { ...params } : {};
  const restricted = getRestrictedDashboardAuthorEmail();
  if (restricted) {
    next.author = restricted;
  }
  return next;
}
