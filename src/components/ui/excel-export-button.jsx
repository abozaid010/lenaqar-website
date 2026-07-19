"use client";

import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";
import { useI18n } from "@/hooks/useI18n";
import { useExcelExport } from "@/hooks/use-excel-export";
import { buildDashboardFilterKey } from "@/utils/dashboard-filter-key";
import { FileDown, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

function ExcelExportButtonInner({ compact = false }) {
  const { translate } = useI18n();
  const searchParams = useSearchParams();
  const filterKey = useMemo(
    () => buildDashboardFilterKey(searchParams),
    [searchParams],
  );
  const { exportToExcel, isExporting } = useExcelExport(filterKey);

  const handleExport = () => {
    if (isExporting) return;
    exportToExcel("clients_data");
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      aria-busy={isExporting}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[44px] sm:min-w-fit whitespace-nowrap ${compact ? "h-9 min-h-[36px]" : "h-10"}`}
      title={translate("dashboardFilter.actions.exportExcel")}
    >
      {isExporting ? (
        <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 animate-spin" />
      ) : (
        <FileDown size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
      )}
      <span className="hidden sm:inline">
        {translate("dashboardFilter.actions.exportExcel")}
      </span>
    </button>
  );
}

export default function ExcelExportButton(props) {
  return (
    <SearchParamsWrapper>
      <ExcelExportButtonInner {...props} />
    </SearchParamsWrapper>
  );
}
