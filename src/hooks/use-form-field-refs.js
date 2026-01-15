"use client";

import { useRef, useCallback } from "react";

/**
 * useFormFieldRefs - Hook to manage refs for form fields with scroll-to-error functionality
 * 
 * Usage:
 * ```jsx
 * const fieldRefs = useFormFieldRefs();
 * 
 * // In your form fields:
 * <LenaTextField ref={fieldRefs.register('email')} ... />
 * 
 * // When validation fails:
 * fieldRefs.scrollToFirstError(errors);
 * ```
 * 
 * @returns {Object} Object with register and scrollToFirstError methods
 */
export function useFormFieldRefs() {
  const refs = useRef({});

  /**
   * Register a field ref
   * @param {string} fieldName - Name of the field
   * @returns {Function} Ref callback function
   */
  const register = useCallback((fieldName) => {
    return (element) => {
      if (element) {
        refs.current[fieldName] = element;
      } else {
        delete refs.current[fieldName];
      }
    };
  }, []);

  /**
   * Scroll to the first error field and animate it
   * @param {Object} errors - Object with error fields (fieldName: errorMessage)
   * @param {Array} fieldOrder - Optional custom field order (default: alphabetical)
   */
  const scrollToFirstError = useCallback((errors, fieldOrder = null) => {
    const errorFields = Object.keys(errors).filter((key) => errors[key]);
    if (errorFields.length === 0) return;

    // Use provided order or default to alphabetical
    const order = fieldOrder || Object.keys(errors).sort();
    
    // Find first error field in priority order
    const firstErrorField = order.find((field) => errorFields.includes(field));
    if (!firstErrorField) return;

    const fieldRef = refs.current[firstErrorField];
    if (!fieldRef) return;

    // Try to get the container or input element
    let targetElement = fieldRef;
    
    // If ref has getContainer method (from LenaTextField, etc.), use it
    if (typeof fieldRef.getContainer === 'function') {
      targetElement = fieldRef.getContainer();
    } else if (typeof fieldRef.getInput === 'function') {
      targetElement = fieldRef.getInput();
    } else if (typeof fieldRef.getTextarea === 'function') {
      targetElement = fieldRef.getTextarea();
    }

    if (!targetElement) return;

    // Scroll to the field with smooth behavior
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Trigger error animation if the component supports it
    // (The component's useEffect will handle the animation)
    if (fieldRef.getContainer) {
      const container = fieldRef.getContainer();
      if (container) {
        // Force re-trigger error state by briefly removing and re-adding error class
        container.classList.add("ring-2", "ring-red-500");
        setTimeout(() => {
          if (container) {
            container.classList.remove("ring-2", "ring-red-500");
          }
        }, 1000);
      }
    }
  }, []);

  return {
    register,
    scrollToFirstError,
    refs: refs.current,
  };
}
