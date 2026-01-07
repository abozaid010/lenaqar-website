/**
 * Excel Field Mapper
 * 
 * Provides flexible column name matching for Excel uploads.
 * Maps various header name variations to canonical field keys.
 */

// Required field keys that MUST be present for unit uploads
// Only these fields will be validated as required during upload
export const VALIDATED_KEYS = [
  "buildingType",
  "project",
  "roomsCount",
  "landArea",
  "finishing",
  "totalPrice",
  "deliveryDate",
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
    "Gross Area",
    "Unit Gross Area",
    "land area",
    "land-area",
    "landarea",
    "bua",
    "BUA (SQM)", //Tatweer Misr
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
    "price",
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
    "Unit Total with Finishing Price",
    "Final Total Unit Price",
    "Nominal Price",
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
};

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
   * Finds the canonical key for a given header by checking exact match first, then aliases
   * Uses a scoring system to prefer longer, more specific matches over short generic ones
   * @param {string} header - The header from Excel file
   * @returns {string|null} - The canonical key if found, null otherwise
   */
  findCanonicalKey(header) {
    if (!header) return null;
    
    const normalizedHeader = String(header).toLowerCase().trim();
    
    // First check for exact match (canonical key name)
    for (const canonicalKey in this.fieldAliases) {
      if (normalizedHeader === canonicalKey.toLowerCase()) {
        return canonicalKey;
      }
    }
    
    // Score all possible matches and pick the best one
    let bestMatch = null;
    let bestScore = 0;
    
    for (const canonicalKey in this.fieldAliases) {
      const aliases = this.fieldAliases[canonicalKey];
      
      for (const alias of aliases) {
        const normalizedAlias = String(alias).toLowerCase().trim();
        
        // Perfect match - score very high
        if (normalizedHeader === normalizedAlias) {
          return canonicalKey; // Return immediately on perfect match
        }
        
        // Substring match - score based on alias length
        // Longer aliases score higher (more specific)
        if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
          const score = normalizedAlias.length; // Prefer longer matches
          if (score > bestScore) {
            bestScore = score;
            bestMatch = canonicalKey;
          }
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Creates a mapping from Excel headers to canonical keys
   * @param {Array} headers - Array of header strings from Excel
   * @returns {Object} - Mapping object: { [header]: canonicalKey }
   */
  createHeaderMapping(headers) {
    const mapping = {};
    
    headers.forEach((header) => {
      const canonicalKey = this.findCanonicalKey(header);
      if (canonicalKey) {
        mapping[header] = canonicalKey;
      }
    });
    
    return mapping;
  }

  /**
   * Gets missing canonical keys from a set of headers
   * @param {Array} headers - Array of header strings from Excel
   * @param {Array} validatedKeys - Array of required canonical keys (defaults to VALIDATED_KEYS)
   * @returns {Array} - Array of missing canonical keys
   */
  getMissingKeys(headers, validatedKeys = VALIDATED_KEYS) {
    const headerMapping = this.createHeaderMapping(headers);
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
export const findCanonicalKey = (header, fieldAliases = FIELD_ALIASES) => {
  const mapper = new ExcelFieldMapper(fieldAliases);
  return mapper.findCanonicalKey(header);
};

export const createHeaderMapping = (headers, fieldAliases = FIELD_ALIASES) => {
  const mapper = new ExcelFieldMapper(fieldAliases);
  return mapper.createHeaderMapping(headers);
};
