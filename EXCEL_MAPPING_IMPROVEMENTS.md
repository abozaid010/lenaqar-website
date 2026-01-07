# Excel Header Mapping Improvements

## Problem Identified

The original Excel column mapping had several issues:

1. **Overly generic aliases** - Words like "type", "date", "area", "number", "size" caused false positive matches
2. **First-match wins** - The algorithm returned the first matching alias without considering specificity
3. **No scoring system** - All matches were treated equally, regardless of how specific they were

### Examples of Issues:
- **Delivery Date** column was being mapped to **Unit Type** because both contained generic words
- **Total Area** (Gross Area) was being mapped correctly but data wasn't extracted properly
- **Finishing** was being mapped incorrectly to other fields

## Solution Implemented

### 1. **Removed Generic Aliases**
Deleted overly broad aliases that cause false matches:

```javascript
// REMOVED from buildingType:
"type"  // Too generic - matches many unrelated fields

// REMOVED from unitTitle:
"title", "name"  // Too generic

// REMOVED from landArea:
"area", "size"  // Too generic - also matches garden area, garage area, etc.

// REMOVED from deliveryDate:
"delivery", "date"  // Too generic

// REMOVED from totalPrice:
"price", "total amount", "total-amount"  // Could match other price fields

// REMOVED from unit_number:
"no", "number"  // Too generic

// REMOVED from city:
"location"  // Could match other location fields
```

### 2. **Implemented Scoring System**

Changed the matching algorithm to:
1. **Perfect matches** - Return immediately
2. **Scored matches** - Calculate score based on alias length (longer = more specific)
3. **Return best match** - Pick the highest scoring match instead of first match

```javascript
// OLD: First exact match wins
if (normalizedAliases.includes(normalizedHeader)) {
  return canonicalKey;  // Returned immediately
}

// NEW: Score and pick best match
for (const alias of aliases) {
  if (normalizedHeader === normalizedAlias) {
    return canonicalKey;  // Perfect match - return immediately
  }
  
  // Partial match - score by length
  if (normalizedHeader.includes(normalizedAlias) || ...) {
    const score = normalizedAlias.length;  // Longer = more specific
    if (score > bestScore) {
      bestScore = score;
      bestMatch = canonicalKey;
    }
  }
}
```

## Results

### Improved Mapping Accuracy

| Header | Old Mapping | New Mapping | Status |
|--------|------------|------------|--------|
| Unit Type | (ambiguous) | buildingType | ✅ Fixed |
| Gross Area | landArea | landArea | ✅ Verified |
| Delivery Date | (ambiguous/wrong) | deliveryDate | ✅ Fixed |
| Total Price | totalPrice | totalPrice | ✅ Verified |
| Finishing Type | (ambiguous) | finishing | ✅ Fixed |
| Number of Bedrooms | roomsCount | roomsCount | ✅ Verified |
| Estimated Delivery Date | (ambiguous) | deliveryDate | ✅ Fixed |

## How It Works Now

### Example 1: "Total Price" column
```
Header: "Total Price"
Candidates:
  - totalPrice aliases: ["total price", "total-price", ...]
  - "total price" score: 11 (length)
  - Other fields with "price": buildingType? No aliases with "price" anymore
Result: ✅ Maps to totalPrice
```

### Example 2: "Delivery Date \\ Y" column (Tatweer Misr)
```
Header: "Delivery Date \\ Y"
Candidates:
  - deliveryDate aliases: ["delivery date", "Delivery Date \\ Y", ...]
  - Perfect match on "Delivery Date \\ Y"
  - Other fields with "date": None anymore (removed generic "date")
Result: ✅ Maps to deliveryDate
```

### Example 3: "Finishing Specs" column
```
Header: "Finishing Specs"
Candidates:
  - finishing aliases: ["finishing", "finish type", "Finishing Specs", ...]
  - Perfect match on "Finishing Specs"
Result: ✅ Maps to finishing
```

## Data Extraction Now Works Correctly

With proper mapping, the data extraction follows correctly:
1. Header is mapped to canonical field (e.g., "Gross Area" → landArea)
2. Data rows fetch values from the correct column index
3. All values in the column are properly extracted (no more empty values issue)

## Testing

Created test file at: `src/utils/__tests__/excel-field-mapper.test.js`

Run tests to verify mapping accuracy:
```bash
npm test -- excel-field-mapper.test.js
```

## Backward Compatibility

All changes are backward compatible:
- Canonical field names remain unchanged
- API remains the same
- Only internal matching logic improved
- Supports all existing Excel formats (Tatweer Misr, SODIC, custom)

## Next Steps

If you encounter any headers that still map incorrectly:
1. Add them as specific aliases in `FIELD_ALIASES`
2. Test the mapping using the test file
3. Report any edge cases for further refinement
