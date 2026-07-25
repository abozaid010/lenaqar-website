export const DASHBOARD_CONTROL_BASE =
  "bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export const DASHBOARD_BUTTON =
  `inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 ${DASHBOARD_CONTROL_BASE} text-xs sm:text-sm font-medium min-w-[44px] sm:min-w-fit whitespace-nowrap`;

export const DASHBOARD_TRIGGER =
  `w-full inline-flex items-center justify-between gap-2 px-3 py-2 ${DASHBOARD_CONTROL_BASE} text-sm cursor-pointer`;

export const DASHBOARD_ICON_BUTTON =
  `inline-flex items-center justify-center !h-10 !w-10 !min-h-10 !min-w-10 lg:!h-8 lg:!w-8 lg:!min-h-8 lg:!min-w-8 !p-0 leading-none ${DASHBOARD_CONTROL_BASE} border-gray-300 shrink-0`;

// ============================================================
// Action buttons (Edit / Delete / generic) — shared design tokens
// Visual language mirrors WhatsApp button: compact, slightly squared,
// white surface, subtle border, color-tinted hover per variant.
// ============================================================

export const ACTION_BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium leading-none transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

export const ACTION_BUTTON_VARIANTS = {
  default:
    "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-primary/30",
  edit:
    "bg-white border border-gray-300 text-gray-700 hover:bg-primary/5 hover:border-primary/40 hover:text-primary focus-visible:ring-primary/30",
  delete:
    "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 focus-visible:ring-red-400/30",
  primary:
    "bg-primary border border-primary text-white hover:opacity-95 focus-visible:ring-primary/30",
};

export const ACTION_BUTTON_SIZES = {
  sm: {
    box: "h-7 min-h-7 px-2.5 text-xs",
    iconOnly: "!h-7 !w-7 !min-h-7 !min-w-7 !p-0",
    icon: "w-3.5 h-3.5",
  },
  md: {
    box: "h-8 min-h-8 px-3 text-sm",
    iconOnly: "!h-8 !w-8 !min-h-8 !min-w-8 !p-0",
    icon: "w-4 h-4",
  },
  lg: {
    box: "h-10 min-h-10 px-4 text-sm",
    iconOnly: "!h-10 !w-10 !min-h-10 !min-w-10 !p-0",
    icon: "w-[18px] h-[18px]",
  },
};

