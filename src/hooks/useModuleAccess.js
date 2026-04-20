"use client";

import { useCallback, useEffect, useState } from "react";

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getModuleActionsFromToken } from "@/lib/getRoleFromToken.client";

const DEBUG = true;
const log = (...args) => {
  if (!DEBUG) return;
  // Avoid noisy server logs during SSR — client-only debugging.
  if (typeof window === "undefined") return;
  console.log("[useModuleAccess]", ...args);
};

function debugDecodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded));
  } catch (err) {
    log("failed to decode token payload", err);
    return null;
  }
}

/**
 * Client-side hook that resolves the current user's `module_actions` from the
 * JWT access token after mount. Use this for sidebar/nav gating so that:
 *
 * 1. Server render does not leak tabs the user cannot see (cookies are not
 *    available during SSR for client components, which would otherwise make the
 *    legacy fallback show everything until hydration).
 * 2. Once mounted, gating is driven by the authoritative JWT claims issued at
 *    login (backend persists `module_actions` in the JWT payload).
 *
 * Semantics of `canAccess(moduleKey)`:
 *   - `isReady === false`  → returns `false` (hide until we know).
 *   - JWT has no `module_actions` at all → returns `true` (legacy tokens only).
 *   - Key missing from `module_actions` or has empty array → returns `false`.
 *   - Key present with non-empty actions → returns `true`.
 */
export function useModuleAccess({ initialModuleActions = undefined } = {}) {
  const [moduleActions, setModuleActions] = useState(
    initialModuleActions !== undefined ? initialModuleActions : null
  );
  const [hasToken, setHasToken] = useState(false);
  const [isReady, setIsReady] = useState(initialModuleActions !== undefined);

  useEffect(() => {
    // If SSR already provided module_actions, we are ready immediately.
    if (initialModuleActions !== undefined) {
      const token = LenaCookiesManager.getAccessToken();
      setHasToken(!!token);
      log("mount (SSR-provided) → access_token present?", !!token, "length:", token?.length);
      return;
    }

    const token = LenaCookiesManager.getAccessToken();
    log("mount → access_token present?", !!token, "length:", token?.length);
    if (token) {
      log("token head:", token.slice(0, 24) + "...");
      const payload = debugDecodeJwt(token);
      log("decoded payload:", payload);
      log("payload.module_actions:", payload?.module_actions);
      log(
        "module_actions keys:",
        payload?.module_actions
          ? Object.keys(payload.module_actions)
          : "(none)"
      );
    } else {
      log(
        "no access_token cookie visible to JS. document.cookie =",
        typeof document !== "undefined" ? document.cookie : "(no document)"
      );
    }

    const ma = getModuleActionsFromToken();
    log("getModuleActionsFromToken() →", ma);
    setModuleActions(ma);
    setHasToken(!!token);
    setIsReady(true);
  }, [initialModuleActions]);

  const canAccess = useCallback(
    (moduleKey) => {
      let decision;
      if (!isReady) {
        decision = false;
      } else if (!moduleKey) {
        decision = true;
      } else if (!moduleActions) {
        decision = true; // legacy fallback
      } else if (
        !Object.prototype.hasOwnProperty.call(moduleActions, moduleKey)
      ) {
        decision = false;
      } else {
        const actions = moduleActions[moduleKey];
        decision = Array.isArray(actions) && actions.length > 0;
      }
      log(
        `canAccess("${moduleKey}") →`,
        decision,
        "| isReady:",
        isReady,
        "| actions:",
        moduleActions?.[moduleKey]
      );
      return decision;
    },
    [moduleActions, isReady]
  );

  return { canAccess, moduleActions, isReady, hasToken };
}
