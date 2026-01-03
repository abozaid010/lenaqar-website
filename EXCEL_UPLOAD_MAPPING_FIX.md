# Excel Upload Mapping Fix

## Issue Description

The Excel upload feature was sending incorrect values in the API payload:
- Optional fields like `roof_area`, `gardenSize`, and `garageArea` were being sent as `"0"` even when they were empty in the Excel file
- The `totalPrice` field was being sent as a formatted string (e.g., `"EGP 17,895,622"`) instead of a numeric value
- Missing field mappings for `city`, `unit_number`, `building_number`, and `roof_area`

## Example of Problematic Payload

**Before Fix:**
```json
{
  "project": "palm hills",
  "totalPrice": "EGP 17,895,622",  // Should be a number
  "roof_area": "0",                // Should not be sent if empty
  "gardenSize": "0",               // Should not be sent if empty
  "garageArea": "0"                // Should not be sent if empty
}
```

**After Fix:**
```json
{
  "project": "palm hills",
  "totalPrice": 17895622,          // Parsed as number
  "city": "cairo"                  // Optional fields only sent if present
  // roof_area, gardenSize, garageArea omitted if not present
}
```

## Changes Made

### 1. Fixed Numeric Value Parsing (`upload-units-excel-dialog.jsx`)

**Added `parseNumericValue` helper function:**
- Handles formatted strings like `"EGP 17,895,622"` by removing non-numeric characters
- Returns `null` for empty/invalid values instead of `0`
- Properly converts Excel numeric values to JavaScript numbers

**Updated transformation logic:**
- Changed from defaulting to `0` to only including fields with valid values
- Optional numeric fields (`bathroomCount`, `floor`, `gardenSize`, `garageArea`, `roof_area`) are now only added if they have values > 0
- Required numeric fields (`roomsCount`, `landArea`, `totalPrice`) still default to `0` if missing (to maintain required field validation)

### 2. Added Missing Field Mappings (`excel-field-mapper.js`)

Added column name aliases for:
- **city**: `["city", "location", "city name", "district", "area"]`
- **unit_number**: `["unit number", "unit no", "unit #", "no", "number"]`
- **building_number**: `["building number", "building no", "building #", "bldg no"]`
- **roof_area**: `["roof area", "roof", "roof size", "terrace area", "terrace"]`

### 3. Updated Template Configuration (`excel-template-example.js`)

Added new optional fields to the template:
- `city` - City/location field
- `unit_number` - Unit number identifier
- `building_number` - Building number identifier
- `roof_area` - Roof/terrace area

Added example data for these fields in the template preview.

## Technical Details

### Numeric Value Parsing Logic

```javascript
const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  // If it's already a number, return it
  if (typeof value === "number") {
    return value;
  }
  
  // If it's a string, remove non-numeric characters (except decimal point and minus sign)
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
};
```

### Optional Field Inclusion Logic

```javascript
// Only include if value > 0
const gardenSize = parseNumericValue(unit.gardenSize);
if (gardenSize !== null && gardenSize > 0) {
  transformed.gardenSize = gardenSize;
}

// For floor, allow 0 (ground floor is valid)
const floor = parseNumericValue(unit.floor);
if (floor !== null && floor >= 0) {
  transformed.floor = floor;
}
```

## Benefits

1. **Cleaner API Payloads**: Only sends data that actually exists in the Excel file
2. **Proper Data Types**: Numeric fields are sent as numbers, not formatted strings
3. **Better Validation**: The API can properly distinguish between "not provided" and "zero"
4. **Flexible Column Naming**: Users can use various column name variations (e.g., "Unit No", "Unit #", "Unit Number")
5. **More Complete Mapping**: Supports all fields that the API accepts

## Testing Recommendations

1. **Test with formatted prices**: Upload Excel with prices like "EGP 1,234,567" or "1.234.567"
2. **Test with empty optional fields**: Verify that empty fields are not sent as "0"
3. **Test with various column names**: Try "Unit No", "Unit Number", "Unit #" for `unit_number`
4. **Test floor = 0**: Verify that ground floor (0) is properly sent
5. **Test all new fields**: Verify `city`, `unit_number`, `building_number`, `roof_area` are properly mapped

## Files Modified

1. `/src/components/ui/upload-units-excel-dialog.jsx` - Fixed transformation logic
2. `/src/utils/excel-field-mapper.js` - Added field aliases
3. `/src/constants/excel-template-example.js` - Added template columns and examples

