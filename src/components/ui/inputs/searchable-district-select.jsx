"use client";

import { useI18n } from "@/hooks/useI18n";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import SearchableDropdownSelect from "./searchable-dropdown-select";
import { useCallback, useEffect, useState } from "react";

/**
 * SearchableDistrictSelect - A reusable district selection component with search functionality
 * Wrapper around SearchableDropdownSelect with district-specific configuration
 *
 * @param {string} value - Selected district value (lowercase English)
 * @param {Function} onChange - Callback when district changes: (event) => void
 * @param {string} name - Input name attribute
 * @param {string} label - Label text (optional)
 * @param {boolean} required - Whether field is required
 * @param {boolean} error - Whether to show error state
 * @param {string} errorMessage - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showAllOption - Show "All Districts" option (for filters)
 * @param {string} allOptionLabel - Label for "All Districts" option
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} city - Optional city value to scope districts; when empty, all districts are shown
 */
export default function SearchableDistrictSelect({
  value = "",
  onChange,
  name = "district",
  label,
  required = false,
  error = false,
  errorMessage = "",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  className = "",
  disabled = false,
  city = "",
  ...rest
}) {
  const { locale, translate } = useI18n();
  const { getDistrictsWithLabels, getAllDistrictsWithLabels } = useCitiesDistricts();
  const [districtsWithLabels, setDistrictsWithLabels] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [resolvedLabel, setResolvedLabel] = useState("");

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        setDistrictsLoading(true);
        const districts = city
          ? await getDistrictsWithLabels(city)
          : await getAllDistrictsWithLabels();
        setDistrictsWithLabels(districts || []);
      } catch (error) {
        console.error("Failed to load districts:", error?.message ?? error);
        setDistrictsWithLabels([]);
      } finally {
        setDistrictsLoading(false);
      }
    };

    loadDistricts();
  }, [city, locale, getDistrictsWithLabels, getAllDistrictsWithLabels]);

  useEffect(() => {
    let active = true;
    const loadLabel = async () => {
      if (!value) {
        if (active) setResolvedLabel("");
        return;
      }
      try {
        const manager = (await import("@/utils/city_manager")).default.getInstance();
        await manager.initializeData();
        if (city) {
          const cityObj = await manager.getCityByValue(city);
          if (!cityObj) {
            if (active) setResolvedLabel("");
            return;
          }
          const label = await manager.getDistrictLabel(value, cityObj.value, locale);
          if (active) setResolvedLabel(label || "");
          return;
        }
        // No city scope: resolve from the full district list so reload still shows a label.
        const districts = await manager.getDistrictsWithLabels(null, locale);
        const match = (districts || []).find(
          (d) =>
            String(d.value).toLowerCase().trim() ===
            String(value).toLowerCase().trim()
        );
        if (active) setResolvedLabel(match?.label || "");
      } catch (error) {
        console.error("Failed to resolve district label:", error?.message ?? error);
        if (active) setResolvedLabel("");
      }
    };
    loadLabel();
    return () => {
      active = false;
    };
  }, [value, city, locale]);

  const resolveSelectedLabel = useCallback(
    (selectedValue, currentLocale) => {
      if (currentLocale === locale && resolvedLabel) return resolvedLabel;
      const match = districtsWithLabels.find(
        (district) =>
          String(district.value).toLowerCase().trim() ===
          String(selectedValue).toLowerCase().trim()
      );
      if (match?.label) return match.label;
      return "";
    },
    [districtsWithLabels, resolvedLabel, locale]
  );

  return (
    <SearchableDropdownSelect
      options={districtsWithLabels}
      value={value}
      onChange={onChange}
      name={name}
      label={label}
      required={required}
      error={error}
      errorMessage={errorMessage}
      placeholder={
        placeholder ||
        translate("unitsFilter.allDistricts", "All Districts")
      }
      showAllOption={showAllOption}
      allOptionLabel={
        allOptionLabel ||
        translate("unitsFilter.allDistricts", "All Districts")
      }
      getValue={(district) => district.value}
      getLabel={(district) => district.label}
      getKey={(district) =>
        district.city_id
          ? `${district.city_id}-${district.value}`
          : district.value
      }
      searchFields={["label", "value", "city_name"]}
      isLoading={districtsLoading}
      loadingText={
        locale === "ar" ? "جاري التحميل..." : "Loading districts..."
      }
      noResultsText={
        locale === "ar" ? "لا توجد نتائج" : "No districts found"
      }
      searchPlaceholder={
        locale === "ar" ? "ابحث عن المنطقة..." : "Search districts..."
      }
      className={className}
      disabled={disabled}
      resolveSelectedLabel={resolveSelectedLabel}
      {...rest}
    />
  );
}
