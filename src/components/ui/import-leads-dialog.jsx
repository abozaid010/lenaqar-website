"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useImportLeads } from "@/hooks/use-import-leads";

export default function ImportLeadsDialog({ isOpen, onClose, clientId }) {
  const { t, translate, locale } = useI18n();
  const isRTL = locale === "ar";
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const { importLeadsFromFile, isImporting, lastSummary } = useImportLeads({ clientId });

  const requiredColumns = useMemo(
    () => [
      {
        key: "phone",
        label: translate(
          "dashboardFilter.importLeads.columns.phone",
          t?.dashboardFilter?.importLeads?.columns?.phone || "phone",
        ),
      },
    ],
    [t, translate],
  );

  const optionalColumns = useMemo(
    () => [
      {
        key: "name",
        label: translate(
          "dashboardFilter.importLeads.columns.name",
          t?.dashboardFilter?.importLeads?.columns?.name || "name",
        ),
      },
      {
        key: "notes",
        label: translate(
          "dashboardFilter.importLeads.columns.notes",
          t?.dashboardFilter?.importLeads?.columns?.notes || "notes",
        ),
      },
      {
        key: "campaign_id",
        label: translate(
          "dashboardFilter.importLeads.columns.campaignId",
          t?.dashboardFilter?.importLeads?.columns?.campaignId || "campaign_id",
        ),
      },
      {
        key: "platform",
        label: translate(
          "dashboardFilter.importLeads.columns.platform",
          t?.dashboardFilter?.importLeads?.columns?.platform || "platform",
        ),
      },
    ],
    [t, translate],
  );

  const downloadTemplate = () => {
    const headerLine = ["name", "phone", "notes", "campaign_id", "platform"].join(",");
    const exampleLine = [
      "John Doe",
      "+201012345678",
      "Interested in 2 bedroom apartment",
      "summer_campaign",
      "website",
    ].join(",");
    const csvContent = `${headerLine}\n${exampleLine}\n`;
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
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
              {translate(
                "dashboardFilter.importLeads.title",
                t?.dashboardFilter?.importLeads?.title || "Import Leads",
              )}
            </h3>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label={translate("common.close", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700 space-y-2">
            <p className="font-medium text-primary">
              {translate(
                "dashboardFilter.importLeads.columnsGuideTitle",
                t?.dashboardFilter?.importLeads?.columnsGuideTitle ||
                  "Columns that are read and saved",
              )}
            </p>
            <p>
              {translate(
                "dashboardFilter.importLeads.requiredColumnsText",
                t?.dashboardFilter?.importLeads?.requiredColumnsText ||
                  "Required column:",
              )}{" "}
              <span className="font-semibold">
                {requiredColumns.map((column) => column.label).join(", ")}
              </span>
            </p>
            <p>
              {translate(
                "dashboardFilter.importLeads.optionalColumnsText",
                t?.dashboardFilter?.importLeads?.optionalColumnsText ||
                  "Optional columns:",
              )}{" "}
              <span className="font-medium">
                {optionalColumns.map((column) => column.label).join(", ")}
              </span>
            </p>
            <p className="text-xs text-gray-600">
              {translate(
                "dashboardFilter.importLeads.aliasesNotice",
                t?.dashboardFilter?.importLeads?.aliasesNotice ||
                  "Common alias names are accepted for these columns.",
              )}
            </p>
            <div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
              >
                <Download className="h-4 w-4" />
                <span>
                  {translate(
                    "dashboardFilter.importLeads.downloadTemplate",
                    t?.dashboardFilter?.importLeads?.downloadTemplate ||
                      "Download template",
                  )}
                </span>
              </button>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            {translate(
              "dashboardFilter.importLeads.fileLabel",
              t?.dashboardFilter?.importLeads?.fileLabel || "Sheet File",
            )}
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
              {translate(
                "dashboardFilter.importLeads.fileHelp",
                t?.dashboardFilter?.importLeads?.fileHelp ||
                  "Accepted formats: .xlsx, .xls, .csv",
              )}
            </p>
          </div>

          {selectedFile && (
            <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
              {translate(
                "dashboardFilter.importLeads.selectedFile",
                t?.dashboardFilter?.importLeads?.selectedFile || "Selected file:",
              )}{" "}
              <span className="font-medium">{selectedFile.name}</span>
            </div>
          )}

          {lastSummary && (
            <div className="rounded-lg border border-gray-200 p-3 text-sm space-y-1">
              <p>
                {translate(
                  "dashboardFilter.importLeads.summary.totalRows",
                  t?.dashboardFilter?.importLeads?.summary?.totalRows || "Rows read: {count}",
                ).replace("{count}", String(lastSummary.totalRows || 0))}
              </p>
              <p>
                {translate(
                  "dashboardFilter.importLeads.summary.createdRows",
                  t?.dashboardFilter?.importLeads?.summary?.createdRows ||
                    "Leads created: {count}",
                ).replace("{count}", String(lastSummary.createdRows || 0))}
              </p>
              <p>
                {translate(
                  "dashboardFilter.importLeads.summary.skippedRows",
                  t?.dashboardFilter?.importLeads?.summary?.skippedRows ||
                    "Rows skipped: {count}",
                ).replace("{count}", String(lastSummary.skippedRows?.length || 0))}
              </p>
              <p>
                {translate(
                  "dashboardFilter.importLeads.summary.failedRows",
                  t?.dashboardFilter?.importLeads?.summary?.failedRows ||
                    "Rows failed: {count}",
                ).replace("{count}", String(lastSummary.failedRows?.length || 0))}
              </p>
              {lastSummary.skippedRows?.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium text-amber-700">
                    {translate(
                      "dashboardFilter.importLeads.summary.skippedDetails",
                      t?.dashboardFilter?.importLeads?.summary?.skippedDetails ||
                        "Skipped rows:",
                    )}
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
                    {translate(
                      "dashboardFilter.importLeads.summary.failedDetails",
                      t?.dashboardFilter?.importLeads?.summary?.failedDetails ||
                        "Failed rows:",
                    )}
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
              {translate("common.cancel", t?.common?.cancel || "Cancel")}
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
                    {translate(
                      "dashboardFilter.importLeads.importing",
                      t?.dashboardFilter?.importLeads?.importing || "Importing...",
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>
                    {translate(
                      "dashboardFilter.importLeads.importButton",
                      t?.dashboardFilter?.importLeads?.importButton || "Import Leads",
                    )}
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
