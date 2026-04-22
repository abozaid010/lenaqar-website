import { format } from 'date-fns';

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

export const formatDate = (value: any): string | null => {
  if (!isValidDate(value)) return null;
  try {
    return format(new Date(value), 'dd MMM yyyy');
  } catch {
    return null;
  }
};

export const formatDeliveryDate = (value: any): string | null => {
  if (!isValidDate(value)) return null;
  try {
    return format(new Date(value), 'MMMM yyyy');
  } catch {
    return null;
  }
};

export const formatPurpose = (value: any): string | null => {
  if (!isNonEmptyString(value)) return null;
  const purpose = value.toLowerCase().trim();
  const purposeMap: Record<string, string> = {
    'sell': 'For Sale',
    'rent': 'For Rent',
    'sale': 'For Sale',
  };
  return purposeMap[purpose] || purpose.charAt(0).toUpperCase() + purpose.slice(1);
};

export const formatFinishing = (value: any): string | null => {
  if (!isNonEmptyString(value)) return null;
  const finishing = value.toLowerCase().trim();
  const finishingMap: Record<string, string> = {
    'semi finished': 'Semi Finished',
    'fully finished': 'Fully Finished',
    'unfinished': 'Unfinished',
    'semi-finished': 'Semi Finished',
    'fully-finished': 'Fully Finished',
  };
  return finishingMap[finishing] || finishing.charAt(0).toUpperCase() + finishing.slice(1);
};

export const formatFurnishing = (value: any): string | null => {
  if (!isNonEmptyString(value)) return null;
  const furnishing = value.toLowerCase().trim();
  const furnishingMap: Record<string, string> = {
    'furnished': 'Furnished',
    'unfurnished': 'Unfurnished',
    'semi furnished': 'Semi Furnished',
    'semi-furnished': 'Semi Furnished',
  };
  return furnishingMap[furnishing] || furnishing.charAt(0).toUpperCase() + furnishing.slice(1);
};

export const formatBuildingType = (value: any): string | null => {
  if (!isNonEmptyString(value)) return null;
  const type = value.toLowerCase().trim();
  const typeMap: Record<string, string> = {
    'apartment': 'Apartment',
    'villa': 'Villa',
    'townhouse': 'Townhouse',
    'penthouse': 'Penthouse',
    'studio': 'Studio',
    'duplex': 'Duplex',
    'twin house': 'Twin House',
    'chalet': 'Chalet',
    'bungalow': 'Bungalow',
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
  
  if (isNonEmptyString(unit.district)) {
    parts.push(capitalizeWords(unit.district));
  }
  if (isNonEmptyString(unit.city)) {
    parts.push(capitalizeWords(unit.city));
  }
  if (isNonEmptyString(unit.country)) {
    parts.push(capitalizeWords(unit.country));
  }
  
  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * Route building helpers
 */
export const buildProjectHref = (unit: any): string | null => {
  // Use project.en_name for the new project details route
  if (unit.project_en_name) {
    return `/myProjects/${encodeURIComponent(unit.project_en_name)}`;
  }
  
  // Fallback to project name if en_name not available
  if (unit.project) {
    return `/myProjects/${encodeURIComponent(unit.project)}`;
  }
  
  // Fallback to project_ar if project not available
  if (unit.project_ar) {
    return `/myProjects/${encodeURIComponent(unit.project_ar)}`;
  }
  
  return null;
};

export const buildDeveloperHref = (unit: any): string | null => {
  if (!unit.developer_id) return null;
  
  const developerId = unit.developer_id;
  const developerName = unit.developer;
  
  if (developerName) {
    const slug = slugify(developerName);
    return `/developers/${developerId}/${slug}`;
  }
  
  return `/developers/${developerId}`;
};

export const buildUnitHref = (unit: any): string | null => {
  if (!unit.unitId) return null;
  
  const unitId = unit.unitId;
  const unitTitle = unit.unitTitle;
  
  if (unitTitle) {
    const slug = slugify(unitTitle);
    return `/properties/${unitId}/${slug}`;
  }
  
  return `/properties/${unitId}`;
};

/**
 * Installment helpers
 */
export const formatInstallmentYears = (years: any): string | null => {
  if (!isMeaningfulNumber(years)) return null;
  const num = Number(years);
  return num === 1 ? '1 year' : `${num} years`;
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
export const getUnitBadges = (unit: any): string[] => {
  const badges: string[] = [];
  
  if (unit.is_primary) {
    badges.push('Primary Unit');
  }
  
  const purpose = formatPurpose(unit.purpose);
  if (purpose) {
    badges.push(purpose);
  }
  
  const finishing = formatFinishing(unit.finishing);
  if (finishing) {
    badges.push(finishing);
  }
  
  const furnishing = formatFurnishing(unit.furnishing);
  if (furnishing) {
    badges.push(furnishing);
  }
  
  return badges;
};
