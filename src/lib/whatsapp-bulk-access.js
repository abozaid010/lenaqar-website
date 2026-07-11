function normalizeActions(actions) {
  return Array.isArray(actions) ? actions.filter(Boolean) : [];
}

export const WHATSAPP_ACTION_API = "whatsapp_api";
export const WHATSAPP_ACTION_AUTOMATION = "whatsapp_automation";

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
 * Resolve bulk WhatsApp UI flags from `module_actions.conversation` only.
 * Checks for `whatsapp_api` or `whatsapp_automation` actions.
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

  // Only check the "conversation" module
  const conversationActions = moduleActions.conversation;
  if (!conversationActions) {
    return empty;
  }

  const actions = extractModuleActionList(conversationActions);
  let canUseApiTemplate = false;
  let canUseAutomation = false;

  if (moduleActionListIncludes(actions, WHATSAPP_ACTION_API)) {
    canUseApiTemplate = true;
  }
  if (moduleActionListIncludes(actions, WHATSAPP_ACTION_AUTOMATION)) {
    canUseAutomation = true;
  }

  return {
    isReady: true,
    canShowBulkButton: canUseApiTemplate || canUseAutomation,
    canUseApiTemplate,
    canUseAutomation,
    hasBothModules: canUseApiTemplate && canUseAutomation,
  };
}
