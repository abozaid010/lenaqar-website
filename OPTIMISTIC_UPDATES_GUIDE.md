# TanStack Query Optimistic Updates Guide

## Overview

This guide shows how to maintain the previous user experience with instant UI updates using TanStack Query mutations while keeping data synchronized with the server.

## Key Features Implemented

### 1. Optimistic Updates for Adding Units

When a user adds a new unit through `AddUnitModal`, the unit appears immediately in the units list without waiting for the API response.

**How it works:**

```jsx
// In AddUnitModal component
const addUnitMutation = useAddUnit();

const handleSubmit = async () => {
  try {
    await addUnitMutation.mutateAsync({
      formData: finalFormData,
      purpose: formData.purpose,
    });
    // Unit appears in list immediately
    toast.success("Unit added successfully");
  } catch (error) {
    // If API fails, unit is removed from list automatically
    toast.error(error.message);
  }
};
```

**Behind the scenes:**

- `onMutate`: Immediately adds unit to cache with temporary ID
- `onSuccess`: Replaces temporary unit with real server data
- `onError`: Removes optimistic unit if API call fails

### 2. Optimistic Updates for Editing Units

When editing a unit from the unit details page, changes appear immediately in both the details view and the units list.

**Usage example:**

```jsx
// In UnitClientWrapper component
import { useUnitDetailsUpdate } from "@/hooks/use-unit-details-update";

const { updateUnit, isLoading } = useUnitDetailsUpdate(unitData, setUnitData);

// In UnitPageHeader or edit form
const handleEdit = async (formData, purpose) => {
  const success = await updateUnit(formData, purpose);
  if (success) {
    // UI already updated optimistically
    console.log("Unit updated successfully");
  }
};
```

### 3. Optimistic Updates for Deleting Units

When deleting a unit, it disappears immediately from the list and user is navigated to the units page.

**Usage example:**

```jsx
// In unit details page
import DeleteUnitButton from "@/components/ui/delete-unit-button";

<DeleteUnitButton
  unitId={unitData.unitId}
  unitTitle={unitData.unitTitle}
  className="px-4 py-2 bg-red-500 text-white rounded-md"
/>;
```

**Behind the scenes:**

- Shows confirmation dialog
- On confirm: immediately removes unit from cache
- Navigates to `/units` page
- If API fails: restores unit to cache

## Implementation Details

### 1. Mutation Hooks

**File:** `src/hooks/use-unit-mutations.js`

Three main hooks:

- `useAddUnit()` - For creating new units
- `useUpdateUnit()` - For editing existing units
- `useDeleteUnit()` - For removing units

Each hook implements:

- `onMutate`: Optimistic cache updates
- `onSuccess`: Real data integration
- `onError`: Rollback on failures

### 2. Cache Helper Functions

**File:** `src/utils/query-utils.js`

Utility functions for cache management:

- `addUnitToCache(queryClient, newUnit)` - Adds unit to all unit lists
- `updateUnitsInCache(queryClient, unitId, updateFn)` - Updates specific unit
- `removeUnitFromCache(queryClient, unitId)` - Removes unit from all lists

### 3. UI Components

**Updated Components:**

- `AddUnitModal` - Uses `useAddUnit()` and `useUpdateUnit()`
- `UnitClientWrapper` - Integrates with update/delete hooks
- `DeleteUnitButton` - Handles deletion with confirmation

## Benefits for User Experience

### 1. Instant Feedback

- ✅ User sees changes immediately
- ✅ No waiting for API responses
- ✅ Loading states only for background sync

### 2. Error Recovery

- ✅ Automatic rollback on API failures
- ✅ User sees error messages
- ✅ Data consistency maintained

### 3. Performance

- ✅ Reduced perceived loading time
- ✅ Background cache invalidation
- ✅ Smart refetching only when needed

## Migration from Old Pattern

### Before (Manual State Management):

```jsx
// Old way - manual state updates
const handleSubmit = async () => {
  const res = await addUnit(formData);
  if (res.status) {
    setUnits((prev) => [...prev, res.data]); // Manual update
  }
};
```

### After (TanStack Query):

```jsx
// New way - automatic cache management
const addUnitMutation = useAddUnit();

const handleSubmit = async () => {
  await addUnitMutation.mutateAsync({ formData, purpose });
  // Cache updated automatically with optimistic updates
};
```

## Backwards Compatibility

The implementation maintains backwards compatibility:

- `setUnits` and `setUnitData` props are still accepted but not used
- Existing components work without modification
- Gradual migration path available

## Data Flow Example

### Adding a Unit:

1. User fills form and clicks "Save"
2. **Immediately**: Unit appears in units list (optimistic)
3. **Background**: API call is made
4. **On Success**: Unit data updated with server response
5. **On Error**: Unit removed from list, error shown

### Editing a Unit:

1. User edits unit details and saves
2. **Immediately**: Changes visible in UI (optimistic)
3. **Background**: API call is made
4. **On Success**: Data confirmed with server
5. **On Error**: Changes reverted, error shown

### Deleting a Unit:

1. User clicks delete and confirms
2. **Immediately**: Unit disappears from list
3. **Immediately**: User navigated to units page
4. **Background**: API call is made
5. **On Error**: Unit restored to list (if user navigates back)

## Error Handling

All mutations include comprehensive error handling:

- Network failures
- Server errors
- Validation errors
- Permission errors

The UI automatically recovers from errors by:

- Rolling back optimistic updates
- Showing appropriate error messages
- Maintaining data consistency

## Performance Considerations

- **Cache Size**: Automatic cleanup of stale data
- **Memory Usage**: Optimized query invalidation
- **Network**: Reduced unnecessary requests
- **UI Responsiveness**: Non-blocking operations

This implementation provides the best of both worlds: instant user feedback with reliable data synchronization.
