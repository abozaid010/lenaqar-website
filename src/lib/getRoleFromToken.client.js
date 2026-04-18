"use client";

/**
 * Client-side: get current user role from the JWT access token (cookie).
 * Uses the same decode logic as getRoleFromToken.js (server version).
 * Do not trust the CLIENT_INFO cookie for authorization – it can be tampered with.
 */

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded));
    return typeof payload === "object" && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Get the current user's role from the access token cookie (client-side).
 * Reads client_type or role from the JWT payload — same fields as server version.
 *
 * @returns {string|null} Role/client_type from JWT, or null if not logged in
 */
export function getRoleFromToken() {
  const token = LenaCookiesManager.getAccessToken();
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const role = payload.client_type ?? payload.role ?? null;
  return role != null && typeof role === "string" ? role : null;
}

/**
 * Get the client_id from the access token cookie (client-side).
 * Reads client_id or sub from the JWT payload.
 *
 * @returns {string|null} Client ID from JWT, or null if not logged in
 */
export function getClientIdFromToken() {
  const token = LenaCookiesManager.getAccessToken();
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const clientId = payload.client_id ?? payload.sub ?? null;
  return clientId != null && typeof clientId === "string" ? clientId : null;
}

/**
 * `module_actions` from JWT, if present (per-team / per-user granular permissions).
 * Shape: { [moduleKey: string]: string[] }
 * Empty array = no access to that module (sidebar should hide the tab).
 * @returns {Record<string, string[]>|null}
 */
export function getModuleActionsFromToken() {
  const token = LenaCookiesManager.getAccessToken();
  const payload = decodeJwtPayload(token);
  if (!payload || payload.module_actions == null) return null;
  const ma = payload.module_actions;
  return typeof ma === "object" && !Array.isArray(ma) ? ma : null;
}

/**
 * Whether to show a sidebar item for this module.
 * - No `module_actions` on JWT → show (legacy tokens).
 * - Module key missing from `module_actions` → show (backward compatible).
 * - Key present with empty array → hide (explicit no access).
 * - Key present with non-empty actions → show.
 *
 * @param {string|null|undefined} moduleKey - e.g. "projects", "team_members"
 * @returns {boolean}
 */
export function shouldShowModuleNavItem(moduleKey) {
  if (!moduleKey) return true;
  const ma = getModuleActionsFromToken();
  if (!ma) return true;
  if (!Object.prototype.hasOwnProperty.call(ma, moduleKey)) return true;
  const actions = ma[moduleKey];
  return Array.isArray(actions) && actions.length > 0;
}
