"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ActivationPhase,
  ActivationStatusResponse,
} from "@/types/socialMedia";
import { getActivationStatus } from "@/services/socialMedia";

export const ACTIVATION_STATUS_QUERY_KEY = [
  "social-media",
  "activation-status",
] as const;

/**
 * Polls AI activation state. Fast interval while a batch is in flight or paused
 * (pause is global — teammates' actions must appear promptly).
 */
export function useActivationStatus(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery<ActivationStatusResponse, Error>({
    queryKey: ACTIVATION_STATUS_QUERY_KEY,
    queryFn: getActivationStatus,
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5_000;
      if (data.running || data.stop_requested || !data.enabled) return 5_000;
      return 15_000;
    },
  });
}

export function deriveActivationPhase(
  status: ActivationStatusResponse | undefined,
  startInFlight: boolean,
): ActivationPhase {
  if (status && !status.enabled) return "disabled";
  if (status?.stop_requested && status.running) return "pausing";
  if (status?.stop_requested && !status.running) return "paused";
  if (status?.running || startInFlight) return "running";
  return "idle";
}
