"use client";

import { Phone } from "lucide-react";
import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";

const SIZE_CLASSES = {
  sm: "inline-flex items-center justify-center !h-7 !w-7 !min-h-7 !min-w-7 !p-0 leading-none bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 shrink-0",
  md: DASHBOARD_ICON_BUTTON,
};

const ICON_SIZE_CLASSES = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
};

export default function CallButton({
  phoneNumber,
  className = "",
  title = "Make a call",
  ariaLabel = "Call",
  onClick,
  disabled,
  size = "md",
}) {
  const isDisabled = disabled ?? !phoneNumber;
  const baseClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const iconClass = ICON_SIZE_CLASSES[size] ?? ICON_SIZE_CLASSES.md;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        className={`${baseClass} ${className} opacity-50 cursor-not-allowed`}
        title={title}
        aria-label={ariaLabel}
      >
        <Phone className={iconClass} strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <a
      href={`tel:${phoneNumber}`}
      onClick={handleClick}
      className={`${baseClass} ${className}`}
      title={title}
      aria-label={ariaLabel}
    >
      <Phone className={iconClass} strokeWidth={2} aria-hidden />
    </a>
  );
}
