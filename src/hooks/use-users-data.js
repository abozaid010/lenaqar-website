"use client";

import { fetchUsersData } from "@/utils/api";
import { userKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

export function useUsersData(searchParams) {
  const unitsQuery = useQuery({
    queryKey: userKeys.list(searchParams),
    queryFn: () => fetchUsersData(searchParams),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // TODO: Handle pagination and limit to 25 users
  return {
    data: unitsQuery.data?.data?.users.slice(0, 25) || [],
    isLoading: unitsQuery.isLoading,
    isError: unitsQuery.isError,
    error: unitsQuery.error,
    refetch: unitsQuery.refetch,
    isFetching: unitsQuery.isFetching,
  };
}
