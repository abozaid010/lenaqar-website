/**
 * Map backend login/signup HTTP results to public UI codes.
 * Never surfaces raw API text to the visitor.
 */

function firstString(...vals) {
  for (const value of vals) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/**
 * @param {unknown} body
 * @returns {string}
 */
export function extractApiErrorText(body) {
  if (body == null) return "";
  if (typeof body === "string") return body.trim();
  if (typeof body !== "object") return "";
  const row = /** @type {Record<string, unknown>} */ (body);
  if (Array.isArray(row.detail)) {
    const parts = row.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String(/** @type {{ msg?: unknown }} */ (item).msg || "");
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  return firstString(
    row.detail,
    row.error_message,
    row.message,
    row.error,
  );
}

function looksInactive(message) {
  return /inactive/i.test(String(message || ""));
}

function looksEmailTaken(message) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("already") ||
    text.includes("exists") ||
    text.includes("registered") ||
    text.includes("duplicate") ||
    text.includes("taken")
  );
}

/**
 * @param {number} status
 * @param {string} [message]
 * @returns {"pending" | "invalid_credentials" | "rate_limited" | "failed"}
 */
export function mapNetworkLoginStatus(status, message = "") {
  if (status === 429) return "rate_limited";
  if (status === 401) return "invalid_credentials";
  if (status === 403 && looksInactive(message)) return "pending";
  return "failed";
}

/**
 * @param {number} status
 * @param {string} [message]
 * @returns {"email_taken" | "rate_limited" | "validation_failed" | "save_failed"}
 */
export function mapNetworkSignupStatus(status, message = "") {
  if (status === 429) return "rate_limited";
  if (status === 409 || looksEmailTaken(message)) return "email_taken";
  if (status === 400 || status === 422) return "validation_failed";
  return "save_failed";
}
