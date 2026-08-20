"use client";

import { useMemo } from "react";
import { resolveWhatsappBulkAccess } from "@/lib/whatsapp-bulk-access";

/** Public site has no CRM session — bulk WhatsApp is always disabled. */
export function useWhatsappBulkAccess() {
  return useMemo(() => resolveWhatsappBulkAccess(null), []);
}
