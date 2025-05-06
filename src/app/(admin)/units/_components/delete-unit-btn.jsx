"use client";

import { deleteUnit } from "@/components/services/serviceFetching";
import { Loader2, Trash2Icon } from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/translate-api";

export default function DeleteUnitBtn({ unitId }) {
  const modalRef = useRef(null);
  const router = useRouter();
  const { t } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const handleDeleteUnit = async () => {
    setLoading(true);
    try {
      const response = await deleteUnit(unitId);
      if (response.code === 200) {
        router.push("/units");
      } else {
        toast.error(t("unitPage.deleteFail"));
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(t("unitPage.deleteError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
      >
        <Trash2Icon size={18} />{" "}
        <span className="hidden sm:block">{t.unitPage.deleteUnit}</span>
      </button>

      {isOpen &&
        createPortal(
          <div
            onClick={handleOutsideClick}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div
              ref={modalRef}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h2 className="text-lg font-semibold mb-4">
                {t.unitPage.deleteUnit}
              </h2>
              <p>{t.unitPage.confirmDeleteMsg}</p>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded-md mr-2"
                >
                  {t.unitPage.cancel}
                </button>
                <button
                  disabled={loading}
                  onClick={handleDeleteUnit}
                  className={`bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md w-24 flex items-center justify-center ${
                    loading
                      ? "opacity-70 pointer-events-none"
                      : "cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    t.unitPage.delete
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
