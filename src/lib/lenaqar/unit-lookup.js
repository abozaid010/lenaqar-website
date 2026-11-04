/**
 * The public unit endpoints report "not found" as HTTP 200 with
 * `{ status: false, code: 404 }` in the body. Only that explicit answer means
 * the unit does not exist; a null body (network error, 5xx, challenge) or any
 * other code is a failed lookup, not proof of absence.
 */
/**
 * Route params can arrive still percent-encoded (e.g. the prerendered slug for
 * code "63/50/13" is "63%2F50%2F13"). Decode once so the lookup is not
 * double-encoded — the API answers a double-encoded code with an explicit
 * not-found, which would 404 a real listing.
 */
export function normalizeOpportunityCode(raw) {
  let value = String(raw ?? "");
  try {
    value = decodeURIComponent(value);
  } catch {
    // Not valid percent-encoding: use the token as given.
  }
  return value.trim();
}

export function isExplicitUnitNotFound(body) {
  if (!body || typeof body !== "object") return false;
  return body.status === false && Number(body.code) === 404;
}
