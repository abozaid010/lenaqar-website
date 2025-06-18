"use client";

import { ChevronDown } from "lucide-react";

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  required = false,
  error = false,
  errorMessage = "",
  children,
  className = "",
  ...rest
}) => {
  return (
    <div className="relative">
      {label && (
        <label
          className={`block text-sm font-medium mb-1 ${error ? "text-red-500" : "text-gray-700"}`}
          htmlFor={name}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`block w-full rounded-md border py-1 px-2 bg-white focus:outline-none focus:ring-1 appearance-none ${
            error
              ? "border-red-500 ring-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 ltr:right-2 rtl:left-2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>
      {error && errorMessage && (
        <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
      )}
    </div>
  );
};

export default FormSelect;
