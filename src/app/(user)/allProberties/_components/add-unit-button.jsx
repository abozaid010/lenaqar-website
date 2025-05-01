"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import AddUnitModal from "./add-unit-Modal";
import { useI18n } from "@/context/translate-api";
import { useRouter } from "next/navigation";

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
  const [pathname, setPathname] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const handleBack = () => router.back();

  return (
    <>
      {pathname !== "/allProberties" ? (
        <button
          onClick={openModal}
          className={`flex-shrink-0 w-full sm:w-auto px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md flex items-center justify-center transition duration-300 ${
            t.dir === "rtl" ? "flex-row-reverse" : ""
          }`}
        >
          {isEdit ? (
            <span className="flex items-center gap-2">
              <Edit size={18} /> {t.units.addButton.edit}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={18} /> {t.units.addButton.addNew}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mt-4 px-4 py-2 text-white bg-gradient-to-r from-[#3926A7] to-[#21EAF4] rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      )}

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
