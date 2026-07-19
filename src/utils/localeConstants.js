import { useI18n } from "@/context/translate-api";
import {
  getBuildingTypes,
  getViewTypes,
  getFinishingTypes,
  getFurnishingTypes,
  getPropertyUsage,
  getPropertyStatus,
  getPropertyPurpose,
  getPropertyIntent,
} from "@/data/constants";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS as enLocale } from "date-fns/locale";
import { useMemo } from "react";


export const useLocaleConstants = () => {
  const { t, locale } = useI18n();

  // Use the active locale dictionary only (avoids bundling both languages).
  // Both `en`/`ar` keys point at the same active slice so existing
  // en_label/ar_label pickers keep working for the current language.
  const translations = useMemo(() => {
    const slice = {
      buildingTypes: t.buildingTypes || {},
      unitDetails: {
        viewTypes: t.unitDetails?.viewTypes || {},
        finishingTypes: t.unitDetails?.finishingTypes || {},
        furnishingTypes: t.unitDetails?.furnishingTypes || {},
      },
      propertyStatus: t.propertyStatus || {},
      propertyUsage: t.propertyUsage || {},
      propertyPurpose: t.propertyPurpose || {},
      purpose: t.purpose || {},
      propertyIntent: t.propertyIntent || t.purpose || {},
    };
    return { en: slice, ar: slice };
  }, [t]);

  const getBuildingTypesWithLabels = () => {
    return getBuildingTypes(translations);
  };

  const getViewTypesWithLabels = () => {
    return getViewTypes(translations);
  };

  const getFinishingTypesWithLabels = () => {
    return getFinishingTypes(translations);
  };

  const getFurnishingTypesWithLabels = () => {
    return getFurnishingTypes(translations);
  };

  const getPropertyUsageWithLabels = () => {
    return getPropertyUsage(translations);
  };

  const getPropertyStatusWithLabels = () => {
    return getPropertyStatus(translations);
  };

  const getPropertyPurposeWithLabels = () => {
    return getPropertyPurpose(translations);
  };

  const getPropertyIntentWithLabels = () => {
    return getPropertyIntent(translations);
  };

  // Date formatting functions
  const formatDateTimeAmPmShort = (value) => {
    if (!value) return "";

    let dateObj;
    try {
      dateObj = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(dateObj.getTime())) return "";
    } catch {
      return "";
    }

    const monthNames = {
      en: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      ar: [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ]
    };

    const month = monthNames[locale]?.[dateObj.getMonth()] || monthNames.en[dateObj.getMonth()];
    const day = dateObj.getDate();

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? (locale === "ar" ? "م" : "PM") : (locale === "ar" ? "ص" : "AM");
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "No messages";
    try {
      const dateLocale = locale === "ar" ? arLocale : enLocale;
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: dateLocale });
    } catch {
      return "Unknown time";
    }
  };

  const formatDate = (dateString, showTime = true) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const dateLocale = locale === "ar" ? "ar-SA" : "en-US";
    const options = {
      year: "numeric",
      month: "long", 
      day: "numeric",
      timeZone: "UTC",
    };

    if (showTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = true;
    }

    return showTime
      ? date.toLocaleString(dateLocale, options)
      : date.toLocaleDateString(dateLocale, {
          ...options,
          hour: undefined,
          minute: undefined,
        });
  };

  return {
    getBuildingTypes: getBuildingTypesWithLabels,
    getViewTypes: getViewTypesWithLabels,
    getFinishingTypes: getFinishingTypesWithLabels,
    getFurnishingTypes: getFurnishingTypesWithLabels,
    getPropertyUsage: getPropertyUsageWithLabels,
    getPropertyStatus: getPropertyStatusWithLabels,
    getPropertyPurpose: getPropertyPurposeWithLabels,
    getPropertyIntent: getPropertyIntentWithLabels,
    formatDateTimeAmPmShort,
    formatRelativeTime,
    formatDate,
  };
};

// For use outside of React components - re-export from constants
import { getStaticViewTypeMapping } from '@/data/constants';

export { getStaticViewTypeMapping };