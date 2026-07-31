"use client";

import { useEffect, useRef, useCallback } from "react";
import { TokenExpirationManager } from "@/lib/TokenExpirationManager";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

/** Safety floor when exp is still inside the refresh window after a refresh attempt. */
const MIN_RESCHEDULE_MS = 30_000;

/**
 * Provider component for proactive token refresh
 * Monitors token expiration and refreshes tokens before they expire
 * Handles edge cases like tab visibility and network errors
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {number} props.checkInterval - Interval in milliseconds to check token expiration (default: 60000 = 1 minute)
 * @param {number} props.refreshThreshold - Time in milliseconds before expiration to trigger refresh (default: 5 minutes)
 */
export function TokenRefreshProvider({
  children,
  checkInterval = 60000, // Check every 1 minute
  refreshThreshold = 5 * 60 * 1000, // 5 minutes
}) {
  const { refreshToken } = useTokenRefresh();
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isRefreshingRef = useRef(false);

  /**
   * Performs proactive token refresh if needed
   */
  const checkAndRefreshToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    if (!TokenExpirationManager.shouldRunProactiveRefresh()) {
      return;
    }

    if (TokenExpirationManager.needsProactiveRefresh(refreshThreshold)) {
      isRefreshingRef.current = true;

      try {
        await refreshToken();
      } catch {
        // Error handling is done in TokenRefreshService
      } finally {
        isRefreshingRef.current = false;
      }
    }
  }, [refreshToken, refreshThreshold]);

  /**
   * Schedules the next proactive refresh based on token expiration.
   * Always awaits the refresh attempt before reading the (updated) exp cookie
   * so we never tight-loop on delay=0 with a stale expiry.
   */
  const scheduleNextRefresh = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const nextRefreshTime =
      TokenExpirationManager.getNextRefreshTime(refreshThreshold);
    if (nextRefreshTime == null) {
      return;
    }

    const delay = Math.max(0, nextRefreshTime - Date.now());

    timeoutRef.current = setTimeout(async () => {
      await checkAndRefreshToken();

      const following =
        TokenExpirationManager.getNextRefreshTime(refreshThreshold);
      if (following == null) {
        return;
      }

      const remaining = following - Date.now();
      if (remaining <= 0) {
        // Still due after refresh (stale exp mirror / short TTL / clock skew).
        // Back off instead of delay=0 busy-loop that floods /client/refresh-token.
        timeoutRef.current = setTimeout(() => {
          scheduleNextRefresh();
        }, MIN_RESCHEDULE_MS);
        return;
      }

      scheduleNextRefresh();
    }, delay);
  }, [checkAndRefreshToken, refreshThreshold]);

  /**
   * Handles visibility change (tab focus/blur)
   * Refreshes token when tab becomes visible if token is expiring soon
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      if (TokenExpirationManager.needsProactiveRefresh(refreshThreshold)) {
        void checkAndRefreshToken().then(() => scheduleNextRefresh());
        return;
      }
      scheduleNextRefresh();
    }
  }, [checkAndRefreshToken, scheduleNextRefresh, refreshThreshold]);

  useEffect(() => {
    void checkAndRefreshToken();

    intervalRef.current = setInterval(() => {
      void checkAndRefreshToken();
    }, checkInterval);

    scheduleNextRefresh();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkAndRefreshToken, scheduleNextRefresh, handleVisibilityChange, checkInterval]);

  return <>{children}</>;
}
