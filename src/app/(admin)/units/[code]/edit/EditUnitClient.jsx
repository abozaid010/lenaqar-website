"use client";

import { useRouter } from "next/navigation";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";
import {
  buildUnitsListPathForSection,
  consumeUnitsListOrigin,
} from "@/utils/units-navigation-source";

export default function EditUnitClient({
  rawUnit,
  unitCode,
  clientId,
  fromPendingApproval = false,
}) {
  const router = useRouter();
  const section = fromPendingApproval ? "pending_approval" : "units";

  /**
   * Return the user to the list they came from. Called by the form only AFTER a
   * successful save (or when cancelling). Priority:
   *  1. The exact originating list URL (filters/search/pagination preserved).
   *  2. A safe fallback list for the section (Units, or Hidden Units when pending).
   */
  const handleClose = () => {
    const origin = consumeUnitsListOrigin(section);
    const returnPath = origin ?? buildUnitsListPathForSection(section, clientId);
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
