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
export function useDevelopers(client_id, isPublic = false) {
  console.log(`🔧 useDevelopers (infinite) called with: client_id=${client_id}, isPublic=${isPublic}`);

  const query = useInfiniteQuery({
    queryKey: developerKeys.infiniteList(client_id, isPublic),
    queryFn: ({ pageParam }) => {
      console.log(`🚀 Executing fetchDevelopers infinite queryFn (pageParam: ${pageParam})`);
      return fetchDevelopers({ pageParam, pageSize: 20 });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      console.log(`📄 Getting next page param, hasNext: ${lastPage.hasNext}, nextCursor: ${lastPage.nextCursor}`);
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes - keeps data fresh across tab navigation
    gcTime: 1000 * 60 * 30, // 30 minutes - keeps data in cache longer
    refetchOnWindowFocus: false,
    enabled: true, // Ensure the query is always enabled
  });
  
  // Flatten all pages into a single array
  const developers = query.data?.pages.flatMap(page => page.developers) || [];
  
  // Get pagination info from the last page
  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const hasNextPage = lastPage?.hasNext || false;
  const nextCursor = lastPage?.nextCursor || null;
  
  console.log(`📊 useDevelopers infinite query state:`, {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    data: `${developers.length} items across ${query.data?.pages.length || 0} pages`,
    hasNextPage,
    nextCursor,
    error: query.error?.message || 'none'
  });
  
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
  console.log(`🔧 useDeveloperDetails called with: developerId=${developerId}`);
  
  const query = useQuery({
    queryKey: [...developerKeys.all, "detail", developerId],
    queryFn: () => {
      console.log(`🚀 Executing fetchDeveloperDetails queryFn (developerId: ${developerId})`);
      return fetchDeveloperDetails(developerId);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - developer details don't change often
    refetchOnWindowFocus: false,
    enabled: !!developerId, // Only run if developerId is provided
  });
  
  console.log(`📊 useDeveloperDetails query state:`, {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    data: query.data ? `Developer: ${query.data.en_name || query.data.ar_name || 'Unknown'}` : 'null',
    error: query.error?.message || 'none'
  });
  
  return query;
}

// Hook for fetching compounds
export function useCompounds(client_id, isPublic = false) {
  return useQuery({
    queryKey: compoundKeys.lists(client_id, isPublic),
    queryFn: () => fetchProjects(isPublic),
    staleTime: 1000 * 60 * 15, // 15 minutes - keeps data fresh across tab navigation
    gcTime: 1000 * 60 * 30, // 30 minutes - keeps data in cache longer
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

// Hook for fetching paginated projects (full project data, cursor-based)
export function useProjectsPaginated({ cityEnName, developerId, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: paginatedProjectKeys.list({ cityEnName, developerId }),
    queryFn: ({ pageParam }) =>
      fetchProjectsPaginated({ limit: 20, lastDocId: pageParam, cityEnName, developerId }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.last_doc_id : undefined,
    staleTime: 1000 * 60 * 15, // 15 minutes - keeps data fresh across tab navigation
    gcTime: 1000 * 60 * 30, // 30 minutes - keeps data in cache longer
    refetchOnWindowFocus: false,
    enabled,
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
