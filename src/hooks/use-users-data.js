"use client";

import { fetchUsersData } from "@/utils/api";
import { userKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

export function useUsersData(searchParams) {
  // Ensure searchParams is always a valid object
  const safeSearchParams = typeof searchParams === 'string' && searchParams ? searchParams : '{}';
  
  const unitsQuery = useQuery({
    queryKey: userKeys.list(safeSearchParams),
    queryFn: () => fetchUsersData(safeSearchParams),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: unitsQuery.data?.data?.users || [],
    pagination: unitsQuery.data?.data?.pagination || null,
    isLoading: unitsQuery.isLoading,
    isError: unitsQuery.isError,
    error: unitsQuery.error,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
    isPending: unitsQuery.isPending,
  };
}
