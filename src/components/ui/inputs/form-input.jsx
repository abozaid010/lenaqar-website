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
  dir = undefined, // add dir prop
  ...rest
}) => {
  // Format value for money type
  let inputValue = value,
    inputType = type;

  if (type === "money") {
    inputValue = formatPrice(value);
  }

  if (type === "number") inputType = "text";
  if (type === "money") inputType = "text";
  return (
    <div className="relative">
      {label && (
        <label
          className={`block text-sm font-medium mb-1 ${error ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}
          htmlFor={name}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={inputType}
        value={inputValue || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`block w-full rounded-md border py-1 px-2 focus:outline-none focus:ring-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 appearance-none ${
          error
            ? "border-red-500 ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        } ${adornment ? "ltr:pr-12 rtl:pl-12" : ""} ${className}`}
        dir={dir}
        {...rest}
      />
      {adornment && (
        <span className="absolute py-1 bottom-0 rtl:left-0 ltr:right-0 inline-flex items-center px-3 ltr:rounded-r-md border rtl:rounded-l-md ltr:border-l-0 rtl:border-r-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
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
