/**
 * Excel File Processor
 * 
 * Isolated module for processing Excel files with performance tracking.
 * Handles file parsing, header mapping, validation, and data transformation.
 */

import { parseExcelFile } from "./excel-utils";
import { createHeaderMapping, excelFieldMapper } from "./excel-field-mapper";
import { excelTemplateColumns } from "@/constants/excel-template-example";
import { getStaticViewTypeMapping } from "@/utils/localeConstants";
import { v4 as uuidv4 } from "uuid";

/**
 * Valid view enum values according to API schema
 */
const VALID_VIEW_VALUES = [
  'park',
  'street',
  'lagoon',
  'sea',
  'city',
  'river',
  'pool',
  'golf',
  'garden',
  'open area',
  'mountain'
];

/**
 * Performance logger utility
 */
const perfLog = {
  start: (label) => {
    const startTime = performance.now();
    console.log(`[Excel Processor] ⏱️  ${label} - Started`);
    return { label, startTime };
  },
  end: ({ label, startTime }) => {
    const duration = performance.now() - startTime;
    console.log(`[Excel Processor] ✅ ${label} - Completed in ${duration.toFixed(2)}ms`);
    return duration;
  },
  log: (message, data = null) => {
    if (data) {
      console.log(`[Excel Processor] 📊 ${message}`, data);
    } else {
      console.log(`[Excel Processor] 📊 ${message}`);
    }
  }
};

/**
 * Converts deliveryDate to string format
 * Handles Excel date numbers and various date formats
 * Exported for use in preview/display components
 */
export function formatDeliveryDate(value) {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === "") {
    return "";
  }

  // If it's a Date object (ExcelJS often returns Date objects), format as YYYY-MM-DD
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  // If it's already a string, return it (after trimming)
  if (typeof value === "string") {
    const trimmed = value.trim();
    // If it's a date string in various formats, try to normalize it
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Already in YYYY-MM-DD format
      return trimmed;
    }
    // Try to parse and reformat
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return trimmed;
  }
  
  // If it's a number (Excel date serial number or year), convert appropriately
  if (typeof value === "number") {
    // Very small numbers (likely day numbers or small values) - convert to string as-is
    if (value < 100) {
      return String(value);
    }
    
    // Numbers that look like years (1900-2100 range)
    if (value >= 1900 && value <= 2100) {
      return String(value);
    }
    
    // Try to convert Excel serial date to JavaScript date
    // Excel dates are serial numbers where 1 = Jan 1, 1900
    try {
      // Excel epoch is Jan 1, 1900, but Excel incorrectly treats 1900 as leap year
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      
      // Check if the date is valid
      if (!isNaN(jsDate.getTime())) {
        const year = jsDate.getFullYear();
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // If conversion fails, return as string
    }
    
    // Fallback: convert to string
    return String(value);
  }
  
  // For any other type, convert to string
  return String(value);
}

/**
 * Validates and normalizes view value to match API enum
 */
function normalizeView(value) {
  if (!value || typeof value !== "string") {
    return undefined; // Omit invalid view values
  }
  
  const normalized = value.trim().toLowerCase();
  
  // Check if it matches a valid enum value
  if (VALID_VIEW_VALUES.includes(normalized)) {
    return normalized;
  }
  
  // Try to map common variations
  const viewMap = getStaticViewTypeMapping();
  
  if (viewMap[normalized]) {
    return viewMap[normalized];
  }
  
  // If no match, omit the field (don't send empty string)
  return undefined;
}

/**
 * Converts all string values in an object to lowercase
 * Backend expects all string fields in lowercase
 * Handles special cases for deliveryDate and view
 */
function convertStringsToLowercase(obj) {
  const result = { ...obj };
  
  Object.keys(result).forEach((key) => {
    const value = result[key];
    
    // Special handling for deliveryDate - must be string
    if (key === 'deliveryDate') {
      result[key] = formatDeliveryDate(value);
      return;
    }
    
    // Special handling for view - must be valid enum or omitted
    if (key === 'view') {
      const normalized = normalizeView(value);
      if (normalized === undefined) {
        delete result[key]; // Remove invalid view values
      } else {
        result[key] = normalized;
      }
      return;
    }
    
    // Convert string values to lowercase
    if (typeof value === "string") {
      result[key] = value.trim().toLowerCase();
    }
  });
  
  return result;
}

