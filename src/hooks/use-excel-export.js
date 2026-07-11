"use client";

import ExcelJS from "exceljs";
import { useI18n } from "@/context/translate-api";
import { getBuildingTypes } from "@/data/constants";
import en from "../../public/locales/en";
import ar from "../../public/locales/ar";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchUsersData } from "@/utils/api";
import { getActionLabel, parseDashboardActionFilter } from "@/utils/actions";
import { downloadExcelFile } from "@/utils/excel-utils";
import { safeJsonParse } from "@/utils/safeJsonParser";
import { userKeys } from "@/utils/query-utils";

export function useExcelExport(filterKey) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);


  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      return "N/A";
    }
  };

  const formatUserData = (user) => {
    return {
      [t.clientsTable.headers.name]:
        user.name || (locale === "ar" ? "عميل جديد" : "New Lead"),
      [t.clientsTable.headers.userNumber]: user.phone_number || "N/A",
      [t.clientsTable.headers.requirements]:
        BUILDING_TYPES.find((type) => type.value === user.requirement_name)?.[
          locale === "ar" ? "ar_label" : "en_label"
        ] || user.requirement_name,
      [locale === "ar" ? "النقاط" : "Score"]: String(user.score || 0),
      [t.clientsTable.headers.messageCount]: String(user.messages_count || 0),
      [t.clientsTable.headers.action]: getActionLabel(user.last_action, locale),
      [locale === "ar" ? "آخر تحديث" : "Last Update"]: formatDate(
        user.updated_at
      ),
    };
  };

  const createFilterInfo = (filterKeyString, totalRecords) => {
    const filterData = [];
    const parsedParams = safeJsonParse(filterKeyString, {});

    // Date range
    if (parsedParams.start_date) {
      filterData.push({
        [locale === "ar" ? "المرشح" : "Filter"]:
          locale === "ar" ? "تاريخ البداية" : "Start Date",
        [locale === "ar" ? "القيمة" : "Value"]: formatDate(
          parsedParams.start_date
        ),
      });
    }

    if (parsedParams.end_date) {
      filterData.push({
        [locale === "ar" ? "المرشح" : "Filter"]:
          locale === "ar" ? "تاريخ النهاية" : "End Date",
        [locale === "ar" ? "القيمة" : "Value"]: formatDate(
          parsedParams.end_date
        ),
      });
    }

    // Applied action filter
    const appliedActions = parseDashboardActionFilter(parsedParams.action);

    if (appliedActions.length > 0) {
      filterData.push({
        [locale === "ar" ? "المرشح" : "Filter"]:
          locale === "ar" ? "الإجراء المطبق" : "Applied Action",
        [locale === "ar" ? "القيمة" : "Value"]: appliedActions
          .map((action) => getActionLabel(action, locale))
          .join(", "),
      });
    } else {
      filterData.push({
        [locale === "ar" ? "المرشح" : "Filter"]:
          locale === "ar" ? "الإجراء المطبق" : "Applied Action",
        [locale === "ar" ? "القيمة" : "Value"]:
          locale === "ar" ? "جميع الإجراءات" : "All Actions",
      });
    }

    // Total records
    filterData.push({
      [locale === "ar" ? "المرشح" : "Filter"]:
        locale === "ar" ? "إجمالي السجلات" : "Total Records",
      [locale === "ar" ? "القيمة" : "Value"]: String(totalRecords || 0),
    });

    // Export date
    filterData.push({
      [locale === "ar" ? "المرشح" : "Filter"]:
        locale === "ar" ? "تاريخ التصدير" : "Export Date",
      [locale === "ar" ? "القيمة" : "Value"]: formatDate(
        new Date().toISOString()
      ),
    });

    return filterData;
  };

  function triggerDownload(url, fileName) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  const exportToExcel = async (filename = "users_data") => {
    setIsExporting(true);
    let currentUsers = [];

    try {
      const result = await queryClient.fetchQuery({
        queryKey: userKeys.list(filterKey),
        queryFn: () => fetchUsersData(filterKey),
        staleTime: 1000 * 60 * 5,
      });
      currentUsers = result?.users || [];
    } catch (error) {
      console.error("Error loading users for export:", error?.message ?? error);
      alert(
        locale === "ar"
          ? "حدث خطأ أثناء تحميل البيانات للتصدير"
          : "Error loading data for export",
      );
      setIsExporting(false);
      return;
    }

    if (currentUsers.length === 0) {
      alert(locale === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
      setIsExporting(false);
      return;
    }

    try {
      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // 1. Create Clients Data Sheet
      const formattedData = currentUsers.map(formatUserData);
      const columnHeaders = Object.keys(formattedData[0]);
      
      const clientsSheetName = locale === "ar" ? "بيانات العملاء" : "Clients Data";
      const clientsWorksheet = workbook.addWorksheet(clientsSheetName);
      
      // Set columns with specific widths
      const clientsCols = columnHeaders.map((header) => {
        let width = 20;
        if (
          header === t.clientsTable.headers.name ||
          header.includes("Name") ||
          header.includes("الاسم")
        ) {
          width = 30;
        } else if (header === (locale === "ar" ? "النقاط" : "Score")) {
          width = 10;
        } else if (
          header === t.clientsTable.headers.messageCount ||
          header.includes("Messages Count") ||
          header.includes("الرسائل")
        ) {
          width = 16;
        } else if (
          header === t.clientsTable.headers.userNumber ||
          header.includes("Number") ||
          header.includes("رقم")
        ) {
          width = 18;
        } else if (
          header === t.clientsTable.headers.requirements ||
          header.includes("Requirements") ||
          header.includes("المتطلبات")
        ) {
          width = 25;
        } else if (
          header === t.clientsTable.headers.action ||
          header.includes("Action") ||
          header.includes("الإجراء")
        ) {
          width = 20;
        } else if (header.includes("Update") || header.includes("تحديث")) {
          width = 15;
        }
        return { header, key: header, width };
      });
      
      clientsWorksheet.columns = clientsCols;

      // Add data rows
      formattedData.forEach((row) => {
        clientsWorksheet.addRow(row);
      });

      // Style header row and apply alignment to all cells
      clientsWorksheet.eachRow((row, rowIndex) => {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: locale === "ar" ? "right" : "left",
            vertical: "center",
            wrapText: false,
          };
          
          // Style header row
          if (rowIndex === 1) {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
          }
        });
      });

      // 2. Create Filter Info Sheet
      const filterData = createFilterInfo(filterKey, currentUsers.length);
      const filterSheetName = locale === "ar" ? "معلومات المرشح" : "Filter Info";
      const filterWorksheet = workbook.addWorksheet(filterSheetName);
      
      filterWorksheet.columns = [
        { header: locale === "ar" ? "المرشح" : "Filter", key: "filter", width: 25 },
        { header: locale === "ar" ? "القيمة" : "Value", key: "value", width: 30 },
      ];

      // Add filter data
      filterData.forEach((row) => {
        filterWorksheet.addRow(row);
      });

      // Style filter sheet
      filterWorksheet.eachRow((row, rowIndex) => {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: locale === "ar" ? "right" : "left",
            vertical: "center",
            wrapText: false,
          };
          
          if (rowIndex === 1) {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
          }
        });
      });

      // 3. Set the Clients Data sheet as active (default sheet to open)
      workbook.workbookView = {
        activeTab: 0,
        showHorizontalScroll: true,
        showSheetTabs: true,
        showVerticalScroll: true,
        windowHeight: 20000,
        windowWidth: 32000,
        xWindow: 0,
        yWindow: 0,
      };

      // Set RTL for Arabic
      if (locale === "ar") {
        clientsWorksheet.pageSetup = {
          orientation: "portrait",
          paperSize: ExcelJS.Workbook.WorksheetDimension.WORKSHEET_PAGE_SIZE.A4,
          rightToLeft: true,
        };
        filterWorksheet.pageSetup = {
          orientation: "portrait",
          paperSize: ExcelJS.Workbook.WorksheetDimension.WORKSHEET_PAGE_SIZE.A4,
          rightToLeft: true,
        };
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const finalFilename = `${filename}_${currentDate}.xlsx`;

      // Write workbook to buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Trigger download using secure utility
      downloadExcelFile(excelBuffer, finalFilename);
    } catch (error) {
      console.error("Error exporting to Excel:", error?.message ?? error);
      alert(
        locale === "ar"
          ? "حدث خطأ أثناء التصدير"
          : "Error occurred while exporting"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    isExporting,
  };
}
