import {
  isNonEmptyString,
  isMeaningfulNumber,
  isValidDate,
  hasValidImages,
  formatCurrency,
  formatArea,
  formatDate,
  formatDeliveryDate,
  formatPurpose,
  formatFinishing,
  formatFurnishing,
  formatBuildingType,
  buildLocationLabel,
  buildProjectHref,
  buildDeveloperHref,
  formatInstallmentYears,
  calculateMonthlyInstallment,
  getUnitBadges,
  capitalizeWords,
} from './unit-formatters';
import { generateUnitSlug } from './unit-url-utils';
import type { RawUnit, UnitViewModel, QuickFact, SpecItem, TrustItem } from './unit-types';

type T = Record<string, any> | null | undefined;

const getT = (t: T, ...path: string[]): string | null => {
  if (!t) return null;
  let val: any = t;
  for (const k of path) {
    if (val === null || val === undefined || typeof val !== 'object') return null;
    val = val[k];
  }
  return typeof val === 'string' && val.length > 0 ? val : null;
};

/**
 * Transform raw unit data into normalized view model
 */
export const transformUnitToViewModel = (rawUnit: RawUnit, t?: T, locale: string = 'en'): UnitViewModel => {
  const id = rawUnit.unitId;
  const title = isNonEmptyString(rawUnit.unitTitle) ? rawUnit.unitTitle : null;
  const projectName = isNonEmptyString(rawUnit.project) ? rawUnit.project : null;
  const projectNameAr = isNonEmptyString(rawUnit.project_ar) ? rawUnit.project_ar : null;
  const developerName = isNonEmptyString(rawUnit.developer) ? rawUnit.developer : null;
  const projectId = isNonEmptyString(rawUnit.project_id) ? rawUnit.project_id : null;
  const developerId = isNonEmptyString(rawUnit.developer_id) ? rawUnit.developer_id : null;
  const referenceCode = isNonEmptyString(rawUnit.code) ? rawUnit.code : null;
  const phase = isNonEmptyString(rawUnit.phase) ? rawUnit.phase : null;
  const isPrimary = Boolean(rawUnit.is_primary);

  const locationLabel = buildLocationLabel(rawUnit);

  const heroImages = hasValidImages(rawUnit.images)
    ? rawUnit.images
        .filter(img => img && isNonEmptyString(img.url))
        .map(img => ({
          url: img.url,
          alt: title || projectName || 'Property image',
        }))
    : [];

  const badges = getUnitBadges(rawUnit, t);
  const totalPrice = formatCurrency(rawUnit.totalPrice);
  const downPayment = formatCurrency(rawUnit.downPayment);
  const yearlyInstallment = formatCurrency(rawUnit.installment_amount_yearly);
  const monthlyInstallmentEstimate = calculateMonthlyInstallment(rawUnit.installment_amount_yearly);
  const installmentYearsLabel = formatInstallmentYears(rawUnit.installment_years, t);
  const deliveryDateLabel = formatDeliveryDate(rawUnit.deliveryDate, locale);
  const purpose = formatPurpose(rawUnit.purpose, t);
  const buildingType = formatBuildingType(rawUnit.buildingType, t);
  const finishing = formatFinishing(rawUnit.finishing, t);
  const furnishing = formatFurnishing(rawUnit.furnishing, t);
  const projectHref = buildProjectHref(rawUnit);
  const developerHref = buildDeveloperHref(rawUnit);
  const quickFacts = getQuickFacts(rawUnit, t, locale);
  const specs = getUnitSpecs(rawUnit, t, locale);
  const trustItems = getTrustItems(rawUnit, t, locale);

  return {
    id,
    title,
    projectName,
    projectNameAr,
    developerName,
    projectId,
    developerId,
    projectHref,
    developerHref,
    developerPhone: null,
    developerWhatsapp: null,
    ownerName: null,
    ownerMobile: null,
    ownerWhatsapp: null,
    clientId: rawUnit.clientId || null,
    locationLabel,
    heroImages,
    badges,
    totalPrice,
    downPayment,
    yearlyInstallment,
    monthlyInstallmentEstimate,
    installmentYearsLabel,
    deliveryDateLabel,
    referenceCode,
    quickFacts,
    specs,
    trustItems,
    purpose,
    buildingType,
    finishing,
    furnishing,
    phase,
    isPrimary,
  };
};

