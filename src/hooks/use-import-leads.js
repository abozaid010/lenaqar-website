"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/utils/query-utils";
import { useI18n } from "@/hooks/useI18n";
import { addManyLeadsAction } from "@/app/(admin)/dashboard/_actions/leads";
import { parseExcelFile } from "@/utils/excel-utils";
import {
  normalizeDigits,
  sanitizePhoneInput,
  phoneToE164,
} from "@/components/phone/phone-utils";

const HEADER_ALIASES = {
  user_name: [
    "name",
    "user name",
    "username",
    "lead name",
    "full name",
    "client name",
    "customer name",
  ],
  phone_number: [
    "phone",
    "phone number",
    "phone_number",
    "mobile",
    "mobile number",
    "contact",
    "contact number",
    "whatsapp",
    "whatsapp number",
    "number",
  ],
  query: ["query", "note", "notes", "comment", "remarks", "message"],
  campaign_id: ["campaign", "campaign id", "campaign_id", "campaign name"],
  platform: ["platform", "source", "lead source", "channel"],
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const detectColumnIndex = (headers, aliases) => {
  const normalizedHeaders = headers.map(normalizeHeader);

  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(normalizeHeader(alias));
    if (index !== -1) return index;
  }

  for (const alias of aliases) {
    const aliasNormalized = normalizeHeader(alias);
    const containsIndex = normalizedHeaders.findIndex(
      (header) => header.includes(aliasNormalized) || aliasNormalized.includes(header),
    );
    if (containsIndex !== -1) return containsIndex;
  }

  return -1;
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

const buildLeadsFromSheet = ({ headers, rows, clientId }) => {
  const nameIndex = detectColumnIndex(headers, HEADER_ALIASES.user_name);
  const phoneIndex = detectColumnIndex(headers, HEADER_ALIASES.phone_number);
  const queryIndex = detectColumnIndex(headers, HEADER_ALIASES.query);
  const campaignIndex = detectColumnIndex(headers, HEADER_ALIASES.campaign_id);
  const platformIndex = detectColumnIndex(headers, HEADER_ALIASES.platform);

  if (phoneIndex === -1) {
    throw new Error("Could not find a phone column in the uploaded sheet.");
  }

  const validLeads = [];
  const skippedRows = [];

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const rawPhone = row[phoneIndex];
    const phone_number = normalizeImportedPhone(rawPhone);

    if (!phone_number) {
      skippedRows.push({
        rowNumber,
        reason: "Phone is missing or invalid",
      });
      return;
    }

    const rawName = nameIndex >= 0 ? String(row[nameIndex] ?? "").trim() : "";
    const user_name = rawName || phone_number;
    const query = queryIndex >= 0 ? String(row[queryIndex] ?? "").trim() : "";
    const campaignRaw = campaignIndex >= 0 ? String(row[campaignIndex] ?? "").trim() : "";
    const platformRaw = platformIndex >= 0 ? String(row[platformIndex] ?? "").trim() : "";

    validLeads.push({
      user_id: crypto.randomUUID(),
      phone_number,
      user_name,
      query,
      client_id: clientId || "public",
      platform: platformRaw || "website",
      campaign_id: campaignRaw || "added_manually",
    });
  });

  return { validLeads, skippedRows };
};

export function useImportLeads({ clientId } = {}) {
  const { t, translate } = useI18n();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);

  const importLeadsFromFile = async (file) => {
    if (!file) {
      toast.error(
        translate(
          "dashboardFilter.importLeads.errors.fileRequired",
          "Please choose a file first.",
        ),
      );
      return { success: false };
    }

    setIsImporting(true);
    try {
      let sheetData;
      const fileName = String(file.name || "").toLowerCase();
      const isCsv = file.type === "text/csv" || fileName.endsWith(".csv");

      if (isCsv) {
        sheetData = await parseCsvFile(file);
      } else {
        sheetData = await parseExcelFile(file);
      }

      const { validLeads, skippedRows } = buildLeadsFromSheet({
        headers: sheetData.headers || [],
        rows: sheetData.rows || [],
        clientId,
      });

      if (validLeads.length === 0) {
        toast.error(
          translate(
            "dashboardFilter.importLeads.errors.noValidRows",
            "No valid leads were found in the file.",
          ),
        );
        setLastSummary({
          totalRows: sheetData.rows?.length || 0,
          queuedRows: 0,
          createdRows: 0,
          skippedRows,
          failedRows: [],
        });
        return { success: false };
      }

      const result = await addManyLeadsAction(validLeads);
      const failedRowsFromApi = (result?.data?.failed || []).map((item) => ({
        rowNumber: Number(item.index) + 2,
        reason: item.reason || "Unknown error",
      }));

      const summary = {
        totalRows: sheetData.rows?.length || 0,
        queuedRows: validLeads.length,
        createdRows: result?.data?.successCount || 0,
        skippedRows,
        failedRows: failedRowsFromApi,
      };
      setLastSummary(summary);

      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"] });

      if (summary.createdRows > 0) {
        toast.success(
          translate(
            "dashboardFilter.importLeads.success",
            t?.dashboardFilter?.importLeads?.success || "Imported {count} lead(s)",
          ).replace("{count}", String(summary.createdRows)),
        );
      }

      if (summary.skippedRows.length > 0 || summary.failedRows.length > 0) {
        toast(
          translate(
            "dashboardFilter.importLeads.partialResult",
            t?.dashboardFilter?.importLeads?.partialResult ||
              "Some rows were skipped or failed. Please review the summary.",
          ),
          { icon: "⚠️" },
        );
      }

      return { success: summary.createdRows > 0, summary };
    } catch (error) {
      console.error("Import leads failed:", error);
      toast.error(
        error?.message ||
          translate(
            "dashboardFilter.importLeads.errors.importFailed",
            "Failed to import leads. Please check your file and try again.",
          ),
      );
      return { success: false, error };
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importLeadsFromFile,
    isImporting,
    lastSummary,
  };
}
