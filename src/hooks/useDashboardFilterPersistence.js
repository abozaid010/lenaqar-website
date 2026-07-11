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
  withHomeyOnlyMyLeadsDefault,
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
      // URL is current session state — persist as-is (do not re-apply author
      // default; user may have cleared the Author filter).
      if (storageKey) writeDashboardFilters(storageKey, urlFilters);
      setBootAppliedFilters(urlFilters);
      setIsReady(true);
      return;
    }

    const stored = storageKey ? readDashboardFilters(storageKey) : null;
    if (stored) {
      // Restore exactly what the user last had. Fill Homey sort only if never
      // set; never re-add author the user cleared.
      const restored = withHomeyOnlyMyLeadsDefault(stored, {
        applyAuthorDefault: false,
      });
      setRestoredFilters(restored);
      setBootAppliedFilters(restored);
      if (storageKey) writeDashboardFilters(storageKey, restored);

      const params = new URLSearchParams(
        dashboardFiltersToQueryString(restored),
      );
      const userId = searchParams.get("userId");
      if (userId) params.set("userId", userId);

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      setIsReady(true);
      return;
    }

    // First visit (no URL filters, no storage) — role-based author default +
    // Homey sort default applied here only.
    const fallback =
      serverAppliedFilters && typeof serverAppliedFilters === "object"
        ? extractPersistableDashboardFilters(serverAppliedFilters)
        : {};
    const withDefault = withHomeyOnlyMyLeadsDefault(fallback, {
      applyAuthorDefault: true,
    });
    setBootAppliedFilters(withDefault);

    if (Object.keys(withDefault).length > 0) {
      setRestoredFilters(withDefault);
      if (storageKey) writeDashboardFilters(storageKey, withDefault);
      const params = new URLSearchParams(
        dashboardFiltersToQueryString(withDefault),
      );
      const userId = searchParams.get("userId");
      if (userId) params.set("userId", userId);
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }

    setIsReady(true);
  }, [pathname, router, searchParams, serverAppliedFilters]);

  // Persist whenever URL filter params change (after hydration).
  // Empty URL must not wipe storage — reload / bare /dashboard reuses it.
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

    const defaults = withHomeyOnlyMyLeadsDefault(
      {},
      { applyAuthorDefault: true },
    );
    if (storageKey && Object.keys(defaults).length > 0) {
      writeDashboardFilters(storageKey, defaults);
    }
    setRestoredFilters(Object.keys(defaults).length > 0 ? defaults : null);
    setBootAppliedFilters(defaults);

    const params = new URLSearchParams(
      dashboardFiltersToQueryString(defaults),
    );
    const userId = searchParams.get("userId");
    if (userId) params.set("userId", userId);

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
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
