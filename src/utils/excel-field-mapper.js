/**
 * Excel Field Mapper
 * 
 * Provides flexible column name matching for Excel uploads.
 * Maps various header name variations to canonical field keys.
 */

import Fuse from 'fuse.js';
import {
  BUILDING_TYPE_VALUES,
  FINISHING_TYPE_VALUES,
  VIEW_TYPE_VALUES,
  FURNISHING_TYPE_VALUES,
  MIN_LAND_AREA,
} from '@/data/constants';

// Required field keys that MUST be present for unit uploads
// Only these fields will be validated as required during upload
export const VALIDATED_KEYS = [
  "buildingType",
  "project",
  "roomsCount",
  "landArea",
  "totalPrice",
];

// Field aliases mapping - maps canonical keys to possible header variations
export const FIELD_ALIASES = {
  buildingType: [
    "building type",
    "building-type",
    "buildingtype",
    "property type",
    "property-type",
    "propertytype",
    "usage type",
    "usage-type",
    "usagetype",
    "unit type", //Tatweer Misr
    "unittype",
    "unit-type",
  ],
  project: [
    "project",
    "Project: Project Name", //Tatweer Misr
    "project name",
    "project-name",
    "projectname",
    "Project ID"
  ],
  view: [
    "view",
    "views",
    "outlook",
    "facing",
    "direction",
    "orientation",
  ],
  unitTitle: [
    "unit title",
    "unit-title",
    "unittitle",
    "unit name",
    "unit-name",
    "unitname",
    "Building: Building Name", //Tatweer Misr
    "description",
  ],
  bathroomCount: [
    "bathroom count",
    "bathroom-count",
    "bathroomcount",
    "bathrooms",
    "bathroom",
    "bath room count",
    "bath-room-count",
    "bathroom number",
    "bathroom-number",
    "bathroomnumber",
    "bath count",
    "bath-count",
    "bathcount",
    "number of bathrooms",
    "no. of bathrooms"
  ],
  floor: [
    "floor",
    "floor number", //Tatweer Misr
    "floor-number",
    "floornumber",
    "floors",
    "level",
    "levels",
  ],
  roomsCount: [
    "rooms count",
    "rooms-count",
    "roomscount",
    "rooms",
    "room count",
    "room-count",
    "roomcount",
    "bedrooms",
    "bedroom count",
    "bedroom-count",
    "bedroomcount",
    "bedroom",
    "bed rooms",
    "bed-rooms",
    "bedrooms count",
    "number of bedrooms",//SODIC
    "no. of bedrooms",
    "number of rooms", //Tatweer Misr
    "no. of rooms"
  ],
  landArea: [
    "Built up Area (BUA)",
    "Gross Area",
    "Unit Gross Area",
    "land area",
    "land-area",
    "landarea",
    "bua",
    "Built Area (Pricing Structure)", // Palm Hills
    // "Land Area (Pricing Structure)", // Palm Hills (with correct spacing)
    "BUA (SQM)", // Tatweer Misr
    "land size",
    "land-size",
    "landsize",
    "plot area",
    "plot-area",
    "plotarea",
    "lot area",
    "lot-area",
    "lotarea",
  ],
  gardenSize: [
    "garden size",
    "garden-size",
    "gardensize",
    "garden",
    "garden area",
    "garden-area",
    "garden area (m²)",
    "garden-area (sq.m²)",
    "garden area (sq.m)",
"Garden / Outdoor Area (Pricing Structure)",//Palm Hills
    "gardenarea",
    "yard size",
    "yard-size",
    "yardsize",
    "yard area",
    "yard-area",
    "yardarea",
  ],
  finishing: [
    "finishing",
    "finish",
    "finish type",
    "finish-type",
    "finishtype",
    "finishing type",
    "finishing-type",
    "finishingtype",
    "condition",
    "Finishing Specs",
  ],
  furnishing: [
    "furnishing",
    "furnish",
    "furnished",
    "furniture",
    "furnishing status",
    "furnishing-status",
    "furnishingstatus",
  ],
  garageArea: [
    "garage area",
    "garage-area",
    "garagearea",
    "garage",
    "garage size",
    "garage-size",
    "garagesize",
    "parking area",
    "parking-area",
    "parkingarea",
    "parking",
    "parking size",
    "parking-size",
    "parkingsize",
  ],
  model: [
    "model",
    "models",
    "unit model",
    "unit-model",
    "unitmodel",
    "design name",
    "design type",
    "designname",
  ],
  downPayment: [
    "down payment",
    "down-payment",
    "downpayment",
    "down payment amount",
    "down-payment-amount",
    "downpaymentamount",
    "initial payment",
    "initial-payment",
    "initialpayment",
    "deposit",
    "advance payment",
    "advance-payment",
    "advancepayment",
  ],
  totalPrice: [
    "Unit Total with Finishing Price",
    "Final Total Unit Price",
    "total price",
    "total-price",
    "totalprice",
    "unit price",
    "unit-price",
    "unitprice",
    "total cost",
    "total-cost",
    "totalcost",
    "Nominal Price",
    "price",
  ],
  deliveryDate: [
    "estimated delivery date", //SODIC
    "Delivery Date \ Y",// Tatweer Misr
    "delivery date",
    "delivery-date",
    "deliverydate",
    "handover date",
    "handover-date",
    "handoverdate",
    "completion date",
    "completion-date",
    "completiondate",
    "ready date",
    "ready-date",
    "readydate",
    "eta"
  ],
  phase: [
    "phase",
    "Phase: Phase Name", //Tatweer Misr
    "phase name",
    "phase-name",
    "phasename",
    "project phase",
    "project-phase",
    "projectphase",
    "stage",// palm hills
  ],
  city: [
    "city",
    "city name",
    "city-name",
    "cityname",
    "district",
  ],
  unit_number: [
    "unit number",
    "unit-number",
    "unitnumber",
    "unit no",
    "unit-no",
    "unitno",
    "unit no.",
    "unit #",
  ],
  building_number: [
    "Building Name",//SODIC
    "building number",
    "building-number",
    "buildingnumber",
    "building no",
    "building-no",
    "buildingno",
    "building no.",
    "building #",
    "bldg no",
    "bldg number",
  ],
  roof_area: [
    "Open Roof Deck",//SODIC
    " Roof Area  (Pricing Structure)", // Palm Hills
    "roof area",
    "roof-area",
    "roofarea",
    "roof",
    "roof size",
    "roof-size",
    "roofsize",
    "terrace area",
    "terrace-area",
    "terracearea",
    "terrace",
  ],
  outdoor_area: [
    "outdoor area",
    "outdoor-area",
    "outdoor_area",
    "outdoor",
    "outdoor space",
    "outdoor-space",
    "outdoorspace",
    "outdoor living area",
    "outdoor-living-area",
    "outdoor living area",
    "patio area",
    "patio-area",
    "patioarea",
    "patio",
    "deck area",
    "deck-area",
    "deckarea",
    "deck",
  ],
  payment_plan: [
    "payment plan",
    "payment-plan",
    "paymentplan",
    "payment method",
    "payment-method",
    "paymentmethod",
    "payment type",
    "payment-type",
    "paymenttype",
    "installment plan",
    "installment-plan",
    "installmentplan",
    "payment scheme",
    "payment-scheme",
    "paymentscheme",
  ],
};

