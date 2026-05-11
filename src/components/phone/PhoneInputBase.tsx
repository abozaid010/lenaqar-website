"use client";

import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { ComponentProps } from "react";

export type PhoneInputBaseProps = Omit<
  ComponentProps<typeof PhoneInput>,
  "defaultCountry" | "onChange" | "value" | "numberInputProps"
> & {
  value?: string;
  onChange?: (value?: string) => void;
  defaultCountry?: Country;
  disabled?: boolean;
  placeholder?: string;
  /** Highlights invalid state (border); keep styling minimal. */
  error?: boolean;
  className?: string;
  numberInputProps?: ComponentProps<typeof PhoneInput>["numberInputProps"];
};

const containerClass = (error?: boolean, className?: string) =>
  [
    "PhoneInput",
    "flex flex-wrap items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-sm",
    error ? "border-red-500" : "border-gray-300",
    className,
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Presentational wrapper around `react-phone-number-input` with default country Egypt.
 * No normalization or validation — use {@link PhoneField} for app logic.
 */
export function PhoneInputBase({
  value,
  onChange,
  defaultCountry = "EG",
  disabled,
  placeholder,
  error,
  className,
  numberInputProps,
  ...rest
}: PhoneInputBaseProps) {
  return (
    <PhoneInput
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={containerClass(error, className)}
      numberInputProps={{
        className:
          "min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60",
        ...numberInputProps,
      }}
      {...rest}
    />
  );
}
