"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

/**
 * LenaFieldWrapper - Wrapper component for any form field with error animations
 * 
 * Use this to wrap custom form components (like dropdowns, multi-selects, etc.)
 * to add error animation capabilities.
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Child component to wrap
 * @param {boolean|string} props.error - Error state (boolean) or error message (string)
 * @param {string} props.errorMessage - Error message (if error is boolean)
 * @param {string} props.className - Additional CSS classes
 */
const LenaFieldWrapper = forwardRef(({
  children,
  error = false,
  errorMessage = "",
  className = "",
  dir = undefined,
  ...rest
}, ref) => {
  const containerRef = useRef(null);

  // Expose refs for parent components
  useImperativeHandle(ref, () => ({
    scrollIntoView: (options) => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView(options);
      }
    },
    getContainer: () => containerRef.current,
  }));

  // Determine error state and message
  const hasError = !!error || !!errorMessage;
  const displayErrorMessage = typeof error === "string" ? error : errorMessage;

  const resolvedDir =
    dir ??
    (typeof document !== "undefined" ? document.documentElement.getAttribute("dir") : undefined) ??
    undefined;
  const textAlignClass = resolvedDir === "rtl" ? "text-right" : "text-left";

  // Trigger shake animation when error appears
  useEffect(() => {
    if (hasError && containerRef.current) {
      // Add shake animation
      containerRef.current.classList.add("animate-shake");
      
      // Add ring effect
      containerRef.current.classList.add("ring-2", "ring-red-500", "rounded-md");
      
      // Remove animation after it completes
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.classList.remove("animate-shake", "ring-2", "ring-red-500", "rounded-md");
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [hasError]);

  return (
    <div 
      ref={containerRef}
      dir={resolvedDir}
      className={`transition-all duration-200 ${textAlignClass} ${className}`}
      {...rest}
    >
      {children}
      {hasError && displayErrorMessage && (
        <div className="text-xs text-red-500 mt-1 animate-fade-in">
          {displayErrorMessage}
        </div>
      )}
    </div>
  );
});

LenaFieldWrapper.displayName = "LenaFieldWrapper";

export default LenaFieldWrapper;
