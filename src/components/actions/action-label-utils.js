import { actionCatalogService } from "@/services/actionCatalogService";
import {
  NEW_LEAD_ACTION,
  normalizeLastAction,
} from "@/utils/action-normalize";

/** API value → ActionSpec.key for locale lookup when catalog is unavailable. */
export const ACTION_VALUE_TO_KEY = {
  new: "NEW",
  Contacted: "CONTACTED",
  "Make a call": "MAKE_A_CALL",
  "Office visit": "OFFICE_VISIT",
  "Follow up later": "FOLLOW_UP_LATER",
  "Did not reply": "DID_NOT_REPLY",
  "Qualified lead": "QUALIFIED_LEAD",
  "Not qualified": "NOT_QUALIFIED",
  Interested: "INTERESTED",
  "Not interested": "NOT_INTERESTED",
  "Missing requirement": "MISSING_REQUIREMENT",
  "Requirements updated": "REQUIREMENTS_UPDATED",
  Blocked: "BLOCKED",
  "Properties shared": "PROPERTIES_SHARED",
  "Viewing request": "VIEWING_REQUEST",
  "Property view": "PROPERTY_VIEW",
  "Property viewed": "PROPERTY_VIEWED",
  Negotiating: "NEGOTIATING",
  "Purchased through us": "PURCHASED_THROUGH_US",
  "Purchased elsewhere": "PURCHASED_ELSEWHERE",
  "Rented through us": "RENTED_THROUGH_US",
  "Rented elsewhere": "RENTED_ELSEWHERE",
  "Stopped searching": "STOPPED_SEARCHING",
  "Listed with us": "LISTED_WITH_US",
  "Property already sold": "PROPERTY_ALREADY_SOLD",
  "Property already rented": "PROPERTY_ALREADY_RENTED",
  "Property removed": "PROPERTY_REMOVED",
  "Collaboration accepted": "COLLABORATION_ACCEPTED",
  "Collaboration declined": "COLLABORATION_DECLINED",
};

const ACTION_GROUPS = [
  "shared",
  "property_progress",
  "demand_outcome",
  "supply_outcome",
  "broker",
  "filter_only",
];

/**
 * Map catalog action key → locale path under actionCatalog.labels.*
 */
export function actionKeyToLocalePath(key) {
  if (!key) return null;
  return `actionCatalog.labels.${String(key).trim()}`;
}

function resolveKeyForValue(value, catalog = null) {
  const normalized = normalizeLastAction(value);
  const source = catalog || actionCatalogService.getCatalogSync();

  if (source) {
    const spec =
      source.actions.find((a) => a.value === normalized) ||
      (source.filter_only || []).find((a) => a.value === normalized);
    if (spec?.key) return { key: spec.key, apiLabel: spec.label || spec.value };
  }

  const mapped = ACTION_VALUE_TO_KEY[normalized];
  if (mapped) return { key: mapped, apiLabel: normalized };

  return { key: null, apiLabel: normalized };
}

/**
 * Look up a value inside actionCatalog.actions.* groups (spaces-safe).
 * @param {Record<string, unknown>|null|undefined} messages — raw locale `t`
 * @param {string} value
 */
export function lookupActionValueInLocaleMessages(messages, value) {
  const groups = messages?.actionCatalog?.actions;
  if (!groups || value == null) return null;

  const normalized = normalizeLastAction(value);
  for (const groupName of ACTION_GROUPS) {
    const group = groups[groupName];
    if (group && typeof group === "object" && normalized in group) {
      return group[normalized];
    }
  }
  return null;
}

/**
 * Resolve a localized label for an action API value.
 * Order: catalog key → static value→key map → grouped actions[value] → API label.
 *
 * Catalog keys can differ from locale keys (e.g. API `QUALIFIED` vs locale
 * `QUALIFIED_LEAD`); always try the static map before falling back to English.
 *
 * @param {string|null|undefined} value
 * @param {(key: string, fallback?: string) => string} translate
 * @param {import("@/types/actions").ActionCatalog|null} [catalog]
 * @param {Record<string, unknown>|null} [messages] — optional raw `t` for by-value groups
 */
export function getLocalizedActionLabel(
  value,
  translate,
  catalog = null,
  messages = null
) {
  const normalized = normalizeLastAction(value);
  const { key, apiLabel } = resolveKeyForValue(normalized, catalog);
  const mappedKey = ACTION_VALUE_TO_KEY[normalized] || null;
  const keysToTry = [...new Set([key, mappedKey].filter(Boolean))];

  for (const labelKey of keysToTry) {
    const fromMessages = messages?.actionCatalog?.labels?.[labelKey];
    if (typeof fromMessages === "string" && fromMessages.trim()) {
      return fromMessages;
    }

    if (typeof translate === "function") {
      const path = actionKeyToLocalePath(labelKey);
      const sentinel = `\0missing:${labelKey}`;
      const translated = translate(path, sentinel);
      if (translated && translated !== sentinel) return translated;
    }
  }

  const fromGroups = lookupActionValueInLocaleMessages(messages, normalized);
  if (fromGroups) return fromGroups;

  if (normalized === NEW_LEAD_ACTION && typeof translate === "function") {
    return translate("actionCatalog.labels.NEW", "New");
  }

  return apiLabel || normalized;
}

/**
 * Build dropdown / filter options from catalog.
 */
export function buildActionOptions({
  catalog,
  ownerType = null,
  ownerTypes = null,
  includeFilterOnly = false,
  translate,
  messages = null,
}) {
  if (!catalog?.actions) return [];

  const resolveForOwnerType = (type) => {
    if (!type) return catalog.actions.map((a) => a.value);
    const key = String(type).trim().toLowerCase();
    if (Array.isArray(catalog.by_owner_type?.[key])) {
      return catalog.by_owner_type[key];
    }
    return catalog.actions
      .filter(
        (a) =>
          !a.owner_types?.length ||
          a.owner_types.some((t) => String(t).toLowerCase() === key)
      )
      .map((a) => a.value);
  };

  let values;
  if (Array.isArray(ownerTypes) && ownerTypes.length > 0) {
    const normalized = ownerTypes
      .map((t) => (t == null ? "" : String(t).trim().toLowerCase()))
      .filter(Boolean);
    const unique = [...new Set(normalized)];
    if (unique.length === 0) {
      values = catalog.actions.map((a) => a.value);
    } else if (unique.length === 1) {
      values = resolveForOwnerType(unique[0]);
    } else {
      const lists = unique.map((t) => new Set(resolveForOwnerType(t)));
      values = [...lists[0]].filter((v) => lists.every((s) => s.has(v)));
    }
  } else if (ownerType) {
    values = resolveForOwnerType(ownerType);
  } else {
    values = catalog.actions.map((a) => a.value);
  }

  const options = values.map((value) => {
    const spec = catalog.actions.find((a) => a.value === value);
    return {
      value,
      label: getLocalizedActionLabel(value, translate, catalog, messages),
      key: spec?.key,
      terminal: spec?.terminal ?? false,
      requires_meeting_time: spec?.requires_meeting_time ?? false,
    };
  });

  if (includeFilterOnly) {
    const filterOnly = (catalog.filter_only || []).map((item) => ({
      value: item.value,
      label: getLocalizedActionLabel(item.value, translate, catalog, messages),
      key: item.key,
      terminal: false,
      requires_meeting_time: false,
    }));
    return [...filterOnly, ...options];
  }

  return options;
}
