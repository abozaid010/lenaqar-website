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
