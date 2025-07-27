"use client";

import { useI18n } from "@/context/translate-api";
import { useExcelExport } from "@/hooks/use-excel-export";
import { FileDown } from "lucide-react";

export default function ExcelExportButton({ searchParams }) {
  const { t } = useI18n();
  const { exportToExcel, isLoading, users } = useExcelExport(searchParams);

  const handleExport = () => {
    exportToExcel("clients_data");
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading || !users || users.length === 0}
      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      title={t.dashboardFilter.actions.exportExcel}
    >
      <FileDown size={16} />
      {t.dashboardFilter.actions.exportExcel}
    </button>
  );
}
