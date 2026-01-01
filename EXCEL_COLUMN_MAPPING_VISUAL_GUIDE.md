# Excel Column Mapping - Visual Guide

## Feature Overview

This feature provides intelligent column header validation and mapping for Excel uploads. Users can see which headers are recognized (green) and manually map unrecognized headers (red) to the correct fields.

---

## Visual States

### 1. Valid/Recognized Header (Green State)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ title                         ┃  ← Original header from Excel
┃ → unitTitle                   ┃  ← Shows mapped canonical key
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    Background: bg-green-100 (Light Green)
    Text: text-green-800 (Dark Green)
```

### 2. Invalid/Unrecognized Header (Red State)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Property Name (Not Mapped)    ┃  ← Original header from Excel
┃ ┌─────────────────────────┐   ┃
┃ │ Select mapping...    ▼  │   ┃  ← Dropdown selector
┃ └─────────────────────────┘   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    Background: bg-red-100 (Light Red)
    Text: text-red-800 (Dark Red)
```

### 3. Dropdown Options
```
┌─────────────────────────────────┐
│ Select mapping...               │ ← Default option
│ Area (area)                     │
│ price (price)                   │
│ floor (floor)                   │
│ project (project)               │
│ title (unitTitle)               │
│ Bathrooms (bathroomCount)       │
│ Rooms (roomsCount)              │
│ Land Area (landArea)            │
│ Garden Size (gardenSize)        │
│ Finishing (finishing)           │
│ Furnishing (furnishing)         │
└─────────────────────────────────┘
```

### 4. Already Used Options (Disabled)
```
┌─────────────────────────────────┐
│ Select mapping...               │
│ Area (area) ✓                   │ ← Grayed out, already used
│ price (price)                   │ ← Available
│ floor (floor) ✓                 │ ← Grayed out, already used
└─────────────────────────────────┘
```

---

## Example: Complete Table View

```
┏━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━┓
┃      #      │    title          │    Property Name        │      floor      ┃
┃             │                   │    (Not Mapped)         │                 ┃
┃             │    → unitTitle    │  [Select mapping... ▼]  │                 ┃
┣━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━┫
┃  (Gray)     │   (Green BG)      │      (Red BG)           │   (Green BG)    ┃
┗━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━┛
```

---

## User Interaction Flow

### Step 1: Upload Excel File
- User selects an Excel file with custom headers
- System parses the file and displays preview

### Step 2: Automatic Recognition
- System checks each header against known variations
- Green background = Recognized ✓
- Red background = Not recognized ✗

### Step 3: Manual Mapping (for red headers)
1. User clicks dropdown on red header
2. Selects appropriate mapping from list
3. System updates mapping in real-time
4. Header background changes to green
5. Data re-parses with new mapping

### Step 4: Validation Before Upload
- System checks all required fields are mapped
- Shows warning if critical fields are missing
- User can proceed only when all required fields are present

---

## Info Guide (Displayed Above Table)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ℹ️  Column Mapping Guide                                  ┃
┃ ─────────────────────────────────────────────────────────┃
┃  🟩  Green headers: Automatically recognized and mapped  ┃
┃  🟥  Red headers: Not recognized - select correct        ┃
┃                    mapping from dropdown                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Smart Features

### 1. Prevent Duplicate Mappings
- Once a field is mapped, it's disabled in other dropdowns
- Marked with ✓ to show it's already used
- Current header can still select it (to change mapping)

### 2. Real-Time Updates
- Changes reflect immediately in the preview
- Data re-parses automatically
- No need to re-upload file

### 3. Persistent Validation Status
- Green/Red status persists while editing
- Clear visual feedback on what needs attention
- Shows mapping relationships clearly

---

## Example Scenarios

### Scenario 1: Standard Template Upload
```
Excel Headers: title, price, floor, area, bathrooms
Result:        All green ✓
Action:        None needed, proceed to upload
```

### Scenario 2: Custom Headers
```
Excel Headers: Property Name, Cost, Level, Size, Bath Count
Result:        All red ✗
Action:        
  - "Property Name" → Map to "title (unitTitle)"
  - "Cost" → Map to "price (totalPrice)"
  - "Level" → Map to "floor (floor)"
  - "Size" → Map to "Land Area (landArea)"
  - "Bath Count" → Map to "Bathrooms (bathroomCount)"
Result:        All green ✓, proceed to upload
```

### Scenario 3: Mixed Headers
```
Excel Headers: title, Cost, floor, Property Size, bathrooms
Result:        
  - "title" → Green ✓ (auto-mapped)
  - "Cost" → Red ✗ (needs mapping)
  - "floor" → Green ✓ (auto-mapped)
  - "Property Size" → Red ✗ (needs mapping)
  - "bathrooms" → Green ✓ (auto-mapped)
Action:        
  - "Cost" → Map to "price (totalPrice)"
  - "Property Size" → Map to "Land Area (landArea)"
Result:        All green ✓, proceed to upload
```

---

## Technical Implementation

### Key Components
1. **State Management:** `manualHeaderMapping` tracks user selections
2. **Validation Function:** `getHeaderValidationStatus()` checks each header
3. **Mapping Function:** `handleHeaderMappingChange()` updates mappings
4. **Re-parsing:** Automatically triggers when mapping changes

### Color Coding
- **Green (bg-green-100):** Valid, mapped headers
- **Red (bg-red-100):** Invalid, unmapped headers
- **Gray (text-gray-400):** Disabled dropdown options

### Dropdown Intelligence
- Shows available template columns
- Disables already-used mappings
- Updates other dropdowns when selection changes

---

## Benefits

1. **Flexibility:** Accept any Excel column names
2. **User-Friendly:** Clear visual feedback
3. **Error Prevention:** Can't create duplicate mappings
4. **Time-Saving:** Automatic recognition for common names
5. **Intuitive:** Familiar dropdown interface
6. **Real-Time:** Immediate feedback on changes

---

## Supported Template Columns

| Label          | Key             | Common Variations            |
|----------------|-----------------|------------------------------|
| Area           | area            | area, land area, size        |
| price          | price           | price, total price, cost     |
| floor          | floor           | floor, level                 |
| project        | project         | project, project name        |
| title          | unitTitle       | title, unit title, name      |
| Bathrooms      | bathroomCount   | bathrooms, bath count        |
| Rooms          | roomsCount      | rooms, bedrooms, room count  |
| Land Area      | landArea        | land area, bua, plot area    |
| Garden Size    | gardenSize      | garden, garden size          |
| Finishing      | finishing       | finishing, finish            |
| Furnishing     | furnishing      | furnishing, furnished        |

See `excel-field-mapper.js` for complete list of recognized variations.

