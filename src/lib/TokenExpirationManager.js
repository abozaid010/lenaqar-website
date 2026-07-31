"use client";

import { LenaCookiesManager } from "./LenaCookiesManager";

/**
 * Manages token expiration monitoring and proactive refresh scheduling.
 * Reads expiry from the non-httpOnly `access_token_exp` cookie (unix seconds)
 * set server-side at login and after each refresh — the actual JWT is httpOnly
 * and never readable in client JS.
 */
export class TokenExpirationManager {
  static DEFAULT_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms

  /** True when token is expired or within the proactive refresh window. */
  static needsProactiveRefresh(thresholdMs = this.DEFAULT_REFRESH_THRESHOLD) {
    if (!this.shouldRunProactiveRefresh()) return false;
    const expirationTime = this.getTokenExpirationTime();
    // Missing exp mirror: do not force-refresh (that caused unnecessary churn).
    // Interval + visibility checks still run; login/refresh should set the cookie.
    if (!expirationTime) return false;
    return expirationTime - Date.now() <= thresholdMs;
  }

  static getTokenExpirationTime() {
    try {
      const exp = LenaCookiesManager.getAccessTokenExp();
      if (!exp) return null;
      return exp * 1000; // convert unix seconds → milliseconds
    } catch {
      return null;
    }
  }

  /**
   * Ideal wall-clock time to run the next proactive refresh (exp - threshold).
   * May be in the past when the token is already inside the refresh window.
   * Callers must not treat "past" as delay=0 busy-loop — await refresh, then
   * reschedule from the updated cookie (with a minimum backoff if still due).
   * @param {number} [thresholdMs]
   * @returns {number | null}
   */
  static getNextRefreshTime(thresholdMs = this.DEFAULT_REFRESH_THRESHOLD) {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return null;
    return expirationTime - thresholdMs;
  }

  // Use CLIENT_ID (non-httpOnly) as the presence signal — cleared on logout.
  static shouldRunProactiveRefresh() {
    return !!LenaCookiesManager.getClientId();
  }
}
