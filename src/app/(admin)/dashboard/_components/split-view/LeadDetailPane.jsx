"use client";

import ActionsHistoryPanel from "@/app/(admin)/dashboard/_components/actions-history-panel";
import AddActionOverlay from "@/app/(admin)/dashboard/_components/add-action-overlay";
import ChatWith from "@/components/chat/chat-with";
import ChatConversation from "@/components/chat/chat-conversation";
import ToggleReplyType from "@/app/(admin)/dashboard/[userId]/_components/reply-type";
import { LEAD_CONVERSATION_MESSAGE_LIMIT } from "@/constants/conversation-limits";
import { useI18n } from "@/hooks/useI18n";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useDashboardLeadsBulk } from "@/context/dashboard-leads-bulk-context";
import {
  createMatchShareToken,
  deleteUser,
  getChatHistory,
  getClientActions,
  getClientRequirements,
  addLeadTags,
  removeLeadTags,
} from "@/utils/api";
import { formatPhoneForDisplay, phoneToE164 } from "@/components/phone/phone-utils";
import { normalizeLastAction } from "@/utils/actions";
import { formatDateTimeAmPmShort, formatDateForDisplay } from "@/utils/formateDate";
import { formatCurrency } from "@/utils/formatters";
import { appendRequirementPriceChips } from "@/lib/match/requirement-to-units-filter";
import { userKeys, patchUserInInfiniteUsersCaches } from "@/utils/query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  AlertTriangle,
  Bath,
  Bed,
  Building2,
  Calendar,
  DollarSign,
  Eye,
  FileText,
  Home,
  Landmark,
  ListChecks,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Square,
  Tag,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DASHBOARD_BUTTON } from "@/constants/ui-classes";
import TagChip from "@/components/ui/tag-chip";
import { ThreeDotsLoader } from "@/components/ui/loading-spinner";
import EditRequirementDialog from "./EditRequirementDialog";
import EditUserInfoDialog from "./EditUserInfoDialog";
import LeadDetailTabs from "./LeadDetailTabs";
import BulkLeadActionDialog from "./BulkLeadActionDialog";
import { getOwnerTypeLabel, normalizeOwnerType, isListingOwnerType } from "@/constants/owner-type";
import LeadOwnerUnitsPanel from "./LeadOwnerUnitsPanel";
import { useLocalizedLocationLabels } from "@/hooks/use-localized-location-labels";
import { isDashboardAdminRole } from "@/lib/dashboard-lead-access";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";

const VALID_TABS = new Set(["conversations", "requirements", "actions"]);
const DEFAULT_TAB = "conversations";

// ---------- Requirement summary helpers (local to this file) ----------

const pickLast = (v) => (Array.isArray(v) ? v[v.length - 1] : v);

const isMeaningfulString = (v) => {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  return lower !== "n/a" && lower !== "not defined" && lower !== "none";
};

const isMeaningfulNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
};

const formatAreaM2 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  const rounded = Number.isInteger(n) ? String(Math.floor(n)) : String(n);
  return `${rounded} m²`;
};

const toTitleCase = (value) =>
  String(value)
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toCamelKey = (value) =>
  String(value)
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");

