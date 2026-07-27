/**
 * Session persistence for hidden / pending-approval list filters.
 * Mirrors units session-filters behavior, with a separate key and shape
 * so the two pages never overwrite each other.
 */

const STORAGE_KEY = "lena_pending_approval_session_filters";

const DEFAULT_VISIBILITY = "pending_approval";

export function createEmptyPendingApprovalFilters() {
  return {
    visibility: DEFAULT_VISIBILITY,
    updated_at: "",
    property_type: "",
    furnished_type: "",
    min_price: "",
    max_price: "",
    author: "",
    team_phone: "",
    city: "",
    district: "",
    sub_district: "",
    bedrooms: "",
    purpose: "",
    min_area: "",
    max_area: "",
  };
}

export function hasActivePendingApprovalFilters(filters) {
  if (!filters || typeof filters !== "object") return false;
  if (
    filters.visibility &&
    String(filters.visibility).trim() !== "" &&
    filters.visibility !== DEFAULT_VISIBILITY
  ) {
    return true;
  }
  const keys = [
    "updated_at",
    "property_type",
    "furnished_type",
    "min_price",
    "max_price",
    "author",
    "team_phone",
    "city",
    "district",
    "sub_district",
    "bedrooms",
    "purpose",
    "min_area",
    "max_area",
  ];
  return keys.some((key) => {
    const value = filters[key];
    return value != null && String(value).trim() !== "";
  });
}

function parseStoredFilters(raw) {
  if (!raw) return createEmptyPendingApprovalFilters();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return createEmptyPendingApprovalFilters();
    }
    return { ...createEmptyPendingApprovalFilters(), ...parsed };
  } catch {
    return createEmptyPendingApprovalFilters();
  }
}

export function readPendingApprovalSessionFilters() {
  if (typeof window === "undefined") return createEmptyPendingApprovalFilters();
  try {
    return parseStoredFilters(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return createEmptyPendingApprovalFilters();
  }
}

export function writePendingApprovalSessionFilters(filters) {
  if (typeof window === "undefined") return;
  try {
    if (!hasActivePendingApprovalFilters(filters)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // sessionStorage may be unavailable — degrade silently
  }
}

export function clearPendingApprovalSessionFilters() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
