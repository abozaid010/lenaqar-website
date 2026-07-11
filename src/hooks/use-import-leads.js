"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/utils/query-utils";
import { useI18n } from "@/hooks/useI18n";
import { addManyLeadsAction } from "@/app/(admin)/dashboard/_actions/leads";
import {
  DEFAULT_LEAD_CAMPAIGN_ID,
  DEFAULT_LEAD_PLATFORM,
  formatAllowedPlatformsList,
  normalizeLeadPlatform,
} from "@/constants/lead-import";
import { parseExcelFile } from "@/utils/excel-utils";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  LEAD_FIELD_ALIASES,
  buildColumnMapping,
  buildMergedNotes,
  getRowUnknownPairs,
  isHeaderLikeValue,
} from "@/utils/lead-import-mapping";
import {
  normalizeDigits,
  sanitizePhoneInput,
  phoneToE164,
} from "@/components/phone/phone-utils";

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsvFile = async (file) => {
  const text = await file.text();
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file must include headers and at least one row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => String(header ?? "").trim());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  return { headers, rows };
};

const normalizeImportedPhone = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalizedDigits = normalizeDigits(raw);
  const sanitized = sanitizePhoneInput(normalizedDigits);
  const e164 = phoneToE164(sanitized || normalizedDigits, "EG");

  if (e164) return e164;
  if (sanitized.startsWith("+") && sanitized.length >= 8) return sanitized;
  return null;
};

