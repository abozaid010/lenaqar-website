function normalizeActions(actions) {
  return Array.isArray(actions) ? actions.filter(Boolean) : [];
}

export const WHATSAPP_ACTION_API = "whatsapp";
export const WHATSAPP_ACTION_AUTOMATION = "whatsapp_automation";

/** Modules that may list WhatsApp send actions on the leads dashboard. */
export const WHATSAPP_ACTION_MODULE_KEYS = ["conversation", "chat_campaign"];

/**
 * Extract module_actions from profile API envelopes (shape varies).
 * @param {object|null|undefined} profileEnvelope
 * @returns {Record<string, unknown>|null}
 */
export function extractModuleActionsFromProfile(profileEnvelope) {
  if (!profileEnvelope || typeof profileEnvelope !== "object") return null;

  const candidates = [
    profileEnvelope?.data?.module_actions,
    profileEnvelope?.data?.user?.module_actions,
    profileEnvelope?.module_actions,
    profileEnvelope?.user?.module_actions,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

/**
 * Normalize per-module action list from API (array, nested object, or string).
 * @param {unknown} raw
 * @returns {string[]}
 */
export function extractModuleActionList(raw) {
  if (Array.isArray(raw)) {
    return normalizeActions(raw);
  }

  if (raw && typeof raw === "object") {
    const nested = raw.actions ?? raw.permissions ?? raw.module_actions;
    if (Array.isArray(nested)) {
      return normalizeActions(nested);
    }
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return Object.keys(nested).filter((k) => nested[k]);
    }
  }

  if (typeof raw === "string") {
    return raw
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

export function moduleActionListIncludes(actions, actionName) {
  const target = String(actionName).toLowerCase();
  return actions.some((entry) => String(entry).toLowerCase() === target);
}

/**
 * Resolve bulk WhatsApp UI flags from `module_actions` object.
 * Actions `whatsapp` and `whatsapp_automation` live on modules like `conversation`.
 */
export function resolveWhatsappBulkAccess(moduleActions) {
  const empty = {
    isReady: true,
    canShowBulkButton: false,
    canUseApiTemplate: false,
    canUseAutomation: false,
    hasBothModules: false,
  };

  if (
    !moduleActions ||
    typeof moduleActions !== "object" ||
    Array.isArray(moduleActions)
  ) {
    return empty;
  }

  let canUseApiTemplate = false;
  let canUseAutomation = false;

  const scanKeys = new Set([
    ...WHATSAPP_ACTION_MODULE_KEYS,
    ...Object.keys(moduleActions),
  ]);

  for (const moduleKey of scanKeys) {
    if (!Object.prototype.hasOwnProperty.call(moduleActions, moduleKey)) {
      continue;
    }
    const actions = extractModuleActionList(moduleActions[moduleKey]);
    if (moduleActionListIncludes(actions, WHATSAPP_ACTION_API)) {
      canUseApiTemplate = true;
    }
    if (moduleActionListIncludes(actions, WHATSAPP_ACTION_AUTOMATION)) {
      canUseAutomation = true;
    }
  }

  // Backend may expose WhatsApp as separate module keys (not only as conversation actions).
  if (Object.prototype.hasOwnProperty.call(moduleActions, WHATSAPP_ACTION_API)) {
    const featureActions = extractModuleActionList(moduleActions[WHATSAPP_ACTION_API]);
    if (featureActions.length > 0) {
      canUseApiTemplate = true;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(moduleActions, WHATSAPP_ACTION_AUTOMATION)
  ) {
    const featureActions = extractModuleActionList(
      moduleActions[WHATSAPP_ACTION_AUTOMATION]
    );
    if (featureActions.length > 0) {
      canUseAutomation = true;
    }
  }

  return {
    isReady: true,
    canShowBulkButton: canUseApiTemplate || canUseAutomation,
    canUseApiTemplate,
    canUseAutomation,
    hasBothModules: canUseApiTemplate && canUseAutomation,
  };
}
