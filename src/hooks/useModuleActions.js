"use client";

import { useMemo } from "react";

import { useModuleActionsContext } from "@/context/module-actions-context";
import { getActionsForModule, getModulePermissionFlags } from "@/lib/module-actions";

/**
 * Centralized per-module permission hook.
 *
 * Returns normalized booleans that should be used to HIDE unauthorized UI elements.
 */
export function useModuleActions(moduleName) {
  const { moduleActions, isReady } = useModuleActionsContext();

  return useMemo(() => {
    // Until we know, default to hiding privileged UI.
    if (!isReady) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        // non-required extras (helpful for advanced UI)
        isReady,
        actions: [],
        has: () => false,
      };
    }

    // Legacy tokens without module_actions: allow all.
    // (Backend should enforce authorization; UI uses this only for visibility.)
    if (!moduleActions) {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        isReady,
        actions: [],
        has: () => true,
      };
    }

    const actions = getActionsForModule(moduleActions, moduleName);
    const flags = getModulePermissionFlags(actions ?? []);
    return { ...flags, isReady };
  }, [isReady, moduleActions, moduleName]);
}

