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
  withDashboardFilterDefaults,
  writeDashboardFilters,
} from "@/lib/dashboard-filters-storage";

const DashboardFilterPersistenceContext = createContext(null);

/**
 * @param {Record<string, string>} before
 * @param {Record<string, string>} after
 * @returns {boolean}
 */
function filtersChanged(before, after) {
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);
  if (beforeKeys.length !== afterKeys.length) return true;
  return afterKeys.some((key) => before[key] !== after[key]);
}

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
      // URL is current session state — keep status as chosen; always enforce
      // author for non-admins so visibility cannot be bypassed via the URL.
      const enforced = withDashboardFilterDefaults(urlFilters, {
        applyStatusDefault: false,
        enforceAuthor: true,
      });
      if (storageKey) writeDashboardFilters(storageKey, enforced);
      setBootAppliedFilters(enforced);

      if (filtersChanged(urlFilters, enforced)) {
        const params = new URLSearchParams(
          dashboardFiltersToQueryString(enforced),
        );
        const userId = searchParams.get("userId");
        if (userId) params.set("userId", userId);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        });
      }

      setIsReady(true);
      return;
    }

    const stored = storageKey ? readDashboardFilters(storageKey) : null;
    if (stored) {
      // Restore last filters; Homey sort if missing; always enforce author.
      // Do not re-apply status default — user may have cleared "New".
      const restored = withDashboardFilterDefaults(stored, {
        applyStatusDefault: false,
        enforceAuthor: true,
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

    // First visit (no URL filters, no storage) — New status + role-based
    // author + Homey sort defaults.
    const fallback =
      serverAppliedFilters && typeof serverAppliedFilters === "object"
        ? extractPersistableDashboardFilters(serverAppliedFilters)
        : {};
    const withDefault = withDashboardFilterDefaults(fallback, {
      applyStatusDefault: true,
      enforceAuthor: true,
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
  // Non-admin author is re-enforced so a cleared author cannot stick in storage.
  useEffect(() => {
    if (!isReady) return;
    const storageKey = getCurrentUserDashboardFiltersStorageKey();
    if (!storageKey) return;

    const urlFilters = extractPersistableDashboardFilters(searchParams);
    if (Object.keys(urlFilters).length === 0) {
      return;
    }

    const enforced = withDashboardFilterDefaults(urlFilters, {
      applyStatusDefault: false,
      enforceAuthor: true,
    });
    writeDashboardFilters(storageKey, enforced);
    setRestoredFilters((prev) => (prev ? null : prev));

    if (filtersChanged(urlFilters, enforced)) {
      const params = new URLSearchParams(
        dashboardFiltersToQueryString(enforced),
      );
      const userId = searchParams.get("userId");
      if (userId) params.set("userId", userId);
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [searchParams, isReady, pathname, router]);

  const resetPersistedFilters = useCallback(() => {
    const storageKey = getCurrentUserDashboardFiltersStorageKey();
    clearDashboardFilters(storageKey);

    const defaults = withDashboardFilterDefaults(
      {},
      { applyStatusDefault: true, enforceAuthor: true },
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
    const base = hasPersistableDashboardFilters(searchParams)
      ? extractPersistableDashboardFilters(searchParams)
      : restoredFilters
        ? restoredFilters
        : extractPersistableDashboardFilters(searchParams);

    // Defense in depth: non-admin queries always include own author.
    return withDashboardFilterDefaults(base, {
      applyStatusDefault: false,
      enforceAuthor: true,
    });
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
