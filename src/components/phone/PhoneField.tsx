"use client";

import { forwardRef, useCallback, useId, useState } from "react";
import type { Country } from "react-phone-number-input";
import { useI18n } from "@/hooks/useI18n";
import { PhoneInputBase } from "./PhoneInputBase";
import {
  getPhoneValidationError,
  parsePhonePayload,
  PHONE_VALIDATION_MESSAGES,
  sanitizePhoneInput,
  type PhonePayload,
} from "./phone-utils";

const INPUT_VALUE_SETTER = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value",
)?.set;

/**
 * Normalizes Unicode digits and strips unsafe characters before the phone formatter runs.
 * Arabic/Persian digits are same length as ASCII replacements, so caret stays stable.
 */
const DigitSanitizingInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function DigitSanitizingInput({ onChange, ...rest }, ref) {
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
  },
);

function localizeValidationMessage(
  translate: (key: string, fallback: string) => string,
  message: string | undefined,
): string | undefined {
  if (!message) return undefined;
  const pairs: [string, string][] = [
    [PHONE_VALIDATION_MESSAGES.required, "phoneField.required"],
    [PHONE_VALIDATION_MESSAGES.tooShort, "phoneField.tooShort"],
    [PHONE_VALIDATION_MESSAGES.tooLong, "phoneField.tooLong"],
    [PHONE_VALIDATION_MESSAGES.invalidLength, "phoneField.invalidLength"],
    [PHONE_VALIDATION_MESSAGES.invalid, "phoneField.invalid"],
  ];
  for (const [en, key] of pairs) {
    if (message === en) return translate(key, en);
  }
  return message;
}

export type PhoneFieldProps = {
  /**
   * E.164-oriented string from `react-phone-number-input`.
   * For controlled mode, pass `value=""` when empty so the field stays controlled.
   */
  value?: string;
  defaultValue?: string;
  onChange?: (value?: string) => void;
  /** Latest structured payload; `null` when empty or not yet a possible number. */
  onValueChange?: (payload: PhonePayload | null) => void;
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

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(() =>
    defaultValue !== undefined && defaultValue !== "" ? sanitizePhoneInput(defaultValue) : undefined,
  );

  const value = isControlled ? valueProp : internalValue;

  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (next?: string) => {
      const sanitized =
        next === undefined || next === "" ? undefined : sanitizePhoneInput(next);
      if (!isControlled) {
        setInternalValue(sanitized);
      }
      onChange?.(sanitized);
      const payload =
        sanitized !== undefined && sanitized !== ""
          ? parsePhonePayload(sanitized, defaultCountry)
          : null;
      onValueChange?.(payload);
    },
    [defaultCountry, isControlled, onChange, onValueChange],
  );

  const builtInError = touched
    ? getPhoneValidationError(value, { defaultCountry, required: Boolean(required) })
    : undefined;

  const resolvedError = externalError ?? builtInError;
  const displayError = localizeValidationMessage(translate, resolvedError);

  const showError = Boolean(displayError);
  const resolvedPlaceholder =
    placeholder ?? translate("phoneField.placeholder", "Enter phone number");

  const hasVisibleLabel = label != null && label !== "";
  const inputAriaLabel = !hasVisibleLabel
    ? translate("phoneField.label", "Phone number")
    : undefined;

  const handleBlur: React.FocusEventHandler<HTMLElement> = (e) => {
    setTouched(true);
    onBlur?.(e);
  };

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")} dir="ltr">
      {hasVisibleLabel ? (
        <label htmlFor={id} className="text-sm font-medium text-gray-800">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      <PhoneInputBase
        value={value}
        onChange={handleChange}
        defaultCountry={defaultCountry}
        disabled={disabled}
        placeholder={resolvedPlaceholder}
        error={showError}
        inputComponent={DigitSanitizingInput}
        onBlur={handleBlur}
        onFocus={onFocus}
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
      {showError ? (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