/**
 * Parse Excel file and extract raw data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<{headers: string[], rows: any[][], sheetName: string}>}
 */
export async function parseExcelFileOnly(file) {
  const timer = perfLog.start("Parse Excel File");
  
  try {
    perfLog.log(`Processing file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    const { headers: excelHeaders, rows, sheetName } = await parseExcelFile(file);
    
    perfLog.end(timer);
    perfLog.log(`Parsed ${rows.length} rows with ${excelHeaders.length} columns from sheet: ${sheetName}`);

    if (!excelHeaders || excelHeaders.length === 0) {
      throw new Error(
        "No worksheet found in the Excel file. Please ensure your file contains at least one worksheet."
      );
    }

    if (rows.length === 0) {
      throw new Error(
        "Excel file must contain headers and at least one data row."
      );
    }

    return { headers: excelHeaders, rows, sheetName };
  } catch (err) {
    perfLog.log(`❌ Parse failed: ${err.message}`);
    throw err;
  }
}

/**
 * Apply mapping and transform data
 * @param {Object} rawExcelData - Raw parsed Excel data { headers, rows, sheetName }
 * @param {Object} manualMapping - Manual header mapping (templateKey -> excelHeader)
 * @returns {Promise<Object>} Processed data with units, mappings, and validation results
 */
export async function applyMappingToData(rawExcelData, manualMapping = {}) {
  const timer = perfLog.start("Apply Mapping & Transform");
  
  if (!rawExcelData) {
    throw new Error("No raw Excel data provided");
  }

  try {
    const { headers: excelHeaders, rows, sheetName } = rawExcelData;
    perfLog.log(`Processing ${rows.length} rows with ${excelHeaders.length} columns`);

    // Step 1: Create automatic header mapping
    const mappingTimer = perfLog.start("Create Header Mapping");
    const autoHeaderMapping = await createHeaderMapping(excelHeaders);
    perfLog.end(mappingTimer);
    perfLog.log(`Auto-mapped ${Object.keys(autoHeaderMapping).length} headers`);

    // Create reverse mapping: templateKey -> excelHeader (for auto-mapped columns)
    const autoTemplateToExcel = {};
    Object.entries(autoHeaderMapping).forEach(([excelHeader, templateKey]) => {
      if (!autoTemplateToExcel[templateKey]) {
        autoTemplateToExcel[templateKey] = excelHeader;
      }
    });

    // Merge auto mapping with manual mapping (manual takes precedence)
    const templateToExcelMapping = { ...autoTemplateToExcel, ...manualMapping };
    perfLog.log(`Total mapped columns: ${Object.keys(templateToExcelMapping).length}`);

    // Step 2: Validate row 2 values for matched headers
    const validationTimer = perfLog.start("Validate Row 2 Values");
    const valueValidationResults = {};
    const row2 = rows.length > 0 ? rows[0] : null; // First data row (row 2 in Excel)
    
    if (row2) {
      const validationPromises = [];
      for (const [templateKey, excelHeader] of Object.entries(templateToExcelMapping)) {
        const colIndex = excelHeaders.indexOf(excelHeader);
        if (colIndex >= 0) {
          const row2Value = row2[colIndex];
          if (row2Value !== undefined && row2Value !== null && row2Value !== "") {
            validationPromises.push(
              excelFieldMapper.validateRow2Value(templateKey, row2Value)
                .then(validation => ({ templateKey, validation }))
            );
          }
        }
      }
      
      const validationResults = await Promise.all(validationPromises);
      validationResults.forEach(({ templateKey, validation }) => {
        valueValidationResults[templateKey] = validation;
      });
    }
    perfLog.end(validationTimer);
    perfLog.log(`Validated ${Object.keys(valueValidationResults).length} field values`);

    // Step 3: Transform rows to structured JSON using template keys
    const transformTimer = perfLog.start("Transform Rows to Units");
    const units = rows.map((row) => {
      const unit = {};

      // For each template column, get value from Excel using the mapping
      excelTemplateColumns.forEach((templateCol) => {
        const excelHeader = templateToExcelMapping[templateCol.key];
        if (excelHeader) {
          const colIndex = excelHeaders.indexOf(excelHeader);
          if (colIndex >= 0) {
            const value = row[colIndex];
            // Allow all values including empty strings - they will be handled appropriately in transformation
            if (value !== undefined && value !== null) {
              unit[templateCol.key] = value;
            }
          }
        }
      });

      return unit;
    });
    perfLog.end(transformTimer);

    // Step 4: Transform to final structure matching API schema
    const finalTransformTimer = perfLog.start("Final Transformation");
    const parseNumericValue = (value) => {
      // Send values as is, BE will clean it.
      return value;
    };

    const transformedUnits = units.map((unit) => {
      // Build object matching API schema exactly
      const transformed = {
        unitId: uuidv4(),
        project: unit.project || "",
        buildingType: unit.buildingType || "",
        roomsCount: parseNumericValue(unit.roomsCount),
        landArea: parseNumericValue(unit.landArea),
        deliveryDate: unit.deliveryDate || "",
        totalPrice: parseNumericValue(unit.totalPrice),
        finishing: unit.finishing || "",
        unitTitle: unit.unitTitle || "",
      };
      
      // Add optional numeric fields only if they have valid values
      if (unit.bathroomCount) {
        transformed.bathroomCount = unit.bathroomCount;
      }
      
      if (unit.floor) {
        transformed.floor = unit.floor;
      }
      
      if (unit.gardenSize) {
        transformed.gardenSize = unit.gardenSize;
      }
      
      if (unit.garageArea) {
        transformed.garageArea = unit.garageArea;
      }
      
      if (unit.roof_area || unit.roofArea) {
        transformed.roof_area = unit.roof_area || unit.roofArea;
      }
      
      if (unit.outdoor_area) {
        transformed.outdoor_area = unit.outdoor_area;
      }
      
      // Add optional string fields only if they have values (omit empty strings)
      if (unit.unit_number || unit.unitNumber) {
        transformed.unit_number = unit.unit_number || unit.unitNumber;
      }
      
      if (unit.building_number || unit.buildingNumber) {
        transformed.building_number = unit.building_number || unit.buildingNumber;
      }
      
      // Add view only if valid (will be validated in convertStringsToLowercase)
      if (unit.view) {
        transformed.view = unit.view;
      }
      
      // Add phase only if it has a value
      if (unit.phase) {
        transformed.phase = unit.phase;
      }
      
      // Add city only if it has a value
      if (unit.city) {
        transformed.city = unit.city;
      }
      
      // Add payment_plan only if it has a value
      if (unit.payment_plan) {
        transformed.payment_plan = unit.payment_plan;
      }

      // Convert all string fields to lowercase (backend expects lowercase)
      return convertStringsToLowercase(transformed);
    });
    perfLog.end(finalTransformTimer);

    perfLog.end(timer);
    perfLog.log(`✅ Successfully processed ${transformedUnits.length} units`);

    return {
      excelHeaders, // Excel sheet headers (first row)
      templateToExcelMapping, // Maps template key -> Excel header
      rows,
      units: transformedUnits,
      valueValidationResults, // Validation results for row 2 values
      summary: {
        totalUnits: transformedUnits.length,
        worksheetName: sheetName,
      },
    };
  } catch (err) {
    perfLog.log(`❌ Mapping/Transformation failed: ${err.message}`);
    throw err;
  }
}

/**
 * Complete Excel file processing (parse + map + transform)
 * @param {File} file - The Excel file to process
 * @param {Object} manualMapping - Optional manual header mapping
 * @returns {Promise<Object>} Complete processed data
 */
export async function processExcelFile(file, manualMapping = {}) {
  const totalTimer = perfLog.start("Total Excel Processing");
  
  try {
    // Step 1: Parse file
    const rawData = await parseExcelFileOnly(file);
    
    // Step 2: Apply mapping and transform
    const processedData = await applyMappingToData(rawData, manualMapping);
    
    perfLog.end(totalTimer);
    perfLog.log("🎉 Excel file processing completed successfully");
    
    return {
      rawData,
      processedData,
    };
  } catch (err) {
    perfLog.log(`❌ Complete processing failed: ${err.message}`);
    throw err;
  }
}
