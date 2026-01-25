"use client";

import ExcelJS from "exceljs";
import { useI18n } from "@/context/translate-api";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { downloadExcelFile } from "@/utils/excel-utils";
import { useAddUnit } from "@/hooks/use-unit-mutations";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import {
  VALIDATED_KEYS,
  excelFieldMapper,
} from "@/utils/excel-field-mapper";
import {
  parseExcelFileOnly,
  applyMappingToData as applyMappingToDataProcessor,
  processExcelFile,
  formatDeliveryDate,
} from "@/utils/excel_file_processor";
import {
  excelTemplateColumns,
  excelTemplateExampleRow,
} from "@/constants/excel-template-example";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import { debounce } from "@/utils/debounce";

const downloadTemplateFile = () => {
  window.open(
    "https://docs.google.com/spreadsheets/d/137hGxNGjDWjM-QfuDsEeozmJx4xFw9I9J7PFWqDzAXw/edit?usp=sharing",
    "_blank"
  );
};



export default function UploadUnitsExcelDialog({ isOpen, onClose }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawExcelData, setRawExcelData] = useState(null); // Raw parsed Excel data (headers, rows, sheetName)
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReapplyingMapping, setIsReapplyingMapping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [missingProjects, setMissingProjects] = useState([]);
  const [isMissingProjectsDialogOpen, setIsMissingProjectsDialogOpen] =
    useState(false);
  const [showMissingColumnsWarning, setShowMissingColumnsWarning] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [manualHeaderMapping, setManualHeaderMapping] = useState({}); // Maps templateKey -> excelHeader
  const [allUploadsSuccessful, setAllUploadsSuccessful] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isInfoBoxCollapsed, setIsInfoBoxCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const tableScrollRef = useRef(null);
  const exampleTableScrollRef = useRef(null);

  const clientId = LenaCookiesManager.getClientId() || null;
  const clientName = LenaCookiesManager.getClientInfo()?.client_name || null;

  const { mutateAsync: addUnitViaExcel, isError } = useAddUnit(true);

  // Memoized expensive computations
  const getTemplateColumnStatus = useCallback((templateKey) => {
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
  }, [parsedData, manualHeaderMapping]);

  // Memoize template column statuses for all columns
  const templateColumnStatuses = useMemo(() => {
    if (!parsedData) return {};
    return Object.fromEntries(
      excelTemplateColumns.map(col => [col.key, getTemplateColumnStatus(col.key)])
    );
  }, [parsedData, manualHeaderMapping, getTemplateColumnStatus]);

  // Memoize used Excel headers
  const usedExcelHeaders = useMemo(() => {
    if (!parsedData) return new Set();
    const used = new Set();
    
    excelTemplateColumns.forEach(templateCol => {
      const status = getTemplateColumnStatus(templateCol.key);
      if (status.excelHeader) {
        used.add(status.excelHeader);
      }
    });
    
    return used;
  }, [parsedData, manualHeaderMapping, getTemplateColumnStatus]);

  // Memoize missing columns
  const missingColumns = useMemo(() => {
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
  }, [parsedData, manualHeaderMapping, getTemplateColumnStatus]);

  // Apply mapping and transform data (uses already-parsed rawExcelData)
  // Wrapper around the processor function to handle state updates
  // FIX: Accept rawDataParam to avoid React state closure issue
  const applyMappingToData = useCallback(async (rawDataParam = null, manualMapping = null, isReapply = false) => {
    // Use parameter if provided, otherwise fall back to state
    const dataToProcess = rawDataParam || rawExcelData;
    if (!dataToProcess) return;

    if (isReapply) {
      setIsReapplyingMapping(true);
    } else {
      setIsProcessing(true);
    }
    setError(null);

    try {
      // Use the passed mapping or fall back to state (for React state closure issue)
      const currentManualMapping = manualMapping !== null ? manualMapping : manualHeaderMapping;
      
      // Call the processor function
      const processedData = await applyMappingToDataProcessor(dataToProcess, currentManualMapping);

      // Update state with processed data
      setParsedData(processedData);

      if (isReapply) {
        setIsReapplyingMapping(false);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error applying mapping:", err);
      setError(err.message || "Failed to apply mapping");
      if (isReapply) {
        setIsReapplyingMapping(false);
      } else {
        setIsProcessing(false);
      }
    }
  }, [rawExcelData, manualHeaderMapping]);

  // Create debounced re-apply mapping function (doesn't re-parse file)
  const debouncedReapplyMapping = useMemo(
    () => debounce((mapping) => {
      if (rawExcelData) {
        // Pass null for rawDataParam to use state (rawExcelData is already set at this point)
        // Set isReapply=true to use isReapplyingMapping flag instead of isProcessing
        applyMappingToData(null, mapping, true);
      }
    }, 300),
    [rawExcelData, applyMappingToData]
  );

  // Virtualizer for table rows (only when parsedData exists)
  const rowVirtualizer = useVirtualizer({
    count: parsedData?.rows?.length || 0,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 40, // Estimated row height
    overscan: 5, // Render 5 extra rows outside viewport
    enabled: !!parsedData && !isProcessing,
  });

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

  // Scroll to show required fields (always at start since columns are not reversed)
  useEffect(() => {
    // Scroll preview table to start to show required fields
    if (parsedData && tableScrollRef.current) {
      const scrollContainer = tableScrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollLeft = 0;
      }, 100);
    }
    // Scroll example table to start to show required fields
    if (exampleTableScrollRef.current) {
      const scrollContainer = exampleTableScrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollLeft = 0;
      }, 100);
    }
  }, [parsedData, isOpen]);

  // Auto-collapse info box after 3 seconds when parsedData is set
  useEffect(() => {
    if (parsedData && !isProcessing) {
      const timer = setTimeout(() => {
        setIsInfoBoxCollapsed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [parsedData, isProcessing]);

  // Handle header mapping change (must be before early return)
  const handleHeaderMappingChange = useCallback((templateKey, excelHeader) => {
    setManualHeaderMapping(prev => {
      const updated = { ...prev };
      if (excelHeader) {
        updated[templateKey] = excelHeader;
      } else {
        delete updated[templateKey];
      }
      
      // Debounce the re-apply mapping (doesn't re-parse file, just re-applies mapping)
      // Pass the updated mapping directly to avoid React state closure issue
      debouncedReapplyMapping(updated);
      
      return updated;
    });
  }, [debouncedReapplyMapping]);

  /**
   * Validates all required fields before upload
   * Returns array of validation errors
   */
  const validateRequiredFields = useCallback(() => {
    if (!parsedData) return [];
    
    const errors = [];
    
    // Get all required columns
    const requiredColumns = excelTemplateColumns.filter(col => col.is_required);
    
    requiredColumns.forEach(templateCol => {
      const status = templateColumnStatuses[templateCol.key] || getTemplateColumnStatus(templateCol.key);
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
    
    // Validate landArea > 0 and totalPrice > 10000 for all units
    parsedData.units.forEach((unit, index) => {
      const unitNumber = index + 1;
      
      // Check landArea >= 1
      if (unit.landArea === undefined || unit.landArea === null || unit.landArea < 1) {
        errors.push({
          field: 'landArea',
          label: 'Land Area',
          type: 'invalid_value',
          message: `Unit ${unitNumber}: Land Area must be at least 1 (current value: ${unit.landArea})`,
        });
      }
      
      // Check totalPrice > 200000
      if (unit.totalPrice === undefined || unit.totalPrice === null || unit.totalPrice <= 200000) {
        errors.push({
          field: 'totalPrice',
          label: 'Total Price',
          type: 'invalid_value',
          message: `Unit ${unitNumber}: Total Price must be greater than 200,000 (current value: ${unit.totalPrice})`,
        });
      }
    });
    
    return errors;
  }, [parsedData, templateColumnStatuses, getTemplateColumnStatus]);

  if (!isOpen) return null;

  // Parse Excel file only (doesn't do mapping/transformation)
  // Wrapper around the processor function to handle state updates
  const parseExcelFileOnlyLocal = async (file) => {
    setError(null);

    try {
      // Use the processor function
      const rawData = await parseExcelFileOnly(file);
      
      // Store raw Excel data (for other uses like debounced re-apply)
      setRawExcelData(rawData);
      
      // FIX: Return rawData so it can be passed directly to avoid closure issue
      return rawData;
    } catch (err) {
      console.error("Error parsing Excel file:", err);
      setError(err.message || "Failed to parse Excel file");
      throw err;
    }
  };


  // Combined handler for initial file parse (parses file then applies mapping)
  const parseExcelFileHandler = async (file, manualMapping = null) => {
    setIsProcessing(true);
    setError(null);

    try {
      // FIX: Get rawData directly and pass it to avoid React state closure issue
      const rawData = await parseExcelFileOnlyLocal(file);
      // Pass rawData directly to avoid closure issue (rawExcelData state may not be updated yet)
      await applyMappingToData(rawData, manualMapping);
    } catch (err) {
      // Error already set by parseExcelFileOnlyLocal or applyMappingToData
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
        setRawExcelData(null);
        setParsedData(null);
        setError(null);
        setIsInfoBoxCollapsed(false);

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
    setRawExcelData(null);
    setParsedData(null);
    setError(null);
    setUploadStatus([]);
    setMissingProjects([]);
    setIsMissingProjectsDialogOpen(false);
    setManualHeaderMapping({});
    setAllUploadsSuccessful(false);
    setShowMissingColumnsWarning(false);
    setValidationErrors([]);
    setIsInfoBoxCollapsed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetDialogState = () => {
    setSelectedFile(null);
    setRawExcelData(null);
    setParsedData(null);
    setError(null);
    setUploadStatus([]);
    setMissingProjects([]);
    setIsMissingProjectsDialogOpen(false);
    setManualHeaderMapping({});
    setAllUploadsSuccessful(false);
    setShowMissingColumnsWarning(false);
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

  const handleSubmit = async () => {
    if (!selectedFile || !parsedData) {
      alert(t.uploadExcel?.noFileSelected || "Please select a file first");
      return;
    }

    // CRITICAL FIX: Re-apply mapping with current manualHeaderMapping before validation/upload
    // This ensures we always use the latest mapping, even if debounce hasn't completed
    if (rawExcelData) {
      setIsReapplyingMapping(true);
      try {
        const processedData = await applyMappingToDataProcessor(rawExcelData, manualHeaderMapping);
        setParsedData(processedData);
        // Wait a tick to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 0));
      } catch (err) {
        console.error("Error re-applying mapping before submit:", err);
        setError(err.message || "Failed to apply mapping");
        setIsReapplyingMapping(false);
        return;
      }
      setIsReapplyingMapping(false);
    }

    // Validate all required fields (now using updated parsedData)
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      setShowMissingColumnsWarning(true);
      return;
    }

    setIsUploading(true);
    setUploadStatus([]);
    setAllUploadsSuccessful(false);
    setMissingProjects([]);
    setIsMissingProjectsDialogOpen(false);

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
        const insertedIds =
          response.data.inserted_ids || response.data?.summary?.inserted_ids || [];
        const failedUnits =
          response.data.failed_units || response.data?.summary?.failed_units || [];
        const missingProjectsFromApi =
          response.data.missing_projects ||
          response.data?.summary?.missing_projects ||
          [];

        const normalizedMissingProjects = Array.from(
          new Set(
            (Array.isArray(missingProjectsFromApi) ? missingProjectsFromApi : [])
              .filter(Boolean)
              .map((p) => String(p).trim())
              .filter(Boolean)
          )
        );

        if (normalizedMissingProjects.length > 0) {
          setMissingProjects(normalizedMissingProjects);
          setIsMissingProjectsDialogOpen(true);
        }
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

  const formatPreviewCellValue = (templateKey, rawValue) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return "-";

    // Dates: always show date-only text (avoid long timezone strings)
    if (rawValue instanceof Date) {
      const formatted = formatDeliveryDate(rawValue);
      return formatted || "-";
    }

    // Delivery date column: normalize common Excel date representations
    if (templateKey === "deliveryDate") {
      const formatted = formatDeliveryDate(rawValue);
      return formatted || "-";
    }

    return String(rawValue);
  };

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
              onOpen={() => setIsVideoDialogOpen(true)}
              onClose={() => setIsVideoDialogOpen(false)}
              zIndex={101}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className={`px-6 py-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {t.uploadExcel?.cancel || "Cancel"}
            </button>
            {isUploadComplete && missingProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setIsMissingProjectsDialogOpen(true)}
                className="px-4 py-1 bg-red-600 text-white rounded-md transition-opacity flex items-center gap-2 hover:opacity-90"
                title="Some projects were missing during import"
              >
                <AlertCircle size={18} />
                {t.uploadExcel?.missingProjects || "Missing Projects"} (
                {missingProjects.length})
              </button>
            )}
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
                  !selectedFile || !parsedData || isProcessing || isReapplyingMapping || isUploading
                }
                className={`px-6 py-1 bg-primary text-white rounded-md transition-opacity flex items-center gap-2 ${!selectedFile || !parsedData || isProcessing || isReapplyingMapping || isUploading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-90"
                  }`}
              >
                {(isUploading || isReapplyingMapping) && <Loader2 className="animate-spin" size={18} />}
                {isUploading
                  ? t.uploadExcel?.uploading || "Uploading..."
                  : isReapplyingMapping
                    ? t.uploadExcel?.processing || "Processing..."
                    : t.uploadExcel?.upload || "Upload"}
              </button>
            )}
          </div>
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
                  <div ref={exampleTableScrollRef} className="overflow-x-auto" dir="ltr">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        {/* Required Fields Header */}
                        <tr>
                          {(() => {
                            const requiredCols = excelTemplateColumns.filter((col) => col.is_required);
                            const optionalCols = excelTemplateColumns.filter((col) => !col.is_required);
                            
                            return (
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
                          {excelTemplateColumns.map((column) => (
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
                          {excelTemplateColumns.map((column) => (
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

                  {/* Actions */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    <button
                      onClick={handleUploadClick}
                      className="px-16 py-3 bg-primary text-white rounded-md hover:opacity-90 transition-opacity text-base font-semibold shadow-md"
                    >
                      {t.uploadExcel?.browseFiles || "Submit"}
                    </button>

                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <p className="text-sm text-gray-500">
                        {t.uploadExcel?.supportedFormats ||
                          "Supported formats: .xlsx, .xls"}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplateFile();
                        }}
                        className="text-sm text-gray-600 underline underline-offset-2 hover:text-gray-800 transition-colors flex items-center gap-2 bg-transparent border-0 p-0"
                      >
                        <Download size={16} />
                        {t.uploadExcel?.downloadTemplate || "Download Template"}
                      </button>
                    </div>
                  </div>
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
                templateColumnStatuses[col.key]?.isResolved
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setIsInfoBoxCollapsed(!isInfoBoxCollapsed)}
                      className="w-full p-2 flex items-center justify-between hover:bg-blue-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-800 text-xs flex items-center gap-2">
                        <AlertCircle className="text-blue-600" size={14} />
                        {t.uploadExcel?.columnMappingGuide || "Column Mapping Guide"}
                      </h4>
                      <span className="text-xs text-gray-600">
                        {isInfoBoxCollapsed ? "▼" : "▲"}
                      </span>
                    </button>
                    {!isInfoBoxCollapsed && (
                      <div className="px-2 pb-2 text-xs text-gray-700 space-y-1">
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
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden flex-1 flex flex-col" dir="ltr">
                    <div ref={tableScrollRef} className="overflow-x-auto overflow-y-auto flex-1" dir="ltr" style={{ position: 'relative' }}>
                      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                          <col style={{ width: "50px" }} />
                          {excelTemplateColumns.map((_, idx) => (
                            <col key={idx} style={{ width: "110px" }} />
                          ))}
                        </colgroup>
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          {/* Required/Optional Headers */}
                          <tr>
                            {(() => {
                              const requiredCols = excelTemplateColumns.filter((col) => col.is_required);
                              const optionalCols = excelTemplateColumns.filter((col) => !col.is_required);
                              
                              return (
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
                            <th className="px-2 py-1 text-left font-semibold text-gray-700 border-b" style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}>
                              #
                            </th>
                            {excelTemplateColumns.map((templateCol, idx) => {
                              const status = templateColumnStatuses[templateCol.key] || getTemplateColumnStatus(templateCol.key);
                              const isResolved = status.isResolved;
                              const excelHeader = status.excelHeader;
                              const valueWarning = status.valueWarning;
                              
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
                                  style={{ width: "110px", minWidth: "110px", maxWidth: "110px", height: "100px" }}
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
                        <tbody
                          style={{
                            height: parsedData.rows.length > 0 && rowVirtualizer.getVirtualItems().length > 0 ? `${rowVirtualizer.getTotalSize()}px` : 'auto',
                            width: '100%',
                            position: 'relative',
                          }}
                        >
                          {(() => {
                            const virtualItems = rowVirtualizer.getVirtualItems();
                            // Use virtualization if we have items, otherwise fallback to rendering all rows
                            if (virtualItems.length > 0) {
                              return virtualItems.map((virtualRow) => {
                                const rowIndex = virtualRow.index;
                                const row = parsedData.rows[rowIndex];
                                if (!row) return null;
                                return (
                                  <tr
                                    key={virtualRow.key}
                                    data-index={rowIndex}
                                    ref={rowVirtualizer.measureElement}
                                    className={
                                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    }
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: `${virtualRow.size}px`,
                                      transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                  >
                                    <td className="px-2 py-2 text-gray-600 border-b font-medium" style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}>
                                      {rowIndex + 1}
                                    </td>
                                    {excelTemplateColumns.map((templateCol, colIndex) => {
                                      const status = templateColumnStatuses[templateCol.key] || getTemplateColumnStatus(templateCol.key);
                                      const excelHeader = status.excelHeader;
                                      let cellValue = "-";
                                      
                                      if (excelHeader) {
                                        const excelColIndex = excelHeaders.indexOf(excelHeader);
                                        if (excelColIndex >= 0) {
                                          const value = row[excelColIndex];
                                          cellValue = formatPreviewCellValue(templateCol.key, value);
                                        }
                                      }
                                      
                                      return (
                                        <td
                                          key={colIndex}
                                          className="px-2 py-2 text-gray-700 border-b overflow-hidden"
                                          style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                                        >
                                          <div className="truncate" title={cellValue}>
                                            {cellValue}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              });
                            } else {
                              // Fallback: render all rows normally if virtualization isn't working
                              return parsedData.rows.map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className={
                                    rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  }
                                >
                                  <td className="px-2 py-2 text-gray-600 border-b font-medium" style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}>
                                    {rowIndex + 1}
                                  </td>
                                  {excelTemplateColumns.map((templateCol, colIndex) => {
                                    const status = templateColumnStatuses[templateCol.key] || getTemplateColumnStatus(templateCol.key);
                                    const excelHeader = status.excelHeader;
                                    let cellValue = "-";
                                    
                                    if (excelHeader) {
                                      const excelColIndex = excelHeaders.indexOf(excelHeader);
                                      if (excelColIndex >= 0) {
                                        const value = row[excelColIndex];
                                        cellValue = formatPreviewCellValue(templateCol.key, value);
                                      }
                                    }
                                    
                                    return (
                                      <td
                                        key={colIndex}
                                        className="px-2 py-2 text-gray-700 border-b overflow-hidden"
                                        style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                                      >
                                        <div className="truncate" title={cellValue}>
                                          {cellValue}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ));
                            }
                          })()}
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

      {/* Missing Projects Dialog */}
      {isMissingProjectsDialogOpen && missingProjects.length > 0 && (
        <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between py-4 px-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                {t.uploadExcel?.missingProjectsTitle || "Missing projects"}
              </h3>
              <button
                type="button"
                onClick={() => setIsMissingProjectsDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-700 mb-4">
                {t.uploadExcel?.missingProjectsMessage ||
                  "The following projects were not found, so units referencing them were rejected. Please create these projects (or fix their names in the Excel sheet) and re-upload the failed units."}
              </p>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[40vh] overflow-y-auto divide-y">
                  {missingProjects.map((project) => (
                    <div key={project} className="px-4 py-3 bg-red-50">
                      <span className="text-sm font-medium text-red-800">
                        {project}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setIsMissingProjectsDialogOpen(false)}
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
