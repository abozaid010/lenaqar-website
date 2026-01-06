import { useI18n } from "@/context/translate-api";
import en from "../../public/locales/en";
import ar from "../../public/locales/ar";
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

export const useLocaleConstants = () => {
  const { t, locale } = useI18n();

  // Create translations object with both English and Arabic for helper functions
  const translations = {
    en: {
      buildingTypes: en.buildingTypes || {},
      unitDetails: {
        viewTypes: en.unitDetails?.viewTypes || {},
        finishingTypes: en.unitDetails?.finishingTypes || {},
        furnishingTypes: en.unitDetails?.furnishingTypes || {},
      },
      propertyStatus: en.propertyStatus || {},
      propertyUsage: en.propertyUsage || {},
      propertyPurpose: en.propertyPurpose || {},
      purpose: en.purpose || {},
      propertyIntent: en.propertyIntent || en.purpose || {},
    },
    ar: {
      buildingTypes: ar.buildingTypes || {},
      unitDetails: {
        viewTypes: ar.unitDetails?.viewTypes || {},
        finishingTypes: ar.unitDetails?.finishingTypes || {},
        furnishingTypes: ar.unitDetails?.furnishingTypes || {},
      },
      propertyStatus: ar.propertyStatus || {},
      propertyUsage: ar.propertyUsage || {},
      propertyPurpose: ar.propertyPurpose || {},
      purpose: ar.purpose || {},
      propertyIntent: ar.propertyIntent || ar.purpose || {},
    },
  };

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

  return {
    getBuildingTypes: getBuildingTypesWithLabels,
    getViewTypes: getViewTypesWithLabels,
    getFinishingTypes: getFinishingTypesWithLabels,
    getFurnishingTypes: getFurnishingTypesWithLabels,
    getPropertyUsage: getPropertyUsageWithLabels,
    getPropertyStatus: getPropertyStatusWithLabels,
    getPropertyPurpose: getPropertyPurposeWithLabels,
    getPropertyIntent: getPropertyIntentWithLabels,
  };
};

// For use outside of React components - re-export from constants
import { getStaticViewTypeMapping, STATIC_CITIES } from '@/data/constants';

export { getStaticViewTypeMapping, STATIC_CITIES };