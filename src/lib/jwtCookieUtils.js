/**
 * JWT helpers for cookie/session checks (edge + Node safe — no Buffer).
 */

function decodeBase64UrlToString(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  if (typeof atob === "function") return atob(padded);
  // eslint-disable-next-line no-undef
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * @param {string | undefined | null} token
 * @returns {number | null} Unix seconds
 */
export function decodeJwtExp(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64UrlToString(parts[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Read `client_id` from a JWT payload (edge + Node safe).
 * @param {string | undefined | null} token
 * @returns {string | null}
 */
export function decodeJwtClientId(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64UrlToString(parts[1]));
    return typeof payload.client_id === "string" && payload.client_id
      ? payload.client_id
      : null;
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined | null} token
 * @param {number} [skewSeconds=30] Clock skew tolerance
 * @returns {boolean}
 */
export function isJwtExpired(token, skewSeconds = 30) {
  const exp = decodeJwtExp(token);
  if (exp === null) return false;
  return Math.floor(Date.now() / 1000) >= exp - skewSeconds;
}

/**
 * Normalize refresh/login token payloads (flat or StandardResponse `{ data }`).
 * @param {unknown} body
 * @returns {{ accessToken?: string, refreshToken?: string }}
 */
export function extractAuthTokens(body) {
  if (!body || typeof body !== "object") return {};
  const root = /** @type {Record<string, unknown>} */ (body);
  const nested =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? /** @type {Record<string, unknown>} */ (root.data)
      : root;

  const accessToken =
    (typeof nested.access_token === "string" && nested.access_token) ||
    (typeof nested.accessToken === "string" && nested.accessToken) ||
    undefined;
  const refreshToken =
    (typeof nested.refresh_token === "string" && nested.refresh_token) ||
    (typeof nested.refreshToken === "string" && nested.refreshToken) ||
    undefined;

  return { accessToken, refreshToken };
}
