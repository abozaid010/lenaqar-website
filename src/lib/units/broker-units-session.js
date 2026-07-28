/**
 * TEMP: session-scoped broker unit badges (admin "Mark broker units").
 * Persists unit selection ids in sessionStorage for the browser tab lifetime.
 */

export const BROKER_UNITS_STORAGE_KEY = "broker_units";

/**
 * @param {unknown} raw
 * @returns {Set<string>}
 */
function parseStoredBrokerUnitIds(raw) {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(
        parsed.filter((id) => id != null && id !== "").map((id) => String(id))
      );
    }
    if (parsed && typeof parsed === "object") {
      return new Set(
        Object.keys(parsed).filter((id) => id && parsed[id])
      );
    }
    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * @returns {Set<string>}
 */
export function readBrokerUnitIds() {
  if (typeof window === "undefined") return new Set();
  try {
    return parseStoredBrokerUnitIds(
      sessionStorage.getItem(BROKER_UNITS_STORAGE_KEY)
    );
  } catch {
    return new Set();
  }
}

/**
 * @param {Set<string> | Iterable<string>} ids
 */
export function writeBrokerUnitIds(ids) {
  if (typeof window === "undefined") return;
  try {
    const list = [...ids].map(String).filter(Boolean);
    if (list.length === 0) {
      sessionStorage.removeItem(BROKER_UNITS_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(BROKER_UNITS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // sessionStorage may be unavailable — degrade silently
  }
}

/**
 * Merge newly detected broker unit ids into sessionStorage (idempotent).
 * Skips the write when nothing new is added.
 *
 * @param {Iterable<string>} newIds
 * @returns {Set<string>} merged set
 */
export function mergeBrokerUnitIds(newIds) {
  const merged = readBrokerUnitIds();
  let changed = false;
  for (const id of newIds ?? []) {
    const key = String(id ?? "").trim();
    if (!key || merged.has(key)) continue;
    merged.add(key);
    changed = true;
  }
  if (changed) {
    writeBrokerUnitIds(merged);
  }
  return merged;
}
