"use client";

import { useRouter } from "next/navigation";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";
import {
  buildAdminUnitDetailPath,
} from "@/lib/units/unit-share-links";
import { buildAdminPendingApprovalListPath } from "@/utils/units-navigation-source";

export default function EditUnitClient({
  rawUnit,
  unitCode,
  clientId,
  fromPendingApproval = false,
}) {
  const router = useRouter();
  const detailPath = buildAdminUnitDetailPath(unitCode, clientId);
  const returnPath = fromPendingApproval
    ? buildAdminPendingApprovalListPath(clientId)
    : detailPath;

  const handleClose = () => {
    router.push(returnPath);
  };

  return (
    <EditUnitForm
      unitData={rawUnit}
      isEdit={true}
      isPageMode={true}
      onClose={handleClose}
      onUnitsExtracted={handleClose}
    />
  );
}
