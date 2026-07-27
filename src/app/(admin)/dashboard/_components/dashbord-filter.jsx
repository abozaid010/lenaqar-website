"use client";

import FormInput from "@/components/ui/inputs/form-input";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import {
  DASHBOARD_TRIGGER,
} from "@/constants/ui-classes";
import { useI18n } from "@/hooks/useI18n";
import {
  getActionLabel,
  getDashboardFilterOptions,
  NEW_LEAD_ACTION,
  parseDashboardActionFilter,
  serializeDashboardActionFilter,
} from "@/utils/actions";
import {
  canViewAllDashboardLeads,
  getDashboardLoggedInEmail,
  isAllowedDashboardAuthor,
} from "@/lib/dashboard-lead-access";
import {
  OWNER_TYPES,
  getOwnerTypeLabel,
  parseOwnerTypeFilter,
  serializeOwnerTypeFilter,
} from "@/constants/owner-type";
import {
  LEAD_SOURCES,
  canShowLeadSourceFilter,
  getLeadSourceLabel,
  parseLeadSourceFilter,
  serializeLeadSourceFilter,
} from "@/constants/lead-source";
import { ChevronDown, FileSpreadsheet, Loader2, X, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ExcelExportButton = dynamic(
  () => import("@/components/ui/excel-export-button"),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        disabled
        aria-busy
        className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md text-xs sm:text-sm font-medium opacity-70 cursor-wait h-10 min-w-[44px]"
      >
        <Loader2 size={16} className="animate-spin shrink-0" />
      </button>
    ),
  }
);
import { createPortal } from "react-dom";
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
} from "@/utils/dashboard-lead-sort";
import { useDashboardFilterPersistence } from "@/hooks/useDashboardFilterPersistence";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useDashboardLeadsBulk } from "@/context/dashboard-leads-bulk-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { isValidEmail } from "@/utils/email";
import {
  buildDashboardDateRangeDaysAgo,
  getDashboardDateDay,
  getDefaultDashboardEndDate,
  getDefaultDashboardStartDate,
  isValidDashboardDateRange,
  normalizeDashboardEndDate,
  normalizeDashboardStartDate,
  toDashboardEndDateTime,
  toDashboardStartDateTime,
} from "@/utils/dashboardDate";
import toast from "react-hot-toast";

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
  const { leadSort: selectedSort, setLeadSort } = useDashboardFilterPersistence();

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

  // Cookie-backed; empty on SSR/first paint to avoid hydration mismatch.
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(false);
  const [authorError, setAuthorError] = useState("");

  const [filters, setFilters] = useState(() => {
    const authorFromUrl =
      typeof appliedFilters.author === "string"
        ? appliedFilters.author.trim()
        : "";
    return {
      actions: parseDashboardActionFilter(appliedFilters.action),
      owner_type: parseOwnerTypeFilter(appliedFilters.owner_type),
      start_date: appliedFilters.start_date || getDefaultDashboardStartDate(),
      end_date: appliedFilters.end_date || getDefaultDashboardEndDate(),
      campaign_id:
        appliedFilters.campaign_id ||
        (appliedFilters.campaign_ids
          ? appliedFilters.campaign_ids.split(",")[0]
          : ""),
      source: parseLeadSourceFilter(appliedFilters.source),
      author: authorFromUrl,
    };
  });

  useEffect(() => {
    const email = getDashboardLoggedInEmail();
    const isAdmin = canViewAllDashboardLeads();
    setLoggedInEmail(email);
    setIsAdminUser(isAdmin);
    if (!isAdmin && email) {
      setFilters((prev) => {
        const current =
          typeof prev.author === "string" ? prev.author.trim() : "";
        if (current.toLowerCase() === email.toLowerCase()) return prev;
        return { ...prev, author: email };
      });
    }
  }, []);

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
    const name = typeof option?.name === "string" ? option.name.trim() : "";
    if (name) return name;
    return typeof option?.email === "string" ? option.email.trim() : "";
  };

  const resolveAuthorSelectedLabel = (value) => {
    const email = typeof value === "string" ? value.trim() : "";
    if (!email) return "";
    const match = authorOptions.find(
      (option) =>
        option.email.toLowerCase() === email.toLowerCase(),
    );
    if (match) return getAuthorOptionLabel(match);
    return email;
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
    if (!filters.owner_type) {
      return translate("dashboardFilter.ownerType.allTypes", "All Types");
    }
    return getOwnerTypeLabel(filters.owner_type, translate);
  }, [filters.owner_type, translate]);

  const sourceOptions = useMemo(
    () =>
      LEAD_SOURCES.map((value) => ({
        value,
        label: getLeadSourceLabel(value, translate),
      })),
    [translate],
  );

  const sourceFilterLabel = useMemo(() => {
    if (!filters.source) {
      return translate("dashboardFilter.source.allSources", "All Sources");
    }
    return getLeadSourceLabel(filters.source, translate);
  }, [filters.source, translate]);

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
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isImportLeadsOpen, setIsImportLeadsOpen] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  /** Dropdowns inside the Filters panel section (excludes sort — separate section in panel mode). */
  const isFiltersDropdownOpen =
    isActionDropdownOpen ||
    isOwnerTypeDropdownOpen ||
    isCampaignDropdownOpen ||
    isSourceDropdownOpen ||
    isAuthorDropdownOpen ||
    isDatePickerOpen;
  const isFilterMenuOpen = isFiltersDropdownOpen || isSortDropdownOpen;
  const actionDropdownRef = useRef(null);
  const ownerTypeDropdownRef = useRef(null);
  const campaignDropdownRef = useRef(null);
  const sourceDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const datePickerTriggerRef = useRef(null);
  const datePickerPanelRef = useRef(null);
  const [datePickerPosition, setDatePickerPosition] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { canShowBulkButton: canSendBulkWhatsapp } = useWhatsappBulkAccess();

  const { allVisibleRecipients, resolvedRecipients } = useDashboardLeadsBulk();
  /** Panel WhatsApp always targets all loaded leads; elsewhere prefer selection. */
  const whatsappRecipients = panel ? allVisibleRecipients : resolvedRecipients;

  const showSendWhatsappButton = canSendBulkWhatsapp;
  /** Export: admin/owner only (same roles as full author access). */
  const showExportButton = isMounted && isAdminUser;
  const showWhatsappToolbarButton = isMounted && showSendWhatsappButton;
  const showAddLeadButton = !hideAddLead;
  /** Source filter: Homey + admin/owner only. */
  const showSourceFilter =
    isMounted && canShowLeadSourceFilter(clientId, isAdminUser);

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

  // Campaign list: names_only (then /campaign/list); localStorage + poll only as last-resort fallback
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

  useLayoutEffect(() => {
    if (!isDatePickerOpen) {
      setDatePickerPosition(null);
      return;
    }

    const MARGIN = 8;
    const GAP = 8;
    const MIN_PANEL_HEIGHT = 200;

    const updatePosition = () => {
      const trigger = datePickerTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const panelEl = datePickerPanelRef.current;
      const measuredHeight = panelEl?.offsetHeight || 0;
      const estimatedHeight = measuredHeight > 0 ? measuredHeight : 320;

      // Keep usable width on narrow screens; never exceed viewport.
      const width = Math.min(Math.max(rect.width, 260), vw - MARGIN * 2);
      const left = Math.min(
        Math.max(MARGIN, rect.left),
        Math.max(MARGIN, vw - width - MARGIN),
      );

      const spaceBelow = vh - rect.bottom - GAP - MARGIN;
      const spaceAbove = rect.top - GAP - MARGIN;
      // Prefer below; open above only when below can't fit and above has more room.
      const openUpward =
        spaceBelow < Math.min(estimatedHeight, MIN_PANEL_HEIGHT) &&
        spaceAbove > spaceBelow;

      if (openUpward) {
        setDatePickerPosition({
          top: undefined,
          bottom: Math.max(MARGIN, vh - rect.top + GAP),
          left,
          width,
          maxHeight: Math.max(MIN_PANEL_HEIGHT, spaceAbove),
        });
      } else {
        const top = Math.min(rect.bottom + GAP, vh - MARGIN - MIN_PANEL_HEIGHT);
        setDatePickerPosition({
          top: Math.max(MARGIN, top),
          bottom: undefined,
          left,
          width,
          maxHeight: Math.max(MIN_PANEL_HEIGHT, vh - Math.max(MARGIN, top) - MARGIN),
        });
      }
    };

    updatePosition();
    // Remeasure after paint so maxHeight matches real content height.
    const rafId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isDatePickerOpen, panel]);

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
        sourceDropdownRef.current &&
        !sourceDropdownRef.current.contains(event.target)
      ) {
        setIsSourceDropdownOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setIsSortDropdownOpen(false);
      }
      if (
        isDatePickerOpen &&
        datePickerTriggerRef.current &&
        !datePickerTriggerRef.current.contains(event.target) &&
        datePickerPanelRef.current &&
        !datePickerPanelRef.current.contains(event.target)
      ) {
        setIsDatePickerOpen(false);
      }
    };

    if (
      isActionDropdownOpen ||
      isOwnerTypeDropdownOpen ||
      isCampaignDropdownOpen ||
      isSourceDropdownOpen ||
      isSortDropdownOpen ||
      isDatePickerOpen
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
    isSourceDropdownOpen,
    isSortDropdownOpen,
    isDatePickerOpen,
  ]);

  const formatDateForDisplay = (date) => formatDayMonthShort(date, locale);

  const startDay = getDashboardDateDay(filters.start_date) || "";
  const endDay = getDashboardDateDay(filters.end_date) || "";
  const isDateRangeInvalid = !isValidDashboardDateRange(
    filters.start_date,
    filters.end_date,
  );

  const dateRangePresets = useMemo(
    () => [
      {
        id: "7",
        daysAgo: 7,
        label: translate("dashboardFilter.datePicker.last7Days", "Last 7 days"),
      },
      {
        id: "14",
        daysAgo: 14,
        label: translate("dashboardFilter.datePicker.last14Days", "Last 14 days"),
      },
      {
        id: "30",
        daysAgo: 30,
        label: translate("dashboardFilter.datePicker.last30Days", "Last 30 days"),
      },
      {
        id: "0",
        daysAgo: 0,
        label: translate("dashboardFilter.datePicker.today", "Today"),
      },
    ],
    [translate],
  );

  const activePresetId = useMemo(() => {
    const match = dateRangePresets.find((preset) => {
      const range = buildDashboardDateRangeDaysAgo(preset.daysAgo);
      return (
        getDashboardDateDay(range.start_date) === startDay &&
        getDashboardDateDay(range.end_date) === endDay
      );
    });
    return match?.id ?? null;
  }, [dateRangePresets, startDay, endDay]);

  const applyDateRangeDraft = (startYmd, endYmd, edited = "start") => {
    if (!startYmd || !endYmd) return;
    let nextStart = startYmd;
    let nextEnd = endYmd;
    if (nextStart > nextEnd) {
      // Always keep start day <= end day.
      if (edited === "end") nextStart = nextEnd;
      else nextEnd = nextStart;
    }
    setFilters((prev) => ({
      ...prev,
      start_date: toDashboardStartDateTime(nextStart),
      end_date: toDashboardEndDateTime(nextEnd),
    }));
  };

  const onApplyDateFilter = () => {
    // Full calendar days only: start 00:00:00 → end 23:59:59 (Today = full 24h).
    const nextStart = normalizeDashboardStartDate(filters.start_date);
    const nextEnd = normalizeDashboardEndDate(filters.end_date);
    if (!nextStart || !nextEnd || !isValidDashboardDateRange(nextStart, nextEnd)) {
      toast.error(
        translate(
          "dashboardFilter.datePicker.invalidRange",
          "Start date must be before or equal to end date",
        ),
      );
      return;
    }
    setIsDatePickerOpen(false);
    // Apply both bounds in one navigation so we never drop start or end.
    pushFilterUpdates({ start_date: nextStart, end_date: nextEnd });
  };

  const pushFilterUpdates = (partial) => {
    const updatedFilters = { ...filters, ...partial };
    setFilters((prev) => ({ ...prev, ...partial }));

    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([k, v]) => {
      if (k === "actions" && Array.isArray(v)) {
        const serializedAction = serializeDashboardActionFilter(v);
        if (serializedAction != null) {
          params.append("action", serializedAction);
        }
      } else if (k === "owner_type") {
        const serializedOwnerType = serializeOwnerTypeFilter(v);
        if (serializedOwnerType) {
          params.append("owner_type", serializedOwnerType);
        }
      } else if (k === "source") {
        if (canShowLeadSourceFilter(clientId, canViewAllDashboardLeads())) {
          const serializedSource = serializeLeadSourceFilter(v);
          if (serializedSource) {
            params.append("source", serializedSource);
          }
        }
      } else if (k === "campaign_id") {
        const campaignId = typeof v === "string" ? v.trim() : "";
        if (campaignId) params.append("campaign_id", campaignId);
      } else if (k === "author") {
        // "All" → omit author entirely so the API returns all leads.
        const author = typeof v === "string" ? v.trim() : "";
        if (author) params.append("author", author);
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

  const onFilterChange = (key, value) => {
    let nextValue = value;
    if (key === "start_date") {
      nextValue = normalizeDashboardStartDate(value) || value;
    } else if (key === "end_date") {
      nextValue = normalizeDashboardEndDate(value) || value;
    }
    pushFilterUpdates({ [key]: nextValue });
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
    // Empty = "All" → do not send author to the API (admins/owners only).
    const nextAuthor = raw.trim();

    if (nextAuthor && !isValidEmail(nextAuthor)) {
      setAuthorError(
        translate(
          "dashboardFilter.author.invalidEmail",
          "Enter a valid email address",
        ),
      );
      return;
    }

    if (!isAllowedDashboardAuthor(nextAuthor)) {
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

  /** owner_type is now a single exact match — selecting again clears it. */
  const selectOwnerType = (ownerTypeValue) => {
    const next = filters.owner_type === ownerTypeValue ? "" : ownerTypeValue;
    setFilters((prev) => ({
      ...prev,
      owner_type: next,
    }));
    onFilterChange("owner_type", next);
  };

  const clearOwnerTypeFilters = () => {
    setFilters((prev) => ({
      ...prev,
      owner_type: "",
    }));
    onFilterChange("owner_type", "");
  };

  /** campaign_id is now a single exact match — selecting again clears it. */
  const selectCampaign = (campaignId) => {
    const next = filters.campaign_id === campaignId ? "" : campaignId;
    setFilters((prev) => ({
      ...prev,
      campaign_id: next,
    }));
    onFilterChange("campaign_id", next);
  };

  const clearCampaignFilters = () => {
    setFilters((prev) => ({
      ...prev,
      campaign_id: "",
    }));
    onFilterChange("campaign_id", "");
  };

  /** source is now a single exact match — selecting again clears it. */
  const selectSource = (sourceValue) => {
    const next = filters.source === sourceValue ? "" : sourceValue;
    setFilters((prev) => ({
      ...prev,
      source: next,
    }));
    onFilterChange("source", next);
  };

  const clearSourceFilters = () => {
    setFilters((prev) => ({
      ...prev,
      source: "",
    }));
    onFilterChange("source", "");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSortChange = (nextSort) => {
    setIsSortDropdownOpen(false);
    // Instant local reorder of loaded leads — no API refetch (sort is client-only).
    setLeadSort(nextSort);
  };

  const handleResetFilters = () => {
    const defaultAuthor =
      !isAdminUser && loggedInEmail ? loggedInEmail : "";
    setAuthorError("");
    setFilters({
      actions: [NEW_LEAD_ACTION],
      owner_type: "",
      start_date: getDefaultDashboardStartDate(),
      end_date: getDefaultDashboardEndDate(),
      campaign_id: "",
      source: "",
      author: defaultAuthor,
    });
    setIsActionDropdownOpen(false);
    setIsOwnerTypeDropdownOpen(false);
    setIsCampaignDropdownOpen(false);
    setIsSourceDropdownOpen(false);
    setIsSortDropdownOpen(false);
    setIsAuthorDropdownOpen(false);
    setIsDatePickerOpen(false);
    if (typeof onResetFilters === "function") {
      onResetFilters();
      return;
    }
    const params = new URLSearchParams();
    params.set("action", NEW_LEAD_ACTION);
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
                {filters.owner_type && (
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
                      type="radio"
                      name="dashboard_owner_type"
                      checked={filters.owner_type === option.value}
                      onChange={() => selectOwnerType(option.value)}
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
                {filters.campaign_id
                  ? filters.campaign_id
                  : translate("dashboardFilter.campaigns.allCampaigns")}
              </span>
              <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
            </div>

            {isCampaignDropdownOpen && (
              <div className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto`}>
                {filters.campaign_id && (
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
                        type="radio"
                        name="dashboard_campaign_id"
                        checked={filters.campaign_id === campaign}
                        onChange={() => selectCampaign(campaign)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{campaign}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {showSourceFilter ? (
            <div
              className={`relative ${isSourceDropdownOpen ? "z-[90]" : "z-[60]"} ${fieldShellClass}`}
              ref={sourceDropdownRef}
            >
              <div
                id="lead_source"
                role="button"
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={isSourceDropdownOpen}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setIsSourceDropdownOpen((open) => !open);
                }}
                onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                className={`${DASHBOARD_TRIGGER} ${triggerWidthClass} ${
                  compact ? "h-9 min-h-[36px]" : "h-10"
                }`}
              >
                <span className="whitespace-nowrap">{sourceFilterLabel}</span>
                <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
              </div>

              {isSourceDropdownOpen && (
                <div className={`absolute ltr:left-0 rtl:right-0 top-full z-[100] mt-1 ${menuWidthClass} rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto`}>
                  {filters.source && (
                    <button
                      type="button"
                      onClick={clearSourceFilters}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2 mb-1"
                    >
                      <X size={16} />
                      {translate("dashboardFilter.actions.clearAll", "Clear All")}
                    </button>
                  )}

                  {sourceOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dashboard_source"
                        checked={filters.source === option.value}
                        onChange={() => selectSource(option.value)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div
            ref={datePickerTriggerRef}
            className={`relative ${isDatePickerOpen ? "z-[120]" : "z-[60]"} ${dateShellClass}`}
          >
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

            {isDatePickerOpen &&
              datePickerPosition &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={datePickerPanelRef}
                  role="dialog"
                  aria-label={translate(
                    "dashboardFilter.datePicker.title",
                    "Date range",
                  )}
                  className="fixed z-[300] rounded-md border border-gray-200 bg-white p-3 shadow-xl overflow-y-auto overscroll-contain"
                  style={{
                    top: datePickerPosition.top,
                    bottom: datePickerPosition.bottom,
                    left: datePickerPosition.left,
                    width: datePickerPosition.width,
                    maxHeight: datePickerPosition.maxHeight,
                  }}
                >
                  <div className="space-y-3">
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={translate(
                        "dashboardFilter.datePicker.presets",
                        "Quick ranges",
                      )}
                    >
                      {dateRangePresets.map((preset) => {
                        const selected = activePresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              const range = buildDashboardDateRangeDaysAgo(
                                preset.daysAgo,
                              );
                              setFilters((prev) => ({
                                ...prev,
                                start_date: range.start_date,
                                end_date: range.end_date,
                              }));
                            }}
                            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                              selected
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-gray-200 bg-white text-gray-700 hover:border-primary/30"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <FormInput
                      type="date"
                      label={translate("dashboardFilter.datePicker.startDate")}
                      value={startDay}
                      max={endDay || undefined}
                      error={isDateRangeInvalid}
                      onChange={(filter) => {
                        const selectedDate = filter.target.value;
                        if (!selectedDate) return;
                        applyDateRangeDraft(
                          selectedDate,
                          endDay || selectedDate,
                          "start",
                        );
                      }}
                    />

                    <FormInput
                      type="date"
                      label={translate("dashboardFilter.datePicker.endDate")}
                      value={endDay}
                      min={startDay || undefined}
                      error={isDateRangeInvalid}
                      onChange={(filter) => {
                        const selectedDate = filter.target.value;
                        if (!selectedDate) return;
                        applyDateRangeDraft(
                          startDay || selectedDate,
                          selectedDate,
                          "end",
                        );
                      }}
                    />

                    {isDateRangeInvalid ? (
                      <p className="text-xs text-red-600" role="alert">
                        {translate(
                          "dashboardFilter.datePicker.invalidRange",
                          "Start date must be before or equal to end date",
                        )}
                      </p>
                    ) : null}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        {translate("dashboardFilter.datePicker.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={onApplyDateFilter}
                        disabled={isDateRangeInvalid}
                        className="bg-blue-600 hover:opacity-95 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {translate("dashboardFilter.datePicker.apply")}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body,
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
              resolveSelectedLabel={resolveAuthorSelectedLabel}
              searchFields={["name", "email"]}
              placeholder={translate("dashboardFilter.author.placeholder", "Author")}
              showAllOption={isAdminUser}
              allOptionLabel={translate(
                "dashboardFilter.author.all",
                "All Employees",
              )}
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
                isFiltersDropdownOpen ? "z-[120]" : "z-30"
              }`}
            >
              {filterControls}
            </div>
          </PanelSection>

          <PanelSection
            title={translate("dashboardFilter.panel.sections.sorting", "Sorting")}
          >
            <div
              className={`relative min-w-0 ${
                isSortDropdownOpen ? "z-[120]" : "z-30"
              }`}
            >
              {sortControl}
            </div>
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
          isFilterMenuOpen ? "z-[120]" : "z-30"
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