export default function LeadDetailPane({
  userId,
  leadSummary,
  onInvalidateList,
  onLeadRemoved,
  showBackButton = false,
  onBack,
  isListLoading = false,
}) {
  const { translate, common, property, localeUtils, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { selectedLeads, hasSelection, clearLeadSelection } = useDashboardLeadsBulk();
  const {
    canCreate: canCreateAction,
    canDelete: canDeleteLead,
    isReady: actionsPermissionReady,
  } = useModuleActions("conversation");
  const canShowDeleteLead =
    canDeleteLead && isDashboardAdminRole(getRoleFromToken());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [openAddAction, setOpenAddAction] = useState(false);
  const [rowActions, setRowActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [matchShareDialogOpen, setMatchShareDialogOpen] = useState(false);
  const [includePresentValueInShare, setIncludePresentValueInShare] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const rawTabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.has(rawTabParam) ? rawTabParam : DEFAULT_TAB;

  const setActiveTab = useCallback(
    (nextTab) => {
      if (!VALID_TABS.has(nextTab)) return;
      const usp = new URLSearchParams(searchParams.toString());
      if (nextTab === DEFAULT_TAB) {
        usp.delete("tab");
      } else {
        usp.set("tab", nextTab);
      }
      const qs = usp.toString();
      router.replace(
        `${window.location.pathname}${qs ? `?${qs}` : ""}`,
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  // When switching to a different lead, fall back to the default tab so the
  // user always lands in Conversations first. We only clean up if the URL is
  // currently pointing at a non-default tab to avoid an unnecessary replace.
  useEffect(() => {
    if (!userId) return;
    const current = searchParams.get("tab");
    if (current && current !== DEFAULT_TAB && !VALID_TABS.has(current)) {
      setActiveTab(DEFAULT_TAB);
    }
    // Intentionally only react to userId changes — switching tabs within the
    // same lead must not retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["chatHistory", userId, LEAD_CONVERSATION_MESSAGE_LIMIT],
    queryFn: () =>
      getChatHistory(userId, { limit: LEAD_CONVERSATION_MESSAGE_LIMIT }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: requirements } = useQuery({
    queryKey: ["requirements", userId],
    queryFn: () => getClientRequirements(userId),
    enabled:
      !!userId && !isListingOwnerType(leadSummary?.owner_type),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const requirementLocation = requirements && !requirements.error ? requirements : null;
  const { text: localizedRequirementLocation } = useLocalizedLocationLabels({
    city: pickLast(requirementLocation?.city) || "",
    district: pickLast(requirementLocation?.district) || "",
    sub_district: pickLast(requirementLocation?.sub_district) || "",
  });

  const phoneNumber =
    leadSummary?.phone_number ||
    data?.data?.phoneNumber ||
    data?.data?.phone_number ||
    null;

  const chatId =
    leadSummary?.chat_id || data?.data?.chat_id || null;

  const phoneE164ForLinks = phoneNumber
    ? phoneToE164(phoneNumber, "EG") || phoneNumber
    : null;

  const headerPhoneDisplay = phoneNumber
    ? formatPhoneForDisplay(phoneNumber, "EG") || phoneNumber
    : null;

  // Prefer dashboard list client_id so AI reply can render before chat history loads.
  const clientId = leadSummary?.client_id ?? data?.data?.client_id;

  // Prefer list/chat boolean when present; missing → treat as off for UI only
  // (button must still render — do not gate visibility on this field).
  const aiReplyEnabled =
    typeof leadSummary?.ai_reply_enabled === "boolean"
      ? leadSummary.ai_reply_enabled
      : typeof leadSummary?.toggle_ai_auto_reply === "boolean"
        ? leadSummary.toggle_ai_auto_reply
        : typeof data?.data?.ai_reply_enabled === "boolean"
          ? data.data.ai_reply_enabled
          : typeof data?.data?.toggle_ai_auto_reply === "boolean"
            ? data.data.toggle_ai_auto_reply
            : false;

  const handleAiReplyEnabledChange = useCallback(
    (enabled) => {
      if (!userId || typeof enabled !== "boolean") return;
      patchUserInInfiniteUsersCaches(queryClient, userId, {
        ai_reply_enabled: enabled,
      });
      queryClient.setQueryData(
        ["chatHistory", userId, LEAD_CONVERSATION_MESSAGE_LIMIT],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              ai_reply_enabled: enabled,
            },
          };
        },
      );
    },
    [queryClient, userId],
  );
  const displayName = leadSummary?.name || data?.data?.name || "";
  const ownerType = normalizeOwnerType(
    leadSummary?.owner_type ?? data?.data?.owner_type,
  );
  const showListedUnits = isListingOwnerType(ownerType);
  const ownerTypeLabel = ownerType ? getOwnerTypeLabel(ownerType, translate) : "";
  const companyName =
    leadSummary?.company_name ?? data?.data?.company_name ?? "";
  const leadNotes = leadSummary?.notes ?? data?.data?.notes ?? "";
  const leadAuthor = String(
    leadSummary?.author ?? data?.data?.author ?? "",
  ).trim();

  const clearSelection = useCallback(() => {
    const usp = new URLSearchParams(searchParams.toString());
    usp.delete("userId");
    router.replace(`${window.location.pathname}?${usp.toString()}`, {
      scroll: false,
    });
  }, [router, searchParams]);

  const handleDeleteUser = async () => {
    if (!userId || !clientId) return;
    setIsDeleting(true);
    try {
      await deleteUser(userId, clientId);
      toast.success(common.userDeleted);
      clearSelection();
      onLeadRemoved?.(userId);
      queryClient.removeQueries({ queryKey: ["chatHistory", userId] });
    } catch (err) {
      toast.error(err?.message || common.operationFailed);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Prefetch action history as soon as the Actions tab is opened.
  useEffect(() => {
    setRowActions([]);
    setOpenAddAction(false);
  }, [userId]);

  useEffect(() => {
    if (activeTab !== "actions" || !userId) return;

    let cancelled = false;
    setLoadingActions(true);

    (async () => {
      try {
        const actions = await getClientActions(userId);
        if (cancelled) return;
        setRowActions(Array.isArray(actions) ? actions : []);
      } catch (e) {
        if (cancelled) return;
        console.error(e?.message ?? e);
        toast.error(common.operationFailed);
        setRowActions([]);
      } finally {
        if (!cancelled) setLoadingActions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, userId, common.operationFailed]);

  const handleActionSaved = useCallback(
    (createdAction) => {
      if (createdAction?.action) {
        setRowActions((prev) => [...(Array.isArray(prev) ? prev : []), createdAction]);
      }
    },
    [],
  );

  // Optimistic last-action update — no refetch. Do not bump `updated_at` here:
  // that would re-sort the row (often to the end). User moves it via Move to bottom.
  const handleActionUpdate = useCallback(
    (uid, newAction, createdAction) => {
      if (!uid) return;
      const lastActionValue = createdAction?.action ?? newAction;
      patchUserInInfiniteUsersCaches(queryClient, uid, {
        last_action: normalizeLastAction(lastActionValue),
      });
      queryClient.setQueryData(
        ["chatHistory", uid, LEAD_CONVERSATION_MESSAGE_LIMIT],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: { ...old.data, last_action: lastActionValue },
          };
        },
      );
    },
    [queryClient],
  );

  const afterMutation = () => {
    onInvalidateList?.();
    queryClient.invalidateQueries({ queryKey: userKeys.all });
    queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
    queryClient.invalidateQueries({ queryKey: ["requirements", userId] });
  };

  const handleContactUpdated = useCallback(
    (updatedLead, _response, submittedPayload) => {
      const patch = {};

      if (updatedLead && typeof updatedLead === "object") {
        if (updatedLead.name !== undefined) patch.name = updatedLead.name;
        if (updatedLead.phone_number !== undefined) {
          patch.phone_number = updatedLead.phone_number;
        }
        if (updatedLead.company_name !== undefined) {
          patch.company_name = updatedLead.company_name;
        }
        if (updatedLead.owner_type !== undefined) {
          patch.owner_type = updatedLead.owner_type;
        }
        if (updatedLead.notes !== undefined) patch.notes = updatedLead.notes;
      } else if (submittedPayload) {
        if (submittedPayload.name !== undefined) patch.name = submittedPayload.name;
        if (submittedPayload.phone_number !== undefined) {
          patch.phone_number = submittedPayload.phone_number;
        }
        if (submittedPayload.company_name !== undefined) {
          patch.company_name = submittedPayload.company_name;
        }
        if (submittedPayload.owner_type !== undefined) {
          patch.owner_type = submittedPayload.owner_type;
        }
        if (submittedPayload.notes) {
          const prior = String(leadNotes || "").trim();
          patch.notes = prior
            ? `${prior}\n${submittedPayload.notes}`
            : submittedPayload.notes;
        }
      }

      if (Object.keys(patch).length > 0) {
        patchUserInInfiniteUsersCaches(queryClient, userId, patch);
        queryClient.setQueryData(
          ["chatHistory", userId, LEAD_CONVERSATION_MESSAGE_LIMIT],
          (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              ...patch,
            },
          };
        });
      }

      afterMutation();
    },
    [leadNotes, onInvalidateList, queryClient, userId],
  );

  const handleOpenMatch = () => {
    if (!userId || creatingMatch) return;
    setIncludePresentValueInShare(false);
    setMatchShareDialogOpen(true);
  };

  const handleConfirmMatchShare = async () => {
    if (!userId || creatingMatch) return;
    setCreatingMatch(true);
    try {
      const req =
        requirements && !requirements.error ? requirements : {};
      const { token } = await createMatchShareToken({
        client_id: clientId || req.client_id || "",
        user_id: userId,
        lead: {
          name: displayName,
          phone_number: phoneNumber,
        },
        requirements: req,
        include_present_value: Boolean(includePresentValueInShare),
      });
      if (!token) {
        throw new Error("No share token returned");
      }
      setMatchShareDialogOpen(false);
      window.open(`/match/${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(
        e?.message ||
          translate("matchPage.createFailed", "Could not open match page"),
      );
    } finally {
      setCreatingMatch(false);
    }
  };

  // Translate an enum-like value (e.g., "fully finished" -> property.finishing.fullyFinished).
  // Falls back to a clean title-cased label if no translation key matches.
  // We use a sentinel fallback (not null) so the i18n hook does not enter its
  // strict "missing key" branch — enum probing is expected to miss often
  // (e.g. free-text `requirement_name` values like "Director").
  const translateEnum = useCallback(
    (groupKey, raw) => {
      const value = pickLast(raw);
      if (!isMeaningfulString(value)) return null;
      const stringValue = String(value).trim();
      const candidates = [stringValue, toCamelKey(stringValue)];
      const MISSING = "__enum_missing__";
      for (const key of candidates) {
        const path = `property.${groupKey}.${key}`;
        const result = translate(path, MISSING);
        if (result && result !== MISSING && result !== path) return result;
      }
      return toTitleCase(stringValue);
    },
    [translate]
  );

  /**
   * Build a clean, scannable list of requirement chips for the personalized
   * summary. Anything empty / null / zero / "N/A" / a system default placeholder
   * is intentionally excluded so we only surface what the lead actually told us.
   */
  const requirementChips = useMemo(() => {
    const r = requirements && !requirements.error ? requirements : null;
    if (!r) return [];

    const chips = [];
    const fieldLabel = (key) => translate(`propertyDetails.fields.${key}`);
    const pushChip = (chip) => {
      if (chip && chip.value) chips.push(chip);
    };

    // Building type — primary signal.
    const buildingTypeLabel = translateEnum("buildingTypes", r.buildingType);
    if (buildingTypeLabel) {
      pushChip({
        key: "buildingType",
        icon: Home,
        label: fieldLabel("buildingType"),
        value: buildingTypeLabel,
      });
    }

    // Location — collapse country/city/district/project into one chip when present.
    const locationParts = [r.country, localizedRequirementLocation, r.project]
      .filter(isMeaningfulString)
      .map((p) => String(p).trim());
    if (locationParts.length > 0) {
      pushChip({
        key: "location",
        icon: MapPin,
        label: translate("propertyDetails.location", "Location"),
        value: locationParts.join(" • "),
      });
    }

    if (isMeaningfulString(r.developer)) {
      pushChip({
        key: "developer",
        icon: Landmark,
        label: fieldLabel("developer"),
        value: String(r.developer).trim(),
      });
    }

    if (isMeaningfulNumber(r.roomsCount)) {
      pushChip({
        key: "roomsCount",
        icon: Bed,
        label: fieldLabel("roomsCount"),
        value: String(Math.floor(Number(r.roomsCount))),
      });
    }

    if (isMeaningfulNumber(r.bathroomCount)) {
      pushChip({
        key: "bathroomCount",
        icon: Bath,
        label: fieldLabel("bathroomCount"),
        value: String(Math.floor(Number(r.bathroomCount))),
      });
    }

    const landArea = formatAreaM2(r.land_area);
    if (landArea) {
      pushChip({
        key: "land_area",
        icon: Square,
        label: fieldLabel("landArea"),
        value: landArea,
      });
    }

    if (isMeaningfulNumber(r.floor)) {
      pushChip({
        key: "floor",
        icon: Building2,
        label: fieldLabel("floor"),
        value: String(Math.floor(Number(r.floor))),
      });
    }

    const viewLabel = translateEnum("view", r.viewType);
    if (viewLabel) {
      pushChip({
        key: "viewType",
        icon: Eye,
        label: fieldLabel("viewType"),
        value: viewLabel,
      });
    }

    const finishingLabel = translateEnum("finishing", r.finishingType);
    if (finishingLabel) {
      pushChip({
        key: "finishingType",
        icon: Tag,
        label: fieldLabel("finishingType"),
        value: finishingLabel,
      });
    }

    const statusRaw = pickLast(r.propertyStatus);
    if (isMeaningfulString(statusRaw)) {
      const statusLabel = translateEnum("status", statusRaw);
      if (statusLabel) {
        pushChip({
          key: "propertyStatus",
          icon: Landmark,
          label: fieldLabel("propertyStatus"),
          value: statusLabel,
        });
      }
    }

    const purposeRaw = pickLast(r.purpose ?? r.propertyPurpose);
    if (isMeaningfulString(purposeRaw)) {
      const purposeKey = String(purposeRaw).trim();
      const purposeLabel = translate(
        `propertyPurpose.${purposeKey}`,
        toTitleCase(purposeKey),
      );
      pushChip({
        key: "purpose",
        icon: Tag,
        label: translate("propertyDetails.purpose", "Purpose"),
        value: purposeLabel,
      });
    }

    const usageLabel = translateEnum("usage", r.propertyUsage);
    if (usageLabel) {
      pushChip({
        key: "propertyUsage",
        icon: Tag,
        label: fieldLabel("propertyUsage"),
        value: usageLabel,
      });
    }

    const furnishingRaw = pickLast(r.furnishingType);
    if (isMeaningfulString(furnishingRaw)) {
      const furnishingLabel = translate(
        `property.furnishing.${String(furnishingRaw).trim()}`,
        toTitleCase(furnishingRaw),
      );
      pushChip({
        key: "furnishingType",
        icon: Tag,
        label: fieldLabel("furnishingType"),
        value: furnishingLabel,
      });
    }

    const gardenArea = formatAreaM2(r.gardenSize);
    if (gardenArea) {
      pushChip({
        key: "gardenSize",
        icon: Square,
        label: fieldLabel("gardenSize"),
        value: gardenArea,
      });
    }

    const garageArea = formatAreaM2(r.garageSize);
    if (garageArea) {
      pushChip({
        key: "garageSize",
        icon: Square,
        label: fieldLabel("garageSize"),
        value: garageArea,
      });
    }

    appendRequirementPriceChips(r, (priceChip) => {
      pushChip({
        key: priceChip.key,
        icon: DollarSign,
        label: priceChip.label,
        value: priceChip.value,
      });
    }, { translate, formatPrice: formatCurrency });

    if (isMeaningfulString(r.deliveryDate)) {
      let prettyDate = r.deliveryDate;
      try {
        prettyDate = formatDateForDisplay(r.deliveryDate, false);
      } catch {
        // keep raw value as-is.
      }
      pushChip({
        key: "deliveryDate",
        icon: Calendar,
        label: fieldLabel("deliveryDate"),
        value: prettyDate,
      });
    }

    const dealBreakersText = Array.isArray(r.dealBreakers)
      ? r.dealBreakers.filter(Boolean).join(", ")
      : isMeaningfulString(r.dealBreakers)
        ? String(r.dealBreakers).trim()
        : "";
    if (dealBreakersText) {
      pushChip({
        key: "dealBreakers",
        icon: Tag,
        label: translate(
          "dashboard.requirementsDialog.fields.dealBreakers",
          "Deal breakers",
        ),
        value: dealBreakersText,
      });
    }

    const featuresText = Array.isArray(r.additionalFeatures)
      ? r.additionalFeatures.filter(Boolean).join(", ")
      : isMeaningfulString(r.additionalFeatures)
        ? String(r.additionalFeatures).trim()
        : "";
    if (featuresText) {
      pushChip({
        key: "additionalFeatures",
        icon: Tag,
        label: translate(
          "dashboard.requirementsDialog.fields.additionalFeatures",
          "Additional features",
        ),
        value: featuresText,
      });
    }

    return chips;
  }, [requirements, translate, translateEnum, localizedRequirementLocation]);

  // Tag management functions
  const handleAddTag = async (e) => {
    e.preventDefault();
    const tagValue = newTagInput.trim();
    
    if (!tagValue) return;
    
    // Check for duplicates (case-insensitive) - use tags from leadSummary
    const currentTags = leadSummary?.tags || [];
    const isDuplicate = currentTags.some(tag => 
      tag.toLowerCase() === tagValue.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error("Tag already exists");
      setNewTagInput("");
      return;
    }

    setIsAddingTag(true);
    try {
      const result = await addLeadTags(userId, [tagValue]);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tag added successfully");
        setNewTagInput("");
        // Update local data optimistically - update both leadSummary and chat history
        queryClient.setQueryData(
          ["chatHistory", userId, LEAD_CONVERSATION_MESSAGE_LIMIT],
          (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              tags: [...(oldData.data.tags || []), tagValue],
            },
          };
        });
        // Also update the users list to reflect the change
        queryClient.setQueriesData(
          { queryKey: userKeys.infiniteList },
          (oldData) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map(page => ({
                ...page,
                users: page.users.map(user => 
                  user.user_id === userId 
                    ? { ...user, tags: [...(user.tags || []), tagValue] }
                    : user
                )
              }))
            };
          }
        );
        afterMutation();
      }
    } catch (error) {
      toast.error(error?.message || "Failed to add tag");
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      const result = await removeLeadTags(userId, [tagToRemove]);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tag removed successfully");
        // Update local data optimistically - update both leadSummary and chat history
        queryClient.setQueryData(
          ["chatHistory", userId, LEAD_CONVERSATION_MESSAGE_LIMIT],
          (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              tags: (oldData.data.tags || []).filter(tag => tag !== tagToRemove),
            },
          };
        });
        // Also update the users list to reflect the change
        queryClient.setQueriesData(
          { queryKey: userKeys.infiniteList },
          (oldData) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map(page => ({
                ...page,
                users: page.users.map(user => 
                  user.user_id === userId 
                    ? { ...user, tags: (user.tags || []).filter(tag => tag !== tagToRemove) }
                    : user
                )
              }))
            };
          }
        );
        afterMutation();
      }
    } catch (error) {
      toast.error(error?.message || "Failed to remove tag");
    }
  };

  // Dashboard list summary: same fields as GET /messages/v2/all → users[]:
  // `company_name`, `requirement_name` (building type slug or free text).
  // Falls back to legacy summary* fields on conversation payload if present.
  const leadSummaryText = useMemo(() => {
    const company =
      leadSummary?.company_name != null &&
      String(leadSummary.company_name).trim() !== ""
        ? String(leadSummary.company_name).trim()
        : "";

    const reqRaw =
      leadSummary?.requirement_name != null
        ? String(leadSummary.requirement_name).trim()
        : "";
    const reqInvalid =
      !reqRaw || reqRaw.toLowerCase() === "not defined";
    const requirementDisplay = reqInvalid
      ? ""
      : translateEnum("buildingTypes", reqRaw) || reqRaw;

    const companyLabel = translate("leadDetail.leadSummary.companyLabel");
    const requirementLabel = translate("leadDetail.leadSummary.requirementLabel");

    const lines = [];
    if (company) lines.push(`${companyLabel}: ${company}`);
    if (requirementDisplay)
      lines.push(`${requirementLabel}: ${requirementDisplay}`);
    if (lines.length > 0) return lines.join("\n");

    const candidates = [
      data?.data?.summary,
      data?.data?.conversation_summary,
      data?.data?.lead_summary,
      data?.data?.summary_text,
      leadSummary?.summary,
      leadSummary?.conversation_summary,
      leadSummary?.summary_text,
    ];
    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  }, [data, leadSummary, translate, translateEnum]);

  if (!userId) {
    if (isListLoading) {
      return (
        <ThreeDotsLoader
          label={common.loadingData || common.loading}
          containerClassName="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50"
        />
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 text-sm p-6">
        {common.selectLead}
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <ThreeDotsLoader
        label={common.loadingConversation}
        containerClassName="flex-1 flex flex-col items-center justify-center gap-3 bg-white"
      />
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-red-600 text-sm">
        {error?.message || common.couldNotLoadChat}
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] })}
          className="mt-2 px-3 py-1 bg-primary text-white rounded text-xs"
        >
          {common.retry}
        </button>
      </div>
    );
  }

  const tabItems = [
    {
      id: "conversations",
      label: translate("leadDetail.tabs.conversations"),
      icon: MessageCircle,
    },
    {
      id: "requirements",
      label: showListedUnits
        ? translate("leadDetail.tabs.units")
        : translate("leadDetail.tabs.requirements"),
      icon: showListedUnits ? Home : FileText,
    },
    {
      id: "actions",
      label: translate("leadDetail.tabs.actions"),
      icon: Settings2,
    },
  ];

  const lastActivityLabel = translate("leadDetail.header.lastActivity");

  // Read-only AI/lead summary card shown on top of the Actions tab so the
  // user can scan context (not the requirement chips — those live on the
  // Requirements tab to avoid duplication).
  const renderLeadSummaryCard = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <UserCircle2 className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {translate("leadDetail.leadSummary.title")}
          </h4>
          {leadSummaryText ? (
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
              {leadSummaryText}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              {translate("leadDetail.leadSummary.empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Reusable client/requirement summary card rendered on the Requirements tab
  // and as a context card on top of the Actions tab so the user always has
  // their lead's needs in view while taking actions.
  const renderRequirementSummaryCard = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <UserCircle2 className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {translate("leadDetail.requirementSummary.title")}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleOpenMatch}
                disabled={creatingMatch}
                className="inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                title={translate("leadDetail.requirementSummary.matchTitle", "Match units")}
                aria-label={translate("leadDetail.requirementSummary.matchTitle", "Match units")}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {creatingMatch
                    ? "..."
                    : translate("leadDetail.requirementSummary.match", "Match")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditReqOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                title={translate("leadDetail.requirementSummary.editTitle")}
                aria-label={translate("leadDetail.requirementSummary.editTitle")}
              >
                {requirementChips.length > 0 ? (
                  <Pencil className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>
                  {requirementChips.length > 0
                    ? translate("common.edit", common.edit)
                    : translate("leadDetail.requirementSummary.addAction")}
                </span>
              </button>
            </div>
          </div>

          {requirementChips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {requirementChips.map(({ key, icon: Icon, label, value }) => (
                <div
                  key={key}
                  className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 transition-colors px-2 py-1 rounded-md border border-gray-100 text-xs max-w-full"
                >
                  <Icon
                    className="w-3.5 h-3.5 text-gray-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-gray-500 shrink-0">{label}:</span>
                  <span className="font-semibold text-gray-900 truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              {translate("leadDetail.requirementSummary.empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col min-h-0 min-w-0 flex-1 w-full bg-white lg:border-l border-gray-100 overflow-x-hidden">
        <div
          className={`shrink-0 flex flex-wrap lg:flex-nowrap items-center gap-x-2 gap-y-1 px-3 py-1.5 border-b border-gray-200 bg-white min-w-0 ${
            !showBackButton ? "lg:pe-28" : ""
          }`}
        >
          {showBackButton ? (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 inline-flex items-center justify-center min-h-10 min-w-10 h-10 w-10 lg:h-8 lg:w-8 lg:min-h-8 lg:min-w-8 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={translate("common.back", common.back || "Back")}
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" aria-hidden />
            </button>
          ) : null}
          <div className="flex-1 min-w-0 flex flex-wrap lg:flex-nowrap items-center gap-x-2 gap-y-1">
            <ChatWith
              key={userId}
              name={displayName}
              userId={userId}
              onNameUpdate={() => afterMutation()}
              showEditButton={false}
            />
            {headerPhoneDisplay ? (
              <span
                dir="ltr"
                className="min-w-0 text-sm leading-snug text-gray-700 font-mono tabular-nums truncate max-w-[40%] sm:max-w-[12rem]"
              >
                {headerPhoneDisplay}
              </span>
            ) : null}
            {ownerTypeLabel ? (
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${
                  ownerType === "broker"
                    ? "bg-amber-50 text-amber-700"
                    : ownerType === "developer"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-sky-50 text-sky-700"
                }`}
              >
                {ownerTypeLabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setEditContactOpen(true)}
            className="shrink-0 inline-flex items-center justify-center gap-1 text-xs text-primary hover:bg-primary/5 min-h-10 min-w-10 lg:min-h-0 lg:min-w-0 px-2.5 py-2 lg:px-2 lg:py-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            title={translate("editContact.title", "Edit contact")}
            aria-label={translate("editContact.title", "Edit contact")}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">
              {translate("common.edit", common.edit)}
            </span>
          </button>
          {clientId && userId ? (
            <ToggleReplyType
              key={userId}
              userId={userId}
              clientID={clientId}
              initialEnabled={aiReplyEnabled}
              onEnabledChange={handleAiReplyEnabledChange}
            />
          ) : null}
          {actionsPermissionReady &&
            canCreateAction &&
            hasSelection &&
            selectedLeads.length > 0 && (
              <button
                type="button"
                onClick={() => setBulkActionOpen(true)}
                className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/5 min-h-10 lg:min-h-0 px-2.5 py-2 lg:px-2 lg:py-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                title={translate("dashboardFilter.bulkAction.openButton").replace(
                  "{count}",
                  String(selectedLeads.length)
                )}
              >
                <ListChecks className="w-3.5 h-3.5" aria-hidden />
                <span>
                  {translate("dashboardFilter.bulkAction.openButton").replace(
                    "{count}",
                    String(selectedLeads.length)
                  )}
                </span>
              </button>
            )}
          {leadSummary?.updated_at && (
            <span
              dir="ltr"
              title={lastActivityLabel}
              className="hidden sm:inline shrink-0 text-[11px] text-gray-400 tabular-nums"
            >
              {formatDateTimeAmPmShort(leadSummary.updated_at, locale)}
            </span>
          )}
        </div>

        {/* Tab strip */}
        <LeadDetailTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={tabItems}
          ariaLabel={translate("leadDetail.tabs.ariaLabel")}
        />

        {/* Active panel */}
        <div
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white"
        >
          {activeTab === "conversations" && (
            <ChatConversation
              userId={userId}
              chatId={chatId}
              clientId={clientId}
              messageLimit={LEAD_CONVERSATION_MESSAGE_LIMIT}
              className="flex-1 min-h-0"
            />
          )}

          {activeTab === "requirements" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-gray-50/40">
              {showListedUnits ? (
                <LeadOwnerUnitsPanel
                  phone={phoneE164ForLinks || phoneNumber || ""}
                />
              ) : (
                renderRequirementSummaryCard()
              )}
            </div>
          )}

          {activeTab === "actions" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/40">
              {/* Actions history — always visible; Add Action opens form overlay only */}
              <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <ActionsHistoryPanel
                  actions={rowActions}
                  userId={userId}
                  phoneNumber={phoneE164ForLinks || phoneNumber || ""}
                  name={displayName || ""}
                  ownerType={ownerType}
                  onActionUpdate={handleActionUpdate}
                  onActionsChange={setRowActions}
                  fillHeight={false}
                  className="border-0 bg-transparent"
                  isLoading={loadingActions}
                  headerAction={
                    canCreateAction ? (
                      <button
                        type="button"
                        onClick={() => setOpenAddAction(true)}
                        className={`${DASHBOARD_BUTTON} h-8 min-h-[32px] text-xs shrink-0`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {translate(
                          "actionForm.addNewAction",
                          locale === "ar"
                            ? "إضافة إجراء جديد"
                            : "Add New Action"
                        )}
                      </button>
                    ) : null
                  }
                />
              </section>

              {/* Lead summary — read-only AI/lead summary text for context */}
              {renderLeadSummaryCard()}

              {/* Tags */}
              <section className="rounded-lg border border-gray-200 bg-white p-3">
                <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {translate("leadDetail.actionsTab.sections.tags")}
                </h5>
                <div className="space-y-2">
                  {leadSummary?.tags && leadSummary.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {leadSummary.tags.map((tag, index) => (
                        <TagChip
                          key={`${tag}-${index}`}
                          label={tag}
                          size="xs"
                          removable={true}
                          onRemove={() => handleRemoveTag(tag)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {translate("leadDetail.actionsTab.noTags")}
                    </p>
                  )}
                  {leadAuthor ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {translate("leadDetail.actionsTab.authorLabel", "Author")}
                      </span>
                      <TagChip
                        label={leadAuthor}
                        size="xs"
                        compact
                        removable={false}
                      />
                    </div>
                  ) : null}
                  <form
                    onSubmit={handleAddTag}
                    className="flex flex-wrap gap-2"
                  >
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder={translate("clientsTable.tags.addPlaceholder")}
                      className="flex-1 min-w-[140px] px-2.5 py-2 min-h-10 lg:py-1.5 lg:min-h-0 text-base lg:text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isAddingTag}
                    />
                    <button
                      type="submit"
                      disabled={!newTagInput.trim() || isAddingTag}
                      className="px-3 py-2 min-h-10 lg:py-1.5 lg:min-h-0 text-sm lg:text-xs bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingTag
                        ? "..."
                        : translate("clientsTable.tags.addButton")}
                    </button>
                  </form>
                </div>
              </section>

              {/* Danger zone — admin/owner only */}
              {canShowDeleteLead && (
                <section className="rounded-lg border border-red-200 bg-red-50/40 p-3">
                  <h5 className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    {translate("leadDetail.actionsTab.sections.dangerZone")}
                  </h5>
                  <p className="text-[11px] text-red-700/80 mb-2">
                    {translate("leadDetail.actionsTab.dangerZoneHint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-300 bg-white text-red-700 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {translate("leadDetail.actionsTab.deleteLead")}
                  </button>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <BulkLeadActionDialog
        isOpen={bulkActionOpen}
        onClose={() => setBulkActionOpen(false)}
        selectedLeads={selectedLeads}
        onSuccess={() => {
          clearLeadSelection();
          onInvalidateList?.();
        }}
      />

      {openAddAction && (
        <AddActionOverlay
          userId={userId}
          phoneNumber={phoneE164ForLinks || phoneNumber || ""}
          name={displayName || ""}
          onClose={() => setOpenAddAction(false)}
          onSuccess={handleActionSaved}
          onActionUpdate={handleActionUpdate}
          ownerType={ownerType}
        />
      )}

      <EditRequirementDialog
        open={editReqOpen}
        onClose={() => setEditReqOpen(false)}
        userId={userId}
        onSuccess={afterMutation}
      />

      <EditUserInfoDialog
        open={editContactOpen}
        onClose={() => setEditContactOpen(false)}
        userId={userId}
        initialName={displayName}
        initialPhone={phoneNumber || ""}
        initialCompany={companyName}
        initialOwnerType={ownerType}
        initialNotes={leadNotes}
        onSuccess={handleContactUpdated}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full shadow-xl text-sm">
            <p className="font-medium text-gray-900 mb-2">{common.deleteUser}</p>
            <p className="text-gray-600 mb-4">{common.deleteCannotBeUndone}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border rounded"
              >
                {common.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-600 text-white rounded"
              >
                {isDeleting ? "…" : common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {matchShareDialogOpen && (
        <div className="fixed inset-0 z-[70] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full shadow-xl text-sm">
            <p className="font-medium text-gray-900 mb-2">
              {translate(
                "matchPage.shareDialogTitle",
                "Share matched units"
              )}
            </p>
            <p className="text-gray-600 mb-3">
              {translate(
                "matchPage.shareDialogHint",
                "Choose whether to include present value on the shared match page."
              )}
            </p>
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                checked={includePresentValueInShare}
                onChange={(e) =>
                  setIncludePresentValueInShare(e.target.checked)
                }
              />
              <span className="text-gray-700">
                {translate(
                  "matchPage.includePresentValue",
                  "Share present value with the lead"
                )}
              </span>
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMatchShareDialogOpen(false)}
                disabled={creatingMatch}
                className="px-3 py-1.5 border rounded"
              >
                {common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmMatchShare}
                disabled={creatingMatch}
                className="px-3 py-1.5 bg-primary text-white rounded disabled:opacity-50"
              >
                {creatingMatch
                  ? "…"
                  : translate("matchPage.openMatch", "Open match")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
