"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import { useBrokerUnitsBadgeOptional } from "@/context/broker-units-badge-context";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import { enforceDashboardAuthorOnParams } from "@/lib/dashboard-lead-access";
import {
  applyResaleFilterToApiParams,
  normalizeRentSearchEligibleFilter,
  RENT_SEARCH_ELIGIBLE_DEFAULT,
  UNITS_UI_ONLY_FILTER_KEYS,
} from "@/lib/units/favorite-searches";
import { isRentPurpose } from "@/lib/units/unit-price";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

function searchParamsToObject(searchParams) {
  if (!searchParams) return {};
  // Plain object from the server component
  if (typeof searchParams.forEach !== "function") {
    return { ...(searchParams || {}) };
  }
  // URLSearchParams / ReadonlyURLSearchParams from the client router
  const obj = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

export default function UnitsPageQueryOptimized({
  searchParams: serverSearchParams,
  clientId,
  publicUnits = false,
  initialUnitsData = null,
}) {
  const currentClientId = clientId || "";
  // Client URL is the source of truth after Apply Filters (same as UnitsFilter).
  // Server searchParams only seed the first paint / SSR prefetch match.
  const urlSearchParams = useSearchParams();
  const searchParams = useMemo(
    () => searchParamsToObject(urlSearchParams),
    [urlSearchParams]
  );

  const buildUnitsListParams = (raw) => {
    const base = { ...(raw || {}) };

    // CRITICAL: never allow accidental leakage from URL/searchParams
    delete base.client_id;
    delete base.clientId;
    delete base.visibility;

    const resaleRaw = base.resale ?? raw?.resale;
    const rentEligibleRaw =
      base.rentSearchEligible ??
      base.rent_search_eligible ??
      raw?.rentSearchEligible ??
      raw?.rent_search_eligible;

    // UI-only toggles (e.g. show_present_value, resale) must not hit the API
    UNITS_UI_ONLY_FILTER_KEYS.forEach((key) => {
      delete base[key];
    });
    delete base.rent_search_eligible;

    const params = {
      ...base,
      page_size: Number(base.page_size) || 16,
      visibility: "visible",
    };

    // primary → is_primary=true; resale → is_primary=false; both → omit (sell only)
    applyResaleFilterToApiParams(params, resaleRaw);

    // Keep UI token (true|false|both) for fetchUnitsFilter to map onto the API.
    // Default available when purpose=rent and value omitted.
    if (isRentPurpose(params.purpose)) {
      params.rentSearchEligible = normalizeRentSearchEligibleFilter(
        rentEligibleRaw == null || rentEligibleRaw === ""
          ? RENT_SEARCH_ELIGIBLE_DEFAULT
          : rentEligibleRaw
      );
    } else {
      delete params.rentSearchEligible;
    }

    // ONLY send client_id when My Inventory is ON
    if (
      (raw?.my_inventory === "true" || raw?.my_inventory === true) &&
      currentClientId
    ) {
      params.client_id = currentClientId;
    }

    // Same author ACL as Leads (skip on public listings).
    const scoped = publicUnits
      ? params
      : enforceDashboardAuthorOnParams(params);

    // Ensure we never send empty/undefined keys
    Object.keys(scoped).forEach((k) => {
      const v = scoped[k];
      if (v === undefined || v === null || v === "") delete scoped[k];
    });

    return scoped;
  };

  const showPresentValue =
    searchParams?.show_present_value === "true" ||
    searchParams?.show_present_value === true;

  const searchParamsWithClient = useMemo(() => {
    return buildUnitsListParams(searchParams);
    // buildUnitsListParams closes over currentClientId + publicUnits
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional param rebuild inputs
  }, [searchParams, currentClientId, publicUnits]);

  // Stringify searchParams for query key - this changes when filters change
  const searchParamsKey = useMemo(
    () => JSON.stringify(searchParamsWithClient),
    [searchParamsWithClient]
  );

  // Only seed React Query with SSR data when the current URL still matches the
  // prefetch. Otherwise a new filter key would reuse stale initialData for 15m.
  const initialPrefetchKeyRef = useRef(null);
  if (initialPrefetchKeyRef.current === null && initialUnitsData != null) {
    initialPrefetchKeyRef.current = JSON.stringify(
      buildUnitsListParams(searchParamsToObject(serverSearchParams))
    );
  }
  const initialDataForQuery =
    initialUnitsData != null &&
    initialPrefetchKeyRef.current === searchParamsKey
      ? initialUnitsData
      : null;

  const unitsFetchOptions = useMemo(
    () => ({ usePublicEndpoint: publicUnits }),
    [publicUnits]
  );

  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    useUnitsPageData(searchParamsKey, unitsFetchOptions, initialDataForQuery);

  const bulkSelection = useUnitsBulkSelectionOptional();
  const setVisibleUnitsFromList = bulkSelection?.setVisibleUnitsFromList;
  const brokerBadges = useBrokerUnitsBadgeOptional();

  useEffect(() => {
    if (!publicUnits && setVisibleUnitsFromList) {
      setVisibleUnitsFromList(units);
    }
  }, [units, publicUnits, setVisibleUnitsFromList]);

  if (isLoading || isFetching) {
    return <LoadingSpinner message="Loading units data..." />;
  }

  if (isError) {
    return (
      <div className="container">
        <QueryErrorState
          error={error}
          refetch={refetch}
          isFetching={isFetching}
          title="Error loading units"
          message="Failed to load units data. Please try again."
          retryLabel="Retry Units"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full">
      {isFetching ? (
        <LoadingSpinner
          message="Refreshing units..."
          containerClassName="flex items-center justify-center h-full mt-12"
        />
      ) : (
        <UnitsGrid
          units={units}
          pagination={pagination}
          readonly={publicUnits}
          showPresentValue={showPresentValue}
          brokerUnitIds={brokerBadges?.brokerUnitIds ?? null}
        />
      )}
    </div>
  );
}
