"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyDashboardLeadAccessDefaults } from "@/lib/dashboard-lead-access";
import {
  areFiltersEqual,
  createEmptyFilters,
  filtersFromSearchParams,
  filtersToSearchParamsResettingPagination,
  hasActiveFilters,
  RENT_SEARCH_ELIGIBLE_DEFAULT,
} from "@/lib/units/favorite-searches";
import { isRentPurpose } from "@/lib/units/unit-price";
import {
  clearSessionFilters,
  getSessionFiltersStorageKey,
  readSessionFilters,
  writeSessionFilters,
} from "@/lib/units/session-filters";

export const UNITS_FILTER_APPLY_DEBOUNCE_MS = 5000;

/**
 * Same author ACL as Leads: non-admin/non-owner users always get author=self.
 * Public listings are unrestricted.
 *
 * @param {Record<string, unknown>} filters
 * @param {boolean} isPublic
 * @returns {Record<string, unknown>}
 */
function withUnitsAuthorAccess(filters, isPublic) {
  if (isPublic) return filters && typeof filters === "object" ? { ...filters } : {};
  return applyDashboardLeadAccessDefaults(filters, {
    applyStatusDefault: false,
    enforceAuthor: true,
  });
}

const parseNumeric = (v) => {
  if (v === undefined || v === null) return null;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

function filtersSignature(filters) {
  return JSON.stringify(filters);
}

/**
 * Prefer the browser pathname so /{clientId}/units rewrites stay on the
 * visible URL. usePathname() can return the internal /units destination,
 * and proxy then redirects bare /units → /{clientId}/units while dropping
 * the query string.
 */
function resolveFilterPathname(pathname) {
  if (typeof window !== "undefined" && window.location?.pathname) {
    return window.location.pathname;
  }
  return pathname;
}

/**
 * Draft filter state for the units listing.
 * URL remains the source of truth for applied filters / API fetches.
 * Draft changes apply on: Apply click, Enter, or 5s after last change.
 * Session storage restores filters when returning to an empty units URL.
 */
export function useUnitsFilterDraft({
  searchParams,
  pathname,
  router,
  isPublic = false,
  locale = "en",
}) {
  const storageKey = useMemo(
    () => getSessionFiltersStorageKey(isPublic),
    [isPublic]
  );

  const appliedFilters = useMemo(
    () =>
      withUnitsAuthorAccess(filtersFromSearchParams(searchParams), isPublic),
    [isPublic, searchParams]
  );
  const appliedSignature = useMemo(
    () => filtersSignature(appliedFilters),
    [appliedFilters]
  );

  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [priceRangeError, setPriceRangeError] = useState("");
  const [areaRangeError, setAreaRangeError] = useState("");

  const applyDebounceRef = useRef(null);
  const draftFiltersRef = useRef(draftFilters);
  const appliedFiltersRef = useRef(appliedFilters);
  const searchParamsRef = useRef(searchParams);
  const skipNextDraftSyncRef = useRef(false);
  const lastSeenAppliedSignatureRef = useRef(appliedSignature);
  const didBootstrapRef = useRef(false);

  draftFiltersRef.current = draftFilters;
  appliedFiltersRef.current = appliedFilters;
  searchParamsRef.current = searchParams;

  const clearApplyDebounce = useCallback(() => {
    if (applyDebounceRef.current) {
      clearTimeout(applyDebounceRef.current);
      applyDebounceRef.current = null;
    }
  }, []);

  useEffect(() => () => clearApplyDebounce(), [clearApplyDebounce]);

  const validateRanges = useCallback(
    (filters) => {
      const minPriceN = parseNumeric(filters.min_price);
      const maxPriceN = parseNumeric(filters.max_price);
      if (minPriceN != null && maxPriceN != null && maxPriceN < minPriceN) {
        setPriceRangeError(
          locale === "ar"
            ? "يجب أن يكون الحد الأقصى للسعر أكبر من أو يساوي الحد الأدنى"
            : "Max price must be greater than or equal to min price"
        );
        return false;
      }
      setPriceRangeError("");

      const minAreaN = parseNumeric(filters.min_area);
      const maxAreaN = parseNumeric(filters.max_area);
      if (minAreaN != null && maxAreaN != null && maxAreaN < minAreaN) {
        setAreaRangeError(
          locale === "ar"
            ? "يجب أن يكون الحد الأقصى للمساحة أكبر من أو يساوي الحد الأدنى"
            : "Max area must be greater than or equal to min area"
        );
        return false;
      }
      setAreaRangeError("");
      return true;
    },
    [locale]
  );

  const commitFiltersToUrl = useCallback(
    (nextFilters, { syncDraft = true } = {}) => {
      clearApplyDebounce();

      if (!validateRanges(nextFilters)) {
        return false;
      }

      const normalized = withUnitsAuthorAccess(
        { ...createEmptyFilters(), ...nextFilters },
        isPublic
      );
      const currentApplied = appliedFiltersRef.current;
      const currentParams = searchParamsRef.current;
      const hasPagination =
        currentParams.has("cursor") || currentParams.has("direction");

      if (areFiltersEqual(normalized, currentApplied) && !hasPagination) {
        if (syncDraft) setDraftFilters(normalized);
        if (hasActiveFilters(normalized)) {
          writeSessionFilters(storageKey, normalized);
        } else {
          clearSessionFilters(storageKey);
        }
        lastSeenAppliedSignatureRef.current = filtersSignature(normalized);
        return true;
      }

      const params = filtersToSearchParamsResettingPagination(
        normalized,
        currentParams
      );
      const qs = params.toString();
      const navPathname = resolveFilterPathname(pathname);
      const nextUrl = qs ? `${navPathname}?${qs}` : navPathname;
      const currentQs =
        typeof window !== "undefined"
          ? window.location.search.replace(/^\?/, "")
          : currentParams.toString();
      const currentUrl = currentQs ? `${navPathname}?${currentQs}` : navPathname;

      if (hasActiveFilters(normalized)) {
        writeSessionFilters(storageKey, normalized);
      } else {
        clearSessionFilters(storageKey);
      }

      if (syncDraft) {
        skipNextDraftSyncRef.current = true;
        setDraftFilters(normalized);
      }
      lastSeenAppliedSignatureRef.current = filtersSignature(normalized);

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }

      return true;
    },
    [clearApplyDebounce, isPublic, pathname, router, storageKey, validateRanges]
  );

  const scheduleApply = useCallback(
    (nextFilters) => {
      clearApplyDebounce();
      applyDebounceRef.current = setTimeout(() => {
        commitFiltersToUrl(nextFilters);
      }, UNITS_FILTER_APPLY_DEBOUNCE_MS);
    },
    [clearApplyDebounce, commitFiltersToUrl]
  );

  // Bootstrap once: URL wins; otherwise restore session filters into the URL.
  // Always enforce author for non-admins so visibility cannot be bypassed.
  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    const urlFilters = withUnitsAuthorAccess(
      filtersFromSearchParams(searchParams),
      isPublic
    );
    const urlBeforeEnforce = filtersFromSearchParams(searchParams);
    const urlNeedsAuthorRewrite =
      !isPublic &&
      String(urlBeforeEnforce.author || "").trim().toLowerCase() !==
        String(urlFilters.author || "").trim().toLowerCase();

    if (hasActiveFilters(urlFilters) || urlNeedsAuthorRewrite) {
      writeSessionFilters(storageKey, urlFilters);
      lastSeenAppliedSignatureRef.current = filtersSignature(urlFilters);
      setDraftFilters(urlFilters);
      if (urlNeedsAuthorRewrite || !areFiltersEqual(urlFilters, urlBeforeEnforce)) {
        const params = filtersToSearchParamsResettingPagination(
          urlFilters,
          searchParams
        );
        const qs = params.toString();
        const navPathname = resolveFilterPathname(pathname);
        router.replace(qs ? `${navPathname}?${qs}` : navPathname, {
          scroll: false,
        });
      }
      return;
    }

    const stored = withUnitsAuthorAccess(readSessionFilters(storageKey), isPublic);
    if (!hasActiveFilters(stored)) {
      lastSeenAppliedSignatureRef.current = filtersSignature(urlFilters);
      setDraftFilters(urlFilters);
      if (urlFilters.author) {
        const params = filtersToSearchParamsResettingPagination(
          urlFilters,
          searchParams
        );
        const qs = params.toString();
        const navPathname = resolveFilterPathname(pathname);
        router.replace(qs ? `${navPathname}?${qs}` : navPathname, {
          scroll: false,
        });
      }
      return;
    }

    skipNextDraftSyncRef.current = true;
    lastSeenAppliedSignatureRef.current = filtersSignature(stored);
    setDraftFilters(stored);
    const params = filtersToSearchParamsResettingPagination(stored, searchParams);
    const qs = params.toString();
    const navPathname = resolveFilterPathname(pathname);
    router.replace(qs ? `${navPathname}?${qs}` : navPathname, { scroll: false });
  }, [isPublic, pathname, router, searchParams, storageKey]);

  // Keep session in sync whenever applied URL filters change (back/forward, deep links).
  // Re-enforce author if a deep link omitted/changed it for a restricted user.
  useEffect(() => {
    if (!didBootstrapRef.current) return;
    const raw = filtersFromSearchParams(searchParams);
    const enforced = withUnitsAuthorAccess(raw, isPublic);
    if (!areFiltersEqual(enforced, raw)) {
      commitFiltersToUrl(enforced);
      return;
    }
    if (hasActiveFilters(enforced)) {
      writeSessionFilters(storageKey, enforced);
    }
  }, [commitFiltersToUrl, isPublic, searchParams, storageKey]);

  // Sync draft from URL only when applied filter values change externally
  // (back/forward, deep link). Draft edits do not change appliedSignature.
  useEffect(() => {
    if (!didBootstrapRef.current) return;

    if (skipNextDraftSyncRef.current) {
      skipNextDraftSyncRef.current = false;
      lastSeenAppliedSignatureRef.current = appliedSignature;
      return;
    }

    if (lastSeenAppliedSignatureRef.current === appliedSignature) {
      return;
    }

    lastSeenAppliedSignatureRef.current = appliedSignature;
    setDraftFilters(withUnitsAuthorAccess(appliedFilters, isPublic));
    setPriceRangeError("");
    setAreaRangeError("");
  }, [appliedFilters, appliedSignature, isPublic]);

  const updateDraftFilters = useCallback(
    (updater, { schedule = true } = {}) => {
      setDraftFilters((prev) => {
        const raw =
          typeof updater === "function"
            ? updater(prev)
            : { ...prev, ...updater };
        const next = withUnitsAuthorAccess(raw, isPublic);
        if (schedule) scheduleApply(next);
        return next;
      });
    },
    [isPublic, scheduleApply]
  );

  const applyDraftFilters = useCallback(() => {
    return commitFiltersToUrl(draftFiltersRef.current);
  }, [commitFiltersToUrl]);

  const applyExternalFilters = useCallback(
    (filters) => {
      setPriceRangeError("");
      setAreaRangeError("");
      return commitFiltersToUrl(
        withUnitsAuthorAccess({ ...createEmptyFilters(), ...filters }, isPublic)
      );
    },
    [commitFiltersToUrl, isPublic]
  );

  const clearAllFilters = useCallback(() => {
    clearApplyDebounce();
    setPriceRangeError("");
    setAreaRangeError("");
    const empty = withUnitsAuthorAccess(createEmptyFilters(), isPublic);
    if (hasActiveFilters(empty)) {
      writeSessionFilters(storageKey, empty);
    } else {
      clearSessionFilters(storageKey);
    }
    skipNextDraftSyncRef.current = true;
    lastSeenAppliedSignatureRef.current = filtersSignature(empty);
    setDraftFilters(empty);
    const params = filtersToSearchParamsResettingPagination(
      empty,
      new URLSearchParams()
    );
    const qs = params.toString();
    const navPathname = resolveFilterPathname(pathname);
    router.replace(qs ? `${navPathname}?${qs}` : navPathname, { scroll: false });
  }, [clearApplyDebounce, isPublic, pathname, router, storageKey]);

  const removeFilterKey = useCallback(
    (key) => {
      const prev = draftFiltersRef.current;
      let next = { ...prev };

      if (key === "price_range") {
        next = { ...next, min_price: "", max_price: "" };
      } else if (key === "area_range") {
        next = { ...next, min_area: "", max_area: "" };
      } else if (key === "location") {
        next = { ...next, city: "", district: "", sub_district: "" };
      } else if (key === "sort" || key === "sort_by" || key === "sort_order") {
        next = { ...next, sort_by: "", sort_order: "" };
      } else if (key === "my_inventory" || key === "show_present_value") {
        next = { ...next, [key]: false };
      } else if (key === "resale") {
        next = { ...next, resale: "" };
      } else if (key === "rentSearchEligible") {
        next = {
          ...next,
          rentSearchEligible: isRentPurpose(next.purpose)
            ? RENT_SEARCH_ELIGIBLE_DEFAULT
            : "",
        };
      } else {
        next = { ...next, [key]: "" };
      }

      next = withUnitsAuthorAccess(next, isPublic);
      setDraftFilters(next);
      commitFiltersToUrl(next);
    },
    [commitFiltersToUrl, isPublic]
  );

  const hasPendingChanges = !areFiltersEqual(draftFilters, appliedFilters);

  return {
    appliedFilters,
    draftFilters,
    hasPendingChanges,
    priceRangeError,
    areaRangeError,
    updateDraftFilters,
    applyDraftFilters,
    applyExternalFilters,
    clearAllFilters,
    removeFilterKey,
    clearApplyDebounce,
  };
}
