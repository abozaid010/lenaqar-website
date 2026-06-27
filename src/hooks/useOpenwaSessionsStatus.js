"use client";

import { fetchOpenwaLinkedSessionsStatus } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const openwaSessionsStatusQueryKey = ["openwaSessionsStatus"];

/**
 * Cached OpenWA status — never auto-fetches.
 * Call `refetch()` only on Leads startup or Settings button click.
 */
export function useOpenwaSessionsStatus() {
  return useQuery({
    queryKey: openwaSessionsStatusQueryKey,
    queryFn: fetchOpenwaLinkedSessionsStatus,
    enabled: false,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
