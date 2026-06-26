"use client";

import { fetchOpenwaLinkedSessionsStatus } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const openwaSessionsStatusQueryKey = ["openwaSessionsStatus"];

const POLL_INTERVAL_MS = 4000;

/**
 * Polls OpenWA connection status for the active client's linked accounts.
 * @param {{ enabled?: boolean, pollWhileDisconnected?: boolean }} [options]
 */
export function useOpenwaSessionsStatus({
  enabled = true,
  pollWhileDisconnected = false,
} = {}) {
  return useQuery({
    queryKey: openwaSessionsStatusQueryKey,
    queryFn: fetchOpenwaLinkedSessionsStatus,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
    refetchInterval: (query) => {
      if (!pollWhileDisconnected) return false;
      const data = query.state.data;
      if (!data?.hasOpenwaAccounts) return false;
      if (data.allConnected) return false;
      return POLL_INTERVAL_MS;
    },
  });
}
