"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

/**
 * LenaTextarea - Enhanced textarea component with error animations
 * 
 * Features:
 * - Automatic shake animation on error
 * - Smooth error state transitions
 * - Forward ref support for scroll-to-error functionality
 * 
 * @param {Object} props
 * @param {string|ReactNode} props.label - Label text or ReactNode
 * @param {string} props.name - Textarea name attribute
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {boolean|string} props.error - Error state (boolean) or error message (string)
 * @param {string} props.errorMessage - Error message (if error is boolean)
 * @param {number} props.rows - Number of rows
 * @param {string} props.className - Additional CSS classes
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
  rows = 4,
  className = "",
  ...rest
}, ref) => {
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

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
          {typeof label === "string" ? (
            <>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </>
          ) : (
            label
          )}
        </label>
      )}
      <textarea
        ref={textareaRef}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 resize-y ${
          hasError
            ? "border-red-500 ring-2 ring-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        } ${className}`}
        {...rest}
      />
      {hasError && displayErrorMessage && (
        <div className="text-xs text-red-500 mt-1 animate-fade-in">
          {displayErrorMessage}
        </div>
      )}
    </div>
  );
});

LenaTextarea.displayName = "LenaTextarea";

export default LenaTextarea;
