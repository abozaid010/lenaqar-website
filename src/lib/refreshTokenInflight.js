/**
 * Server-only single-flight guard for refresh-token rotation.
 * Prevents concurrent refreshes from invalidating each other's rotated tokens.
 */

/** @type {Map<string, Promise<{ newAccessToken: string, newRefreshToken?: string }>>} */
const inflightByRefreshToken = new Map();

/**
 * @template T
 * @param {string} refreshToken
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function withRefreshSingleFlight(refreshToken, fn) {
  const key = refreshToken;
  const existing = inflightByRefreshToken.get(key);
  if (existing) return existing;

  const promise = fn().finally(() => {
    inflightByRefreshToken.delete(key);
  });
  inflightByRefreshToken.set(key, promise);
  return promise;
}
