"use client";

import { useState } from "react";
import { Edit, Plus } from "lucide-react";
import AddUnitModal from "./add-unit-Modal";

export default function AddUnitButton({
  isEdit = false,
  unitData,
  clientId,
  clientName,
  compounds,
  developers,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="flex-shrink-0 w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center transition duration-300"
      >
        {isEdit ? (
          <span className="flex items-center gap-2">
            <Edit size={18} /> Edit Unit
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Plus size={18} /> Add New Unit
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
          developers={developers}
        />
      )}
    </>
  );
}
