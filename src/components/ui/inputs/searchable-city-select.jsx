"use client";

import { useI18n } from "@/hooks/useI18n";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import SearchableDropdownSelect from "./searchable-dropdown-select";
import { useCallback, useEffect, useState } from "react";

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
  const { locale, translate } = useI18n();
  const { getAllCitiesWithLabels } = useCitiesDistricts();
  const [citiesWithLabels, setCitiesWithLabels] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [resolvedLabel, setResolvedLabel] = useState("");

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

  useEffect(() => {
    let active = true;
    const loadLabel = async () => {
      if (!value) {
        if (active) setResolvedLabel("");
        return;
      }
      try {
        const manager = (await import("@/utils/city_manager")).default.getInstance();
        const cityObj = await manager.getCityByValue(value);
        if (!cityObj) {
          if (active) setResolvedLabel("");
          return;
        }
        const label = await manager.getCityLabel(cityObj.id, locale);
        if (active) setResolvedLabel(label || "");
      } catch (error) {
        console.error("Failed to resolve city label:", error);
        if (active) setResolvedLabel("");
      }
    };
    loadLabel();
    return () => {
      active = false;
    };
  }, [value, locale]);

  const resolveSelectedLabel = useCallback(
    (selectedValue, currentLocale) => {
      if (currentLocale === locale && resolvedLabel) return resolvedLabel;
      const match = citiesWithLabels.find(
        (city) =>
          String(city.value).toLowerCase().trim() ===
          String(selectedValue).toLowerCase().trim()
      );
      if (match?.label) return match.label;
      return "";
    },
    [citiesWithLabels, resolvedLabel, locale]
  );

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
      placeholder={placeholder || translate("unitsFilter.allCities", "All Cities")}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || translate("unitsFilter.allCities", "All Cities")}
      getValue={(city) => city.value}
      getLabel={(city) => city.label}
      searchFields={["label", "value"]}
      isLoading={citiesLoading}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading cities..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No cities found"}
      searchPlaceholder={locale === "ar" ? "ابحث عن المدينة..." : "Search cities..."}
      className={className}
      disabled={disabled}
      resolveSelectedLabel={resolveSelectedLabel}
      {...rest}
    />
  );
}
