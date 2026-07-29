/** Sort fields accepted by `/units/v1/slim-list` (and public slim-list). */
export const UNITS_SORT_FIELDS = [
  "updatedAt",
  "totalPrice",
  "monthlyRentPrice",
  "area",
  "deliveryDate",
  "presentValue",
  "pricePerMeter",
];

/** Present-value sorts — sale / secondary contexts only. */
export const UNITS_PRESENT_VALUE_SORT_FIELDS = ["presentValue", "pricePerMeter"];

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
 * @param {string | null | undefined} purpose
 * @returns {boolean}
 */
export function shouldShowPresentValueSortOptions(purpose) {
  const p = String(purpose || "").trim().toLowerCase();
  // Hide for rent-only listings; show for sell or unset (mixed inventory).
  return p !== "rent" && p !== "lease";
}

/**
 * Build localized sort options (field + direction pairs).
 * Price is one pair: backend sorts by totalPrice when set, else monthlyRentPrice.
 * @param {(key: string, fallback?: string) => string} translate
 * @param {{ includePresentValueSorts?: boolean }} [options]
 */
export function buildUnitsSortOptions(translate, options = {}) {
  const includePresentValueSorts = options.includePresentValueSorts !== false;

  const optionsList = [
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

  if (includePresentValueSorts) {
    optionsList.push(
      {
        value: "presentValue:asc",
        label: translate(
          "unitsFilter.sort.presentValueLowHigh",
          "Present value (low → high)"
        ),
      },
      {
        value: "presentValue:desc",
        label: translate(
          "unitsFilter.sort.presentValueHighLow",
          "Present value (high → low)"
        ),
      },
      {
        value: "pricePerMeter:asc",
        label: translate(
          "unitsFilter.sort.pricePerMeterLowHigh",
          "Price / m² (low → high)"
        ),
      },
      {
        value: "pricePerMeter:desc",
        label: translate(
          "unitsFilter.sort.pricePerMeterHighLow",
          "Price / m² (high → low)"
        ),
      }
    );
  }

  return optionsList;
}
