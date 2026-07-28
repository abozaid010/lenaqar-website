"use client";

import { useActionCatalog } from "@/hooks/use-action-catalog";

/**
 * Prefetch / warm the Action Catalog on admin shell load.
 * Renders nothing — failures are handled by consumers (error UI).
 */
export default function ActionCatalogWarmup() {
  useActionCatalog();
  return null;
}
