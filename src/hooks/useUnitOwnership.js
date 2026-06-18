"use client";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { isOwnClientUnit } from "@/lib/units/unit-ownership";

/**
 * Returns the current user's client id and whether a unit/item belongs to them.
 */
export function useUnitOwnership(item) {
  const myClientId =
    getClientIdFromToken() || LenaCookiesManager.getClientId() || null;

  const isOwnUnit = isOwnClientUnit(item, myClientId);

  return { myClientId, isOwnUnit };
}
