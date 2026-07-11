"use client";

import { fetchOpenwaReconnectStatus, startOpenwaReconnect } from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";

/** Poll interval while a reconnect is in flight. */
export const OPENWA_RECONNECT_POLL_INTERVAL_MS = 2000;

/** Give up and surface "timeout" if OpenWA never reaches ready/failed. */
export const OPENWA_RECONNECT_TIMEOUT_MS = 90_000;

/** OpenWA session status -> UI state. */
const STATUS_TO_STATE = {
  created: "reconnecting",
  initializing: "waiting_for_qr",
  authenticating: "reconnecting",
  qr_ready: "qr_ready",
  ready: "connected",
  failed: "failed",
  disconnected: "failed",
};

const TERMINAL_STATES = new Set(["connected", "failed", "timeout"]);

/**
 * Drives the WhatsApp QR reconnect flow for one linked number: starts the
 * session server-side, then polls status every 2s until ready/failed/timeout.
 *
 * The backend resolves the OpenWA session id from the authenticated client's
 * own linked accounts — this hook only ever sends `whatsapp_number`.
 */
export function useOpenwaReconnect() {
  const [state, setState] = useState("idle");
  const [qrImage, setQrImage] = useState(null);
  const [error, setError] = useState(null);

  const activeNumberRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const abortRef = useRef(null);
  const startedAtRef = useRef(0);
  const inFlightRef = useRef(false);

  const clearPoll = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearPoll();
    activeNumberRef.current = null;
    inFlightRef.current = false;
  }, [clearPoll]);

  const applyStatusPayload = useCallback((payload) => {
    const mapped = STATUS_TO_STATE[payload?.status] || "reconnecting";
    setQrImage(payload?.qr_code || null);
    setState(mapped);
    return mapped;
  }, []);

  const poll = useCallback(
    (whatsappNumber) => {
      if (activeNumberRef.current !== whatsappNumber) return;

      if (Date.now() - startedAtRef.current > OPENWA_RECONNECT_TIMEOUT_MS) {
        setState("timeout");
        stop();
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      fetchOpenwaReconnectStatus(whatsappNumber, { signal: controller.signal })
        .then((payload) => {
          if (activeNumberRef.current !== whatsappNumber) return;
          const mapped = applyStatusPayload(payload);
          if (TERMINAL_STATES.has(mapped)) {
            stop();
            return;
          }
          pollTimeoutRef.current = setTimeout(
            () => poll(whatsappNumber),
            OPENWA_RECONNECT_POLL_INTERVAL_MS
          );
        })
        .catch(() => {
          // Aborted (stop/unmount) or a transient network hiccup — either way,
          // don't surface a hard failure for a single missed poll tick.
          if (controller.signal.aborted || activeNumberRef.current !== whatsappNumber) return;
          pollTimeoutRef.current = setTimeout(
            () => poll(whatsappNumber),
            OPENWA_RECONNECT_POLL_INTERVAL_MS
          );
        });
    },
    [applyStatusPayload, stop]
  );

  const startReconnect = useCallback(
    async (whatsappNumber) => {
      if (!whatsappNumber || inFlightRef.current) return;

      inFlightRef.current = true;
      clearPoll();
      activeNumberRef.current = whatsappNumber;
      startedAtRef.current = Date.now();
      setError(null);
      setQrImage(null);
      setState("loading");

      try {
        const payload = await startOpenwaReconnect(whatsappNumber);
        if (activeNumberRef.current !== whatsappNumber) return;

        const mapped = applyStatusPayload(payload);
        if (TERMINAL_STATES.has(mapped)) {
          stop();
          return;
        }
        pollTimeoutRef.current = setTimeout(
          () => poll(whatsappNumber),
          OPENWA_RECONNECT_POLL_INTERVAL_MS
        );
      } catch (err) {
        if (activeNumberRef.current !== whatsappNumber) return;
        setError(
          err instanceof Error ? err.message : "Failed to start WhatsApp reconnection"
        );
        setState("failed");
        stop();
      } finally {
        inFlightRef.current = false;
      }
    },
    [applyStatusPayload, clearPoll, poll, stop]
  );

  // Cancel any in-flight polling on unmount.
  useEffect(() => stop, [stop]);

  return { state, qrImage, error, startReconnect, stop };
}
