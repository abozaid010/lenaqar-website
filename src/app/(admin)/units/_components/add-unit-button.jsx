"use client";

import { useI18n } from "@/context/translate-api";
import { Edit, Plus } from "lucide-react";
import { useState } from "react";
import AddUnitModal from "./add-unit-Modal";

export default function AddUnitButton({
  isEdit = false,
  unitData,
  clientId,
  clientName,
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  return (
    <>
      <button
        onClick={openModal}
        className={`flex-shrink-0 sm:w-auto  px-[16px] py-[10px] h-[40px] bg-primary hover:opacity-90 text-white rounded-[5px]  flex items-center justify-center transition duration-300 ${
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
            <Plus width={24} height={24} />{" "}
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
        />
      )}
    </>
  );
}
