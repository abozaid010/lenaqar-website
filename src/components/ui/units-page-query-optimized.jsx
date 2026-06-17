"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import { useEffect, useMemo } from "react";

export default function UnitsPageQueryOptimized({
  searchParams,
  clientId,
  publicUnits = false,
  initialUnitsData = null,
}) {
  const currentClientId = clientId || "";

  const buildUnitsListParams = (raw) => {
    const base = { ...(raw || {}) };

    // CRITICAL: never allow accidental leakage from URL/searchParams
    delete base.client_id;
    delete base.clientId;

    const params = {
      ...base,
      page_size: Number(base.page_size) || 16,
      visibility: "visible",
    };

    // Send is_primary only when resale filter is explicitly enabled.
    if (base.resale === "true") {
      params.is_primary = false;
    }

    // ONLY send client_id when My Inventory is ON
    if (base.my_inventory === "true" && currentClientId) {
      params.client_id = currentClientId;
    }

    // Ensure we never send empty/undefined keys
    Object.keys(params).forEach((k) => {
      const v = params[k];
      if (v === undefined || v === null || v === "") delete params[k];
    });

    return params;
  };

  const searchParamsWithClient = useMemo(() => {
    if (publicUnits) return { ...(searchParams || {}) };
    // Client object is stored locally (cookie); clientId is always sent for identity,
    // while client_id is ONLY sent when My Inventory is ON.
    return buildUnitsListParams(searchParams);
  }, [searchParams, publicUnits, currentClientId]);

  // Stringify searchParams for query key - this changes when filters change
  const searchParamsKey = useMemo(
    () => JSON.stringify(searchParamsWithClient),
    [searchParamsWithClient]
  );

  const unitsFetchOptions = useMemo(
    () => ({ usePublicEndpoint: publicUnits }),
    [publicUnits]
  );

  // Fetch all required data using the combined hook
  // When searchParamsKey changes, a new query is created and fetched automatically.
  // initialUnitsData is the server-prefetched first page — passed here only on the
  // initial load (no filters applied yet); null on filter changes (client fetches fresh).
  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    useUnitsPageData(searchParamsKey, unitsFetchOptions, initialUnitsData);

  const bulkSelection = useUnitsBulkSelectionOptional();
  const setVisibleUnitsFromList = bulkSelection?.setVisibleUnitsFromList;

  useEffect(() => {
    if (!publicUnits && setVisibleUnitsFromList) {
      setVisibleUnitsFromList(units);
    }
  }, [units, publicUnits, setVisibleUnitsFromList]);

  if (isLoading | isFetching) {
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
    <div className="flex-1 flex flex-col">
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
        />
      )}
    </div>
  );
}
