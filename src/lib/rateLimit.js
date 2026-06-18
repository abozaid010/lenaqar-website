/**
 * In-memory sliding-window rate limiter for Next.js API route handlers.
 *
 * Works in Node.js runtime (not edge). State is per-process, so this protects
 * against single-IP abuse within one server instance. For multi-instance
 * deployments, pair with Cloudflare/Vercel edge rate limiting or Upstash Redis.
 */

const store = new Map(); // key → { count, windowStart, windowMs }
const PRUNE_THRESHOLD_MS = 10 * 60 * 1000; // clear entries older than 10 min
let lastPrune = Date.now();

function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_THRESHOLD_MS) return;
  lastPrune = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= entry.windowMs * 2) store.delete(key);
  }
}

/**
 * Check and record a request for the given key.
 * @param {string} key       - Scope key, e.g. `"bff:1.2.3.4"` or `"upload:1.2.3.4"`
 * @param {number} max       - Max requests allowed in the window
 * @param {number} windowMs  - Window size in milliseconds (default: 60 s)
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number|null }}
 */
export function rateLimit(key, max, windowMs = 60_000) {
  maybePrune();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now, windowMs });
    return { allowed: true, remaining: max - 1, retryAfter: null };
  }

  entry.count++;
  const allowed = entry.count <= max;
  return {
    allowed,
    remaining: Math.max(0, max - entry.count),
    retryAfter: allowed
      ? null
      : Math.ceil((entry.windowStart + windowMs - now) / 1000),
  };
}

/**
 * Extract the real client IP from a Next.js Request object.
 * Reads X-Forwarded-For (set by Vercel/Cloudflare/nginx) then X-Real-IP.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Build a 429 Too Many Requests response with the Retry-After header.
 * @param {number} retryAfter - seconds until window resets
 * @returns {Response}
 */
export function rateLimitExceededResponse(retryAfter) {
  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter ?? 60),
        "X-RateLimit-Limit": "exceeded",
      },
    }
  );
}
