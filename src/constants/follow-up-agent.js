export const KPI_KEYS = [
  "leads_scanned",
  "followups_sent",
  "units_shared",
  "meeting_followups",
  "first_followups",
  "second_followups",
  "ignored_prior",
  "capped",
  "excluded_fulfilled",
  "tickets_created",
  "skipped_offer",
  "skipped_already_engaged",
  "errors",
];

export const ACTION_LABELS = {
  engaged: { labelKey: "engaged", className: "bg-emerald-100 text-emerald-800" },
  units_shared: { labelKey: "units_shared", className: "bg-blue-100 text-blue-800" },
  meeting: { labelKey: "meeting_followup", className: "bg-purple-100 text-purple-800" },
  capped: { labelKey: "capped", className: "bg-orange-100 text-orange-800" },
  ticket: { labelKey: "ticket", className: "bg-red-100 text-red-800" },
  no_units: { labelKey: "no_units", className: "bg-red-100 text-red-800" },
  skipped_offer: { labelKey: "skipped_offer", className: "bg-gray-100 text-gray-700" },
  skipped_already_engaged: {
    labelKey: "skipped_already_engaged",
    className: "bg-gray-100 text-gray-700",
  },
  excluded_fulfilled: { labelKey: "excluded_fulfilled", className: "bg-slate-100 text-slate-700" },
  excluded_withdrawn: { labelKey: "excluded_withdrawn", className: "bg-slate-100 text-slate-700" },
  error: { labelKey: "error", className: "bg-red-100 text-red-800" },
  unknown: { labelKey: "unknown", className: "bg-gray-100 text-gray-600" },
  preview_engage: { labelKey: "preview_engage", className: "bg-emerald-50 text-emerald-700" },
  preview_share_units: { labelKey: "preview_share_units", className: "bg-blue-50 text-blue-700" },
  preview_skipped: { labelKey: "preview_skipped", className: "bg-gray-50 text-gray-600" },
  preview_excluded_fulfilled: {
    labelKey: "preview_excluded_fulfilled",
    className: "bg-slate-50 text-slate-600",
  },
  preview_excluded_withdrawn: {
    labelKey: "preview_excluded_withdrawn",
    className: "bg-slate-50 text-slate-600",
  },
};

export const LEAD_FILTER_CHIPS = [
  { id: "all", actions: null },
  {
    id: "sent",
    actions: ["engaged", "preview_engage"],
  },
  {
    id: "units",
    actions: ["units_shared", "preview_share_units"],
  },
  {
    id: "capped",
    actions: ["capped"],
  },
  {
    id: "excluded",
    actions: [
      "excluded_fulfilled",
      "excluded_withdrawn",
      "preview_excluded_fulfilled",
      "preview_excluded_withdrawn",
    ],
  },
  {
    id: "skipped",
    actions: ["skipped_offer", "skipped_already_engaged", "preview_skipped"],
  },
  {
    id: "tickets",
    actions: ["ticket", "no_units"],
  },
  {
    id: "errors",
    actions: ["error"],
  },
];

export function resolveActionBadgeKey(actionTaken, followupKind) {
  if (actionTaken === "engaged" && followupKind === "meeting") {
    return "meeting";
  }
  return actionTaken || "unknown";
}
