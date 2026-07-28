"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import UnitCodeSearch from "@/components/ui/unit-code-search";
import { usePendingApprovalUnitsPageData } from "@/hooks/use-pending-approval-units-page-data";
import { useUnitsByOwnerPhone } from "@/hooks/use-units-by-owner-phone";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableFurnishingTypeSelect from "@/components/ui/inputs/searchable-furnishing-type-select";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
// Temporarily hidden — author filter not needed at this stage.
// import AuthorFilterSelect from "@/components/ui/inputs/author-filter-select";
import { unitsSourcePendingQueryString } from "@/utils/units-navigation-source";
import { detectBrokerUnitIds } from "@/lib/units/detect-broker-units";
import {
  mergeBrokerUnitIds,
  readBrokerUnitIds,
} from "@/lib/units/broker-units-session";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypes } from "@/data/constants";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import AddNewWhatsappCampaignDialog from "@/app/(admin)/campaign-chat/_components/AddNewWhatsappCampaignDialog";
import { BULK_AVAILABILITY_DEFAULT_MESSAGE_AR } from "@/lib/units/unit-whatsapp-recipient";
import {
  getAuthorOptionLabel,
  resolveAuthorDisplayLabel,
  useTeamAuthorOptions,
} from "@/hooks/useTeamAuthorOptions";
import {
  canViewAllDashboardLeads,
  enforceDashboardAuthorOnParams,
  getDashboardLoggedInEmail,
} from "@/lib/dashboard-lead-access";
import {
  clearPendingApprovalSessionFilters,
  hasActivePendingApprovalFilters,
  readPendingApprovalSessionFilters,
  writePendingApprovalSessionFilters,
} from "@/lib/units/pending-approval-session-filters";
import { phoneToE164 } from "@/components/phone/phone-utils";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { Loader2, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

const DEFAULT_VISIBILITY = "pending_approval";

const FILTER_BUTTON_CLASS =
  "[&>div>button]:bg-[#F6F7FB] [&>div>button]:border-[#E6E6E6] [&>div>button]:text-[#494A4B] [&>div>button]:text-sm [&>div>button]:h-11 [&>div>button]:min-h-11 [&>div>button]:px-2 [&>div>button]:py-[10px]";

/** Matches units filter dropdown button styling (for UnitsLocationSearch / bedrooms). */
const DROPDOWN_BUTTON_CLASS =
  "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors w-full";

const DATE_INPUT_CLASS =
  "w-full px-2 py-[10px] h-11 min-h-11 bg-[#F6F7FB] rounded-[5px] border border-[#E6E6E6] text-[#494A4B] text-base lg:text-sm focus:outline-none focus:ring-primary focus:border-primary";

const FURNISHING_TRANSLATION_KEYS = {
  furnished: "property.furnishing.furnished",
  unfurnished: "property.furnishing.unfurnished",
  hotel_furnished: "property.furnishing.hotelFurnished",
  "partially furnished": "property.furnishing.partiallyFurnished",
  "semi furnished": "property.furnishing.semiFurnished",
  flixy: "property.furnishing.flixy",
  turnkey: "property.furnishing.turnkey",
};

function normalizeOptionalFilter(value) {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "all") return "";
  return trimmed;
}

function formatLocationChip(city, district, subDistrict) {
  return [city, district, subDistrict].filter(Boolean).join(" › ");
}

