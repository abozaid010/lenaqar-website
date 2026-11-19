/**
 * The returning buyer's proof of ownership for the form prefill: the request's random
 * `matchRef`, kept next to the `userId` it belongs to. The backend reads a saved request
 * back only with that ref (a userId alone can be derived from a phone number).
 * Storage is passed in so `node --test` can use a fake.
 */
export const MATCH_REF_STORAGE_KEY = "lenaqar_buy_request_match_ref";

function readRecord(storage) {
  if (!storage) return null;
  try {
    const saved = JSON.parse(storage.getItem(MATCH_REF_STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

export function readMatchRef(storage, userId) {
  if (!userId) return "";
  const saved = readRecord(storage);
  return saved?.userId === userId && typeof saved.matchRef === "string"
    ? saved.matchRef
    : "";
}

const HINT_NAME_MAX = 40;

/**
 * What the edit form shows instead of asking for the contact again: the name as typed
 * and the last three digits of the phone. Never the full number. Null when there is
 * nothing usable.
 */
export function contactHintFrom({ name, phone } = {}) {
  const cleanName = String(name || "").trim().replace(/\s+/g, " ").slice(0, HINT_NAME_MAX);
  const phoneTail = String(phone || "").replace(/\D/g, "").slice(-3);
  if (!cleanName && phoneTail.length < 3) return null;
  return { name: cleanName, phoneTail: phoneTail.length === 3 ? phoneTail : "" };
}

/** The contact hint saved with this user's proof of ownership, or null. */
export function readContactHint(storage, userId) {
  const saved = readRecord(storage);
  if (!userId || saved?.userId !== userId) return null;
  const hint = saved.contact;
  if (!hint || typeof hint !== "object") return null;
  const name = String(hint.name || "").slice(0, HINT_NAME_MAX);
  const phoneTail = /^\d{3}$/.test(hint.phoneTail || "") ? hint.phoneTail : "";
  return name || phoneTail ? { name, phoneTail } : null;
}

/**
 * Keep the proof of ownership for `userId`. A new `contact` hint replaces the saved
 * one; without it the hint already saved for the same user stays (an edit sends no
 * contact).
 */
export function writeMatchRef(storage, userId, matchRef, contact) {
  if (!storage || !userId || !matchRef) return;
  try {
    const hint = contact ? contactHintFrom(contact) : readContactHint(storage, userId);
    storage.setItem(
      MATCH_REF_STORAGE_KEY,
      JSON.stringify({ userId, matchRef, ...(hint ? { contact: hint } : {}) }),
    );
  } catch {
    /* private mode */
  }
}

/** Forget the proof and hint (the backend no longer accepts them). */
export function clearMatchRef(storage) {
  try {
    storage?.removeItem(MATCH_REF_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
