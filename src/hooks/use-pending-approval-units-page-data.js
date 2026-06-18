"use client";

import { fetchPendingApprovalUnits } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

/**
 * @param {string|object} searchParams - Serialized filter payload
 * @param {object|null} [initialData] - Server-prefetched first page (from RSC)
 */
export function usePendingApprovalUnitsPageData(searchParams, initialData = null) {
  const safeSearchParams =
    typeof searchParams === "string" && searchParams ? searchParams : "{}";

  const unitsQuery = useQuery({
    queryKey: unitKeys.pendingApprovalList(safeSearchParams),
    queryFn: () => fetchPendingApprovalUnits(safeSearchParams),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    ...(initialData != null ? { initialData } : {}),
  });

  return {
    units: unitsQuery.data?.data?.units ?? [],
    pagination: unitsQuery.data?.data?.pagination ?? null,
    isLoading: unitsQuery.isLoading,
    error: unitsQuery.error,
    isError: unitsQuery.isError,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
    isPending: unitsQuery.isPending,
  };
}
