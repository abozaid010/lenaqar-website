const ENUM_FIELDS = [
  "buildingType",
  "viewType",
  "finishingType",
  "furnishingType",
  "propertyStatus",
  "propertyUsage",
  "propertyPurpose",
  "propertyIntent",
  "purpose",
];

const PRICE_FIELDS = [
  "totalPrice",
  "min_price",
  "max_price",
  "daily_min_price",
  "daily_max_price",
  "downPayment",
  "monthlyInstallment",
  "serviceCharges",
  "land_area",
  "roomsCount",
  "bathroomCount",
  "floor",
  "gardenSize",
  "garageSize",
];

function coercePriceValue(value) {
  if (value === "" || value === undefined) return null;
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Sanitize a requirements object before sending to the backend.
 *
 * - Enum fields: "" → null
 * - Price/numeric fields: "" → null, strings parsed to float
 */
export function cleanRequirementsPayload(raw) {
  if (!raw || typeof raw !== "object") return {};

  const out = {};

  for (const [key, value] of Object.entries(raw)) {
    if (ENUM_FIELDS.includes(key)) {
      out[key] = value === "" ? null : value;
      continue;
    }
    if (PRICE_FIELDS.includes(key)) {
      out[key] = coercePriceValue(value);
      continue;
    }
    out[key] = value;
  }

  return out;
}
