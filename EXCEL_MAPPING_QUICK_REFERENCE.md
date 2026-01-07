# Excel Header Mapping - Quick Reference

## What Changed

Fixed the Excel column header mapping to correctly identify columns from your uploaded spreadsheets, especially for:
- ✅ **Total Area** (Gross Area) - Now correctly identified and values properly extracted
- ✅ **Total Price** - No longer confused with other price fields
- ✅ **Finishing** - Correctly mapped to finishing type
- ✅ **Delivery Date** - No longer confused with unit type or other fields

## How the New Mapping Works

### 1. Perfect Matches (Best)
If a header **exactly** matches an alias, it returns immediately:
```
Header: "Delivery Date" → deliveryDate ✅
Header: "Total Price" → totalPrice ✅
```

### 2. Specific Matches (Good)
Longer, more descriptive aliases are preferred over short ones:
```
Header: "Unit Total with Finishing Price" 
  Candidates: "total price" (11 chars), "price" (5 chars - REMOVED)
  Winner: "total price" → totalPrice ✅
```

### 3. Removed Generic Aliases (Improves Accuracy)
Eliminated overly broad words that match multiple fields:

| Removed | Why | Impact |
|---------|-----|--------|
| "type" | Too generic | Prevented false matches |
| "date" | Too generic | Prevented wrong column selection |
| "area" | Too generic | Conflicted with "land area", "garden area" |
| "size" | Too generic | Conflicted with multiple area fields |
| "price" | Too generic | Conflicted with payment terms |
| "number", "no" | Too generic | Too many false matches |

## Supported Header Formats

Your Excel can use any of these header styles - they'll all map correctly now:

### Building Type
- "Building Type" ✅
- "Unit Type" ✅ (Now works correctly)
- "Property Type" ✅
- etc.

### Area
- "Gross Area" ✅ (Now extracts values correctly)
- "Unit Gross Area" ✅
- "Land Area" ✅
- "BUA (SQM)" ✅
- etc.

### Price
- "Total Price" ✅ (Now maps correctly)
- "Unit Price" ✅
- "Total Cost" ✅
- "Unit Total with Finishing Price" ✅
- etc.

### Delivery Date
- "Delivery Date" ✅ (Now maps correctly, not to Unit Type)
- "Estimated Delivery Date" ✅
- "Handover Date" ✅
- "Completion Date" ✅
- etc.

### Finishing
- "Finishing" ✅
- "Finishing Type" ✅
- "Finish Type" ✅
- "Finishing Specs" ✅
- etc.

## Manual Mapping Still Available

If a header isn't automatically recognized, you can manually map it in the upload dialog:
1. Upload your Excel file
2. See the mapping preview
3. For any red "unresolved" columns, click and select the correct Excel header
4. The system will remember your custom mapping

## Troubleshooting

**Issue**: A column still maps incorrectly

**Solution**: 
1. Check if the header name is in the supported list above
2. If not, use manual mapping in the upload dialog
3. Report the header to us so we can add it

**Issue**: Empty values in the preview even though they exist in Excel

**Solution**: This was the main bug - should now be fixed! If you still see empty values:
1. Verify the column is properly mapped (green status)
2. Make sure the Excel file doesn't have empty cells
3. Check that values are in the first data row (not hidden rows)

## File Changed
- `src/utils/excel-field-mapper.js` - Improved matching algorithm and removed generic aliases

## Testing
Run the mapping test to verify headers are mapped correctly:
```bash
node src/utils/__tests__/excel-field-mapper.test.js
```
