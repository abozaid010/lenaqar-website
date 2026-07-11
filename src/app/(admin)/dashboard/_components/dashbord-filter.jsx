"use client";

import ExcelExportButton from "@/components/ui/excel-export-button";
import FormInput from "@/components/ui/inputs/form-input";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import {
  DASHBOARD_TRIGGER,
} from "@/constants/ui-classes";
import { useI18n } from "@/hooks/useI18n";
import {
  getActionLabel,
  getDashboardFilterOptions,
  parseDashboardActionFilter,
  serializeDashboardActionFilter,
} from "@/utils/actions";
import {
  OWNER_TYPES,
  getOwnerTypeLabel,
  parseOwnerTypeFilter,
  serializeOwnerTypeFilter,
} from "@/constants/owner-type";
import { ChevronDown, FileSpreadsheet, X, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDayMonthShort } from "@/utils/formateDate";
import AverageScore from "./average-score";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import AddLeadDialog from "@/components/ui/add-lead-dialog";
import ImportLeadsDialog from "@/components/ui/import-leads-dialog";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { loadDashboardCampaignIdsOnce } from "@/lib/dashboard-campaign-ids-session";
import {
  loadDashboardTeamMembersOnce,
  readCachedDashboardTeamMembers,
} from "@/lib/dashboard-team-emails-session";
import {
  hasPersistableDashboardFilters,
  isHomeyClientId,
} from "@/lib/dashboard-filters-storage";
import {
  DASHBOARD_SORT,
  DASHBOARD_SORT_PARAM,
  LEGACY_SORT_SCORE_PARAM,
  resolveDashboardSort,
} from "@/utils/dashboard-lead-sort";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useDashboardLeadsBulk } from "@/context/dashboard-leads-bulk-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { isValidEmail } from "@/utils/email";
import toast from "react-hot-toast";

const formatDate = (date) => {
  const isoString = date.toISOString();
  const formattedDate = isoString.slice(0, 19);
  return formattedDate;
};

function isAdminRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();
  return normalized === "admin" || normalized === "owner";
}

/** w-72 (18rem) at 70% — tighter filter triggers and dropdown panels */
const FILTER_MENU_WIDTH = "w-[12.6rem]";
const FILTER_ACTION_MIN_WIDTH = "min-w-[6rem]";
const FILTER_CAMPAIGN_MIN_WIDTH = "min-w-[6.25rem]";

