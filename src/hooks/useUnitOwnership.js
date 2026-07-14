"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { isOwnClientUnit } from "@/lib/units/unit-ownership";

function readClientId() {
  return getClientIdFromToken() || LenaCookiesManager.getClientId() || null;
}

/**
 * Subscribe to cookie changes we care about (storage events + focus).
 * CLIENT_ID is non-httpOnly; reading it only during render is unsafe for SSR/hydration.
 */
function subscribeToClientId(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  const onFocus = () => onStoreChange();
  const onStorage = () => onStoreChange();
  window.addEventListener("focus", onFocus);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Returns the current user's client id and whether a unit/item belongs to them.
 * Uses the same isOwnClientUnit rule as the Homey unit detail/edit pages.
 */
export function useUnitOwnership(item) {
  const getSnapshot = useCallback(() => readClientId(), []);
  const myClientId = useSyncExternalStore(
    subscribeToClientId,
    getSnapshot,
    () => null,
  );

  const isOwnUnit = isOwnClientUnit(item, myClientId);

  return { myClientId, isOwnUnit };
}
