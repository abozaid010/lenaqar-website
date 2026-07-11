/**
 * Reusable defaults for sales-team `module_actions` derived from the **parent**
 * (logged-in client) `module_actions` shape: same module keys, role-based actions.
 *
 * Rules:
 * - **Viewer**: `view` only on each parent module (excluding analytics & team_members).
 * - **Editor** / **Admin**: standardized base actions (+ module extras) on parent
 *   modules; **editor** cannot see `analytics` or `team_members`.
 * - **Admin** only: always includes `team_members` and `analytics` (with the same
 *   privileged actions) so admins can manage team and see analytics.
 */

import {
  getDefaultActionsForModule,
  MODULE_BASE_ACTIONS,
} from "@/lib/default-module-actions";

/** Modules hidden for editor and viewer (admin may still have them). */
export const TEAM_MODULES_HIDDEN_FOR_EDITOR_AND_VIEWER = [
  "analytics",
  "team_members",
];

/** Fallback module list when parent `module_actions` is missing (same order as CRM areas). */
export const TEAM_PARENT_MODULE_FALLBACK_KEYS = [
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

export const TEAM_MEMBER_ACTIONS_VIEWER = ["view"];

/** @deprecated Prefer getDefaultActionsForModule — kept for callers expecting a flat list. */
export const TEAM_MEMBER_ACTIONS_EDITOR_AND_ADMIN = [...MODULE_BASE_ACTIONS];

function normalizeRole(role) {
  return String(role || "viewer").toLowerCase().trim();
}

function parentModuleKeys(parentModuleActions) {
  if (
    !parentModuleActions ||
    typeof parentModuleActions !== "object" ||
    Array.isArray(parentModuleActions)
  ) {
    return [...TEAM_PARENT_MODULE_FALLBACK_KEYS];
  }
  return Object.keys(parentModuleActions).filter(
    (key) =>
      Array.isArray(parentModuleActions[key]) &&
      parentModuleActions[key].length > 0
  );
}

function isHiddenFromEditorAndViewer(moduleKey) {
  return TEAM_MODULES_HIDDEN_FOR_EDITOR_AND_VIEWER.includes(moduleKey);
}

/**
 * Build `module_actions` for a new/updated team member from the parent's matrix.
 *
 * @param {Record<string, string[]>|null|undefined} parentModuleActions
 * @param {"admin"|"editor"|"viewer"|string} role
 * @returns {Record<string, string[]>}
 */
export function deriveTeamMemberModuleActionsFromParent(
  parentModuleActions,
  role
) {
  const r = normalizeRole(role);
  const baseKeys = parentModuleKeys(parentModuleActions);
  const out = {};

  if (r === "admin") {
    const keySet = new Set(baseKeys);
    TEAM_MODULES_HIDDEN_FOR_EDITOR_AND_VIEWER.forEach((m) => keySet.add(m));
    for (const key of keySet) {
      out[key] = getDefaultActionsForModule(key);
    }
    return out;
  }

  if (r === "editor") {
    for (const key of baseKeys) {
      if (isHiddenFromEditorAndViewer(key)) continue;
      out[key] = getDefaultActionsForModule(key);
    }
    return out;
  }

  // viewer (and unknown → treat as viewer)
  for (const key of baseKeys) {
    if (isHiddenFromEditorAndViewer(key)) continue;
    out[key] = [...TEAM_MEMBER_ACTIONS_VIEWER];
  }
  return out;
}
