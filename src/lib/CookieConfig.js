/**
 * Centralized cookie configuration for authentication tokens
 * Ensures consistent cookie settings across the application
 */

/**
 * `Secure` cookies are silently dropped by browsers on non-HTTPS origins that
 * aren't a secure context (e.g. a phone hitting the dev server over the LAN IP
 * `http://192.168.x.x:3000`). That left the auth tokens unstored, so every
 * protected route bounced back to /login — logging in "never worked".
 *
 * Mark cookies `Secure` only in production (served over HTTPS). Dev is HTTP, so
 * cookies must be non-Secure to persist over localhost and LAN IP alike.
 */
const SECURE_COOKIES = process.env.NODE_ENV === "production";

export const COOKIE_CONFIG = {
  /**
   * Access token configuration
   * Expires after 1 hour for better security
   */
  ACCESS_TOKEN: {
    maxAge: 60 * 60, // 1 hour in seconds
    path: "/",
    secure: SECURE_COOKIES,
    sameSite: "lax",
    httpOnly: true,
  },

  /**
   * Access token expiry timestamp (non-httpOnly mirror of ACCESS_TOKEN's exp claim).
   * Stores only the unix seconds value — no JWT payload visible in browser.
   * Cleared alongside ACCESS_TOKEN on logout/refresh.
   */
  ACCESS_TOKEN_EXP: {
    maxAge: 60 * 60, // 1 hour — matches ACCESS_TOKEN
    path: "/",
    secure: SECURE_COOKIES,
    sameSite: "lax",
    httpOnly: false,
  },

  /**
   * Refresh token configuration
   * Expires after 10 days
   * HttpOnly for better security
   */
  REFRESH_TOKEN: {
    maxAge: 60 * 60 * 24 * 10, // 10 days in seconds
    path: "/",
    secure: SECURE_COOKIES,
    sameSite: "lax",
    httpOnly: true,
  },

  /**
   * Client ID configuration
   * Expires after 30 days (same as refresh token)
   */
  CLIENT_ID: {
    maxAge: 60 * 60 * 24 * 10, // 10 days in seconds
    path: "/",
    secure: SECURE_COOKIES,
    sameSite: "lax",
    httpOnly: false,
  },

  /**
   * Client info configuration
   * Expires after 30 days
   */
  CLIENT_INFO: {
    maxAge: 60 * 60 * 24 * 10, // 10 days in seconds
    path: "/",
    secure: SECURE_COOKIES,
    sameSite: "lax",
    httpOnly: false,
  },
};

/**
 * Get cookie options for Next.js server-side cookies
 * Converts maxAge from seconds to the format expected by Next.js cookies
 */
export function getServerCookieOptions(type = "ACCESS_TOKEN") {
  const config = COOKIE_CONFIG[type] || COOKIE_CONFIG.ACCESS_TOKEN;
  return {
    path: config.path,
    secure: config.secure,
    sameSite: config.sameSite,
    httpOnly: config.httpOnly,
    maxAge: config.maxAge,
  };
}

/**
 * Get cookie options for client-side cookies (js-cookie)
 * Converts maxAge from seconds to days for js-cookie
 */
export function getClientCookieOptions(type = "ACCESS_TOKEN") {
  const config = COOKIE_CONFIG[type] || COOKIE_CONFIG.ACCESS_TOKEN;
  return {
    path: config.path,
    secure: config.secure,
    sameSite: config.sameSite,
    expires: config.maxAge / (60 * 60 * 24), // Convert seconds to days for js-cookie
  };
}
