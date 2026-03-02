"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { usePendingApprovalUnitsPageData } from "@/hooks/use-pending-approval-units-page-data";
import { useMemo } from "react";

export default function PendingApprovalUnitsPageQuery({ searchParams }) {
  const searchParamsKey = useMemo(
    () => JSON.stringify(searchParams || {}),
    [searchParams]
  );

  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    usePendingApprovalUnitsPageData(searchParamsKey);

  if (isLoading || isFetching) {
    return <LoadingSpinner message="Loading pending approval units..." />;
  }

  if (isError) {
    return (
      <div className="container">
        <QueryErrorState
          error={error}
          refetch={refetch}
          isFetching={isFetching}
          title="Error loading pending approval units"
          message="Failed to load units. Please try again."
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {isFetching ? (
        <LoadingSpinner
          message="Refreshing..."
          containerClassName="flex items-center justify-center h-full mt-12"
        />
      ) : (
        <UnitsGrid
          units={units}
          pagination={pagination}
          readonly={false}
          allowMissingFields
        />
      )}
    </div>
  );
}
