"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { Country } from "react-phone-number-input";
import { useI18n } from "@/hooks/useI18n";
import { PhoneInputBase } from "./PhoneInputBase";
import {
  getPhoneValidationError,
  PHONE_VALIDATION_FALLBACKS,
  phoneValidationKey,
  parsePhonePayload,
  sanitizePhoneInput,
  toPhoneFieldPublicValue,
  type PhoneFieldPublicValue,
} from "./phone-utils";

/** Only exists in the browser; avoid touching DOM prototypes during SSR module evaluation. */
const INPUT_VALUE_SETTER =
  typeof HTMLInputElement !== "undefined"
    ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
    : undefined;

/**
 * Normalizes Unicode digits and strips unsafe characters before the phone formatter runs.
 * Arabic/Persian digits are same length as ASCII replacements, so caret stays stable.
 */
const DigitSanitizingInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function DigitSanitizingInput({ onChange, ...rest }, ref) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target;
      const next = sanitizePhoneInput(el.value);
      if (el.value !== next && INPUT_VALUE_SETTER) {
        INPUT_VALUE_SETTER.call(el, next);
      }
      onChange?.(e);
    },
    [onChange],
  );

  return <input ref={ref} {...rest} onChange={handleChange} />;
});

export type PhoneFieldProps = {
  /**
   * E.164-oriented string from `react-phone-number-input`.
   * For controlled mode, pass `value=""` when empty so the field stays controlled.
   */
  value?: string;
  defaultValue?: string;
  onChange?: (value?: string) => void;
  /** Valid combined international number (E.164), or `null` while empty/incomplete. */
  onValueChange?: (value: PhoneFieldPublicValue | null) => void;
  defaultCountry?: Country;
  required?: boolean;
  label?: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Server-side or external error (shown as-is when not a built-in validation string). */
  error?: string;
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
};

/**
 * Smart phone field: Unicode digit normalization, sanitization, blur validation,
 * and E.164-oriented value for `react-phone-number-input`.
 *
 * Visuals mirror `LenaTextField`: floating label with hover/focus/error/value
 * border + ring transitions and animated error message. The country flag always
 * occupies the inside-left, so when a label is provided we keep it permanently
 * in the floating position (any of focus / value / label visibility floats it).
 */
export function PhoneField({
  value: valueProp,
  defaultValue,
  onChange,
  onValueChange,
  defaultCountry = "EG",
  required,
  label,
  name,
  disabled,
  placeholder,
  className,
  error: externalError,
  id: idProp,
  onBlur,
  onFocus,
}: PhoneFieldProps) {
  const { translate } = useI18n();
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(() =>
    defaultValue !== undefined && defaultValue !== ""
      ? sanitizePhoneInput(defaultValue)
      : undefined,
  );

  const value = isControlled ? valueProp : internalValue;
  const hasValue = value !== undefined && value !== null && value !== "";

  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = useCallback(
    (next?: string) => {
      const sanitized =
        next === undefined || next === ""
          ? undefined
          : sanitizePhoneInput(next);
      if (!isControlled) {
        setInternalValue(sanitized);
      }
      onChange?.(sanitized);
      const parsed =
        sanitized !== undefined && sanitized !== ""
          ? parsePhonePayload(sanitized, defaultCountry)
          : null;
      onValueChange?.(toPhoneFieldPublicValue(parsed));
    },
    [defaultCountry, isControlled, onChange, onValueChange],
  );

  const builtInCode = touched
    ? getPhoneValidationError(value, {
        defaultCountry,
        required: Boolean(required),
      })
    : undefined;

  const builtInError = builtInCode
    ? translate(
        phoneValidationKey(builtInCode),
        PHONE_VALIDATION_FALLBACKS[builtInCode],
      )
    : undefined;

  const displayError = externalError || builtInError;
  const showError = Boolean(displayError);

  // Shake animation on error (mirrors LenaTextField).
  useEffect(() => {
    if (showError && containerRef.current) {
      containerRef.current.classList.add("animate-shake");
      const timeout = setTimeout(() => {
        containerRef.current?.classList.remove("animate-shake");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [showError]);

  const resolvedPlaceholder =
    placeholder ?? translate("phoneField.placeholder", "Enter phone number");

  const hasVisibleLabel = label != null && label !== "";
  const inputAriaLabel = !hasVisibleLabel
    ? translate("phoneField.label", "Phone number")
    : undefined;

  const handleBlur: React.FocusEventHandler<HTMLElement> = (e) => {
    setTouched(true);
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleFocus: React.FocusEventHandler<HTMLElement> = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // Always-floating when a label is visible: the country selector sits inside,
  // so the "label-as-placeholder" position would overlap the flag.
  const shouldFloatLabel = hasVisibleLabel || isFocused || hasValue;

  // Border color — same priority order as LenaTextField.
  const borderColorClass = (() => {
    if (disabled) return "!border-gray-300";
    if (showError) return "!border-red-500";
    if (isFocused) return "!border-primary";
    if (isHovered) return "!border-gray-400";
    if (hasValue) return "!border-gray-700";
    return "!border-gray-300";
  })();

  // Focus / error ring — same intensity as LenaTextField.
  const ringClass = showError
    ? "ring-2 ring-red-500"
    : isFocused
      ? "ring-2 ring-primary"
      : "";

  // Label color — same priority order as LenaTextField.
  const labelColorClass = (() => {
    if (disabled) return "text-gray-400";
    if (showError) return "text-red-500";
    if (isFocused) return "text-primary";
    if (hasValue) return "text-gray-700";
    return "text-gray-700";
  })();

  return (
    <div
      ref={containerRef}
      className={["relative transition-all duration-200", className]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dir="ltr"
    >
      <div className="relative">
        {hasVisibleLabel ? (
          <label
            htmlFor={id}
            className={[
              "absolute z-10 pointer-events-none left-3 transition-all duration-200",
              shouldFloatLabel
                ? `-top-2.5 text-xs ${labelColorClass} bg-white px-1.5`
                : "top-1/2 text-sm text-gray-400 -translate-y-1/2",
              required && shouldFloatLabel
                ? "after:content-['*'] after:text-red-500 after:ml-0.5"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {label}
          </label>
        ) : null}

        <PhoneInputBase
          value={value}
          onChange={handleChange}
          defaultCountry={defaultCountry}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          inputComponent={DigitSanitizingInput}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={[
            // Match LenaTextField sizing & rounding (override PhoneInputBase defaults).
            "!min-h-[40px] !px-3 !py-2 !rounded-md !text-base !text-gray-900 transition-all duration-200",
            // State-driven border (uses ! to win over PhoneInputBase's base border-gray-300).
            borderColorClass,
            // Focus / error ring.
            ringClass,
            // Disabled visuals.
            disabled
              ? "!bg-gray-50 !cursor-not-allowed"
              : "!bg-white !cursor-text",
          ]
            .filter(Boolean)
            .join(" ")}
          numberInputProps={{
            id,
            name,
            "aria-label": inputAriaLabel,
            "aria-invalid": showError,
            "aria-describedby": showError ? errorId : undefined,
            "aria-required": required ? true : undefined,
            autoComplete: "tel",
          }}
        />
      </div>

      {showError ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs mt-1 px-1 text-red-500 animate-fade-in transition-all duration-200"
        >
          {displayError}
        </p>
      ) : null}
    </div>
  );
}

export type { PhoneFieldPublicValue } from "./phone-utils";
