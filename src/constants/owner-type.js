/**
 * Lead identity ("owner_type") — canonical values for chatting leads.
 *
 * IMPORTANT: This is the lead's identity (who is chatting), NOT `client_type`
 * (the tenant/account type in auth). Identity must always live on `owner_type`,
 * never on `tags`.
 *
 * `developer` is kept for backward compatibility.
 *
 * `renter` is the side offering a unit for rent (موجر); `rentee` is the side
 * looking to rent one (مستاجر). Do not swap these when editing locale labels.
 */
export const OWNER_TYPES = [
  "owner",
  "broker",
  "developer",
  "renter",
  "buyer",
  "seller",
  "rentee",
];

/** Translation keys for each owner type label (see locales `ownerType`). */
export const OWNER_TYPE_TRANSLATION_KEYS = {
  owner: "ownerType.owner",
  broker: "ownerType.broker",
  developer: "ownerType.developer",
  renter: "ownerType.renter",
  buyer: "ownerType.buyer",
  seller: "ownerType.seller",
  rentee: "ownerType.rentee",
};

/**
 * Normalize an arbitrary owner_type value to a canonical option or null.
 * @param {unknown} value
 * @returns {"owner" | "broker" | "developer" | "renter" | "buyer" | "seller" | "rentee" | null}
 */
export function normalizeOwnerType(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  return OWNER_TYPES.includes(normalized) ? normalized : null;
}

/**
 * Human-readable, localized label for an owner type. Empty string when null.
 * @param {unknown} value
 * @param {(key: string, fallback?: string) => string} translate
 * @returns {string}
 */
export function getOwnerTypeLabel(value, translate) {
  const normalized = normalizeOwnerType(value);
  if (!normalized) return "";
  const key = OWNER_TYPE_TRANSLATION_KEYS[normalized];
  return typeof translate === "function" ? translate(key) : normalized;
}

/**
 * Parse an owner_type filter value into a single canonical value (or "").
 *
 * API breaking change: owner_type is now a single exact match, no comma
 * lists. Only the first value is honored (covers legacy bookmarked links).
 * @param {string | null | undefined} raw
 * @returns {"" | "owner" | "broker" | "developer" | "renter" | "buyer" | "seller" | "rentee"}
 */
export function parseOwnerTypeFilter(raw) {
  if (!raw) return "";
  return normalizeOwnerType(String(raw).split(",")[0]) || "";
}

/**
 * Serialize the selected owner type (or null when empty/invalid).
 * @param {string} value
 * @returns {string | null}
 */
export function serializeOwnerTypeFilter(value) {
  return normalizeOwnerType(value);
}
