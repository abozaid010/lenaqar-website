/**
 * Utility functions for input validation and sanitization
 */

// Allowed characters for deep link parameters
const SAFE_ID_PATTERN = /^[a-zA-Z0-9\-_]+$/;
const SAFE_TYPE_PATTERN = /^[a-zA-Z]+$/;

/**
 * Sanitizes and validates deep link type parameter
 * @param {string} type - The type parameter to validate
 * @param {string[]} allowedTypes - Array of allowed type values
 * @returns {string|null} - Sanitized type or null if invalid
 */
export function sanitizeDeepLinkType(type, allowedTypes = ['project', 'unit']) {
  if (!type || typeof type !== 'string') {
    return null;
  }

  const sanitized = type.trim().toLowerCase();
  
  // Check if type matches safe pattern
  if (!SAFE_TYPE_PATTERN.test(sanitized)) {
    return null;
  }

  // Check if type is in allowed list
  if (!allowedTypes.includes(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitizes and validates deep link ID parameter
 * @param {string} id - The ID parameter to validate
 * @returns {string|null} - Sanitized ID or null if invalid
 */
export function sanitizeDeepLinkId(id) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  const sanitized = id.trim();
  
  // Check length limits
  if (sanitized.length < 1 || sanitized.length > 100) {
    return null;
  }

  // Check if ID matches safe pattern (alphanumeric, hyphens, underscores)
  if (!SAFE_ID_PATTERN.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validates and constructs a safe deep link URL
 * @param {string} type - The type parameter
 * @param {string} id - The ID parameter
 * @param {string[]} allowedTypes - Array of allowed type values
 * @returns {string|null} - Safe deep link URL or null if invalid
 */
export function createSafeDeepLinkUrl(type, id, allowedTypes = ['project', 'unit']) {
  const sanitizedType = sanitizeDeepLinkType(type, allowedTypes);
  const sanitizedId = sanitizeDeepLinkId(id);

  if (!sanitizedType || !sanitizedId) {
    return null;
  }

  return `lenaai://${sanitizedType}/${sanitizedId}`;
}

/**
 * Validates URL parameters for deep linking
 * @param {Object} params - URL parameters object
 * @param {string[]} allowedTypes - Array of allowed type values
 * @returns {Object} - Validation result with sanitized values
 */
export function validateDeepLinkParams(params, allowedTypes = ['project', 'unit']) {
  const result = {
    isValid: false,
    type: null,
    id: null,
    errors: []
  };

  if (!params || typeof params !== 'object') {
    result.errors.push('Invalid parameters object');
    return result;
  }

  const sanitizedType = sanitizeDeepLinkType(params.type, allowedTypes);
  const sanitizedId = sanitizeDeepLinkId(params.id);

  if (!sanitizedType) {
    result.errors.push('Invalid or missing type parameter');
  }

  if (!sanitizedId) {
    result.errors.push('Invalid or missing ID parameter');
  }

  if (sanitizedType && sanitizedId) {
    result.isValid = true;
    result.type = sanitizedType;
    result.id = sanitizedId;
  }

  return result;
}
