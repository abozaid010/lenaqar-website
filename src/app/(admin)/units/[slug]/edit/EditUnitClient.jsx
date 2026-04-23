"use client";

import { useRouter } from "next/navigation";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";

export default function EditUnitClient({ rawUnit, slug }) {
  const router = useRouter();

  const handleClose = () => {
    // Redirect back to unit details when edit form is closed/cancelled
    router.push(`/admin/units/${slug}`);
  };

  return (
    <EditUnitForm 
      unitData={rawUnit}
      isEdit={true}
      isPageMode={true}
      onClose={handleClose}
      onUnitsExtracted={() => {
        // Called after successful unit update
        router.push(`/admin/units/${slug}`);
      }}
    />
  );
}
