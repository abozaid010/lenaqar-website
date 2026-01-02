# Excel Column Mapping - Visual Guide

## Feature Overview

This feature provides intelligent column mapping for Excel uploads. The system displays **template columns** (expected data structure) and allows users to map them to **Excel sheet headers** (from the first row of the uploaded file).

---

## Core Concept

### What You See: Template Columns
The preview table always displays the system's expected template columns (16 total):
- Building Type
- Project
- View
- Unit Title
- Bathroom Count
- Floor
- Rooms Count
- Land Area
- Garden Area
- Finishing
- Furnishing
- Garage Area
- Model
- Down Payment
- Total Price
- Delivery Date

### What You Upload: Excel Headers
Your Excel file's first row can have any headers in any order:
- Example: `["price", "named unit", "floor", "project", "buildingType", "bathroomCount", "gardenSize"]`

### The Mapping Process
The system maps your Excel headers to the template columns automatically when possible, or lets you map them manually.

---

## Visual States

### 1. Resolved Column (Green State)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Building Type ✓               ┃  ← Template column name
┃ ← buildingType                ┃  ← Excel header it's mapped from
┃ ┌─────────────────────────┐   ┃
┃ │ buildingType         ▼  │   ┃  ← Dropdown (editable)
┃ └─────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    Background: bg-green-100 (Light Green)
    Text: text-green-800 (Dark Green)
    Border: border-green-400
```

**Meaning:** This template column successfully found a matching Excel header (automatically or manually). User can still change it via dropdown.

### 2. Unresolved Column (Red State)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ View (Not Mapped)             ┃  ← Template column name
┃ ┌─────────────────────────┐   ┃
┃ │ Select mapping...    ▼  │   ┃  ← Dropdown with Excel headers
┃ └─────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    Background: bg-red-100 (Light Red)
    Text: text-red-800 (Dark Red)
    Border: border-red-400
```

**Meaning:** This template column has no matching Excel header. User needs to select one from the dropdown.

### 3. Dropdown Options (Excel Headers from Your File)
```
┌─────────────────────────────────┐
│ Select mapping...               │ ← Default option
│ price                           │ ← Available Excel header
│ named unit                      │ ← Available Excel header
│ floor ✓                         │ ← Already used (disabled)
│ project ✓                       │ ← Already used (disabled)
│ buildingType ✓                  │ ← Already used (disabled)
│ bathroomCount ✓                 │ ← Already used (disabled)
│ gardenSize ✓                    │ ← Already used (disabled)
└─────────────────────────────────┘
```

**Note:** The dropdown shows actual headers from your Excel file's first row, not template names!

---

## Complete Example

### Your Excel File Structure:
```
┏━━━━━━━━━━━┯━━━━━━━━━━━━━━┯━━━━━━━┯━━━━━━━━━━━━┯━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━┯━━━━━━━━━━━━┓
┃   price   │  named unit  │ floor │  project   │ buildingType │ bathroomCount │ gardenSize ┃
┣━━━━━━━━━━━┿━━━━━━━━━━━━━━┿━━━━━━━┿━━━━━━━━━━━━┿━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━┿━━━━━━━━━━━━┫
┃    221    │  two bedroom │   2   │ palm hills │  apartment   │       2       │     10     ┃
┃    300    │ three bedroom│   3   │   madinty  │    villa     │       3       │     50     ┃
┗━━━━━━━━━━━┷━━━━━━━━━━━━━━┷━━━━━━━┷━━━━━━━━━━━━┷━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━┷━━━━━━━━━━━━┛
```

### Preview Table Display (Template Columns):

```
┏━━━┯━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━┯━━━━━━━┯━━━━━━━━━━━━━┯━━━━━━━━━━━━┓
┃ # │  Building Type  │   Project   │      View      │  Unit Title    │ Bathroom Count │ Floor │ Rooms Count │ Garden Area┃
┣━━━┿━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━━━┫
┃   │   ✓ (Green)     │ ✓ (Green)   │   ✗ (Red)      │   ✗ (Red)      │   ✓ (Green)    │ ✓(Grn)│   ✗ (Red)   │  ✓ (Green) ┃
┃   │ ← buildingType  │ ← project   │  Dropdown:     │  Dropdown:     │ ← bathroomCount│← floor│  Dropdown:  │← gardenSize┃
┃   │  [buildingType▼]│  [project▼] │  [Select...]   │  [Select...]   │  [bathrooms▼]  │[floor▼]│[Select...] │[gardenSize▼]┃
┣━━━┿━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━━━┫
┃ 1 │   apartment     │ palm hills  │       -        │       -        │       2        │   2   │      -      │     10     ┃
┃ 2 │     villa       │   madinty   │       -        │       -        │       3        │   3   │      -      │     50     ┃
┗━━━┷━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━┷━━━━━━━┷━━━━━━━━━━━━━┷━━━━━━━━━━━━┛
```

