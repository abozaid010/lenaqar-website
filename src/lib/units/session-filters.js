import {
  createEmptyFilters,
  hasActiveFilters,
} from "@/lib/units/favorite-searches";

const STORAGE_KEY_PREFIX = "lena_units_session_filters";

export function getSessionFiltersStorageKey(isPublic = false) {
  return `${STORAGE_KEY_PREFIX}_${isPublic ? "public" : "admin"}`;
}

function parseStoredFilters(raw) {
  if (!raw) return createEmptyFilters();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return createEmptyFilters();
    }
    return { ...createEmptyFilters(), ...parsed };
  } catch {
    return createEmptyFilters();
  }
}

export function readSessionFilters(storageKey) {
  if (typeof window === "undefined") return createEmptyFilters();
  try {
    return parseStoredFilters(sessionStorage.getItem(storageKey));
  } catch {
    return createEmptyFilters();
  }
}

export function writeSessionFilters(storageKey, filters) {
  if (typeof window === "undefined") return;
  try {
    if (!hasActiveFilters(filters)) {
      sessionStorage.removeItem(storageKey);
      return;
    }
    sessionStorage.setItem(storageKey, JSON.stringify(filters));
  } catch {
    // sessionStorage may be unavailable — degrade silently
  }
}

export function clearSessionFilters(storageKey) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
