"use client";

import { fetchUsersData } from "@/utils/api";
import { userKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";

export function useUsersData(searchParams, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(searchParams),
    queryFn: () => fetchUsersData(searchParams),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
