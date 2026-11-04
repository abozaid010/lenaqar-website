/**
 * Legacy unit URLs (/properties/<id>, /property/<id>, /unit/<slug|id|code>)
 * resolve to the public opportunity page. Pure logic: the caller injects the
 * read-only API lookup so this stays testable and cookie-free.
 *
 * Outcomes:
 * - { kind: "redirect", location }  → 308 to /opportunities/<code>
 * - { kind: "not_found" }           → the unit does not exist publicly (404)
 * - { kind: "unavailable" }         → lookup failed upstream (503, retry later)
 */

const SLUG_ID_MARKER = "--u-";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX24 = /^[0-9a-f]{24}$/i;
const NUMERIC = /^[0-9]+$/;

function decodeParam(raw) {
  if (raw == null) return "";
  let value = String(raw);
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the raw token when it is not valid percent-encoding.
  }
  return value.trim().replace(/\/+$/g, "");
}

/** Same id shapes the old CRM slug helper accepted. */
export function isLegacyUnitId(value) {
  if (!value) return false;
  return (
    UUID.test(value) ||
    HEX24.test(value) ||
    NUMERIC.test(value) ||
    (value.includes("_") && !value.includes("-"))
  );
}

/** Unit id embedded in an old SEO slug (`title--u-<id>`) or given directly. */
export function legacyUnitIdFromParam(raw) {
  const value = decodeParam(raw);
  if (!value) return null;
  const marker = value.lastIndexOf(SLUG_ID_MARKER);
  if (marker !== -1) {
    const embedded = value.slice(marker + SLUG_ID_MARKER.length).replace(/-+$/g, "");
    return isLegacyUnitId(embedded) ? embedded : null;
  }
  return isLegacyUnitId(value) ? value : null;
}

/** A token that could be a public opportunity code (path-safe, bounded). */
export function legacyCodeCandidate(raw) {
  const value = decodeParam(raw);
  if (!value || value.length > 64 || value.includes("..")) return null;
  if (value.includes(SLUG_ID_MARKER)) return null;
  return value;
}

export function opportunityPath(code) {
  return `/opportunities/${encodeURIComponent(code)}`;
}

function codeFrom(result) {
  const code = result?.data?.code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

/**
 * @param {string} raw route param
 * @param {{ byId: (id: string) => Promise<{ok: boolean, status: number, data?: any}>,
 *           byCode: (code: string) => Promise<{ok: boolean, status: number, data?: any}> }} api
 * @param {{ allowCode?: boolean }} [options] /properties and /property only ever carried ids.
 */
export async function resolveLegacyUnit(raw, api, { allowCode = false } = {}) {
  let upstreamFailed = false;

  const unitId = legacyUnitIdFromParam(raw);
  if (unitId) {
    const result = await api.byId(unitId);
    const code = result?.ok ? codeFrom(result) : null;
    if (code) return { kind: "redirect", location: opportunityPath(code) };
    if (!result?.ok && result?.status !== 404) upstreamFailed = true;
  }

  const candidate = allowCode ? legacyCodeCandidate(raw) : null;
  if (candidate) {
    const result = await api.byCode(candidate);
    const code = result?.ok ? codeFrom(result) : null;
    if (code) return { kind: "redirect", location: opportunityPath(code) };
    if (!result?.ok && result?.status !== 404) upstreamFailed = true;
  }

  return upstreamFailed ? { kind: "unavailable" } : { kind: "not_found" };
}