**Key Points:**
- All columns have dropdowns (both green and red) ✓
- Green columns show current mapping above dropdown
- Green columns have dropdown pre-selected with current value
- Red columns have dropdown with "Select mapping..." placeholder
- Data values come from your Excel based on the mapping
- "-" shows for unmapped columns

---

## User Interaction Flow

### Step 1: Upload Excel File
User selects an Excel file with custom headers in first row.

### Step 2: System Analyzes Headers
- **First row:** `["price", "named unit", "floor", "project", "buildingType", "bathroomCount", "gardenSize"]`
- System attempts automatic mapping using aliases
- Results:
  - ✓ `buildingType` → Template: Building Type (exact match)
  - ✓ `project` → Template: Project (exact match)
  - ✓ `bathroomCount` → Template: Bathroom Count (exact match)
  - ✓ `floor` → Template: Floor (exact match)
  - ✓ `gardenSize` → Template: Garden Area (recognized alias)
  - ✗ `price` → Not auto-mapped (could be Total Price or Down Payment)
  - ✗ `named unit` → Not auto-mapped (could be Unit Title)

### Step 3: Display Template Columns
System shows ALL 16 template columns:
- 5 columns: Green (auto-mapped)
- 11 columns: Red (not mapped)

### Step 4: Manual Mapping
User sees red "Unit Title" column with dropdown showing:
```
Select mapping...
price
named unit          ← User selects this
floor ✓
project ✓
buildingType ✓
bathroomCount ✓
gardenSize ✓
```

User selects "named unit" for "Unit Title"

### Step 5: Real-Time Update
- "Unit Title" column turns green
- Shows: "Unit Title ✓ ← named unit"
- Dropdown now shows "named unit" as selected value
- Data appears in the preview table
- Other dropdowns update (remove "named unit" as option)

### Step 6: User Can Change Auto-Mapped Columns
Even green columns have dropdowns! If user wants to change:
- Click dropdown on green "Building Type" column
- Currently shows: "buildingType" selected
- User can select different Excel header if needed
- System re-parses with new mapping

### Step 6: Complete Mapping or Upload
- All columns (green and red) have editable dropdowns
- Map remaining columns as needed
- Change auto-mapped columns if incorrect
- Or proceed with partial mapping (optional fields can remain empty)
- Click Upload button

---

## Dropdown Behavior

### What Appears in Dropdown?
**ONLY** the Excel headers from your file's first row:
- If your Excel has: `["A", "B", "C"]`
- Dropdown shows: `["A", "B", "C"]`
- NOT template column names!

### Disabled Options
Excel headers already mapped to other template columns are disabled:
```
price                    ← Available (enabled)
named unit               ← Available (enabled)
buildingType ✓           ← Used by "Building Type" (disabled)
project ✓                ← Used by "Project" (disabled)
```

### Smart Updates
When you change a mapping:
1. Old Excel header becomes available again
2. New Excel header becomes disabled for others
3. Data re-parses immediately
4. Preview table updates

---

## Example Scenarios

### Scenario 1: Perfect Match
```
Excel Headers: [buildingType, project, view, unitTitle, bathroomCount, floor, ...]
Result:        All columns green ✓ (auto-mapped)
Action:        None needed, click Upload
```

### Scenario 2: Custom Headers
```
Excel Headers: [Type, Proj, Outlook, Name, Baths, Level, ...]
Result:        All columns red ✗ (not recognized)
Action:        Manual mapping required:
  - Building Type → "Type"
  - Project → "Proj"
  - View → "Outlook"
  - Unit Title → "Name"
  - Bathroom Count → "Baths"
  - Floor → "Level"
  etc.
```

### Scenario 3: Mixed Headers
```
Excel Headers: [buildingType, Cost, project, Apartment Name, floor, ...]
Result:        
  - Building Type → Green ✓ (auto: buildingType)
  - Project → Green ✓ (auto: project)
  - Floor → Green ✓ (auto: floor)
  - Total Price → Red ✗ (not mapped, could be "Cost")
  - Unit Title → Red ✗ (not mapped, could be "Apartment Name")
  - Others → Red ✗

Action:
  - Total Price dropdown → select "Cost"
  - Unit Title dropdown → select "Apartment Name"
```

