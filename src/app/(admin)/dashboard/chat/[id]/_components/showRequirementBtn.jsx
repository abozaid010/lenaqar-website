"use client";

import { getClientRequirements } from "@/components/services/serviceFetching";
import PropertyDetailsModal from "@/components/ui/property-requirements-modal";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function ShowRequirementBtn({ id, name, phone }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const handleRequirements = async () => {
    if (hasFetched && requirements) {
      setIsOpen(true);
      return;
    }

    // Only fetch if we haven't fetched before
    setIsLoading(true);

    try {
      const requirements = await getClientRequirements(id);
      setRequirements({ ...requirements, name, phone });
      setHasFetched(true);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleRequirements}>
        {loading ? (
          <Loader2 className="animate-spin text-primary/90" />
        ) : (
          <span className="text-primary/90 text-sm cursor-pointer hover:underline font-semibold">
            {t.propertyDetails.title}
          </span>
        )}
      </button>
      {isOpen && (
        <PropertyDetailsModal
          onClose={() => setIsOpen(false)}
          property={requirements}
        />
      )}
    </>
  );
}
