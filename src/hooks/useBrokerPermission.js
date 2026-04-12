"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";

/**
 * Returns permission helpers for broker-scoped edit/delete guards.
 *
 * Rules:
 *  - Non-broker accounts (developer, admin, owner, editor, …) → always allowed.
 *  - Broker accounts → can only modify items whose client_id matches their own.
 *
 * The logged-in client_id is read from the JWT (most tamper-resistant client source).
 * Falls back to the CLIENT_ID cookie if the JWT carries no client_id claim.
 *
 * Item ownership is normalised from either `item.client_id` (projects, developers)
 * or `item.clientId` (units) since the two API families use different casing.
 */
export function useBrokerPermission() {
  const clientInfo = LenaCookiesManager.getClientInfo();
  const clientType = clientInfo?.client_type?.toLowerCase() ?? "";
  const isBroker = clientType === "broker";
  const isDeveloper = clientType === "developer";

  // JWT is the most reliable client-side source; cookie is the fallback.
  const myClientId =
    getClientIdFromToken() || LenaCookiesManager.getClientId() || null;

  /**
   * Pass the full item object — works for all entities regardless of field casing.
   * @param {object|null} item  - A project, developer, or unit object from the API.
   * @returns {boolean}         - true  → show edit/delete; false → disable them.
   */
  const canModify = (item) => {
    if (!isBroker) return true;

    // Normalise: projects/developers → client_id; units → clientId
    const itemClientId = item?.client_id ?? item?.clientId ?? null;

    // If we have no ownership info on the item, allow and let the backend enforce.
    if (!itemClientId) return true;

    return itemClientId === myClientId;
  };

  return { isBroker, isDeveloper, myClientId, canModify };
}
