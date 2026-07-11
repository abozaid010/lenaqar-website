/**
 * Image utility functions for handling various image loading scenarios
 */

import { IMAGE_BASE_URL } from "@/lib/imageConfig";
import { getAllowedImageHostnames } from "@/config/imageHosts";

/** Resolve GCS file id from API fields or URL path (/gcs/… or /images/…). */
export function resolveImageFileId(img) {
  if (!img || typeof img !== "object") return "";
  const direct = img.fileId ?? img.file_id ?? img.id;
  if (direct) return String(direct);
  const url = img.url || img.image_url || "";
  if (!url) return "";
  const match = String(url).match(/\/(gcs|images)\/([^/?#]+)/);
  return match ? match[2] : "";
}

/** Auto-generated caption when a user sends unit images via WhatsApp. */
export const USER_MESSAGE_IMAGE_PLACEHOLDER =
  "i have unit wanna offer, here is the images of it";

export function isPlaceholderUserMessage(text) {
  if (text == null) return true;
  const trimmed = String(text).trim();
  if (!trimmed) return true;
  return trimmed.toLowerCase() === USER_MESSAGE_IMAGE_PLACEHOLDER.toLowerCase();
}

/** True only for the known auto-caption, not for empty messages. */
export function isExactPlaceholderUserMessage(text) {
  if (text == null) return false;
  const trimmed = String(text).trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() === USER_MESSAGE_IMAGE_PLACEHOLDER.toLowerCase();
}

/** User-visible text; treats empty and placeholder captions as no text. */
export function getDisplayUserMessageText(text) {
  if (isPlaceholderUserMessage(text)) return "";
  return String(text ?? "").trim();
}

export function hasDisplayUserMessageText(text) {
  return getDisplayUserMessageText(text).length > 0;
}

/**
 * For presentation only: given a full image URL from the API, use IMAGE_BASE_URL
 * (NEXT_PUBLIC_IMAGE_BASE_URL) as base and replace /images/ with /gcs/ in the path.
 * Returns url unchanged if not a full URL or if path doesn't contain /images/.
 */
export function getDisplayImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return url;
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    if (!pathname.includes("/images")) return url;
    const newPath = pathname.replace(/\/images\//, "/gcs/");
    const base = IMAGE_BASE_URL ? new URL(IMAGE_BASE_URL) : u;
    return `${base.origin}${newPath}${u.search}`;
  } catch {
    return url;
  }
}

/**
 * Resolves client logo for a native img element. Full URLs pass through
 * {@link getDisplayImageUrl} (e.g. /images/ → /gcs/ on the image base host).
 * API-relative paths like /gcs/... or /images/... are prefixed with
 * {@link IMAGE_BASE_URL} so they load from the API host in local dev.
 */
export function getClientLogoDisplayUrl(url) {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (!t) return t;
  let absolute = t;
  if (t.startsWith("/gcs/") || t.startsWith("/images/")) {
    try {
      const base = new URL(IMAGE_BASE_URL);
      absolute = `${base.origin}${t}`;
    } catch {
      return t;
    }
  }
  if (absolute.startsWith("http://") || absolute.startsWith("https://")) {
    return getDisplayImageUrl(absolute);
  }
  return absolute;
}

/** Resolve chat message media URLs (full or API-relative paths). */
export function resolveChatMessageImageUrl(url) {
  if (!url) return null;

  const trimmed = String(url).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return getDisplayImageUrl(trimmed);
  }

  return getClientLogoDisplayUrl(trimmed);
}

/** Pick shared image URL fields from a conversation turn. */
export function pickConversationImageUrl(message) {
  if (!message || typeof message !== "object") return null;

  const url =
    message.image_url ??
    message.media_url ??
    (typeof message.image === "string" ? message.image : null);

  if (url == null) return null;
  const trimmed = String(url).trim();
  return trimmed || null;
}

export function resolveUserTurnImageUrl(message) {
  if (!message || typeof message !== "object") return null;

  const explicit = message.user_image_url ?? message.user_media_url;
  if (explicit) return resolveChatMessageImageUrl(explicit);

  const shared = pickConversationImageUrl(message);
  if (!shared) return null;

  const hasUserText = hasDisplayUserMessageText(message.user_message);
  const hasBotText = Boolean(
    String(message.bot_response ?? message.bot_message ?? "").trim()
  );

  if (hasUserText || !hasBotText) {
    return resolveChatMessageImageUrl(shared);
  }

  if (isExactPlaceholderUserMessage(message.user_message)) {
    return resolveChatMessageImageUrl(shared);
  }

  return null;
}

export function resolveBotTurnImageUrl(message) {
  if (!message || typeof message !== "object") return null;

  const explicit =
    message.bot_image_url ??
    message.bot_media_url ??
    message.admin_reply_image_url;
  if (explicit) return resolveChatMessageImageUrl(explicit);

  const shared = pickConversationImageUrl(message);
  if (!shared) return null;

  const hasUserText = hasDisplayUserMessageText(message.user_message);
  const hasBotText = Boolean(
    String(message.bot_response ?? message.bot_message ?? "").trim()
  );

  if (hasBotText && !hasUserText) {
    return resolveChatMessageImageUrl(shared);
  }

  return null;
}

export function hasUserTurnContent(message) {
  if (!message || typeof message !== "object") return false;
  return (
    hasDisplayUserMessageText(message.user_message) ||
    Boolean(resolveUserTurnImageUrl(message))
  );
}

export function hasBotTurnContent(message) {
  if (!message || typeof message !== "object") return false;

  const botText = String(message.bot_response ?? message.bot_message ?? "").trim();
  if (botText) return true;
  if (resolveBotTurnImageUrl(message)) return true;
  if (message.properties && Object.keys(message.properties).length > 0) return true;
  if (message.project_data && Object.keys(message.project_data).length > 0) return true;
  if (Array.isArray(message.project_phases) && message.project_phases.length > 0) {
    return true;
  }
  if (message.crm_link) return true;

  return false;
}

const brokenImageCache = new Set();

// Cache for retry attempts per image
const retryAttempts = new Map();

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
 * Checks if the hostname is configured in Next.js images config
 * @param {string} url - URL to check
 * @returns {boolean} - True if hostname is configured or internal
 */
export function isConfiguredHostname(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Data URLs and relative paths are always allowed
  if (url.startsWith('data:') || url.startsWith('/')) return true;
  
  try {
    const { hostname } = new URL(url);
    const allowed = getAllowedImageHostnames();

    return allowed.some((allowedHost) => {
      // Exact match or subdomain match
      return hostname === allowedHost || hostname.endsWith('.' + allowedHost);
    });
  } catch {
    return false;
  }
}

/**
 * Checks if an image URL is known to be broken (after retries)
 * @param {string} url - URL to check
 * @returns {boolean} - True if the image is known to be broken
 */
export function isKnownBrokenImage(url) {
  if (!url || typeof url !== 'string') return true;
  
  // Only check cache - no hardcoded patterns
  return brokenImageCache.has(url);
}

/**
 * Gets the number of retry attempts for an image
 * @param {string} url - URL to check
 * @returns {number} - Number of retry attempts
 */
export function getRetryAttempts(url) {
  return retryAttempts.get(url) || 0;
}

/**
 * Increments retry attempts for an image
 * @param {string} url - URL to increment retries for
 * @returns {number} - New retry count
 */
export function incrementRetryAttempts(url) {
  const current = getRetryAttempts(url);
  const newCount = current + 1;
  retryAttempts.set(url, newCount);
  return newCount;
}

/**
 * Checks if an image should be retried
 * @param {string} url - URL to check
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {boolean} - True if image should be retried
 */
export function shouldRetryImage(url, maxRetries = 2) {
  return getRetryAttempts(url) < maxRetries;
}

/**
 * Marks an image URL as broken to prevent future attempts
 * @param {string} url - URL to mark as broken
 */
export function markImageAsBroken(url) {
  if (url && typeof url === 'string') {
    brokenImageCache.add(url);
  }
}

/**
 * Removes an image URL from the broken cache (useful if image gets fixed)
 * @param {string} url - URL to remove from broken cache
 */
export function markImageAsFixed(url) {
  if (url && typeof url === 'string') {
    brokenImageCache.delete(url);
    retryAttempts.delete(url);
  }
}

/**
 * Clears all broken image caches (useful for debugging)
 */
export function clearBrokenImageCache() {
  brokenImageCache.clear();
  retryAttempts.clear();
}

/**
 * Gets debug information about broken images and retry attempts
 * @returns {object} - Debug information
 */
export function getImageDebugInfo() {
  return {
    brokenImages: Array.from(brokenImageCache),
    retryAttempts: Object.fromEntries(retryAttempts),
    totalBrokenImages: brokenImageCache.size,
    totalRetryAttempts: retryAttempts.size
  };
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
 * Creates a safe image source with fallbacks and retry logic
 * @param {string|string[]} sources - Primary image source(s)
 * @param {string} context - Image context for fallback selection
 * @returns {string} - Safe image source
 */
export function createSafeImageSource(sources, context = 'default') {
  if (!sources) return getFallbackImage(context);
  
  // If sources is an array, use the first valid one
  if (Array.isArray(sources)) {
    for (const source of sources) {
      if (isValidImageUrl(source) && shouldRetryImage(source)) {
        return source;
      }
    }
    return getFallbackImage(context);
  }
  
  // If sources is a string, validate it
  if (isValidImageUrl(sources) && shouldRetryImage(sources)) {
    return sources;
  }
  
  return getFallbackImage(context);
}

/**
 * Preloads an image to check if it's valid
 * @param {string} src - Image source URL
 * @returns {Promise<boolean>} - True if image loads successfully
 */
export function preloadImage(src) {
  return new Promise((resolve) => {
    if (!isValidImageUrl(src) || isKnownBrokenImage(src)) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      // Reset retry count on successful load
      retryAttempts.delete(src);
      resolve(true);
    };
    img.onerror = () => {
      const retryCount = incrementRetryAttempts(src);
      if (shouldRetryImage(src)) {
        // Retry the image
        setTimeout(() => {
          preloadImage(src).then(resolve);
        }, 1000); // Wait 1 second before retry
      } else {
        // Mark as broken after max retries
        markImageAsBroken(src);
        resolve(false);
      }
    };
    img.src = src;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      const retryCount = incrementRetryAttempts(src);
      if (shouldRetryImage(src)) {
        // Retry on timeout
        setTimeout(() => {
          preloadImage(src).then(resolve);
        }, 1000);
      } else {
        markImageAsBroken(src);
        resolve(false);
      }
    }, 5000);
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
 * Filters out known broken images from an array (after retries)
 * @param {string[]} sources - Array of image sources
 * @returns {string[]} - Array with broken images removed
 */
export function filterValidImages(sources) {
  if (!Array.isArray(sources)) return [];
  
  return sources.filter(src => {
    return isValidImageUrl(src) && !isKnownBrokenImage(src);
  });
}

/**
 * Gets the first valid image from an array, with fallback
 * @param {string[]} sources - Array of image sources
 * @param {string} context - Image context for fallback selection
 * @returns {string} - First valid image or fallback
 */
export function getFirstValidImage(sources, context = 'default') {
  if (!Array.isArray(sources) || sources.length === 0) {
    return getFallbackImage(context);
  }
  
  const validImages = filterValidImages(sources);
  
  if (validImages.length > 0) {
    return validImages[0];
  }
  
  return getFallbackImage(context);
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
 * Handles image loading errors with retry logic
 * @param {Error} error - Image loading error
 * @param {string} originalSrc - Original image source
 * @param {string} context - Image context
 * @returns {string} - Fallback image source or retry the same image
 */
export function handleImageError(error, originalSrc, context = 'default') {
  // Ensure we have a valid source URL
  if (!originalSrc || typeof originalSrc !== 'string') {
    console.warn('Invalid or missing image source provided to handleImageError');
    return getFallbackImage(context);
  }
  
  const retryCount = incrementRetryAttempts(originalSrc);
  
  // Safely extract error message
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  console.warn(`Image loading failed (attempt ${retryCount}):`, errorMessage);
  
  // If we haven't exceeded max retries, return the original src to retry
  if (shouldRetryImage(originalSrc)) {
    return originalSrc;
  }
  
  // After max retries, mark as broken and return fallback
  markImageAsBroken(originalSrc);
  return getFallbackImage(context);
}
