/**
 * Lead acquisition `source` — Homey dashboard filter values.
 *
 * Sent as comma-separated `source` query param to `messages/v2/all`.
 * Exact match on stored `source` (after strip). The literal `"null"` filters
 * leads whose stored source is null/missing.
 */

export const LEAD_SOURCE_NULL = "null";

export const LEAD_SOURCES = [
  "facebook_activation",
  "added_manually",
  LEAD_SOURCE_NULL,
];

/** Translation keys for each source label (see locales `dashboardFilter.source`). */
export const LEAD_SOURCE_TRANSLATION_KEYS = {
  facebook_activation: "dashboardFilter.source.facebookActivation",
  added_manually: "dashboardFilter.source.addedManually",
  [LEAD_SOURCE_NULL]: "dashboardFilter.source.none",
};

/**
 * Normalize an arbitrary source value to a canonical option or null.
 * @param {unknown} value
 * @returns {"facebook_activation" | "added_manually" | "null" | null}
 */
export function normalizeLeadSource(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  return LEAD_SOURCES.includes(normalized) ? normalized : null;
}

/**
 * Localized label for a lead source. Empty string when unknown.
 * @param {unknown} value
 * @param {(key: string, fallback?: string) => string} translate
 * @returns {string}
 */
export function getLeadSourceLabel(value, translate) {
  const normalized = normalizeLeadSource(value);
  if (!normalized) return "";
  const key = LEAD_SOURCE_TRANSLATION_KEYS[normalized];
  if (typeof translate !== "function") return normalized;
  const fallbacks = {
    facebook_activation: "Facebook Activation",
    added_manually: "Added Manually",
    [LEAD_SOURCE_NULL]: "No Source",
  };
  return translate(key, fallbacks[normalized] || normalized);
}

/**
 * Parse a comma-separated source filter string into canonical values.
 * @param {string | null | undefined} raw
 * @returns {Array<"facebook_activation" | "added_manually" | "null">}
 */
export function parseLeadSourceFilter(raw) {
  if (!raw) return [];
  return Array.from(
    new Set(
      String(raw)
        .split(",")
        .map((part) => normalizeLeadSource(part))
        .filter(Boolean),
    ),
  );
}

/**
 * Serialize selected sources into a comma-separated string (or null).
 * @param {Array<string>} values
 * @returns {string | null}
 */
export function serializeLeadSourceFilter(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const unique = Array.from(
    new Set(values.map((v) => normalizeLeadSource(v)).filter(Boolean)),
  );
  return unique.length > 0 ? unique.join(",") : null;
}

/**
 * Whether the dashboard source filter should be shown.
 * Homey tenant + admin/owner only.
 * @param {string | null | undefined} clientId
 * @param {boolean} isAdminOrOwner
 * @returns {boolean}
 */
export function canShowLeadSourceFilter(clientId, isAdminOrOwner) {
  if (!isAdminOrOwner) return false;
  return String(clientId || "").trim().toLowerCase() === "homey";
}
