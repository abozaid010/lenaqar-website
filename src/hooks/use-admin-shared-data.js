"use client";

import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
} from "@/components/services/serviceFetching";
import { cityKeys, compoundKeys, developerKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

// Hook for fetching developers
export function useDevelopers() {
  return useQuery({
    queryKey: developerKeys.lists(),
    queryFn: fetchDevelopers,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching compounds
export function useCompounds() {
  return useQuery({
    queryKey: compoundKeys.lists(),
    queryFn: fetchcombounds,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching cities and districts
export function useCitiesAndDistricts() {
  return useQuery({
    queryKey: cityKeys.lists(),
    queryFn: fetchCitisAndProjects,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// Combined hook for all shared admin data
export function useAdminSharedData() {
  const developersQuery = useDevelopers();
  const compoundsQuery = useCompounds();
  const citiesQuery = useCitiesAndDistricts();

  return {
    developers: {
      data: developersQuery.data || [],
      isLoading: developersQuery.isLoading,
      error: developersQuery.error,
      isError: developersQuery.isError,
      refetch: developersQuery.refetch,
      isFetching: developersQuery.isFetching,
    },
    compounds: {
      data: compoundsQuery.data || [],
      isLoading: compoundsQuery.isLoading,
      error: compoundsQuery.error,
      isError: compoundsQuery.isError,
      refetch: compoundsQuery.refetch,
      isFetching: compoundsQuery.isFetching,
    },
    citiesAndDistricts: {
      data: citiesQuery.data || [],
      isLoading: citiesQuery.isLoading,
      error: citiesQuery.error,
      isError: citiesQuery.isError,
      refetch: citiesQuery.refetch,
      isFetching: citiesQuery.isFetching,
    },

    // Computed states
    isSharedDataLoading:
      developersQuery.isLoading ||
      compoundsQuery.isLoading ||
      citiesQuery.isLoading,
    hasSharedDataErrors:
      developersQuery.isError || compoundsQuery.isError || citiesQuery.isError,
    isAnySharedDataFetching:
      developersQuery.isFetching ||
      compoundsQuery.isFetching ||
      citiesQuery.isFetching,
    sharedDataErrorMessage:
      developersQuery.error?.message ||
      compoundsQuery.error?.message ||
      citiesQuery.error?.message,
  };
}
