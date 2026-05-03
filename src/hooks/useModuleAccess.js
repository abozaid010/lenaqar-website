"use client";

import { useCallback, useEffect, useState } from "react";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

/**
 * Client-side module visibility helper when `initialModuleActions` is passed from SSR.
 * Permissions v2: `module_actions` are not read from the JWT.
 *
 * `canAccess(moduleKey)`:
 * - `isReady === false` → `false`
 * - Missing key or empty actions → `false`
 * - Non-empty actions for key → `true`
 */
export function useModuleAccess({ initialModuleActions = undefined } = {}) {
  const [moduleActions, setModuleActions] = useState(
    initialModuleActions !== undefined ? initialModuleActions : null
  );
  const [hasToken, setHasToken] = useState(false);
  const [isReady, setIsReady] = useState(initialModuleActions !== undefined);

  useEffect(() => {
    if (initialModuleActions !== undefined) {
      const token = LenaCookiesManager.getAccessToken();
      setHasToken(!!token);
      return;
    }

    setModuleActions(null);
    setHasToken(!!LenaCookiesManager.getAccessToken());
    setIsReady(true);
  }, [initialModuleActions]);

  const canAccess = useCallback(
    (moduleKey) => {
      if (!isReady) return false;
      if (!moduleKey) return true;
      if (!moduleActions || typeof moduleActions !== "object") return false;
      if (!Object.prototype.hasOwnProperty.call(moduleActions, moduleKey)) return false;
      const actions = moduleActions[moduleKey];
      return Array.isArray(actions) && actions.length > 0;
    },
    [moduleActions, isReady]
  );

  return { canAccess, moduleActions, isReady, hasToken, setModuleActions };
}
