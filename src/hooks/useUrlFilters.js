"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";

/**
 * Hook for URL-driven filter state
 * URL = Single Source of Truth for filters
 * Syncs with LocalStorage for backup recovery
 */
export function useUrlFilters(storageKey = "projects_filters", options = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { validateCity, validateDeveloper } = options;
  const isInitialMount = useRef(true);

  // Read current values from URL
  const rawCity = searchParams.get("city") || "";
  const rawDeveloper = searchParams.get("developer") || "";

  // Validate values if validation functions provided
  const city = validateCity ? validateCity(rawCity) : rawCity;
  const developer = validateDeveloper ? validateDeveloper(rawDeveloper) : rawDeveloper;

  // Restore from LocalStorage on mount if URL is empty
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const saved = localStorage.getItem(storageKey);
      const currentParams = searchParams.toString();
      if (saved && !currentParams) {
        router.replace(`${pathname}?${saved}`, { scroll: false });
      }
    }
  }, [storageKey, searchParams, router, pathname]);

  // Save to LocalStorage whenever URL changes
  useEffect(() => {
    const paramsString = searchParams.toString();
    if (paramsString) {
      localStorage.setItem(storageKey, paramsString);
    }
  }, [searchParams, storageKey, pathname]);

  /**
   * Set a filter value in URL
   * Removes param if value is empty
   */
  const setFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback((filters) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
    localStorage.removeItem(storageKey);
  }, [router, pathname, storageKey]);

  /**
   * Get current filters as object (for navigation)
   */
  const getFiltersString = () => {
    return searchParams.toString();
  };

  return {
    // Current values
    city,
    developer,
    
    // Setters
    setCity: (value) => setFilter("city", value),
    setDeveloper: (value) => setFilter("developer", value),
    setFilter,
    setFilters,
    clearFilters,
    
    // Helpers
    getFiltersString,
    hasFilters: !!(city || developer),
  };
}
