/**
 * Server-only: get current user role from the JWT access token (cookie).
 * Use this for authorization checks in server actions – do not trust the
 * CLIENT_INFO cookie for authorization (it can be tampered with).
 *
 * The backend should put role/client_type in the JWT payload when issuing
 * the token. If not present, this returns null and the backend must enforce
 * authorization on every privileged API.
 */

import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const ALLOWED_MANAGE_ROLES = ["admin", "owner"];

function decodeBase64UrlToString(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  // Prefer atob when available (edge/runtime), otherwise Buffer (node).
  if (typeof atob === "function") return atob(padded);
  // eslint-disable-next-line no-undef
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Decode JWT payload without verification (signature is verified by the API when the token is sent).
 * Use only server-side. Returns payload object or null.
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = decodeBase64UrlToString(parts[1]);
    const payload = JSON.parse(json);
    return typeof payload === "object" && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Get the current user's role from the access token cookie.
 * Prefer JWT claims (client_type or role) over any client-stored data.
 *
 * @returns {Promise<string|null>} Role/client_type from JWT, or null if not in token or not logged in
 */
export async function getRoleFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  // Prefer explicit authorization role claim over client_type.
  // Some tokens include client_type="client" alongside role="admin"/"owner".
  const role = payload.role ?? payload.client_type ?? null;
  return role != null && typeof role === "string" ? role : null;
}

/**
 * Server-only: `module_actions` from JWT, if present (per-team / per-user granular permissions).
 * Shape: { [moduleKey: string]: string[] }
 * Empty array = no access to that module (sidebar should hide the tab).
 *
 * @returns {Promise<Record<string, string[]>|null>}
 */
export async function getModuleActionsFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const payload = decodeJwtPayload(token);
  if (!payload || payload.module_actions == null) {
    return null;
  }
  const ma = payload.module_actions;
  const normalized = typeof ma === "object" && !Array.isArray(ma) ? ma : null;


  return normalized;
}

/**
 * Check if the current user is allowed to manage team (admin/owner).
 * Uses JWT only; does not trust CLIENT_INFO cookie.
 *
 * @returns {Promise<boolean>}
 */
export async function canManageTeamFromToken() {
  const role = await getRoleFromToken();
  if (role == null) return false;
  return ALLOWED_MANAGE_ROLES.includes(role.toLowerCase());
}

/**
 * Reject if JWT contains a role that is not admin/owner.
 * If role is not in JWT (null), does not reject – backend must enforce.
 *
 * @returns {Promise<{ allowed: boolean }>}
 */
export async function assertCanManageTeam() {
  const role = await getRoleFromToken();
  if (role == null) return { allowed: true }; // unknown: let backend decide
  const allowed = ALLOWED_MANAGE_ROLES.includes(role.toLowerCase());
  return { allowed };
}
