export const UNITS_FILTER_PARAM_KEYS = [
  "city",
  "district",
  "sub_district",
  "developer_name",
  "project_name",
  "purpose",
  "property_type",
  "furnished_type",
  "bedrooms",
  "min_price",
  "max_price",
  "min_area",
  "max_area",
  "my_inventory",
  "resale",
  "show_present_value",
  "author",
  "sort_by",
  "sort_order",
];

/** UI-only filter keys — never sent to slim-list API. */
export const UNITS_UI_ONLY_FILTER_KEYS = ["show_present_value", "resale"];

/** Resale inventory filter: "" | "both" = all units; "primary" | "resale". */
export const RESALE_FILTER_BOTH = "";
export const RESALE_FILTER_PRIMARY = "primary";
export const RESALE_FILTER_RESALE = "resale";

/**
 * Normalize URL / stored / legacy boolean resale values.
 * Legacy `true` / `"true"` → resale-only.
 */
export function normalizeResaleFilter(value) {
  if (value === true || value === "true" || value === RESALE_FILTER_RESALE) {
    return RESALE_FILTER_RESALE;
  }
  if (value === RESALE_FILTER_PRIMARY) {
    return RESALE_FILTER_PRIMARY;
  }
  return RESALE_FILTER_BOTH;
}

/**
 * Map UI `resale` filter onto API params: deletes `resale`, sets `is_primary`
 * only for primary/resale. Both leaves `is_primary` unset.
 */
export function applyResaleFilterToApiParams(params, resaleValue) {
  if (!params || typeof params !== "object") return params;
  delete params.resale;
  const normalized = normalizeResaleFilter(resaleValue);
  if (normalized === RESALE_FILTER_PRIMARY) {
    params.is_primary = true;
  } else if (normalized === RESALE_FILTER_RESALE) {
    params.is_primary = false;
  } else {
    delete params.is_primary;
  }
  return params;
}

const STORAGE_KEY_PREFIX = "lena_units_favorite_searches";

export function getFavoriteSearchesStorageKey(isPublic = false) {
  return `${STORAGE_KEY_PREFIX}_${isPublic ? "public" : "admin"}`;
}

export function createEmptyFilters() {
  return {
    city: "",
    district: "",
    sub_district: "",
    developer_name: "",
    project_name: "",
    purpose: "",
    property_type: "",
    furnished_type: "",
    bedrooms: "",
    min_price: "",
    max_price: "",
    min_area: "",
    max_area: "",
    my_inventory: false,
    resale: RESALE_FILTER_BOTH,
    show_present_value: false,
    author: "",
    sort_by: "",
    sort_order: "",
  };
}

export function filtersFromSearchParams(searchParams) {
  return {
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
    sub_district: searchParams.get("sub_district") || "",
    developer_name: searchParams.get("developer_name") || "",
    project_name: searchParams.get("project_name") || "",
    purpose: searchParams.get("purpose") || "",
    property_type: searchParams.get("property_type") || "",
    furnished_type: searchParams.get("furnished_type") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    min_area: searchParams.get("min_area") || "",
    max_area: searchParams.get("max_area") || "",
    my_inventory: searchParams.get("my_inventory") === "true",
    resale: normalizeResaleFilter(searchParams.get("resale")),
    show_present_value: searchParams.get("show_present_value") === "true",
    author: searchParams.get("author") || "",
    sort_by: searchParams.get("sort_by") || "",
    sort_order: searchParams.get("sort_order") || "",
  };
}

export function filtersToSearchParams(filters, baseParams = new URLSearchParams()) {
  const params = new URLSearchParams(baseParams.toString());

  UNITS_FILTER_PARAM_KEYS.forEach((key) => {
    params.delete(key);
  });

  UNITS_FILTER_PARAM_KEYS.forEach((key) => {
    const value = filters[key];
    if (key === "my_inventory" || key === "show_present_value") {
      if (value) params.set(key, "true");
      return;
    }
    if (key === "resale") {
      const normalized = normalizeResaleFilter(value);
      if (normalized === RESALE_FILTER_PRIMARY || normalized === RESALE_FILTER_RESALE) {
        params.set(key, normalized);
      }
      return;
    }
    if (value && String(value).trim() !== "" && value !== "all") {
      params.set(key, String(value));
    }
  });

  return params;
}

export function hasActiveFilters(filters) {
  return UNITS_FILTER_PARAM_KEYS.some((key) => {
    const value = filters[key];
    if (key === "my_inventory" || key === "show_present_value") {
      return Boolean(value);
    }
    if (key === "resale") {
      const normalized = normalizeResaleFilter(value);
      return (
        normalized === RESALE_FILTER_PRIMARY ||
        normalized === RESALE_FILTER_RESALE
      );
    }
    return value && String(value).trim() !== "" && value !== "all";
  });
}

export function normalizeFilterFieldValue(key, value) {
  if (key === "my_inventory" || key === "show_present_value") {
    return Boolean(value);
  }
  if (key === "resale") {
    return normalizeResaleFilter(value);
  }
  if (value == null || value === "all") return "";
  return String(value).trim();
}

export function areFiltersEqual(a, b) {
  if (!a || !b) return false;
  return UNITS_FILTER_PARAM_KEYS.every((key) => {
    if (key === "my_inventory" || key === "show_present_value") {
      return Boolean(a[key]) === Boolean(b[key]);
    }
    return normalizeFilterFieldValue(key, a[key]) === normalizeFilterFieldValue(key, b[key]);
  });
}

/** Pagination params that must reset when filters are applied. */
export const UNITS_PAGINATION_PARAM_KEYS = ["cursor", "direction"];

export function filtersToSearchParamsResettingPagination(
  filters,
  baseParams = new URLSearchParams()
) {
  const params = filtersToSearchParams(filters, baseParams);
  UNITS_PAGINATION_PARAM_KEYS.forEach((key) => params.delete(key));
  return params;
}

export function normalizeFavoriteName(name) {
  return String(name || "").trim();
}

export function isDuplicateFavoriteName(favorites, name, excludeId = null) {
  const normalized = normalizeFavoriteName(name).toLowerCase();
  if (!normalized) return false;
  return favorites.some(
    (favorite) =>
      favorite.id !== excludeId &&
      normalizeFavoriteName(favorite.name).toLowerCase() === normalized
  );
}

export function createFavoriteId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `fav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function parseStoredFavorites(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object" && item.id && item.name)
      .map((item) => {
        const filters = { ...createEmptyFilters(), ...(item.filters || {}) };
        filters.resale = normalizeResaleFilter(filters.resale);
        return {
          id: String(item.id),
          name: normalizeFavoriteName(item.name),
          filters,
          savedAt: item.savedAt || new Date().toISOString(),
        };
      });
  } catch {
    return [];
  }
}

export function readFavoriteSearches(storageKey) {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredFavorites(localStorage.getItem(storageKey));
  } catch {
    return [];
  }
}

export function writeFavoriteSearches(storageKey, favorites) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(favorites));
}
