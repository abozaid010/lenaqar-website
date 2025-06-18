"use client";

import { formatPrice } from "@/utils/formatters";

const FormInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error = false,
  errorMessage = "",
  type = "text",
  adornment = null,
  className = "",
  ...rest
}) => {
  // Format value for money type
  let inputValue = value;
  if (type === "money") {
    inputValue = formatPrice(value);
  }

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
      <input
        id={name}
        name={name}
        type={type === "number" ? "text" : "text"}
        value={inputValue || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`block w-full rounded-md border py-1 px-2 focus:outline-none focus:ring-1 bg-white appearance-none ${
          error
            ? "border-red-500 ring-red-500 placeholder-red-500"
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        } ${adornment ? "ltr:pr-12 rtyl:pl-12" : ""} ${className}`}
        {...rest}
      />
      {adornment && (
        <span className="absolute bottom-1 rtl:left-1.5 ltr:right-1.5 text-gray-400">
          {adornment}
        </span>
      )}
      {error && errorMessage && (
        <div className="text-xs text-red-500">{errorMessage}</div>
      )}
    </div>
  );
};

export default FormInput;
