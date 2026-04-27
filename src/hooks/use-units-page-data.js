"use client";

import { fetchUnitsFilter } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export function useUnitsPageData(searchParams, publicOnly = false) {
  // Ensure searchParams is always a valid object
  const safeSearchParams = typeof searchParams === 'string' && searchParams ? searchParams : '{}';

  const unitsQuery = useQuery({
    queryKey: unitKeys.list(safeSearchParams),
    queryFn: () => fetchUnitsFilter(safeSearchParams, publicOnly),
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
