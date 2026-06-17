"use client";

import { fetchUnitsFilter } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

/**
 * @param {string|object} searchParams - Serialized filter payload (includes visibility, city, etc.)
 * @param {{ usePublicEndpoint?: boolean }} [fetchOptions]
 * @param {object|null} [initialData] - Server-prefetched first page (from RSC); null on filter changes
 */
export function useUnitsPageData(searchParams, { usePublicEndpoint = false } = {}, initialData = null) {
  const safeSearchParams =
    typeof searchParams === "string" && searchParams ? searchParams : "{}";

  const unitsQuery = useQuery({
    queryKey: unitKeys.list({
      params: safeSearchParams,
      usePublicEndpoint,
    }),
    queryFn: () => fetchUnitsFilter(safeSearchParams, { usePublicEndpoint }),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    // Server-prefetched data seeds the cache so there is no client fetch on first render.
    // initialData is only set when no filters are active (matches the server fetch params).
    // When a filter changes, searchParamsKey changes → new query key → initialData is not passed →
    // client fetches fresh from the BFF (Phase 3) or backend directly (Phase 1 interim).
    ...(initialData != null ? { initialData } : {}),
  });

  return {
    units: unitsQuery.data?.data?.units || [],
    pagination: unitsQuery.data?.data?.pagination || null,
    isLoading: unitsQuery.isLoading,
    error: unitsQuery.error,
    isError: unitsQuery.isError,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
    isPending: unitsQuery.isPending,
  };
}
