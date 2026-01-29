"use client";

import { formatPrice } from "@/utils/formatters";
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

/**
 * LenaTextField - Enhanced form input component with floating label and error animations
 * 
 * Features:
 * - Floating label pattern (label moves from inside to above on focus/value)
 * - Automatic shake animation on error
 * - Smooth state transitions (inactive, focused, activated, hover, error, disabled)
 * - Forward ref support for scroll-to-error functionality
 * 
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} props.name - Input name attribute
 * @param {string|number} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text (optional, uses label if not provided)
 * @param {boolean} props.required - Whether field is required
 * @param {boolean|string} props.error - Error state (boolean) or error message (string)
 * @param {string} props.errorMessage - Error message (if error is boolean)
 * @param {string} props.helperText - Helper text to display below field
 * @param {string} props.type - Input type (text, number, email, url, etc.)
 * @param {ReactNode} props.adornment - Optional adornment element
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.dir - Text direction (ltr/rtl)
 * @param {boolean} props.disabled - Whether field is disabled
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
  helperText = "",
  type = "text",
  adornment = null,
  className = "",
  dir = undefined,
  disabled = false,
  ...rest
}, ref) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  
  // Determine if label should float (focused or has value)
  const hasValue = value !== null && value !== undefined && value !== "";
  const shouldFloatLabel = isFocused || hasValue;
  
  // Placeholder logic:
  // - When label is floating: show custom placeholder if provided, otherwise empty
  // - When label is NOT floating: NEVER show placeholder (label acts as placeholder)
  const displayPlaceholder = shouldFloatLabel ? (placeholder || "") : "";

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

  // Determine border color based on state
  const getBorderColor = () => {
    if (disabled) return "border-gray-300";
    if (hasError) return "border-red-500";
    if (isFocused) return "border-primary focus:border-primary";
    if (isHovered) return "border-gray-400";
    if (hasValue) return "border-gray-700";
    return "border-gray-300";
  };

  // Determine label color
  const getLabelColor = () => {
    if (disabled) return "text-gray-400";
    if (hasError) return "text-red-500";
    if (isFocused) return "text-primary";
    if (hasValue) return "text-gray-700";
    return "text-gray-700";
  };

  return (
    <div 
      ref={containerRef}
      className="relative transition-all duration-200"
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input Field */}
      <div className="relative">
        {/* Floating Label */}
        {label && (
          <label
            htmlFor={name}
            className={`absolute transition-all duration-200 pointer-events-none ${
              dir === "rtl" ? "right-3" : "left-3"
            } ${
              shouldFloatLabel
                ? `-top-2.5 text-xs ${getLabelColor()} bg-white px-1.5`
                : `top-1/2 text-sm text-gray-400 transform -translate-y-1/2`
            } ${required && shouldFloatLabel ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}
          >
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          value={inputValue ?? ""}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={displayPlaceholder}
          required={required}
          disabled={disabled}
          className={`block w-full rounded-md border py-2.5 px-3 focus:outline-none focus:ring-2 bg-white text-gray-900 appearance-none transition-all duration-200 ${
            shouldFloatLabel && label ? "pt-4" : ""
          } ${
            getBorderColor()
          } ${
            hasError
              ? "ring-2 ring-red-500 focus:ring-red-500"
              : isFocused
              ? "ring-2 ring-primary focus:ring-primary"
              : "focus:ring-primary"
          } ${
            disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed"
              : "cursor-text"
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

      {/* Helper Text or Error Message */}
      {(helperText || hasError) && (
        <div className={`text-xs mt-1 px-1 transition-all duration-200 ${
          hasError ? "text-red-500 animate-fade-in" : "text-gray-400"
        }`}>
          {hasError && displayErrorMessage ? displayErrorMessage : helperText}
        </div>
      )}
    </div>
  );
});

LenaTextField.displayName = "LenaTextField";

export default LenaTextField;
