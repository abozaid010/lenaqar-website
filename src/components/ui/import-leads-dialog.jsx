"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import {
  DEFAULT_LEAD_PLATFORM,
  formatAllowedPlatformsList,
  LEAD_IMPORT_TEMPLATE_COLUMNS,
  LEAD_IMPORT_TEMPLATE_EXAMPLE_ROW,
} from "@/constants/lead-import";
import { useI18n } from "@/hooks/useI18n";
import { useImportLeads } from "@/hooks/use-import-leads";

export default function ImportLeadsDialog({ isOpen, onClose, clientId }) {
  const { translate, locale } = useI18n();
  const isRTL = locale === "ar";
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const {
    importLeadsFromFile,
    isImporting,
    lastSummary,
    importError,
    clearImportError,
  } = useImportLeads({ clientId });

  const requiredColumns = useMemo(
    () => [
      {
        key: "phone",
        label: translate("dashboardFilter.importLeads.columns.phone"),
      },
    ],
    [translate],
  );

  const optionalColumns = useMemo(
    () => [
      {
        key: "name",
        label: translate("dashboardFilter.importLeads.columns.name"),
      },
      {
        key: "notes",
        label: translate("dashboardFilter.importLeads.columns.notes"),
      },
      {
        key: "campaign_id",
        label: translate("dashboardFilter.importLeads.columns.campaignId"),
      },
      {
        key: "platform",
        label: translate("dashboardFilter.importLeads.columns.platform"),
      },
    ],
    [translate],
  );

  const allowedPlatforms = useMemo(() => formatAllowedPlatformsList(), []);

  const downloadTemplate = () => {
    const headerLine = LEAD_IMPORT_TEMPLATE_COLUMNS.join(",");
    const exampleLines = [
      LEAD_IMPORT_TEMPLATE_EXAMPLE_ROW,
      [
        "Jane Smith",
        "+201098765432",
        "Follow up next week",
        "summer_campaign",
        "whatsapp",
      ],
    ].map((row) => row.join(","));
    const csvContent = `${headerLine}\n${exampleLines.join("\n")}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    clearImportError();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    clearImportError();
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    const result = await importLeadsFromFile(selectedFile);
    if (result.success) {
      resetAndClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {translate("dashboardFilter.importLeads.title")}
            </h3>
          </div>
          <button
            onClick={resetAndClose}
            className="icon-btn h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label={translate("common.close", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700 space-y-2">
            <p className="font-medium text-primary">
              {translate("dashboardFilter.importLeads.columnsGuideTitle")}
            </p>
            <p>
              {translate("dashboardFilter.importLeads.requiredColumnsText")}{" "}
              <span className="font-semibold">
                {requiredColumns.map((column) => column.label).join(", ")}
              </span>
            </p>
            <p>
              {translate("dashboardFilter.importLeads.optionalColumnsText")}{" "}
              <span className="font-medium">
                {optionalColumns.map((column) => column.label).join(", ")}
              </span>
            </p>
            <p className="text-xs text-gray-600">
              {translate("dashboardFilter.importLeads.aliasesNotice")}
            </p>
            <div className="rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">
                {translate("dashboardFilter.importLeads.platformGuideTitle")}
              </p>
              <p>
                {translate("dashboardFilter.importLeads.platformGuideText")
                  .replace("{default}", DEFAULT_LEAD_PLATFORM)}
              </p>
              <p className="font-mono text-[11px] break-words text-primary">
                {allowedPlatforms}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
              >
                <Download className="h-4 w-4" />
                <span>
                  {translate("dashboardFilter.importLeads.downloadTemplate")}
                </span>
              </button>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            {translate("dashboardFilter.importLeads.fileLabel")}
          </label>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            <p className="mt-2 text-xs text-gray-500">
              {translate("dashboardFilter.importLeads.fileHelp")}
            </p>
          </div>

          {selectedFile && (
            <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
              {translate("dashboardFilter.importLeads.selectedFile")}{" "}
              <span className="font-medium">{selectedFile.name}</span>
            </div>
          )}

          {importError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-2"
            >
              <p className="font-medium">
                {translate("dashboardFilter.importLeads.errors.importFailedTitle")}
              </p>
              <p>{importError}</p>
              {lastSummary?.skippedRows?.length > 0 && (
                <ul className="text-xs space-y-1 max-h-28 overflow-y-auto pt-1 border-t border-red-200/60">
                  {lastSummary.skippedRows.slice(0, 8).map((item) => (
                    <li key={`error-skipped-${item.rowNumber}`}>
                      #{item.rowNumber}: {item.reason}
                    </li>
                  ))}
                </ul>
              )}
              {lastSummary?.failedRows?.length > 0 && (
                <ul className="text-xs space-y-1 max-h-28 overflow-y-auto pt-1 border-t border-red-200/60">
                  {lastSummary.failedRows.slice(0, 8).map((item) => (
                    <li key={`error-failed-${item.rowNumber}`}>
                      #{item.rowNumber}: {item.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {lastSummary && (
            <div className="rounded-lg border border-gray-200 p-3 text-sm space-y-1">
              <p>
                {translate("dashboardFilter.importLeads.summary.totalRows").replace("{count}", String(lastSummary.totalRows || 0))}
              </p>
              <p>
                {translate("dashboardFilter.importLeads.summary.createdRows").replace("{count}", String(lastSummary.createdRows || 0))}
              </p>
              <p>
                {translate("dashboardFilter.importLeads.summary.skippedRows").replace("{count}", String(lastSummary.skippedRows?.length || 0))}
              </p>
              <p>
                {translate("dashboardFilter.importLeads.summary.failedRows").replace("{count}", String(lastSummary.failedRows?.length || 0))}
              </p>
              {lastSummary.skippedRows?.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium text-amber-700">
                    {translate("dashboardFilter.importLeads.summary.skippedDetails")}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 mt-1 max-h-24 overflow-y-auto">
                    {lastSummary.skippedRows.slice(0, 5).map((item) => (
                      <li key={`skipped-${item.rowNumber}`}>
                        #{item.rowNumber}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lastSummary.failedRows?.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium text-red-700">
                    {translate("dashboardFilter.importLeads.summary.failedDetails")}
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 mt-1 max-h-24 overflow-y-auto">
                    {lastSummary.failedRows.slice(0, 5).map((item) => (
                      <li key={`failed-${item.rowNumber}`}>
                        #{item.rowNumber}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={isImporting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {translate("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {translate("dashboardFilter.importLeads.importing")}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>
                    {translate("dashboardFilter.importLeads.importButton")}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
