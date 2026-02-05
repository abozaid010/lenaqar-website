"use client";

import {
  fetchCitisAndProjects,
  fetchDevelopers,
  fetchProjects,
  fetchProjectsNames,
} from "@/utils/api";
import { cityKeys, compoundKeys, developerKeys, projectNamesKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

// Hook for fetching developers
export function useDevelopers(client_id, isPublic = false) {
  return useQuery({
    queryKey: developerKeys.lists(client_id, isPublic),
    queryFn: () => fetchDevelopers(isPublic),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching compounds
export function useCompounds(client_id, isPublic = false) {
  return useQuery({
    queryKey: compoundKeys.lists(client_id, isPublic),
    queryFn: () => fetchProjects(isPublic),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching lightweight project names (optimized)
export function useProjectsNames(isPublic = false) {
  return useQuery({
    queryKey: projectNamesKeys.lists(isPublic),
    queryFn: () => fetchProjectsNames(isPublic),
    staleTime: 1000 * 60 * 5, // 5 minutes
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
export function useAdminSharedData(client_id, isPublic = false) {
  const developersQuery = useDevelopers(client_id, isPublic);
  const compoundsQuery = useCompounds(client_id, isPublic);
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
