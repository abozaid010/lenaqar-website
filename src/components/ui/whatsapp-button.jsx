"use client";

import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import { copyToClipboard, handleOpenWhatsApp } from "@/utils/phone-utils";

const SIZE_CLASSES = {
  sm: "inline-flex items-center justify-center !h-7 !w-7 !min-h-7 !min-w-7 !p-0 leading-none bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 shrink-0",
  md: DASHBOARD_ICON_BUTTON,
};

const ICON_SIZE_CLASSES = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
};

export default function WhatsAppButton({
  phoneNumber,
  className = "",
  title = "Open WhatsApp",
  ariaLabel = "WhatsApp",
  onClick,
  options,
  disabled,
  size = "md",
  onMessageCopied,
}) {
  const isDisabled = disabled ?? !phoneNumber;
  const baseClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const iconClass = ICON_SIZE_CLASSES[size] ?? ICON_SIZE_CLASSES.md;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (isDisabled) return;
        // WhatsApp Desktop / Web often drops the ?text= param when handing off
        // the URL to the native app. Copy the message to the clipboard first
        // (while we're still in a user-gesture context) so the user can paste
        // it as a fallback if WhatsApp doesn't pre-fill the input.
        const message = options?.message;
        if (message) {
          copyToClipboard(
            message,
            () => onMessageCopied?.(true),
            () => onMessageCopied?.(false)
          );
        }
        handleOpenWhatsApp(e, phoneNumber, options);
        onClick?.(e);
      }}
      disabled={isDisabled}
      className={`${baseClass} ${className} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      title={title}
      aria-label={ariaLabel}
    >
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
      </svg>
    </button>
  );
}
