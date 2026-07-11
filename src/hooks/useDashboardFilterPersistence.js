"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  clearDashboardFilters,
  dashboardFiltersToQueryString,
  extractPersistableDashboardFilters,
  getCurrentUserDashboardFiltersStorageKey,
  hasPersistableDashboardFilters,
  readDashboardFilters,
  writeDashboardFilters,
} from "@/lib/dashboard-filters-storage";

const DashboardFilterPersistenceContext = createContext(null);

/**
 * Restores dashboard filters from localStorage into the URL before children
 * mount (so the leads query uses restored values once). Saves on every URL change.
 */
function useDashboardFilterPersistenceState(serverAppliedFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  /** Filters restored from localStorage; used until URL searchParams catch up. */
  const [restoredFilters, setRestoredFilters] = useState(null);
  /** Stable appliedFilters snapshot for DashbordFilter mount after hydration. */
  const [bootAppliedFilters, setBootAppliedFilters] = useState(null);
  const didHydrateRef = useRef(false);

  useLayoutEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    const storageKey = getCurrentUserDashboardFiltersStorageKey();
    const urlFilters = extractPersistableDashboardFilters(searchParams);

    if (Object.keys(urlFilters).length > 0) {
      if (storageKey) writeDashboardFilters(storageKey, urlFilters);
      setBootAppliedFilters(urlFilters);
      setIsReady(true);
      return;
    }

    const stored = storageKey ? readDashboardFilters(storageKey) : null;
    if (stored) {
      setRestoredFilters(stored);
      setBootAppliedFilters(stored);

      const qs = dashboardFiltersToQueryString(stored);
      const params = new URLSearchParams(qs);
      const userId = searchParams.get("userId");
      if (userId) params.set("userId", userId);

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      setIsReady(true);
      return;
    }

    const fallback =
      serverAppliedFilters && typeof serverAppliedFilters === "object"
        ? extractPersistableDashboardFilters(serverAppliedFilters)
        : {};
    setBootAppliedFilters(fallback);
    setIsReady(true);
  }, [pathname, router, searchParams, serverAppliedFilters]);

  // Persist whenever URL filter params change (after hydration).
  useEffect(() => {
    if (!isReady) return;
    const storageKey = getCurrentUserDashboardFiltersStorageKey();
    if (!storageKey) return;

    const urlFilters = extractPersistableDashboardFilters(searchParams);
    if (Object.keys(urlFilters).length === 0) {
      return;
    }

    writeDashboardFilters(storageKey, urlFilters);
    setRestoredFilters((prev) => (prev ? null : prev));
  }, [searchParams, isReady]);

  const resetPersistedFilters = useCallback(() => {
    const storageKey = getCurrentUserDashboardFiltersStorageKey();
    clearDashboardFilters(storageKey);
    setRestoredFilters(null);
    const userId = searchParams.get("userId");
    if (userId) {
      router.replace(`${pathname}?userId=${encodeURIComponent(userId)}`, {
        scroll: false,
      });
    } else {
      router.replace(pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const effectiveFilterParams = useMemo(() => {
    if (hasPersistableDashboardFilters(searchParams)) {
      return extractPersistableDashboardFilters(searchParams);
    }
    if (restoredFilters) {
      return restoredFilters;
    }
    return extractPersistableDashboardFilters(searchParams);
  }, [searchParams, restoredFilters]);

  return {
    isReady,
    bootAppliedFilters,
    restoredFilters,
    effectiveFilterParams,
    resetPersistedFilters,
  };
}

export function DashboardFilterPersistenceProvider({
  children,
  serverAppliedFilters,
}) {
  const value = useDashboardFilterPersistenceState(serverAppliedFilters);
  return (
    <DashboardFilterPersistenceContext.Provider value={value}>
      {children}
    </DashboardFilterPersistenceContext.Provider>
  );
}

export function useDashboardFilterPersistence() {
  const ctx = useContext(DashboardFilterPersistenceContext);
  if (!ctx) {
    throw new Error(
      "useDashboardFilterPersistence must be used within DashboardFilterPersistenceProvider",
    );
  }
  return ctx;
}
