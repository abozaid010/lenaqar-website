"use client";

import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
  fetchUnitsFilter,
} from "@/utils/api";
import {
  cityKeys,
  compoundKeys,
  developerKeys,
  unitKeys,
} from "@/utils/query-utils";
import { useQueries } from "@tanstack/react-query";

// Combined hook for all units page data
export function useUnitsPageData(searchParams) {
  const results = useQueries({
    queries: [
      {
        queryKey: unitKeys.list(searchParams),
        queryFn: () => fetchUnitsFilter(searchParams),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
      {
        queryKey: developerKeys.lists(),
        queryFn: fetchDevelopers,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
      },
      {
        queryKey: compoundKeys.lists(),
        queryFn: fetchcombounds,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
      },
      {
        queryKey: cityKeys.lists(),
        queryFn: fetchCitisAndProjects,
        staleTime: 1000 * 60 * 15, // 15 minutes
        refetchOnWindowFocus: false,
      },
    ],
  });

  const [unitsQuery, developersQuery, compoundsQuery, citiesQuery] = results;

  return {
    units: {
      data: unitsQuery.data?.data?.units || [],
      isLoading: unitsQuery.isLoading,
      error: unitsQuery.error,
      isError: unitsQuery.isError,
      refetch: unitsQuery.refetch,
      isFetching: unitsQuery.isFetching,
    },
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
    isInitialLoading:
      unitsQuery.isLoading ||
      developersQuery.isLoading ||
      compoundsQuery.isLoading ||
      citiesQuery.isLoading,
    hasErrors:
      unitsQuery.isError ||
      developersQuery.isError ||
      compoundsQuery.isError ||
      citiesQuery.isError,
    isAnyFetching:
      unitsQuery.isFetching ||
      developersQuery.isFetching ||
      compoundsQuery.isFetching ||
      citiesQuery.isFetching,
    errorMessage:
      unitsQuery.error?.message ||
      developersQuery.error?.message ||
      compoundsQuery.error?.message ||
      citiesQuery.error?.message,
  };
}
