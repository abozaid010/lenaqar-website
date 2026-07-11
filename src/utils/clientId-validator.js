/**
 * Client ID validation and sanitization utilities
 * Provides secure validation for client IDs used throughout the application
 */

// Simplified client ID validation - focus on safety rather than format strictness
const SAFE_CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Validates client ID format and sanitizes input
 * @param {string} clientId - The client ID to validate
 * @returns {object} - { isValid: boolean, sanitizedId: string|null, error: string|null }
 */
export function validateClientId(clientId) {
  if (!clientId || typeof clientId !== 'string') {
    return {
      isValid: false,
      sanitizedId: null,
      error: 'Client ID is required and must be a string'
    };
  }

  // Trim whitespace
  const sanitizedId = clientId.trim();

  // Check if it's safe (only alphanumeric, underscore, hyphen)
  if (SAFE_CLIENT_ID_PATTERN.test(sanitizedId)) {
    return {
      isValid: true,
      sanitizedId,
      error: null
    };
  }

  // Allow "public" as a special case
  if (sanitizedId.toLowerCase() === 'public') {
    return {
      isValid: true,
      sanitizedId: 'public',
      error: null
    };
  }

  return {
    isValid: false,
    sanitizedId: null,
    error: 'Client ID contains invalid characters (only letters, numbers, underscore, and hyphen allowed)'
  };
}

/**
 * Safely extracts client ID from multiple sources with validation
 * @returns {Promise<object>} - { clientId: string|null, source: string, error: string|null }
 */
export async function getValidatedClientId() {
  const sources = [
    { name: 'cookie', getter: () => import('@/lib/LenaCookiesManager').then(m => m.LenaCookiesManager.getClientId()) },
    { name: 'token', getter: () => import('@/utils/api').then(m => m.getClientid()) },
    { name: 'localStorage', getter: () => Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem('clientId') : null) }
  ];

  for (const source of sources) {
    try {
      const clientId = await source.getter();
      if (clientId) {
        const validation = validateClientId(clientId);
        if (validation.isValid) {
          return {
            clientId: validation.sanitizedId,
            source: source.name,
            error: null
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to get client ID from ${source.name}:`, error?.message ?? error);
      continue;
    }
  }

  return {
    clientId: null,
    source: 'none',
    error: 'No valid client ID found in any source'
  };
}

/**
 * Checks if a client ID is safe to use in URLs
 * @param {string} clientId - The client ID to check
 * @returns {boolean} - True if safe for URL usage
 */
export function isSafeForUrl(clientId) {
  const validation = validateClientId(clientId);
  return validation.isValid && !/[/?#]/.test(validation.sanitizedId);
}

/**
 * Creates a safe client ID for API calls
 * @param {string} clientId - The client ID to sanitize
 * @returns {string|null} - Safe client ID or null if invalid
 */
export function createSafeClientId(clientId) {
  const validation = validateClientId(clientId);
  return validation.isValid ? validation.sanitizedId : null;
}
