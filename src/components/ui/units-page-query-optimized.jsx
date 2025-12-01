"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import { useMemo } from "react";

export default function UnitsPageQueryOptimized({
  searchParams,
  clientId,
  publicUnits = false,
}) {
  // Prepare search params with client ID
  const searchParamsWithClient = useMemo(
    () => ({
      ...searchParams,
      ...(publicUnits ? {} : { client_id: clientId || "" }),
    }),
    [searchParams, clientId]
  );

  // Fetch all required data using the combined hook
  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    useUnitsPageData(JSON.stringify(searchParamsWithClient), publicUnits);

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
