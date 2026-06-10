"use client";

import ExcelExportButton from "@/components/ui/excel-export-button";
import FormInput from "@/components/ui/inputs/form-input";
import {
  DASHBOARD_BUTTON,
  DASHBOARD_TRIGGER,
} from "@/constants/ui-classes";
import { useI18n } from "@/hooks/useI18n";
import {
  getActionLabel,
  getDashboardFilterOptions,
  parseDashboardActionFilter,
  serializeDashboardActionFilter,
} from "@/utils/actions";
import { ChevronDown, FileSpreadsheet, Printer, X, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDayMonthShort } from "@/utils/formateDate";
import AverageScore from "./average-score";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import AddLeadDialog from "@/components/ui/add-lead-dialog";
import ImportLeadsDialog from "@/components/ui/import-leads-dialog";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { loadDashboardCampaignIdsOnce } from "@/lib/dashboard-campaign-ids-session";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useDashboardLeadsBulk } from "@/context/dashboard-leads-bulk-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import toast from "react-hot-toast";

const formatDate = (date) => {
  const isoString = date.toISOString();
  const formattedDate = isoString.slice(0, 19);
  return formattedDate;
};

export default function DashbordFilter({ appliedFilters, compact = false }) {
  const { locale, translate } = useI18n();
  const router = useRouter();

  const ACTIONS = useMemo(
    () => getDashboardFilterOptions(locale),
    [locale],
  );

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
      actions: parseDashboardActionFilter(appliedFilters.action),
      start_date: appliedFilters.start_date || formatDate(twoMonthsAgo),
      end_date: appliedFilters.end_date || formatDate(tomorrow),
      campaign_ids: appliedFilters.campaign_ids
        ? appliedFilters.campaign_ids.split(",")
        : [],
    };
  });

  const actionFilterLabel = useMemo(() => {
    if (filters.actions.length === 0) {
      return translate("dashboardFilter.actions.allActions");
    }
    if (filters.actions.length === 1) {
      return getActionLabel(filters.actions[0], locale);
    }
    return translate("dashboardFilter.actions.selected").replace(
      "{count}",
      filters.actions.length,
    );
  }, [filters.actions, locale, translate]);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isImportLeadsOpen, setIsImportLeadsOpen] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const clientId = LenaCookiesManager.getClientId();
  const actionDropdownRef = useRef(null);
  const campaignDropdownRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const role = getRoleFromToken();
    setIsOwner(role != null && String(role).toLowerCase() === "owner");
  }, []);

  const { canShowBulkButton: canSendBulkWhatsapp } = useWhatsappBulkAccess();

  const { resolvedRecipients } = useDashboardLeadsBulk();

  const showSendWhatsappButton = canSendBulkWhatsapp;
  /** Export uses cookies (client-only). WhatsApp uses server-hydrated module_actions. */
  const showExportButton = isMounted && isOwner;
  const showWhatsappToolbarButton = isMounted && showSendWhatsappButton;

  const handleOpenWhatsappBulk = () => {
    if (resolvedRecipients.length === 0) {
      toast.error(
        translate(
          "dashboardFilter.bulkWhatsapp.noRecipients",
          "No leads with a phone number or WhatsApp chat to send."
        )
      );
      return;
    }
    setIsWhatsappBulkOpen(true);
  };

  // Campaign list: GET /campaign/names_only once per session; localStorage + poll only as fallback on error
  useEffect(() => {
    let cancelled = false;
    let interval;

    const loadFromLocalStorage = () => {
      const campaigns = JSON.parse(localStorage.getItem("campaignIds") || "[]");
      if (!cancelled) setAvailableCampaigns(campaigns);
    };

    const onStorage = (e) => {
      if (e.key === "campaignIds" || e.key === null) loadFromLocalStorage();
    };

    loadDashboardCampaignIdsOnce().then((ids) => {
      if (cancelled) return;
      if (ids !== null) {
        setAvailableCampaigns(ids);
        return;
      }
      if (cancelled) return;
      loadFromLocalStorage();
      window.addEventListener("storage", onStorage);
      interval = setInterval(loadFromLocalStorage, 500);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target)
      ) {
        setIsActionDropdownOpen(false);
      }
      if (
        campaignDropdownRef.current &&
        !campaignDropdownRef.current.contains(event.target)
      ) {
        setIsCampaignDropdownOpen(false);
      }
    };

    if (isActionDropdownOpen || isCampaignDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionDropdownOpen, isCampaignDropdownOpen]);

  const formatDateForDisplay = (date) => formatDayMonthShort(date, locale);

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
      if (k === "actions" && Array.isArray(v)) {
        const serializedAction = serializeDashboardActionFilter(v);
        if (serializedAction != null) {
          params.append("action", serializedAction);
        }
      } else if (k === "campaign_ids" && Array.isArray(v)) {
        if (v.length > 0) {
          params.append(k, v.join(","));
        }
      } else if (v) {
        params.append(k, v);
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

  const toggleActionSelection = (actionValue) => {
    const newActions = filters.actions.includes(actionValue)
      ? filters.actions.filter((value) => value !== actionValue)
      : [...filters.actions, actionValue];

    setFilters((prev) => ({
      ...prev,
      actions: newActions,
    }));
    onFilterChange("actions", newActions);
  };

  const clearActionFilters = () => {
    setFilters((prev) => ({
      ...prev,
      actions: [],
    }));
    onFilterChange("actions", []);
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
      className={`flex flex-col gap-2 no-print ${compact ? "mb-1" : "mb-2"}`}
    >
      {/* Row 1: filters stay on one line */}
      <div className="flex flex-nowrap items-center gap-2 min-w-0 overflow-x-auto">
          <div
            className="relative z-[60] min-w-[8.5rem] shrink-0"
            ref={actionDropdownRef}
          >
            <div
              id="action_type"
              role="button"
              tabIndex={0}
              aria-haspopup="listbox"
              aria-expanded={isActionDropdownOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setIsActionDropdownOpen((open) => !open);
              }}
              onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
              className={`${DASHBOARD_TRIGGER} !w-auto ${
                compact ? "h-9 min-h-[36px]" : "h-10"
              }`}
            >
              <span className="whitespace-nowrap">{actionFilterLabel}</span>
              <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
            </div>

            {isActionDropdownOpen && (
              <div className="absolute ltr:left-0 rtl:right-0 top-full z-[70] mt-1 w-72 rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto">
                {filters.actions.length > 0 && (
                  <button
                    type="button"
                    onClick={clearActionFilters}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2 mb-1"
                  >
                    <X size={16} />
                    {translate(
                      "dashboardFilter.actions.clearAll",
                      "Clear All",
                    )}
                  </button>
                )}

                {ACTIONS.map((action) => (
                  <label
                    key={action.value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.actions.includes(action.value)}
                      onChange={() => toggleActionSelection(action.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{action.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Campaign Filter Dropdown — anchor panel with top-full so it stays under the trigger */}
          <div
            className="relative z-[60] min-w-[9rem] shrink-0"
            ref={campaignDropdownRef}
          >
            <div
              role="button"
              tabIndex={0}
              aria-haspopup="listbox"
              aria-expanded={isCampaignDropdownOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setIsCampaignDropdownOpen((o) => !o);
              }}
              onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
              className={`${DASHBOARD_TRIGGER} !w-auto ${
                compact ? "h-9 min-h-[36px]" : "h-10"
              }`}
            >
              <span className="whitespace-nowrap">
                {filters.campaign_ids.length === 0
                  ? translate("dashboardFilter.campaigns.allCampaigns")
                  : translate("dashboardFilter.campaigns.selected").replace(
                      "{count}",
                      filters.campaign_ids.length,
                    )}
              </span>
              <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
            </div>

            {isCampaignDropdownOpen && (
              <div className="absolute ltr:left-0 rtl:right-0 top-full z-[70] mt-1 w-72 rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto">
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

          <div className="relative z-[60] min-w-[11rem] shrink-0">
            <div
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-expanded={isDatePickerOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setIsDatePickerOpen((o) => !o);
              }}
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`relative ${DASHBOARD_TRIGGER} !w-auto justify-start ps-3 pe-9 ${
                compact ? "h-9 min-h-[36px]" : "h-10"
              }`}
            >
              <span dir="ltr" className="whitespace-nowrap">
                {`${formatDateForDisplay(filters.start_date)} - ${formatDateForDisplay(
                  filters.end_date,
                )}`}
              </span>

              <ChevronDown
                className="absolute top-1/2 ltr:right-2 rtl:left-2 -translate-y-1/2 text-gray-400 w-5 h-5"
                aria-hidden="true"
              />
            </div>

            {isDatePickerOpen && (
              <div className="absolute ltr:left-0 rtl:right-0 top-full z-[70] mt-1 w-72 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
                <div className="space-y-2">
                  <FormInput
                    type="date"
                    label={translate("dashboardFilter.datePicker.startDate")}
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
                    label={translate("dashboardFilter.datePicker.endDate")}
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
                      {translate("dashboardFilter.datePicker.cancel")}
                    </button>
                    <button
                      onClick={onApplyDateFilter}
                      className="bg-blue-600 hover:opacity-95 text-white px-3 py-1 rounded-md text-sm"
                    >
                      {translate("dashboardFilter.datePicker.apply")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Row 2: actions */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <button
          onClick={() => setIsAddLeadOpen(true)}
          className={`flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 ${
            compact ? "h-9 px-3" : "h-10 px-4"
          }`}
        >
          <UserPlus size={compact ? 16 : 18} />
          <span>{translate("dashboardFilter.ADD")}</span>
        </button>
        <button
          onClick={() => setIsImportLeadsOpen(true)}
          className={`flex items-center gap-2 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 ${
            compact ? "h-9 px-3" : "h-10 px-4"
          }`}
        >
          <FileSpreadsheet size={compact ? 16 : 18} />
          <span>{translate("dashboardFilter.importLeads.button")}</span>
        </button>
        {showExportButton && <ExcelExportButton compact={compact} />}
        {showWhatsappToolbarButton && (
          <button
            type="button"
            onClick={handleOpenWhatsappBulk}
            className={`flex items-center gap-2 px-3 sm:px-4 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 ${
              compact ? "h-9 min-h-[36px]" : "h-10"
            }`}
            title={translate("dashboardFilter.bulkWhatsapp.sendButton")}
          >
            <svg
              className={`${compact ? "w-4 h-4" : "w-[18px] h-[18px]"} text-green-600 shrink-0`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
            </svg>
            <span className="hidden sm:inline">
              {translate("dashboardFilter.bulkWhatsapp.sendButton")}
            </span>
          </button>
        )}
        <AverageScore />
        <VideoInstructionsDialog
          variant="dashboard"
          iconSize="md"
          tooltipText="How to use the Dashboard"
          className="p-0 shrink-0"
        />
      </div>

      <AddLeadDialog
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        clientId={clientId}
      />

      <ImportLeadsDialog
        isOpen={isImportLeadsOpen}
        onClose={() => setIsImportLeadsOpen(false)}
        clientId={clientId}
      />

      <AddNewWhatsappCampaignDialog
        isOpen={isWhatsappBulkOpen}
        onClose={() => setIsWhatsappBulkOpen(false)}
        recipients={resolvedRecipients}
      />
    </div>
  );
}
