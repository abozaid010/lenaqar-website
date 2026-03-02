"use client";

import { fetchPendingApprovalUnits } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

export function usePendingApprovalUnitsPageData(searchParams) {
  const safeSearchParams =
    typeof searchParams === "string" && searchParams ? searchParams : "{}";

  const unitsQuery = useQuery({
    queryKey: unitKeys.pendingApprovalList(safeSearchParams),
    queryFn: () => fetchPendingApprovalUnits(safeSearchParams),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