const validateSheetStructure = ({ headers, rows, translate }) => {
  const errors = [];
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const nonEmptyHeaders = safeHeaders
    .map((header) => String(header ?? "").trim())
    .filter(Boolean);

  const mapping = buildColumnMapping(safeHeaders);

  if (nonEmptyHeaders.length === 0) {
    errors.push({
      code: "NO_HEADERS",
      message: translate(
        "dashboardFilter.importLeads.errors.noHeaders",
        "The file has no column headers. Please use the template or add a header row.",
      ),
    });
  }

  if (safeRows.length === 0) {
    errors.push({
      code: "NO_DATA_ROWS",
      message: translate(
        "dashboardFilter.importLeads.errors.noDataRows",
        "The file has no data rows. Add at least one lead below the header row.",
      ),
    });
  }

  if (mapping.byField.phone === undefined) {
    const foundHeadersLabel = nonEmptyHeaders.length
      ? nonEmptyHeaders.join(", ")
      : translate("common.none", "none");

    errors.push({
      code: "MISSING_PHONE_COLUMN",
      message: translate(
        "dashboardFilter.importLeads.errors.missingPhoneColumn",
        "Could not find a phone column. Expected a column named phone (or mobile, contact, etc.). Found columns: {headers}",
      ).replace("{headers}", foundHeadersLabel),
      foundHeaders: nonEmptyHeaders,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    mapping,
  };
};

const buildInvalidPlatformReason = (value, translate) =>
  translate(
    "dashboardFilter.importLeads.errors.invalidPlatform",
    'Invalid platform "{value}". Allowed values: {allowed}. Leave empty to use "{default}".',
  )
    .replace("{value}", value)
    .replace("{allowed}", formatAllowedPlatformsList())
    .replace("{default}", DEFAULT_LEAD_PLATFORM);

const buildLeadsFromSheet = ({
  headers,
  rows,
  clientId,
  mapping,
  translate,
  defaultAuthor = "",
}) => {
  const resolvedMapping = mapping ?? buildColumnMapping(headers);
  const { byField, unknownColumns } = resolvedMapping;
  const nameIndex = byField.name ?? -1;
  const phoneIndex = byField.phone ?? -1;
  const queryIndex = byField.notes ?? -1;
  const campaignIndex = byField.campaign_id ?? -1;
  const platformIndex = byField.platform ?? -1;
  const authorIndex = byField.author ?? -1;
  const safeDefaultAuthor = String(defaultAuthor ?? "").trim();

  const safeClientId = String(clientId ?? "").trim();
  if (!safeClientId) {
    throw new Error(
      "Missing client ID. Please log out and log in again, then retry import.",
    );
  }

  const validLeadRows = [];
  const skippedRows = [];

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const rawPhone = row[phoneIndex];
    const platformRaw = platformIndex >= 0 ? String(row[platformIndex] ?? "").trim() : "";

    if (
      isHeaderLikeValue(rawPhone, LEAD_FIELD_ALIASES.phone) ||
      (platformRaw && isHeaderLikeValue(platformRaw, LEAD_FIELD_ALIASES.platform))
    ) {
      skippedRows.push({
        rowNumber,
        code: "HEADER_ROW",
        reason: translate(
          "dashboardFilter.importLeads.errors.headerRowSkipped",
          "Skipped header row. Remove duplicate column titles from your data rows.",
        ),
      });
      return;
    }

    const phone_number = normalizeImportedPhone(rawPhone);

    if (!phone_number) {
      skippedRows.push({
        rowNumber,
        reason: translate(
          "dashboardFilter.importLeads.errors.invalidPhone",
          "Phone is missing or invalid",
        ),
      });
      return;
    }

    const rawName = nameIndex >= 0 ? String(row[nameIndex] ?? "").trim() : "";
    const user_name = rawName || phone_number;
    const baseNotes = queryIndex >= 0 ? String(row[queryIndex] ?? "").trim() : "";
    const unknownPairs = getRowUnknownPairs(row, unknownColumns);
    const query = buildMergedNotes(baseNotes, unknownPairs);
    const campaignRaw = campaignIndex >= 0 ? String(row[campaignIndex] ?? "").trim() : "";

    if (platformRaw) {
      const normalizedPlatform = normalizeLeadPlatform(platformRaw);
      if (!normalizedPlatform) {
        skippedRows.push({
          rowNumber,
          code: "INVALID_PLATFORM",
          reason: buildInvalidPlatformReason(platformRaw, translate),
        });
        return;
      }
    }

    const platform = platformRaw
      ? normalizeLeadPlatform(platformRaw)
      : DEFAULT_LEAD_PLATFORM;

    // author: from the sheet's author column when present, otherwise default to
    // the currently logged-in user's email. Sent as a top-level field, never
    // merged into notes.
    const authorRaw = authorIndex >= 0 ? String(row[authorIndex] ?? "").trim() : "";
    const author = authorRaw || safeDefaultAuthor;

    validLeadRows.push({
      rowNumber,
      payload: {
        user_id: crypto.randomUUID(),
        phone_number,
        user_name,
        query,
        client_id: safeClientId,
        platform,
        campaign_id: campaignRaw || DEFAULT_LEAD_CAMPAIGN_ID,
        author,
      },
    });
  });

  return { validLeadRows, skippedRows };
};

const buildImportFailureMessage = ({ result, translate, failedRows }) => {
  if (failedRows.length > 0) {
    const firstFailure = failedRows[0];
    const rowLabel =
      firstFailure.rowNumber !== "—"
        ? translate("dashboardFilter.importLeads.errors.rowPrefix", "Row {row}:").replace(
            "{row}",
            String(firstFailure.rowNumber),
          )
        : "";
    return `${translate(
      "dashboardFilter.importLeads.errors.importFailed",
      "Failed to import leads. Please check your file and try again.",
    )} ${rowLabel} ${firstFailure.reason}`.trim();
  }

  return (
    result?.message ||
    translate(
      "dashboardFilter.importLeads.errors.importFailed",
      "Failed to import leads. Please check your file and try again.",
    )
  );
};

