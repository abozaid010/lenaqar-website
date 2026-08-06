/** Soft color accents for action badges (keyed by API value). Unknown → gray. */
export const ACTIONS_COLORS = {
  "Make a call": "text-green-800",
  "Office visit": "text-yellow-800",
  "Property view": "text-teal-800",
  "Not interested": "text-gray-800",
  "Not qualified": "text-red-800",
  "Did not reply": "text-slate-600",
  "Follow up later": "text-orange-800",
  "Missing requirement": "text-purple-800",
  Blocked: "text-red-600",
  "Qualified lead": "text-emerald-800",
  Interested: "text-indigo-900",
  "Purchased through us": "text-emerald-900",
  "Listed with us": "text-teal-900",
  "Property already sold": "text-gray-700",
  "Collaboration accepted": "text-indigo-800",
  new: "text-sky-700",
  null: "text-sky-700",
};

/**
 * Temporary fallback when catalog has not loaded yet (SSR / first paint).
 * Prefer catalog `requires_meeting_time` whenever available.
 */
export const SCHEDULE_VISIBLE_ACTIONS = [
  "Make a call",
  "Office visit",
  "Property view",
  "Follow up later",
];

/** Default Calendar filter — API `action=Property view`. */
export const DEFAULT_SCHEDULE_ACTION_FILTER = "Property view";

export function getActionColorClass(value) {
  if (value == null) return ACTIONS_COLORS.null;
  return ACTIONS_COLORS[value] || "text-gray-800";
}

export const parseDashboardActionFilter = (actionParam) => {
  if (!actionParam || actionParam === "all") return [];
  return actionParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const serializeDashboardActionFilter = (actions) => {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  return actions.join(",");
};