### Scenario 4: Missing Data
```
Excel Headers: [price, floor, project]
Result:
  - Floor → Green ✓
  - Project → Green ✓
  - Total Price → Red ✗ (can map to "price")
  - All other columns → Red ✗ (no Excel headers available)
  
Action:
  - Map what you can
  - Leave others unmapped (will show "-" in preview)
  - System warns about missing required fields before upload
```

---

## Info Guide (Above Table)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ℹ️  Column Mapping Guide                                  ┃
┃ ─────────────────────────────────────────────────────────┃
┃  🟩  Green columns: Mapped to Excel sheet column         ┃
┃                     (resolved) - Dropdown enabled to      ┃
┃                     change mapping if needed              ┃
┃  🟥  Red columns: Not mapped - select Excel column       ┃
┃                   from dropdown                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Status Summary (Below Preview Title)

```
Preview (24 units)                          Worksheet: Sheet1

✓ Resolved: 8 columns
✗ Not resolved: 8 columns - please select from dropdown
```

---

## Technical Implementation Summary

### Key Components
1. **Template Columns Array:** Defines what system expects (`excelTemplateColumns`)
2. **Excel Headers Array:** First row from uploaded file
3. **Mapping State:** `manualHeaderMapping = { templateKey: excelHeader }`
4. **Auto Mapper:** `createHeaderMapping()` from `excel-field-mapper.js`
5. **Status Checker:** `getTemplateColumnStatus()` determines green/red state

### Data Flow
1. Read Excel → Extract first row as headers
2. Auto-map Excel headers to template keys
3. Display template columns with green/red states
4. User manually maps red columns via dropdown
5. Re-parse data using combined mapping
6. Display values in template column order

---

## Benefits

1. **Predictable:** Always see the same column structure
2. **Flexible:** Works with any Excel format, can override any mapping
3. **Visual:** Clear red/green feedback
4. **Intuitive:** Dropdown shows YOUR actual headers
5. **Smart:** Prevents duplicate mappings
6. **Fast:** Real-time updates
7. **Forgiving:** Optional fields can remain unmapped
8. **Editable:** All columns have dropdowns - change any mapping anytime

---

## Common Questions

**Q: Why don't I see my Excel headers as column names?**  
A: The table shows template columns (what the system expects). Your Excel headers appear in the dropdowns and as mappings (e.g., "← price").

**Q: What if my Excel header doesn't match any template?**  
A: Just select it from the dropdown! Example: Excel header "Cost" can map to template "Total Price".

**Q: Can I map one Excel header to multiple template columns?**  
A: No, each Excel header can only be used once. The system disables already-used headers.

**Q: What happens to unmapped columns?**  
A: They show "-" in the preview. Required fields must be mapped before upload; optional fields can remain empty.

**Q: Do I need to rename my Excel headers?**  
A: No! The mapping feature handles any header names. Just select the correct mapping from the dropdown.

---

## Supported Template Columns (16 Total)

| Template Column  | Required | Common Excel Header Variations    |
|------------------|----------|-----------------------------------|
| Building Type    | Yes      | buildingType, type, property type |
| Project          | Yes      | project, project name             |
| View             | Yes      | view, outlook, facing             |
| Unit Title       | Yes      | unitTitle, title, name            |
| Bathroom Count   | Yes      | bathroomCount, bathrooms, baths   |
| Floor            | Yes      | floor, level                      |
| Rooms Count      | Yes      | roomsCount, rooms, bedrooms       |
| Land Area        | Yes      | landArea, area, size, bua         |
| Garden Area      | Yes      | gardenSize, garden area, garden   |
| Finishing        | Yes      | finishing, finish                 |
| Furnishing       | No       | furnishing, furnished             |
| Garage Area      | No       | garageArea, garage, parking       |
| Model            | No       | model, unit model                 |
| Down Payment     | No       | downPayment, deposit              |
| Total Price      | Yes      | totalPrice, price, cost           |
| Delivery Date    | Yes      | deliveryDate, delivery, date      |

See `/src/utils/excel-field-mapper.js` for complete alias list.

---

## Tips for Success

1. **Use descriptive Excel headers** that match common terms
2. **Put headers in first row** (required)
3. **Check green columns** to verify auto-mapping is correct
4. **Map red columns** before uploading
5. **Review preview data** to ensure mapping is correct
6. **Required fields** must be mapped (system will warn you)
