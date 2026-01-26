"use client";

import { LenaCookiesManager } from "./LenaCookiesManager";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getClientCookieOptions } from "./CookieConfig";

/**
 * Service for handling token refresh operations
 * Ensures client-side cookies are synced after server-side refresh
 */
export class TokenRefreshService {
  /**
   * Refreshes the access token and syncs client-side cookie
   * @returns {Promise<string>} The new access token
   * @throws {Error} If refresh fails
   */
  static async refreshToken() {
    try {
      // Only log in development to avoid exposing auth flow in production
      if (process.env.NODE_ENV === "development") {
        console.log("[TokenRefreshService] Attempting to refresh token...");
      }

      // Call the refresh token API route
      const refreshResponse = await fetch("/api/refresh-token", {
        method: "POST",
        credentials: "include", // Include cookies for server-side access
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json().catch(() => ({}));
        // Don't expose detailed error information in production
        const errorMessage =
          process.env.NODE_ENV === "development"
            ? errorData.error || "Failed to refresh token: " + refreshResponse.status
            : "Token refresh failed";
        throw new Error(errorMessage);
      }

      const data = await refreshResponse.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      if (!newAccessToken) {
        throw new Error("No access token received from refresh endpoint");
      }

      // CRITICAL FIX: Update client-side cookie immediately after server refresh
      // This ensures client-side cookie is in sync with server-side cookie
      this.updateClientCookie(newAccessToken);

      // Note: Refresh token is HttpOnly, so we can't update it client-side
      // The server handles refresh token rotation automatically

      if (process.env.NODE_ENV === "development") {
        console.log("[TokenRefreshService] Token refreshed successfully");
      }
      return newAccessToken;
    } catch (error) {
      // Log error details only in development
      if (process.env.NODE_ENV === "development") {
        console.error("[TokenRefreshService] Token refresh failed:", error);
      }
      throw error;
    }
  }

  /**
   * Updates the client-side access token cookie
   * This is critical to keep client and server cookies in sync
   * @param {string} token - The new access token
   */
  static updateClientCookie(token) {
    try {
      const cookieOptions = getClientCookieOptions("ACCESS_TOKEN");
      LenaCookiesManager.set(COOKIE_KEYS.ACCESS_TOKEN, token, cookieOptions);
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.log("[TokenRefreshService] Client-side cookie updated");
      }
    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[TokenRefreshService] Failed to update client-side cookie:",
          error
        );
      }
      // Don't throw - server cookie is still set, just client sync failed
    }
  }

  /**
   * Handles token refresh failure by clearing cookies and redirecting to login
   */
  static handleRefreshFailure() {
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[TokenRefreshService] Handling refresh failure - clearing cookies");
    }
    LenaCookiesManager.remove(COOKIE_KEYS.ACCESS_TOKEN);
    // Note: REFRESH_TOKEN is HttpOnly, can't be removed client-side
    // Server-side middleware or API route should handle refresh token cleanup
    LenaCookiesManager.remove(COOKIE_KEYS.CLIENT_ID);
    LenaCookiesManager.remove(COOKIE_KEYS.CLIENT_INFO);

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}
