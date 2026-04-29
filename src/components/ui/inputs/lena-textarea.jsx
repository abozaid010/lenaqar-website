"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

/**
 * LenaTextarea - Enhanced textarea component with floating label and error animations
 * 
 * Features:
 * - Floating label pattern (label moves from inside to above on focus/value)
 * - Automatic shake animation on error
 * - Smooth state transitions (inactive, focused, activated, hover, error, disabled)
 * 
 * @param {Object} props
 * @param {string|ReactNode} props.label - Label text or ReactNode
 * @param {string} props.name - Textarea name attribute
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text (optional, uses label if not provided)
 * @param {boolean} props.required - Whether field is required
 * @param {boolean|string} props.error - Error state (boolean) or error message (string)
 * @param {string} props.errorMessage - Error message (if error is boolean)
 * @param {string} props.helperText - Helper text to display below field
 * @param {number} props.rows - Number of rows
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.dir - Text direction (ltr/rtl)
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {Object} props.rest - Other textarea props
 */
const LenaTextarea = forwardRef(({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error = false,
  errorMessage = "",
  helperText = "",
  rows = 4,
  className = "",
  dir = undefined,
  disabled = false,
  ...rest
}, ref) => {
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const resolvedDir =
    dir ??
    (typeof document !== "undefined" ? document.documentElement.getAttribute("dir") : undefined) ??
    undefined;
  const textAlignClass = resolvedDir === "rtl" ? "text-right" : "text-left";

  // Expose refs for parent components
  useImperativeHandle(ref, () => ({
    scrollIntoView: (options) => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView(options);
      }
    },
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    getContainer: () => containerRef.current,
    getTextarea: () => textareaRef.current,
  }));

  // Determine error state and message
  const hasError = !!error || !!errorMessage;
  const displayErrorMessage = typeof error === "string" ? error : errorMessage;
  
  // Determine if label should float (focused or has value)
  const hasValue = value !== null && value !== undefined && value !== "";
  const shouldFloatLabel = isFocused || hasValue;
  
  // Extract label text if it's a ReactNode
  const labelText = typeof label === "string" ? label : null;
  const labelNode = typeof label !== "string" ? label : null;
  
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
      {/* Textarea Field */}
      <div className="relative">
        {/* Floating Label */}
        {label && (
          <label
            htmlFor={name}
            className={`absolute transition-all duration-200 pointer-events-none ${
              resolvedDir === "rtl" ? "right-3" : "left-3"
            } ${
              shouldFloatLabel
                ? `-top-2.5 text-xs ${getLabelColor()} bg-white px-1.5 z-10`
                : `top-2.5 text-sm text-gray-400 z-0`
            } ${required && shouldFloatLabel ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}
          >
            {labelNode || labelText}
          </label>
        )}
      <textarea
        ref={textareaRef}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={displayPlaceholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`block w-full rounded-md border py-2.5 px-3 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 resize-y ${textAlignClass} ${
          shouldFloatLabel && label ? "pt-4" : "pt-2.5"
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
            : "cursor-text bg-white"
        } ${className}`}
        dir={resolvedDir}
        {...rest}
      />
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

LenaTextarea.displayName = "LenaTextarea";

export default LenaTextarea;
