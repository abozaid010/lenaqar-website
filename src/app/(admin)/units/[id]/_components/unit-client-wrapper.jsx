"use client";

import DeleteUnitButton from "@/components/ui/delete-unit-button";
import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";
import { useUnitDetailsUpdate } from "@/hooks/use-unit-details-update";
import { useEffect, useState } from "react";
import UnitPageHeader from "../../_components/unit-page-header";

export default function UnitClientWrapper({
  data,
  compoundata,
  developers,
  citiesAndDistricts,
  clientId,
}) {
  const [unitData, setUnitData] = useState(data);

  // TanStack Query hook for updates
  const { updateUnit, isLoading } = useUnitDetailsUpdate(unitData, setUnitData);

  // Update local state when data prop changes
  useEffect(() => {
    setUnitData(data);
  }, [data]);

  return (
    <>
      <UnitPageHeader
        unit={unitData}
        compounds={compoundata}
        developers={developers}
        citiesAndDistricts={citiesAndDistricts}
        clientId={clientId}
        setUnitData={setUnitData}
        updateUnit={updateUnit}
        isUpdating={isLoading}
      />

      <div className="bg-white rounded-lg shadow-md overflow-hidden py-6 p-3">
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 xl:gap-14 justify-center">
          <ImageGallary
            images={unitData.images}
            unitName={unitData.unitTitle}
            unitId={unitData.unitId}
          />

          <UnitBasicInfo unit={unitData} />
        </div>

        {/* Add delete button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <DeleteUnitButton
            unitId={unitData.unitId}
            unitTitle={unitData.unitTitle}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          />
        </div>
      </div>
    </>
  );
}
