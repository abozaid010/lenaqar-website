"use client";

import { useI18n } from "@/hooks/useI18n";
import { useExcelExport } from "@/hooks/use-excel-export";
import { FileDown } from "lucide-react";

export default function ExcelExportButton({ searchParams, compact = false }) {
  const { translate } = useI18n();
  const { exportToExcel, isLoading, users } = useExcelExport(searchParams);

  const handleExport = () => {
    exportToExcel("clients_data");
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading || !users || users.length === 0}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[44px] sm:min-w-fit whitespace-nowrap ${compact ? "h-9 min-h-[36px]" : "h-10"}`}
      title={translate("dashboardFilter.actions.exportExcel")}
    >
      <FileDown size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
      <span className="hidden sm:inline">
        {translate("dashboardFilter.actions.exportExcel")}
      </span>
    </button>
  );
}
