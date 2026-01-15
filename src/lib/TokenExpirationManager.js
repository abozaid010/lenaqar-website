"use client";

import { LenaCookiesManager } from "./LenaCookiesManager";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { COOKIE_CONFIG } from "./CookieConfig";

/**
 * Manages token expiration monitoring and proactive refresh scheduling
 */
export class TokenExpirationManager {
  // Default threshold: refresh 5 minutes before expiration
  static DEFAULT_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Checks if the access token is expiring soon
   * @param {number} thresholdMs - Time threshold in milliseconds (default: 5 minutes)
   * @returns {boolean} True if token expires within threshold
   */
  static isTokenExpiringSoon(thresholdMs = this.DEFAULT_REFRESH_THRESHOLD) {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      return false; // Can't determine expiration, assume not expiring soon
    }

    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;

    return timeUntilExpiration > 0 && timeUntilExpiration <= thresholdMs;
  }

  /**
   * Gets the expiration time of the current access token
   * @returns {number|null} Expiration timestamp in milliseconds, or null if unavailable
   */
  static getTokenExpirationTime() {
    try {
      const token = LenaCookiesManager.getAccessToken();
      if (!token) {
        return null;
      }

      // Try to decode JWT token to get expiration
      // JWT tokens have format: header.payload.signature
      const parts = token.split(".");
      if (parts.length !== 3) {
        // Not a standard JWT, use cookie expiration instead
        return this.getCookieExpirationTime();
      }

      try {
        // Decode the payload (second part)
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp) {
          // exp is in seconds, convert to milliseconds
          return payload.exp * 1000;
        }
      } catch (e) {
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.warn("[TokenExpirationManager] Failed to decode JWT payload:", e);
        }
      }

      // Fallback to cookie expiration
      return this.getCookieExpirationTime();
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.error("[TokenExpirationManager] Error getting token expiration:", error);
      }
      return null;
    }
  }

  /**
   * Gets expiration time based on cookie maxAge
   * Calculates expiration from when cookie was set (approximate)
   * @returns {number|null} Estimated expiration timestamp
   */
  static getCookieExpirationTime() {
    const accessTokenMaxAge = COOKIE_CONFIG.ACCESS_TOKEN.maxAge * 1000; // Convert to milliseconds
    // We don't know exactly when the cookie was set, so we estimate
    // by assuming it was set recently and will expire in maxAge
    // This is a fallback when JWT decoding fails
    return Date.now() + accessTokenMaxAge;
  }

  /**
   * Calculates when to schedule the next proactive refresh
   * Schedules refresh 5 minutes before expiration
   * @returns {number|null} Timestamp when refresh should occur, or null if can't determine
   */
  static getNextRefreshTime() {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      return null;
    }

    const refreshTime = expirationTime - this.DEFAULT_REFRESH_THRESHOLD;
    const now = Date.now();

    // If refresh time is in the past, refresh immediately
    if (refreshTime <= now) {
      return now;
    }

    return refreshTime;
  }

  /**
   * Checks if token is already expired
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired() {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      // Can't determine, assume not expired if token exists
      return !LenaCookiesManager.getAccessToken();
    }

    return Date.now() >= expirationTime;
  }

  /**
   * Gets time remaining until token expiration
   * @returns {number|null} Time remaining in milliseconds, or null if unavailable
   */
  static getTimeUntilExpiration() {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) {
      return null;
    }

    const remaining = expirationTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Checks if user has a valid refresh token
   * @returns {boolean} True if refresh token exists
   */
  static hasRefreshToken() {
    return !!LenaCookiesManager.getRefreshToken();
  }

  /**
   * Checks if user is authenticated (has both access and refresh tokens)
   * @returns {boolean} True if authenticated
   */
  static isAuthenticated() {
    return (
      !!LenaCookiesManager.getAccessToken() &&
      !!LenaCookiesManager.getRefreshToken()
    );
  }
}
