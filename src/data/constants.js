// Centralized enum constants for the application
// All enum values are defined here and can be transformed with translations from locale files

export const MIN_LAND_AREA = 9;

// Raw enum value arrays
export const BUILDING_TYPE_VALUES = [
  "apartment",
  "villa",
  "svilla",
  "townhouse",
  "duplex",
  "duplex ground",
  "duplex roof",
  "penthouse",
  "studio",
  "chalet",
  "office",
  "shop",
  "twinhouse",
  "house",
  "pharmacy",
  "clinic",
  "cabinet",
  "commercial",
  "serviced apartment",
  "loft",
  "office villa",
  "condo",
  "land",
 "food and beverage",
 "retail",
 "standalone",
 "admin", 
 "bank",
 "medical",
 "palace",
 "sky loft",
 "maisonette",
 "warehouse",
 "suite",
 "farm",
  "beauty salon", 
  "cafe",
  "gym",
  "parking",
  "garage",
  "workspace",
  "storage",
  "hotel",
  "hostel"
 ];

export const VIEW_TYPE_VALUES = [
  "park",
  "street",
  "lagoon",
  "sea",
  "city",
  "river",
  "pool",
  "golf",
  "garden",
  "open area",
  "mountain",
   "watercourse"

];

export const normalizeViewTypeValue = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return "";

  const normalized = String(rawValue)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "";

  const withoutSuffix = normalized.replace(/\s+view$/, "").trim();

  const aliases = {
    openarea: "open area",
    "open-area": "open area",
    open: "open area",
    "water course": "watercourse",
  };

  const candidate = aliases[withoutSuffix] || withoutSuffix;
  return VIEW_TYPE_VALUES.includes(candidate) ? candidate : withoutSuffix;
};

export const FINISHING_TYPE_VALUES = [
  "fully finished",
  "semi finished",
  "core & shell",
  "flixy",
  "white box", 
  "turnkey"
];

export const FURNISHING_TYPE_VALUES = [
  "furnished",
  "unfurnished",
  "hotel_furnished",
  "partially furnished",
  "flixy", 
  "turnkey"
];

export const PROPERTY_STATUS_VALUES = [
  "ready to move",
  "off-plan"
];

export const PROPERTY_USAGE_VALUES = [
  "residential",
  "commercial",
  "mixed-use"
];

export const PROPERTY_PURPOSE_VALUES = [
  "housing",
  "investment"
];

export const PROPERTY_INTENT_VALUES = [
  "buy",
  "rent",
  "sell",
  "lease"
];

