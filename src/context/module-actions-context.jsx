"use client";

import { createContext, useContext, useMemo, useState } from "react";

const ModuleActionsContext = createContext({
  moduleActions: null,
  isReady: false,
});

/**
 * Single source of truth for module-level permissions in the UI (from login / profile API).
 * `initialModuleActions` should be supplied by the admin layout (RSC); `null` means known-empty.
 */
export function ModuleActionsProvider({ initialModuleActions = null, children }) {
  const [moduleActions, setModuleActions] = useState(initialModuleActions ?? null);
  const [isReady] = useState(true);

  const value = useMemo(
    () => ({ moduleActions, isReady, setModuleActions }),
    [moduleActions, isReady]
  );

  return (
    <ModuleActionsContext.Provider value={value}>
      {children}
    </ModuleActionsContext.Provider>
  );
}

export function useModuleActionsContext() {
  return useContext(ModuleActionsContext);
}
