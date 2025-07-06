"use client";

import UnitsFilter from "@/components/ui/units-filter";
import UnitsGrid from "@/components/ui/units-grid";
import {
  useCitiesAndProjectsData,
  useCompoundsData,
  useDevelopersData,
  useUnitsData,
} from "@/hooks/use-units-data";
import { useUnitQueries } from "@/utils/query-utils";
import Cookies from "js-cookie";
import { Loader2, RotateCcw } from "lucide-react";
import { useCallback, useMemo } from "react";

export default function UnitsPageQuery({ searchParams }) {
  // Get client data from cookies
  const clientId = Cookies.get("lena-website-client_id");
  const clientInfo = Cookies.get("client_info");
  const clientName = clientInfo ? JSON.parse(clientInfo)?.client_name : null;

  // Get query utilities
  const { refetchUnits } = useUnitQueries();

  // Prepare search params with client ID
  const searchParamsWithClient = useMemo(
    () => ({
      ...searchParams,
      client_id: clientId,
    }),
    [searchParams, clientId]
  );

  // Fetch all required data
  const {
    data: unitsData,
    isLoading: unitsLoading,
    error: unitsError,
    isError: unitsIsError,
    refetch: refetchUnitsQuery,
    isFetching: unitsIsFetching,
  } = useUnitsData(searchParamsWithClient);

  const {
    data: developers,
    isLoading: developersLoading,
    error: developersError,
    isError: developersIsError,
    refetch: refetchDevelopers,
  } = useDevelopersData();

  const {
    data: compounds,
    isLoading: compoundsLoading,
    error: compoundsError,
    isError: compoundsIsError,
    refetch: refetchCompounds,
  } = useCompoundsData();

  const {
    data: citiesAndDistricts,
    isLoading: citiesLoading,
    error: citiesError,
    isError: citiesIsError,
    refetch: refetchCities,
  } = useCitiesAndProjectsData();

  // Create callback functions for the UnitsFilter component
  const handleSetIsLoading = useCallback((loading) => {
    // TanStack Query manages loading state automatically
    // This is a no-op but keeps the interface compatible
  }, []);

  const handleSetUnits = useCallback((units) => {
    // TanStack Query manages data automatically
    // This is a no-op but keeps the interface compatible
  }, []);

  // Check for initial loading states
  const isInitialLoading =
    unitsLoading || developersLoading || compoundsLoading || citiesLoading;

  // Check for any errors
  const hasErrors =
    unitsIsError || developersIsError || compoundsIsError || citiesIsError;
  const errorMessage =
    unitsError?.message ||
    developersError?.message ||
    compoundsError?.message ||
    citiesError?.message;

  if (isInitialLoading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2
              size={70}
              className="text-center animate-spin text-primary mx-auto mb-4"
            />
            <p className="text-gray-600">Loading units data...</p>
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
            <div className="flex gap-2 justify-center">
              {unitsIsError && (
                <button
                  onClick={() => refetchUnitsQuery()}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-95 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Retry Units
                </button>
              )}
              {developersIsError && (
                <button
                  onClick={() => refetchDevelopers()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-95 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Retry Developers
                </button>
              )}
              {compoundsIsError && (
                <button
                  onClick={() => refetchCompounds()}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:opacity-95 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Retry Compounds
                </button>
              )}
              {citiesIsError && (
                <button
                  onClick={() => refetchCities()}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:opacity-95 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Retry Cities
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const units = unitsData?.data?.units || [];

  return (
    <div className="container relative">
      {unitsIsFetching && (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm">
            <Loader2 size={14} className="animate-spin" />
            Updating units...
          </div>
        </div>
      )}

      <UnitsFilter
        appliedFilters={searchParams}
        developers={developers || []}
        compounds={compounds || []}
        clientId={clientId}
        clientName={clientName}
        citiesAndDistricts={citiesAndDistricts || []}
        setIsLoading={handleSetIsLoading}
        setUnits={handleSetUnits}
      />

      <div className="flex-1 flex flex-col">
        {unitsIsFetching ? (
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
