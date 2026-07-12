"use client";

import { Copy, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import AndroidCallTipDialog from "@/components/phone/AndroidCallTipDialog";
import { useTelCall } from "@/hooks/useTelCall";
import { useI18n } from "@/hooks/useI18n";
import { copyToClipboard } from "@/utils/phone-utils";

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
  title = undefined,
  ariaLabel = undefined,
  onClick = undefined,
  disabled = undefined,
  size = "md",
  /** When true, renders a copy-number control next to the call link. */
  showCopy = false,
  defaultCountry = "EG",
  stopPropagation = true,
}) {
  const { translate } = useI18n();
  const {
    phoneValue,
    telHref,
    tipOpen,
    onTelClick,
    dismissTip,
    continueFromTip,
  } = useTelCall(phoneNumber, defaultCountry);

  const isDisabled = disabled ?? !telHref;
  const baseClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const iconClass = ICON_SIZE_CLASSES[size] ?? ICON_SIZE_CLASSES.md;
  const callTitle =
    title ?? translate("common.makePhoneCall", "Make a call");
  const callAria =
    ariaLabel ?? translate("buttons.call", "Call");
  const copyTitle = translate("common.copyPhoneNumber", "Copy number");

  const handleCopy = async (e) => {
    if (stopPropagation) e.stopPropagation();
    e.preventDefault();
    if (!phoneValue) {
      toast.error(
        translate("common.failedToCopyPhone", "Failed to copy phone number")
      );
      return;
    }
    await copyToClipboard(
      phoneValue,
      () =>
        toast.success(translate("common.phoneCopied", "Phone number copied")),
      () =>
        toast.error(
          translate("common.failedToCopyPhone", "Failed to copy phone number")
        )
    );
  };

  const callControl = isDisabled ? (
    <button
      type="button"
      disabled
      className={`${baseClass} ${className} opacity-50 cursor-not-allowed`}
      title={callTitle}
      aria-label={callAria}
    >
      <Phone className={iconClass} strokeWidth={2} aria-hidden />
    </button>
  ) : (
    <a
      href={telHref}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        // Fire the tap handler first so selection happens on every tap, even
        // when onTelClick defers the call (e.g. first-use Android tip).
        onClick?.(e);
        onTelClick(e);
      }}
      className={`${baseClass} ${className}`}
      title={callTitle}
      aria-label={callAria}
    >
      <Phone className={iconClass} strokeWidth={2} aria-hidden />
    </a>
  );

  return (
    <>
      {showCopy ? (
        <span className="inline-flex items-center gap-1 shrink-0">
          {callControl}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!phoneValue}
            className={`${baseClass} ${
              !phoneValue ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={copyTitle}
            aria-label={copyTitle}
          >
            <Copy className={iconClass} strokeWidth={2} aria-hidden />
          </button>
        </span>
      ) : (
        callControl
      )}
      <AndroidCallTipDialog
        isOpen={tipOpen}
        phoneValue={phoneValue}
        onContinue={continueFromTip}
        onDismiss={dismissTip}
      />
    </>
  );
}
