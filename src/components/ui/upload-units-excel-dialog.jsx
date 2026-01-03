"use client";

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
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
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

const downloadTemplateFile = () => {
  const link = document.createElement("a");
  link.href = "/unit_upload_template.xlsx";
  link.download = "unit_upload_template.xlsx";
  link.click();
};


export default function UploadUnitsExcelDialog({ isOpen, onClose }) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [showMissingColumnsWarning, setShowMissingColumnsWarning] = useState(false);
  const [missingColumns, setMissingColumns] = useState([]);
  const [manualHeaderMapping, setManualHeaderMapping] = useState({}); // Maps templateKey -> excelHeader
  const fileInputRef = useRef(null);

  const clientId = LenaCookiesManager.getClientId() || null;
  const clientName = LenaCookiesManager.getClientInfo()?.client_name || null;

  const { mutateAsync: addUnitViaExcel, isError } = useAddUnit(true);

  if (!isOpen) return null;

  const parseExcelFile = async (file) => {
    setIsProcessing(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error(
          "No worksheet found in the Excel file. Please ensure your file contains at least one worksheet."
        );
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length < 2) {
        throw new Error(
          "Excel file must contain headers and at least one data row."
        );
      }

      const excelHeaders = jsonData[0];

      const rows = jsonData.slice(1).filter((row) => {
        // Filter out completely empty rows
        return row.some(
          (cell) => cell !== undefined && cell !== null && cell !== ""
        );
      });

      // Create automatic mapping from Excel headers to template keys
      const autoHeaderMapping = createHeaderMapping(excelHeaders);
      
      // Create reverse mapping: templateKey -> excelHeader (for auto-mapped columns)
      const autoTemplateToExcel = {};
      Object.entries(autoHeaderMapping).forEach(([excelHeader, templateKey]) => {
        if (!autoTemplateToExcel[templateKey]) {
          autoTemplateToExcel[templateKey] = excelHeader;
        }
      });

      // Merge auto mapping with manual mapping (manual takes precedence)
      const templateToExcelMapping = { ...autoTemplateToExcel, ...manualHeaderMapping };

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
              if (value !== undefined && value !== null && value !== "") {
                unit[templateCol.key] = value;
              }
            }
          }
        });

        return unit;
      });

      // Transform to final structure with payment plans
      const transformedUnits = units.map((unit) => {
        const transformed = {
          // Basic details
          clientId: clientId,
          clientName: clientName,
          country: "Egypt",
          dataSource: "website",
          purpose: "sell",
          unitId: uuidv4(),
          // sheet data
          buildingType: unit.buildingType || "",
          project: unit.project || "",
          // project_ar: unit.project_ar || "",
          view: unit.view || "",
          phase: unit.phase || "",
          // city: unit.city || "",
          // district: unit.district || "",
          // developer: unit.developer || "",
          unitTitle: unit.unitTitle || "",
          // deliveryStatus: unit.deliveryStatus || "",
          bathroomCount: unit.bathroomCount ? Number(unit.bathroomCount) : 0,
          floor: unit.floor ? Number(unit.floor) : 0,
          roomsCount: unit.roomsCount ? unit.roomsCount : "",
          landArea: unit.landArea ? Number(unit.landArea) : 0,
          gardenSize: unit.gardenSize ? Number(unit.gardenSize) : 0,
          finishing: unit.finishing || "",
          furnishing: unit.furnishing || "",
          garageArea: unit.garageArea ? Number(unit.garageArea) : 0,
          images: [], // Images not supported in Excel upload
          model: unit.model || "",
          downPayment: unit.downPayment ? Number(unit.downPayment) : 0,
          totalPrice: unit.totalPrice ? Number(unit.totalPrice) : 0,
          deliveryDate: unit.deliveryDate || "",
          // paymentPlans: [],
          // // Owner details (shown only for brokers)
          // owner_name: unit.owner_name || "",
          // owner_mobile: unit.owner_mobile || "",
        };

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

        return transformed;
      });

      setParsedData({
        excelHeaders, // Excel sheet headers (first row)
        templateToExcelMapping, // Maps template key -> Excel header
        rows,
        units: transformedUnits,
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

        parseExcelFile(file);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleHeaderMappingChange = (templateKey, excelHeader) => {
    setManualHeaderMapping(prev => {
      const updated = { ...prev };
      if (excelHeader) {
        updated[templateKey] = excelHeader;
      } else {
        delete updated[templateKey];
      }
      return updated;
    });

    // Re-parse the file with the updated mapping
    if (selectedFile) {
      parseExcelFile(selectedFile);
    }
  };

  const getTemplateColumnStatus = (templateKey) => {
    if (!parsedData) return { isResolved: false, excelHeader: null, isManual: false };
    
    // Check if manually mapped
    if (manualHeaderMapping[templateKey]) {
      return {
        isResolved: true,
        excelHeader: manualHeaderMapping[templateKey],
        isManual: true
      };
    }
    
    // Check if auto-mapped
    const autoMapped = parsedData.templateToExcelMapping[templateKey];
    if (autoMapped) {
      return {
        isResolved: true,
        excelHeader: autoMapped,
        isManual: false
      };
    }
    
    return { isResolved: false, excelHeader: null, isManual: false };
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

  const handleSubmit = async () => {
    if (!selectedFile || !parsedData) {
      alert(t.uploadExcel?.noFileSelected || "Please select a file first");
      return;
    }

    // Check for missing columns
    const missing = getMissingColumns();
    if (missing.length > 0) {
      setMissingColumns(missing);
      setShowMissingColumnsWarning(true);
      return;
    }

    setIsUploading(true);
    setUploadStatus([]);

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

        // Only auto-close if all units succeeded
        if (totalInserted === totalSent && failedUnits.length === 0) {
          setTimeout(() => {
            onClose();
          }, 1500);
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
          </div>
          <button
            onClick={onClose}
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
                        <tr className="bg-gray-100">
                          {excelTemplateColumns.map((column) => (
                            <th
                              key={column.key}
                              className="px-4 py-2 text-left font-semibold text-gray-700 border border-gray-300"
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
                              className="px-4 py-2 text-gray-700 border border-gray-300"
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
                      className="px-6 py-2 text-primary hover:underline transition-all flex items-center gap-2"
                    >
                      <Download size={18} />
                      {t.uploadExcel?.downloadTemplate || "Download Template"}
                    </button>
                    <button
                      onClick={handleUploadClick}
                      className="px-12 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
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

            {/* Instructions */}
            {!parsedData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t.uploadExcel?.instructions || "Instructions:"}
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    {t.uploadExcel?.instruction1 ||
                      "Upload an Excel file with unit data in the first worksheet"}
                  </li>
                  <li>
                    {t.uploadExcel?.instruction2 ||
                      "First row must contain column headers (buildingType, project, phase, view, etc.)"}
                  </li>
                  <li>
                    {t.uploadExcel?.instruction3 ||
                      "Required fields are marked with asterisk (*) - they must be mapped to upload"}
                  </li>
                  <li>
                    {t.uploadExcel?.instruction4 ||
                      "Optional fields can be left unmapped - data will still upload successfully"}
                  </li>
                </ul>
              </div>
            )}

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
                      Column Mapping Guide
                    </h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span><strong>Green:</strong> Mapped column</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span><strong>Red:</strong> Required field not mapped - must select</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded"></div>
                        <span><strong>Yellow:</strong> Optional field not mapped</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">*</span>
                        <span><strong>Asterisk (*):</strong> Required field</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden flex-1 flex flex-col" dir="ltr">
                    <div className="overflow-x-auto overflow-y-auto flex-1">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b" style={{ minWidth: "40px", maxWidth: "50px" }}>
                              #
                            </th>
                            {excelTemplateColumns.map((templateCol, idx) => {
                              const status = getTemplateColumnStatus(templateCol.key);
                              const isResolved = status.isResolved;
                              const excelHeader = status.excelHeader;
                              const usedExcelHeaders = getUsedExcelHeaders();
                              
                              return (
                                <th
                                  key={idx}
                                  className={`px-2 py-2 text-left font-semibold border-b ${
                                    isResolved 
                                      ? "bg-green-100 text-green-800" 
                                      : templateCol.is_required
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-50 text-yellow-800"
                                  }`}
                                  style={{ minWidth: "80px", maxWidth: "120px" }}
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs mb-1 font-semibold truncate" title={templateCol.label}>
                                      {templateCol.label} {templateCol.is_required ? "*" : ""} {isResolved ? "✓" : ""}
                                    </span>
                                    {isResolved && (
                                      <span className="text-xs font-normal mb-1 truncate" style={{color: "#059669"}} title={excelHeader}>
                                        ← {excelHeader}
                                      </span>
                                    )}
                                    <select
                                      value={excelHeader || ""}
                                      onChange={(e) => handleHeaderMappingChange(templateCol.key, e.target.value)}
                                      className={`text-xs px-1 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${
                                        isResolved 
                                          ? "border-green-400" 
                                          : templateCol.is_required
                                            ? "border-red-400"
                                            : "border-yellow-400"
                                      }`}
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
                              {excelTemplateColumns.map((templateCol, colIndex) => {
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
                                    style={{ minWidth: "80px", maxWidth: "120px" }}
                                  >
                                    <div className="truncate" title={cellValue}>
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
            onClick={onClose}
            disabled={isUploading}
            className={`px-6 py-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {t.uploadExcel?.cancel || "Cancel"}
          </button>
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
        </div>
      </div>

      {/* Missing Columns Warning Dialog */}
      {showMissingColumnsWarning && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between py-4 px-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {t.uploadExcel?.title || "Upload Units Excel Sheet"}
              </h3>
              <button
                onClick={() => setShowMissingColumnsWarning(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                {t.uploadExcel?.missingColumnsWarning || "Make sure sheet contains these missing values before you upload:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {missingColumns.map((key) => (
                  <span
                    key={key}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded-md text-sm font-medium"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowMissingColumnsWarning(false)}
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
