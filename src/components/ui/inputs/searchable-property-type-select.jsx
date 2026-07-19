"use client";

import { useMemo, useCallback } from "react";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import SearchableDropdownSelect from "./searchable-dropdown-select";

/**
 * SearchablePropertyTypeSelect - Property type filter with localized display labels.
 * API value is always the English enum (`type.value`).
 */
export default function SearchablePropertyTypeSelect({
  value = "",
  onChange,
  name = "property_type",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  className = "",
  disabled = false,
  ...rest
}) {
  const { locale, translate, t } = useI18n();

  const buildingTypes = useMemo(() => {
    const slice = { buildingTypes: t.buildingTypes || {} };
    return getBuildingTypes({ en: slice, ar: slice });
  }, [t]);

  const getTypeLabel = useCallback(
    (type, currentLocale) => {
      const key = String(type?.value || "").toLowerCase();
      return (
        translate(`buildingTypes.${key}`) ||
        (currentLocale === "ar" ? type.ar_label : type.en_label) ||
        type.value
      );
    },
    [translate]
  );

  const resolveSelectedLabel = useCallback(
    (selectedValue, currentLocale) => {
      if (!selectedValue) return "";

      const match = buildingTypes.find(
        (type) =>
          String(type.value).toLowerCase().trim() ===
          String(selectedValue).toLowerCase().trim()
      );
      if (match) return getTypeLabel(match, currentLocale);

      const byLabel = buildingTypes.find(
        (type) =>
          getTypeLabel(type, "ar") === selectedValue ||
          getTypeLabel(type, "en") === selectedValue
      );
      if (byLabel) return getTypeLabel(byLabel, currentLocale);

      return "";
    },
    [buildingTypes, getTypeLabel]
  );

  return (
    <SearchableDropdownSelect
      options={buildingTypes}
      value={value}
      onChange={onChange}
      name={name}
      placeholder={
        placeholder ||
        translate("unitsFilter.allPropertyTypes", "All Property Types")
      }
      showAllOption={showAllOption}
      allOptionLabel={
        allOptionLabel ||
        translate("unitsFilter.allPropertyTypes", "All Property Types")
      }
      getValue={(type) => type.value}
      getLabel={getTypeLabel}
      searchFields={["en_label", "ar_label", "value"]}
      isLoading={false}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No results found"}
      searchPlaceholder={
        locale === "ar" ? "ابحث عن نوع العقار..." : "Search property types..."
      }
      className={className}
      disabled={disabled}
      resolveSelectedLabel={resolveSelectedLabel}
      {...rest}
    />
  );
}
