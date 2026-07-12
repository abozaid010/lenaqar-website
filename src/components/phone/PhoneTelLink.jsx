"use client";

import AndroidCallTipDialog from "@/components/phone/AndroidCallTipDialog";
import { useTelCall } from "@/hooks/useTelCall";

/**
 * Flexible `<a href="tel:…">` with E.164 + Android first-use tip.
 * Use for custom-styled call CTAs. Prefer CallButton for icon actions.
 */
export default function PhoneTelLink({
  phoneNumber,
  className = "",
  title,
  "aria-label": ariaLabel,
  onClick = undefined,
  disabled = false,
  children,
  defaultCountry = "EG",
  stopPropagation = false,
  style = undefined,
}) {
  const {
    phoneValue,
    telHref,
    tipOpen,
    onTelClick,
    dismissTip,
    continueFromTip,
  } = useTelCall(phoneNumber, defaultCountry);

  const isDisabled = disabled || !telHref;

  if (isDisabled) {
    return (
      <span
        className={`${className} opacity-50 cursor-not-allowed`.trim()}
        title={title}
        aria-label={ariaLabel}
        aria-disabled="true"
        style={style}
      >
        {children}
      </span>
    );
  }

  return (
    <>
      <a
        href={telHref}
        className={className}
        title={title}
        aria-label={ariaLabel}
        style={style}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          const allowed = onTelClick(e);
          if (allowed !== false) onClick?.(e);
        }}
      >
        {children}
      </a>
      <AndroidCallTipDialog
        isOpen={tipOpen}
        phoneValue={phoneValue}
        onContinue={continueFromTip}
        onDismiss={dismissTip}
      />
    </>
  );
}