export function useImportLeads({ clientId } = {}) {
  const { t, translate } = useI18n();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  /**
   * Parse the file headers and compute the column mapping so the dialog can show
   * the user which spreadsheet columns map to which fields (and which will be
   * merged into notes) before they commit to importing.
   */
  const previewImport = async (file) => {
    if (!file) {
      setImportPreview(null);
      return null;
    }

    try {
      const fileName = String(file.name || "").toLowerCase();
      const isCsv = file.type === "text/csv" || fileName.endsWith(".csv");
      const sheetData = isCsv
        ? await parseCsvFile(file)
        : await parseExcelFile(file);

      const headers = sheetData.headers || [];
      const mapping = buildColumnMapping(headers);
      const preview = {
        rowCount: sheetData.rows?.length || 0,
        mappedColumns: mapping.mappedColumns,
        unknownColumns: mapping.unknownColumns,
        hasPhone: mapping.byField.phone !== undefined,
      };
      setImportPreview(preview);
      return preview;
    } catch (error) {
      // Preview is best-effort; surface parsing issues at import time instead.
      console.warn("[ImportLeads] preview failed", error?.message);
      setImportPreview(null);
      return null;
    }
  };

  const clearPreview = () => setImportPreview(null);

  const importLeadsFromFile = async (file) => {
    setImportError(null);

    const safeClientId = String(clientId ?? "").trim();
    console.log("[ImportLeads] importLeadsFromFile started", {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      clientId: safeClientId || "(missing)",
    });

    if (!safeClientId) {
      const message = translate(
        "dashboardFilter.importLeads.errors.missingClientId",
        "Missing client ID. Please log out and log in again, then retry import.",
      );
      console.error("[ImportLeads] aborted: missing clientId");
      setImportError(message);
      toast.error(message);
      return { success: false, error: message };
    }

    if (!file) {
      const message = translate(
        "dashboardFilter.importLeads.errors.fileRequired",
        "Please choose a file first.",
      );
      console.error("[ImportLeads] aborted: no file selected");
      setImportError(message);
      toast.error(message);
      return { success: false, error: message };
    }

    setIsImporting(true);
    try {
      let sheetData;
      const fileName = String(file.name || "").toLowerCase();
      const isCsv = file.type === "text/csv" || fileName.endsWith(".csv");

      console.log("[ImportLeads] parsing file", { fileName, isCsv });

      if (isCsv) {
        sheetData = await parseCsvFile(file);
      } else {
        sheetData = await parseExcelFile(file);
      }

      console.log("[ImportLeads] file parsed", {
        headers: sheetData?.headers,
        rowCount: sheetData?.rows?.length,
        sheetName: sheetData?.sheetName,
        sampleRow: sheetData?.rows?.[0],
      });

      const validation = validateSheetStructure({
        headers: sheetData.headers || [],
        rows: sheetData.rows || [],
        translate,
      });

      if (!validation.valid) {
        const primaryError = validation.errors[0]?.message;
        console.error("[ImportLeads] sheet validation failed — API will NOT be called", {
          errors: validation.errors,
          headers: sheetData.headers,
          rowCount: sheetData.rows?.length,
        });
        setImportError(primaryError);
        toast.error(primaryError);
        setLastSummary({
          totalRows: sheetData.rows?.length || 0,
          queuedRows: 0,
          createdRows: 0,
          skippedRows: [],
          failedRows: [],
          validationErrors: validation.errors,
        });
        return { success: false, error: primaryError, validationErrors: validation.errors };
      }

      // Default author = currently logged-in user's email (same source as the
      // bulk-action dialog and dashboard filter). Applied per-row when the sheet
      // has no author value, before the API payload is built.
      const loggedInEmail = String(
        LenaCookiesManager.getClientInfo()?.email ?? "",
      ).trim();

      const { validLeadRows, skippedRows } = buildLeadsFromSheet({
        headers: sheetData.headers || [],
        rows: sheetData.rows || [],
        clientId: safeClientId,
        mapping: validation.mapping,
        translate,
        defaultAuthor: loggedInEmail,
      });
      const validLeads = validLeadRows.map((item) => item.payload);
      const rowNumberByUserId = new Map(
        validLeadRows.map((item) => [String(item.payload.user_id), item.rowNumber]),
      );

      console.log("[ImportLeads] rows processed", {
        totalRows: sheetData.rows?.length || 0,
        validLeads: validLeads.length,
        skippedRows: skippedRows.length,
        skippedSample: skippedRows.slice(0, 3),
        // TEMP author trace: confirm author is a top-level field, not in query.
        defaultAuthor: loggedInEmail || "(none)",
        sampleAuthor: validLeads[0]?.author ?? "(undefined)",
        sampleQueryHasAuthor: /author\s*:/i.test(validLeads[0]?.query || ""),
      });

      if (validLeads.length === 0) {
        const hasInvalidPlatform = skippedRows.some(
          (row) => row.code === "INVALID_PLATFORM",
        );
        const message = hasInvalidPlatform
          ? translate(
              "dashboardFilter.importLeads.errors.allRowsInvalidPlatform",
              "No leads were imported. Every row has an invalid platform value. Allowed values: {allowed}. Leave platform empty to use {default}.",
            )
              .replace("{allowed}", formatAllowedPlatformsList())
              .replace("{default}", DEFAULT_LEAD_PLATFORM)
          : translate(
              "dashboardFilter.importLeads.errors.noValidRows",
              "No valid leads were found in the file.",
            );
        console.error("[ImportLeads] no valid leads — API will NOT be called", {
          totalRows: sheetData.rows?.length,
          skippedRows,
          hasInvalidPlatform,
        });
        setImportError(message);
        toast.error(message);
        setLastSummary({
          totalRows: sheetData.rows?.length || 0,
          queuedRows: 0,
          createdRows: 0,
          skippedRows,
          failedRows: [],
        });
        return { success: false, error: message, skippedRows };
      }

      console.log("[ImportLeads] calling addManyLeadsAction", {
        leadCount: validLeads.length,
        sampleLead: {
          ...validLeads[0],
          phone_number: validLeads[0]?.phone_number?.slice(0, 6) + "…",
        },
      });

      const result = await addManyLeadsAction(validLeads);
      console.log("[ImportLeads] API response", {
        success: result?.success,
        message: result?.message,
        successCount: result?.data?.successCount,
        failedCount: result?.data?.failed?.length,
        failedSample: result?.data?.failed?.slice(0, 3),
      });

      const failedRowsFromApi = (result?.data?.failed || []).map((item) => ({
        rowNumber:
          rowNumberByUserId.get(String(item?.user_id)) ??
          (Number.isInteger(item?.index) && item.index >= 0 ? item.index + 2 : "—"),
        reason: item.reason || translate("common.unknownError", "Unknown error"),
      }));

      const summary = {
        totalRows: sheetData.rows?.length || 0,
        queuedRows: validLeads.length,
        createdRows: result?.data?.successCount || 0,
        skippedRows,
        failedRows: failedRowsFromApi,
      };
      setLastSummary(summary);

      if (summary.createdRows > 0) {
        queryClient.invalidateQueries({ queryKey: userKeys.all });
        queryClient.invalidateQueries({ queryKey: ["campaignSessions"] });
        toast.success(
          translate("dashboardFilter.importLeads.success").replace(
            "{count}",
            String(summary.createdRows),
          ),
        );
      }

      if (summary.createdRows === 0) {
        const failureMessage = buildImportFailureMessage({
          result,
          translate,
          failedRows: failedRowsFromApi,
        });
        console.error("[ImportLeads] API import failed with zero created rows", {
          failureMessage,
          failedRowsFromApi,
        });
        setImportError(failureMessage);
        toast.error(failureMessage);
        return { success: false, error: failureMessage, summary };
      }

      if (summary.skippedRows.length > 0 || summary.failedRows.length > 0) {
        toast(
          translate("dashboardFilter.importLeads.partialResult"),
          { icon: "⚠️" },
        );
      }

      return { success: true, summary };
    } catch (error) {
      const message =
        error?.message ||
        translate(
          "dashboardFilter.importLeads.errors.importFailed",
          "Failed to import leads. Please check your file and try again.",
        );
      console.error("[ImportLeads] import failed", {
        message: error?.message,
        stack: error?.stack,
        error,
      });
      setImportError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsImporting(false);
    }
  };

  const clearImportError = () => setImportError(null);

  return {
    importLeadsFromFile,
    previewImport,
    importPreview,
    clearPreview,
    isImporting,
    lastSummary,
    importError,
    clearImportError,
  };
}
