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

function jobsBacklog(status: ActivationStatusResponse | undefined): number {
  if (!status) return 0;
  return Math.max(status.jobs_queued ?? 0, status.sender_jobs_pending ?? 0);
}

/**
 * Polls AI activation state. Fast interval while a batch / send queue is active
 * or paused (pause is global — teammates' actions must appear promptly).
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
      if (
        data.running ||
        data.stop_requested ||
        !data.enabled ||
        jobsBacklog(data) > 0
      ) {
        return 5_000;
      }
      return 15_000;
    },
  });
}

/**
 * Suggested states from activation status:
 * !enabled → disabled
 * stop_requested (+ still finishing) → pausing | paused
 * running or WhatsApp send backlog → running
 * else → idle / ready
 */
export function deriveActivationPhase(
  status: ActivationStatusResponse | undefined,
  startInFlight: boolean,
): ActivationPhase {
  if (status && !status.enabled) return "disabled";
  if (status?.stop_requested) {
    return status.running ? "pausing" : "paused";
  }
  if (status?.running || startInFlight || jobsBacklog(status) > 0) {
    return "running";
  }
  return "idle";
}
