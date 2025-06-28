"use client";

import { getClientRequirements } from "@/components/services/serviceFetching";
import PropertyDetailsModal from "@/components/ui/property-requirements-modal";
import { useState } from "react";

export default function ShowRequirementBtn({ id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState(null);

  const handleRequirements = async (name, phone) => {
    setIsLoading(true);

    try {
      const requirements = await getClientRequirements(id);
      setRequirements({ ...requirements, name, phone });
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <PropertyDetailsModal
          onClose={() => setIsOpen(false)}
          property={requirements}
        />
      )}
    </>
  );
}
