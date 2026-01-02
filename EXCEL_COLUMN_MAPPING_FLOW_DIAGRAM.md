# Excel Column Mapping - Flow Diagram

## Data Flow: From Excel Upload to Preview Display

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           1. USER UPLOADS EXCEL FILE                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                      2. EXTRACT EXCEL HEADERS (Row 1)                     ┃
┃                                                                            ┃
┃   Excel File:                                                              ┃
┃   ┌────────┬────────────┬───────┬─────────┬──────────────┬───────────┐   ┃
┃   │ price  │ named unit │ floor │ project │ buildingType │ bathrooms │   ┃
┃   ├────────┼────────────┼───────┼─────────┼──────────────┼───────────┤   ┃
┃   │  221   │ two bedroom│   2   │  madinty│  apartment   │     2     │   ┃
┃   └────────┴────────────┴───────┴─────────┴──────────────┴───────────┘   ┃
┃                                                                            ┃
┃   excelHeaders = ["price", "named unit", "floor", "project",              ┃
┃                   "buildingType", "bathrooms"]                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    3. AUTO-MAPPING (via field-mapper.js)                  ┃
┃                                                                            ┃
┃   Input: excelHeaders                                                      ┃
┃   Process: Check each header against FIELD_ALIASES                         ┃
┃                                                                            ┃
┃   autoHeaderMapping = {                                                    ┃
┃     "price"        → "totalPrice"      ✓ (alias found)                    ┃
┃     "named unit"   → NOT FOUND         ✗                                   ┃
┃     "floor"        → "floor"           ✓ (exact match)                    ┃
┃     "project"      → "project"         ✓ (exact match)                    ┃
┃     "buildingType" → "buildingType"    ✓ (exact match)                    ┃
┃     "bathrooms"    → "bathroomCount"   ✓ (alias found)                    ┃
┃   }                                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    4. REVERSE MAPPING (Template → Excel)                  ┃
┃                                                                            ┃
┃   Input: autoHeaderMapping (Excel → Template)                              ┃
┃   Process: Invert to (Template → Excel)                                    ┃
┃                                                                            ┃
┃   autoTemplateToExcel = {                                                  ┃
┃     "totalPrice"      ← "price"                                            ┃
┃     "floor"           ← "floor"                                            ┃
┃     "project"         ← "project"                                          ┃
┃     "buildingType"    ← "buildingType"                                     ┃
┃     "bathroomCount"   ← "bathrooms"                                        ┃
┃   }                                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  5. MERGE WITH MANUAL MAPPING (if exists)                 ┃
┃                                                                            ┃
┃   manualHeaderMapping = {}  (initially empty)                              ┃
┃                                                                            ┃
┃   finalMapping = { ...autoTemplateToExcel, ...manualHeaderMapping }       ┃
┃                                                                            ┃
┃   Result:                                                                   ┃
┃   {                                                                         ┃
┃     "totalPrice"      ← "price"                                            ┃
┃     "floor"           ← "floor"                                            ┃
┃     "project"         ← "project"                                          ┃
┃     "buildingType"    ← "buildingType"                                     ┃
┃     "bathroomCount"   ← "bathrooms"                                        ┃
┃   }                                                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     6. DISPLAY TEMPLATE COLUMNS IN TABLE                  ┃
┃                                                                            ┃
┃   All 16 Template Columns (from excelTemplateColumns):                    ┃
┃   ┌─────────────────┬─────────┬──────┬────────────┬─────────────┬────┐   ┃
┃   │ Building Type   │ Project │ View │ Unit Title │Bathroom Count│... │   ┃
┃   │  ✓ Green        │✓ Green  │✗ Red │   ✗ Red    │   ✓ Green   │... │   ┃
┃   │← buildingType   │← project│[▼]   │    [▼]     │← bathrooms  │... │   ┃
┃   ├─────────────────┼─────────┼──────┼────────────┼─────────────┼────┤   ┃
┃   │   apartment     │ madinty │  -   │     -      │      2      │... │   ┃
┃   └─────────────────┴─────────┴──────┴────────────┴─────────────┴────┘   ┃
┃                                                                            ┃
┃   Green Columns: Auto-mapped (5 columns)                                   ┃
┃   Red Columns: Not mapped - need manual selection (11 columns)            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    7. USER SELECTS FROM DROPDOWN (Manual)                 ┃
┃                                                                            ┃
┃   Unit Title Column (Red):                                                 ┃
┃   ┌──────────────────────────────────┐                                     ┃
┃   │ Select mapping...                │                                     ┃
┃   │ price ✓                          │ (already used - disabled)           ┃
┃   │ named unit                       │ ← USER SELECTS THIS                 ┃
┃   │ floor ✓                          │ (already used - disabled)           ┃
┃   │ project ✓                        │ (already used - disabled)           ┃
┃   │ buildingType ✓                   │ (already used - disabled)           ┃
┃   │ bathrooms ✓                      │ (already used - disabled)           ┃
┃   └──────────────────────────────────┘                                     ┃
┃                                                                            ┃
┃   Updates: manualHeaderMapping = { "unitTitle": "named unit" }            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                       8. RE-PARSE & UPDATE DISPLAY                        ┃
┃                                                                            ┃
┃   Trigger: parseExcelFile() called again                                   ┃
┃   New Mapping:                                                              ┃
┃   {                                                                         ┃
┃     "totalPrice"      ← "price"                                            ┃
┃     "floor"           ← "floor"                                            ┃
┃     "project"         ← "project"                                          ┃
┃     "buildingType"    ← "buildingType"                                     ┃
┃     "bathroomCount"   ← "bathrooms"                                        ┃
┃     "unitTitle"       ← "named unit"      ← NEW!                           ┃
┃   }                                                                         ┃
┃                                                                            ┃
┃   Unit Title Column: Now Green ✓                                           ┃
┃   ┌────────────┐                                                           ┃
┃   │ Unit Title │                                                           ┃
┃   │← named unit│                                                           ┃
┃   ├────────────┤                                                           ┃
┃   │two bedroom │                                                           ┃
┃   └────────────┘                                                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                       │
                                       ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                          9. FINAL PREVIEW STATE                           ┃