/**
 * Get quick facts for the unit
 */
export const getQuickFacts = (unit: RawUnit, t?: T, locale: string = 'en'): QuickFact[] => {
  const facts: QuickFact[] = [];

  if (isMeaningfulNumber(unit.roomsCount)) {
    const label = getT(t, 'unitLabels', 'bedrooms') || 'Bedrooms';
    facts.push({ key: 'bedrooms', label, value: `${unit.roomsCount} ${label}`, icon: 'bed' });
  }

  if (isMeaningfulNumber(unit.bathroomCount)) {
    const label = getT(t, 'unitLabels', 'bathrooms') || 'Bathrooms';
    facts.push({ key: 'bathrooms', label, value: `${unit.bathroomCount} ${label}`, icon: 'bath' });
  }

  const area = formatArea(unit.landArea);
  if (area) {
    facts.push({ key: 'area', label: getT(t, 'unitLabels', 'area') || 'Area', value: area, icon: 'maximize' });
  }

  if (isMeaningfulNumber(unit.gardenSize)) {
    facts.push({ key: 'garden', label: getT(t, 'unitLabels', 'garden') || 'Garden', value: formatArea(unit.gardenSize) as string, icon: 'trees' });
  }

  if (isMeaningfulNumber(unit.roof_area)) {
    facts.push({ key: 'roofArea', label: getT(t, 'unitLabels', 'roofArea') || 'Roof Area', value: formatArea(unit.roof_area) as string, icon: 'home' });
  }

  if (isMeaningfulNumber(unit.garageArea)) {
    facts.push({ key: 'garage', label: getT(t, 'unitLabels', 'garage') || 'Garage', value: formatArea(unit.garageArea) as string, icon: 'car' });
  }

  const deliveryDate = formatDeliveryDate(unit.deliveryDate, locale);
  if (deliveryDate) {
    facts.push({ key: 'delivery', label: getT(t, 'unitDetails', 'deliveryDate') || 'Delivery', value: deliveryDate, icon: 'calendar' });
  }

  return facts;
};

/**
 * Get detailed specifications for the unit
 */
export const getUnitSpecs = (unit: RawUnit, t?: T, locale: string = 'en'): SpecItem[] => {
  const specs: SpecItem[] = [];

  const buildingType = formatBuildingType(unit.buildingType, t);
  if (buildingType) {
    specs.push({ key: 'propertyType', label: getT(t, 'unitHeader', 'propertyType') || 'Property Type', value: buildingType });
  }

  const purpose = formatPurpose(unit.purpose, t);
  if (purpose) {
    specs.push({ key: 'purpose', label: getT(t, 'unitDetails', 'purpose') || 'Purpose', value: purpose });
  }

  if (isMeaningfulNumber(unit.roomsCount)) {
    const label = getT(t, 'unitLabels', 'bedrooms') || 'Bedrooms';
    specs.push({ key: 'bedrooms', label, value: unit.roomsCount === 1 ? `1 ${label}` : `${unit.roomsCount} ${label}` });
  }

  if (isMeaningfulNumber(unit.bathroomCount)) {
    const label = getT(t, 'unitLabels', 'bathrooms') || 'Bathrooms';
    specs.push({ key: 'bathrooms', label, value: unit.bathroomCount === 1 ? `1 ${label}` : `${unit.bathroomCount} ${label}` });
  }

  const landArea = formatArea(unit.landArea);
  if (landArea) {
    specs.push({ key: 'landArea', label: getT(t, 'unitDetails', 'landArea') || 'Land Area', value: landArea });
  }

  if (isMeaningfulNumber(unit.gardenSize)) {
    specs.push({ key: 'gardenSize', label: getT(t, 'basicDetails', 'gardenSize') || 'Garden Size', value: formatArea(unit.gardenSize) as string });
  }

  if (isMeaningfulNumber(unit.roof_area)) {
    specs.push({ key: 'roofArea', label: getT(t, 'unitLabels', 'roofArea') || 'Roof Area', value: formatArea(unit.roof_area) as string });
  }

  if (isMeaningfulNumber(unit.garageArea)) {
    specs.push({ key: 'garageArea', label: getT(t, 'basicDetails', 'garageArea') || 'Garage Area', value: formatArea(unit.garageArea) as string });
  }

  const finishing = formatFinishing(unit.finishing, t);
  if (finishing) {
    specs.push({ key: 'finishing', label: getT(t, 'unitDetails', 'finishing') || 'Finishing', value: finishing });
  }

  const furnishing = formatFurnishing(unit.furnishing, t);
  if (furnishing) {
    specs.push({ key: 'furnishing', label: getT(t, 'unitDetails', 'furnishing') || 'Furnishing', value: furnishing });
  }

  const deliveryDate = formatDeliveryDate(unit.deliveryDate, locale);
  if (deliveryDate) {
    specs.push({ key: 'deliveryDate', label: getT(t, 'unitDetails', 'deliveryDate') || 'Delivery Date', value: deliveryDate });
  }

  if (isNonEmptyString(unit.phase)) {
    specs.push({ key: 'phase', label: getT(t, 'unitLabels', 'phase') || 'Phase', value: capitalizeWords(unit.phase) });
  }

  if (isNonEmptyString(unit.code)) {
    specs.push({ key: 'referenceCode', label: getT(t, 'unitLabels', 'referenceCode') || 'Reference Code', value: unit.code });
  }

  return specs;
};

