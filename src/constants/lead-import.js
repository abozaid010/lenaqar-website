/** Allowed `platform` values for POST /leads/bulk (must match backend). */
export const VALID_LEAD_PLATFORMS = [
  "whatsapp",
  "ultramsg",
  "openwa",
  "messenger",
  "telegram",
  "twilio_whatsapp",
  "website",
  "chat_pwa_app",
  "iframe",
  "crm",
];

export const DEFAULT_LEAD_PLATFORM = "website";
export const DEFAULT_LEAD_CAMPAIGN_ID = "added_manually";

/**
 * Recommended columns for the downloadable template. Display labels are used as
 * the header row; the importer matches them case-insensitively via aliases, so
 * "Name", "name", "Full Name", etc. all map to the same field.
 */
export const LEAD_IMPORT_TEMPLATE_COLUMNS = [
  "Name",
  "Phone",
  "Notes",
  "Campaign ID",
  "Platform",
  "Owner Type",
];

export const LEAD_IMPORT_TEMPLATE_EXAMPLE_ROW = [
  "John Doe",
  "+201012345678",
  "Interested in 2 bedroom apartment",
  "summer_campaign",
  "website",
  "buyer",
];

/**
 * Normalize a platform cell value. Returns a valid platform slug or null when invalid.
 * Empty values map to the default platform.
 */
export function normalizeLeadPlatform(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_LEAD_PLATFORM;

  const normalized = raw.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (VALID_LEAD_PLATFORMS.includes(normalized)) return normalized;

  return null;
}

export function isValidLeadPlatform(value) {
  return normalizeLeadPlatform(value) !== null;
}

export function formatAllowedPlatformsList() {
  return VALID_LEAD_PLATFORMS.join(", ");
}
