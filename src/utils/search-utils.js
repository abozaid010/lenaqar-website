/**
 * Filters an array of items by searching across multiple fields
 * @param {Array} items - Array of items to filter
 * @param {string} query - Search query string
 * @param {Array<string>} searchFields - Array of field names to search in
 * @returns {Array} Filtered array of items that match the query
 */
export function filterBySearchQuery(items, query, searchFields) {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  if (!query || query.trim() === "") {
    return items;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    if (!item) return false;

    // Check if query matches any of the specified fields
    return searchFields.some((field) => {
      const fieldValue = item[field];
      
      // Handle null, undefined, or empty values
      if (!fieldValue) return false;

      // Convert to string and normalize for comparison
      const normalizedValue = String(fieldValue).toLowerCase().trim();
      
      // Check if the query appears in the field value
      return normalizedValue.includes(normalizedQuery);
    });
  });
}

