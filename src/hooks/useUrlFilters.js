"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";

const PROJECT_FILTER_KEYS = [
  "city",
  "district",
  "sub_district",
  "developer",
  "property_type",
  "min_start_price",
  "max_start_price",
];

/**
 * Hook for URL-driven filter state
 * URL = Single Source of Truth for filters
 * Syncs with LocalStorage only when navigating between pages (not on initial load)
 */
export function useUrlFilters(storageKey = "projects_filters", options = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { validateCity, validateDeveloper } = options;

  // Read current values from URL
  const rawCity = searchParams.get("city") || "";
  const rawDeveloper = searchParams.get("developer") || "";
  const district = searchParams.get("district") || "";
  const subDistrict = searchParams.get("sub_district") || "";
  const propertyType = searchParams.get("property_type") || "";
  const minStartPrice = searchParams.get("min_start_price") || "";
  const maxStartPrice = searchParams.get("max_start_price") || "";

  // Validate values if validation functions provided
  const city = validateCity ? validateCity(rawCity) : rawCity;
  const developer = validateDeveloper ? validateDeveloper(rawDeveloper) : rawDeveloper;

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

  const hasFilters = PROJECT_FILTER_KEYS.some((key) => {
    const value = searchParams.get(key);
    return !!(value && value !== "all");
  });

  return {
    // Current values
    city,
    district,
    subDistrict,
    developer,
    propertyType,
    minStartPrice,
    maxStartPrice,

    // Setters
    setCity: (value) => setFilter("city", value),
    setDistrict: (value) => setFilter("district", value),
    setSubDistrict: (value) => setFilter("sub_district", value),
    setDeveloper: (value) => setFilter("developer", value),
    setPropertyType: (value) => setFilter("property_type", value),
    setMinStartPrice: (value) => setFilter("min_start_price", value),
    setMaxStartPrice: (value) => setFilter("max_start_price", value),
    setFilter,
    setFilters,
    clearFilters,

    // Helpers
    getFiltersString,
    hasFilters,
  };
}
