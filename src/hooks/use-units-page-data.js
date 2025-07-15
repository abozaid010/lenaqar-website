"use client";

import { fetchUnitsFilter } from "@/utils/api";
import { unitKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";
import { useAdminSharedData } from "./use-admin-shared-data";

// Combined hook for all units page data
export function useUnitsPageData(searchParams, publicOnly = false) {
  // Get shared admin data
  const sharedData = useAdminSharedData();

  // Get units data
  const unitsQuery = useQuery({
    queryKey: unitKeys.list(searchParams),
    queryFn: () => fetchUnitsFilter(searchParams, publicOnly),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    units: unitsQuery.data?.data?.units || [],
    developers: sharedData.developers.data,
    compounds: sharedData.compounds.data,
    citiesAndDistricts: sharedData.citiesAndDistricts.data,

    // Individual query states
    unitsQuery: {
      isLoading: unitsQuery.isLoading,
      error: unitsQuery.error,
      isError: unitsQuery.isError,
      refetch: unitsQuery.refetch,
      isFetching: unitsQuery.isFetching,
    },

    // Computed states
    isInitialLoading: unitsQuery.isLoading || sharedData.isSharedDataLoading,
    hasErrors: unitsQuery.isError || sharedData.hasSharedDataErrors,
    isAnyFetching: unitsQuery.isFetching || sharedData.isAnySharedDataFetching,
    errorMessage:
      unitsQuery.error?.message || sharedData.sharedDataErrorMessage,
  };
}
