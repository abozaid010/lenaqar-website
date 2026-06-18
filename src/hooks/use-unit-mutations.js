"use client";

import {
  addUnit,
  addUnitRent,
  addUnitSaleViaExcel,
  approveUnitVisibility,
  deleteUnit,
  updateUnit,
  updateUnitRent,
} from "@/utils/api";
import {
  addUnitToCache,
  removeUnitFromCache,
  removeUnitFromPendingApprovalCache,
  refetchPendingApprovalQueriesIfEmpty,
  unitKeys,
  updateUnitInPendingApprovalCache,
  updateUnitsInCache,
} from "@/utils/query-utils";
import { isPendingOrHiddenVisibility } from "@/constants/property-visibility";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function isSuccessfulApiResponse(res) {
  return Boolean(res?.success === true || res?.status === true || res?.code === 200);
}

// Hook for adding a new unit
export function useAddUnit(fromExcel = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      let res;
      if (formData.purpose === "sell" && !fromExcel) {
        res = await addUnit(formData);
      } else if (formData.purpose === "rent" && !fromExcel) {
        res = await addUnitRent(formData);
      } else if (fromExcel) {
        res = await addUnitSaleViaExcel(formData);
      }

      if (!isSuccessfulApiResponse(res)) {
        throw new Error(res?.error || res?.error_message || res?.message || "Failed to add unit");
      }

      // Return the full response for Excel uploads to access inserted_ids
      return fromExcel ? res : formData;
    },
    onMutate: async (formData) => {
      if (fromExcel) return;
      await queryClient.cancelQueries({ queryKey: unitKeys.all });

      const previousUnits = queryClient.getQueriesData({
        queryKey: unitKeys.all,
      });

      const optimisticUnit = {
        ...formData,
        _isOptimistic: true,
      };

      addUnitToCache(queryClient, optimisticUnit);

      // Return a context object with the snapshotted value
      return { previousUnits, optimisticUnit };
    },
    onSuccess: (data, variables, context) => {
      // // Replace the optimistic unit with the real data => the server ONLY returns status
      // if (context?.optimisticUnit && data) {
      //   updateUnitsInCache(queryClient, context.optimisticUnit.unitId, () => ({
      //     ...data,
      //     _isOptimistic: false,
      //   }));
      // }

      queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
    onError: (err, variables, context) => {
      if (context?.previousUnits) {
        context.previousUnits.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

// Hook for updating a unit
export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      let res;
      if (formData.purpose === "sell") {
        res = await updateUnit(formData);
      } else if (formData.purpose === "rent") {
        res = await updateUnitRent(formData);
      }

      if (!isSuccessfulApiResponse(res)) {
        throw new Error(res?.error || res?.error_message || res?.message || "Failed to update unit");
      }

      return formData;
    },
    onMutate: async (formData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: unitKeys.all });

      // Snapshot the previous value
      const previousUnits = queryClient.getQueriesData({
        queryKey: unitKeys.all,
      });

      // Optimistically update the unit in the cache
      updateUnitsInCache(queryClient, formData.unitId, (oldUnit) => ({
        ...oldUnit,
        ...formData,
        _isOptimistic: true,
      }));

      // Return a context object with the snapshotted value
      return { previousUnits };
    },
    onSuccess: (data, variables) => {
      const unitId = variables.unitId;
      const visibility = variables.visibility ?? variables.status;

      updateUnitsInCache(queryClient, unitId, (unit) => ({
        ...unit,
        ...variables,
        _isOptimistic: false,
      }));

      if (!isPendingOrHiddenVisibility(visibility)) {
        const emptyKeys = removeUnitFromPendingApprovalCache(queryClient, unitId);
        refetchPendingApprovalQueriesIfEmpty(queryClient, emptyKeys);
      } else {
        updateUnitInPendingApprovalCache(queryClient, unitId, (unit) => ({
          ...unit,
          ...variables,
          _isOptimistic: false,
        }));
      }

      if (unitId) {
        queryClient.invalidateQueries({
          queryKey: unitKeys.detail(unitId),
        });
      }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousUnits) {
        context.previousUnits.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

// Hook for approving a pending unit (visibility: pending_approval -> visible)
export function useApproveUnitVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rawUnit) => {
      const res = await approveUnitVisibility(rawUnit);

      if (!isSuccessfulApiResponse(res)) {
        throw new Error(
          res?.error || res?.error_message || res?.message || "Failed to approve unit"
        );
      }

      return rawUnit?.unitId;
    },
    onSuccess: (unitId) => {
      if (unitId) {
        const emptyKeys = removeUnitFromPendingApprovalCache(queryClient, unitId);
        refetchPendingApprovalQueriesIfEmpty(queryClient, emptyKeys);

        queryClient.invalidateQueries({
          queryKey: unitKeys.detail(unitId),
        });
      }
    },
  });
}

// Hook for deleting a unit
export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitId) => {
      const res = await deleteUnit(unitId);

      if (!isSuccessfulApiResponse(res)) {
        throw new Error(res?.error || res?.error_message || res?.message || "Failed to delete unit");
      }

      return unitId;
    },
    onMutate: async (unitId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: unitKeys.all });

      // Snapshot the previous value
      const previousUnits = queryClient.getQueriesData({
        queryKey: unitKeys.all,
      });

      // Optimistically remove the unit from all relevant queries
      removeUnitFromCache(queryClient, unitId);

      // Return a context object with the snapshotted value
      return { previousUnits };
    },
    onError: (err, unitId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUnits) {
        context.previousUnits.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}