┃                                                                            ┃
┃   Status Summary:                                                           ┃
┃   ✓ Resolved: 6 columns                                                    ┃
┃   ✗ Not resolved: 10 columns                                               ┃
┃                                                                            ┃
┃   Table Preview:                                                            ┃
┃   ┌─────────────────┬─────────┬──────┬────────────┬─────────────┬────┐   ┃
┃   │ Building Type   │ Project │ View │ Unit Title │Bathroom Count│... │   ┃
┃   │  ✓ Green        │✓ Green  │✗ Red │  ✓ Green   │   ✓ Green   │... │   ┃
┃   │← buildingType   │← project│[▼]   │← named unit│← bathrooms  │... │   ┃
┃   ├─────────────────┼─────────┼──────┼────────────┼─────────────┼────┤   ┃
┃   │   apartment     │ madinty │  -   │two bedroom │      2      │... │   ┃
┃   └─────────────────┴─────────┴──────┴────────────┴─────────────┴────┘   ┃
┃                                                                            ┃
┃   User can continue mapping or upload with current state                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Key State Variables

### `excelHeaders` (Array)
```javascript
["price", "named unit", "floor", "project", "buildingType", "bathrooms"]
```
- First row from uploaded Excel file
- Used to populate dropdowns
- Source of actual data

### `excelTemplateColumns` (Array of Objects)
```javascript
[
  { key: "buildingType", label: "Building Type" },
  { key: "project", label: "Project" },
  { key: "view", label: "View" },
  // ... 13 more
]
```
- System's expected data structure
- Always displayed in table headers
- Defines what data is needed

### `manualHeaderMapping` (Object)
```javascript
{
  "unitTitle": "named unit",
  "view": "outlook"
}
```
- User's manual selections
- Format: `templateKey → excelHeader`
- Overrides auto-mapping

### `parsedData` (Object)
```javascript
{
  excelHeaders: [...],           // Excel file's first row
  templateToExcelMapping: {...}, // Combined auto + manual mapping
  rows: [...],                    // Data rows from Excel
  units: [...],                   // Transformed unit objects
  summary: { totalUnits, worksheetName }
}
```

---

## Component Functions

### `parseExcelFile(file)`
**Purpose:** Parse Excel and create mappings  
**Flow:**
1. Read Excel file → Get rows
2. Extract first row as `excelHeaders`
3. Call `createHeaderMapping(excelHeaders)` → Get auto mapping
4. Reverse to `templateKey → excelHeader`
5. Merge with `manualHeaderMapping`
6. Transform data rows using mapping
7. Store in `parsedData`

### `getTemplateColumnStatus(templateKey)`
**Purpose:** Check if template column is mapped  
**Returns:**
```javascript
{
  isResolved: boolean,    // Is this column mapped?
  excelHeader: string,    // Which Excel header is it mapped to?
  isManual: boolean       // Was it manually mapped?
}
```

### `getUsedExcelHeaders()`
**Purpose:** Get Excel headers already in use  
**Returns:** `Set<string>` of used Excel headers  
**Use:** Disable used headers in other dropdowns

### `handleHeaderMappingChange(templateKey, excelHeader)`
**Purpose:** Update manual mapping when user selects from dropdown  
**Flow:**
1. Update `manualHeaderMapping` state
2. Call `parseExcelFile()` to re-parse with new mapping
3. UI updates automatically

---

## Color Coding Logic

### Green Background (Resolved)
```javascript
const status = getTemplateColumnStatus(templateKey);
if (status.isResolved) {
  return "bg-green-100 text-green-800";
}
```
**Conditions:**
- Auto-mapped OR manually mapped
- Has valid Excel header

### Red Background (Unresolved)
```javascript
if (!status.isResolved) {
  return "bg-red-100 text-red-800";
}
```
**Conditions:**
- NOT auto-mapped AND NOT manually mapped
- No Excel header assigned

---

## Data Rendering Logic

### Table Header
```javascript
excelTemplateColumns.map(templateCol => {
  const status = getTemplateColumnStatus(templateCol.key);
  
  return (
    <th className={status.isResolved ? "green" : "red"}>
      {status.isResolved ? (
        // Show: "Template Label ← excelHeader"
        <>
          <span>{templateCol.label}</span>
          <span>← {status.excelHeader}</span>
        </>
      ) : (
        // Show: "Template Label (Not Mapped)" + dropdown
        <>
          <span>{templateCol.label} (Not Mapped)</span>
          <select>{excelHeaders.map(...)}</select>
        </>
      )}
    </th>
  );
})
```

### Table Body
```javascript
excelTemplateColumns.map(templateCol => {
  // Get Excel header for this template column
  const status = getTemplateColumnStatus(templateCol.key);
  const excelHeader = status.excelHeader;
  
  // Find index of that Excel header
  const colIndex = excelHeaders.indexOf(excelHeader);
  
  // Get value from row at that index
  const value = colIndex >= 0 ? row[colIndex] : null;
  
  return <td>{value || "-"}</td>;
})
```

---

## Summary

**Input:** Excel file with any headers  
**Process:** Map Excel headers to template columns  
**Output:** Consistent table display with template columns  
**Result:** User-friendly, flexible, powerful!

