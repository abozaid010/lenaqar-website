/**
 * Centralized cookie configuration for authentication tokens
 * Ensures consistent cookie settings across the application
 */

export const COOKIE_CONFIG = {
  /**
   * Access token configuration
   * Expires after 1 hour
   */
  ACCESS_TOKEN: {
    maxAge: 60 * 60 * 24 * 10, // 10 days in seconds
    path: "/",
    secure: true,
    sameSite: "lax",
    httpOnly: false,
  },

  /**
   * Refresh token configuration
   * Expires after 30 days
   */
  REFRESH_TOKEN: {
    maxAge: 60 * 60 * 24 * 10, // 10 days in seconds
    path: "/",
    secure: true,
    sameSite: "lax",
    httpOnly: false,
  },

  /**
   * Client ID configuration
   * Expires after 30 days (same as refresh token)
   */
  CLIENT_ID: {
    maxAge: 60 * 60 * 24 * 10, // 10 days in seconds
    path: "/",
    secure: true,
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
    secure: true,
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
