"use client";

import { useI18n } from "@/hooks/useI18n";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import SearchableDropdownSelect from "./searchable-dropdown-select";
import { useCallback, useEffect, useState } from "react";

/**
 * SearchableSubDistrictSelect - Sub-district selection component with search functionality
 *
 * @param {string} value - Selected sub-district value (lowercase English)
 * @param {Function} onChange - Callback when sub-district changes: (event) => void
 * @param {string} name - Input name attribute
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showAllOption - Show "All Sub-districts" option (for filters)
 * @param {string} allOptionLabel - Label for "All Sub-districts" option
 * @param {string} city - City value to scope sub-districts
 * @param {string} district - District value to scope sub-districts
 * @param {boolean} disabled - Whether the select is disabled
 */
export default function SearchableSubDistrictSelect({
  value = "",
  onChange,
  name = "sub_district",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  className = "",
  disabled = false,
  city = "",
  district = "",
  ...rest
}) {
  const { locale, translate } = useI18n();
  const { getSubDistrictsWithLabels } = useCitiesDistricts();
  const [subsWithLabels, setSubsWithLabels] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [resolvedLabel, setResolvedLabel] = useState("");

  useEffect(() => {
    const loadSubs = async () => {
      try {
        setSubsLoading(true);
        if (!city || !district) {
          setSubsWithLabels([]);
          return;
        }
        const subs = await getSubDistrictsWithLabels(city, district);
        setSubsWithLabels(subs || []);
      } catch (error) {
        console.error("Failed to load sub-districts:", error);
        setSubsWithLabels([]);
      } finally {
        setSubsLoading(false);
      }
    };

    loadSubs();
  }, [city, district, locale, getSubDistrictsWithLabels]);

  useEffect(() => {
    let active = true;
    const loadLabel = async () => {
      if (!value || !city) {
        if (active) setResolvedLabel("");
        return;
      }
      try {
        const manager = (await import("@/utils/city_manager")).default.getInstance();
        await manager.initializeData();
        const cityObj = await manager.getCityByValue(city);
        if (!cityObj) {
          if (active) setResolvedLabel("");
          return;
        }
        const normalizedDistrict = district
          ? await manager.normalizeDistrictValueAsync(district, cityObj.id)
          : "";
        const normalizedSub = await manager.normalizeSubDistrictValueAsync(
          value,
          cityObj.value,
          normalizedDistrict || district
        );
        const label = await manager.getSubDistrictLabel(
          normalizedSub || value,
          cityObj.value,
          normalizedDistrict || district,
          locale
        );
        if (active) setResolvedLabel(label || "");
      } catch (error) {
        console.error("Failed to resolve sub-district label:", error);
        if (active) setResolvedLabel("");
      }
    };
    loadLabel();
    return () => {
      active = false;
    };
  }, [value, city, district, locale]);

  const resolveSelectedLabel = useCallback(
    (selectedValue, currentLocale) => {
      if (currentLocale === locale && resolvedLabel) return resolvedLabel;
      const match = subsWithLabels.find(
        (sd) =>
          String(sd.value).toLowerCase().trim() ===
          String(selectedValue).toLowerCase().trim()
      );
      if (match?.label) return match.label;
      return "";
    },
    [subsWithLabels, resolvedLabel, locale]
  );

  return (
    <SearchableDropdownSelect
      options={subsWithLabels}
      value={value}
      onChange={onChange}
      name={name}
      placeholder={
        placeholder ||
        translate("unitsFilter.allSubDistricts", "All Sub-districts")
      }
      showAllOption={showAllOption}
      allOptionLabel={
        allOptionLabel ||
        translate("unitsFilter.allSubDistricts", "All Sub-districts")
      }
      getValue={(sd) => sd.value}
      getLabel={(sd) => sd.label}
      getKey={(sd) =>
        sd.city_id && sd.district_value ? `${sd.city_id}-${sd.district_value}-${sd.value}` : sd.value
      }
      searchFields={["label", "value", "city_name"]}
      isLoading={subsLoading}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No results found"}
      searchPlaceholder={
        locale === "ar" ? "ابحث عن الحي..." : "Search sub-districts..."
      }
      className={className}
      disabled={disabled}
      resolveSelectedLabel={resolveSelectedLabel}
      {...rest}
    />
  );
}
