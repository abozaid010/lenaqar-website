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

  static isTokenExpiringSoon(thresholdMs = this.DEFAULT_REFRESH_THRESHOLD) {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return false;
    const timeUntilExpiration = expirationTime - Date.now();
    return timeUntilExpiration > 0 && timeUntilExpiration <= thresholdMs;
  }

  /** True when token is expired or within the proactive refresh window. */
  static needsProactiveRefresh(thresholdMs = this.DEFAULT_REFRESH_THRESHOLD) {
    if (!this.shouldRunProactiveRefresh()) return false;
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return true;
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

  static getNextRefreshTime() {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return null;
    const refreshTime = expirationTime - this.DEFAULT_REFRESH_THRESHOLD;
    return refreshTime <= Date.now() ? Date.now() : refreshTime;
  }

  static isTokenExpired() {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      return !LenaCookiesManager.getClientId();
    }
    return Date.now() >= expirationTime;
  }

  static getTimeUntilExpiration() {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return null;
    const remaining = expirationTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  // Use CLIENT_ID (non-httpOnly) as the presence signal — cleared on logout.
  static shouldRunProactiveRefresh() {
    return !!LenaCookiesManager.getClientId();
  }

  static hasRefreshToken() {
    // Refresh token is httpOnly — infer from CLIENT_ID presence.
    return !!LenaCookiesManager.getClientId();
  }

  static isAuthenticated() {
    return !!LenaCookiesManager.getClientId();
  }
}
