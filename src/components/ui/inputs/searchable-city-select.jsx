"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useI18n } from "@/context/translate-api";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import { useOnClickOutside } from "@/hooks/use-click-outside";

/**
 * SearchableCitySelect - A reusable city selection component with search functionality
 * 
 * @param {string} value - Selected city value (lowercase English)
 * @param {Function} onChange - Callback when city changes: (event) => void
 * @param {string} name - Input name attribute
 * @param {string} label - Label text (optional)
 * @param {boolean} required - Whether field is required
 * @param {boolean} error - Whether to show error state
 * @param {string} errorMessage - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showAllOption - Show "All Cities" option (for filters)
 * @param {string} allOptionLabel - Label for "All Cities" option
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 */
export default function SearchableCitySelect({
  value = "",
  onChange,
  name = "city",
  label,
  required = false,
  error = false,
  errorMessage = "",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  className = "",
  disabled = false,
  ...rest
}) {
  const { t, locale } = useI18n();
  const { getAllCitiesWithLabels, isLoading: citiesLoading } = useCitiesDistricts();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const citiesWithLabels = getAllCitiesWithLabels();

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) {
      return citiesWithLabels;
    }

    const query = searchQuery.toLowerCase();
    return citiesWithLabels.filter((city) =>
      city.label.toLowerCase().includes(query) ||
      city.value.toLowerCase().includes(query)
    );
  }, [citiesWithLabels, searchQuery]);

  // Get selected city label
  const selectedCityLabel = useMemo(() => {
    if (!value) {
      if (showAllOption && allOptionLabel) {
        return allOptionLabel;
      }
      return placeholder || t.basicDetails?.selectCity || "Select City";
    }
    const city = citiesWithLabels.find((c) => c.value === value);
    return city?.label || value;
  }, [value, citiesWithLabels, placeholder, showAllOption, allOptionLabel, t]);

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
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (cityValue) => {
    const syntheticEvent = {
      target: {
        name,
        value: cityValue,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSelect("");
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCities[highlightedIndex]) {
          handleSelect(filteredCities[highlightedIndex].value);
        } else if (showAllOption && highlightedIndex === -1) {
          handleSelect("");
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
            disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : "cursor-pointer"
          } ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...rest}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`truncate flex-1 ${
                !value ? "text-gray-400" : "text-gray-900"
              }`}
            >
              {selectedCityLabel}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  aria-label={locale === "ar" ? "مسح" : "Clear"}
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </button>

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
                  placeholder={
                    locale === "ar"
                      ? "ابحث عن المدينة..."
                      : "Search cities..."
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Cities List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto"
              role="listbox"
            >
              {citiesLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {locale === "ar" ? "جاري التحميل..." : "Loading cities..."}
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {locale === "ar"
                    ? "لا توجد نتائج"
                    : "No cities found"}
                </div>
              ) : (
                <>
                  {showAllOption && (
                    <button
                      type="button"
                      onClick={() => handleSelect("")}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                        !value ? "bg-blue-50 text-blue-600" : "text-gray-900"
                      } ${
                        highlightedIndex === -1 ? "bg-gray-100" : ""
                      }`}
                      onMouseEnter={() => setHighlightedIndex(-1)}
                    >
                      {allOptionLabel ||
                        t.unitsFilter?.allCities ||
                        "All Cities"}
                    </button>
                  )}
                  {filteredCities.map((city, index) => (
                    <button
                      key={city.value}
                      type="button"
                      onClick={() => handleSelect(city.value)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                        value === city.value
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-900"
                      } ${
                        highlightedIndex === index ? "bg-gray-100" : ""
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      role="option"
                      aria-selected={value === city.value}
                    >
                      {city.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Results count */}
            {!citiesLoading && filteredCities.length > 0 && searchQuery && (
              <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
                {locale === "ar"
                  ? `${filteredCities.length} نتيجة`
                  : `${filteredCities.length} result${filteredCities.length !== 1 ? "s" : ""}`}
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
