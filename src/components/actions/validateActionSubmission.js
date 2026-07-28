import { actionCatalogService } from "@/services/actionCatalogService";

/**
 * Validate an action before create/update/bulk submit.
 * Never send invalid / unknown actions to the backend.
 *
 * @param {object} params
 * @param {string} params.action
 * @param {string|null|undefined} [params.meetingTime]
 * @param {import("@/types/actions").ActionCatalog|null} [params.catalog]
 * @returns {{ ok: true, actionSpec: import("@/types/actions").ActionSpec } | { ok: false, errorKey: string, errorFallback: string }}
 */
export function validateActionSubmission({
  action,
  meetingTime = null,
  catalog = null,
}) {
  const trimmed = typeof action === "string" ? action.trim() : "";
  if (!trimmed) {
    return {
      ok: false,
      errorKey: "actionCatalog.errors.actionRequired",
      errorFallback: "Please select an action",
    };
  }

  const source = catalog || actionCatalogService.getCatalogSync();
  if (!source) {
    return {
      ok: false,
      errorKey: "actionCatalog.errors.catalogUnavailable",
      errorFallback: "Action catalog unavailable. Try refreshing the page.",
    };
  }

  const actionSpec =
    source.actions.find((a) => a.value === trimmed) || null;

  if (!actionSpec) {
    // filter_only values are not submittable as lead actions
    const isFilterOnly = (source.filter_only || []).some(
      (f) => f.value === trimmed
    );
    return {
      ok: false,
      errorKey: isFilterOnly
        ? "actionCatalog.errors.filterOnlyNotSubmittable"
        : "actionCatalog.errors.unknownAction",
      errorFallback: isFilterOnly
        ? "This action can only be used as a filter"
        : `Unknown action: ${trimmed}`,
    };
  }

  if (actionSpec.requires_meeting_time) {
    const hasTime =
      typeof meetingTime === "string" && meetingTime.trim().length > 0;
    if (!hasTime) {
      return {
        ok: false,
        errorKey: "actionCatalog.errors.meetingTimeRequired",
        errorFallback: "Meeting time is required for this action",
      };
    }
  }

  return { ok: true, actionSpec };
}

export function isTerminalActionValue(action, catalog = null) {
  const source = catalog || actionCatalogService.getCatalogSync();
  if (!source) return false;
  return source.actions.find((a) => a.value === action)?.terminal ?? false;
}

export function actionRequiresMeetingTime(action, catalog = null) {
  const source = catalog || actionCatalogService.getCatalogSync();
  if (!source) return false;
  return (
    source.actions.find((a) => a.value === action)?.requires_meeting_time ??
    false
  );
}
