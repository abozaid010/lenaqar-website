/** @typedef {{ module: string, available_actions: string[] }} PermissionSchemaModule */

/** @typedef {{ modules: PermissionSchemaModule[], allActions: string[] }} ParsedPermissionSchema */

import { MODULE_BASE_ACTIONS } from "@/lib/default-module-actions";

const FALLBACK_MODULES = [
  "projects",
  "developers",
  "units",
  "campaign",
  "chat_campaign",
  "conversation",
  "news",
  "team_members",
  "map",
  "resale",
  "analytics",
  "calendar",
  "social_media",
];

/** Never assign or surface these — permissions stay account-scoped (`*_own`). */
const EXCLUDED_CLIENT_ACTIONS = new Set(["update_any", "delete_any"]);

/**
 * API action is `whatsapp`; `whatsapp_api` is a legacy UI alias only (never send to API).
 */
const FALLBACK_ALL_ACTIONS = [
  ...MODULE_BASE_ACTIONS,
  "import",
  "update_developer_contacts",
  "whatsapp",
  "whatsapp_api",
  "whatsapp_automation",
  "leads_source_filter",
];

function filterClientActions(actions) {
  return (Array.isArray(actions) ? actions : []).filter(
    (a) => typeof a === "string" && !EXCLUDED_CLIENT_ACTIONS.has(a)
  );
}

/**
 * Per-module available actions for the fallback schema (base + extras only).
 */
function getFallbackAvailableActionsForModule(moduleKey) {
  const actions = [...MODULE_BASE_ACTIONS];
  const key = String(moduleKey || "").toLowerCase();

  if (key === "developers") {
    actions.push("update_developer_contacts");
  }
  if (key === "units") {
    actions.push("import");
  }
  if (key === "conversation") {
    actions.push(
      "import",
      "whatsapp",
      "whatsapp_automation",
      "whatsapp_api",
      "leads_source_filter"
    );
  }

  return actions;
}

const ACTION_LABEL_FALLBACKS = {
  view: "View",
  create: "Create",
  import: "Import",
  update_own: "Update Own",
  update_developer_contacts: "Update Developer Contacts",
  delete_own: "Delete Own",
  whatsapp: "WhatsApp API Template",
  whatsapp_api: "WhatsApp API Template",
  whatsapp_automation: "WhatsApp Automation",
  leads_source_filter: "Leads Source Filter",
};

const ACTION_LABEL_KEYS = {
  view: "modulePermissions.actions.view",
  create: "modulePermissions.actions.create",
  import: "modulePermissions.actions.import",
  update_own: "modulePermissions.actions.updateOwn",
  update_developer_contacts: "modulePermissions.actions.updateDeveloperContacts",
  delete_own: "modulePermissions.actions.deleteOwn",
  whatsapp: "modulePermissions.actions.whatsapp",
  whatsapp_api: "modulePermissions.actions.whatsappApi",
  whatsapp_automation: "modulePermissions.actions.whatsappAutomation",
  leads_source_filter: "modulePermissions.actions.leadsSourceFilter",
};

export function getFallbackPermissionSchema() {
  return {
    modules: FALLBACK_MODULES.map((module) => ({
      module,
      available_actions: getFallbackAvailableActionsForModule(module),
    })),
    allActions: [...FALLBACK_ALL_ACTIONS],
  };
}

/**
 * Normalize GET /client/permission-schema response (raw envelope or inner data).
 * @returns {ParsedPermissionSchema | null}
 */
export function parsePermissionSchemaResponse(response) {
  if (!response || typeof response !== "object") return null;

  const payload =
    Array.isArray(response.modules) || Array.isArray(response.all_actions)
      ? response
      : response.data && typeof response.data === "object"
        ? response.data
        : null;

  if (!payload) return null;

  const rawModules = Array.isArray(payload.modules) ? payload.modules : [];
  const modules = rawModules
    .map((entry) => {
      const module = entry?.module ?? entry?.name;
      const available_actions = filterClientActions(
        Array.isArray(entry?.available_actions) ? entry.available_actions : []
      );
      if (!module || typeof module !== "string") return null;
      return { module, available_actions };
    })
    .filter(Boolean);

  const allActions = filterClientActions(
    Array.isArray(payload.all_actions) ? payload.all_actions : []
  );

  if (modules.length === 0) return null;

  return {
    modules,
    allActions: allActions.length > 0 ? allActions : [...new Set(modules.flatMap((m) => m.available_actions))],
  };
}

export function getResolvedPermissionSchema(parsed) {
  const fallback = getFallbackPermissionSchema();
  if (!parsed) return fallback;

  const known = new Set(parsed.modules.map((m) => m.module));
  const mergedModules = [...parsed.modules];

  for (const entry of fallback.modules) {
    if (!known.has(entry.module)) {
      mergedModules.push(entry);
    }
  }

  return {
    modules: mergedModules.map((entry) => ({
      ...entry,
      available_actions: filterClientActions(entry.available_actions),
    })),
    allActions: filterClientActions(
      parsed.allActions?.length > 0 ? parsed.allActions : fallback.allActions
    ),
  };
}

export function getActionLabel(action, translate) {
  const key = ACTION_LABEL_KEYS[action];
  const fallback = ACTION_LABEL_FALLBACKS[action] ?? action;
  if (typeof translate === "function" && key) {
    return translate(key, fallback);
  }
  return fallback;
}

export function buildActionOptions(availableActions, translate) {
  const list = Array.isArray(availableActions) ? availableActions : [];
  return list.map((value) => ({
    value,
    label: getActionLabel(value, translate),
  }));
}

export function getAvailableActionsForModule(schema, moduleName) {
  const entry = schema?.modules?.find((m) => m.module === moduleName);
  if (entry?.available_actions?.length) {
    return filterClientActions(entry.available_actions);
  }
  return filterClientActions(schema?.allActions ?? FALLBACK_ALL_ACTIONS);
}

/** Drop actions that are not allowed for their module per schema. */
export function sanitizeModuleActions(moduleActions, schema) {
  if (!moduleActions || typeof moduleActions !== "object" || !schema) {
    return moduleActions ?? {};
  }

  const next = {};
  for (const [module, actions] of Object.entries(moduleActions)) {
    if (!Array.isArray(actions)) continue;
    const allowed = new Set(getAvailableActionsForModule(schema, module));
    const filtered = filterClientActions(actions).filter((a) => allowed.has(a));
    if (filtered.length > 0) next[module] = filtered;
  }
  return next;
}
