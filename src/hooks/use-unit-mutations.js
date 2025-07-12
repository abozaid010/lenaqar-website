"use client";

import {
  addUnit,
  addUnitRent,
  deleteUnit,
  updateUnit,
  updateUnitRent,
} from "@/components/services/serviceFetching";
import {
  addUnitToCache,
  removeUnitFromCache,
  unitKeys,
  updateUnitsInCache,
} from "@/utils/query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Hook for adding a new unit
export function useAddUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      let res;
      if (formData.purpose === "sell") {
        res = await addUnit(formData);
      } else if (formData.purpose === "rent") {
        res = await addUnitRent(formData);
      }

      if (!res || !res.status) {
        throw new Error("Failed to add unit");
      }

      return formData;
    },
    onMutate: async (formData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: unitKeys.all });

      const previousUnits = queryClient.getQueriesData({
        queryKey: unitKeys.all,
      });

      // Optimistically add the new unit to the cache
      const optimisticUnit = {
        ...formData,
        // Mark as optimistic for potential rollback
        _isOptimistic: true,
      };

      addUnitToCache(queryClient, optimisticUnit);

      // Return a context object with the snapshotted value
      return { previousUnits, optimisticUnit };
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic unit with the real data
      if (context?.optimisticUnit && data) {
        updateUnitsInCache(queryClient, context.optimisticUnit.unitId, () => ({
          ...data,
          _isOptimistic: false,
        }));
      }

      // Invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
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

      if (!res || !res.status) {
        throw new Error("Failed to update unit");
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

      console.log("Previous units before update:", previousUnits);
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
      // Mark the unit as no longer optimistic
      updateUnitsInCache(queryClient, variables.unitId, (unit) => ({
        ...unit,
        _isOptimistic: false,
      }));

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: unitKeys.all });

      // Also invalidate unit details if it exists
      if (data.unitId) {
        queryClient.invalidateQueries({
          queryKey: unitKeys.detail(data.unitId),
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

// Hook for deleting a unit
export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitId) => {
      const res = await deleteUnit(unitId);

      if (!res || !res.status) {
        throw new Error("Failed to delete unit");
      }

      return { ...res, unitId };
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
