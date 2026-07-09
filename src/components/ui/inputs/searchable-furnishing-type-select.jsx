"use client";

import { useMemo, useCallback } from "react";
import { useI18n } from "@/hooks/useI18n";
import { getFurnishingTypes } from "@/data/constants";
import en from "../../../../public/locales/en";
import ar from "../../../../public/locales/ar";
import SearchableDropdownSelect from "./searchable-dropdown-select";

const FURNISHING_TRANSLATION_KEYS = {
  furnished: "property.furnishing.furnished",
  unfurnished: "property.furnishing.unfurnished",
  hotel_furnished: "property.furnishing.hotelFurnished",
  "partially furnished": "property.furnishing.partiallyFurnished",
  "semi furnished": "property.furnishing.semiFurnished",
  flixy: "property.furnishing.flixy",
  turnkey: "property.furnishing.turnkey",
};

/**
 * SearchableFurnishingTypeSelect - Furnishing filter with localized display labels.
 * API value is always the English enum (`type.value`), e.g. furnished_type=unfurnished.
 */
export default function SearchableFurnishingTypeSelect({
  value = "",
  onChange,
  name = "furnished_type",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  className = "",
  disabled = false,
  ...rest
}) {
  const { locale, translate } = useI18n();

  const furnishingTypes = useMemo(
    () =>
      getFurnishingTypes({
        en: { unitDetails: { furnishingTypes: en.unitDetails?.furnishingTypes || {} } },
        ar: { unitDetails: { furnishingTypes: ar.unitDetails?.furnishingTypes || {} } },
      }),
    []
  );

  const getTypeLabel = useCallback(
    (type, currentLocale) => {
      const key = String(type?.value || "").toLowerCase();
      const translationKey = FURNISHING_TRANSLATION_KEYS[key];
      if (translationKey) {
        const translated = translate(translationKey);
        if (translated && translated !== translationKey) return translated;
      }
      return (
        (currentLocale === "ar" ? type.ar_label : type.en_label) ||
        type.value
      );
    },
    [translate]
  );

  const resolveSelectedLabel = useCallback(
    (selectedValue, currentLocale) => {
      if (!selectedValue) return "";

      const match = furnishingTypes.find(
        (type) =>
          String(type.value).toLowerCase().trim() ===
          String(selectedValue).toLowerCase().trim()
      );
      if (match) return getTypeLabel(match, currentLocale);

      const byLabel = furnishingTypes.find(
        (type) =>
          getTypeLabel(type, "ar") === selectedValue ||
          getTypeLabel(type, "en") === selectedValue
      );
      if (byLabel) return getTypeLabel(byLabel, currentLocale);

      return "";
    },
    [furnishingTypes, getTypeLabel]
  );

  return (
    <SearchableDropdownSelect
      options={furnishingTypes}
      value={value}
      onChange={onChange}
      name={name}
      placeholder={
        placeholder ||
        translate("unitsFilter.allFurnishingTypes", "All Furnishing Types")
      }
      showAllOption={showAllOption}
      allOptionLabel={
        allOptionLabel ||
        translate("unitsFilter.allFurnishingTypes", "All Furnishing Types")
      }
      getValue={(type) => type.value}
      getLabel={getTypeLabel}
      searchFields={["en_label", "ar_label", "value"]}
      isLoading={false}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No results found"}
      searchPlaceholder={
        locale === "ar" ? "ابحث عن نوع الفرش..." : "Search furnishing types..."
      }
      className={className}
      disabled={disabled}
      resolveSelectedLabel={resolveSelectedLabel}
      {...rest}
    />
  );
}
