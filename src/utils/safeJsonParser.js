/**
 * Safely parses JSON strings and handles edge cases
 * @param {string|object|undefined} data - Data to parse
 * @param {object} defaultValue - Default value if parsing fails
 * @returns {object} Parsed object or default value
 */
export function safeJsonParse(data, defaultValue = {}) {
  // If data is already an object, return it
  if (typeof data === 'object' && data !== null) {
    return data;
  }
  
  // If data is undefined, null, or empty string, return default
  if (!data || data === 'undefined' || data === 'null' || data === '') {
    return defaultValue;
  }
  
  // If data is a string, try to parse it
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      // Ensure we return an object
      return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue;
    } catch (error) {
      console.warn('Failed to parse JSON:', data, error.message);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Safely merges search parameters with defaults
 * @param {string|object|undefined} searchParams - Search parameters to parse
 * @param {object} defaults - Default parameters to merge
 * @returns {object} Merged parameters object
 */
export function safeMergeParams(searchParams, defaults = {}) {
  const parsed = safeJsonParse(searchParams, {});
  return { ...defaults, ...parsed };
}

/**
 * Safely parses cookie values
 * @param {string|undefined} cookieValue - Cookie value to parse
 * @param {object} defaultValue - Default value if parsing fails
 * @returns {object} Parsed object or default value
 */
export function safeCookieParse(cookieValue, defaultValue = {}) {
  if (!cookieValue) return defaultValue;
  return safeJsonParse(cookieValue, defaultValue);
}

/**
 * Safely parses localStorage values
 * @param {string|undefined} storageValue - Storage value to parse
 * @param {object} defaultValue - Default value if parsing fails
 * @returns {object} Parsed object or default value
 */
export function safeStorageParse(storageValue, defaultValue = {}) {
  if (!storageValue) return defaultValue;
  return safeJsonParse(storageValue, defaultValue);
}
