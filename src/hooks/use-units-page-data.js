"use client";

import { fetchUnitsFilter } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

export function useUnitsPageData(searchParams, publicOnly = false) {
  const unitsQuery = useQuery({
    queryKey: unitKeys.list(searchParams),
    queryFn: () => fetchUnitsFilter(searchParams, publicOnly),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // TODO: Handle pagination and limit to 24 units
  return {
    units: unitsQuery.data?.data?.units.slice(0, 24) || [],
    isLoading: unitsQuery.isLoading,
    error: unitsQuery.error,
    isError: unitsQuery.isError,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
  };
}
