"use client";

import { LenaCookiesManager } from "./LenaCookiesManager";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const LOGIN_PATH = "/login";

/**
 * Service for handling token refresh operations
 * Ensures client-side cookies are synced after server-side refresh
 */
export class TokenRefreshService {
  /** @type {Promise<boolean> | null} */
  static _refreshPromise = null;

  /**
   * Refreshes the access token (single-flight: concurrent callers share one request).
   * @returns {Promise<boolean>}
   * @throws {Error} If refresh fails
   */
  static async refreshToken() {
    if (TokenRefreshService._refreshPromise) {
      return TokenRefreshService._refreshPromise;
    }

    TokenRefreshService._refreshPromise = TokenRefreshService._doRefresh().finally(
      () => {
        TokenRefreshService._refreshPromise = null;
      }
    );

    return TokenRefreshService._refreshPromise;
  }

  /**
   * @returns {Promise<boolean>}
   */
  static async _doRefresh() {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[TokenRefreshService] Attempting to refresh token...");
      }

      const refreshResponse = await fetch("/api/refresh-token", {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json().catch(() => ({}));
        const errorMessage =
          process.env.NODE_ENV === "development"
            ? errorData.error || "Failed to refresh token: " + refreshResponse.status
            : "Token refresh failed";
        throw new Error(errorMessage);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[TokenRefreshService] Token refreshed successfully");
      }
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[TokenRefreshService] Token refresh failed:", error);
      }
      throw error;
    }
  }

  /**
   * Clears httpOnly + JS-visible session cookies via Route Handler, then removes
   * any duplicate client-visible cookies and redirects to login.
   * @param {{ reason?: string }} [opts]
   */
  static async clearSessionAndRedirectToLogin(opts = {}) {
    const { reason } = opts;
    try {
      await fetch("/api/auth/clear-session", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* best-effort: server route handles httpOnly cookie deletion */
    }

    // Clear the client-visible cookies (httpOnly ones are cleared by the server route above).
    LenaCookiesManager.remove(COOKIE_KEYS.ACCESS_TOKEN_EXP);
    LenaCookiesManager.remove(COOKIE_KEYS.CLIENT_ID);
    LenaCookiesManager.remove(COOKIE_KEYS.CLIENT_INFO);

    if (typeof window !== "undefined") {
      const suffix =
        reason != null && reason !== ""
          ? `?reason=${encodeURIComponent(reason)}`
          : "";
      window.location.href = `${LOGIN_PATH}${suffix}`;
    }
  }

  /**
   * Handles token refresh failure by clearing cookies and redirecting to login
   */
  static async handleRefreshFailure() {
    if (process.env.NODE_ENV === "development") {
      console.log("[TokenRefreshService] Handling refresh failure - clearing session");
    }
    await this.clearSessionAndRedirectToLogin();
  }
}
