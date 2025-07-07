"use client";

import FormInput from "@/components/ui/inputs/form-input";
import FormSelect from "@/components/ui/inputs/form-select";
import { useI18n } from "@/context/translate-api";
import { ChevronDown, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AverageScore from "./average-score";

const formatDate = (date) => {
  const isoString = date.toISOString();
  const formattedDate = isoString.slice(0, 19);
  return formattedDate;
};

export default function DashbordFilter({ appliedFilters }) {
  const { t } = useI18n();
  const router = useRouter();

  const ACTIONS = [
    { label: t.dashboardFilter.actions.all, value: "" },
    { label: t.dashboardFilter.actions.makeCall, value: "Make a call" },
    { label: t.dashboardFilter.actions.officeVisit, value: "Office visit" },
    { label: t.dashboardFilter.actions.propertyView, value: "Property view" },
    {
      label: t.dashboardFilter.actions.qualifiedLead,
      value: "Qualified lead",
    },
    {
      label: t.dashboardFilter.actions.notInterested,
      value: "Not interested",
    },
    { label: t.dashboardFilter.actions.notQualified, value: "Not qualified" },
    {
      label: t.dashboardFilter.actions.followUpLater,
      value: "Follow up later",
    },
    {
      label: t.dashboardFilter.actions.missingRequirement,
      value: "Missing requirement",
    },
    { label: t.dashboardFilter.actions.blocked, value: "Blocked" },
    { label: t.dashboardFilter.actions.Interested, value: "Interested" },
  ];

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  const twoMonthsAgo = useMemo(() => {
    const date = new Date(tomorrow);
    date.setMonth(tomorrow.getMonth() - 2);
    return date;
  }, [tomorrow]);

  const [filters, setFilters] = useState(() => {
    return {
      action: appliedFilters.action || "",
      start_date: appliedFilters.start_date || formatDate(twoMonthsAgo),
      end_date: appliedFilters.end_date || formatDate(tomorrow),
    };
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDateForDisplay = (date) => {
    const options = { day: "2-digit", month: "short", year: "2-digit" };
    return new Date(date).toLocaleDateString("en-GB", options).replace(",", "");
  };

  const onApplyDateFilter = () => {
    setIsDatePickerOpen(false);
    setFilters((prev) => ({
      ...prev,
      start_date: filters.start_date,
      end_date: filters.end_date,
    }));
    onFilterChange("start_date", filters.start_date);
    onFilterChange("end_date", filters.end_date);
  };

  const onFilterChange = (key, value) => {
    let selectdDate = value;
    if ((key === "start_date" || key === "end_date") && !value.includes("T")) {
      const dateObj = new Date(value);
      if (key === "start_date") {
        dateObj.setHours(0, 0, 0, 0);
      }
      if (key === "end_date") {
        dateObj.setHours(23, 59, 59, 999);
      }
      selectdDate = formatDate(dateObj);
    }

    setFilters((prev) => ({
      ...prev,
      [key]: selectdDate,
    }));

    const params = new URLSearchParams();
    const updatedFilters = { ...filters, [key]: selectdDate };

    Object.entries(updatedFilters).forEach(([k, v]) => {
      if (v) {
        params.append(k, v);
      }
    });

    router.push(`${window.location.pathname}?${params.toString()}`, {
      replace: true,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap no-print">
      <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
        <FormSelect
          name="action_type"
          onChange={(e) => onFilterChange("action", e.target.value)}
          value={filters.action || "all"}
          className=" w-full sm:w-52 py-1.5 text-gray-700"
        >
          {ACTIONS.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </FormSelect>

        <div className="relative inline-block w-full sm:max-w-[210px]">
          <div
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="w-full items-center gap-2 px-2 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm cursor-pointer"
          >
            <button dir="ltr" className="whitespace-nowrap ">
              {`${formatDateForDisplay(filters.start_date)} - ${formatDateForDisplay(
                filters.end_date
              )}`}
            </button>

            <ChevronDown className="absolute top-1/2 ltr:right-2 rtl:left-2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {isDatePickerOpen && (
            <div className="absolute mt-2 w-full sm:w-66 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-10 left-0">
              <div className="space-y-2">
                <FormInput
                  type="date"
                  label={t.dashboardFilter.datePicker.startDate}
                  value={filters.start_date.split("T")[0]}
                  onChange={(filter) => {
                    const selectedDate = filter.target.value;
                    const dateObj = new Date(selectedDate + "T00:00:00.000Z");
                    const formattedDate = formatDate(dateObj);
                    setFilters((prev) => ({
                      ...prev,
                      start_date: formattedDate,
                    }));
                  }}
                />

                <FormInput
                  type="date"
                  label={t.dashboardFilter.datePicker.endDate}
                  value={filters.end_date.split("T")[0]}
                  onChange={(filter) => {
                    const selectedDate = filter.target.value;
                    const dateObj = new Date(selectedDate + "T23:59:59.999Z");
                    const formattedDate = formatDate(dateObj);
                    setFilters((prev) => ({
                      ...prev,
                      end_date: formattedDate,
                    }));
                  }}
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {t.dashboardFilter.datePicker.cancel}
                  </button>
                  <button
                    onClick={onApplyDateFilter}
                    className="bg-blue-600 hover:opacity-95 text-white px-3 py-1 rounded-md text-sm"
                  >
                    {t.dashboardFilter.datePicker.apply}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Improved print button with icon and better styling */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <Printer size={16} />
          {t.dashboardFilter.actions.print}
        </button>
      </div>

      <AverageScore />
    </div>
  );
}
