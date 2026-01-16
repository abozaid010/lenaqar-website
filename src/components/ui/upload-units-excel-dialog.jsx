"use client";

import ExcelJS from "exceljs";
import { getStaticViewTypeMapping } from "@/utils/localeConstants";
import { useI18n } from "@/context/translate-api";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { v4 as uuidv4 } from "uuid";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseExcelFile, downloadExcelFile } from "@/utils/excel-utils";
import { useAddUnit } from "@/hooks/use-unit-mutations";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import {
  VALIDATED_KEYS,
  excelFieldMapper,
  createHeaderMapping,
} from "@/utils/excel-field-mapper";
import {
  excelTemplateColumns,
  excelTemplateExampleRow,
} from "@/constants/excel-template-example";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";

const downloadTemplateFile = () => {
  window.open(
    "https://docs.google.com/spreadsheets/d/137hGxNGjDWjM-QfuDsEeozmJx4xFw9I9J7PFWqDzAXw/edit?usp=sharing",
    "_blank"
  );
};

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
 * Converts deliveryDate to string format
 * Handles Excel date numbers and various date formats
 */
const formatDeliveryDate = (value) => {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === "") {
    return "";
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
};

/**
 * Validates and normalizes view value to match API enum
 */
const normalizeView = (value) => {
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
};

/**
 * Converts all string values in an object to lowercase
 * Backend expects all string fields in lowercase
 * Handles special cases for deliveryDate and view
 */
const convertStringsToLowercase = (obj) => {
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
};


