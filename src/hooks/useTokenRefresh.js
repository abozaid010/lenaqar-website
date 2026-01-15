"use client";

import { useState, useCallback } from "react";
import { TokenRefreshService } from "@/lib/TokenRefreshService";
import { TokenExpirationManager } from "@/lib/TokenExpirationManager";

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
    // Check if user is authenticated
    if (!TokenExpirationManager.isAuthenticated()) {
      setError(new Error("No refresh token available"));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await TokenRefreshService.refreshToken();
      setIsLoading(false);
      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Token refresh failed";
      setError(new Error(errorMessage));
      setIsLoading(false);

      // If refresh fails, handle the failure (clears cookies and redirects)
      TokenRefreshService.handleRefreshFailure();
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
