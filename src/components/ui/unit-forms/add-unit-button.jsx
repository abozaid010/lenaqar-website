"use client";

import { useI18n } from "@/hooks/useI18n";
import { Edit, Plus } from "lucide-react";
import { useState } from "react";
import AddUnitModal from "./add-unit-Modal";

export default function AddUnitButton({ isEdit = false, unitData, disabled = false }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [extractedQueue, setExtractedQueue] = useState([]);
  const [initialUnitData, setInitialUnitData] = useState(null);

  const openModal = () => {
    if (disabled) return;
    setInitialUnitData(null);
    setExtractedQueue([]);
    setIsOpen(true);
  };

  const closeModal = () => {
    if (extractedQueue.length > 0) {
      setInitialUnitData(extractedQueue[0]);
      setExtractedQueue((q) => q.slice(1));
      setIsOpen(true);
    } else {
      setInitialUnitData(null);
      setExtractedQueue([]);
      setIsOpen(false);
    }
  };

  const handleUnitsExtracted = (units) => {
    setInitialUnitData(units[0]);
    setExtractedQueue(units.slice(1));
    setIsOpen(true);
  };

  const unitDataToPass = isEdit ? unitData : initialUnitData ?? unitData;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={disabled}
        title={disabled ? "You can only edit your own units" : undefined}
        className={`flex-shrink-0 sm:w-auto min-h-11 h-11 min-w-11 lg:min-h-[40px] lg:h-[40px] lg:min-w-0 px-3 sm:px-4 bg-primary text-white rounded-[5px] flex items-center justify-center transition duration-300 ${
          t.dir === "rtl" ? "flex-row-reverse" : ""
        } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"}`}
      >
        {isEdit ? (
          <span className="flex items-center gap-2">
            <Edit size={18} />{" "}
            <span className="hidden sm:block">{t.units.addButton.edit}</span>
          </span>
        ) : (
          <Plus width={24} height={24} />
        )}
      </button>

      {isOpen && (
        <AddUnitModal
          isEdit={isEdit}
          unitData={unitDataToPass}
          onClose={closeModal}
          onUnitsExtracted={handleUnitsExtracted}
        />
      )}
    </>
  );
}
