"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsGrid from "@/components/ui/units-grid";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import { RotateCcw } from "lucide-react";
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
  const { isFetching, units, isLoading, isError } = useUnitsPageData(
    JSON.stringify(searchParamsWithClient),
    publicUnits
  );

  if (isLoading | isFetching) {
    return (
      <LoadingSpinner
        message="Loading units data..."
        containerClassName="flex items-center justify-center h-96"
      />
    );
  }

  if (isError) {
    return (
      <div className="container">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-2">
              Error loading data
            </div>
            <div className="text-gray-600 text-sm mb-4">
              {errorMessage || "An unexpected error occurred"}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {units.isError && (
                <button
                  onClick={() => units.refetch()}
                  disabled={units.isFetching}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw
                    size={16}
                    className={units.isFetching ? "animate-spin" : ""}
                  />
                  Retry Units
                </button>
              )}
            </div>
          </div>
        </div>
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
        <UnitsGrid units={units} readonly={publicUnits} />
      )}
    </div>
  );
}
