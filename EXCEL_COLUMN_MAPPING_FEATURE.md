# Excel Column Mapping Feature

## Overview
This document describes the Excel column header validation and mapping feature implemented in the Upload Units Excel Dialog component.

## Feature Description
The feature allows users to upload Excel files with custom column headers and map them to the system's expected field keys. The system automatically recognizes many common variations of column names, and for unrecognized headers, users can manually map them using dropdown selectors.

## Key Features

### 1. **Automatic Column Recognition**
- The system automatically recognizes common variations of column names
- Uses the `FIELD_ALIASES` mapping from `excel-field-mapper.js`
- Examples:
  - "title", "unit title", "unit-title" → `unitTitle`
  - "bathrooms", "bathroom count" → `bathroomCount`
  - "price", "total price" → `totalPrice`

### 2. **Visual Validation States**

#### Valid Headers (Green Background)
- Headers that are automatically recognized
- Display with green background (`bg-green-100`)
- Show the original header and the mapped canonical key
- Example: "title" → `unitTitle`

#### Invalid Headers (Red Background)  
- Headers that are NOT automatically recognized
- Display with red background (`bg-red-100`)
- Show a dropdown selector to manually map the header
- Example: A custom header like "Property Name" needs to be mapped

### 3. **Manual Mapping**
- For unrecognized headers, users can select the correct mapping from a dropdown
- Dropdown shows all available field keys from `excelTemplateColumns`
- Already-used mappings are disabled to prevent duplicate assignments
- When a mapping is selected, the system automatically re-parses the Excel file

### 4. **Smart Dropdown Features**
- Shows all available template columns
- Disables options that are already mapped by other headers (marked with ✓)
- Updates in real-time when selections change
- Format: `{label} ({key})` - e.g., "Area (area)"

## Implementation Details

### State Management
```javascript
const [manualHeaderMapping, setManualHeaderMapping] = useState({});
```
- Stores user's manual header-to-key mappings
- Format: `{ "Original Header": "canonicalKey" }`

### Key Functions

#### `getHeaderValidationStatus(header)`
Returns validation information for a header:
- `isValid`: Boolean indicating if header is mapped
- `mappedKey`: The canonical key it maps to
- `isManual`: Boolean indicating if manually mapped

#### `handleHeaderMappingChange(originalHeader, newCanonicalKey)`
- Updates the manual mapping state
- Triggers re-parsing of the Excel file with new mappings
- Merges automatic and manual mappings

#### `getUsedMappings()`
- Returns a Set of all currently used canonical keys
- Prevents duplicate mappings in dropdowns

### Parsing Logic
The `parseExcelFile` function now:
1. Creates automatic header mapping using `createHeaderMapping()`
2. Merges with manual mappings: `{ ...autoHeaderMapping, ...manualHeaderMapping }`
3. Uses combined mapping to transform Excel rows to unit objects

## User Experience Flow

1. **User uploads Excel file**
2. **System analyzes headers:**
   - Automatically recognized headers → Green background
   - Unrecognized headers → Red background with dropdown
3. **User maps unrecognized headers:**
   - Selects appropriate mapping from dropdown
   - System automatically re-parses with new mapping
4. **Visual feedback:**
   - Green headers show the mapping (e.g., "title → unitTitle")
   - Red headers show "(Not Mapped)" until user selects mapping
5. **Validation before upload:**
   - System checks for missing required fields
   - User must map all critical columns before uploading

## Visual Design

### Green (Valid) Header Example:
```
┌──────────────────────┐
│ title                │ (Green background)
│ → unitTitle          │ (Small green text)
└──────────────────────┘
```

### Red (Invalid) Header Example:
```
┌──────────────────────┐
│ Property Name        │ (Red background)
│ (Not Mapped)         │
│ [Select mapping...▼] │ (Dropdown)
└──────────────────────┘
```

## Guide Section
A helpful guide is displayed above the table:
- 🟢 **Green headers:** Automatically recognized and mapped
- 🔴 **Red headers:** Not recognized - select the correct mapping from dropdown

## Technical Benefits

1. **Flexibility:** Users can upload Excel files with any column names
2. **User-friendly:** Visual feedback makes it clear what needs attention
3. **Smart:** Prevents duplicate mappings
4. **Automatic:** Most common variations are recognized automatically
5. **Real-time:** Changes update the preview immediately

## Files Modified

- `/src/components/ui/upload-units-excel-dialog.jsx`
  - Added `manualHeaderMapping` state
  - Added mapping functions
  - Updated table header rendering
  - Added column mapping guide UI

## Related Files

- `/src/utils/excel-field-mapper.js` - Contains mapping logic and aliases
- `/src/constants/excel-template-example.js` - Template column definitions

## Future Enhancements

Possible improvements:
1. Save user's mapping preferences for future uploads
2. Add bulk mapping options for similar headers
3. AI-powered header matching suggestions
4. Export/import mapping configurations
5. Add tooltips showing all possible variations for each field

