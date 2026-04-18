export const USER_ACTIONS = [
  {
    value: "",
    en_label: "All Actions",
    ar_label: "كل الإجراءات",
  },
  {
    value: null,
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
    value: "Follow up later",
    en_label: "Follow Up Later",
    ar_label: "متابعة لاحقاً",
  },
  {
    value: "Missing requirement",
    en_label: "Missing",
    ar_label: "متطلب مفقود",
  },
  {
    value: "Blocked",
    en_label: "Blocked",
    ar_label: "محظور",
  },
];

// Helper function to get action label by value and language
export const getActionLabel = (value, language = "en") => {
  const action = USER_ACTIONS.find((action) => action.value === value);
  if (!action) return value;

  return language === "ar" ? action.ar_label : action.en_label;
};

// Helper function to get actions for filter (excluding null values)
export const getFilterActions = () => {
  return USER_ACTIONS.filter((action) => action.value !== null);
};

// Helper function to get all actions including ongoing conversation
export const getAllActions = () => {
  return USER_ACTIONS;
};

// Action colors mapping
export const ACTIONS_COLORS = {
  "Make a call": "text-blue-800",
  "Office visit": "text-yellow-800",
  "Property view": "text-teal-800",
  "Not interested": "text-gray-800",
  "Not qualified": "text-red-800",
  "Follow up later": "text-orange-800",
  "Missing requirement": "text-purple-800",
  Blocked: "text-red-600",
  "Qualified lead": "text-emerald-800",
  Interested: "text-indigo-900",
};
