export const BUILDING_TYPE_VALUES = [
  "apartment",
  "villa",
  "svilla",
  "townhouse",
  "duplex",
  "duplex ground",
  "duplex roof",
  "penthouse",
  "studio",
  "chalet",
  "office",
  "shop",
  "twinhouse",
  "house",
  "pharmacy",
  "clinic",
  "cabinet",
  "commercial",
  "serviced apartment",
  // Keep legacy API variant (some feeds still send this)
  "service apartment",
  "loft",
  "office villa",
  "condo",
  "land",
  "food and beverage",
  "retail",
  "standalone",
  "admin",
  "bank",
  "medical",
  "palace",
  "sky loft",
  "maisonette",
  "warehouse",
  "suite",
  "farm",
  "beauty salon",
  "cafe",
  "gym",
  "parking",
  "garage",
  "workspace",
  "storage",
  "hotel",
  "hostel",
] as const;

export type BuildingTypeValue = (typeof BUILDING_TYPE_VALUES)[number];

/**
 * Building types treated as commercial for unit-form field visibility
 * (e.g. outdoor area is commercial-only; residential hides it).
 */
export const COMMERCIAL_BUILDING_TYPES = [
  "office",
  "shop",
  "pharmacy",
  "clinic",
  "cabinet",
  "commercial",
  "office villa",
  "food and beverage",
  "retail",
  "admin",
  "bank",
  "medical",
  "warehouse",
  "beauty salon",
  "cafe",
  "gym",
  "parking",
  "garage",
  "workspace",
  "storage",
] as const;

export type CommercialBuildingTypeValue =
  (typeof COMMERCIAL_BUILDING_TYPES)[number];

export function isCommercialBuildingType(
  buildingType: string | null | undefined
): boolean {
  const v = String(buildingType ?? "")
    .trim()
    .toLowerCase();
  if (!v) return false;
  return (COMMERCIAL_BUILDING_TYPES as readonly string[]).includes(v);
}

export type TranslateFn = (key: string, fallback?: string | null) => string;

const humanize = (value: string): string => {
  const s = String(value || "").trim();
  if (!s) return "";
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const getBuildingTypeTranslationKey = (value: string) => `buildingTypes.${value}`;

export const getBuildingTypeLabel = (
  value: string | null | undefined,
  translate: TranslateFn,
  fallback?: string
) => {
  const v = value != null ? String(value).trim() : "";
  if (!v) return fallback ?? "";
  return translate(getBuildingTypeTranslationKey(v), fallback ?? humanize(v));
};

export const getBuildingTypeOptions = (translate: TranslateFn) => {
  return BUILDING_TYPE_VALUES.map((value) => ({
    value,
    label: getBuildingTypeLabel(value, translate, humanize(value)),
  }));
};

