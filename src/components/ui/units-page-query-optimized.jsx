"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useMemo } from "react";

export default function UnitsPageQueryOptimized({
  searchParams,
  clientId,
  publicUnits = false,
}) {
  // Client object is stored locally (cookie); don't send client_id when client_type is broker
  const searchParamsWithClient = useMemo(() => {
    const clientInfo = LenaCookiesManager.getClientInfo();
    const isBroker = (clientInfo?.client_type ?? "").toLowerCase() === "broker";
    const base = { ...searchParams };
    if (publicUnits) return base;
    
    // Handle My Inventory filter
    let clientParam = {};
    if (searchParams.my_inventory === "true") {
      // When My Inventory is ON, use client_id from token and override broker behavior
      const accessToken = LenaCookiesManager.getAccessToken();
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const tokenClientId = payload.client_id ?? payload.sub ?? null;
          if (tokenClientId) {
            clientParam = { client_id: tokenClientId };
          }
        } catch (error) {
          console.error("Failed to extract client_id from token:", error);
        }
      }
    } else {
      // Default behavior when My Inventory is OFF
      clientParam = isBroker ? {} : { client_id: clientId || "" };
    }
    
    // Handle Resale filter
    let isPrimaryParam = {};
    if (searchParams.resale === "true") {
      isPrimaryParam = { is_primary: false };
    } else {
      isPrimaryParam = { is_primary: true };
    }
    
    return {
      ...base,
      ...isPrimaryParam,
      ...clientParam,
    };
  }, [searchParams, clientId, publicUnits]);

  // Stringify searchParams for query key - this changes when filters change
  const searchParamsKey = useMemo(
    () => JSON.stringify(searchParamsWithClient),
    [searchParamsWithClient]
  );

  // Fetch all required data using the combined hook
  // When searchParamsKey changes, a new query is created and fetched automatically
  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    useUnitsPageData(searchParamsKey, publicUnits);

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
