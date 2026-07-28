/**
 * Persist "Mark broker units" badges across reload / navigation.
 * Uses localStorage (survives refresh on desktop + mobile browsers).
 * Falls back to sessionStorage when localStorage is unavailable.
 * Scoped per client_id so tenants do not share badges.
 */

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

/** Legacy unscoped session key — migrated on first read. */
const LEGACY_SESSION_KEY = "broker_units";

const STORAGE_KEY_PREFIX = "lena_broker_units:";

/**
 * @param {string | null | undefined} [clientId]
 * @returns {string}
 */
export function brokerUnitsStorageKey(clientId) {
  const id = String(
    clientId ?? LenaCookiesManager.getClientId() ?? ""
  )
    .trim()
    .toLowerCase();
  return `${STORAGE_KEY_PREFIX}${id || "unknown"}`;
}

/** @deprecated Prefer brokerUnitsStorageKey — kept for callers/tests. */
export const BROKER_UNITS_STORAGE_KEY = LEGACY_SESSION_KEY;

/**
 * Prefer localStorage; fall back to sessionStorage (private mode / quota).
 * @returns {Storage | null}
 */
function getPersistentStorage() {
  if (typeof window === "undefined") return null;
  try {
    const { localStorage } = window;
    const probe = "__lena_broker_units_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

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
      return new Set(Object.keys(parsed).filter((id) => id && parsed[id]));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * One-time migrate legacy sessionStorage `broker_units` → scoped localStorage.
 * @param {Storage} storage
 * @param {string} key
 */
function migrateLegacySessionIfNeeded(storage, key) {
  if (typeof window === "undefined") return;
  try {
    const legacyRaw = window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!legacyRaw) return;
    const legacyIds = parseStoredBrokerUnitIds(legacyRaw);
    if (legacyIds.size === 0) {
      window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
      return;
    }
    const existing = parseStoredBrokerUnitIds(storage.getItem(key));
    for (const id of legacyIds) existing.add(id);
    storage.setItem(key, JSON.stringify([...existing]));
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // ignore migration failures
  }
}

/**
 * @param {string | null | undefined} [clientId]
 * @returns {Set<string>}
 */
export function readBrokerUnitIds(clientId) {
  if (typeof window === "undefined") return new Set();
  const storage = getPersistentStorage();
  if (!storage) return new Set();
  try {
    const key = brokerUnitsStorageKey(clientId);
    migrateLegacySessionIfNeeded(storage, key);
    return parseStoredBrokerUnitIds(storage.getItem(key));
  } catch {
    return new Set();
  }
}

/**
 * @param {Set<string> | Iterable<string>} ids
 * @param {string | null | undefined} [clientId]
 */
export function writeBrokerUnitIds(ids, clientId) {
  if (typeof window === "undefined") return;
  const storage = getPersistentStorage();
  if (!storage) return;
  try {
    const key = brokerUnitsStorageKey(clientId);
    const list = [...ids].map(String).filter(Boolean);
    if (list.length === 0) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage may be unavailable — degrade silently
  }
}

/**
 * Merge newly detected broker unit ids into persistent storage (idempotent).
 *
 * @param {Iterable<string>} newIds
 * @param {string | null | undefined} [clientId]
 * @returns {Set<string>} merged set
 */
export function mergeBrokerUnitIds(newIds, clientId) {
  const merged = readBrokerUnitIds(clientId);
  let changed = false;
  for (const id of newIds ?? []) {
    const key = String(id ?? "").trim();
    if (!key || merged.has(key)) continue;
    merged.add(key);
    changed = true;
  }
  if (changed) {
    writeBrokerUnitIds(merged, clientId);
  }
  return merged;
}
