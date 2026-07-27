/** Sort fields accepted by `/units/v1/slim-list` (and public slim-list). */
export const UNITS_SORT_FIELDS = [
  "updatedAt",
  "totalPrice",
  "monthlyRentPrice",
  "area",
  "deliveryDate",
];

export const UNITS_SORT_ORDERS = ["asc", "desc"];

/**
 * Encode sort field + direction for a single dropdown value.
 * @param {string} sortBy
 * @param {string} sortOrder
 * @returns {string}
 */
export function encodeUnitsSortValue(sortBy, sortOrder) {
  const field = String(sortBy || "").trim();
  const order = String(sortOrder || "").trim().toLowerCase();
  if (!field || !UNITS_SORT_FIELDS.includes(field)) return "";
  if (!UNITS_SORT_ORDERS.includes(order)) return "";
  // Price UI is a single pair; monthlyRentPrice is handled by backend coalesce.
  const normalizedField = field === "monthlyRentPrice" ? "totalPrice" : field;
  return `${normalizedField}:${order}`;
}

/**
 * @param {string} value - e.g. `totalPrice:asc`
 * @returns {{ sort_by: string, sort_order: string }}
 */
export function decodeUnitsSortValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return { sort_by: "", sort_order: "" };
  const [field, order] = raw.split(":");
  if (!UNITS_SORT_FIELDS.includes(field)) return { sort_by: "", sort_order: "" };
  const normalizedOrder = String(order || "").toLowerCase();
  if (!UNITS_SORT_ORDERS.includes(normalizedOrder)) {
    return { sort_by: "", sort_order: "" };
  }
  // Legacy bookmarks used monthlyRentPrice:* — map to unified price sort.
  const sort_by = field === "monthlyRentPrice" ? "totalPrice" : field;
  return { sort_by, sort_order: normalizedOrder };
}

/**
 * Build localized sort options (field + direction pairs).
 * Price is one pair: backend sorts by totalPrice when set, else monthlyRentPrice.
 * @param {(key: string, fallback?: string) => string} translate
 */
export function buildUnitsSortOptions(translate) {
  return [
    {
      value: "",
      label: translate("unitsFilter.sort.default", "Default"),
    },
    {
      value: "updatedAt:desc",
      label: translate("unitsFilter.sort.updatedNewest", "Updated: Newest first"),
    },
    {
      value: "updatedAt:asc",
      label: translate("unitsFilter.sort.updatedOldest", "Updated: Oldest first"),
    },
    {
      value: "totalPrice:asc",
      label: translate("unitsFilter.sort.priceLowHigh", "Price: Low to High"),
    },
    {
      value: "totalPrice:desc",
      label: translate("unitsFilter.sort.priceHighLow", "Price: High to Low"),
    },
    {
      value: "area:asc",
      label: translate("unitsFilter.sort.areaSmallLarge", "Area: Small to Large"),
    },
    {
      value: "area:desc",
      label: translate("unitsFilter.sort.areaLargeSmall", "Area: Large to Small"),
    },
    {
      value: "deliveryDate:asc",
      label: translate(
        "unitsFilter.sort.deliverySoonest",
        "Delivery: Soonest first"
      ),
    },
    {
      value: "deliveryDate:desc",
      label: translate(
        "unitsFilter.sort.deliveryLatest",
        "Delivery: Latest first"
      ),
    },
  ];
}
