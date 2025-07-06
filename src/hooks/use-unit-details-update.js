"use client";

import { useI18n } from "@/context/translate-api";
import { useUpdateUnit } from "@/hooks/use-unit-mutations";
import toast from "react-hot-toast";

export function useUnitDetailsUpdate(unitData, setUnitData) {
  const { t } = useI18n();
  const updateUnitMutation = useUpdateUnit();

  const updateUnit = async (formData, purpose) => {
    try {
      await updateUnitMutation.mutateAsync({
        formData,
        purpose,
        unitId: unitData?.unitId,
      });

      // Update local state for immediate UI feedback
      if (setUnitData) {
        setUnitData(formData);
      }

      toast.success(t.toasts?.unitUpdated || "Unit updated successfully");

      return true;
    } catch (error) {
      toast.error(error.message || "Failed to update unit");
      return false;
    }
  };

  return {
    updateUnit,
    isLoading: updateUnitMutation.isPending,
    error: updateUnitMutation.error,
  };
}
