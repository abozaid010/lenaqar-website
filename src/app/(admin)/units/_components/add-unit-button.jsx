"use client";

import { useState } from "react";
import { Edit, Plus } from "lucide-react";
import AddUnitModal from "./add-unit-Modal";
import { useI18n } from "@/context/translate-api";

export default function AddUnitButton({
  isEdit = false,
  unitData,
  clientId,
  clientName,
  compounds,
  developers,
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  return (
    <>
      <button
        onClick={openModal}
        className={`flex-shrink-0 sm:w-auto px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md flex items-center justify-center transition duration-300 ${
          t.dir === "rtl" ? "flex-row-reverse" : ""
        }`}
      >
        {isEdit ? (
          <span className="flex items-center gap-2">
            <Edit size={18} />{" "}
            <span className="hidden sm:block">{t.units.addButton.edit}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Plus size={18} />{" "}
            <span className={`${isEdit ? "hidden sm:block" : "block"}`}>
              {t.units.addButton.addNew}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <AddUnitModal
          isEdit={isEdit}
          unitData={unitData}
          onClose={closeModal}
          clientId={clientId}
          clientName={clientName}
          compounds={compounds}
          developersData={developers}
        />
      )}
    </>
  );
}
