"use client";

import { useRouter } from "next/navigation";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";
import { buildAdminUnitDetailPath } from "@/lib/units/unit-share-links";

export default function EditUnitClient({ rawUnit, unitCode, clientId }) {
  const router = useRouter();
  const detailPath = buildAdminUnitDetailPath(unitCode, clientId);

  const handleClose = () => {
    router.push(detailPath);
  };

  return (
    <EditUnitForm
      unitData={rawUnit}
      isEdit={true}
      isPageMode={true}
      onClose={handleClose}
      onUnitsExtracted={() => {
        router.push(detailPath);
      }}
    />
  );
}
