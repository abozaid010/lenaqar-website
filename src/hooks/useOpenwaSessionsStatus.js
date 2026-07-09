"use client";

import { fetchOpenwaLinkedSessionsStatus } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export const openwaSessionsStatusQueryKey = ["openwaSessionsStatus"];

/** Poll interval while Connect WhatsApp dialog is open and disconnected. */
export const OPENWA_SESSIONS_POLL_INTERVAL_MS = 15_000;

const OPENWA_SESSIONS_STALE_MS = 1000 * 60 * 10;

/**
 * OpenWA session status for the Connect WhatsApp dialog.
 *
 * Default: cached, manual refetch only (dashboard mount / settings button).
 * When `pollWhileOpen` is true: fetches immediately, then every 15s until connected
 * or the dialog closes.
 *
 * @param {{ pollWhileOpen?: boolean }} [options]
 */
export function useOpenwaSessionsStatus({ pollWhileOpen = false } = {}) {
  return useQuery({
    queryKey: openwaSessionsStatusQueryKey,
    queryFn: ({ signal }) => fetchOpenwaLinkedSessionsStatus({ signal }),
    enabled: pollWhileOpen,
    staleTime: pollWhileOpen ? 0 : OPENWA_SESSIONS_STALE_MS,
    gcTime: 1000 * 60 * 30,
    refetchInterval: (query) => {
      if (!pollWhileOpen) return false;
      if (query.state.data?.allConnected) return false;
      return OPENWA_SESSIONS_POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
