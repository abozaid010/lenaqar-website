/**
 * Default module keys for sales team `module_actions` (aligned with backend / UI areas).
 */
export const TEAM_MODULE_KEYS = [
  "conversation",
  "team_members",
  "campaign",
  "units",
  "news",
  "chat_campaign",
  "developers",
  "projects",
  "map",
  "resale",
  "analytics",
  "calendar",
];

const ADMIN_ACTIONS = ["create", "import", "view", "update_own", "delete_own"];

const EDITOR_ACTIONS = ["create", "import", "view", "update_own"];

const VIEWER_ACTIONS = ["view"];

function actionsForModules(actions) {
  return Object.fromEntries(
    TEAM_MODULE_KEYS.map((key) => [key, [...actions]])
  );
}

/**
 * @param {"admin"|"editor"|"viewer"|string} role
 * @returns {Record<string, string[]>}
 */
export function getModuleActionsForTeamRole(role) {
  const r = String(role || "viewer").toLowerCase().trim();

  if (r === "admin") {
    return actionsForModules(ADMIN_ACTIONS);
  }
  if (r === "editor") {
    return actionsForModules(EDITOR_ACTIONS);
  }
  // viewer or unknown → view-only on all modules
  return actionsForModules(VIEWER_ACTIONS);
}
