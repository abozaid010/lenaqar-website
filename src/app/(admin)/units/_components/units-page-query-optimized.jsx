"use client";

import UnitsFilter from "@/components/ui/units-filter";
import UnitsGrid from "@/components/ui/units-grid";
import { useUnitsPageData } from "@/hooks/use-units-page-data";
import Cookies from "js-cookie";
import { Loader2, RotateCcw } from "lucide-react";
import { useMemo } from "react";

export default function UnitsPageQueryOptimized({ searchParams }) {
  // Get client data from cookies
  const clientId = Cookies.get("lena-website-client_id");
  const clientInfo = Cookies.get("client_info");
  const clientName = clientInfo ? JSON.parse(clientInfo)?.client_name : null;

  // Prepare search params with client ID
  const searchParamsWithClient = useMemo(
    () => ({
      ...searchParams,
      client_id: clientId,
    }),
    [searchParams, clientId]
  );

  // Fetch all required data using the combined hook
  const {
    units,
    developers,
    compounds,
    citiesAndDistricts,
    isInitialLoading,
    hasErrors,
    errorMessage,
  } = useUnitsPageData(JSON.stringify(searchParamsWithClient));

  if (isInitialLoading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2
              size={70}
              className="text-center animate-spin text-primary mx-auto mb-4"
            />
          </div>
        </div>
      </div>
    );
  }

  if (hasErrors) {
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
              {developers.isError && (
                <button
                  onClick={() => developers.refetch()}
                  disabled={developers.isFetching}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw
                    size={16}
                    className={developers.isFetching ? "animate-spin" : ""}
                  />
                  Retry Developers
                </button>
              )}
              {compounds.isError && (
                <button
                  onClick={() => compounds.refetch()}
                  disabled={compounds.isFetching}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw
                    size={16}
                    className={compounds.isFetching ? "animate-spin" : ""}
                  />
                  Retry Compounds
                </button>
              )}
              {citiesAndDistricts.isError && (
                <button
                  onClick={() => citiesAndDistricts.refetch()}
                  disabled={citiesAndDistricts.isFetching}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw
                    size={16}
                    className={
                      citiesAndDistricts.isFetching ? "animate-spin" : ""
                    }
                  />
                  Retry Cities
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative">
      <UnitsFilter
        appliedFilters={searchParams}
        developers={developers}
        compounds={compounds}
        clientId={clientId}
        clientName={clientName}
        citiesAndDistricts={citiesAndDistricts}
      />

      <div className="flex-1 flex flex-col">
        {units.isFetching ? (
          <div className="flex items-center justify-center h-full mt-12">
            <Loader2
              size={70}
              className="text-center animate-spin text-primary"
            />
          </div>
        ) : (
          <UnitsGrid units={units} />
        )}
      </div>
    </div>
  );
}
