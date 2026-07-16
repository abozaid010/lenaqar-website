export const USER_ACTIONS = [
  {
    value: "",
    en_label: "All Actions",
    ar_label: "كل الإجراءات",
  },
  {
    value: "new",
    en_label: "New",
    ar_label: "جديد",
  },
  {
    value: "Make a call",
    en_label: "Make a Call",
    ar_label: "إجراء مكالمة",
  },
  {
    value: "Office visit",
    en_label: "Office Visit",
    ar_label: "زيارة مكتب",
  },
  {
    value: "Property view",
    en_label: "Property View",
    ar_label: "معاينه",
  },
  {
    value: "Qualified lead",
    en_label: "Qualified Lead",
    ar_label: "موجه للشراء",
  },
  {
    value: "Not interested",
    en_label: "Not Interested",
    ar_label: "غير مهتم",
  },
  {
    value: "Interested",
    en_label: "Interested",
    ar_label: "مهتم",
  },
  {
    value: "Not qualified",
    en_label: "Not Qualified",
    ar_label: "غير مؤهل",
  },
  {
    value: "Did not reply",
    en_label: "Did not reply",
    ar_label: "لم يرد",
  },
  {
    value: "Follow up later",
    en_label: "Follow Up Later",
    ar_label: "متابعة لاحقاً",
  },
  {
    value: "Missing requirement",
    en_label: "Open Request",
    ar_label: "طلب مفتوح",
  },
  {
    value: "Blocked",
    en_label: "Blocked",
    ar_label: "محظور",
  },
];

export const SCHEDULE_VISIBLE_ACTIONS = [
  "Make a call",
  "Office visit",
  "Property view",
  "Follow up later",
];

/** Canonical last_action for leads without history (null, empty, or legacy "New"). */
export const NEW_LEAD_ACTION = "new";

/**
 * Normalize API `last_action` to the canonical value used in filters and display.
 * - null / empty / "New" → "new"
 * - existing actions → unchanged (latest value from backend)
 */
export const normalizeLastAction = (value) => {
  if (value == null) return NEW_LEAD_ACTION;
  const trimmed = String(value).trim();
  if (!trimmed) return NEW_LEAD_ACTION;
  if (trimmed.toLowerCase() === NEW_LEAD_ACTION) return NEW_LEAD_ACTION;
  return trimmed;
};

// Helper function to get action label by value and language
export const getActionLabel = (value, language = "en") => {
  const lookupValue = normalizeLastAction(value);
  const action = USER_ACTIONS.find((action) => action.value === lookupValue);
  if (!action) return value;

  return language === "ar" ? action.ar_label : action.en_label;
};

// Helper function to get actions for dashboard multi-select (excludes "All Actions" only)
export const getFilterActions = () => {
  return USER_ACTIONS.filter((action) => action.value !== "");
};

/** Checkbox options for DashbordFilter (same values sent to messages/v2/all). */
export const getDashboardFilterOptions = (language = "en") => {
  return getFilterActions().map((action) => ({
    value: action.value,
    label: getActionLabel(action.value, language),
  }));
};

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

// Helper function to get all actions including ongoing conversation
export const getAllActions = () => {
  return USER_ACTIONS;
};

// Action colors mapping
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
  new: "text-sky-700",
  null: "text-sky-700",
};
