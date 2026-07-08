/** @typedef {{ module: string, available_actions: string[] }} PermissionSchemaModule */

/** @typedef {{ modules: PermissionSchemaModule[], allActions: string[] }} ParsedPermissionSchema */

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

const FALLBACK_ALL_ACTIONS = [
  "view",
  "create",
  "import",
  "update_own",
  "update_any",
  "update_developer_contacts",
  "delete_own",
  "delete_any",
  "whatsapp",
  "whatsapp_automation",
];

const ACTION_LABEL_FALLBACKS = {
  view: "View",
  create: "Create",
  import: "Import",
  update_own: "Update Own",
  update_any: "Update Any",
  update_developer_contacts: "Update Developer Contacts",
  delete_own: "Delete Own",
  delete_any: "Delete Any",
  whatsapp: "WhatsApp API Template",
  whatsapp_automation: "WhatsApp Automation",
};

const ACTION_LABEL_KEYS = {
  view: "modulePermissions.actions.view",
  create: "modulePermissions.actions.create",
  import: "modulePermissions.actions.import",
  update_own: "modulePermissions.actions.updateOwn",
  update_any: "modulePermissions.actions.updateAny",
  update_developer_contacts: "modulePermissions.actions.updateDeveloperContacts",
  delete_own: "modulePermissions.actions.deleteOwn",
  delete_any: "modulePermissions.actions.deleteAny",
  whatsapp: "modulePermissions.actions.whatsapp",
  whatsapp_automation: "modulePermissions.actions.whatsappAutomation",
};

export function getFallbackPermissionSchema() {
  return {
    modules: FALLBACK_MODULES.map((module) => ({
      module,
      available_actions: [...FALLBACK_ALL_ACTIONS],
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
      const available_actions = Array.isArray(entry?.available_actions)
        ? entry.available_actions.filter((a) => typeof a === "string")
        : [];
      if (!module || typeof module !== "string") return null;
      return { module, available_actions };
    })
    .filter(Boolean);

  const allActions = Array.isArray(payload.all_actions)
    ? payload.all_actions.filter((a) => typeof a === "string")
    : [];

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
    modules: mergedModules,
    allActions:
      parsed.allActions?.length > 0 ? parsed.allActions : fallback.allActions,
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
  if (entry?.available_actions?.length) return entry.available_actions;
  return schema?.allActions ?? FALLBACK_ALL_ACTIONS;
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
    const filtered = actions.filter((a) => allowed.has(a));
    if (filtered.length > 0) next[module] = filtered;
  }
  return next;
}
