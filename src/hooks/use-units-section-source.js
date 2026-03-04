"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { getUnitsSectionFromUrl } from "@/utils/units-navigation-source";

/**
 * Returns which units section is active (for sidebar, back links, etc.).
 * Use when rendering unit list, unit detail, or edit unit so the UI reflects
 * whether the user came from "Units" or "Pending approval".
 *
 * @returns {'units'|'pending_approval'|null}
 */
export function useUnitsSectionSource() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return getUnitsSectionFromUrl(pathname, searchParams);
}
