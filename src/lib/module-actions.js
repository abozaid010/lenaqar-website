"use client";

/**
 * Normalize a module action list into consistent boolean capabilities.
 *
 * Extensible: if you add new actions (e.g. "export", "approve"), use `has(action)`
 * or add a new boolean mapping here in one place.
 */

export function normalizeActions(actions) {
  return Array.isArray(actions) ? actions.filter(Boolean) : [];
}

export function getModulePermissionFlags(actions) {
  const a = normalizeActions(actions);
  const has = (action) => a.includes(action);
  const hasCi = (name) =>
    a.some((x) => String(x).toLowerCase() === String(name).toLowerCase());

  const canView = has("view");
  const canCreate = has("create");
  const canEdit = has("update_own");
  const canDelete = has("delete_own");
  // Backend may send update_contacts or UPDATE_CONTACTS
  const canEditDeveloperContactInfo = hasCi("update_developer_contacts");

  return {
    actions: a,
    has,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canEditDeveloperContactInfo,
  };
}

export function getActionsForModule(moduleActions, moduleName) {
  if (!moduleName) return [];
  if (!moduleActions || typeof moduleActions !== "object") return null;
  if (!Object.prototype.hasOwnProperty.call(moduleActions, moduleName)) return [];
  return normalizeActions(moduleActions[moduleName]);
}

