/**
 * Translation key sanitization utilities
 * Prevents XSS and prototype pollution through translation keys
 */

// Allowed characters for translation keys (alphanumeric, underscore, dot, space)
const SAFE_KEY_PATTERN = /^[a-zA-Z0-9._\-\s]+$/;

// Dangerous patterns that could lead to prototype pollution or XSS
const DANGEROUS_PATTERNS = [
  /__proto__/,
  /constructor/,
  /prototype/,
  /<script/i,
  /javascript:/i,
  /on\w+=/i,
  /data:/i,
  /vbscript:/i,
  /\$\{/,
  /eval\(/,
  /Function\(/,
  /setTimeout\(/,
  /setInterval\(/
];

// Maximum depth for nested property access to prevent stack overflow
const MAX_DEPTH = 10;

/**
 * Sanitizes a translation key to prevent XSS and prototype pollution
 * @param {string} key - The translation key to sanitize
 * @returns {object} - { isSafe: boolean, sanitizedKey: string|null, reason: string|null }
 */
export function sanitizeTranslationKey(key) {
  if (!key || typeof key !== 'string') {
    return {
      isSafe: false,
      sanitizedKey: null,
      reason: 'Key must be a non-empty string'
    };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(key)) {
      return {
        isSafe: false,
        sanitizedKey: null,
        reason: 'Key contains dangerous pattern'
      };
    }
  }

  // Check for allowed characters only
  if (!SAFE_KEY_PATTERN.test(key)) {
    return {
      isSafe: false,
      sanitizedKey: null,
      reason: 'Key contains invalid characters'
    };
  }

  // Check for excessive depth (too many dots)
  const depth = key.split('.').length;
  if (depth > MAX_DEPTH) {
    return {
      isSafe: false,
      sanitizedKey: null,
      reason: 'Key depth exceeds maximum allowed'
    };
  }

  // Check for consecutive dots or leading/trailing dots
  if (key.includes('..') || key.startsWith('.') || key.endsWith('.')) {
    return {
      isSafe: false,
      sanitizedKey: null,
      reason: 'Key has invalid dot placement'
    };
  }

  return {
    isSafe: true,
    sanitizedKey: key,
    reason: null
  };
}

/**
 * Safely accesses nested object properties without risking prototype pollution
 * @param {object} obj - The object to access
 * @param {string} key - The sanitized key path
 * @returns {any} - The value at the path or undefined if not found
 */
export function safePropertyAccess(obj, key) {
  const sanitization = sanitizeTranslationKey(key);
  
  if (!sanitization.isSafe) {
    console.warn('Unsafe translation key access attempted:', key, sanitization.reason);
    return undefined;
  }

  const keys = sanitization.sanitizedKey.split('.');
  let current = obj;

  for (const k of keys) {
    // Only access own properties to prevent prototype pollution
    if (current === null || current === undefined) {
      return undefined;
    }

    if (!Object.prototype.hasOwnProperty.call(current, k)) {
      return undefined;
    }

    current = current[k];
  }

  return current;
}

/**
 * Validates and sanitizes a translation key with fallback
 * @param {string} key - The translation key to validate
 * @param {string|null} fallback - Fallback value if key is invalid
 * @returns {object} - { isValid: boolean, safeKey: string|null, fallback: string }
 */
export function validateTranslationKey(key, fallback = null) {
  const sanitization = sanitizeTranslationKey(key);
  
  if (!sanitization.isSafe) {
    console.warn('Invalid translation key rejected:', key, sanitization.reason);
    return {
      isValid: false,
      safeKey: null,
      fallback: fallback || 'invalid_key'
    };
  }

  return {
    isValid: true,
    safeKey: sanitization.sanitizedKey,
    fallback: fallback
  };
}

/**
 * Creates a safe translation function that prevents XSS and prototype pollution
 * @param {Function} translateFunction - The original translation function
 * @returns {Function} - Safe translation function
 */
export function createSafeTranslator(translateFunction) {
  return (key, fallback = null) => {
    const validation = validateTranslationKey(key, fallback);
    
    if (!validation.isValid) {
      return validation.fallback;
    }

    try {
      return translateFunction(validation.safeKey, fallback);
    } catch (error) {
      console.error('Translation function error:', error);
      return fallback || validation.safeKey;
    }
  };
}

/**
 * Batch validates multiple translation keys
 * @param {string[]} keys - Array of translation keys to validate
 * @returns {object} - { valid: string[], invalid: Array<{key: string, reason: string}> }
 */
export function batchValidateKeys(keys) {
  const valid = [];
  const invalid = [];

  for (const key of keys) {
    const sanitization = sanitizeTranslationKey(key);
    
    if (sanitization.isSafe) {
      valid.push(key);
    } else {
      invalid.push({
        key,
        reason: sanitization.reason
      });
    }
  }

  return { valid, invalid };
}

/**
 * Checks if a translation value is safe to render (prevents XSS in values)
 * @param {any} value - The translation value to check
 * @returns {boolean} - True if safe to render
 */
export function isSafeTranslationValue(value) {
  if (value === null || value === undefined) {
    return true; // Null/undefined values are safe
  }

  if (typeof value !== 'string') {
    return true; // Non-string values are generally safe
  }

  // Check for dangerous HTML/script patterns in translation values
  const dangerousValuePatterns = [
    /<script[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /vbscript:/i,
    /data:(?!image\/)/i
  ];

  return !dangerousValuePatterns.some(pattern => pattern.test(value));
}

/**
 * Sanitizes translation values to prevent XSS
 * @param {any} value - The translation value to sanitize
 * @returns {any} - Sanitized value
 */
export function sanitizeTranslationValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (!isSafeTranslationValue(value)) {
    // Remove potentially dangerous HTML tags and attributes
    return value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:(?!image\/)/gi, '');
  }

  return value;
}
