# Excel Column Mapping Feature

## Overview
This document describes the Excel column header validation and mapping feature implemented in the Upload Units Excel Dialog component. The system displays **template columns** and allows users to map them to **Excel sheet columns** (from the first row of the uploaded file).

## Feature Description
The feature displays all required template columns and automatically maps them to Excel headers when possible. For unmapped columns, users can manually select the corresponding Excel header from a dropdown list populated with the first row of their Excel sheet.

## Key Concepts

### Template Columns
- These are the **expected columns** defined in `excelTemplateColumns`
- They represent the data structure the system requires
- Examples: `buildingType`, `project`, `unitTitle`, `bathroomCount`, etc.
- Always displayed in the preview table (16 columns total)

### Excel Headers
- The **first row** of the uploaded Excel file
- Can be in any order with any naming convention
- Example: `["price", "named unit", "floor", "project", "buildingType", "bathroomCount", "gardenSize"]`

## Key Features

### 1. **Template-Based Display**
- The preview table always shows the **template columns** (from `excelTemplateColumns`)
- Users see exactly what data fields the system expects
- Columns are displayed in a consistent order regardless of Excel file structure

### 2. **Automatic Column Recognition**
- The system automatically recognizes common variations of column names
- Uses the `FIELD_ALIASES` mapping from `excel-field-mapper.js`
- Examples:
  - Excel header "price" → Template key `totalPrice` ✓
  - Excel header "bathrooms" → Template key `bathroomCount` ✓
  - Excel header "title" → Template key `unitTitle` ✓

### 3. **Visual Validation States**

#### Resolved Columns (Green Background)
- Template columns that are successfully mapped to Excel headers
- Display with green background (`bg-green-100`)
- Show the template label and the Excel header it's mapped from
- **Always include a dropdown** to allow users to change the mapping
- Dropdown pre-selected with current Excel header
- Example: 
  ```
  Building Type ✓ (Green)
  ← buildingType
  [buildingType ▼]  (dropdown - can change)
  ```

#### Unresolved Columns (Red Background)
- Template columns that are NOT mapped to any Excel header
- Display with red background (`bg-red-100`)
- Show a dropdown selector to manually map to an Excel header
- Example:
  ```
  View (Red)
  (Not Mapped)
  [Select mapping... ▼]
  ```

### 4. **Manual Mapping**
- **All columns have dropdowns** (both green and red)
- Green columns: Dropdown pre-selected with current mapping
- Red columns: Dropdown shows "Select mapping..." placeholder
- Users can select or change mapping from dropdown
- Dropdown shows all Excel headers from the first row of the sheet
- Already-used Excel headers are disabled to prevent duplicate assignments
- When a mapping is selected or changed, the system automatically re-parses the Excel file

### 5. **Smart Dropdown Features**
- **Present on all columns** for maximum flexibility
- Shows all Excel headers from the uploaded file
- Disables options that are already mapped by other columns (marked with ✓)
- Current selection is never disabled (can always change to different header)
- Updates in real-time when selections change
- Format: `{excelHeader}` - e.g., "named unit", "price", "floor"
- Green columns: Show current mapping and allow changes
- Red columns: Show placeholder "Select mapping..."

## Implementation Details

### State Management
```javascript
const [manualHeaderMapping, setManualHeaderMapping] = useState({});
```
- Stores user's manual template-to-excel mappings
- Format: `{ "templateKey": "excelHeader" }`
- Example: `{ "view": "outlook", "unitTitle": "named unit" }`

### Key Functions

#### `getTemplateColumnStatus(templateKey)`
Returns status information for a template column:
- `isResolved`: Boolean indicating if the column is mapped to an Excel header
- `excelHeader`: The Excel header it's mapped to
- `isManual`: Boolean indicating if manually mapped

#### `handleHeaderMappingChange(templateKey, excelHeader)`
- Updates the manual mapping state
- Triggers re-parsing of the Excel file with new mappings
- Merges automatic and manual mappings

#### `getUsedExcelHeaders()`
- Returns a Set of all currently used Excel headers
- Prevents duplicate mappings in dropdowns

### Parsing Logic
The `parseExcelFile` function:
1. Reads first row as Excel headers
2. Creates automatic mapping using `createHeaderMapping(excelHeaders)`
3. Creates reverse mapping: `templateKey → excelHeader`
4. Merges with manual mappings: `{ ...autoMapping, ...manualHeaderMapping }`
5. For each data row, maps values from Excel columns to template columns
6. Transforms to unit objects with template keys

## User Experience Flow

1. **User uploads Excel file**
2. **System extracts first row as headers:**
   - Example: `["price", "named unit", "floor", "project", "buildingType"]`
3. **System displays template columns:**
   - Shows all 16 expected columns from `excelTemplateColumns`