function PanelSection({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      {title ? (
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 px-0.5">
          {title}
        </h3>
      ) : null}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export default function DashbordFilter({
  appliedFilters,
  compact = false,
  panel = false,
  hideAddLead = false,
  onResetFilters,
}) {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = LenaCookiesManager.getClientId();
  const selectedSort = useMemo(
    () =>
      resolveDashboardSort(
        searchParams.get(DASHBOARD_SORT_PARAM),
        clientId,
        searchParams.get(LEGACY_SORT_SCORE_PARAM),
      ),
    [searchParams, clientId],
  );

  const ACTIONS = useMemo(
    () => getDashboardFilterOptions(locale),
    [locale],
  );

  const sortOptions = useMemo(
    () => [
      {
        value: DASHBOARD_SORT.RECENT,
        label: translate("dashboardFilter.sort.recent", "Most Recent"),
      },
      {
        value: DASHBOARD_SORT.OLDEST,
        label: translate("dashboardFilter.sort.oldest", "Oldest First"),
      },
      {
        value: DASHBOARD_SORT.SCORE,
        label: translate("dashboardFilter.sort.score", "Highest Score"),
      },
    ],
    [translate],
  );

  const sortFilterLabel = useMemo(() => {
    const selected = sortOptions.find((option) => option.value === selectedSort);
    return (
      selected?.label ||
      translate("dashboardFilter.sort.recent", "Most Recent")
    );
  }, [selectedSort, sortOptions, translate]);

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

  // Cookie-backed; empty on SSR/first paint to avoid hydration mismatch.
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(false);
  const [authorError, setAuthorError] = useState("");

  useEffect(() => {
    const email = LenaCookiesManager.getClientInfo()?.email;
    setLoggedInEmail(typeof email === "string" ? email.trim() : "");
    setIsAdminUser(isAdminRole(getRoleFromToken()));
  }, []);

  const [filters, setFilters] = useState(() => {
    const authorFromUrl =
      typeof appliedFilters.author === "string"
        ? appliedFilters.author.trim()
        : "";
    return {
      actions: parseDashboardActionFilter(appliedFilters.action),
      owner_type: parseOwnerTypeFilter(appliedFilters.owner_type),
      start_date: appliedFilters.start_date || formatDate(twoMonthsAgo),
      end_date: appliedFilters.end_date || formatDate(tomorrow),
      campaign_ids: appliedFilters.campaign_ids
        ? appliedFilters.campaign_ids.split(",")
        : [],
      author: authorFromUrl,
    };
  });

  useEffect(() => {
    if (!isAdminUser) {
      setTeamMembers([]);
      setIsTeamMembersLoading(false);
      return;
    }

    const cached = readCachedDashboardTeamMembers(clientId);
    if (cached) {
      setTeamMembers(cached);
      setIsTeamMembersLoading(false);
    } else {
      setIsTeamMembersLoading(true);
    }

    let cancelled = false;
    loadDashboardTeamMembersOnce(clientId).then((members) => {
      if (cancelled) return;
      if (Array.isArray(members)) {
        setTeamMembers(members);
      } else if (!cached) {
        setTeamMembers([]);
      }
      setIsTeamMembersLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isAdminUser, clientId]);

  const authorOptions = useMemo(() => {
    if (!isAdminUser) {
      return loggedInEmail
        ? [{ email: loggedInEmail, name: "" }]
        : [];
    }

    /** @type {Map<string, { email: string, name: string }>} */
    const byEmail = new Map();
    for (const member of teamMembers) {
      const email =
        typeof member?.email === "string" ? member.email.trim() : "";
      if (!email) continue;
      byEmail.set(email.toLowerCase(), {
        email,
        name: typeof member?.name === "string" ? member.name.trim() : "",
      });
    }
    if (loggedInEmail) {
      const key = loggedInEmail.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { email: loggedInEmail, name: "" });
      }
    }
    const selected =
      typeof filters.author === "string" ? filters.author.trim() : "";
    if (selected) {
      const key = selected.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { email: selected, name: "" });
      }
    }

    return Array.from(byEmail.values()).sort((a, b) => {
      const labelA = (a.name || a.email).toLowerCase();
      const labelB = (b.name || b.email).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }, [isAdminUser, loggedInEmail, teamMembers, filters.author]);

  const getAuthorOptionLabel = (option) => {
    const email = option?.email || "";
    const name = option?.name || "";
    if (name && email) return `${name} (${email})`;
    return name || email;
  };

  const ownerTypeOptions = useMemo(
    () =>
      OWNER_TYPES.map((value) => ({
        value,
        label: getOwnerTypeLabel(value, translate),
      })),
    [translate],
  );

  const ownerTypeFilterLabel = useMemo(() => {
    if (filters.owner_type.length === 0) {
      return translate("dashboardFilter.ownerType.allTypes", "All Types");
    }
    if (filters.owner_type.length === 1) {
      return getOwnerTypeLabel(filters.owner_type[0], translate);
    }
    return translate("dashboardFilter.ownerType.selected", "{count} selected").replace(
      "{count}",
      filters.owner_type.length,
    );
  }, [filters.owner_type, translate]);

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
  const [isOwnerTypeDropdownOpen, setIsOwnerTypeDropdownOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isImportLeadsOpen, setIsImportLeadsOpen] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const isFilterMenuOpen =
    isActionDropdownOpen ||
    isOwnerTypeDropdownOpen ||
    isCampaignDropdownOpen ||
    isSortDropdownOpen ||
    isAuthorDropdownOpen ||
    isDatePickerOpen;
  const actionDropdownRef = useRef(null);
  const ownerTypeDropdownRef = useRef(null);
  const campaignDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const role = getRoleFromToken();
    setIsOwner(role != null && String(role).toLowerCase() === "owner");
  }, []);

  const { canShowBulkButton: canSendBulkWhatsapp } = useWhatsappBulkAccess();

  const { allVisibleRecipients, resolvedRecipients } = useDashboardLeadsBulk();
  /** Panel WhatsApp always targets all loaded leads; elsewhere prefer selection. */
  const whatsappRecipients = panel ? allVisibleRecipients : resolvedRecipients;

  const showSendWhatsappButton = canSendBulkWhatsapp;
  /** Export uses cookies (client-only). WhatsApp uses server-hydrated module_actions. */
  const showExportButton = isMounted && isOwner;
  const showWhatsappToolbarButton = isMounted && showSendWhatsappButton;
  const showAddLeadButton = !hideAddLead;

  const handleOpenWhatsappBulk = () => {
    if (whatsappRecipients.length === 0) {
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
        ownerTypeDropdownRef.current &&
        !ownerTypeDropdownRef.current.contains(event.target)
      ) {
        setIsOwnerTypeDropdownOpen(false);
      }
      if (
        campaignDropdownRef.current &&
        !campaignDropdownRef.current.contains(event.target)
      ) {
        setIsCampaignDropdownOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    if (
      isActionDropdownOpen ||
      isOwnerTypeDropdownOpen ||
      isCampaignDropdownOpen ||
      isSortDropdownOpen
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isActionDropdownOpen,
    isOwnerTypeDropdownOpen,
    isCampaignDropdownOpen,
    isSortDropdownOpen,
  ]);

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
      } else if (k === "owner_type" && Array.isArray(v)) {
        const serializedOwnerType = serializeOwnerTypeFilter(v);
        if (serializedOwnerType != null) {
          params.append("owner_type", serializedOwnerType);
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
    const preserveSort =
      prev.get(DASHBOARD_SORT_PARAM) ||
      (prev.get(LEGACY_SORT_SCORE_PARAM) === "desc" ||
      prev.get(LEGACY_SORT_SCORE_PARAM) === "asc"
        ? DASHBOARD_SORT.SCORE
        : null);
    if (preserveQuery) params.set("query", preserveQuery);
    if (preserveUserId) params.set("userId", preserveUserId);
    if (
      preserveSort === DASHBOARD_SORT.RECENT ||
      preserveSort === DASHBOARD_SORT.OLDEST ||
      preserveSort === DASHBOARD_SORT.SCORE
    ) {
      params.set(DASHBOARD_SORT_PARAM, preserveSort);
    }

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

  const handleAuthorChange = (event) => {
    const raw = typeof event?.target?.value === "string" ? event.target.value : "";
    const nextAuthor = raw.trim();

    if (!isValidEmail(nextAuthor)) {
      setAuthorError(
        translate(
          "dashboardFilter.author.invalidEmail",
          "Enter a valid email address",
        ),
      );
      return;
    }

    if (
      !isAdminUser &&
      nextAuthor &&
      loggedInEmail &&
      nextAuthor.toLowerCase() !== loggedInEmail.toLowerCase()
    ) {
      setAuthorError(
        translate(
          "dashboardFilter.author.ownEmailOnly",
          "You can only filter by your own email",
        ),
      );
      return;
    }

    setAuthorError("");
    setFilters((prev) => ({
      ...prev,
      author: nextAuthor,
    }));
    onFilterChange("author", nextAuthor);
  };

  const toggleOwnerTypeSelection = (ownerTypeValue) => {
    const newOwnerTypes = filters.owner_type.includes(ownerTypeValue)
      ? filters.owner_type.filter((value) => value !== ownerTypeValue)
      : [...filters.owner_type, ownerTypeValue];

    setFilters((prev) => ({
      ...prev,
      owner_type: newOwnerTypes,
    }));
    onFilterChange("owner_type", newOwnerTypes);
  };

  const clearOwnerTypeFilters = () => {
    setFilters((prev) => ({
      ...prev,
      owner_type: [],
    }));
    onFilterChange("owner_type", []);
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

  const handleSortChange = (nextSort) => {
    if (
      nextSort !== DASHBOARD_SORT.RECENT &&
      nextSort !== DASHBOARD_SORT.OLDEST &&
      nextSort !== DASHBOARD_SORT.SCORE
    ) {
      return;
    }

    const params = hasPersistableDashboardFilters(searchParams)
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams(window.location.search);
    params.set(DASHBOARD_SORT_PARAM, nextSort);
    params.delete(LEGACY_SORT_SCORE_PARAM);
    setIsSortDropdownOpen(false);
    const qs = params.toString();
    router.push(
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      { replace: true },
    );
  };

  const handleResetFilters = () => {
    const defaultAuthor =
      !isAdminUser && loggedInEmail ? loggedInEmail : "";
    setAuthorError("");
    setFilters({
      actions: [],
      owner_type: [],
      start_date: formatDate(twoMonthsAgo),
      end_date: formatDate(tomorrow),
      campaign_ids: [],
      author: defaultAuthor,
    });
    setIsActionDropdownOpen(false);
    setIsOwnerTypeDropdownOpen(false);
    setIsCampaignDropdownOpen(false);
    setIsSortDropdownOpen(false);
    setIsAuthorDropdownOpen(false);
    setIsDatePickerOpen(false);
    if (typeof onResetFilters === "function") {
      onResetFilters();
      return;
    }
    const params = new URLSearchParams();
    if (defaultAuthor) {
      params.set("author", defaultAuthor);
    }
    if (isHomeyClientId(clientId)) {
      params.set(DASHBOARD_SORT_PARAM, DASHBOARD_SORT.OLDEST);
    }
    const qs = params.toString();
    router.push(
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      { replace: true },
    );
  };

  const menuWidthClass = panel ? "w-full" : FILTER_MENU_WIDTH;
  const triggerWidthClass = panel ? "!w-full" : "!w-auto";
  const fieldShellClass = panel ? "w-full" : `${FILTER_ACTION_MIN_WIDTH} shrink-0`;
  const campaignShellClass = panel ? "w-full" : `${FILTER_CAMPAIGN_MIN_WIDTH} shrink-0`;
  const dateShellClass = panel ? "w-full" : `${FILTER_MENU_WIDTH} shrink-0`;

  const filterControls = (
    <>
          <div
            className={`relative ${isActionDropdownOpen ? "z-[90]" : "z-[60]"} ${fieldShellClass}`}
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
              className={`${DASHBOARD_TRIGGER} ${triggerWidthClass} ${
                compact ? "h-9 min-h-[36px]" : "h-10"
              }`}
            >
              <span className="whitespace-nowrap">{actionFilterLabel}</span>
              <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
            </div>

            {isActionDropdownOpen && (
              <div className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto`}>
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

          <div
            className={`relative ${isOwnerTypeDropdownOpen ? "z-[90]" : "z-[60]"} ${fieldShellClass}`}
            ref={ownerTypeDropdownRef}
          >
            <div
              id="owner_type"
              role="button"
              tabIndex={0}
              aria-haspopup="listbox"
              aria-expanded={isOwnerTypeDropdownOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setIsOwnerTypeDropdownOpen((open) => !open);
              }}
              onClick={() => setIsOwnerTypeDropdownOpen(!isOwnerTypeDropdownOpen)}
              className={`${DASHBOARD_TRIGGER} ${triggerWidthClass} ${
                compact ? "h-9 min-h-[36px]" : "h-10"
              }`}
            >
              <span className="whitespace-nowrap">{ownerTypeFilterLabel}</span>
              <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
            </div>

            {isOwnerTypeDropdownOpen && (
              <div className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto`}>
                {filters.owner_type.length > 0 && (
                  <button
                    type="button"
                    onClick={clearOwnerTypeFilters}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2 mb-1"
                  >
                    <X size={16} />
                    {translate("dashboardFilter.actions.clearAll", "Clear All")}
                  </button>
                )}

                {ownerTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.owner_type.includes(option.value)}
                      onChange={() => toggleOwnerTypeSelection(option.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div
            className={`relative ${isCampaignDropdownOpen ? "z-[90]" : "z-[60]"} ${campaignShellClass}`}
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
              className={`${DASHBOARD_TRIGGER} ${triggerWidthClass} ${
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
              <div className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto`}>
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

          <div className={`relative ${isDatePickerOpen ? "z-[90]" : "z-[60]"} ${dateShellClass}`}>
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
              className={`relative ${DASHBOARD_TRIGGER} !w-full justify-start ps-3 pe-9 ${
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
              <div className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-3 shadow-lg`}>
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

          <div
            className={`relative flex flex-col items-stretch justify-start gap-1 min-w-0 ${
              isAuthorDropdownOpen ? "z-[90]" : "z-[60]"
            } ${panel ? "w-full" : `${FILTER_ACTION_MIN_WIDTH} shrink-0`}`}
          >
            <SearchableDropdownSelect
              name="dashboard_author"
              options={authorOptions}
              value={filters.author || ""}
              onChange={handleAuthorChange}
              onOpenChange={setIsAuthorDropdownOpen}
              menuPlacement="top"
              getValue={(option) => option.email}
              getLabel={getAuthorOptionLabel}
              searchFields={["name", "email"]}
              placeholder={translate("dashboardFilter.author.placeholder", "Author")}
              showAllOption
              allOptionValue=""
              allowCreate={isAdminUser}
              isValidCreateValue={(query) => isValidEmail(query)}
              formatCreateLabel={(query) =>
                translate(
                  "dashboardFilter.author.useEmail",
                  "Use {email}",
                ).replace("{email}", query)
              }
              isLoading={isAdminUser && isTeamMembersLoading}
              error={Boolean(authorError)}
              errorMessage={authorError}
              searchPlaceholder={translate(
                "dashboardFilter.author.search",
                "Search by name or email",
              )}
              noResultsText={translate(
                "dashboardFilter.author.noResults",
                "No matching team members",
              )}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className={`${DASHBOARD_TRIGGER} ${triggerWidthClass} ${
              compact ? "h-9 min-h-[36px]" : "h-10"
            } text-gray-600`}
          >
            {translate("dashboardFilter.resetFilters", "Reset Filters")}
          </button>
    </>
  );

  const sortControl = (
    <div
      className={`relative ${isSortDropdownOpen ? "z-[90]" : "z-[60]"} ${fieldShellClass}`}
      ref={sortDropdownRef}
    >
      <div
        id="dashboard_sort"
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isSortDropdownOpen}
        aria-label={translate("dashboardFilter.sort.label", "Sort")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            setIsSortDropdownOpen((open) => !open);
        }}
        onClick={() => setIsSortDropdownOpen((open) => !open)}
        className={`${DASHBOARD_TRIGGER} ${triggerWidthClass} ${
          compact ? "h-9 min-h-[36px]" : "h-10"
        }`}
      >
        <span className="whitespace-nowrap">{sortFilterLabel}</span>
        <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
      </div>

      {isSortDropdownOpen && (
        <div
          role="listbox"
          aria-label={translate("dashboardFilter.sort.label", "Sort")}
          className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto`}
        >
          {sortOptions.map((option) => {
            const isSelected = option.value === selectedSort;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSortChange(option.value)}
                className={`w-full text-start px-3 py-2 text-sm rounded ${
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const toolControls = (
    <>
        {showAddLeadButton ? (
        <button
          onClick={() => setIsAddLeadOpen(true)}
          className={`flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 ${
            panel ? "w-full" : ""
          } ${compact ? "h-9 px-3" : "h-10 px-4"}`}
        >
          <UserPlus size={compact ? 16 : 18} />
          <span>{translate("dashboardFilter.ADD")}</span>
        </button>
        ) : null}
        <button
          onClick={() => setIsImportLeadsOpen(true)}
          className={`flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 ${
            panel ? "w-full" : ""
          } ${compact ? "h-9 px-3" : "h-10 px-4"}`}
        >
          <FileSpreadsheet size={compact ? 16 : 18} />
          <span>{translate("dashboardFilter.importLeads.button")}</span>
        </button>
        {showExportButton && (
          <div className={panel ? "w-full [&_button]:w-full" : ""}>
            <ExcelExportButton compact={compact} />
          </div>
        )}
        {showWhatsappToolbarButton && (
          <button
            type="button"
            onClick={handleOpenWhatsappBulk}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0 ${
              panel ? "w-full" : ""
            } ${compact ? "h-9 min-h-[36px]" : "h-10"}`}
            title={
              panel
                ? translate(
                    "dashboardFilter.bulkWhatsapp.sendAllLoadedHint",
                    "Send WhatsApp to all loaded leads",
                  )
                : translate("dashboardFilter.bulkWhatsapp.sendButton")
            }
          >
            <svg
              className={`${compact ? "w-4 h-4" : "w-[18px] h-[18px]"} text-green-600 shrink-0`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
            </svg>
            <span className={panel ? "inline" : "hidden sm:inline"}>
              {panel
                ? translate(
                    "dashboardFilter.bulkWhatsapp.sendAllLoaded",
                    "WhatsApp all loaded",
                  )
                : translate("dashboardFilter.bulkWhatsapp.sendButton")}
            </span>
          </button>
        )}
    </>
  );

  return (
    <div
      className={`flex flex-col gap-2 no-print ${compact && !panel ? "mb-1" : panel ? "" : "mb-2"}`}
    >
      {panel ? (
        <div className="flex flex-col gap-4">
          <PanelSection
            title={translate("dashboardFilter.panel.sections.filters", "Filters")}
          >
            <div
              className={`relative flex flex-col items-stretch justify-start gap-2 min-w-0 ${
                isFilterMenuOpen ? "z-50" : "z-30"
              }`}
            >
              {filterControls}
            </div>
          </PanelSection>

          <PanelSection
            title={translate("dashboardFilter.panel.sections.sorting", "Sorting")}
          >
            {sortControl}
          </PanelSection>

          <PanelSection
            title={translate("dashboardFilter.panel.sections.tools", "Tools")}
          >
            {toolControls}
          </PanelSection>

          <PanelSection
            title={translate("dashboardFilter.panel.sections.metrics", "Metrics")}
          >
            <div className="flex items-center justify-between px-1">
              <AverageScore />
            </div>
          </PanelSection>

          <PanelSection
            title={translate("dashboardFilter.panel.sections.help", "Help")}
          >
            <div className="flex justify-end">
              <VideoInstructionsDialog
                variant="dashboard"
                iconSize="md"
                tooltipText="How to use the Dashboard"
                className="p-0 shrink-0"
              />
            </div>
          </PanelSection>
        </div>
      ) : (
        <>
      <div
        className={`relative flex flex-wrap sm:flex-nowrap items-center justify-start gap-2 min-w-0 ${
          isFilterMenuOpen ? "z-50" : "z-30"
        }`}
      >
        {filterControls}
        {sortControl}
      </div>

      <div className="relative z-10 flex gap-2 items-center justify-start flex-wrap">
        {toolControls}
        <div>
          <AverageScore />
        </div>
        <div>
          <VideoInstructionsDialog
            variant="dashboard"
            iconSize="md"
            tooltipText="How to use the Dashboard"
            className="p-0 shrink-0"
          />
        </div>
      </div>
        </>
      )}

      {showAddLeadButton ? (
      <AddLeadDialog
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        clientId={clientId}
      />
      ) : null}

      <ImportLeadsDialog
        isOpen={isImportLeadsOpen}
        onClose={() => setIsImportLeadsOpen(false)}
        clientId={clientId}
      />

      <AddNewWhatsappCampaignDialog
        isOpen={isWhatsappBulkOpen}
        onClose={() => setIsWhatsappBulkOpen(false)}
        recipients={whatsappRecipients}
      />
    </div>
  );
}
