"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import {
  getCachedLocaleMessages,
  loadLocaleMessages,
} from "@/lib/i18n/load-locale-messages";
import SearchableDropdownSelect from "./searchable-dropdown-select";

const SEARCH_FIELDS = ["en_label", "ar_label", "value"];

/**
 * Folds the Arabic spelling variants brokers actually type:
 * harakat/tatweel, أ إ آ ٱ → ا, ى → ي, ة → ه.
 */
const normalizeSearchText = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .trim();

const matchesPropertyType = (option, query) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  const withoutSpaces = normalizedQuery.replace(/\s+/g, "");

  return SEARCH_FIELDS.some((field) => {
    const fieldValue = normalizeSearchText(option?.[field]);
    if (!fieldValue) return false;
    if (fieldValue.includes(normalizedQuery)) return true;
    // "twin house" should still match the "twinhouse" enum value.
    if (withoutSpaces.length > 3 && fieldValue.includes(withoutSpaces)) {
      return true;
    }
    return words.every((word) => fieldValue.includes(word));
  });
};

/**
 * SearchablePropertyTypeSelect - Property type filter with localized display labels.
 * API value is always the English enum (`type.value`).
 * Search matches Arabic labels, English labels and enum values, whatever the active locale.
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
  onOpenChange,
  ...rest
}) {
  const { locale, translate } = useI18n();
  const inactiveLocale = locale === "ar" ? "en" : "ar";

  // The inactive dictionary is code-split, so it is only fetched once the user
  // opens the dropdown and can actually search.
  const [inactiveLabels, setInactiveLabels] = useState(null);

  useEffect(() => {
    setInactiveLabels(
      getCachedLocaleMessages(inactiveLocale)?.buildingTypes || null
    );
  }, [inactiveLocale]);

  const loadInactiveLabels = useCallback(async () => {
    const messages = await loadLocaleMessages(inactiveLocale);
    setInactiveLabels(messages?.buildingTypes || null);
  }, [inactiveLocale]);

  const handleOpenChange = useCallback(
    (open) => {
      if (open && !inactiveLabels) loadInactiveLabels();
      onOpenChange?.(open);
    },
    [inactiveLabels, loadInactiveLabels, onOpenChange]
  );

  const buildingTypes = useMemo(() => {
    const active = { buildingTypes: translate("buildingTypes", {}) };
    const inactive = { buildingTypes: inactiveLabels || {} };
    return locale === "ar"
      ? getBuildingTypes({ ar: active, en: inactive })
      : getBuildingTypes({ en: active, ar: inactive });
  }, [translate, locale, inactiveLabels]);

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

      // Legacy filters can hold a localized label instead of the enum value.
      const byLabel = buildingTypes.find(
        (type) =>
          type.ar_label === selectedValue ||
          type.en_label === selectedValue ||
          getTypeLabel(type, currentLocale) === selectedValue
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
      searchFields={matchesPropertyType}
      isLoading={false}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No results found"}
      searchPlaceholder={
        locale === "ar" ? "ابحث عن نوع العقار..." : "Search property types..."
      }
      className={className}
      disabled={disabled}
      resolveSelectedLabel={resolveSelectedLabel}
      onOpenChange={handleOpenChange}
      {...rest}
    />
  );
}
