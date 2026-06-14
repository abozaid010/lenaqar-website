"use client";

import { fetchUnitsFilter } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

/**
 * @param {string|object} searchParams - Serialized filter payload (includes visibility, city, etc.)
 * @param {{ usePublicEndpoint?: boolean }} [fetchOptions]
 */
export function useUnitsPageData(searchParams, { usePublicEndpoint = false } = {}) {
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