export default function UploadUnitsExcelDialog({ isOpen, onClose }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [showMissingColumnsWarning, setShowMissingColumnsWarning] = useState(false);
  const [missingColumns, setMissingColumns] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [manualHeaderMapping, setManualHeaderMapping] = useState({}); // Maps templateKey -> excelHeader
  const [allUploadsSuccessful, setAllUploadsSuccessful] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  const clientId = LenaCookiesManager.getClientId() || null;
  const clientName = LenaCookiesManager.getClientInfo()?.client_name || null;

  const { mutateAsync: addUnitViaExcel, isError } = useAddUnit(true);

  // Helper function to get columns in correct order (reversed for RTL)
  const getOrderedColumns = (columns) => {
    return locale === "ar" ? [...columns].reverse() : columns;
  };

  // Track dialog opens and auto-show video for first 2 times
  useEffect(() => {
    if (!isOpen) return;

    const STORAGE_KEY = "uploadUnitsExcelDialog_openCount";
    
    try {
      // Get current count from localStorage
      const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      
      // If less than 2, show video and increment count
      if (currentCount < 2) {
        setIsVideoDialogOpen(true);
        localStorage.setItem(STORAGE_KEY, String(currentCount + 1));
      }
    } catch (error) {
      // If localStorage is not available, just continue without tracking
      console.warn("localStorage not available for tracking dialog opens:", error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parseExcelFileHandler = async (file, manualMapping = null) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { headers: excelHeaders, rows, sheetName } = await parseExcelFile(file);

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

      // Create automatic mapping from Excel headers to template keys (now async)
      const autoHeaderMapping = await createHeaderMapping(excelHeaders);
      
      // Create reverse mapping: templateKey -> excelHeader (for auto-mapped columns)
      const autoTemplateToExcel = {};
      Object.entries(autoHeaderMapping).forEach(([excelHeader, templateKey]) => {
        if (!autoTemplateToExcel[templateKey]) {
          autoTemplateToExcel[templateKey] = excelHeader;
        }
      });

      // Use the passed mapping or fall back to state (for React state closure issue)
      const currentManualMapping = manualMapping !== null ? manualMapping : manualHeaderMapping;
      
      // Merge auto mapping with manual mapping (manual takes precedence)
      const templateToExcelMapping = { ...autoTemplateToExcel, ...currentManualMapping };

      // Validate row 2 values for matched headers
      const valueValidationResults = {};
      const row2 = rows.length > 0 ? rows[0] : null; // First data row (row 2 in Excel)
      
      if (row2) {
        // Validate each matched header's value in row 2
        for (const [templateKey, excelHeader] of Object.entries(templateToExcelMapping)) {
          const colIndex = excelHeaders.indexOf(excelHeader);
          if (colIndex >= 0) {
            const row2Value = row2[colIndex];
            if (row2Value !== undefined && row2Value !== null && row2Value !== "") {
              const validation = await excelFieldMapper.validateRow2Value(templateKey, row2Value);
              valueValidationResults[templateKey] = validation;
            }
          }
        }
      }

      // Transform rows to structured JSON using template keys
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

      // Helper function to parse numeric values (handles formatted strings like "EGP 17,895,622")
      const parseNumericValue = (value) => {
// Send values as is, BE will clean it. 
        return value;
      };

      // Transform to final structure matching API schema
      const transformedUnits = units.map((unit) => {
        // Build object matching API schema exactly
        const transformed = {
          unitId: uuidv4(),
          project: unit.project || "",
          buildingType: unit.buildingType || "",
          roomsCount: parseNumericValue(unit.roomsCount) ,
          landArea: parseNumericValue(unit.landArea) ,
          deliveryDate: unit.deliveryDate || "",
          totalPrice: parseNumericValue(unit.totalPrice) ,
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

        // ### Extract payment plans dynamically ### //
        // Collect all payment plan numbers that exist in the unit data
        // const paymentPlanNumbers = new Set();
        // Object.keys(unit).forEach((key) => {
        //   const match = key.match(/^pp(\d+)_/);
        //   if (match) {
        //     paymentPlanNumbers.add(parseInt(match[1]));
        //   }
        // });

        // Process each payment plan number found
        // paymentPlanNumbers.forEach((planNumber) => {
        //   const prefix = `pp${planNumber}_`;
        //   const years = planNumber; // Determine years from plan number (pp1 = 1 year, pp2 = 2 years, etc.)
        //   const price = unit[`${prefix}price`];
        //   const maintenance = unit[`${prefix}maintenance`];
        //   const downPayment = unit[`${prefix}downPayment`];
        //   const installmentAmount = unit[`${prefix}installment_amount_yearly`];

        //   // Check if all required fields exist for this payment plan
        //   // Required: price, downPayment, installment_amount_yearly
        //   // Optional: maintenance
        //   const hasRequiredFields = price && downPayment && installmentAmount;

        //   if (hasRequiredFields) {
        //     transformed.paymentPlans.push({
        //       years: years,
        //       price: Number(price),
        //       maintenance: maintenance ? Number(maintenance) : 0,
        //       downPayment: Number(downPayment),
        //       installment_amount_yearly: Number(installmentAmount),
        //     });
        //   }
        // });

        // Convert all string fields to lowercase (backend expects lowercase)
        return convertStringsToLowercase(transformed);
      });

      setParsedData({
        excelHeaders, // Excel sheet headers (first row)
        templateToExcelMapping, // Maps template key -> Excel header
        rows,
        units: transformedUnits,
        valueValidationResults, // Validation results for row 2 values
        summary: {
          totalUnits: transformedUnits.length,
          worksheetName: sheetName,
        },
      });

      setIsProcessing(false);
    } catch (err) {
      console.error("Error parsing Excel file:", err);
      setError(err.message || "Failed to parse Excel file");
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (
        validTypes.includes(file.type) ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        setSelectedFile(file);
        setParsedData(null);
        setError(null);

        parseExcelFileHandler(file);
      } else {
        alert(
          t.uploadExcel?.invalidFileType ||
          "Please select a valid Excel file (.xlsx or .xls)"
        );
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData(null);
    setError(null);
    setUploadStatus([]);
    setManualHeaderMapping({});
    setAllUploadsSuccessful(false);
    setShowMissingColumnsWarning(false);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetDialogState = () => {
    setSelectedFile(null);
    setParsedData(null);
    setError(null);
    setUploadStatus([]);
    setManualHeaderMapping({});
    setAllUploadsSuccessful(false);
    setShowMissingColumnsWarning(false);
    setMissingColumns([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetDialogState();
    onClose();
  };

  const handleGoToUnits = () => {
    router.push("/units");
    resetDialogState();
    onClose();
  };

  const handleHeaderMappingChange = (templateKey, excelHeader) => {
    setManualHeaderMapping(prev => {
      const updated = { ...prev };
      if (excelHeader) {
        updated[templateKey] = excelHeader;
      } else {
        delete updated[templateKey];
      }
      
      // Re-parse the file with the updated mapping immediately
      // Pass the updated mapping directly to avoid React state closure issue
      if (selectedFile) {
        parseExcelFileHandler(selectedFile, updated);
      }
      
      return updated;
    });
  };

  const getTemplateColumnStatus = (templateKey) => {
    if (!parsedData) {
      return {
        isResolved: false,
        excelHeader: null,
        isManual: false,
        valueWarning: false,
        valueMatchStatus: null,
      };
    }
    
    const valueValidation = parsedData.valueValidationResults?.[templateKey];
    const baseStatus = {
      valueWarning: valueValidation?.warning || false,
      valueMatchStatus: valueValidation || null,
    };
    
    // Check if manually mapped
    if (manualHeaderMapping[templateKey]) {
      return {
        isResolved: true,
        excelHeader: manualHeaderMapping[templateKey],
        isManual: true,
        ...baseStatus,
      };
    }
    
    // Check if auto-mapped
    const autoMapped = parsedData.templateToExcelMapping[templateKey];
    if (autoMapped) {
      return {
        isResolved: true,
        excelHeader: autoMapped,
        isManual: false,
        ...baseStatus,
      };
    }
    
    return {
      isResolved: false,
      excelHeader: null,
      isManual: false,
      ...baseStatus,
    };
  };

  const getUsedExcelHeaders = () => {
    if (!parsedData) return new Set();
    const used = new Set();
    
    excelTemplateColumns.forEach(templateCol => {
      const status = getTemplateColumnStatus(templateCol.key);
      if (status.excelHeader) {
        used.add(status.excelHeader);
      }
    });
    
    return used;
  };

  const getMissingColumns = () => {
    if (!parsedData) return [];
    
    // Find all resolved template keys
    const resolvedKeys = new Set();
    excelTemplateColumns.forEach(templateCol => {
      const status = getTemplateColumnStatus(templateCol.key);
      if (status.isResolved) {
        resolvedKeys.add(templateCol.key);
      }
    });

    // Find missing required keys (only check keys marked as required)
    const requiredKeys = excelTemplateColumns
      .filter(col => col.is_required)
      .map(col => col.key);
    
    return requiredKeys.filter(key => !resolvedKeys.has(key));
  };

  /**
   * Validates all required fields before upload
   * Returns array of validation errors
   */
  const validateRequiredFields = () => {
    if (!parsedData) return [];
    
    const errors = [];
    
    // Get all required columns
    const requiredColumns = excelTemplateColumns.filter(col => col.is_required);
    
    requiredColumns.forEach(templateCol => {
      const status = getTemplateColumnStatus(templateCol.key);
      const columnLabel = templateCol.label;
      
      // Check if field is not mapped
      if (!status.isResolved) {
        errors.push({
          field: templateCol.key,
          label: columnLabel,
          type: 'not_mapped',
          message: `${columnLabel} is not mapped to any Excel column`,
        });
        return;
      }
      
      // Check if field has value warning (invalid value)
      if (status.valueWarning) {
        errors.push({
          field: templateCol.key,
          label: columnLabel,
          type: 'invalid_value',
          message: `${columnLabel} has an invalid value in row 2. Please check and confirm the value is correct.`,
        });
      }
    });
    
    return errors;
  };

  const handleSubmit = async () => {
    if (!selectedFile || !parsedData) {
      alert(t.uploadExcel?.noFileSelected || "Please select a file first");
      return;
    }

    // Validate all required fields
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      setShowMissingColumnsWarning(true);
      return;
    }

    setIsUploading(true);
    setUploadStatus([]);
    setAllUploadsSuccessful(false);

    const initialStatus = parsedData.units.map((unit, index) => ({
      index,
      unitId: unit.unitId, // Store unitId for matching with inserted_ids
      unitTitle: unit.unitTitle || unit.code || `Unit ${index + 1}`,
      status: "uploading", // Start all as uploading since we send them together
      error: null,
    }));
    setUploadStatus(initialStatus);

    try {
      // Send all units in a single request
      const response = await addUnitViaExcel(parsedData.units);

      console.log("Upload response:", response);

      // Check if the upload was successful
      if (response?.status && response?.data) {
        const insertedIds = response.data.inserted_ids || [];
        const failedUnits = response.data.failed_units || [];
        const totalSent = parsedData.units.length;
        const totalInserted = insertedIds.length;

        // Create a map of failed units for quick lookup
        const failedUnitsMap = new Map(
          failedUnits.map((failed) => [failed.unit_id, failed.error_message])
        );

        setUploadStatus((prev) =>
          prev.map((item) => {
            const wasInserted = insertedIds.includes(item.unitId);
            const failureReason = failedUnitsMap.get(item.unitId);

            if (wasInserted) {
              return {
                ...item,
                status: "success",
                error: null,
              };
            } else if (failureReason) {
              return {
                ...item,
                status: "failed",
                error: failureReason,
              };
            } else {
              // Fallback for units not in either list
              return {
                ...item,
                status: "failed",
                error: "Unit was rejected by the server",
              };
            }
          })
        );

        // Mark if all uploads were successful (don't auto-close, let user dismiss)
        if (totalInserted === totalSent && failedUnits.length === 0) {
          setAllUploadsSuccessful(true);
        }
      } else {
        // If response doesn't indicate success, mark all as failed
        setUploadStatus((prev) =>
          prev.map((item) => ({
            ...item,
            status: "failed",
            error: response?.error_message || "Upload failed",
          }))
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Mark all units as failed on error
      setUploadStatus((prev) =>
        prev.map((item) => ({
          ...item,
          status: "failed",
          error: err.message || "Failed to upload units",
        }))
      );
    }

    setIsUploading(false);
  };

  const downloadFailedUnits = async () => {
    if (!parsedData || !uploadStatus.length) {
      return;
    }

    // Get indices of failed units
    const failedIndices = uploadStatus
      .map((item, index) => (item.status === "failed" ? index : null))
      .filter((index) => index !== null);

    if (failedIndices.length === 0) {
      alert(t.uploadExcel?.noFailedUnits || "No failed units to download");
      return;
    }

    try {
      // Get original Excel headers
      const headers = parsedData.excelHeaders || [];

      // Filter rows to only include failed units
      const failedRows = failedIndices.map((index) => parsedData.rows[index]);

      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // Prepare worksheet
      const worksheet = workbook.addWorksheet("Failed Units");

      // Add headers
      worksheet.columns = headers.map((header) => ({
        header,
        key: header.toLowerCase().replace(/\s+/g, "_"),
        width: 20,
      }));

      // Add data rows
      failedRows.forEach((row) => {
        worksheet.addRow(row);
      });

      // Style header row
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        cell.alignment = { horizontal: "center", vertical: "center" };
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const filename = `failed_units_${timestamp}.xlsx`;

      // Write workbook to buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Trigger download using secure utility
      downloadExcelFile(excelBuffer, filename);
    } catch (error) {
      console.error("Error exporting failed units:", error);
      alert(t.uploadExcel?.exportError || "Error occurred while exporting failed units");
    }
  };

  // Check if there are failed units
  const hasFailedUnits = uploadStatus.some((item) => item.status === "failed");
  const isUploadComplete = !isUploading && uploadStatus.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {t.uploadExcel?.title || "Upload Units Excel Sheet"}
            </h2>
            {parsedData && (
              <span className="text-sm text-gray-600">
                ({parsedData.summary.totalUnits} {t.uploadExcel?.units || "units"})
              </span>
            )}
            <VideoInstructionsDialog
              variant="upload"
              iconSize="md"
              tooltipText="How to upload units via Excel"
              className="p-0"
              isOpen={isVideoDialogOpen}
              onClose={() => setIsVideoDialogOpen(false)}
              zIndex={101}
            />
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            {/* Upload Area */}
            <div className={`border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary transition-colors ${!selectedFile ? 'p-8' : 'p-3'}`} style={selectedFile ? { minHeight: '50px' } : {}}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div className="space-y-6">
                  {/* Example Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse" dir="ltr">
                      <thead>
                        {/* Required Fields Header */}
                        <tr>
                          {(() => {
                            const orderedColumns = getOrderedColumns(excelTemplateColumns);
                            const requiredCols = orderedColumns.filter((col) => col.is_required);
                            const optionalCols = orderedColumns.filter((col) => !col.is_required);
                            
                            // For RTL, show optional first, then required
                            return locale === "ar" ? (
                              <>
                                {optionalCols.length > 0 && (
                                  <th
                                    colSpan={optionalCols.length}
                                    className="px-4 py-2 text-center font-bold text-gray-700 bg-gray-200 border border-gray-300"
                                  >
                                    Nice to Have
                                  </th>
                                )}
                                {requiredCols.length > 0 && (
                                  <th
                                    colSpan={requiredCols.length}
                                    className="px-4 py-2 text-center font-bold text-white bg-red-600 border border-red-700"
                                  >
                                    Required Fields
                                  </th>
                                )}
                              </>
                            ) : (
                              <>
                                {requiredCols.length > 0 && (
                                  <th
                                    colSpan={requiredCols.length}
                                    className="px-4 py-2 text-center font-bold text-white bg-red-600 border border-red-700"
                                  >
                                    Required Fields
                                  </th>
                                )}
                                {optionalCols.length > 0 && (
                                  <th
                                    colSpan={optionalCols.length}
                                    className="px-4 py-2 text-center font-bold text-gray-700 bg-gray-200 border border-gray-300"
                                  >
                                    Nice to Have
                                  </th>
                                )}
                              </>
                            );
                          })()}
                        </tr>
                        {/* Column Headers */}
                        <tr className="bg-gray-100">
                          {getOrderedColumns(excelTemplateColumns).map((column) => (
                            <th
                              key={column.key}
                              className={`px-4 py-2 text-left font-semibold border border-gray-300 ${
                                column.is_required
                                  ? "bg-red-100 text-red-800"
                                  : "text-gray-700"
                              }`}
                            >
                              {column.label}{column.is_required ? " *" : ""}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          {getOrderedColumns(excelTemplateColumns).map((column) => (
                            <td
                              key={column.key}
                              className={`px-4 py-2 text-gray-700 border border-gray-300 ${
                                column.is_required ? "bg-red-50" : ""
                              }`}
                            >
                              {excelTemplateExampleRow[column.key] || "-"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadTemplateFile();
                      }}
                      className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:underline transition-all flex items-center gap-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                    >
                      <Download size={16} />
                      {t.uploadExcel?.downloadTemplate || "Download Template"}
                    </button>
                    <button
                      onClick={handleUploadClick}
                      className="px-16 py-3 bg-primary text-white rounded-md hover:opacity-90 transition-opacity text-base font-semibold shadow-md"
                    >
                      {t.uploadExcel?.browseFiles || "Upload"}
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">
                    {t.uploadExcel?.supportedFormats ||
                      "Supported formats: .xlsx, .xls"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload size={20} className="text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-gray-700 font-medium">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {t.uploadExcel?.fileSize || "File size"}:{" "}
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUploadClick}
                      className="px-3 py-1 text-xs text-primary hover:underline"
                    >
                      {t.uploadExcel?.changeFile || "Change File"}
                    </button>
                    <button
                      onClick={handleRemoveFile}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle
                  className="text-red-500 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    {t.uploadExcel?.error || "Error"}
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <p className="text-gray-600">
                    {t.uploadExcel?.processing || "Processing file..."}
                  </p>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {parsedData && !isProcessing && (() => {
              const excelHeaders = parsedData.excelHeaders || [];
              const templateToExcelMapping = parsedData.templateToExcelMapping || {};

              // Count resolved and unresolved template columns
              const resolvedCount = excelTemplateColumns.filter(col => 
                getTemplateColumnStatus(col.key).isResolved
              ).length;
              const unresolvedCount = excelTemplateColumns.length - resolvedCount;

              return (
                <div className="space-y-2 flex flex-col flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="text-green-600" size={12} />
                        <span>Resolved: {resolvedCount}</span>
                      </span>
                      {unresolvedCount > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="text-red-600" size={12} />
                          <span>Not resolved: {unresolvedCount}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {t.uploadExcel?.worksheet || "Worksheet"}:{" "}
                      {parsedData.summary.worksheetName}
                    </span>
                  </div>

                  {/* Column Mapping Guide */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <h4 className="font-semibold text-gray-800 text-xs mb-1 flex items-center gap-2">
                      <AlertCircle className="text-blue-600" size={14} />
                      {t.uploadExcel?.columnMappingGuide || "Column Mapping Guide"}
                    </h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>{t.uploadExcel?.greenMapped || "Green: Mapped column with valid value"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded flex items-center justify-center">
                          <AlertCircle className="text-yellow-600" size={8} />
                        </div>
                        <span>{t.uploadExcel?.yellowWarning || "Yellow with ⚠️: Optional field mapped but value needs confirmation"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                          <AlertCircle className="text-red-600" size={8} />
                        </div>
                        <span>{t.uploadExcel?.redWarning || "Red with ⚠️: Required field not mapped OR invalid value - must fix"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded"></div>
                        <span>{t.uploadExcel?.lightYellow || "Light Yellow: Optional field not mapped"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">*</span>
                        <span>{t.uploadExcel?.asterisk || "Asterisk (*): Required field"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden flex-1 flex flex-col" dir="ltr">
                    <div className="overflow-x-auto overflow-y-auto flex-1">
                      <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          {/* Required/Optional Headers */}
                          <tr>
                            <th rowSpan={2} className="px-2 py-2 text-left font-semibold text-gray-700 border-b" style={{ minWidth: "40px", maxWidth: "50px" }}>
                              #
                            </th>
                            {(() => {
                              const orderedColumns = getOrderedColumns(excelTemplateColumns);
                              const requiredCols = orderedColumns.filter((col) => col.is_required);
                              const optionalCols = orderedColumns.filter((col) => !col.is_required);
                              
                              // For RTL, show optional first, then required
                              return locale === "ar" ? (
                                <>
                                  {optionalCols.length > 0 && (
                                    <th
                                      colSpan={optionalCols.length}
                                      className="px-2 py-2 text-center font-bold text-gray-700 bg-gray-200 border-b border-gray-300"
                                    >
                                      Nice to Have
                                    </th>
                                  )}
                                  {requiredCols.length > 0 && (
                                    <th
                                      colSpan={requiredCols.length}
                                      className="px-2 py-2 text-center font-bold text-white bg-red-600 border-b border-red-700"
                                    >
                                      Required Fields
                                    </th>
                                  )}
                                </>
                              ) : (
                                <>
                                  {requiredCols.length > 0 && (
                                    <th
                                      colSpan={requiredCols.length}
                                      className="px-2 py-2 text-center font-bold text-white bg-red-600 border-b border-red-700"
                                    >
                                      Required Fields
                                    </th>
                                  )}
                                  {optionalCols.length > 0 && (
                                    <th
                                      colSpan={optionalCols.length}
                                      className="px-2 py-2 text-center font-bold text-gray-700 bg-gray-200 border-b border-gray-300"
                                    >
                                      Nice to Have
                                    </th>
                                  )}
                                </>
                              );
                            })()}
                          </tr>
                          {/* Column Headers */}
                          <tr>
                            {getOrderedColumns(excelTemplateColumns).map((templateCol, idx) => {
                              const status = getTemplateColumnStatus(templateCol.key);
                              const isResolved = status.isResolved;
                              const excelHeader = status.excelHeader;
                              const valueWarning = status.valueWarning;
                              const usedExcelHeaders = getUsedExcelHeaders();
                              
                              // Determine background color based on status
                              let bgColorClass = "";
                              if (!isResolved) {
                                // Not resolved
                                bgColorClass = templateCol.is_required
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-50 text-yellow-800";
                              } else if (valueWarning && templateCol.is_required) {
                                // Required field resolved but value invalid - show red
                                bgColorClass = "bg-red-100 text-red-800";
                              } else if (valueWarning) {
                                // Optional field resolved but value warning - show yellow
                                bgColorClass = "bg-yellow-100 text-yellow-900";
                              } else {
                                // Resolved and valid
                                bgColorClass = "bg-green-100 text-green-800";
                              }
                              
                              return (
                                <th
                                  key={idx}
                                  className={`px-2 py-2 text-left font-semibold border-b ${bgColorClass}`}
                                  style={{ minWidth: "110px", width: "auto", height: "100px" }}
                                >
                                  <div className="flex flex-col h-full justify-between gap-1">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-xs font-semibold break-words" title={templateCol.label}>
                                          {templateCol.label} {templateCol.is_required ? "*" : ""} {isResolved ? "✓" : ""}
                                        </span>
                                        {valueWarning && (
                                          <AlertCircle
                                            className="text-yellow-600 flex-shrink-0"
                                            size={14}
                                            title="Value in row 2 doesn't match expected values. Please confirm."
                                          />
                                        )}
                                      </div>
                                      {isResolved && (
                                        <span className="text-xs font-normal break-words" style={{color: "#059669"}} title={excelHeader}>
                                          ← {excelHeader}
                                        </span>
                                      )}
                                    </div>
                                    <div className="relative mt-auto">
                                      <select
                                        value={excelHeader || ""}
                                        onChange={(e) => handleHeaderMappingChange(templateCol.key, e.target.value)}
                                        className={`text-xs px-1 py-0.5 border rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer w-full h-[27px] leading-tight ${
                                          valueWarning
                                            ? "border-yellow-400 bg-yellow-50"
                                            : isResolved 
                                              ? "border-green-400" 
                                              : templateCol.is_required
                                                ? "border-red-400"
                                                : "border-yellow-400"
                                        }`}
                                        style={{ paddingTop: "2px", paddingBottom: "2px" }}
                                      >
                                      <option value="">Select...</option>
                                      {excelHeaders.map((header, idx) => {
                                        const isUsed = usedExcelHeaders.has(header) && excelHeader !== header;
                                        return (
                                          <option 
                                            key={idx} 
                                            value={header}
                                            disabled={isUsed}
                                            className={isUsed ? "text-gray-400" : ""}
                                          >
                                            {header}{isUsed ? " ✓" : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={
                                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-2 py-2 text-gray-600 border-b font-medium" style={{ minWidth: "40px", maxWidth: "50px" }}>
                                {rowIndex + 1}
                              </td>
                              {getOrderedColumns(excelTemplateColumns).map((templateCol, colIndex) => {
                                const status = getTemplateColumnStatus(templateCol.key);
                                const excelHeader = status.excelHeader;
                                let cellValue = "-";
                                
                                if (excelHeader) {
                                  const excelColIndex = excelHeaders.indexOf(excelHeader);
                                  if (excelColIndex >= 0) {
                                    const value = row[excelColIndex];
                                    if (value !== undefined && value !== null && value !== "") {
                                      cellValue = String(value);
                                    }
                                  }
                                }
                                
                                return (
                                  <td
                                    key={colIndex}
                                    className="px-2 py-2 text-gray-700 border-b"
                                    style={{ minWidth: "100px", width: "auto" }}
                                  >
                                    <div className="break-words" title={cellValue}>
                                      {cellValue}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Upload Status */}
            {uploadStatus.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {t.uploadExcel?.uploadProgress || "Upload Progress"}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {uploadStatus.filter((s) => s.status === "success").length}{" "}
                    / {uploadStatus.length}{" "}
                    {t.uploadExcel?.completed || "completed"}
                  </span>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    {uploadStatus.map((item) => (
                      <div
                        key={item.index}
                        className={`flex items-center justify-between px-4 py-3 border-b last:border-b-0 ${item.status === "success"
                            ? "bg-green-50"
                            : item.status === "failed"
                              ? "bg-red-50"
                              : item.status === "uploading"
                                ? "bg-blue-50"
                                : "bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                            #{item.index + 1}
                          </span>
                          <span className="text-sm text-gray-700 truncate">
                            {item.unitTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.status === "pending" && (
                            <span className="text-xs text-gray-500">
                              {t.uploadExcel?.pending || "Pending"}
                            </span>
                          )}
                          {item.status === "uploading" && (
                            <>
                              <Loader2
                                className="animate-spin text-blue-600"
                                size={18}
                              />
                              <span className="text-xs text-blue-600">
                                {t.uploadExcel?.uploading || "Uploading..."}
                              </span>
                            </>
                          )}
                          {item.status === "success" && (
                            <>
                              <CheckCircle
                                className="text-green-600"
                                size={18}
                              />
                              <span className="text-xs text-green-600">
                                {t.uploadExcel?.success || "Success"}
                              </span>
                            </>
                          )}
                          {item.status === "failed" && (
                            <>
                              <XCircle className="text-red-600" size={18} />
                              <span className="text-xs text-red-600">
                                {t.uploadExcel?.failed || "Failed"}
                              </span>
                              {item.error && (
                                <span className="text-xs text-red-500 ml-2">
                                  ({item.error})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Stats */}
                {!isUploading && uploadStatus.length > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">
                        {
                          uploadStatus.filter((s) => s.status === "success")
                            .length
                        }{" "}
                        {t.uploadExcel?.successful || "Successful"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="text-red-600" size={20} />
                      <span className="text-sm font-medium text-gray-700">
                        {
                          uploadStatus.filter((s) => s.status === "failed")
                            .length
                        }{" "}
                        {t.uploadExcel?.failed || "Failed"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className={`px-6 py-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {t.uploadExcel?.cancel || "Cancel"}
          </button>
          {isUploadComplete && hasFailedUnits ? (
            <button
              onClick={downloadFailedUnits}
              className="px-6 py-1 bg-primary text-white rounded-md transition-opacity flex items-center gap-2 hover:opacity-90"
            >
              <Download size={18} />
              {t.uploadExcel?.downloadFailedUnits || "Download Failed Units"}
            </button>
          ) : allUploadsSuccessful && isUploadComplete ? (
            <button
              onClick={handleGoToUnits}
              className="px-6 py-1 bg-primary text-white rounded-md transition-opacity flex items-center gap-2 hover:opacity-90"
            >
              {t.uploadExcel?.goToUnitsNow || "Go to Units Now"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={
                !selectedFile || !parsedData || isProcessing || isUploading
              }
              className={`px-6 py-1 bg-primary text-white rounded-md transition-opacity flex items-center gap-2 ${!selectedFile || !parsedData || isProcessing || isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
                }`}
            >
              {isUploading && <Loader2 className="animate-spin" size={18} />}
              {isUploading
                ? t.uploadExcel?.uploading || "Uploading..."
                : t.uploadExcel?.upload || "Upload"}
            </button>
          )}
        </div>
      </div>

      {/* Missing Columns Warning Dialog */}
      {showMissingColumnsWarning && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between py-4 px-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                {t.uploadExcel?.validationErrorTitle || "Validation Errors"}
              </h3>
              <button
                onClick={() => {
                  setShowMissingColumnsWarning(false);
                  setValidationErrors([]);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-700 mb-4">
                {t.uploadExcel?.validationErrorMessage || "Please fix the following issues before uploading:"}
              </p>
              <div className="space-y-3">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        {error.label}
                      </p>
                      <p className="text-xs text-red-700">
                        {error.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowMissingColumnsWarning(false);
                  setValidationErrors([]);
                }}
                className="px-6 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
              >
                {t.uploadExcel?.gotIt || "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
