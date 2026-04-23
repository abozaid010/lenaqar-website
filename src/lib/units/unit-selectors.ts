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
  capitalizeWords
} from './unit-formatters';
import { generateUnitSlug } from './unit-url-utils';
import type { RawUnit, UnitViewModel, QuickFact, SpecItem, TrustItem } from './unit-types';

/**
 * Transform raw unit data into normalized view model
 */
export const transformUnitToViewModel = (rawUnit: RawUnit): UnitViewModel => {
  // Basic info
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

  // Location
  const locationLabel = buildLocationLabel(rawUnit);

  // Images
  const heroImages = hasValidImages(rawUnit.images) 
    ? rawUnit.images
        .filter(img => img && isNonEmptyString(img.url))
        .map(img => ({
          url: img.url,
          alt: title || projectName || 'Property image'
        }))
    : [];

  // Badges
  const badges = getUnitBadges(rawUnit);

  // Pricing
  const totalPrice = formatCurrency(rawUnit.totalPrice);
  const downPayment = formatCurrency(rawUnit.downPayment);
  const yearlyInstallment = formatCurrency(rawUnit.installment_amount_yearly);
  const monthlyInstallmentEstimate = calculateMonthlyInstallment(rawUnit.installment_amount_yearly);
  const installmentYearsLabel = formatInstallmentYears(rawUnit.installment_years);

  // Dates
  const deliveryDateLabel = formatDeliveryDate(rawUnit.deliveryDate);

  // Property details
  const purpose = formatPurpose(rawUnit.purpose);
  const buildingType = formatBuildingType(rawUnit.buildingType);
  const finishing = formatFinishing(rawUnit.finishing);
  const furnishing = formatFurnishing(rawUnit.furnishing);

  // Navigation
  const projectHref = buildProjectHref(rawUnit);
  const developerHref = buildDeveloperHref(rawUnit);

  // Quick facts
  const quickFacts = getQuickFacts(rawUnit);

  // Specifications
  const specs = getUnitSpecs(rawUnit);

  // Trust items
  const trustItems = getTrustItems(rawUnit);

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
    developerPhone: null, // These would come from contact info API
    developerWhatsapp: null,
    ownerName: null, // These would come from unit data
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
export const getQuickFacts = (unit: RawUnit): QuickFact[] => {
  const facts: QuickFact[] = [];

  // Bedrooms
  if (isMeaningfulNumber(unit.roomsCount)) {
    facts.push({
      label: 'Bedrooms',
      value: unit.roomsCount === 1 ? '1 Bedroom' : `${unit.roomsCount} Bedrooms`,
      icon: 'bed'
    });
  }

  // Bathrooms
  if (isMeaningfulNumber(unit.bathroomCount)) {
    facts.push({
      label: 'Bathrooms',
      value: unit.bathroomCount === 1 ? '1 Bathroom' : `${unit.bathroomCount} Bathrooms`,
      icon: 'bath'
    });
  }

  // Area
  const area = formatArea(unit.landArea);
  if (area) {
    facts.push({
      label: 'Area',
      value: area,
      icon: 'maximize'
    });
  }

  // Garden size (only if meaningful)
  if (isMeaningfulNumber(unit.gardenSize)) {
    facts.push({
      label: 'Garden',
      value: formatArea(unit.gardenSize),
      icon: 'trees'
    });
  }

  // Roof area (only if meaningful)
  if (isMeaningfulNumber(unit.roof_area)) {
    facts.push({
      label: 'Roof Area',
      value: formatArea(unit.roof_area),
      icon: 'home'
    });
  }

  // Garage area (only if meaningful)
  if (isMeaningfulNumber(unit.garageArea)) {
    facts.push({
      label: 'Garage',
      value: formatArea(unit.garageArea),
      icon: 'car'
    });
  }

  // Delivery date
  const deliveryDate = formatDeliveryDate(unit.deliveryDate);
  if (deliveryDate) {
    facts.push({
      label: 'Delivery',
      value: deliveryDate,
      icon: 'calendar'
    });
  }

  return facts;
};

/**
 * Get detailed specifications for the unit
 */
export const getUnitSpecs = (unit: RawUnit): SpecItem[] => {
  const specs: SpecItem[] = [];

  // Building type
  const buildingType = formatBuildingType(unit.buildingType);
  if (buildingType) {
    specs.push({ label: 'Property Type', value: buildingType });
  }

  // Purpose
  const purpose = formatPurpose(unit.purpose);
  if (purpose) {
    specs.push({ label: 'Purpose', value: purpose });
  }

  // Bedrooms
  if (isMeaningfulNumber(unit.roomsCount)) {
    specs.push({ 
      label: 'Bedrooms', 
      value: unit.roomsCount === 1 ? '1 Bedroom' : `${unit.roomsCount} Bedrooms` 
    });
  }

  // Bathrooms
  if (isMeaningfulNumber(unit.bathroomCount)) {
    specs.push({ 
      label: 'Bathrooms', 
      value: unit.bathroomCount === 1 ? '1 Bathroom' : `${unit.bathroomCount} Bathrooms` 
    });
  }

  // Land area
  const landArea = formatArea(unit.landArea);
  if (landArea) {
    specs.push({ label: 'Land Area', value: landArea });
  }

  // Garden size
  if (isMeaningfulNumber(unit.gardenSize)) {
    specs.push({ label: 'Garden Size', value: formatArea(unit.gardenSize) });
  }

  // Roof area
  if (isMeaningfulNumber(unit.roof_area)) {
    specs.push({ label: 'Roof Area', value: formatArea(unit.roof_area) });
  }

  // Garage area
  if (isMeaningfulNumber(unit.garageArea)) {
    specs.push({ label: 'Garage Area', value: formatArea(unit.garageArea) });
  }

  // Finishing
  const finishing = formatFinishing(unit.finishing);
  if (finishing) {
    specs.push({ label: 'Finishing', value: finishing });
  }

  // Furnishing
  const furnishing = formatFurnishing(unit.furnishing);
  if (furnishing) {
    specs.push({ label: 'Furnishing', value: furnishing });
  }

  // Delivery date
  const deliveryDate = formatDeliveryDate(unit.deliveryDate);
  if (deliveryDate) {
    specs.push({ label: 'Delivery Date', value: deliveryDate });
  }

  // Phase
  if (isNonEmptyString(unit.phase)) {
    specs.push({ label: 'Phase', value: capitalizeWords(unit.phase) });
  }

  // Reference code
  if (isNonEmptyString(unit.code)) {
    specs.push({ label: 'Reference Code', value: unit.code });
  }

  return specs;
};

/**
 * Get trust/metadata items for the unit
 */
export const getTrustItems = (unit: RawUnit): TrustItem[] => {
  const items: TrustItem[] = [];

  // Reference code
  if (isNonEmptyString(unit.code)) {
    items.push({ label: 'Reference Code', value: unit.code });
  }

  // Last updated
  if (isValidDate(unit.updatedAt)) {
    items.push({ 
      label: 'Last Updated', 
      value: formatDate(unit.updatedAt) || 'Unknown' 
    });
  }

  // Data source (only if meaningful)
  if (isNonEmptyString(unit.dataSource) && unit.dataSource !== 'import_v2') {
    items.push({ 
      label: 'Source', 
      value: capitalizeWords(unit.dataSource.replace('_', ' ')) 
    });
  }

  return items;
};

/**
 * Get pricing items for display
 */
export const getPricingItems = (unit: RawUnit) => {
  const items: any[] = [];

  // Total price
  const totalPrice = formatCurrency(unit.totalPrice);
  if (totalPrice) {
    items.push({ label: 'Total Price', value: totalPrice, highlight: true });
  }

  // Down payment
  const downPayment = formatCurrency(unit.downPayment);
  if (downPayment) {
    items.push({ label: 'Down Payment', value: downPayment });
  }

  // Installment years
  const installmentYears = formatInstallmentYears(unit.installment_years);
  if (installmentYears) {
    items.push({ label: 'Installment Period', value: installmentYears });
  }

  // Yearly installment
  const yearlyInstallment = formatCurrency(unit.installment_amount_yearly);
  if (yearlyInstallment) {
    items.push({ label: 'Yearly Installment', value: yearlyInstallment });
  }

  // Monthly estimate
  const monthlyEstimate = calculateMonthlyInstallment(unit.installment_amount_yearly);
  if (monthlyEstimate) {
    items.push({ label: 'Monthly (Est.)', value: monthlyEstimate, note: 'Estimated' });
  }

  return items;
};

/**
 * Check if unit has meaningful pricing information
 */
export const hasPricingInfo = (unit: RawUnit): boolean => {
  return isMeaningfulNumber(unit.totalPrice) || 
         isMeaningfulNumber(unit.downPayment) || 
         isMeaningfulNumber(unit.installment_amount_yearly);
};

/**
 * Check if unit has meaningful specifications
 */
export const hasSpecsInfo = (unit: RawUnit): boolean => {
  return getUnitSpecs(unit).length > 0;
};

/**
 * Check if unit has meaningful quick facts
 */
export const hasQuickFacts = (unit: RawUnit): boolean => {
  return getQuickFacts(unit).length > 0;
};

/**
 * Generate fallback unit title
 */
export const generateFallbackTitle = (unit: RawUnit): string => {
  const parts: string[] = [];

  // Building type
  const buildingType = formatBuildingType(unit.buildingType);
  if (buildingType) {
    parts.push(buildingType);
  }

  // Rooms
  if (isMeaningfulNumber(unit.roomsCount)) {
    parts.push(unit.roomsCount === 1 ? '1BR' : `${unit.roomsCount}BR`);
  }

  // Project name
  if (isNonEmptyString(unit.project)) {
    parts.push(`in ${unit.project}`);
  } else if (isNonEmptyString(unit.project_ar)) {
    parts.push(`in ${unit.project_ar}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Property Details';
};
