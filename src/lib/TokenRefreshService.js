"use client";

import { LenaCookiesManager } from "./LenaCookiesManager";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getClientCookieOptions } from "./CookieConfig";
import { decodeJwtExp, extractAuthTokens } from "./jwtCookieUtils";

const LOGIN_PATH = "/login";

const REFRESH_LOCK_NAME = "lena-token-refresh";

/**
 * Keep the non-httpOnly exp mirror in sync with the new access token.
 * Server Set-Cookie alone is not enough for scheduling: if the browser misses
 * that cookie (or a stale value remains), TokenRefreshProvider delay=0-loops
 * and floods /client/refresh-token.
 * @param {unknown} body
 */
function syncAccessTokenExpFromRefreshBody(body) {
  const { accessToken } = extractAuthTokens(body);
  const exp = decodeJwtExp(accessToken);
  if (exp == null) return;
  LenaCookiesManager.set(
    COOKIE_KEYS.ACCESS_TOKEN_EXP,
    String(exp),
    getClientCookieOptions("ACCESS_TOKEN_EXP")
  );
}

/**
 * Service for handling token refresh operations
 * Ensures client-side cookies are synced after server-side refresh
 */
export class TokenRefreshService {
  /** @type {Promise<boolean> | null} */
  static _refreshPromise = null;

  /**
   * Refreshes the access token.
   * - Single-flight within this tab: concurrent callers share one request.
   * - Mutually exclusive across tabs via the Web Locks API: only one tab performs
   *   the actual backend call at a time, so opening several tabs (or an Android
   *   resume racing an already-open tab) can't fire concurrent refreshes that
   *   invalidate each other's rotated refresh token.
   * @returns {Promise<boolean>}
   * @throws {Error} If refresh fails
   */
  static async refreshToken() {
    // Snapshot before we (potentially) wait on the lock, so we can tell whether
    // another tab already refreshed for us while we were waiting.
    const expBeforeWait = LenaCookiesManager.getAccessTokenExp();
    const run = () => TokenRefreshService._refreshIfStillNeeded(expBeforeWait);

    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return navigator.locks.request(REFRESH_LOCK_NAME, run);
    }
    return run();
  }

  /**
   * @param {number | null} expBeforeWait
   * @returns {Promise<boolean>}
   */
  static async _refreshIfStillNeeded(expBeforeWait) {
    if (TokenRefreshService._refreshPromise) {
      return TokenRefreshService._refreshPromise;
    }

    TokenRefreshService._refreshPromise = (async () => {
      // Another tab may have refreshed while we were waiting for the lock — if the
      // access token's expiry moved forward, our work is already done.
      const expNow = LenaCookiesManager.getAccessTokenExp();
      if (expNow && expNow !== expBeforeWait && expNow * 1000 > Date.now()) {
        return true;
      }
      return TokenRefreshService._doRefresh();
    })().finally(() => {
      TokenRefreshService._refreshPromise = null;
    });

    return TokenRefreshService._refreshPromise;
  }

  /**
   * @returns {Promise<boolean>}
   */
  static async _doRefresh() {
    let refreshResponse;
    try {
      refreshResponse = await fetch("/api/refresh-token", {
        method: "POST",
        credentials: "include",
      });
    } catch (networkError) {
      // fetch() itself threw (offline, DNS, connection reset) — not proof the
      // refresh token is invalid, just that this attempt couldn't complete.
      const error = new Error("Network error during token refresh");
      error.transient = true;
      throw error;
    }

    const body = await refreshResponse.json().catch(() => ({}));

    if (!refreshResponse.ok) {
      const errorMessage =
        process.env.NODE_ENV === "development"
          ? body.error || "Failed to refresh token: " + refreshResponse.status
          : "Token refresh failed";
      const error = new Error(errorMessage);
      // 503 = server marked this as a transient/retryable failure (see route.js).
      error.transient = refreshResponse.status === 503 || !!body.transient;
      throw error;
    }

    syncAccessTokenExpFromRefreshBody(body);
    return true;
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

    try {
      const { clearLocationsCatalogSessionStorage } = await import(
        "@/lib/locations/invalidate-locations-catalog.client"
      );
      clearLocationsCatalogSessionStorage();
    } catch {
      /* ignore */
    }

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
    await this.clearSessionAndRedirectToLogin();
  }
}
