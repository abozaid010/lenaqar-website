"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import QueryErrorState from "@/components/ui/query-error-state";
import { usePendingApprovalUnitsPageData } from "@/hooks/use-pending-approval-units-page-data";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { unitsSourcePendingQueryString } from "@/utils/units-navigation-source";
import { useMemo, useState, useEffect } from "react";

const VISIBILITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "ai_generated", label: "AI Generated" },
];

export default function ResalePageQuery({ searchParams }) {
  const [filter, setFilter] = useState("all");

  const searchParamsKey = useMemo(() => {
    const base = searchParams || {};
    // "all" = only is_primary: false (no visibility/dataSource)
    if (filter === "all") {
      return JSON.stringify(base);
    }
    if (filter === "ai_generated") {
      return JSON.stringify({ ...base, dataSource: "ai_generated" });
    }
    return JSON.stringify({ ...base, visibility: filter });
  }, [searchParams, filter]);

  const { isFetching, units, pagination, isLoading, isError, error, refetch } =
    usePendingApprovalUnitsPageData(searchParamsKey);

  // Refetch when filter changes to ensure API is triggered
  useEffect(() => {
    refetch();
  }, [filter, refetch]);

  const handleFilterChange = (e) => {
    const next = e?.target?.value || "";
    setFilter(next || "all");
  };

  if (isLoading || isFetching) {
    return <LoadingSpinner message="Loading resale units..." />;
  }

  if (isError) {
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
    <div className="flex-1 flex flex-col">
      <div className="container flex items-center justify-end mt-2">
        <div className="w-full max-w-xs">
          <SearchableDropdownSelect
            name="filter"
            label="Filter"
            options={VISIBILITY_OPTIONS}
            value={filter}
            onChange={handleFilterChange}
            showAllOption={false}
            placeholder="Select filter"
            buttonClassName="text-primary"
          />
        </div>
      </div>

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
          linkQueryParams={unitsSourcePendingQueryString(true)}
        />
      )}
    </div>
  );
}
