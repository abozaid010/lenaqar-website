/**
 * Normalise client id from API objects (units use clientId; projects/developers use client_id).
 * @param {object|null|undefined} item
 * @returns {string|null}
 */
export function getItemClientId(item) {
  const id = item?.client_id ?? item?.clientId ?? null;
  return id != null && String(id).trim() !== "" ? String(id) : null;
}

/**
 * True when the item belongs to the logged-in client.
 * @param {object|null|undefined} item
 * @param {string|null|undefined} myClientId
 * @returns {boolean}
 */
export function isOwnClientUnit(item, myClientId) {
  const itemClientId = getItemClientId(item);
  const normalizedMyClientId =
    myClientId != null && String(myClientId).trim() !== ""
      ? String(myClientId)
      : null;

  if (!itemClientId || !normalizedMyClientId) return false;
  return itemClientId === normalizedMyClientId;
}
