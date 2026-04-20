"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getModuleActionsFromToken } from "@/lib/getRoleFromToken.client";

const ModuleActionsContext = createContext({
  moduleActions: null,
  isReady: false,
});

/**
 * Single source of truth for module-level permissions in the UI.
 *
 * - If `initialModuleActions` is provided (even null), we treat the context as ready immediately.
 * - If it is omitted, we will read from the client token after mount.
 */
export function ModuleActionsProvider({
  initialModuleActions = undefined,
  children,
}) {
  const [moduleActions, setModuleActions] = useState(
    initialModuleActions !== undefined ? initialModuleActions : null
  );
  const [isReady, setIsReady] = useState(initialModuleActions !== undefined);

  useEffect(() => {
    if (initialModuleActions !== undefined) return;
    const ma = getModuleActionsFromToken();
    setModuleActions(ma);
    setIsReady(true);
  }, [initialModuleActions]);

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

