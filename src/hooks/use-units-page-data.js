"use client";

import { fetchUnitsFilter } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

// Combined hook for all units page data
export function useUnitsPageData(searchParams, publicOnly = false) {
  // Fetch units data with search params
  const unitsQuery = useQuery({
    queryKey: unitKeys.list(searchParams, publicOnly),
    queryFn: () => fetchUnitsFilter(searchParams, publicOnly),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    units: unitsQuery.data?.data?.units || [],
    isLoading: unitsQuery.isLoading,
    error: unitsQuery.error,
    isError: unitsQuery.isError,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
  };
}
