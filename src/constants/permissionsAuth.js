/**
 * Backend permissions contract (v2) — shared by client and server.
 * @see permissions system frontend contract
 */

export const PERMISSIONS_UPDATED_DETAIL =
  "Permissions updated — please re-authenticate";

/**
 * Normalize FastAPI / Starlette `detail` (string | { msg }[] | unknown) to a single comparable string.
 * @param {unknown} detail
 * @returns {string}
 */
export function normalizeApiDetail(detail) {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item != null && typeof item === "object" && "msg" in item) {
          return String(/** @type {{ msg?: string }} */ (item).msg ?? "");
        }
        return String(item);
      })
      .filter(Boolean)
      .join("; ");
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) {
    return String(/** @type {{ msg?: string }} */ (detail).msg ?? "");
  }
  return String(detail);
}

/**
 * True when API returned the permissions-version mismatch body (401).
 * @param {unknown} detail - `response.data.detail`
 * @returns {boolean}
 */
export function isPermissionsUpdatedError(detail) {
  if (detail === PERMISSIONS_UPDATED_DETAIL) return true;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (
      first != null &&
      typeof first === "object" &&
      "msg" in first &&
      String(/** @type {{ msg?: string }} */ (first).msg) === PERMISSIONS_UPDATED_DETAIL
    ) {
      return true;
    }
  }
  return normalizeApiDetail(detail) === PERMISSIONS_UPDATED_DETAIL;
}
