"use client";

import { ModuleActionsProvider as Provider } from "@/context/module-actions-context";

export default function ModuleActionsProvider({ initialModuleActions, children }) {
  return (
    <Provider initialModuleActions={initialModuleActions}>{children}</Provider>
  );
}

