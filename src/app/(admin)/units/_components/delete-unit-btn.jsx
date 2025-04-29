"use client";

import { deleteUnit } from "@/components/services/serviceFetching";
import { Loader2, Trash2Icon } from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUnitBtn({ unitId }) {
  const modalRef = useRef(null);
  const router = useRouter();

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
        toast.error("Failed to delete unit. Please try again.");
      }
      setIsOpen(false);
    } catch (error) {
      toast.error("An error occurred while deleting the unit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
      >
        <span className="flex items-center gap-2">
          <Trash2Icon size={18} /> Delete Unit
        </span>
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
              <h2 className="text-lg font-semibold mb-4">Delete Unit</h2>
              <p>Are you sure you want to delete this unit?</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded-md mr-2"
                >
                  Cancel
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
                    "Delete"
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
