"use client";

import ExcelExportButton from "@/components/ui/excel-export-button";
import FormInput from "@/components/ui/inputs/form-input";
import FormSelect from "@/components/ui/inputs/form-select";
import { DASHBOARD_BUTTON, DASHBOARD_TRIGGER } from "@/constants/ui-classes";
import { useI18n } from "@/context/translate-api";
import { getActionLabel, getFilterActions } from "@/utils/actions";
import { ChevronDown, Printer, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AverageScore from "./average-score";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";

const formatDate = (date) => {
  const isoString = date.toISOString();
  const formattedDate = isoString.slice(0, 19);
  return formattedDate;
};

export default function DashbordFilter({ appliedFilters, compact = false }) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const ACTIONS = useMemo(() => {
    return getFilterActions(locale).map((action) => ({
      value: action.value,
      label: getActionLabel(action.value, locale),
    }));
  }, [locale]);

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
      campaign_ids: appliedFilters.campaign_ids
        ? appliedFilters.campaign_ids.split(",")
        : [],
    };
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const campaignDropdownRef = useRef(null);

  // Load campaigns from localStorage
  useEffect(() => {
    const loadCampaigns = () => {
      const campaigns = JSON.parse(localStorage.getItem("campaignIds") || "[]");
      setAvailableCampaigns(campaigns);
    };

    // Initial load
    loadCampaigns();

    // Set up an interval to check for updates
    const interval = setInterval(loadCampaigns, 500);

    // Listen for storage events (when localStorage changes)
    window.addEventListener("storage", loadCampaigns);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", loadCampaigns);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        campaignDropdownRef.current &&
        !campaignDropdownRef.current.contains(event.target)
      ) {
        setIsCampaignDropdownOpen(false);
      }
    };

    if (isCampaignDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCampaignDropdownOpen]);

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
        if (k === "campaign_ids" && Array.isArray(v)) {
          if (v.length > 0) {
            params.append(k, v.join(","));
          }
        } else {
          params.append(k, v);
        }
      }
    });

    const prev = new URLSearchParams(window.location.search);
    const preserveQuery = prev.get("query");
    const preserveUserId = prev.get("userId");
    if (preserveQuery) params.set("query", preserveQuery);
    if (preserveUserId) params.set("userId", preserveUserId);

    router.push(`${window.location.pathname}?${params.toString()}`, {
      replace: true,
    });
  };

  const toggleCampaignSelection = (campaignId) => {
    const newCampaigns = filters.campaign_ids.includes(campaignId)
      ? filters.campaign_ids.filter((id) => id !== campaignId)
      : [...filters.campaign_ids, campaignId];

    setFilters((prev) => ({
      ...prev,
      campaign_ids: newCampaigns,
    }));
    onFilterChange("campaign_ids", newCampaigns);
  };

  const clearCampaignFilters = () => {
    setFilters((prev) => ({
      ...prev,
      campaign_ids: [],
    }));
    onFilterChange("campaign_ids", []);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`flex sm:items-center flex-col sm:flex-row justify-between gap-2 no-print ${compact ? "mb-1" : "mb-2"}`}
    >
      <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 w-52">
            <FormSelect
              name="action_type"
              onChange={(e) => onFilterChange("action", e.target.value)}
              value={filters.action || "all"}
              className={`text-gray-700 ${compact ? "py-1 h-9 text-sm" : "py-1.5"}`}
            >
              {ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </FormSelect>
          </div>

          {/* Campaign Filter Dropdown */}
          <div
            className="relative inline-block flex-1 w-52"
            ref={campaignDropdownRef}
          >
            <div
              onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
              className={`${DASHBOARD_TRIGGER} ${compact ? "h-9 min-h-[36px]" : "h-10"}`}
            >
              <span className="truncate">
                {filters.campaign_ids.length === 0
                  ? t.dashboardFilter.campaigns.allCampaigns
                  : t.dashboardFilter.campaigns.selected.replace(
                      "{count}",
                      filters.campaign_ids.length
                    )}
              </span>
              <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
            </div>

            {isCampaignDropdownOpen && (
              <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 z-20 max-h-64 overflow-y-auto">
                {filters.campaign_ids.length > 0 && (
                  <button
                    onClick={clearCampaignFilters}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2 mb-1"
                  >
                    <X size={16} />
                    Clear All
                  </button>
                )}

                {availableCampaigns.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No campaigns available
                  </div>
                ) : (
                  availableCampaigns.map((campaign) => (
                    <label
                      key={campaign}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.campaign_ids.includes(campaign)}
                        onChange={() => toggleCampaignSelection(campaign)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{campaign}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative inline-block flex-1 w-62">
            <div
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`relative ${DASHBOARD_TRIGGER} justify-start ${compact ? "h-9 min-h-[36px]" : "h-10"}`}
            >
              <span dir="ltr" className="whitespace-nowrap truncate min-w-0 flex-1">
                {`${formatDateForDisplay(filters.start_date)} - ${formatDateForDisplay(
                  filters.end_date
                )}`}
              </span>

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
        </div>

        {/* Action buttons - Print and Export */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handlePrint}
            className={`${DASHBOARD_BUTTON} ${compact ? "h-9" : "h-10"}`}
            title={t.dashboardFilter.actions.print}
          >
            <Printer size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
            <span className="hidden sm:inline">
              {t.dashboardFilter.actions.print}
            </span>
          </button>

          <ExcelExportButton searchParams={appliedFilters} />
        </div>
      </div>

      <div className="flex">
        <AverageScore />
        <VideoInstructionsDialog
          variant="dashboard"
          iconSize="md"
          tooltipText="How to use the Dashboard"
          className="p-0"
        />
      </div>
    </div>
  );
}
