# Excel Upload Validation Update

## Overview
Updated the Excel upload functionality to differentiate between required and optional fields, allowing users to upload all columns while only enforcing validation on required fields.

## Changes Made

### 1. Updated Required Fields Configuration (`src/utils/excel-field-mapper.js`)

**Changed `VALIDATED_KEYS` to only include required fields:**

```javascript
// Before: All fields were validated
export const VALIDATED_KEYS = [
  "buildingType",
  "project",
  "view",           // removed - optional
  "unitTitle",      // removed - optional
  "bathroomCount",  // removed - optional
  "floor",          // removed - optional
  "roomsCount",
  "landArea",
  "gardenSize",     // removed - optional
  "finishing",
  "totalPrice",
  "deliveryDate",
];

// After: Only required fields are validated
export const VALIDATED_KEYS = [
  "buildingType",
  "project",
  "roomsCount",
  "landArea",
  "finishing",
  "totalPrice",
  "deliveryDate",
];
```

### 2. Updated Upload Dialog Component (`src/components/ui/upload-units-excel-dialog.jsx`)

#### a. Updated `getMissingColumns()` Function
Now only checks for missing **required** fields instead of all fields:

```javascript
const getMissingColumns = () => {
  if (!parsedData) return [];
  
  // Find all resolved template keys
  const resolvedKeys = new Set();
  excelTemplateColumns.forEach(templateCol => {
    const status = getTemplateColumnStatus(templateCol.key);
    if (status.isResolved) {
      resolvedKeys.add(templateCol.key);
    }
  });

  // Find missing required keys (only check keys marked as required)
  const requiredKeys = excelTemplateColumns
    .filter(col => col.is_required)
    .map(col => col.key);
  
  return requiredKeys.filter(key => !resolvedKeys.has(key));
};
```

#### b. Enhanced Visual Indicators

**Added asterisk (*) for required fields in column headers:**
```javascript
{column.label}{column.is_required ? " *" : ""}
```

**Color-coded columns based on status:**
- 🟢 **Green**: Mapped column (required or optional)
- 🔴 **Red**: Required field not mapped (must be selected)
- 🟡 **Yellow**: Optional field not mapped (can be left unmapped)

**Updated column header styling:**
```javascript
className={`px-2 py-2 text-left font-semibold border-b ${
  isResolved 
    ? "bg-green-100 text-green-800" 
    : templateCol.is_required
      ? "bg-red-100 text-red-800"
      : "bg-yellow-50 text-yellow-800"
}`}
```

**Updated dropdown border colors:**
```javascript
className={`... ${
  isResolved 
    ? "border-green-400" 
    : templateCol.is_required
      ? "border-red-400"
      : "border-yellow-400"
}`}
```

#### c. Updated Column Mapping Guide

Added comprehensive legend explaining the color codes:
- Green: Mapped column
- Red: Required field not mapped - must select
- Yellow: Optional field not mapped
- Asterisk (*): Indicates required field

## User Experience Improvements

### Before
- All columns were treated as required
- Users had to map every single column to upload
- No clear indication of which fields were truly necessary

### After
- Only 7 fields are required: `buildingType`, `project`, `roomsCount`, `landArea`, `finishing`, `totalPrice`, `deliveryDate`
- Optional fields can be left unmapped without blocking upload
- Clear visual indicators:
  - Required fields marked with asterisk (*)
  - Red highlighting for unmapped required fields
  - Yellow highlighting for unmapped optional fields
  - Green highlighting for all mapped fields
- Users can upload data even if optional columns are not present in their Excel file

## Required Fields (7 total)
1. **Building Type** - Type of property
2. **Project** - Project name
3. **Rooms Count** - Number of rooms/bedrooms
4. **Total Area** (landArea) - Main area measurement
5. **Finishing** - Finishing status
6. **Total Price** - Property price
7. **Delivery Date** - Expected delivery/handover date

## Optional Fields (6 total)
1. **View** - Property view/orientation
2. **Unit Title** - Custom unit name
3. **Bathroom Count** - Number of bathrooms
4. **Floor** - Floor level
5. **Garden Area** - Garden size (if applicable)
6. **Garage Area** - Garage/parking size
7. **Model** - Design type/model
8. **Down Payment** - Initial payment amount

## Backend Compatibility
The backend will receive all mapped columns (both required and optional). The validation only affects the frontend user experience, ensuring users provide the essential information while allowing flexibility for optional details.

## Testing Recommendations

1. **Test with Excel file containing only required columns** - Should upload successfully
2. **Test with Excel file missing required columns** - Should show warning dialog
3. **Test with Excel file containing mix of required and optional columns** - Should upload successfully
4. **Test mapping UI** - Verify color codes match field requirements
5. **Test visual indicators** - Ensure asterisks appear on required fields only

