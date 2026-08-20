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

const BFF_SECRET = (process.env.BFF_SECRET ?? "").trim();
export const HAS_BFF_SECRET = BFF_SECRET.length > 0;
const FETCH_TIMEOUT_MS = 8_000;

/** Node's default User-Agent (`node`) is challenged by Cloudflare Bot Fight. */
const SERVER_USER_AGENT =
  "LenaQar-Marketplace/1.0 (+https://www.lenaqar.com; server-side catalog)";

if (
  process.env.VERCEL &&
  !HAS_BFF_SECRET &&
  process.env.NODE_ENV !== "test"
) {
  console.error(
    "[bffFetch] BFF_SECRET is not set on Vercel. " +
      "The backend rejects serverless egress with 403 and /opportunities stays empty."
  );
}

/**
 * Cloudflare JS challenge HTML — origin never sees the request.
 * @param {Response} response
 * @param {string} [body]
 */
export function isCloudflareChallenge(response, body = "") {
  const mitigated = (response.headers.get("cf-mitigated") || "").toLowerCase();
  if (mitigated && mitigated !== "none") return true;
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("text/html") && response.status === 403) return true;
  const snippet = String(body).slice(0, 500).toLowerCase();
  return (
    snippet.includes("just a moment") ||
    snippet.includes("cf-browser-verification") ||
    snippet.includes("challenge-platform")
  );
}

/**
 * Drop-in replacement for `fetch()` that injects X-BFF-Secret.
 * @param {string | URL} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export function bffFetch(url, options = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", SERVER_USER_AGENT);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", "ar-EG,ar;q=0.9,en;q=0.8");
  }

  if (BFF_SECRET) {
    headers.set("X-BFF-Secret", BFF_SECRET);
  }

  return fetch(url, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}