// Helper function to get building types with translations
export const getBuildingTypes = (translations) => {
  if (!translations?.buildingTypes) {
    return BUILDING_TYPE_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const enTranslations = translations.en?.buildingTypes || translations.buildingTypes || {};
  const arTranslations = translations.ar?.buildingTypes || {};
  
  return BUILDING_TYPE_VALUES.map(value => ({
    value,
    en_label: enTranslations[value] || value,
    ar_label: arTranslations[value] || value
  }));
};

// Helper function to get view types with translations
export const getViewTypes = (translations) => {
  if (!translations) {
    return VIEW_TYPE_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  // Check for different possible translation paths
  const viewTypesEn = translations.en?.unitDetails?.viewTypes || 
                      translations.en?.viewTypes ||
                      translations.unitDetails?.viewTypes ||
                      translations.viewTypes ||
                      {};
  const viewTypesAr = translations.ar?.unitDetails?.viewTypes || 
                      translations.ar?.viewTypes ||
                      {};
  
  return VIEW_TYPE_VALUES.map(value => {
    // Handle "open area" vs "openArea" key mismatch
    const translationKey = value === "open area" ? "openArea" : value;
    return {
      value,
      en_label: viewTypesEn[translationKey] || viewTypesEn[value] || value,
      ar_label: viewTypesAr[translationKey] || viewTypesAr[value] || value
    };
  });
};

// Helper function to get finishing types with translations
export const getFinishingTypes = (translations) => {
  if (!translations) {
    return FINISHING_TYPE_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const finishingTypesEn = translations.en?.unitDetails?.finishingTypes ||
                           translations.en?.finishingTypes ||
                           translations.unitDetails?.finishingTypes ||
                           translations.finishingTypes ||
                           {};
  const finishingTypesAr = translations.ar?.unitDetails?.finishingTypes ||
                           translations.ar?.finishingTypes ||
                           {};
  
  return FINISHING_TYPE_VALUES.map(value => ({
    value,
    en_label: finishingTypesEn[value] || value,
    ar_label: finishingTypesAr[value] || value
  }));
};

// Helper function to get furnishing types with translations
export const getFurnishingTypes = (translations) => {
  if (!translations) {
    return FURNISHING_TYPE_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const furnishingTypesEn = translations.en?.unitDetails?.furnishingTypes ||
                            translations.en?.furnishingTypes ||
                            translations.unitDetails?.furnishingTypes ||
                            translations.furnishingTypes ||
                            {};
  const furnishingTypesAr = translations.ar?.unitDetails?.furnishingTypes ||
                            translations.ar?.furnishingTypes ||
                            {};
  
  return FURNISHING_TYPE_VALUES.map(value => ({
    value,
    en_label: furnishingTypesEn[value] || value,
    ar_label: furnishingTypesAr[value] || value
  }));
};

// Helper function to get property status with translations
export const getPropertyStatus = (translations) => {
  if (!translations) {
    return PROPERTY_STATUS_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const propertyStatusEn = translations.en?.propertyStatus ||
                           translations.propertyStatus ||
                           {};
  const propertyStatusAr = translations.ar?.propertyStatus || {};
  
  return PROPERTY_STATUS_VALUES.map(value => {
    // Handle "off-plan" vs "offPlan" key mismatch
    const translationKey = value === "off-plan" ? "offPlan" : value === "ready to move" ? "readyToMove" : value;
    return {
      value,
      en_label: propertyStatusEn[translationKey] || propertyStatusEn[value] || value,
      ar_label: propertyStatusAr[translationKey] || propertyStatusAr[value] || value
    };
  });
};

// Helper function to get property usage with translations
export const getPropertyUsage = (translations) => {
  if (!translations) {
    return PROPERTY_USAGE_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const propertyUsageEn = translations.en?.propertyUsage ||
                          translations.propertyUsage ||
                          {};
  const propertyUsageAr = translations.ar?.propertyUsage || {};
  
  return PROPERTY_USAGE_VALUES.map(value => {
    // Handle "mixed-use" vs "mixedUse" key mismatch
    const translationKey = value === "mixed-use" ? "mixedUse" : value;
    return {
      value,
      en_label: propertyUsageEn[translationKey] || propertyUsageEn[value] || value,
      ar_label: propertyUsageAr[translationKey] || propertyUsageAr[value] || value
    };
  });
};

// Helper function to get property purpose with translations
export const getPropertyPurpose = (translations) => {
  if (!translations) {
    return PROPERTY_PURPOSE_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const propertyPurposeEn = translations.en?.propertyPurpose ||
                            translations.propertyPurpose ||
                            {};
  const propertyPurposeAr = translations.ar?.propertyPurpose || {};
  
  return PROPERTY_PURPOSE_VALUES.map(value => ({
    value,
    en_label: propertyPurposeEn[value] || value,
    ar_label: propertyPurposeAr[value] || value
  }));
};

// Helper function to get property intent with translations
export const getPropertyIntent = (translations) => {
  if (!translations) {
    return PROPERTY_INTENT_VALUES.map(value => ({
      value,
      en_label: value,
      ar_label: value
    }));
  }
  
  const propertyIntentEn = translations.en?.propertyIntent ||
                           translations.en?.purpose ||
                           translations.propertyIntent ||
                           translations.purpose ||
                           {};
  const propertyIntentAr = translations.ar?.propertyIntent ||
                           translations.ar?.purpose ||
                           {};
  
  return PROPERTY_INTENT_VALUES.map(value => ({
    value,
    en_label: propertyIntentEn[value] || value,
    ar_label: propertyIntentAr[value] || value
  }));
};

// Get all enum constants at once
export const getEnumConstants = (localeTranslations) => {
  return {
    buildingTypes: getBuildingTypes(localeTranslations),
    viewTypes: getViewTypes(localeTranslations),
    finishingTypes: getFinishingTypes(localeTranslations),
    furnishingTypes: getFurnishingTypes(localeTranslations),
    propertyStatus: getPropertyStatus(localeTranslations),
    propertyUsage: getPropertyUsage(localeTranslations),
    propertyPurpose: getPropertyPurpose(localeTranslations),
    propertyIntent: getPropertyIntent(localeTranslations)
  };
};

// Static exports for backward compatibility (will be populated via factory function)
// These are used by components that need static arrays outside React context
let _BUILDING_TYPES = [];
let _VIEW_TYPES = [];
let _FINISHING_TYPES = [];
let _FURNISHING_TYPES = [];
let _PROPERTY_USAGE = [];
let _PROPERTY_STATUS = [];
let _PROPERTY_PURPOSE = [];
let _PROPERTY_INTENT = [];

// Factory function to initialize static arrays (call this with translations if needed)
export const initializeStaticConstants = (translations) => {
  _BUILDING_TYPES = getBuildingTypes(translations);
  _VIEW_TYPES = getViewTypes(translations);
  _FINISHING_TYPES = getFinishingTypes(translations);
  _FURNISHING_TYPES = getFurnishingTypes(translations);
  _PROPERTY_USAGE = getPropertyUsage(translations);
  _PROPERTY_STATUS = getPropertyStatus(translations);
  _PROPERTY_PURPOSE = getPropertyPurpose(translations);
  _PROPERTY_INTENT = getPropertyIntent(translations);
};

// Backward compatibility exports
export const BUILDING_TYPES = _BUILDING_TYPES;
export const VIEW_TYPES = _VIEW_TYPES;
export const FINISHING_TYPES = _FINISHING_TYPES;
export const FURNISHING_TYPES = _FURNISHING_TYPES;
export const PROPERTY_USAGE = _PROPERTY_USAGE;
export const PROPERTY_STATUS = _PROPERTY_STATUS;
export const PROPERTY_PURPOSE = _PROPERTY_PURPOSE;
export const PROPERTY_INTENT = _PROPERTY_INTENT;

// Static view type mapping for backward compatibility
export const getStaticViewTypeMapping = () => ({
  'garden view': 'garden',
  'sea view': 'sea',
  'pool view': 'pool',
  'street view': 'street',
  'city view': 'city',
  'park view': 'park',
  'mountain view': 'mountain',
  'river view': 'river',
  'lagoon view': 'lagoon',
  'golf view': 'golf',
  'open area view': 'open area',
});

export const VIEW_TYPE_MAPPING = getStaticViewTypeMapping();
