"use client";

import { useI18n } from "@/hooks/useI18n";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import SearchableDropdownSelect from "./searchable-dropdown-select";
import { useEffect, useState } from "react";

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
  }, [city, district, getSubDistrictsWithLabels]);

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
      {...rest}
    />
  );
}