4. **System analyzes mapping:**
   - Automatically mapped columns → Green background
   - Unmapped columns → Red background with dropdown
5. **User maps unresolved columns:**
   - Dropdown shows: `["price", "named unit", "floor", "project", "buildingType"]`
   - User selects appropriate Excel header for each unmapped template column
   - System automatically re-parses with new mapping
6. **Visual feedback:**
   - Green columns show: `Template Label ← excelHeader`
   - Red columns show: `Template Label (Not Mapped)` with dropdown
7. **Preview table displays data:**
   - Columns are template columns
   - Values are fetched from Excel using the mapping
   - Empty cells show "-" for unmapped columns
8. **Validation before upload:**
   - System checks for missing required fields
   - User must map all critical columns before uploading

## Example Scenario

### Excel File Structure:
```
Row 1 (Headers): [price, named unit, floor, project, buildingType, bathroomCount, gardenSize]
Row 2 (Data):    [221, two bedroom, 2, palm hills, apartment, 2, 10]
Row 3 (Data):    [300, three bedroom, 3, madinty, villa, 3, 50]
```

### Preview Table Display:

| # | Building Type | Project | View | Unit Title | Bathroom Count | Floor | Rooms Count | Land Area | Garden Area | ... |
|---|---------------|---------|------|------------|----------------|-------|-------------|-----------|-------------|-----|
| Header | ✓ (Green)<br>← buildingType | ✓ (Green)<br>← project | ✗ (Red)<br>Dropdown | ✗ (Red)<br>Dropdown | ✓ (Green)<br>← bathroomCount | ✓ (Green)<br>← floor | ✗ (Red)<br>Dropdown | ✗ (Red)<br>Dropdown | ✓ (Green)<br>← gardenSize | ... |
| 1 | apartment | palm hills | - | - | 2 | 2 | - | - | 10 | ... |
| 2 | villa | madinty | - | - | 3 | 3 | - | - | 50 | ... |

### Dropdowns Show:
- Available options: `[price, named unit, floor, project, buildingType, bathroomCount, gardenSize]`
- Already used options are disabled: `[buildingType ✓, project ✓, bathroomCount ✓, floor ✓, gardenSize ✓]`
- Available for selection: `[price, named unit]`

### After Manual Mapping:
User selects:
- View → (no matching column in Excel, remains empty)
- Unit Title → "named unit"
- Rooms Count → (no matching column in Excel, remains empty)
- Land Area → (no matching column in Excel, remains empty)

Result:
```javascript
manualHeaderMapping = {
  "unitTitle": "named unit"
}
```

## Visual Design

### Green (Resolved) Column Example:
```
┌──────────────────────┐
│ Building Type ✓      │ (Green background)
│ ← buildingType       │ (Small green text)
│ [buildingType    ▼]  │ (Dropdown - editable)
└──────────────────────┘
```

### Red (Unresolved) Column Example:
```
┌──────────────────────┐
│ View (Not Mapped)    │ (Red background)
│ [Select mapping...▼] │ (Dropdown with Excel headers)
└──────────────────────┘
```

## Guide Section
A helpful guide is displayed above the table:
- 🟢 **Green columns:** Mapped to Excel sheet column (resolved) - Dropdown enabled to change mapping if needed
- 🔴 **Red columns:** Not mapped - select Excel column from dropdown

## Technical Benefits

1. **User-Centric:** Users see exactly what fields the system expects
2. **Flexible:** Works with any Excel column names and order, all mappings editable
3. **Visual:** Clear feedback on what's mapped and what needs attention
4. **Smart:** Prevents duplicate mappings
5. **Automatic:** Most common variations are recognized automatically
6. **Real-time:** Changes update the preview immediately
7. **Consistent:** Always shows data in the same structure regardless of Excel format
8. **Editable:** All columns have dropdowns - override any auto-mapping if needed

## Files Modified

- `/src/constants/excel-template-example.js`
  - Cleaned up duplicate entries
  - Defined complete template columns (16 columns)
  
- `/src/components/ui/upload-units-excel-dialog.jsx`
  - Changed `manualHeaderMapping` to store `templateKey → excelHeader`
  - Updated `parseExcelFile` to work with template-based approach
  - Updated table rendering to show template columns
  - Added dropdown with Excel headers for unmapped columns
  - Updated status checking functions

## Related Files

- `/src/utils/excel-field-mapper.js` - Contains automatic mapping logic and aliases
- `/src/constants/excel-template-example.js` - Template column definitions

## Future Enhancements

Possible improvements:
1. Save user's mapping preferences for future uploads
2. Add bulk mapping suggestions based on similarity scores
3. AI-powered header matching suggestions
4. Export/import mapping configurations
5. Add tooltips showing all possible variations for each field
6. Support for multiple Excel sheet tabs
7. Column validation rules (e.g., numeric only, date format)
