# Migration Examples - Old vs New Pattern

## Example 1: Updating a Component that Adds Units

### Before (Manual State Management):

```jsx
// Old UnitsFilter component or similar
"use client";

import { useState } from "react";
import { addUnit } from "@/components/services/serviceFetching";
import toast from "react-hot-toast";

export default function OldUnitsComponent({ units, setUnits }) {
  const [loading, setLoading] = useState(false);

  const handleAddUnit = async (formData) => {
    setLoading(true);
    try {
      const res = await addUnit(formData);
      if (res.status) {
        // Manual state update
        setUnits((prev) => [...prev, res.data]);
        toast.success("Unit added successfully");
      } else {
        toast.error("Failed to add unit");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Component UI */}
      <button onClick={() => handleAddUnit(data)} disabled={loading}>
        {loading ? "Adding..." : "Add Unit"}
      </button>
    </div>
  );
}
```

### After (TanStack Query):

```jsx
// New UnitsFilter component
"use client";

import { useAddUnit } from "@/hooks/use-unit-mutations";
import toast from "react-hot-toast";

export default function NewUnitsComponent() {
  const addUnitMutation = useAddUnit();

  const handleAddUnit = async (formData) => {
    try {
      await addUnitMutation.mutateAsync({
        formData,
        purpose: formData.purpose,
      });
      toast.success("Unit added successfully");
      // No manual state update needed - cache updated automatically
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      {/* Component UI */}
      <button
        onClick={() => handleAddUnit(data)}
        disabled={addUnitMutation.isPending}
      >
        {addUnitMutation.isPending ? "Adding..." : "Add Unit"}
      </button>
    </div>
  );
}
```

## Example 2: Updating a Unit Details Component

### Before (Manual State Management):

```jsx
// Old unit header component
"use client";

import { useState } from "react";
import { updateUnit } from "@/components/services/serviceFetching";

export default function OldUnitHeader({ unit, setUnitData }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (newData) => {
    setLoading(true);
    try {
      const res = await updateUnit(newData);
      if (res.status) {
        // Manual local state update
        setUnitData(newData);
        toast.success("Unit updated");
        // Note: Units list wouldn't update automatically
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleUpdate(data)} disabled={loading}>
        {loading ? "Updating..." : "Update Unit"}
      </button>
    </div>
  );
}
```

### After (TanStack Query):

```jsx
// New unit header component
"use client";

import { useUnitDetailsUpdate } from "@/hooks/use-unit-details-update";

export default function NewUnitHeader({ unit, setUnitData }) {
  const { updateUnit, isLoading } = useUnitDetailsUpdate(unit, setUnitData);

  const handleUpdate = async (newData) => {
    const success = await updateUnit(newData, unit.purpose);
    // Both local state AND units list cache updated automatically
    if (success) {
      console.log("Unit updated successfully");
    }
  };

  return (
    <div>
      <button onClick={() => handleUpdate(data)} disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Unit"}
      </button>
    </div>
  );
}
```

## Example 3: Handling Unit Deletion

### Before (Manual State Management):

```jsx
// Old delete functionality
"use client";

import { useState } from "react";
import { deleteUnit } from "@/components/services/serviceFetching";
import { useRouter } from "next/navigation";

export default function OldDeleteButton({ unitId, units, setUnits }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteUnit(unitId);
      if (res.status) {
        // Manual removal from local state
        setUnits((prev) => prev.filter((u) => u.unitId !== unitId));
        router.push("/units");
        toast.success("Unit deleted");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete Unit"}
    </button>
  );
}
```

### After (TanStack Query):

```jsx
// New delete functionality
"use client";

import { useDeleteUnit } from "@/hooks/use-unit-mutations";
import { useRouter } from "next/navigation";

export default function NewDeleteButton({ unitId, unitTitle }) {
  const deleteUnitMutation = useDeleteUnit();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteUnitMutation.mutateAsync(unitId);
      // Unit removed from ALL caches automatically
      router.push("/units");
      toast.success("Unit deleted");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteUnitMutation.isPending}>
      {deleteUnitMutation.isPending ? "Deleting..." : "Delete Unit"}
    </button>
  );
}
```

## Key Benefits of Migration:

### 1. **Automatic Cache Synchronization**

- Old: Manual state updates only affect current component
- New: Automatic updates across all components using the same data

### 2. **Optimistic Updates**

- Old: UI updates only after API success
- New: UI updates immediately, rolls back on error

### 3. **Error Recovery**

- Old: Manual error handling, potential inconsistent state
- New: Automatic rollback on errors, guaranteed consistency

### 4. **Performance**

- Old: Multiple API calls when navigating between pages
- New: Intelligent caching and background updates

### 5. **Developer Experience**

- Old: Repetitive state management code
- New: Declarative hooks with built-in best practices

## Migration Checklist:

- [ ] Replace manual `useState` for API data with TanStack Query hooks
- [ ] Remove manual state update calls (`setUnits`, `setUnitData`)
- [ ] Update loading states to use mutation `isPending`
- [ ] Remove manual error handling (still keep user-facing error messages)
- [ ] Test optimistic updates work correctly
- [ ] Verify error rollback behavior
- [ ] Check that all related components update automatically

## Backwards Compatibility:

The new implementation maintains backwards compatibility by:

- Still accepting `setUnits` and `setUnitData` props (but ignoring them)
- Maintaining the same component interfaces
- Providing the same or better user experience

This allows for gradual migration without breaking existing code.
