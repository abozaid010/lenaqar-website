"use client";

import { actionCatalogService } from "@/services/actionCatalogService";
import { getLocalizedActionLabel } from "@/components/actions/action-label-utils";
import {
  NEW_LEAD_ACTION,
  normalizeLastAction,
} from "@/utils/action-normalize";
import {
  ACTIONS_COLORS,
  SCHEDULE_VISIBLE_ACTIONS,
  getActionColorClass,
  parseDashboardActionFilter,
  serializeDashboardActionFilter,
} from "@/utils/action-constants";

export {
  NEW_LEAD_ACTION,
  normalizeLastAction,
  ACTIONS_COLORS,
  SCHEDULE_VISIBLE_ACTIONS,
  getActionColorClass,
  parseDashboardActionFilter,
  serializeDashboardActionFilter,
};

/**
 * Localized action label.
 * Prefer passing `translate` as the second arg. Locale string ("en"|"ar") is
 * accepted for backward compatibility and falls back to the catalog API label.
 *
 * @param {string} value
 * @param {((key: string, fallback?: string) => string)|string} [languageOrTranslate="en"]
 */
export const getActionLabel = (value, languageOrTranslate = "en") => {
  if (typeof languageOrTranslate === "function") {
    return getLocalizedActionLabel(value, languageOrTranslate);
  }

  const catalog = actionCatalogService.getCatalogSync();
  const normalized = normalizeLastAction(value);
  if (catalog) {
    const spec =
      catalog.actions.find((a) => a.value === normalized) ||
      (catalog.filter_only || []).find((a) => a.value === normalized);
    if (spec) {
      return spec.label || spec.value;
    }
  }
  return normalized;
};

/**
 * Filter options including filter_only (e.g. "new"). Sync — requires catalog cache.
 * Prefer useActionOptions({ includeFilterOnly: true }) in React components.
 */
export const getFilterActions = () => {
  const catalog = actionCatalogService.getCatalogSync();
  if (!catalog) return [];
  const filterOnly = (catalog.filter_only || []).map((item) => ({
    value: item.value,
    label: item.label || item.value,
  }));
  const actions = catalog.actions.map((a) => ({
    value: a.value,
    label: a.label || a.value,
  }));
  return [...filterOnly, ...actions];
};

/** @deprecated Prefer useActionOptions — sync helper for non-React call sites. */
export const getDashboardFilterOptions = (languageOrTranslate = "en") => {
  return getFilterActions().map((action) => ({
    value: action.value,
    label: getActionLabel(action.value, languageOrTranslate),
  }));
};

/**
 * Schedule-visible actions = catalog entries with requires_meeting_time.
 * Sync from cache; prefer server catalog when available.
 */
export const getScheduleVisibleActions = () => {
  const fromService = actionCatalogService.getScheduledActionValuesSync();
  if (fromService.length) return fromService;
  return [];
};

export const getAllActions = () => getFilterActions();
