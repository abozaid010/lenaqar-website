"use client";

import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";
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
      </div>
    </>
  );
}
