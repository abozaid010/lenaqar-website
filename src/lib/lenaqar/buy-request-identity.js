/**
 * The returning buyer's proof of ownership for the form prefill: the request's random
 * `matchRef`, kept next to the `userId` it belongs to. The backend reads a saved request
 * back only with that ref (a userId alone can be derived from a phone number).
 * Storage is passed in so `node --test` can use a fake.
 */
export const MATCH_REF_STORAGE_KEY = "lenaqar_buy_request_match_ref";

export function readMatchRef(storage, userId) {
  if (!storage || !userId) return "";
  try {
    const saved = JSON.parse(storage.getItem(MATCH_REF_STORAGE_KEY) || "null");
    return saved?.userId === userId && typeof saved.matchRef === "string"
      ? saved.matchRef
      : "";
  } catch {
    return "";
  }
}

export function writeMatchRef(storage, userId, matchRef) {
  if (!storage || !userId || !matchRef) return;
  try {
    storage.setItem(MATCH_REF_STORAGE_KEY, JSON.stringify({ userId, matchRef }));
  } catch {
    /* private mode */
  }
}
