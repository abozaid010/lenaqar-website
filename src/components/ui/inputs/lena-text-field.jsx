"use client";

import { formatPrice } from "@/utils/formatters";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

/**
 * LenaTextField - Enhanced form input component with error animations
 * 
 * Features:
 * - Automatic shake animation on error
 * - Smooth error state transitions
 * - Forward ref support for scroll-to-error functionality
 * - Compatible with existing FormInput API
 * 
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} props.name - Input name attribute
 * @param {string|number} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {boolean|string} props.error - Error state (boolean) or error message (string)
 * @param {string} props.errorMessage - Error message (if error is boolean)
 * @param {string} props.type - Input type (text, number, email, url, etc.)
 * @param {ReactNode} props.adornment - Optional adornment element
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.dir - Text direction (ltr/rtl)
 * @param {Object} props.rest - Other input props
 */
const LenaTextField = forwardRef(({
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
  dir = undefined,
  ...rest
}, ref) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Expose refs for parent components
  useImperativeHandle(ref, () => ({
    scrollIntoView: (options) => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView(options);
      }
    },
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    getContainer: () => containerRef.current,
    getInput: () => inputRef.current,
  }));

  // Format value for money type
  let inputValue = value,
    inputType = type;

  if (type === "money") {
    inputValue = formatPrice(value);
  }

  if (type === "number") inputType = "text";
  if (type === "money") inputType = "text";

  // Determine error state and message
  const hasError = !!error || !!errorMessage;
  const displayErrorMessage = typeof error === "string" ? error : errorMessage;

  // Trigger shake animation when error appears
  useEffect(() => {
    if (hasError && containerRef.current) {
      // Add shake animation
      containerRef.current.classList.add("animate-shake");
      
      // Remove animation after it completes
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.classList.remove("animate-shake");
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [hasError]);

  return (
    <div 
      ref={containerRef}
      className="relative transition-all duration-200"
    >
      {label && (
        <label
          className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
            hasError ? "text-red-500" : "text-gray-700"
          }`}
          htmlFor={name}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          value={inputValue || ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-md border py-1 px-2 focus:outline-none focus:ring-2 bg-white text-gray-900 appearance-none transition-all duration-200 ${
            hasError
              ? "border-red-500 ring-2 ring-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } ${adornment ? "ltr:pr-12 rtl:pl-12" : ""} ${className}`}
          dir={dir}
          {...rest}
        />
        {adornment && (
          <span className="absolute py-1 bottom-0 rtl:left-0 ltr:right-0 inline-flex items-center px-3 ltr:rounded-r-md border rtl:rounded-l-md ltr:border-l-0 rtl:border-r-0 border-gray-300 bg-gray-100 text-gray-500">
            {adornment}
          </span>
        )}
      </div>
      {hasError && displayErrorMessage && (
        <div className="text-xs text-red-500 mt-1 animate-fade-in">
          {displayErrorMessage}
        </div>
      )}
    </div>
  );
});

LenaTextField.displayName = "LenaTextField";

export default LenaTextField;
