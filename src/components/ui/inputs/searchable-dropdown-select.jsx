"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useI18n } from "@/context/translate-api";
import { useOnClickOutside } from "@/hooks/use-click-outside";

/**
 * Helper function to get nested value from object using dot notation
 */
const getNestedValue = (obj, path) => {
  if (typeof path === "string") {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  }
  return obj?.[path];
};

/**
 * Default getValue function
 */
const defaultGetValue = (option) => {
  if (typeof option === "string") return option;
  return option.value ?? option.id ?? option.name ?? option;
};

/**
 * Default getLabel function
 */
const defaultGetLabel = (option, locale) => {
  if (typeof option === "string") return option;
  if (option.label) return option.label;
  if (locale === "ar" && option.ar_label) return option.ar_label;
  if (locale === "ar" && option.ar_name) return option.ar_name;
  if (option.en_label) return option.en_label;
  if (option.en_name) return option.en_name;
  return option.value ?? option.id ?? option.name ?? String(option);
};

/**
 * Default search function
 */
const defaultSearch = (option, query, searchFields, getLabel, getValue) => {
  const queryLower = query.toLowerCase();

  // If searchFields is a function, use it directly
  if (typeof searchFields === "function") {
    return searchFields(option, queryLower);
  }

  // If searchFields is an array, search in those fields
  if (Array.isArray(searchFields)) {
    return searchFields.some((field) => {
      const fieldValue = getNestedValue(option, field);
      return fieldValue?.toLowerCase().includes(queryLower);
    });
  }

  // Default: search in label
  const label = getLabel(option);
  return label?.toLowerCase().includes(queryLower);
};

/**
 * Default sort function
 */
const defaultSort = (options, locale, getLabel) => {
  return [...options].sort((a, b) => {
    const labelA = getLabel(a, locale) || "";
    const labelB = getLabel(b, locale) || "";
    return labelA.trim().localeCompare(labelB.trim(), locale, {
      sensitivity: "base",
    });
  });
};

