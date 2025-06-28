"use client";

import { getClientRequirements } from "@/components/services/serviceFetching";
import PropertyDetailsModal from "@/components/ui/property-requirements-modal";
import { useState } from "react";

export default function ShowRequirementBtn({ id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState(null);

  const handleRequirements = async (user_id, name, phone) => {
    setIsLoading(true);

    try {
      const requirements = await getClientRequirements(user_id);
      setRequirements({ ...requirements, name: name, phone: phone });
      setOpenRequirementsModal(true);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      setLoadingRequirements(null);
    }
  };

  return (
    <>
      {isOpen && (
        <PropertyDetailsModal
          onClose={() => {
            setIsOpen(false);
            setLoadingRequirements(null);
          }}
          property={requirements}
        />
      )}
    </>
  );
}