/**
 * Get trust/metadata items for the unit
 */
export const getTrustItems = (unit: RawUnit, t?: T, locale: string = 'en'): TrustItem[] => {
  const items: TrustItem[] = [];

  if (isNonEmptyString(unit.code)) {
    items.push({ key: 'referenceCode', label: getT(t, 'unitLabels', 'referenceCode') || 'Reference Code', value: unit.code });
  }

  if (isValidDate(unit.updatedAt)) {
    items.push({
      key: 'lastUpdated',
      label: getT(t, 'unitLabels', 'lastUpdated') || 'Last Updated',
      value: formatDate(unit.updatedAt, locale) || '',
    });
  }

  if (isNonEmptyString(unit.dataSource) && unit.dataSource !== 'import_v2') {
    items.push({
      key: 'source',
      label: getT(t, 'unitLabels', 'source') || 'Source',
      value: capitalizeWords(unit.dataSource.replace('_', ' ')),
    });
  }

  return items;
};

/**
 * Get pricing items for display
 */
export const getPricingItems = (unit: RawUnit) => {
  const items: any[] = [];

  const totalPrice = formatCurrency(unit.totalPrice);
  if (totalPrice) items.push({ label: 'Total Price', value: totalPrice, highlight: true });

  const downPayment = formatCurrency(unit.downPayment);
  if (downPayment) items.push({ label: 'Down Payment', value: downPayment });

  const installmentYears = formatInstallmentYears(unit.installment_years);
  if (installmentYears) items.push({ label: 'Installment Period', value: installmentYears });

  const yearlyInstallment = formatCurrency(unit.installment_amount_yearly);
  if (yearlyInstallment) items.push({ label: 'Yearly Installment', value: yearlyInstallment });

  const monthlyEstimate = calculateMonthlyInstallment(unit.installment_amount_yearly);
  if (monthlyEstimate) items.push({ label: 'Monthly (Est.)', value: monthlyEstimate, note: 'Estimated' });

  return items;
};

export const hasPricingInfo = (unit: RawUnit): boolean => {
  return isMeaningfulNumber(unit.totalPrice) ||
    isMeaningfulNumber(unit.downPayment) ||
    isMeaningfulNumber(unit.installment_amount_yearly);
};

export const hasSpecsInfo = (unit: RawUnit): boolean => getUnitSpecs(unit).length > 0;
export const hasQuickFacts = (unit: RawUnit): boolean => getQuickFacts(unit).length > 0;

/**
 * Generate fallback unit title (locale-unaware, used for SEO only)
 */
export const generateFallbackTitle = (unit: RawUnit): string => {
  const parts: string[] = [];
  const buildingType = formatBuildingType(unit.buildingType);
  if (buildingType) parts.push(buildingType);
  if (isMeaningfulNumber(unit.roomsCount)) {
    parts.push(unit.roomsCount === 1 ? '1BR' : `${unit.roomsCount}BR`);
  }
  if (isNonEmptyString(unit.project)) parts.push(`in ${unit.project}`);
  else if (isNonEmptyString(unit.project_ar)) parts.push(`in ${unit.project_ar}`);
  return parts.length > 0 ? parts.join(' ') : 'Property Details';
};
