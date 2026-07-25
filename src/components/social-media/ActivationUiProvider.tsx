"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  ACTIVATION_STATUS_QUERY_KEY,
  deriveActivationPhase,
  useActivationStatus,
} from "@/hooks/social-media/useActivationStatus";
import type {
  ActivationPhase,
  ActivationStatusResponse,
} from "@/types/socialMedia";

const BASELINE_STORAGE_KEY = "lena.socialMedia.activationBaseline";

function readBaseline(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(BASELINE_STORAGE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function writeBaseline(value: number | null) {
  if (typeof window === "undefined") return;
  if (value == null || value <= 0) {
    window.sessionStorage.removeItem(BASELINE_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(BASELINE_STORAGE_KEY, String(value));
}

function isActivePhase(phase: ActivationPhase) {
  return phase === "running" || phase === "pausing";
}

type ActivationUiContextValue = {
  status: ActivationStatusResponse | undefined;
  isStatusLoading: boolean;
  phase: ActivationPhase;
  pending: number;
  jobsQueued: number;
  jobsSentToday: number;
  jobsFailedToday: number;
  progressBaseline: number | null;
  setBaseline: (value: number | null) => void;
  setStartInFlight: (value: boolean) => void;
  refreshStatus: () => Promise<void>;
};

const ActivationUiContext = createContext<ActivationUiContextValue | null>(null);

export function ActivationUiProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: status, isLoading: isStatusLoading } = useActivationStatus({
    enabled,
  });
  const [startInFlight, setStartInFlight] = useState(false);
  const [progressBaseline, setProgressBaseline] = useState<number | null>(null);
  const prevPhaseRef = useRef<ActivationPhase>("idle");

  useEffect(() => {
    setProgressBaseline(readBaseline());
  }, []);

  const phase = deriveActivationPhase(status, startInFlight);

  useEffect(() => {
    if (phase === "idle" || phase === "disabled") {
      setStartInFlight(false);
      setProgressBaseline(null);
      writeBaseline(null);
    }
  }, [phase]);

  useEffect(() => {
    // Batch claim finished or send backlog visible — local start latch can drop.
    if (status?.running || (status?.jobs_queued ?? 0) > 0) {
      setStartInFlight(false);
    }
  }, [status?.running, status?.jobs_queued]);

  // When a batch / queue settles, refresh lists.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    if (isActivePhase(prev) && !isActivePhase(phase)) {
      void queryClient.invalidateQueries({ queryKey: ["social-media"] });
    }
    prevPhaseRef.current = phase;
  }, [phase, queryClient]);

  const setBaseline = useCallback((value: number | null) => {
    setProgressBaseline(value);
    writeBaseline(value);
  }, []);

  const refreshStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ACTIVATION_STATUS_QUERY_KEY });
  }, [queryClient]);

  const jobsQueued = Math.max(
    status?.jobs_queued ?? 0,
    status?.sender_jobs_pending ?? 0,
  );

  const value = useMemo<ActivationUiContextValue>(
    () => ({
      status,
      isStatusLoading,
      phase,
      pending: status?.pending_posts ?? 0,
      jobsQueued,
      jobsSentToday: status?.jobs_sent_today ?? 0,
      jobsFailedToday: status?.jobs_failed_today ?? 0,
      progressBaseline,
      setBaseline,
      setStartInFlight,
      refreshStatus,
    }),
    [
      status,
      isStatusLoading,
      phase,
      jobsQueued,
      progressBaseline,
      setBaseline,
      refreshStatus,
    ],
  );

  return (
    <ActivationUiContext.Provider value={value}>
      {children}
    </ActivationUiContext.Provider>
  );
}

export function useActivationUi() {
  const ctx = useContext(ActivationUiContext);
  if (!ctx) {
    throw new Error("useActivationUi must be used within ActivationUiProvider");
  }
  return ctx;
}
