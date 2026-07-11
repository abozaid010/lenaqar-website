/**
 * Standardized module action model for new clients and team Admin/Editor templates.
 *
 * Base (every module): view, create, update_own, delete_own
 * Extras:
 *   developers   → update_developer_contacts
 *   units        → import
 *   conversation → import, whatsapp, whatsapp_automation
 *
 * Note: API accepts `whatsapp` (not `whatsapp_api`) on conversation.
 */

export const MODULE_BASE_ACTIONS = [
  "view",
  "create",
  "update_own",
  "delete_own",
];

/** Modules included when creating a new client from Client Management. */
export const CLIENT_DEFAULT_MODULE_KEYS = [
  "projects",
  "developers",
  "units",
  "campaign",
  "conversation",
  "team_members",
  "analytics",
  "calendar",
  "social_media",
];

/**
 * Default action list for a single module (base + module-specific extras).
 * @param {string} moduleKey
 * @returns {string[]}
 */
export function getDefaultActionsForModule(moduleKey) {
  const key = String(moduleKey || "").toLowerCase().trim();
  const actions = [...MODULE_BASE_ACTIONS];

  if (key === "developers") {
    actions.push("update_developer_contacts");
  }
  if (key === "units") {
    actions.push("import");
  }
  if (key === "conversation") {
    actions.push("import", "whatsapp", "whatsapp_automation");
  }

  return actions;
}

/**
 * Build a full `module_actions` map from a list of module keys.
 * @param {string[]} moduleKeys
 * @returns {Record<string, string[]>}
 */
export function buildDefaultModuleActions(moduleKeys) {
  const out = {};
  for (const key of moduleKeys) {
    out[key] = getDefaultActionsForModule(key);
  }
  return out;
}

/** Default matrix applied on new client signup (broker & developer). */
export const DEFAULT_CLIENT_MODULE_ACTIONS = buildDefaultModuleActions(
  CLIENT_DEFAULT_MODULE_KEYS
);