// Word to number mapping for roomsCount validation
const WORD_TO_NUMBER = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
};

/**
 * Validates if a value is a valid number (integer or float), including zero.
 * Accepts zero, positive numbers, decimals, and can handle formatted numbers (e.g., "1,000.50")
 */
function isValidNumber(value) {
  if (value === null || value === undefined || value === '') return false;
  
  // Handle string values - remove common formatting characters
  let numStr = String(value).trim();
  
  // Remove commas and spaces (common number formatting)
  numStr = numStr.replace(/[, ]/g, '');
  
  // Check if it's a valid number (including decimals, negative, scientific notation)
  const parsed = parseFloat(numStr);
  if (!isNaN(numStr) && !isNaN(parsed) && isFinite(parsed)) {
    return true; // Explicitly accept zero and all valid numbers
  }
  return false;
}

/**
 * Validates if a value is a valid integer >= 0 or word number (bedrooms/rooms count)
 */
function isValidRoomsCount(value) {
  if (value === null || value === undefined || value === '') return false;
  
  const str = String(value).toLowerCase().trim();
  
  // Check if it's a valid non-negative integer
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return num >= 0 && num <= 15; // Reasonable range for rooms (0-15)
  }
  
  // Check if it's a word number (case-insensitive)
  return WORD_TO_NUMBER.hasOwnProperty(str);
}

/**
 * Validates if a value is a valid date string
 */
