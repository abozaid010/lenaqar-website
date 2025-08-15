/**
 * Image utility functions for handling various image loading scenarios
 */

/**
 * Validates if a URL is a valid image URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid image URL
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a data URL
  if (url.startsWith('data:image/')) return true;
  
  // Check if it's a relative path
  if (url.startsWith('/')) return true;
  
  // Check if it's a valid HTTP(S) URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Gets the appropriate fallback image based on context
 * @param {string} context - Image context (e.g., 'property', 'user', 'logo')
 * @returns {string} - Fallback image path
 */
export function getFallbackImage(context = 'default') {
  const fallbacks = {
    property: '/images/property_placeholder.jpg',
    user: '/images/defaultImage.jpg',
    logo: '/images/logo.png',
    dashboard: '/images/dasbordDesctop.png',
    mobile: '/images/dashbordmobile.png',
    default: '/images/defaultImage.jpg'
  };
  
  return fallbacks[context] || fallbacks.default;
}

/**
 * Creates a safe image source with fallbacks
 * @param {string|string[]} sources - Primary image source(s)
 * @param {string} context - Image context for fallback selection
 * @returns {string} - Safe image source
 */
export function createSafeImageSource(sources, context = 'default') {
  if (!sources) return getFallbackImage(context);
  
  // If sources is an array, use the first valid one
  if (Array.isArray(sources)) {
    for (const source of sources) {
      if (isValidImageUrl(source)) return source;
    }
    return getFallbackImage(context);
  }
  
  // If sources is a string, validate it
  if (isValidImageUrl(sources)) return sources;
  
  return getFallbackImage(context);
}

/**
 * Preloads an image to check if it's valid
 * @param {string} src - Image source URL
 * @returns {Promise<boolean>} - True if image loads successfully
 */
export function preloadImage(src) {
  return new Promise((resolve) => {
    if (!isValidImageUrl(src)) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Batch preloads multiple images
 * @param {string[]} sources - Array of image sources
 * @returns {Promise<{valid: string[], invalid: string[]}>} - Results
 */
export async function batchPreloadImages(sources) {
  const valid = [];
  const invalid = [];
  
  const promises = sources.map(async (src) => {
    const isValid = await preloadImage(src);
    if (isValid) {
      valid.push(src);
    } else {
      invalid.push(src);
    }
  });
  
  await Promise.all(promises);
  
  return { valid, invalid };
}

/**
 * Creates a responsive image source set
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths
 * @returns {string} - Responsive srcset string
 */
export function createResponsiveSrcSet(baseUrl, widths = [640, 750, 828, 1080, 1200, 1920]) {
  if (!isValidImageUrl(baseUrl)) return '';
  
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Handles image loading errors with intelligent fallbacks
 * @param {Error} error - Image loading error
 * @param {string} originalSrc - Original image source
 * @param {string} context - Image context
 * @returns {string} - Fallback image source
 */
export function handleImageError(error, originalSrc, context = 'default') {
  console.warn(`Image loading failed for ${originalSrc}:`, error.message);
  
  // Log the error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Image error details:', {
      src: originalSrc,
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  return getFallbackImage(context);
}
