"use client";

import { useI18n } from "@/context/translate-api";
import { BUILDING_TYPES } from "@/data/constants";
import { useUsersData } from "@/hooks/use-users-data";
import { getActionLabel } from "@/utils/actions";
import * as XLSX from "xlsx";

export function useExcelExport(searchParams) {
  const { t, locale } = useI18n();
  const { data: users, isLoading } = useUsersData(JSON.stringify(searchParams));

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

  const createFilterInfo = (searchParams) => {
    const filterData = [];
    const parsedParams =
      typeof searchParams === "string"
        ? JSON.parse(searchParams)
        : searchParams;

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
    if (parsedParams.action && parsedParams.action !== "all") {
      filterData.push({
        [locale === "ar" ? "المرشح" : "Filter"]:
          locale === "ar" ? "الإجراء المطبق" : "Applied Action",
        [locale === "ar" ? "القيمة" : "Value"]: getActionLabel(
          parsedParams.action,
          locale
        ),
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
      [locale === "ar" ? "القيمة" : "Value"]: String(users?.length || 0),
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

  const exportToExcel = (filename = "users_data") => {
    const currentUsers = users || [];

    if (currentUsers.length === 0) {
      alert(locale === "ar" ? "لا توجد بيانات للتصدير" : "No data to export");
      return;
    }

    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // 1. Create Clients Data Sheet
      const formattedData = currentUsers.map(formatUserData);
      const clientsWorksheet = XLSX.utils.json_to_sheet(formattedData);

      const columnHeaders = Object.keys(formattedData[0]);

      // Set specific widths based on column content
      const clientsCols = columnHeaders.map((header) => {
        if (
          header === t.clientsTable.headers.name ||
          header.includes("Name") ||
          header.includes("الاسم")
        ) {
          return { wch: 30 };
        } else if (header === (locale === "ar" ? "النقاط" : "Score")) {
          return { wch: 10 };
        } else if (
          header === t.clientsTable.headers.messageCount ||
          header.includes("Messages Count") ||
          header.includes("الرسائل")
        ) {
          return { wch: 16 };
        } else if (
          header === t.clientsTable.headers.userNumber ||
          header.includes("Number") ||
          header.includes("رقم")
        ) {
          return { wch: 18 };
        } else if (
          header === t.clientsTable.headers.requirements ||
          header.includes("Requirements") ||
          header.includes("المتطلبات")
        ) {
          return { wch: 25 };
        } else if (
          header === t.clientsTable.headers.action ||
          header.includes("Action") ||
          header.includes("الإجراء")
        ) {
          return { wch: 20 };
        } else if (header.includes("Update") || header.includes("تحديث")) {
          return { wch: 15 };
        } else {
          return { wch: 20 };
        }
      });
      clientsWorksheet["!cols"] = clientsCols;

      // Set text alignment for all cells in clients sheet
      const clientsRange = XLSX.utils.decode_range(clientsWorksheet["!ref"]);
      for (let row = clientsRange.s.r; row <= clientsRange.e.r; row++) {
        for (let col = clientsRange.s.c; col <= clientsRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!clientsWorksheet[cellAddress]) continue;

          // Set cell format
          clientsWorksheet[cellAddress].s = {
            alignment: {
              horizontal: locale === "ar" ? "right" : "left",
              vertical: "center",
              wrapText: false,
            },
          };
        }
      }

      // Add clients worksheet to workbook (this will be the default sheet)
      const clientsSheetName =
        locale === "ar" ? "بيانات العملاء" : "Clients Data";
      XLSX.utils.book_append_sheet(
        workbook,
        clientsWorksheet,
        clientsSheetName
      );

      // 2. Create Filter Info Sheet
      const filterData = createFilterInfo(searchParams);
      const filterWorksheet = XLSX.utils.json_to_sheet(filterData);

      // Auto-size columns for filter sheet
      const filterCols = [{ wch: 25 }, { wch: 30 }]; // Filter column wider, Value column wider
      filterWorksheet["!cols"] = filterCols;

      // Set text alignment for filter sheet cells
      const filterRange = XLSX.utils.decode_range(filterWorksheet["!ref"]);
      for (let row = filterRange.s.r; row <= filterRange.e.r; row++) {
        for (let col = filterRange.s.c; col <= filterRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!filterWorksheet[cellAddress]) continue;

          // Set cell format
          filterWorksheet[cellAddress].s = {
            alignment: {
              horizontal: locale === "ar" ? "right" : "left",
              vertical: "center",
              wrapText: false,
            },
          };
        }
      }

      // Add filter worksheet to workbook
      const filterSheetName =
        locale === "ar" ? "معلومات المرشح" : "Filter Info";
      XLSX.utils.book_append_sheet(workbook, filterWorksheet, filterSheetName);

      // 3. Set the Clients Data sheet as active (default sheet to open)
      workbook.Workbook = {
        Views: [{ RTL: locale === "ar" ? true : false }],
      };

      // Set the first sheet (Clients Data) as the active sheet
      if (workbook.Workbook.Sheets) {
        workbook.Workbook.Sheets[0] = { state: "visible" };
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const finalFilename = `${filename}_${currentDate}.xlsx`;

      // Create blob and trigger native browser download
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      triggerDownload(url, finalFilename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert(
        locale === "ar"
          ? "حدث خطأ أثناء التصدير"
          : "Error occurred while exporting"
      );
    }
  };

  return {
    exportToExcel,
    isLoading,
    users,
  };
}
