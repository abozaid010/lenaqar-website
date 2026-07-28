/** Canonical last_action for leads without history (null, empty, or legacy "New"). */
export const NEW_LEAD_ACTION = "new";

/**
 * Normalize API `last_action` to the canonical value used in filters and display.
 * - null / empty / "New" → "new"
 * - existing actions → unchanged
 */
export const normalizeLastAction = (value) => {
  if (value == null) return NEW_LEAD_ACTION;
  const trimmed = String(value).trim();
  if (!trimmed) return NEW_LEAD_ACTION;
  if (trimmed.toLowerCase() === NEW_LEAD_ACTION) return NEW_LEAD_ACTION;
  return trimmed;
};
