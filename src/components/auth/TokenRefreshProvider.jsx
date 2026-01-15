"use client";

import { useEffect, useRef, useCallback } from "react";
import { TokenExpirationManager } from "@/lib/TokenExpirationManager";
import { TokenRefreshService } from "@/lib/TokenRefreshService";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

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
  checkInterval = 60000, // Check every minute
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
    // Don't refresh if already refreshing
    if (isRefreshingRef.current) {
      return;
    }

    // Check if user is authenticated
    if (!TokenExpirationManager.isAuthenticated()) {
      return;
    }

    // Check if token is expiring soon
    if (TokenExpirationManager.isTokenExpiringSoon(refreshThreshold)) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log("[TokenRefreshProvider] Token expiring soon, refreshing proactively...");
      }
      isRefreshingRef.current = true;

      try {
        await refreshToken();
        if (process.env.NODE_ENV === "development") {
          console.log("[TokenRefreshProvider] Proactive refresh successful");
        }
      } catch (error) {
        // Log error only in development
        if (process.env.NODE_ENV === "development") {
          console.error("[TokenRefreshProvider] Proactive refresh failed:", error);
        }
        // Error handling is done in TokenRefreshService
      } finally {
        isRefreshingRef.current = false;
      }
    }
  }, [refreshToken, refreshThreshold]);

  /**
   * Schedules the next proactive refresh based on token expiration
   */
  const scheduleNextRefresh = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const nextRefreshTime = TokenExpirationManager.getNextRefreshTime();
    if (!nextRefreshTime) {
      return;
    }

    const now = Date.now();
    const delay = Math.max(0, nextRefreshTime - now);

    // Schedule refresh
    timeoutRef.current = setTimeout(() => {
      checkAndRefreshToken();
      // After refresh, schedule the next one
      scheduleNextRefresh();
    }, delay);

    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[TokenRefreshProvider] Scheduled next refresh in ${Math.round(delay / 1000)} seconds`
      );
    }
  }, [checkAndRefreshToken]);

  /**
   * Handles visibility change (tab focus/blur)
   * Refreshes token when tab becomes visible if token is expiring soon
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      // Tab became visible, check if refresh is needed
      if (TokenExpirationManager.isTokenExpiringSoon(refreshThreshold)) {
        checkAndRefreshToken();
      }
      // Reschedule next refresh
      scheduleNextRefresh();
    }
  }, [checkAndRefreshToken, scheduleNextRefresh, refreshThreshold]);

  useEffect(() => {
    // Initial check
    checkAndRefreshToken();

    // Set up interval to check token expiration periodically
    intervalRef.current = setInterval(() => {
      checkAndRefreshToken();
    }, checkInterval);

    // Schedule proactive refresh based on token expiration
    scheduleNextRefresh();

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
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
