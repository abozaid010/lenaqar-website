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
    "unit type",
    "unittype",
    "unit-type",
    "type",
  ],
  project: [
    "project",
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
    "title",
    "unit name",
    "unit-name",
    "unitname",
    "name",
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
    "floor number",
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
    "number of bedrooms",
    "no. of bedrooms"
  ],
  landArea: [
    "land area",
    "land-area",
    "landarea",
    "area",
    "bua",
    "land size",
    "land-size",
    "landsize",
    "plot area",
    "plot-area",
    "plotarea",
    "lot area",
    "lot-area",
    "lotarea",
    "size",
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
    "total price",
    "total-price",
    "totalprice",
    "unit price",
    "unit-price",
    "unitprice",
    "cost",
    "total cost",
    "total-cost",
    "totalcost",
    "amount",
    "total amount",
    "total-amount",
    "totalamount",
    "value",
  ],
  deliveryDate: [
    "delivery date",
    "delivery-date",
    "deliverydate",
    "delivery",
    "handover date",
    "handover-date",
    "handoverdate",
    "completion date",
    "completion-date",
    "completiondate",
    "ready date",
    "ready-date",
    "readydate",
    "date",
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
    
    // Then check against all aliases
    for (const canonicalKey in this.fieldAliases) {
      const aliases = this.fieldAliases[canonicalKey];
      if (aliases.includes(normalizedHeader)) {
        return canonicalKey;
      }
    }
    
    return null;
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