function parseNumericFilter(value) {
  if (value === undefined || value === null || value === "") return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function WhatsAppIcon({ className = "w-4 h-4 text-green-600 shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
    </svg>
  );
}

function formatPriceInput(value) {
  if (!value) return "";
  const numericValue = String(value).replace(/\D/g, "");
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Normalize phones for option matching (E.164, else digits / last 9). */
function phonesMatch(a, b) {
  const rawA = String(a ?? "").trim();
  const rawB = String(b ?? "").trim();
  if (!rawA || !rawB) return false;

  const e164A = phoneToE164(rawA, "EG");
  const e164B = phoneToE164(rawB, "EG");
  if (e164A && e164B && e164A === e164B) return true;

  const digA = (e164A || rawA).replace(/\D/g, "");
  const digB = (e164B || rawB).replace(/\D/g, "");
  if (!digA || !digB) return false;
  if (digA === digB) return true;
  if (digA.length >= 9 && digB.length >= 9) {
    return digA.slice(-9) === digB.slice(-9);
  }
  return false;
}

function getTeamPhoneOptionLabel(option) {
  return getAuthorOptionLabel(option) || (option?.email ?? "") || (option?.phone ?? "");
}

/** Selected value is team member email; label prefers name. */
function resolveTeamPhoneDisplayLabel(email, options) {
  const selected = typeof email === "string" ? email.trim() : "";
  if (!selected) return "";
  const match = (options || []).find(
    (option) =>
      typeof option?.email === "string" &&
      option.email.toLowerCase() === selected.toLowerCase(),
  );
  if (match) return getTeamPhoneOptionLabel(match);
  return selected;
}

function resolveSelectedTeamMemberPhone(email, options) {
  const selected = typeof email === "string" ? email.trim() : "";
  if (!selected) return "";
  const match = (options || []).find(
    (option) =>
      typeof option?.email === "string" &&
      option.email.toLowerCase() === selected.toLowerCase(),
  );
  if (match?.phone) return String(match.phone).trim();
  // Legacy: value used to be the phone itself.
  const byPhone = (options || []).find((option) =>
    phonesMatch(option?.phone, selected),
  );
  return byPhone?.phone ? String(byPhone.phone).trim() : "";
}

export default function ResalePageQuery({ searchParams, initialUnitsData = null }) {
  const { t, locale, translate } = useI18n();
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const bulkSelection = useUnitsBulkSelectionOptional();
  const [isMounted, setIsMounted] = useState(false);
  const [isWhatsappBulkOpen, setIsWhatsappBulkOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  /** TEMP: unit ids flagged as broker after manual quick-search (admin/owner only). */
  const [brokerUnitIds, setBrokerUnitIds] = useState(() => new Set());
  const [isDetectingBrokers, setIsDetectingBrokers] = useState(false);
  const [brokerDetectProgress, setBrokerDetectProgress] = useState({
    done: 0,
    total: 0,
  });

  // Hydrate from sessionStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setBrokerUnitIds(readBrokerUnitIds());
  }, []);

  const visibilityOptions = useMemo(
    () => [
      {
        value: "pending_approval",
        label: t?.unitsFilter?.pendingApproval ?? "Pending Approval",
      },
      { value: "hidden", label: t?.unitsFilter?.hidden ?? "Hidden" },
    ],
    [t]
  );

  // Applied filters (drive API query) — desktop edits these directly
  const [filter, setFilter] = useState(DEFAULT_VISIBILITY);
  const [updatedAtDate, setUpdatedAtDate] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [furnishedType, setFurnishedType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [author, setAuthor] = useState("");
  /** Selected team member email → query units by their phone via /units/by-owner-phone. */
  const [teamPhone, setTeamPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [areaRangeError, setAreaRangeError] = useState("");

  // Mobile sheet draft (committed on Apply)
  const [draftFilter, setDraftFilter] = useState(DEFAULT_VISIBILITY);
  const [draftUpdatedAtDate, setDraftUpdatedAtDate] = useState("");
  const [draftPropertyType, setDraftPropertyType] = useState("");
  const [draftFurnishedType, setDraftFurnishedType] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [draftAuthor, setDraftAuthor] = useState("");
  const [draftTeamPhone, setDraftTeamPhone] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftDistrict, setDraftDistrict] = useState("");
  const [draftSubDistrict, setDraftSubDistrict] = useState("");
  const [draftBedrooms, setDraftBedrooms] = useState("");
  const [draftPurpose, setDraftPurpose] = useState("");
  const [draftMinArea, setDraftMinArea] = useState("");
  const [draftMaxArea, setDraftMaxArea] = useState("");
  const [draftAreaRangeError, setDraftAreaRangeError] = useState("");

  const didBootstrapSessionFiltersRef = useRef(false);
  const skipPersistUntilHydratedRef = useRef(false);

  const { authorOptions, teamPhoneOptions, isAdminUser, isLoading: isTeamLoading } =
    useTeamAuthorOptions({
      selectedAuthor: author || draftAuthor || "",
    });

  // Same author ACL as Leads: non-admin/non-owner forced to own email.
  useEffect(() => {
    const email = getDashboardLoggedInEmail();
    if (canViewAllDashboardLeads() || !email) return;
    setAuthor((prev) => {
      const current = typeof prev === "string" ? prev.trim() : "";
      return current.toLowerCase() === email.toLowerCase() ? prev : email;
    });
    setDraftAuthor((prev) => {
      const current = typeof prev === "string" ? prev.trim() : "";
      return current.toLowerCase() === email.toLowerCase() ? prev : email;
    });
  }, []);

  // Bootstrap once: restore session filters when returning to this page (same UX as units).
  useEffect(() => {
    if (didBootstrapSessionFiltersRef.current) return;
    didBootstrapSessionFiltersRef.current = true;

    const stored = readPendingApprovalSessionFilters();
    if (!hasActivePendingApprovalFilters(stored)) return;

    skipPersistUntilHydratedRef.current = true;

    let nextAuthor =
      typeof stored.author === "string" ? stored.author.trim() : "";
    const email = getDashboardLoggedInEmail();
    if (!canViewAllDashboardLeads() && email) {
      nextAuthor = email;
    }

    const nextVisibility = stored.visibility || DEFAULT_VISIBILITY;
    const nextUpdatedAt =
      typeof stored.updated_at === "string" ? stored.updated_at : "";
    const nextPropertyType =
      typeof stored.property_type === "string" ? stored.property_type : "";
    const nextFurnishedType =
      typeof stored.furnished_type === "string" ? stored.furnished_type : "";
    const nextMinPrice =
      stored.min_price != null ? String(stored.min_price) : "";
    const nextMaxPrice =
      stored.max_price != null ? String(stored.max_price) : "";
    const nextTeamPhone =
      typeof stored.team_phone === "string" ? stored.team_phone : "";
    const nextCity = typeof stored.city === "string" ? stored.city : "";
    const nextDistrict =
      typeof stored.district === "string" ? stored.district : "";
    const nextSubDistrict =
      typeof stored.sub_district === "string" ? stored.sub_district : "";
    const nextBedrooms =
      typeof stored.bedrooms === "string" ? stored.bedrooms : "";
    const nextPurpose =
      typeof stored.purpose === "string" ? stored.purpose : "";
    const nextMinArea =
      stored.min_area != null ? String(stored.min_area) : "";
    const nextMaxArea =
      stored.max_area != null ? String(stored.max_area) : "";

    setFilter(nextVisibility);
    setUpdatedAtDate(nextUpdatedAt);
    setPropertyType(nextPropertyType);
    setFurnishedType(nextFurnishedType);
    setMinPrice(nextMinPrice);
    setMaxPrice(nextMaxPrice);
    setAuthor(nextAuthor);
    setTeamPhone(nextTeamPhone);
    setCity(nextCity);
    setDistrict(nextDistrict);
    setSubDistrict(nextSubDistrict);
    setBedrooms(nextBedrooms);
    setPurpose(nextPurpose);
    setMinArea(nextMinArea);
    setMaxArea(nextMaxArea);

    setDraftFilter(nextVisibility);
    setDraftUpdatedAtDate(nextUpdatedAt);
    setDraftPropertyType(nextPropertyType);
    setDraftFurnishedType(nextFurnishedType);
    setDraftMinPrice(nextMinPrice);
    setDraftMaxPrice(nextMaxPrice);
    setDraftAuthor(nextAuthor);
    setDraftTeamPhone(nextTeamPhone);
    setDraftCity(nextCity);
    setDraftDistrict(nextDistrict);
    setDraftSubDistrict(nextSubDistrict);
    setDraftBedrooms(nextBedrooms);
    setDraftPurpose(nextPurpose);
    setDraftMinArea(nextMinArea);
    setDraftMaxArea(nextMaxArea);
  }, []);

  // Persist applied filters locally until the user changes/clears them.
  useEffect(() => {
    if (!didBootstrapSessionFiltersRef.current) return;
    if (skipPersistUntilHydratedRef.current) {
      skipPersistUntilHydratedRef.current = false;
      return;
    }

    writePendingApprovalSessionFilters({
      visibility: filter || DEFAULT_VISIBILITY,
      updated_at: updatedAtDate || "",
      property_type: propertyType || "",
      furnished_type: furnishedType || "",
      min_price: minPrice || "",
      max_price: maxPrice || "",
      author: author || "",
      team_phone: teamPhone || "",
      city: city || "",
      district: district || "",
      sub_district: subDistrict || "",
      bedrooms: bedrooms || "",
      purpose: purpose || "",
      min_area: minArea || "",
      max_area: maxArea || "",
    });
  }, [
    filter,
    updatedAtDate,
    propertyType,
    furnishedType,
    minPrice,
    maxPrice,
    author,
    teamPhone,
    city,
    district,
    subDistrict,
    bedrooms,
    purpose,
    minArea,
    maxArea,
  ]);

  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const BEDROOM_OPTIONS = useMemo(
    () =>
      Array.from({ length: 9 }, (_, count) => ({
        value: String(count),
        label:
          count === 0
            ? translate("unitsFilter.studio", "Studio")
            : translate("unitsFilter.bedroomsOption", "{count} bedrooms").replace(
                "{count}",
                String(count)
              ),
      })),
    [translate]
  );

  const validateAreaRange = useCallback(
    (minValue, maxValue, setError) => {
      const minN = parseNumericFilter(minValue);
      const maxN = parseNumericFilter(maxValue);
      if (minN != null && maxN != null && maxN < minN) {
        setError(
          locale === "ar"
            ? "يجب أن يكون الحد الأقصى للمساحة أكبر من أو يساوي الحد الأدنى"
            : "Max area must be greater than or equal to min area"
        );
        return false;
      }
      setError("");
      return true;
    },
    [locale]
  );

  const searchParamsKey = useMemo(() => {
    const base = searchParams || {};
    const withFilter = { ...base, visibility: filter || DEFAULT_VISIBILITY };
    const withDate =
      updatedAtDate && updatedAtDate.trim() !== ""
        ? { ...withFilter, updated_at: `${updatedAtDate.trim()}T00:00:00.000Z` }
        : withFilter;
    const withPropertyType =
      propertyType && propertyType.trim() !== ""
        ? { ...withDate, property_type: propertyType.trim() }
        : withDate;
    const furnishedValue = normalizeOptionalFilter(furnishedType);
    const withFurnishedType = furnishedValue
      ? { ...withPropertyType, furnished_type: furnishedValue }
      : withPropertyType;
    const withPrice = { ...withFurnishedType };
    if (minPrice != null && minPrice !== "") withPrice.min_price = minPrice;
    if (maxPrice != null && maxPrice !== "") withPrice.max_price = maxPrice;

    const cityValue = normalizeOptionalFilter(city);
    const districtValue = normalizeOptionalFilter(district);
    const subDistrictValue = normalizeOptionalFilter(subDistrict);
    if (cityValue) withPrice.city = cityValue;
    if (districtValue) withPrice.district = districtValue;
    if (subDistrictValue) withPrice.sub_district = subDistrictValue;

    const bedroomsValue = normalizeOptionalFilter(bedrooms);
    if (bedroomsValue !== "") withPrice.bedrooms = bedroomsValue;

    const purposeValue = normalizeOptionalFilter(purpose);
    if (purposeValue) withPrice.purpose = purposeValue;

    const minAreaN = parseNumericFilter(minArea);
    const maxAreaN = parseNumericFilter(maxArea);
    const areaRangeValid = !(
      minAreaN != null &&
      maxAreaN != null &&
      maxAreaN < minAreaN
    );
    if (areaRangeValid) {
      if (minArea != null && minArea !== "") withPrice.min_area = minArea;
      if (maxArea != null && maxArea !== "") withPrice.max_area = maxArea;
    }

    const authorValue = typeof author === "string" ? author.trim() : "";
    if (authorValue) withPrice.author = authorValue;
    // Defense in depth: query key + fetch always include own author for non-admins.
    return JSON.stringify(enforceDashboardAuthorOnParams(withPrice));
  }, [
    searchParams,
    filter,
    updatedAtDate,
    propertyType,
    furnishedType,
    minPrice,
    maxPrice,
    author,
    city,
    district,
    subDistrict,
    bedrooms,
    purpose,
    minArea,
    maxArea,
  ]);

  const hasActiveClientFilters =
    Boolean(updatedAtDate?.trim()) ||
    Boolean(propertyType?.trim()) ||
    Boolean(normalizeOptionalFilter(furnishedType)) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(author?.trim()) ||
    Boolean(normalizeOptionalFilter(city)) ||
    Boolean(normalizeOptionalFilter(district)) ||
    Boolean(normalizeOptionalFilter(subDistrict)) ||
    Boolean(normalizeOptionalFilter(bedrooms)) ||
    Boolean(normalizeOptionalFilter(purpose)) ||
    Boolean(minArea) ||
    Boolean(maxArea) ||
    filter !== DEFAULT_VISIBILITY;

  const initialDataForQuery =
    !hasActiveClientFilters && initialUnitsData != null ? initialUnitsData : null;

  const selectedOwnerPhone = useMemo(() => {
    const selectedEmail = typeof teamPhone === "string" ? teamPhone.trim() : "";
    if (!selectedEmail) return "";
    return resolveSelectedTeamMemberPhone(selectedEmail, teamPhoneOptions);
  }, [teamPhone, teamPhoneOptions]);

  const isOwnerFilterActive = Boolean(
    typeof teamPhone === "string" && teamPhone.trim()
  );

  const pendingQuery = usePendingApprovalUnitsPageData(
    searchParamsKey,
    initialDataForQuery,
    { enabled: !isOwnerFilterActive }
  );

  const ownerQuery = useUnitsByOwnerPhone(
    isOwnerFilterActive ? selectedOwnerPhone : ""
  );

  const units = isOwnerFilterActive
    ? selectedOwnerPhone
      ? ownerQuery.units
      : []
    : pendingQuery.units;
  // Owner filter returns the full result set — no cursor pagination.
  const pagination = isOwnerFilterActive ? null : pendingQuery.pagination;
  const isLoading = isOwnerFilterActive
    ? Boolean(selectedOwnerPhone) && ownerQuery.isLoading
    : pendingQuery.isLoading;
  const isFetching = isOwnerFilterActive
    ? Boolean(selectedOwnerPhone) && ownerQuery.isFetching
    : pendingQuery.isFetching;
  const isError = isOwnerFilterActive
    ? Boolean(selectedOwnerPhone) && ownerQuery.isError
    : pendingQuery.isError;
  const error = isOwnerFilterActive ? ownerQuery.error : pendingQuery.error;
  const refetch = isOwnerFilterActive ? ownerQuery.refetch : pendingQuery.refetch;

  const displayedUnits = units;

  const setVisibleUnitsFromList = bulkSelection?.setVisibleUnitsFromList;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (setVisibleUnitsFromList) {
      setVisibleUnitsFromList(displayedUnits);
    }
  }, [displayedUnits, setVisibleUnitsFromList]);

  // Lock body scroll while the mobile filter sheet is open
  useEffect(() => {
    if (!isMobileFiltersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileFiltersOpen]);

  // Close mobile sheet when switching to desktop layout (same as units page)
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const onChange = (event) => {
      if (event.matches) setIsMobileFiltersOpen(false);
    };
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  const showBulkToolbar = isMounted && canShowBulkButton && bulkSelection;
  const defaultAvailabilityMessage = BULK_AVAILABILITY_DEFAULT_MESSAGE_AR;
  const filtersLabel = translate("unitsFilter.filters", "Filters");

  const getPropertyTypeLabel = useCallback(
    (value) => {
      if (!value) return "";
      const match = BUILDING_TYPES.find((type) => type.value === value);
      if (!match) return value;
      return locale === "ar" ? match.ar_label : match.en_label;
    },
    [BUILDING_TYPES, locale]
  );

  const getFurnishedTypeLabel = useCallback(
    (value) => {
      if (!value || value === "all") return "";
      const key = String(value).toLowerCase().trim();
      const translationKey = FURNISHING_TRANSLATION_KEYS[key];
      if (translationKey) {
        const translated = translate(translationKey);
        if (translated && translated !== translationKey) return translated;
      }
      return value;
    },
    [translate]
  );

  const getPriceLabel = useCallback(
    (min, max) => {
      if (!min && !max) return t.unitsFilter?.price ?? "Price";
      const minFmt = min ? formatPriceInput(min) : "";
      const maxFmt = max ? formatPriceInput(max) : "";
      if (minFmt && maxFmt) return `${minFmt} - ${maxFmt} EGP`;
      if (minFmt) return `${t.unitsFilter?.from || "From"} ${minFmt} EGP`;
      if (maxFmt) return `${t.unitsFilter?.upTo || "Up to"} ${maxFmt} EGP`;
      return t.unitsFilter?.price ?? "Price";
    },
    [t]
  );

  const getAreaLabel = useCallback(
    (min, max) => {
      if (!min && !max) return "";
      if (min && max) return `${min} - ${max} m²`;
      if (min) return `${t.unitsFilter?.minArea ?? "Min Area"}: ${min} m²`;
      return `${translate("unitsFilter.maxArea", "Max Area")}: ${max} m²`;
    },
    [t, translate]
  );

  const getBedroomsLabel = useCallback(
    (raw) => {
      const value = normalizeOptionalFilter(raw);
      if (!value) return translate("unitsFilter.allBedrooms", "All Bedrooms");
      const match = BEDROOM_OPTIONS.find((opt) => String(opt.value) === value);
      return match?.label || value;
    },
    [BEDROOM_OPTIONS, translate]
  );

  const getPurposeLabel = useCallback(
    (raw) => {
      const value = normalizeOptionalFilter(raw);
      if (!value) return "";
      return (
        t.unitsFilter?.purposes?.[value] ||
        translate(`unitsFilter.purposes.${value}`, value)
      );
    },
    [t, translate]
  );

  const activeFilters = useMemo(() => {
    const list = [];
    if (filter !== DEFAULT_VISIBILITY) {
      const option = visibilityOptions.find((o) => o.value === filter);
      list.push({
        key: "visibility",
        value: option?.label ?? filter,
      });
    }
    if (updatedAtDate?.trim()) {
      list.push({
        key: "updated_at",
        value: `${t.resalePage?.filterByUpdatedAt ?? "Updated date"}: ${updatedAtDate}`,
      });
    }
    if (propertyType?.trim()) {
      list.push({
        key: "property_type",
        value: getPropertyTypeLabel(propertyType),
      });
    }
    if (normalizeOptionalFilter(furnishedType)) {
      list.push({
        key: "furnished_type",
        value: getFurnishedTypeLabel(furnishedType),
      });
    }
    if (minPrice || maxPrice) {
      list.push({
        key: "price",
        value: getPriceLabel(minPrice, maxPrice),
      });
    }
    if (author?.trim()) {
      list.push({
        key: "author",
        value: resolveAuthorDisplayLabel(author, authorOptions),
      });
    }
    if (teamPhone?.trim()) {
      list.push({
        key: "team_phone",
        value: resolveTeamPhoneDisplayLabel(teamPhone, teamPhoneOptions),
      });
    }
    if (city || district || subDistrict) {
      list.push({
        key: "location",
        value: formatLocationChip(city, district, subDistrict),
      });
    }
    if (normalizeOptionalFilter(bedrooms)) {
      list.push({
        key: "bedrooms",
        value: getBedroomsLabel(bedrooms),
      });
    }
    if (normalizeOptionalFilter(purpose)) {
      list.push({
        key: "purpose",
        value: getPurposeLabel(purpose),
      });
    }
    if (minArea || maxArea) {
      list.push({
        key: "area",
        value: getAreaLabel(minArea, maxArea),
      });
    }
    return list;
  }, [
    filter,
    updatedAtDate,
    propertyType,
    furnishedType,
    minPrice,
    maxPrice,
    author,
    authorOptions,
    teamPhone,
    teamPhoneOptions,
    city,
    district,
    subDistrict,
    bedrooms,
    purpose,
    minArea,
    maxArea,
    visibilityOptions,
    t,
    getPropertyTypeLabel,
    getFurnishedTypeLabel,
    getPriceLabel,
    getBedroomsLabel,
    getPurposeLabel,
    getAreaLabel,
  ]);

  const activeFilterCount = activeFilters.length;

  const openMobileFilters = () => {
    setDraftFilter(filter);
    setDraftUpdatedAtDate(updatedAtDate);
    setDraftPropertyType(propertyType);
    setDraftFurnishedType(furnishedType);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftAuthor(author);
    setDraftTeamPhone(teamPhone);
    setDraftCity(city);
    setDraftDistrict(district);
    setDraftSubDistrict(subDistrict);
    setDraftBedrooms(bedrooms);
    setDraftPurpose(purpose);
    setDraftMinArea(minArea);
    setDraftMaxArea(maxArea);
    setDraftAreaRangeError("");
    setIsMobileFiltersOpen(true);
  };

  const handleApplyMobileFilters = () => {
    if (!validateAreaRange(draftMinArea, draftMaxArea, setDraftAreaRangeError)) {
      return;
    }
    setFilter(draftFilter || DEFAULT_VISIBILITY);
    setUpdatedAtDate(draftUpdatedAtDate);
    setPropertyType(draftPropertyType);
    setFurnishedType(
      draftFurnishedType === "all" ? "" : draftFurnishedType || ""
    );
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setAuthor(draftAuthor || "");
    setTeamPhone(draftTeamPhone || "");
    setCity(draftCity || "");
    setDistrict(draftDistrict || "");
    setSubDistrict(draftSubDistrict || "");
    setBedrooms(normalizeOptionalFilter(draftBedrooms));
    setPurpose(normalizeOptionalFilter(draftPurpose));
    setMinArea(draftMinArea);
    setMaxArea(draftMaxArea);
    setAreaRangeError("");
    setIsMobileFiltersOpen(false);
  };

  const clearAllFilters = useCallback(() => {
    clearPendingApprovalSessionFilters();
    setFilter(DEFAULT_VISIBILITY);
    setUpdatedAtDate("");
    setPropertyType("");
    setFurnishedType("");
    setMinPrice("");
    setMaxPrice("");
    setAuthor("");
    setTeamPhone("");
    setCity("");
    setDistrict("");
    setSubDistrict("");
    setBedrooms("");
    setPurpose("");
    setMinArea("");
    setMaxArea("");
    setAreaRangeError("");
    setDraftFilter(DEFAULT_VISIBILITY);
    setDraftUpdatedAtDate("");
    setDraftPropertyType("");
    setDraftFurnishedType("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftAuthor("");
    setDraftTeamPhone("");
    setDraftCity("");
    setDraftDistrict("");
    setDraftSubDistrict("");
    setDraftBedrooms("");
    setDraftPurpose("");
    setDraftMinArea("");
    setDraftMaxArea("");
    setDraftAreaRangeError("");
  }, []);

  const handleClearAllAndCloseMobile = () => {
    clearAllFilters();
    setIsMobileFiltersOpen(false);
  };

  const handleRemoveFilter = (key) => {
    if (key === "visibility") setFilter(DEFAULT_VISIBILITY);
    if (key === "updated_at") setUpdatedAtDate("");
    if (key === "property_type") setPropertyType("");
    if (key === "furnished_type") setFurnishedType("");
    if (key === "author") setAuthor("");
    if (key === "team_phone") setTeamPhone("");
    if (key === "price") {
      setMinPrice("");
      setMaxPrice("");
    }
    if (key === "location") {
      setCity("");
      setDistrict("");
      setSubDistrict("");
    }
    if (key === "bedrooms") setBedrooms("");
    if (key === "purpose") setPurpose("");
    if (key === "area") {
      setMinArea("");
      setMaxArea("");
      setAreaRangeError("");
    }
  };

  const handleLocationChange = (payload, { draft = false } = {}) => {
    const nextCity = payload?.city
      ? String(payload.city).toLowerCase().trim()
      : "";
    const nextDistrict = payload?.district
      ? String(payload.district).toLowerCase().trim()
      : "";
    const nextSubDistrict = payload?.sub_district
      ? String(payload.sub_district).toLowerCase().trim()
      : "";
    if (draft) {
      setDraftCity(nextCity);
      setDraftDistrict(nextDistrict);
      setDraftSubDistrict(nextSubDistrict);
      return;
    }
    setCity(nextCity);
    setDistrict(nextDistrict);
    setSubDistrict(nextSubDistrict);
  };

  const handleBedroomsChange = (value, { draft = false } = {}) => {
    const next = normalizeOptionalFilter(value);
    if (draft) {
      setDraftBedrooms(next);
      return;
    }
    setBedrooms(next);
  };

  const handlePurposeChange = (value, { draft = false } = {}) => {
    const next = normalizeOptionalFilter(value);
    if (draft) {
      setDraftPurpose(next);
      return;
    }
    setPurpose(next);
  };

  const handleAreaChange = (key, value, { draft = false } = {}) => {
    const cleaned = String(value ?? "").replace(/[^0-9]/g, "");
    if (draft) {
      const nextMin = key === "min_area" ? cleaned : draftMinArea;
      const nextMax = key === "max_area" ? cleaned : draftMaxArea;
      if (key === "min_area") setDraftMinArea(cleaned);
      else setDraftMaxArea(cleaned);
      validateAreaRange(nextMin, nextMax, setDraftAreaRangeError);
      return;
    }
    const nextMin = key === "min_area" ? cleaned : minArea;
    const nextMax = key === "max_area" ? cleaned : maxArea;
    if (key === "min_area") setMinArea(cleaned);
    else setMaxArea(cleaned);
    validateAreaRange(nextMin, nextMax, setAreaRangeError);
  };

  const handleOpenCheckAvailability = () => {
    if (!bulkSelection || bulkSelection.resolvedRecipients.length === 0) {
      toast.error(
        translate(
          "unitsFilter.bulkAvailability.noRecipients",
          "Selected units have no valid owner phone numbers."
        )
      );
      return;
    }
    setIsWhatsappBulkOpen(true);
  };

  /** TEMP: admin/owner-only — never auto-runs; only on explicit button click. */
  const handleDetectBrokerUnits = useCallback(async () => {
    if (!isAdminUser || isDetectingBrokers) return;
    if (!displayedUnits?.length) {
      toast.error(
        translate(
          "resalePage.brokerDetect.noUnits",
          "No units to check on this page."
        )
      );
      return;
    }

    setIsDetectingBrokers(true);
    setBrokerDetectProgress({ done: 0, total: 0 });
    try {
      const ids = await detectBrokerUnitIds(displayedUnits, {
        onProgress: (done, total) => setBrokerDetectProgress({ done, total }),
      });
      // Merge into sessionStorage so badges survive nav / refresh / filter / sort.
      setBrokerUnitIds(mergeBrokerUnitIds(ids));
      toast.success(
        translate(
          "resalePage.brokerDetect.done",
          "Found {count} broker unit(s)"
        ).replace("{count}", String(ids.size))
      );
    } catch (error) {
      console.error("Broker detect failed:", error?.message ?? error);
      toast.error(
        translate(
          "resalePage.brokerDetect.failed",
          "Failed to check broker owners. Please try again."
        )
      );
    } finally {
      setIsDetectingBrokers(false);
    }
  }, [displayedUnits, isAdminUser, isDetectingBrokers, translate]);

  const renderBrokerDetectButton = () => {
    if (!isMounted || !isAdminUser) return null;
    return (
      <button
        type="button"
        onClick={handleDetectBrokerUnits}
        disabled={isDetectingBrokers || !displayedUnits?.length}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 lg:min-h-9 px-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-xs font-medium hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed"
        title={translate(
          "resalePage.brokerDetect.hint",
          "Temp: look up owner_type via quick-search and badge broker units"
        )}
        aria-label={translate(
          "resalePage.brokerDetect.button",
          "Mark broker units"
        )}
      >
        {isDetectingBrokers ? (
          <>
            <Loader2 size={14} className="animate-spin shrink-0" />
            <span className="truncate">
              {brokerDetectProgress.total > 0
                ? `${brokerDetectProgress.done}/${brokerDetectProgress.total}`
                : translate("resalePage.brokerDetect.checking", "Checking…")}
            </span>
          </>
        ) : (
          <span className="truncate">
            {translate("resalePage.brokerDetect.button", "Mark broker units")}
          </span>
        )}
      </button>
    );
  };

  const handleVisibilityChange = (e) => {
    const next = e?.target?.value || "";
    setFilter(next || DEFAULT_VISIBILITY);
  };

  const bulkSelectLabel = showBulkToolbar && (
    <label className="flex w-full items-center gap-2 min-h-11 px-3 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
      <input
        type="checkbox"
        className="h-4 w-4 accent-primary shrink-0"
        checked={bulkSelection.allSelectableVisibleSelected}
        disabled={bulkSelection.selectableVisibleCount === 0}
        onChange={() => bulkSelection.toggleSelectAllVisible()}
      />
      <span className="text-xs truncate">
        {translate(
          "unitsFilter.bulkAvailability.selectAll",
          "Select all"
        )}
      </span>
      {bulkSelection.hasSelection && (
        <span className="ms-auto text-xs text-gray-500 shrink-0">
          {translate(
            "unitsFilter.bulkAvailability.selectedUnits",
            "{count} selected"
          ).replace("{count}", String(bulkSelection.selectedUnitIds.size))}
        </span>
      )}
    </label>
  );

  const activeFiltersChips = activeFilterCount > 0 && (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeFilters.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-1.5 bg-gray-100 rounded-full ps-2.5 pe-1 py-1 text-sm text-gray-700 shrink-0 max-w-[200px]"
          >
            <p className="truncate text-xs">{item.value}</p>
            <button
              type="button"
              className="shrink-0 flex items-center justify-center min-h-10 min-w-10 lg:min-h-8 lg:min-w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              aria-label={translate("unitsFilter.clearall", "Clear")}
              onClick={() => handleRemoveFilter(item.key)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="shrink-0 flex items-center gap-1.5 min-h-10 lg:min-h-9 px-2.5 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        onClick={clearAllFilters}
      >
        <Trash2 size={14} />
        <span className="hidden sm:inline">{t.unitsFilter?.clearall}</span>
      </button>
    </div>
  );

  const priceFields = (minValue, maxValue, onMinChange, onMaxChange, showApply, onApply) => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t.unitsFilter?.min ?? "Min"} EGP
        </label>
        <input
          type="text"
          inputMode="numeric"
          className="w-full px-2 py-2.5 min-h-11 text-base lg:text-sm border rounded-md bg-white"
          value={formatPriceInput(minValue)}
          onChange={(e) => onMinChange(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t.unitsFilter?.max ?? "Max"} EGP
        </label>
        <input
          type="text"
          inputMode="numeric"
          className="w-full px-2 py-2.5 min-h-11 text-base lg:text-sm border rounded-md bg-white"
          value={formatPriceInput(maxValue)}
          onChange={(e) => onMaxChange(e.target.value.replace(/\D/g, ""))}
          placeholder="5,000,000,000"
        />
      </div>
      {showApply && (
        <button
          type="button"
          className="w-full min-h-11 py-2 text-sm font-medium bg-primary text-white rounded-md"
          onClick={onApply}
        >
          {t.unitsFilter?.applay ?? "Apply"}
        </button>
      )}
    </div>
  );

  // Initial load only — keep filters mounted during refetch / owner-phone queries
  if (!isOwnerFilterActive && isLoading && !units?.length && !isError) {
    return <LoadingSpinner message="Loading resale units..." />;
  }

  if (!isOwnerFilterActive && isError && !units?.length) {
    return (
      <div className="container">
        <QueryErrorState
          error={error}
          refetch={refetch}
          isFetching={isFetching}
          title="Error loading resale units"
          message="Failed to load units. Please try again."
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 w-full gap-3 lg:gap-4">
      <UnitCodeSearch />

      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 min-w-0 w-full">
        {/*
          List column first on desktop (order-1); filters sidebar second (order-2).
          In RTL that places filters on the visual start — same as units page.
        */}
        <div className="min-w-0 flex-1 order-2 lg:order-1 space-y-3 sm:space-y-4">
          {isOwnerFilterActive && isError ? (
            <div className="mt-6">
              <QueryErrorState
                error={error}
                refetch={refetch}
                isFetching={isFetching}
                title="Error loading units by owner"
                message="Failed to load units for this owner. Please try again."
                retryLabel="Retry"
              />
            </div>
          ) : isFetching && displayedUnits.length === 0 ? (
            <LoadingSpinner
              message="Refreshing..."
              containerClassName="flex items-center justify-center min-h-[12rem] mt-6 sm:mt-12"
            />
          ) : (
            <UnitsGrid
              units={displayedUnits}
              pagination={pagination}
              readonly={false}
              allowMissingFields
              linkQueryParams={unitsSourcePendingQueryString(true)}
              brokerUnitIds={brokerUnitIds}
            />
          )}

          {showBulkToolbar && (
            <AddNewWhatsappCampaignDialog
              isOpen={isWhatsappBulkOpen}
              onClose={() => setIsWhatsappBulkOpen(false)}
              recipients={bulkSelection.resolvedRecipients}
              defaultAutomationMessage={defaultAvailabilityMessage}
              appendUnitLinkPerRecipient
              onSendSuccess={() => bulkSelection.clearUnitSelection()}
            />
          )}
        </div>

        {/* Filters: compact bar + sheet on mobile; sticky sidebar on desktop */}
        <div className="w-full lg:w-[360px] shrink-0 order-1 lg:order-2 min-w-0">
          <div className="lg:sticky lg:top-3">
      {/* Mobile chrome: mount after hydration to keep event handlers reliable */}
      {!isMounted ? (
        <div
          className="lg:hidden min-h-11 rounded-md bg-white/80 border border-[#E6E6E6] animate-pulse"
          aria-hidden
        />
      ) : (
        <div className={`lg:hidden space-y-2 min-w-0 ${isMobileFiltersOpen ? "invisible pointer-events-none" : ""}`}>
          <div className="sticky top-12 z-20 lg:top-0 -mx-1 px-1 py-1 bg-[#E2DBFF]/95 backdrop-blur-sm supports-[backdrop-filter]:bg-[#E2DBFF]/80">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={openMobileFilters}
                className="relative flex items-center justify-center gap-2 min-h-11 flex-1 min-w-0 px-3 rounded-md bg-white border border-[#E6E6E6] text-[#494A4B] text-sm font-medium shadow-sm hover:border-primary/40"
                aria-label={translate("unitsFilter.openFilters", "Open filters")}
              >
                <SlidersHorizontal size={18} className="shrink-0 text-primary" />
                <span className="truncate">{filtersLabel}</span>
                {activeFilterCount > 0 && (
                  <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {renderBrokerDetectButton()}

              {showBulkToolbar && bulkSelection.hasSelection && (
                <button
                  type="button"
                  onClick={handleOpenCheckAvailability}
                  className="shrink-0 flex items-center justify-center min-h-11 min-w-11 px-2.5 rounded-md bg-white border border-gray-300 text-gray-800 shadow-sm"
                  title={translate(
                    "unitsFilter.bulkAvailability.checkButton",
                    "Send Message"
                  )}
                  aria-label={translate(
                    "unitsFilter.bulkAvailability.checkButton",
                    "Send Message"
                  )}
                >
                  <WhatsAppIcon className="w-5 h-5 text-green-600" />
                </button>
              )}
            </div>

            {bulkSelectLabel}
          </div>

          {activeFiltersChips}
        </div>
      )}

      {/* Mobile sheet — portaled to body so it is not trapped by sticky/overflow ancestors */}
      {isMounted &&
        isMobileFiltersOpen &&
        createPortal(
          <div className="lg:hidden">
            <button
              type="button"
              className="fixed inset-0 z-[55] bg-black/50"
              aria-label={translate("unitsFilter.closeFilters", "Close filters")}
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(92dvh,100%)] flex-col rounded-t-2xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label={filtersLabel}
              data-resale-filter-sheet="open"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {filtersLabel}
                  </h2>
                  {activeFilterCount > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      {translate("unitsFilter.filtersCount", "{count} filters").replace(
                        "{count}",
                        String(activeFilterCount)
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="shrink-0 flex items-center justify-center min-h-11 min-w-11 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={translate("unitsFilter.closeFilters", "Close filters")}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                <div className="w-full min-w-0">
                  <SearchableDropdownSelect
                    name="filter_mobile"
                    options={visibilityOptions}
                    value={draftFilter}
                    onChange={(e) =>
                      setDraftFilter(e?.target?.value || DEFAULT_VISIBILITY)
                    }
                    showAllOption={false}
                    placeholder="Select filter"
                    className={FILTER_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <input
                    id="resale-updated-at-mobile"
                    type="date"
                    value={draftUpdatedAtDate}
                    onChange={(e) => setDraftUpdatedAtDate(e.target.value ?? "")}
                    className={DATE_INPUT_CLASS}
                    aria-label={
                      t.resalePage?.filterByUpdatedAt ?? "Filter by updated date"
                    }
                  />
                </div>

                <div className="w-full min-w-0">
                  <SearchableDropdownSelect
                    options={BUILDING_TYPES}
                    value={draftPropertyType === "all" ? "" : draftPropertyType}
                    onChange={(e) => setDraftPropertyType(e.target.value || "")}
                    name="property_type_mobile"
                    getValue={(type) => type.value}
                    getLabel={(type) =>
                      locale === "ar" ? type.ar_label : type.en_label
                    }
                    searchFields={["en_label", "ar_label", "value"]}
                    showAllOption={true}
                    allOptionLabel={
                      t.unitsFilter?.allPropertyTypes ?? "All Property Types"
                    }
                    placeholder={
                      t.unitsFilter?.allPropertyTypes ?? "All Property Types"
                    }
                    searchPlaceholder={
                      locale === "ar"
                        ? "ابحث عن نوع العقار..."
                        : "Search property types..."
                    }
                    className={FILTER_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <SearchableFurnishingTypeSelect
                    name="furnished_type_mobile"
                    value={
                      draftFurnishedType === "all" ? "" : draftFurnishedType
                    }
                    onChange={(e) => {
                      const next = e?.target?.value || "";
                      setDraftFurnishedType(next === "all" ? "" : next);
                    }}
                    showAllOption
                    allOptionLabel={translate(
                      "unitsFilter.allFurnishingTypes",
                      "All Furnishing Types"
                    )}
                    placeholder={translate(
                      "unitsFilter.allFurnishingTypes",
                      "All Furnishing Types"
                    )}
                    buttonClassName={DROPDOWN_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <UnitsLocationSearch
                    name="resale_location_mobile"
                    city={draftCity}
                    district={draftDistrict}
                    subDistrict={draftSubDistrict}
                    onChange={(payload) =>
                      handleLocationChange(payload, { draft: true })
                    }
                    buttonClassName={DROPDOWN_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <SearchableDropdownSelect
                    name="bedrooms_mobile"
                    options={BEDROOM_OPTIONS}
                    value={draftBedrooms || ""}
                    onChange={(e) =>
                      handleBedroomsChange(e.target.value || "", { draft: true })
                    }
                    showAllOption
                    allOptionLabel={translate(
                      "unitsFilter.allBedrooms",
                      "All Bedrooms"
                    )}
                    placeholder={translate(
                      "unitsFilter.allBedrooms",
                      "All Bedrooms"
                    )}
                    searchPlaceholder={translate(
                      "unitsFilter.bedroomsSearchPlaceholder",
                      "Search bedrooms…"
                    )}
                    noResultsText={translate(
                      "unitsFilter.bedroomsSearchEmpty",
                      "No matching bedrooms"
                    )}
                    getValue={(opt) => opt.value}
                    getLabel={(opt) => opt.label}
                    buttonClassName={DROPDOWN_BUTTON_CLASS}
                  />
                </div>

                <div className="w-full min-w-0">
                  <p className="text-xs font-medium text-[#494A4B] mb-1.5">
                    {translate("unitsFilter.purpose", "Purpose")}
                  </p>
                  <div
                    className="flex flex-wrap items-center gap-2"
                    role="group"
                    aria-label={translate("unitsFilter.purpose", "Purpose")}
                  >
                    {[
                      {
                        value: "rent",
                        label: translate("unitsFilter.purposes.rent", "Rent"),
                      },
                      {
                        value: "sell",
                        label: translate("unitsFilter.purposes.sell", "Sell"),
                      },
                    ].map((option) => {
                      const isSelected = draftPurpose === option.value;
                      return (
                        <label
                          key={option.value}
                          onClick={(e) => {
                            if (isSelected) {
                              e.preventDefault();
                              handlePurposeChange("all", { draft: true });
                            }
                          }}
                          className={`flex flex-1 min-w-0 items-center gap-2 h-10 px-3 rounded-md border text-xs font-medium cursor-pointer select-none transition-colors ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="purpose_mobile"
                            value={option.value}
                            checked={isSelected}
                            onChange={() =>
                              handlePurposeChange(option.value, { draft: true })
                            }
                            className="h-4 w-4 accent-primary shrink-0"
                          />
                          <span className="truncate">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full min-w-0 grid grid-cols-2 gap-2">
                  <LenaTextField
                    name="min_area_mobile"
                    type="number"
                    label={t.unitsFilter?.minArea ?? "Min Area"}
                    value={draftMinArea}
                    error={draftAreaRangeError}
                    onChange={(e) =>
                      handleAreaChange("min_area", e.target.value, {
                        draft: true,
                      })
                    }
                    className="w-full min-w-0"
                    adornment="m²"
                  />
                  <LenaTextField
                    name="max_area_mobile"
                    type="number"
                    label={translate("unitsFilter.maxArea", "Max Area")}
                    value={draftMaxArea}
                    error={draftAreaRangeError}
                    onChange={(e) =>
                      handleAreaChange("max_area", e.target.value, {
                        draft: true,
                      })
                    }
                    className="w-full min-w-0"
                    adornment="m²"
                  />
                </div>

                {/* Temporarily hidden — author (email) filter not needed at this stage.
                <div className="w-full min-w-0">
                  <AuthorFilterSelect
                    name="author_mobile"
                    value={draftAuthor || ""}
                    onChange={(e) => setDraftAuthor(e?.target?.value || "")}
                    className={FILTER_BUTTON_CLASS}
                  />
                </div>
                */}

                {isAdminUser && (
                  <div className="w-full min-w-0">
                    <SearchableDropdownSelect
                      name="team_phone_mobile"
                      options={teamPhoneOptions}
                      value={draftTeamPhone || ""}
                      onChange={(e) => setDraftTeamPhone(e?.target?.value || "")}
                      getValue={(option) => option.email}
                      getLabel={getTeamPhoneOptionLabel}
                      resolveSelectedLabel={(v) =>
                        resolveTeamPhoneDisplayLabel(v, teamPhoneOptions)
                      }
                      searchFields={["name", "email", "phone"]}
                      showAllOption
                      allOptionLabel={translate(
                        "unitsFilter.teamPhone.all",
                        "All phone numbers"
                      )}
                      allOptionValue=""
                      placeholder={translate(
                        "unitsFilter.teamPhone.placeholder",
                        "Filter by phone number"
                      )}
                      searchPlaceholder={translate(
                        "unitsFilter.teamPhone.search",
                        "Search by name or phone"
                      )}
                      noResultsText={translate(
                        "unitsFilter.teamPhone.noResults",
                        "No matching phone numbers"
                      )}
                      isLoading={isTeamLoading}
                      className={FILTER_BUTTON_CLASS}
                    />
                  </div>
                )}

                <div className="w-full min-w-0 rounded-md border border-[#E6E6E6] bg-[#F6F7FB] p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    {t.unitsFilter?.price ?? "Price"}
                  </p>
                  {priceFields(
                    draftMinPrice,
                    draftMaxPrice,
                    setDraftMinPrice,
                    setDraftMaxPrice,
                    false
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2 z-[1]">
                <button
                  type="button"
                  onClick={handleClearAllAndCloseMobile}
                  className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 truncate px-2"
                >
                  {t.unitsFilter?.clearall}
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobileFilters}
                  className="min-h-11 flex-[1.4] rounded-md text-sm font-semibold shadow-sm truncate px-2 bg-primary text-white hover:bg-primary/90"
                >
                  {translate("unitsFilter.applyFilters", "Apply Filters")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Desktop sidebar panel — vertical stack like units page */}
      {!isMobileFiltersOpen && (
        <div className="hidden lg:block bg-white rounded-lg shadow-md min-w-0">
          <div className="p-4 space-y-3">
            {(isMounted && isAdminUser) || showBulkToolbar ? (
              <div className="w-full pb-3 border-b border-[#E6E6E6] space-y-2">
                {isMounted && isAdminUser ? (
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {renderBrokerDetectButton()}
                    {showBulkToolbar && bulkSelection.hasSelection && (
                      <button
                        type="button"
                        onClick={handleOpenCheckAvailability}
                        className="flex items-center justify-center gap-1.5 px-2.5 h-10 min-w-10 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0"
                        title={translate(
                          "unitsFilter.bulkAvailability.checkButton",
                          "Send Message"
                        )}
                        aria-label={translate(
                          "unitsFilter.bulkAvailability.checkButton",
                          "Send Message"
                        )}
                      >
                        <WhatsAppIcon />
                      </button>
                    )}
                  </div>
                ) : null}
                {showBulkToolbar && (
                  <label className="flex w-full items-center gap-1.5 h-10 px-2 rounded-md border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary shrink-0"
                      checked={bulkSelection.allSelectableVisibleSelected}
                      disabled={bulkSelection.selectableVisibleCount === 0}
                      onChange={() => bulkSelection.toggleSelectAllVisible()}
                    />
                    <span className="text-xs truncate">
                      {translate(
                        "unitsFilter.bulkAvailability.selectAll",
                        "select all"
                      )}
                    </span>
                    {bulkSelection.hasSelection && (
                      <span className="ms-auto text-[10px] text-gray-500 shrink-0 tabular-nums">
                        {bulkSelection.selectedUnitIds.size}
                      </span>
                    )}
                  </label>
                )}
              </div>
            ) : null}

            <div className="w-full min-w-0">
              <SearchableDropdownSelect
                name="filter"
                options={visibilityOptions}
                value={filter}
                onChange={handleVisibilityChange}
                showAllOption={false}
                placeholder="Select filter"
                className={FILTER_BUTTON_CLASS}
              />
            </div>

            <div className="w-full min-w-0">
              <input
                id="resale-updated-at"
                type="date"
                value={updatedAtDate}
                onChange={(e) => setUpdatedAtDate(e.target.value ?? "")}
                className={DATE_INPUT_CLASS}
                aria-label={
                  t.resalePage?.filterByUpdatedAt ?? "Filter by updated date"
                }
              />
            </div>

            <div className="w-full min-w-0">
              <SearchableDropdownSelect
                options={BUILDING_TYPES}
                value={propertyType === "all" ? "" : propertyType}
                onChange={(e) => setPropertyType(e.target.value || "")}
                name="property_type"
                getValue={(type) => type.value}
                getLabel={(type) =>
                  locale === "ar" ? type.ar_label : type.en_label
                }
                searchFields={["en_label", "ar_label", "value"]}
                showAllOption={true}
                allOptionLabel={
                  t.unitsFilter?.allPropertyTypes ?? "All Property Types"
                }
                placeholder={
                  t.unitsFilter?.allPropertyTypes ?? "All Property Types"
                }
                searchPlaceholder={
                  locale === "ar"
                    ? "ابحث عن نوع العقار..."
                    : "Search property types..."
                }
                className={FILTER_BUTTON_CLASS}
              />
            </div>

            <div className="w-full min-w-0">
              <SearchableFurnishingTypeSelect
                name="furnished_type"
                value={furnishedType === "all" ? "" : furnishedType}
                onChange={(e) => {
                  const next = e?.target?.value || "";
                  setFurnishedType(next === "all" ? "" : next);
                }}
                showAllOption
                allOptionLabel={translate(
                  "unitsFilter.allFurnishingTypes",
                  "All Furnishing Types"
                )}
                placeholder={translate(
                  "unitsFilter.allFurnishingTypes",
                  "All Furnishing Types"
                )}
                buttonClassName={DROPDOWN_BUTTON_CLASS}
              />
            </div>

            {isAdminUser && (
              <div className="w-full min-w-0">
                <SearchableDropdownSelect
                  name="team_phone"
                  options={teamPhoneOptions}
                  value={teamPhone || ""}
                  onChange={(e) => setTeamPhone(e?.target?.value || "")}
                  getValue={(option) => option.email}
                  getLabel={getTeamPhoneOptionLabel}
                  resolveSelectedLabel={(v) =>
                    resolveTeamPhoneDisplayLabel(v, teamPhoneOptions)
                  }
                  searchFields={["name", "email", "phone"]}
                  showAllOption
                  allOptionLabel={translate(
                    "unitsFilter.teamPhone.all",
                    "All phone numbers"
                  )}
                  allOptionValue=""
                  placeholder={translate(
                    "unitsFilter.teamPhone.placeholder",
                    "Filter by phone number"
                  )}
                  searchPlaceholder={translate(
                    "unitsFilter.teamPhone.search",
                    "Search by name or phone"
                  )}
                  noResultsText={translate(
                    "unitsFilter.teamPhone.noResults",
                    "No matching phone numbers"
                  )}
                  isLoading={isTeamLoading}
                  className={FILTER_BUTTON_CLASS}
                />
              </div>
            )}

            <div className="w-full min-w-0">
              <UnitsLocationSearch
                name="resale_location"
                city={city}
                district={district}
                subDistrict={subDistrict}
                onChange={(payload) => handleLocationChange(payload)}
                buttonClassName={DROPDOWN_BUTTON_CLASS}
              />
            </div>

            <div className="w-full min-w-0">
              <SearchableDropdownSelect
                name="bedrooms"
                options={BEDROOM_OPTIONS}
                value={bedrooms || ""}
                onChange={(e) => handleBedroomsChange(e.target.value || "")}
                showAllOption
                allOptionLabel={translate(
                  "unitsFilter.allBedrooms",
                  "All Bedrooms"
                )}
                placeholder={translate(
                  "unitsFilter.allBedrooms",
                  "All Bedrooms"
                )}
                searchPlaceholder={translate(
                  "unitsFilter.bedroomsSearchPlaceholder",
                  "Search bedrooms…"
                )}
                noResultsText={translate(
                  "unitsFilter.bedroomsSearchEmpty",
                  "No matching bedrooms"
                )}
                getValue={(opt) => opt.value}
                getLabel={(opt) => opt.label}
                buttonClassName={DROPDOWN_BUTTON_CLASS}
              />
            </div>

            <div className="w-full min-w-0">
              <p className="text-xs font-medium text-[#494A4B] mb-1.5">
                {translate("unitsFilter.purpose", "Purpose")}
              </p>
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label={translate("unitsFilter.purpose", "Purpose")}
              >
                {[
                  {
                    value: "rent",
                    label: translate("unitsFilter.purposes.rent", "Rent"),
                  },
                  {
                    value: "sell",
                    label: translate("unitsFilter.purposes.sell", "Sell"),
                  },
                ].map((option) => {
                  const isSelected = purpose === option.value;
                  return (
                    <label
                      key={option.value}
                      onClick={(e) => {
                        if (isSelected) {
                          e.preventDefault();
                          handlePurposeChange("all");
                        }
                      }}
                      className={`flex flex-1 min-w-0 items-center gap-2 h-10 px-3 rounded-md border text-xs font-medium cursor-pointer select-none transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] hover:border-primary/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="purpose_desktop"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => handlePurposeChange(option.value)}
                        className="h-4 w-4 accent-primary shrink-0"
                      />
                      <span className="truncate">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="w-full min-w-0 grid grid-cols-2 gap-2">
              <LenaTextField
                name="min_area"
                type="number"
                label={t.unitsFilter?.minArea ?? "Min Area"}
                value={minArea}
                error={areaRangeError}
                onChange={(e) => handleAreaChange("min_area", e.target.value)}
                className="w-full min-w-0"
                adornment="m²"
              />
              <LenaTextField
                name="max_area"
                type="number"
                label={translate("unitsFilter.maxArea", "Max Area")}
                value={maxArea}
                error={areaRangeError}
                onChange={(e) => handleAreaChange("max_area", e.target.value)}
                className="w-full min-w-0"
                adornment="m²"
              />
            </div>

            <div className="w-full min-w-0 rounded-md border border-[#E6E6E6] bg-[#F6F7FB] p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                {t.unitsFilter?.price ?? "Price"}
              </p>
              {priceFields(minPrice, maxPrice, setMinPrice, setMaxPrice, false)}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">
                  {t.unitsFilter?.activeFilter}
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((item) => (
                    <div
                      key={`desktop-${item.key}`}
                      className="flex items-center gap-3 bg-gray-100 rounded px-1.5 py-1 text-sm text-gray-700"
                    >
                      <p className="truncate max-w-[180px] text-xs">{item.value}</p>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700 min-h-8 min-w-8 inline-flex items-center justify-center"
                        onClick={() => handleRemoveFilter(item.key)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  onClick={clearAllFilters}
                >
                  <Trash2 size={16} />
                  {t.unitsFilter?.clearall}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
