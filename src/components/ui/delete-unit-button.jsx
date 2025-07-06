"use client";

import { useI18n } from "@/context/translate-api";
import { useDeleteUnit } from "@/hooks/use-unit-mutations";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function DeleteUnitButton({ unitId, unitTitle, className }) {
  const { t } = useI18n();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteUnitMutation = useDeleteUnit();

  const handleDelete = async () => {
    try {
      await deleteUnitMutation.mutateAsync(unitId);
      toast.success(t.toasts?.unitDeleted || "Unit deleted successfully");
      router.push("/units"); // Navigate back to units list
    } catch (error) {
      toast.error(error.message || "Failed to delete unit");
    }
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t.deleteConfirm?.title || "Confirm Delete"}
          </h3>
          <p className="text-gray-600 mb-6">
            {t.deleteConfirm?.message || "Are you sure you want to delete"} "
            {unitTitle}"?
            {t.deleteConfirm?.warning || " This action cannot be undone."}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={deleteUnitMutation.isPending}
            >
              {t.buttons?.cancel || "Cancel"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteUnitMutation.isPending}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleteUnitMutation.isPending
                ? t.buttons?.deleting || "Deleting..."
                : t.buttons?.delete || "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setShowConfirm(true)} className={className}>
      {t.buttons?.delete || "Delete Unit"}
    </button>
  );
}
