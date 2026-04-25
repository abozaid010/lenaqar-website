"use client";

import { useI18n } from "@/hooks/useI18n";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import SearchableDropdownSelect from "./searchable-dropdown-select";
import { useEffect, useState } from "react";

/**
 * SearchableCitySelect - A reusable city selection component with search functionality
 * Wrapper around SearchableDropdownSelect with city-specific configuration
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
  const { getAllCitiesWithLabels } = useCitiesDistricts();
  const [citiesWithLabels, setCitiesWithLabels] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setCitiesLoading(true);
        const cities = await getAllCitiesWithLabels();
        setCitiesWithLabels(cities || []);
      } catch (error) {
        console.error("Failed to load cities:", error);
        setCitiesWithLabels([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    loadCities();
  }, [getAllCitiesWithLabels]);

  return (
    <SearchableDropdownSelect
      options={citiesWithLabels}
      value={value}
      onChange={onChange}
      name={name}
      label={label}
      required={required}
      error={error}
      errorMessage={errorMessage}
      placeholder={placeholder || t.basicDetails?.selectCity || "Select City"}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || t.unitsFilter?.allCities || "All Cities"}
      getValue={(city) => city.value}
      getLabel={(city) => city.label}
      searchFields={["label", "value"]}
      isLoading={citiesLoading}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading cities..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No cities found"}
      searchPlaceholder={locale === "ar" ? "ابحث عن المدينة..." : "Search cities..."}
      className={className}
      disabled={disabled}
      {...rest}
    />
  );
}
