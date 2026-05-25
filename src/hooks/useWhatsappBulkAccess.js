"use client";

import { useMemo } from "react";
import { useModuleActionsContext } from "@/context/module-actions-context";
import { resolveWhatsappBulkAccess } from "@/lib/whatsapp-bulk-access";

/**
 * Bulk WhatsApp permissions from profile `module_actions` (e.g. conversation.whatsapp).
 */
export function useWhatsappBulkAccess() {
  const { moduleActions, isReady: contextReady } = useModuleActionsContext();

  const access = useMemo(
    () => resolveWhatsappBulkAccess(moduleActions),
    [moduleActions]
  );

  return {
    ...access,
    isReady: contextReady,
  };
}
