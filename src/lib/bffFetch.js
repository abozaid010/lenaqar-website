/**
 * Server-side fetch wrapper that automatically adds the X-BFF-Secret header.
 *
 * Every direct backend call from the Next.js server must go through this
 * instead of raw `fetch()`. The backend middleware rejects any request that
 * lacks the correct secret, so the backend effectively becomes unreachable
 * from the public internet even if its URL is discovered.
 *
 * Set BFF_SECRET (server-only env var, no NEXT_PUBLIC_ prefix) to the same
 * value as BFF_SECRET on the backend.
 */

const BFF_SECRET = process.env.BFF_SECRET ?? "";

/**
 * Drop-in replacement for `fetch()` that injects X-BFF-Secret.
 * @param {string | URL} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export function bffFetch(url, options = {}) {
  const headers = new Headers(options.headers);

  if (BFF_SECRET) {
    headers.set("X-BFF-Secret", BFF_SECRET);
  }

  return fetch(url, { ...options, headers });
}
