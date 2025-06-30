"use client";

import UnitsFilter from "@/components/ui/units-filter";
import UnitsGrid from "@/components/ui/units-grid";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function UnitsClientWrapper({
  initialUnits,
  searchParams,
  developers,
  compounds,
  clientId,
  clientName,
  citiesAndDistricts,
}) {
  const [units, setUnits] = useState(initialUnits);
  const [loading, setIsLoading] = useState(false);

  return (
    <div className="container">
      <UnitsFilter
        appliedFilters={searchParams}
        developers={developers}
        compounds={compounds}
        clientId={clientId}
        clientName={clientName}
        citiesAndDistricts={citiesAndDistricts}
        setIsLoading={setIsLoading}
        setUnit={setUnits}
      />

      <div className="flex-1 flex flex-col">
        {loading ? (
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
