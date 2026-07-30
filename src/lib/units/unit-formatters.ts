type TranslationBundle = Record<string, any> | null | undefined;

const getT = (t: TranslationBundle, ...path: string[]): string | null => {
  if (!t) return null;
  let val: any = t;
  for (const k of path) {
    if (val === null || val === undefined || typeof val !== 'object') return null;
    val = val[k];
  }
  return typeof val === 'string' && val.length > 0 ? val : null;
};

/**
 * Validation helpers
 */
export const isNonEmptyString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isMeaningfulNumber = (value: any, options?: { allowZero?: boolean }): boolean => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return false;
  }
  const num = Number(value);
  return options?.allowZero ? num >= 0 : num > 0;
};

export const isValidDate = (value: any): boolean => {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
};

export const hasValidImages = (images: any[]): boolean => {
  return Array.isArray(images) && images.some(img =>
    img && typeof img.url === 'string' && img.url.trim().length > 0
  );
};

/**
 * Formatting helpers
 */
export const formatCurrency = (value: any, currency = 'EGP'): string | null => {
  if (!isMeaningfulNumber(value)) return null;
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace(currency, `${currency} `);
};

export const formatArea = (value: any): string | null => {
  if (!isMeaningfulNumber(value)) return null;
  const num = Number(value);
  return `${num.toLocaleString()} m²`;
};

export const formatDate = (value: any, locale: string = 'en'): string | null => {
  if (!isValidDate(value)) return null;
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return null;
  }
};

export const formatDeliveryDate = (value: any, locale: string = 'en'): string | null => {
  if (!isValidDate(value)) return null;
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return null;
  }
};

export const formatPurpose = (value: any, t?: TranslationBundle): string | null => {
  if (!isNonEmptyString(value)) return null;
  const purpose = value.toLowerCase().trim();
  const translated = getT(t, 'property', 'purpose', purpose);
  if (translated) return translated;
  const purposeMap: Record<string, string> = {
    sell: 'For Sale', rent: 'For Rent', sale: 'For Sale', buy: 'Buy', lease: 'Lease',
  };
  return purposeMap[purpose] || purpose.charAt(0).toUpperCase() + purpose.slice(1);
};

export const formatFinishing = (value: any, t?: TranslationBundle): string | null => {
  if (!isNonEmptyString(value)) return null;
  const finishing = value.toLowerCase().trim();
  const translated = getT(t, 'unitDetails', 'finishingTypes', finishing);
  if (translated) return translated;
  const finishingMap: Record<string, string> = {
    'semi finished': 'Semi Finished', 'fully finished': 'Fully Finished',
    unfinished: 'Unfinished', 'semi-finished': 'Semi Finished',
    'fully-finished': 'Fully Finished', 'core & shell': 'Core & Shell',
    'white box': 'White Box', finished: 'Finished',
  };
  return finishingMap[finishing] || finishing.charAt(0).toUpperCase() + finishing.slice(1);
};

export const formatFurnishing = (value: any, t?: TranslationBundle): string | null => {
  if (!isNonEmptyString(value)) return null;
  const furnishing = value.toLowerCase().trim();
  const translated = getT(t, 'unitDetails', 'furnishingTypes', furnishing);
  if (translated) return translated;
  const furnishingMap: Record<string, string> = {
    furnished: 'Furnished', unfurnished: 'Unfurnished',
    'semi furnished': 'Semi Furnished', 'semi-furnished': 'Semi Furnished',
    'partially furnished': 'Partially Furnished', hotel_furnished: 'Hotel Furnished',
  };
  return furnishingMap[furnishing] || furnishing.charAt(0).toUpperCase() + furnishing.slice(1);
};

export const formatBuildingType = (value: any, t?: TranslationBundle): string | null => {
  if (!isNonEmptyString(value)) return null;
  const type = value.toLowerCase().trim();
  const translated = getT(t, 'buildingTypes', type);
  if (translated) return translated;
  const typeMap: Record<string, string> = {
    apartment: 'Apartment', villa: 'Villa', townhouse: 'Townhouse',
    penthouse: 'Penthouse', studio: 'Studio', duplex: 'Duplex',
    'twin house': 'Twin House', twinhouse: 'Twin House', chalet: 'Chalet', bungalow: 'Bungalow',
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * String utilities
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const capitalizeWords = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Location helpers
 */
export const buildLocationLabel = (unit: any): string | null => {
  const parts: string[] = [];
  if (isNonEmptyString(unit.city)) parts.push(capitalizeWords(unit.city));
  if (isNonEmptyString(unit.district)) parts.push(capitalizeWords(unit.district));
  if (isNonEmptyString(unit.sub_district)) {
    parts.push(capitalizeWords(unit.sub_district));
  }
  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * Route building helpers
 */
export const buildProjectHref = (unit: any): string | null => {
  if (unit.project_en_name) return `/myProjects/${encodeURIComponent(unit.project_en_name)}`;
  if (unit.project) return `/myProjects/${encodeURIComponent(unit.project)}`;
  if (unit.project_ar) return `/myProjects/${encodeURIComponent(unit.project_ar)}`;
  return null;
};

export const buildDeveloperHref = (unit: any): string | null => {
  if (!unit.developer_id) return null;
  const developerId = unit.developer_id;
  const developerName = unit.developer;
  if (developerName) return `/developers/${developerId}/${slugify(developerName)}`;
  return `/developers/${developerId}`;
};

export const buildUnitHref = (unit: any): string | null => {
  const code = unit?.code ?? unit?.referenceCode;
  if (!code || !String(code).trim()) return null;
  const listingClientId =
    (unit?.clientId != null && String(unit.clientId).trim()) ||
    (unit?.client_id != null && String(unit.client_id).trim()) ||
    null;
  const segment = encodeURIComponent(String(code).trim());
  return listingClientId
    ? `/${listingClientId}/units/${segment}`
    : `/allProberties/${segment}`;
};

/**
 * Installment helpers
 */
export const formatInstallmentYears = (years: any, t?: TranslationBundle): string | null => {
  if (!isMeaningfulNumber(years)) return null;
  const num = Number(years);
  const yearLabel = getT(t, 'saleDetails', 'yearLabel') || getT(t, 'projectPage', 'year') || 'yr';
  const yearsLabel = getT(t, 'saleDetails', 'yearsLabel') || getT(t, 'projectPage', 'years') || 'yrs';
  return num === 1 ? `1 ${yearLabel}` : `${num} ${yearsLabel}`;
};

export const calculateMonthlyInstallment = (yearlyAmount: any): string | null => {
  if (!isMeaningfulNumber(yearlyAmount)) return null;
  const yearly = Number(yearlyAmount);
  const monthly = yearly / 12;
  return formatCurrency(monthly);
};

/**
 * Badge helpers
 */
export const getUnitBadges = (unit: any, t?: TranslationBundle): string[] => {
  const badges: string[] = [];
  if (unit.is_primary) {
    badges.push(getT(t, 'unitLabels', 'primaryUnit') || 'Primary Unit');
  }
  const purpose = formatPurpose(unit.purpose, t);
  if (purpose) badges.push(purpose);
  const finishing = formatFinishing(unit.finishing, t);
  if (finishing) badges.push(finishing);
  const furnishing = formatFurnishing(unit.furnishing, t);
  if (furnishing) badges.push(furnishing);
  return badges;
};
