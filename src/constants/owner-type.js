/**
 * Lead identity ("owner_type") — canonical values for chatting leads.
 *
 * IMPORTANT: This is the lead's identity (who is chatting), NOT `client_type`
 * (the tenant/account type in auth). Identity must always live on `owner_type`,
 * never on `tags`.
 */
export const OWNER_TYPES = ["owner", "broker", "developer"];

/** Translation keys for each owner type label (see locales `ownerType`). */
export const OWNER_TYPE_TRANSLATION_KEYS = {
  owner: "ownerType.owner",
  broker: "ownerType.broker",
  developer: "ownerType.developer",
};

/**
 * Normalize an arbitrary owner_type value to a canonical option or null.
 * @param {unknown} value
 * @returns {"owner" | "broker" | "developer" | null}
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
 * Parse a comma-separated owner_type filter string into canonical values.
 * @param {string | null | undefined} raw
 * @returns {Array<"owner" | "broker" | "developer">}
 */
export function parseOwnerTypeFilter(raw) {
  if (!raw) return [];
  return Array.from(
    new Set(
      String(raw)
        .split(",")
        .map((part) => normalizeOwnerType(part))
        .filter(Boolean),
    ),
  );
}

/**
 * Serialize selected owner types into a comma-separated string (or null).
 * @param {Array<string>} values
 * @returns {string | null}
 */
export function serializeOwnerTypeFilter(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const unique = Array.from(
    new Set(values.map((v) => normalizeOwnerType(v)).filter(Boolean)),
  );
  return unique.length > 0 ? unique.join(",") : null;
}
