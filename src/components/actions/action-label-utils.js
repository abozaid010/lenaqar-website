import { actionCatalogService } from "@/services/actionCatalogService";
import {
  NEW_LEAD_ACTION,
  normalizeLastAction,
} from "@/utils/action-normalize";

/**
 * Map catalog action key → locale path under actionCatalog.labels.*
 */
export function actionKeyToLocalePath(key) {
  if (!key) return null;
  return `actionCatalog.labels.${String(key).trim()}`;
}

/**
 * Resolve a localized label for an action API value.
 * Prefer translate(actionCatalog.labels.KEY) with API label / value as fallback.
 *
 * @param {string|null|undefined} value
 * @param {(key: string, fallback?: string) => string} translate
 * @param {import("@/types/actions").ActionCatalog|null} [catalog]
 */
export function getLocalizedActionLabel(value, translate, catalog = null) {
  const normalized = normalizeLastAction(value);
  const source = catalog || actionCatalogService.getCatalogSync();

  if (source) {
    const spec =
      source.actions.find((a) => a.value === normalized) ||
      (source.filter_only || []).find((a) => a.value === normalized);

    if (spec) {
      const path = actionKeyToLocalePath(spec.key);
      const apiLabel = "label" in spec && spec.label ? spec.label : spec.value;
      if (path && typeof translate === "function") {
        return translate(path, apiLabel);
      }
      return apiLabel;
    }
  }

  // filter_only "new" without catalog
  if (normalized === NEW_LEAD_ACTION && typeof translate === "function") {
    return translate("actionCatalog.labels.NEW", "New");
  }

  if (typeof translate === "function") {
    return translate(`actionCatalog.values.${normalized}`, normalized);
  }

  return normalized;
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
      label: getLocalizedActionLabel(value, translate, catalog),
      key: spec?.key,
      terminal: spec?.terminal ?? false,
      requires_meeting_time: spec?.requires_meeting_time ?? false,
    };
  });

  if (includeFilterOnly) {
    const filterOnly = (catalog.filter_only || []).map((item) => ({
      value: item.value,
      label: getLocalizedActionLabel(item.value, translate, catalog),
      key: item.key,
      terminal: false,
      requires_meeting_time: false,
    }));
    return [...filterOnly, ...options];
  }

  return options;
}
