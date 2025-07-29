"use client";

import { fetchUnitById } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

// Hook for fetching a single unit by ID
export function useUnitDetails(unitId, isPublic) {
  return useQuery({
    queryKey: unitKeys.details(unitId, isPublic),
    queryFn: () => fetchUnitById(unitId, isPublic),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Combined hook for unit details page (unit + shared data)
export function useUnitDetailsPageData(unitId, isPublic = false) {
  const unitQuery = useUnitDetails(unitId);

  return {
    unit: {
      data: unitQuery.data?.data || null,
      isLoading: unitQuery.isLoading,
      error: unitQuery.error,
      isError: unitQuery.isError,
      refetch: unitQuery.refetch,
      isFetching: unitQuery.isFetching,
    },

    // Access control
    hasAccess: unitQuery.data?.status === true,

    // Loading states
    isInitialLoading: unitQuery.isLoading,
    errorMessage: unitQuery.error?.message,
  };
}
