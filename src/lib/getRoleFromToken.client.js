"use client";

/**
 * Client-side: get current user role and client_id from non-httpOnly cookies.
 * The access_token is now httpOnly — these functions read from CLIENT_INFO and
 * CLIENT_ID cookies set at login/refresh (server-side) instead.
 *
 * These are UX-only helpers — do not use for server-side authorization.
 */

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

/**
 * Get the current user's role (client_type) from the CLIENT_INFO cookie.
 * @returns {string|null}
 */
export function getRoleFromToken() {
  const info = LenaCookiesManager.getClientInfo();
  if (!info) return null;
  const role = info.client_type ?? info.role ?? null;
  return role != null && typeof role === "string" ? role : null;
}

/**
 * Get the client_id from the CLIENT_ID cookie.
 * @returns {string|null}
 */
export function getClientIdFromToken() {
  const clientId = LenaCookiesManager.getClientId();
  return clientId != null && typeof clientId === "string" ? clientId : null;
}

/**
 * Whether to show a sidebar item for this module (UX only; use SSR/context data).
 * Deny when `moduleActions` is unknown. Key omitted or `[]` → hide.
 *
 * @param {string|null|undefined} moduleKey
 * @param {Record<string, string[]>|null|undefined} moduleActions
 * @returns {boolean}
 */
export function shouldShowModuleNavItem(moduleKey, moduleActions) {
  if (!moduleKey) return true;
  if (!moduleActions || typeof moduleActions !== "object" || Array.isArray(moduleActions)) {
    return false;
  }
  if (!Object.prototype.hasOwnProperty.call(moduleActions, moduleKey)) return false;
  const actions = moduleActions[moduleKey];
  return Array.isArray(actions) && actions.length > 0;
}
