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
