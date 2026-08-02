import {
  createEmptyFilters,
  hasActiveFilters,
  normalizeResaleFilter,
  normalizeRentSearchEligibleFilter,
  RENT_SEARCH_ELIGIBLE_DEFAULT,
  RESALE_FILTER_BOTH,
} from "@/lib/units/favorite-searches";
import { isRentPurpose } from "@/lib/units/unit-price";

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
    const merged = { ...createEmptyFilters(), ...parsed };
    const purpose = merged.purpose;
    merged.resale =
      String(purpose || "").toLowerCase() === "sell"
        ? normalizeResaleFilter(merged.resale)
        : RESALE_FILTER_BOTH;
    merged.rentSearchEligible = isRentPurpose(purpose)
      ? normalizeRentSearchEligibleFilter(
          merged.rentSearchEligible || RENT_SEARCH_ELIGIBLE_DEFAULT
        )
      : "";
    return merged;
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
