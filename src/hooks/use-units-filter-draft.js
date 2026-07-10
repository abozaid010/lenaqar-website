"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  areFiltersEqual,
  createEmptyFilters,
  filtersFromSearchParams,
  filtersToSearchParamsResettingPagination,
  hasActiveFilters,
} from "@/lib/units/favorite-searches";
import {
  clearSessionFilters,
  getSessionFiltersStorageKey,
  readSessionFilters,
  writeSessionFilters,
} from "@/lib/units/session-filters";

export const UNITS_FILTER_APPLY_DEBOUNCE_MS = 5000;

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
    () => filtersFromSearchParams(searchParams),
    [searchParams]
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

      const normalized = { ...createEmptyFilters(), ...nextFilters };
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
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      const currentQs = currentParams.toString();
      const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname;

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
    [clearApplyDebounce, pathname, router, storageKey, validateRanges]
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
  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    const urlFilters = filtersFromSearchParams(searchParams);
    if (hasActiveFilters(urlFilters)) {
      writeSessionFilters(storageKey, urlFilters);
      lastSeenAppliedSignatureRef.current = filtersSignature(urlFilters);
      setDraftFilters(urlFilters);
      return;
    }

    const stored = readSessionFilters(storageKey);
    if (!hasActiveFilters(stored)) {
      lastSeenAppliedSignatureRef.current = filtersSignature(urlFilters);
      setDraftFilters(urlFilters);
      return;
    }

    skipNextDraftSyncRef.current = true;
    lastSeenAppliedSignatureRef.current = filtersSignature(stored);
    setDraftFilters(stored);
    const params = filtersToSearchParamsResettingPagination(stored, searchParams);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, storageKey]);

  // Keep session in sync whenever applied URL filters change (back/forward, deep links).
  useEffect(() => {
    if (!didBootstrapRef.current) return;
    if (hasActiveFilters(appliedFilters)) {
      writeSessionFilters(storageKey, appliedFilters);
    }
  }, [appliedFilters, storageKey]);

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
    setDraftFilters(appliedFilters);
    setPriceRangeError("");
    setAreaRangeError("");
  }, [appliedFilters, appliedSignature]);

  const updateDraftFilters = useCallback(
    (updater, { schedule = true } = {}) => {
      setDraftFilters((prev) => {
        const next =
          typeof updater === "function"
            ? updater(prev)
            : { ...prev, ...updater };
        if (schedule) scheduleApply(next);
        return next;
      });
    },
    [scheduleApply]
  );

  const applyDraftFilters = useCallback(() => {
    return commitFiltersToUrl(draftFiltersRef.current);
  }, [commitFiltersToUrl]);

  const applyExternalFilters = useCallback(
    (filters) => {
      setPriceRangeError("");
      setAreaRangeError("");
      return commitFiltersToUrl({ ...createEmptyFilters(), ...filters });
    },
    [commitFiltersToUrl]
  );

  const clearAllFilters = useCallback(() => {
    clearApplyDebounce();
    clearSessionFilters(storageKey);
    setPriceRangeError("");
    setAreaRangeError("");
    const empty = createEmptyFilters();
    skipNextDraftSyncRef.current = true;
    lastSeenAppliedSignatureRef.current = filtersSignature(empty);
    setDraftFilters(empty);
    router.replace(pathname, { scroll: false });
  }, [clearApplyDebounce, pathname, router, storageKey]);

  const removeFilterKey = useCallback(
    (key) => {
      const prev = draftFiltersRef.current;
      let next = { ...prev };

      if (key === "price_range") {
        next = { ...next, min_price: "", max_price: "" };
      } else if (key === "area_range") {
        next = { ...next, min_area: "", max_area: "" };
      } else if (key === "my_inventory" || key === "resale") {
        next = { ...next, [key]: false };
      } else {
        next = { ...next, [key]: "" };
      }

      setDraftFilters(next);
      commitFiltersToUrl(next);
    },
    [commitFiltersToUrl]
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