function isValidDate(value) {
  if (value === null || value === undefined || value === '') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates if a value is a non-empty string
 */
function isValidString(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

/**
 * Validates project field: non-empty string with length > 2 characters
 */
function isValidProjectString(value) {
  if (value === null || value === undefined) return false;
  const trimmed = String(value).trim();
  return trimmed.length > 2;
}

/**
 * Validates floor: zero (0), or "V" / "G" / "Ground" (case-insensitive), or any valid number
 */
function isValidFloor(value) {
  if (value === null || value === undefined || value === '') return false;
  const str = String(value).trim().toLowerCase();
  if (str === '0') return true;
  if (['v', 'g', 'ground'].includes(str)) return true;
  return isValidNumber(value);
}

/**
 * Validates land area: valid number strictly greater than 9
 */
function isValidLandArea(value) {
  if (value === null || value === undefined || value === '') return false;
  let numStr = String(value).trim().replace(/[, ]/g, '');
  const parsed = parseFloat(numStr);
  return !isNaN(numStr) && !isNaN(parsed) && isFinite(parsed) && parsed > MIN_LAND_AREA;
}

// Extended finishing values (including "finished" and "not finished")
const EXTENDED_FINISHING_VALUES = [
  ...FINISHING_TYPE_VALUES,
  'finished',
  'not finished',
  'unfinished'
];

// Mapping of canonical keys to validation rules
// Can be an array of expected values OR a validator function
const EXPECTED_VALUES_MAP = {
  // Required fields
  buildingType: BUILDING_TYPE_VALUES, // Unit type: must match at least 0.6 with one of BUILDING_TYPE_VALUES
  project: isValidProjectString, // Function - string length > 2
  roomsCount: isValidRoomsCount, // Function - integer >= 0 or word number
  landArea: isValidLandArea, // Function - valid number > 159
  totalPrice: isValidNumber, // Function - any valid number
  deliveryDate: isValidDate, // Function - any valid date
  
  // Optional fields with validation
  finishing: EXTENDED_FINISHING_VALUES, // Array - uses matches_values with extended values
  view: VIEW_TYPE_VALUES, // Array - uses matches_values
  furnishing: FURNISHING_TYPE_VALUES, // Array - uses matches_values
  bathroomCount: isValidRoomsCount, // Function - integer or word number (similar to roomsCount)
  floor: isValidFloor, // Function - 0, "V", "G", "Ground", or any valid number
  gardenSize: isValidNumber, // Function - any valid number
  garageArea: isValidNumber, // Function - any valid number
  roof_area: isValidNumber, // Function - any valid number
  downPayment: isValidNumber, // Function - any valid number
  outdoor_area: isValidNumber, // Function - any valid number
  
  // Optional fields without strict validation (accept any string)
  phase: isValidString, // Function - any valid string
  unitTitle: isValidString, // Function - any valid string
  model: isValidString, // Function - any valid string
  city: isValidString, // Function - any valid string
  unit_number: isValidString, // Function - any valid string (can be alphanumeric)
  building_number: isValidString, // Function - any valid string (can be alphanumeric)
  payment_plan: isValidString, // Function - any valid string
};

// Semantic matching removed for performance optimization
// The ML model (@xenova/transformers) was blocking the main thread
// We now rely on exact matching + fuzzy matching (Fuse.js) only

/**
 * Modular matching method for values
 * Strategy: Exact match → Fuzzy match (semantic matching removed for performance)
 * @param {string} key - Canonical field key (e.g., "buildingType")
 * @param {string} value - Value to match (e.g., "apartment")
 * @param {Array<string>} input - Array of expected values (e.g., BUILDING_TYPE_VALUES)
 * @param {number} fuzzyThreshold - Optional fuzzy match threshold (0.0 = perfect match, 1.0 = match anything). Default: 0.4
 * @returns {Promise<{matched: boolean, confidence: number, matchedValue: string | null}>}
 */
export async function matches_values(key, value, input, fuzzyThreshold = 0.6) {
  if (!value || !input || input.length === 0) {
    return {
      matched: false,
      confidence: 0,
      matchedValue: null,
    };
  }
  
  const normalizedValue = String(value).toLowerCase().trim();
  
  // Step 1: Exact match (case-insensitive, trimmed)
  for (const candidate of input) {
    const normalizedCandidate = String(candidate).toLowerCase().trim();
    if (normalizedValue === normalizedCandidate) {
      return {
        matched: true,
        confidence: 1.0,
        matchedValue: candidate, // Return original case
      };
    }
  }
  
  // Step 2: Fuzzy match using Fuse.js (semantic matching removed for performance)
  const fuse = new Fuse(input, {
    threshold: 0.6, // 0.0 = perfect match, 1.0 = match anything
    includeScore: true,
    ignoreLocation: true,
  });
  
  const fuzzyResults = fuse.search(normalizedValue);
  if (fuzzyResults.length > 0 && fuzzyResults[0].score < fuzzyThreshold) {
    // Lower score is better in Fuse.js
    const bestMatch = fuzzyResults[0];
    return {
      matched: true,
      confidence: 1 - bestMatch.score, // Convert to similarity score
      matchedValue: bestMatch.item,
    };
  }
  
  return {
    matched: false,
    confidence: 0,
    matchedValue: null,
  };
}

/**
 * ExcelFieldMapper class
 * Provides methods for mapping Excel headers to canonical field keys
 */
export class ExcelFieldMapper {
  /**
   * Creates a new ExcelFieldMapper instance
   * @param {Object} fieldAliases - Optional custom field aliases mapping (defaults to FIELD_ALIASES)
   */
  constructor(fieldAliases = FIELD_ALIASES) {
    this.fieldAliases = fieldAliases;
  }

  /**
   * Finds the canonical key for a given header (exact match only)
   * @param {string} header - The header from Excel file
   * @returns {string|null} - The canonical key if found, null otherwise
   */
  findCanonicalKeyExact(header) {
    if (!header) return null;
    
    // Normalize spaces for robust exact matching
    const normalize = (str) => String(str).toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedHeader = normalize(header);
    
    // Check canonical key name first
    for (const canonicalKey in this.fieldAliases) {
      if (normalizedHeader === normalize(canonicalKey)) {
        return canonicalKey;
      }
    }
    
    // Check aliases in order from FIELD_ALIASES array
    for (const canonicalKey in this.fieldAliases) {
      const aliases = this.fieldAliases[canonicalKey];
      
      // Check aliases in order
      for (const alias of aliases) {
        const normalizedAlias = normalize(alias);
        // Exact alias match - return immediately
        if (normalizedHeader === normalizedAlias) {
          return canonicalKey;
        }
      }
    }
    
    return null;
  }

  /**
   * Finds the canonical key for a given header
   * Strategy: Exact match (in order) → Fuzzy match (semantic matching removed for performance)
   * @param {string} header - The header from Excel file
   * @param {boolean} exactOnly - If true, only do exact matching
   * @returns {Promise<string|null>} - The canonical key if found, null otherwise
   */
  async findCanonicalKey(header, exactOnly = false) {
    if (!header) return null;
    
    // Always try exact match first
    const exactMatch = this.findCanonicalKeyExact(header);
    if (exactMatch) {
      return exactMatch;
    }
    
    // If exact only, return null
    if (exactOnly) {
      return null;
    }
    
    // Normalize spaces for fuzzy matching
    const normalize = (str) => String(str).toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedHeader = normalize(header);
    
    // Phase 2: Fuzzy matching using Fuse.js (if no exact match)
    const allAliases = [];
    const aliasToKeyMap = new Map();
    
    for (const canonicalKey in this.fieldAliases) {
      const aliases = this.fieldAliases[canonicalKey];
      for (const alias of aliases) {
        allAliases.push(alias);
        aliasToKeyMap.set(alias, canonicalKey);
      }
    }
    
    const fuse = new Fuse(allAliases, {
      threshold: 0.6,
      includeScore: true,
      ignoreLocation: true,
    });
    
    const fuzzyResults = fuse.search(normalizedHeader);
    if (fuzzyResults.length > 0 && fuzzyResults[0].score < 0.4) {
      const bestMatch = fuzzyResults[0];
      const matchedAlias = bestMatch.item;
      return aliasToKeyMap.get(matchedAlias) || null;
    }
    
    // Semantic matching removed for performance - relying on exact + fuzzy matching only
    return null;
  }

  /**
   * Creates a mapping from Excel headers to canonical keys
   * Prioritizes exact matches over fuzzy matches (semantic matching removed for performance)
   * @param {Array} headers - Array of header strings from Excel
   * @returns {Promise<Object>} - Mapping object: { [header]: canonicalKey }
   */
  async createHeaderMapping(headers) {
    const mapping = {};
    const exactMatches = new Map(); // Track canonical keys that have exact matches
    
    // Phase 1: Find all exact matches first
    headers.forEach((header) => {
      const canonicalKey = this.findCanonicalKeyExact(header);
      if (canonicalKey) {
        mapping[header] = canonicalKey;
        exactMatches.set(canonicalKey, header); // Track which header has exact match
      }
    });
    
    // Phase 2: For headers that didn't match exactly, try fuzzy/semantic matching
    // But only if the canonical key doesn't already have an exact match
    const headersToProcess = headers.filter(header => !mapping[header]);
    
    if (headersToProcess.length > 0) {
      const fuzzyResults = await Promise.all(
        headersToProcess.map(async (header) => {
          const canonicalKey = await this.findCanonicalKey(header, false);
          return { header, canonicalKey };
        })
      );
      
      fuzzyResults.forEach(({ header, canonicalKey }) => {
        // Only add if canonical key doesn't already have an exact match
        if (canonicalKey && !exactMatches.has(canonicalKey)) {
          mapping[header] = canonicalKey;
        }
      });
    }
    
    return mapping;
  }

  /**
   * Validates a value from row 2 against expected enum values or custom validators
   * @param {string} canonicalKey - The canonical field key (e.g., "buildingType")
   * @param {any} row2Value - The value from row 2 to validate
   * @returns {Promise<{isValid: boolean, matchedValue: string | null, warning: boolean}>}
   */
  async validateRow2Value(canonicalKey, row2Value) {
    const validator = EXPECTED_VALUES_MAP[canonicalKey];
    
    // If this field doesn't have a validator, skip validation
    if (!validator) {
      return {
        isValid: true,
        matchedValue: null,
        warning: false,
      };
    }
    
    // If validator is a function, use it directly
    if (typeof validator === 'function') {
      const isValid = validator(row2Value);
      return {
        isValid,
        matchedValue: isValid ? String(row2Value) : null,
        warning: !isValid,
      };
    }
    
    // If validator is an array, use matches_values
    if (Array.isArray(validator)) {
      // Use 0.6 fuzzy threshold for buildingType (property type) for more lenient matching
      const fuzzyThreshold = 0.6;
      const result = await matches_values(canonicalKey, row2Value, validator, fuzzyThreshold);
      
      if (result.matched) {
        return {
          isValid: true,
          matchedValue: result.matchedValue,
          warning: false,
        };
      }
      
      // Value doesn't match - show warning
      return {
        isValid: false,
        matchedValue: null,
        warning: true,
      };
    }
    
    // Unknown validator type - skip validation
    return {
      isValid: true,
      matchedValue: null,
      warning: false,
    };
  }

  /**
   * Gets missing canonical keys from a set of headers
   * @param {Array} headers - Array of header strings from Excel
   * @param {Array} validatedKeys - Array of required canonical keys (defaults to VALIDATED_KEYS)
   * @returns {Promise<Array>} - Array of missing canonical keys
   */
  async getMissingKeys(headers, validatedKeys = VALIDATED_KEYS) {
    const headerMapping = await this.createHeaderMapping(headers);
    const matchedKeys = new Set(Object.values(headerMapping));
    
    return validatedKeys.filter((key) => !matchedKeys.has(key));
  }

  /**
   * Creates a reverse mapping from canonical keys to headers that matched them
   * @param {Object} headerMapping - Header mapping object from createHeaderMapping
   * @returns {Object} - Reverse mapping: { [canonicalKey]: [header1, header2, ...] }
   */
  createReverseMapping(headerMapping) {
    const reverseMapping = {};
    
    Object.entries(headerMapping).forEach(([header, canonicalKey]) => {
      if (!reverseMapping[canonicalKey]) {
        reverseMapping[canonicalKey] = [];
      }
      reverseMapping[canonicalKey].push(header);
    });
    
    return reverseMapping;
  }
}

// Export a default instance for convenience
export const excelFieldMapper = new ExcelFieldMapper();

// Export standalone functions for backward compatibility
export const findCanonicalKey = async (header, fieldAliases = FIELD_ALIASES) => {
  const mapper = new ExcelFieldMapper(fieldAliases);
  return await mapper.findCanonicalKey(header);
};

export const createHeaderMapping = async (headers, fieldAliases = FIELD_ALIASES) => {
  const mapper = new ExcelFieldMapper(fieldAliases);
  return await mapper.createHeaderMapping(headers);
};