/**
 * SearchableDropdownSelect - A universal, configurable searchable dropdown component
 *
 * @param {Array} options - Array of items (required)
 * @param {string} value - Selected value
 * @param {Function} onChange - Callback when selection changes: (event) => void
 * @param {string} name - Input name attribute
 * @param {string} label - Label text (optional)
 * @param {boolean} required - Whether field is required
 * @param {boolean} error - Whether to show error state
 * @param {string} errorMessage - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showAllOption - Show "All" option (for filters)
 * @param {string} allOptionLabel - Label for "All" option
 * @param {string} allOptionValue - Value for "All" option (default: "")
 * @param {Function} getValue - Function to extract value from option: (option) => string
 * @param {Function} getLabel - Function to get display label: (option, locale) => string
 * @param {Array|Function} searchFields - Array of field names to search OR function: (option, query) => boolean
 * @param {Function} sortOptions - Optional custom sort function: (options, locale) => options
 * @param {boolean} isLoading - Loading state
 * @param {string} loadingText - Loading text (default: "Loading...")
 * @param {string} noResultsText - No results text (default: "No results found")
 * @param {string} searchPlaceholder - Search input placeholder
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 */
export default function SearchableDropdownSelect({
  options = [],
  value = "",
  onChange,
  name = "select",
  label,
  required = false,
  error = false,
  errorMessage = "",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  allOptionValue = "",
  getValue = defaultGetValue,
  getLabel = defaultGetLabel,
  searchFields,
  sortOptions,
  isLoading = false,
  loadingText,
  noResultsText,
  searchPlaceholder,
  className = "",
  disabled = false,
  ...rest
}) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      defaultSearch(option, query, searchFields, getLabel, getValue)
    );
  }, [options, searchQuery, searchFields, getLabel, getValue]);

  // Sort filtered options
  const sortedOptions = useMemo(() => {
    if (sortOptions) {
      return sortOptions(filteredOptions, locale);
    }
    return defaultSort(filteredOptions, locale, getLabel);
  }, [filteredOptions, locale, sortOptions, getLabel]);

  // Get selected option label
  const selectedLabel = useMemo(() => {
    if (!value || value === allOptionValue) {
      if (showAllOption && allOptionLabel) {
        return allOptionLabel;
      }
      return placeholder || "Select...";
    }
    const option = options.find((opt) => getValue(opt) === value);
    if (!option) return value;
    return getLabel(option, locale);
  }, [
    value,
    options,
    placeholder,
    showAllOption,
    allOptionLabel,
    allOptionValue,
    locale,
    getValue,
    getLabel,
  ]);

  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.children;
      let actualIndex;

      if (highlightedIndex === -1 && showAllOption) {
        // "All" option is at index 0
        actualIndex = 0;
      } else if (highlightedIndex >= 0) {
        // Regular items: account for "All" option if shown
        actualIndex = showAllOption ? highlightedIndex + 1 : highlightedIndex;
      } else {
        return; // No valid index to scroll to
      }

      if (items[actualIndex]) {
        items[actualIndex].scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, showAllOption]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (optionValue) => {
    const syntheticEvent = {
      target: {
        name,
        value: optionValue,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSelect(allOptionValue);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    const maxIndex = sortedOptions.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < maxIndex ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && sortedOptions[highlightedIndex]) {
          handleSelect(getValue(sortedOptions[highlightedIndex]));
        } else if (showAllOption && highlightedIndex === -1) {
          handleSelect(allOptionValue);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setHighlightedIndex(-1);
  };

  const defaultLoadingText =
    loadingText || (locale === "ar" ? "جاري التحميل..." : "Loading...");
  const defaultNoResultsText =
    noResultsText ||
    (locale === "ar" ? "لا توجد نتائج" : "No results found");
  const defaultSearchPlaceholder =
    searchPlaceholder ||
    (locale === "ar" ? "ابحث..." : "Search...");

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          className={`block text-sm font-medium mb-1 ${
            error ? "text-red-500" : "text-gray-700"
          }`}
          htmlFor={name}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <button
            type="button"
            id={name}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`block w-full rounded-md border py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-2 text-left ${
              error
                ? "border-red-500 ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } ${
              disabled
                ? "bg-gray-50 cursor-not-allowed opacity-60"
                : "cursor-pointer"
            } ${value && value !== allOptionValue && !disabled ? "pr-10" : "pr-10"}`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            {...rest}
          >
            <span
              className={`truncate block w-full ${
                value && value !== allOptionValue && !disabled ? "pr-10" : "pr-6"
              } ${
                !value || value === allOptionValue
                  ? "text-gray-400"
                  : "text-gray-900"
              }`}
            >
              {selectedLabel}
            </span>
            {(!value || value === allOptionValue || disabled) && (
              <ChevronDown
                size={18}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform pointer-events-none ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
          {value && value !== allOptionValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors z-10"
              aria-label={locale === "ar" ? "مسح" : "Clear"}
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={defaultSearchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Options List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto"
              role="listbox"
            >
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {defaultLoadingText}
                </div>
              ) : sortedOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {defaultNoResultsText}
                </div>
              ) : (
                <>
                  {showAllOption && (
                    <button
                      type="button"
                      onClick={() => handleSelect(allOptionValue)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                        !value || value === allOptionValue
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-900"
                      } ${
                        highlightedIndex === -1 ? "bg-gray-100" : ""
                      }`}
                      onMouseEnter={() => setHighlightedIndex(-1)}
                    >
                      {allOptionLabel || "All"}
                    </button>
                  )}
                  {sortedOptions.map((option, index) => {
                    const optionValue = getValue(option);
                    const optionLabel = getLabel(option, locale);
                    const isSelected = value === optionValue;

                    return (
                      <button
                        key={optionValue || index}
                        type="button"
                        onClick={() => handleSelect(optionValue)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-900"
                        } ${
                          highlightedIndex === index ? "bg-gray-100" : ""
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {optionLabel}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Results count */}
            {!isLoading && sortedOptions.length > 0 && searchQuery && (
              <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
                {locale === "ar"
                  ? `${sortedOptions.length} نتيجة`
                  : `${sortedOptions.length} result${
                      sortedOptions.length !== 1 ? "s" : ""
                    }`}
              </div>
            )}
          </div>
        )}
      </div>

      {error && errorMessage && (
        <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
      )}
    </div>
  );
}
