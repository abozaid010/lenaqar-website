"use client";

import { useState, useCallback } from "react";
import { TokenRefreshService } from "@/lib/TokenRefreshService";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

/**
 * Custom hook for token refresh operations
 * Provides refresh function and loading/error states
 * 
 * @returns {Object} Object containing refreshToken function, isLoading, and error
 */
export function useTokenRefresh() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Refreshes the access token
   * @returns {Promise<string|null>} New access token or null if refresh failed
   */
  const refreshToken = useCallback(async () => {
    // Use CLIENT_ID as the session presence signal (access_token is httpOnly, unreadable client-side).
    if (!LenaCookiesManager.getClientId()) {
      setError(new Error("No active session"));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await TokenRefreshService.refreshToken();
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Token refresh failed";
      setError(new Error(errorMessage));
      setIsLoading(false);

      await TokenRefreshService.handleRefreshFailure();
      return null;
    }
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    refreshToken,
    isLoading,
    error,
    clearError,
  };
}
