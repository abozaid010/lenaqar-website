/**
 * Central i18n keys for unit add/edit client-side validation.
 * All user-facing copy lives in public/locales/{en,ar}.js under unitFormValidation.
 */
export const UNIT_FORM_VALIDATION_KEYS = {
  requiredFields: "unitFormValidation.requiredFields",
  invalidNumber: "unitFormValidation.invalidNumber",
  fieldRequired: "unitFormValidation.fieldRequired",

  // Location
  locationRequired: "unitFormValidation.locationRequired",
  locationSelectDistrict: "unitFormValidation.locationSelectDistrict",
  locationSelectSubdistrict: "unitFormValidation.locationSelectSubdistrict",
  locationSelectDeepest: "unitFormValidation.locationSelectDeepest",

  // Sale pricing
  totalPriceRequired: "unitFormValidation.totalPriceRequired",
  downPaymentRequiredInstallments:
    "unitFormValidation.downPaymentRequiredInstallments",
  remainingAmountRequiredInstallments:
    "unitFormValidation.remainingAmountRequiredInstallments",
  installmentYearsRequiredInstallments:
    "unitFormValidation.installmentYearsRequiredInstallments",

  // Delivery
  deliveryDateRequired: "unitFormValidation.deliveryDateRequired",
  deliveryDateRange: "unitFormValidation.deliveryDateRange",

  // Rent
  monthlyRentRequired: "unitFormValidation.monthlyRentRequired",

  // Basic details
  buildingTypeRequired: "unitFormValidation.buildingTypeRequired",
  purposeRequired: "unitFormValidation.purposeRequired",
  landAreaRequired: "unitFormValidation.landAreaRequired",
  roomsRequired: "unitFormValidation.roomsRequired",
  bathroomsRequired: "unitFormValidation.bathroomsRequired",

  // Images step
  finishingRequired: "unitFormValidation.finishingRequired",
  furnishingRequired: "unitFormValidation.furnishingRequired",

  // Owner
  ownerMobileRequired: "unitFormValidation.ownerMobileRequired",
  ownerMobileInvalid: "unitFormValidation.ownerMobileInvalid",

  // Save
  saveFailed: "unitFormValidation.saveFailed",
};

/** Map form field name → default required-message key. */
export const UNIT_FORM_FIELD_REQUIRED_KEYS = {
  buildingType: UNIT_FORM_VALIDATION_KEYS.buildingTypeRequired,
  purpose: UNIT_FORM_VALIDATION_KEYS.purposeRequired,
  landArea: UNIT_FORM_VALIDATION_KEYS.landAreaRequired,
  roomsCount: UNIT_FORM_VALIDATION_KEYS.roomsRequired,
  bathroomCount: UNIT_FORM_VALIDATION_KEYS.bathroomsRequired,
  finishing: UNIT_FORM_VALIDATION_KEYS.finishingRequired,
  furnishing: UNIT_FORM_VALIDATION_KEYS.furnishingRequired,
  unit_location: UNIT_FORM_VALIDATION_KEYS.locationRequired,
  project: UNIT_FORM_VALIDATION_KEYS.locationRequired,
  totalPrice: UNIT_FORM_VALIDATION_KEYS.totalPriceRequired,
  deliveryDate: UNIT_FORM_VALIDATION_KEYS.deliveryDateRequired,
  monthlyRentPrice: UNIT_FORM_VALIDATION_KEYS.monthlyRentRequired,
  owner_mobile: UNIT_FORM_VALIDATION_KEYS.ownerMobileRequired,
};

/**
 * Resolve a validation key to a localized string via the app translate fn.
 * @param {(key: string, fallback?: string|null) => string} translate
 * @param {string} key
 */
export function tValidation(translate, key) {
  if (!key || typeof translate !== "function") return "";
  return translate(key, null);
}
