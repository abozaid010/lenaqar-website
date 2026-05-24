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
        canEditDeveloperContactInfo: false,
        // non-required extras (helpful for advanced UI)
        isReady,
        actions: [],
        has: () => false,
      };
    }

    // Known session without module_actions object → deny privileged UI (backend still enforces).
    if (!moduleActions) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canEditDeveloperContactInfo: false,
        isReady,
        actions: [],
        has: () => false,
      };
    }

    const actions = getActionsForModule(moduleActions, moduleName);
    const flags = getModulePermissionFlags(actions ?? []);
    return { ...flags, isReady, actions: flags.actions ?? [] };
  }, [isReady, moduleActions, moduleName]);
}

