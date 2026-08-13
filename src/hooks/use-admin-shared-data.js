"use client";

import {
  fetchCitisAndProjects,
  fetchDevelopers,
  fetchDeveloperNames,
  fetchDeveloperDetails,
  fetchProjects,
  fetchProjectsNames,
  fetchProjectsPaginated,
} from "@/utils/api";
import { cityKeys, compoundKeys, developerKeys, paginatedProjectKeys, projectNamesKeys } from "@/utils/query-utils";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

// Hook for fetching developers (full data for developers tab) with infinite scroll
export function useDevelopers(client_id, isPublic = false, initialData = undefined) {
  const query = useInfiniteQuery({
    queryKey: developerKeys.infiniteList(client_id, isPublic),
    queryFn: ({ pageParam }) => fetchDevelopers({ pageParam, pageSize: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    enabled: true,
    ...(initialData != null ? { initialData } : {}),
  });
  
  // Flatten all pages into a single array
  const developers = query.data?.pages.flatMap(page => page.developers) || [];
  
  // Get pagination info from the last page
  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const hasNextPage = lastPage?.hasNext || false;
  const nextCursor = lastPage?.nextCursor || null;
  
  
  return {
    ...query,
    data: developers,
    developers, // Explicit developers array for convenience
    hasNextPage,
    nextCursor,
    // Legacy pagination object for backward compatibility
    pagination: {
      hasNext: hasNextPage,
      nextCursor,
      totalCount: developers.length
    }
  };
}

// Hook for developer autocomplete: `GET /developers/v1/get_all_names` (authenticated; not public).
export function useDeveloperNames(_client_id, _isPublic = false) {
  return useQuery({
    queryKey: developerKeys.allNames(),
    queryFn: () => fetchDeveloperNames(),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Hook for fetching individual developer details
export function useDeveloperDetails(developerId) {
  return useQuery({
    queryKey: [...developerKeys.all, "detail", developerId],
    queryFn: () => fetchDeveloperDetails(developerId),
    staleTime: 1000 * 60 * 30, // 30 minutes - developer details don't change often
    refetchOnWindowFocus: false,
    enabled: !!developerId, // Only run if developerId is provided
  });
}

/**
 * @deprecated Use useProjectsPaginated for lists or useProjectsNames for lightweight data.
 * This hook loads ALL projects which is dangerous with large datasets (800+ projects).
 * It now includes a safety limit of 100 projects max.
 */
export function useCompounds(client_id, isPublic = false) {
  return useQuery({
    queryKey: [...compoundKeys.lists(client_id, isPublic), "limited"],
    queryFn: async () => {
      console.warn("useCompounds() is deprecated - loads all projects which causes memory issues. Use useProjectsPaginated instead.");
      const all = await fetchProjects(isPublic);
      // Safety limit: only return first 100 projects to prevent memory crash
      return Array.isArray(all) ? all.slice(0, 100) : all;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (reduced for memory stability)
    gcTime: 1000 * 60 * 5, // 5 minutes (reduced for memory stability)
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching lightweight project names (optimized)
export function useProjectsNames(isPublic = false, options = {}) {
  const enabled = options.enabled !== false;
  return useQuery({
    queryKey: projectNamesKeys.lists(isPublic),
    queryFn: () => fetchProjectsNames(isPublic),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    enabled,
  });
}

// Hook for fetching paginated projects (full project data, cursor-based)
// OPTIMIZED: 5min cache times for memory stability with 800+ projects
export function useProjectsPaginated({
  cityEnName,
  district,
  subDistrict,
  developerId,
  propertyType,
  minStartPrice,
  maxStartPrice,
  enabled = true,
  initialData,
} = {}) {
  const filters = {
    cityEnName,
    district,
    subDistrict,
    developerId,
    propertyType,
    minStartPrice,
    maxStartPrice,
  };
  return useInfiniteQuery({
    queryKey: paginatedProjectKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchProjectsPaginated({ limit: 20, lastDocId: pageParam, ...filters }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.last_doc_id : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled,
    ...(initialData != null ? { initialData } : {}),
  });
}

// Hook for fetching cities and districts
export function useCitiesAndDistricts() {
  return useQuery({
    queryKey: cityKeys.lists(),
    queryFn: fetchCitisAndProjects,
    staleTime: 1000 * 60 * 60, // 1 hour — catalog is session + server cached
    gcTime: 1000 * 60 * 60 * 6,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
