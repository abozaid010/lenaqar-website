/**
 * Image Upload Size Configuration
 * 
 * Centralized configuration for image upload size limits.
 * Separate limits for normal images (units, properties, projects) and master plan images.
 */

// Maximum file sizes in MB
export const NORMAL_IMAGE_MAX_SIZE_MB = 6;
export const MASTER_PLAN_IMAGE_MAX_SIZE_MB = 10;

// Supported image MIME types
export const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Accept attribute value for file inputs
export const SUPPORTED_IMAGE_ACCEPT = 'image/jpeg, image/png, image/webp';

/**
 * Check if a MIME type is a supported image type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if supported
 */
export const isSupportedImageMime = (mimeType) => {
  return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType);
};

/**
 * Check if a file is a supported image type
 * @param {File} file - File object to check
 * @returns {boolean} True if supported
 */
export const isSupportedImageFile = (file) => {
  return file && isSupportedImageMime(file.type);
};

/**
 * Get the maximum file size in bytes for the given image type
 * @param {string} type - Image type: 'normal' | 'masterPlan' (default: 'normal')
 * @returns {number} Maximum file size in bytes
 */
export const getMaxSizeBytes = (type = 'normal') => {
  const sizeMB = type === 'masterPlan' 
    ? MASTER_PLAN_IMAGE_MAX_SIZE_MB 
    : NORMAL_IMAGE_MAX_SIZE_MB;
  return sizeMB * 1024 * 1024;
};

/**
 * Get the maximum file size in MB for the given image type
 * @param {string} type - Image type: 'normal' | 'masterPlan' (default: 'normal')
 * @returns {number} Maximum file size in MB
 */
export const getMaxSizeMB = (type = 'normal') => {
  return type === 'masterPlan' 
    ? MASTER_PLAN_IMAGE_MAX_SIZE_MB 
    : NORMAL_IMAGE_MAX_SIZE_MB;
};

/**
 * Get the server body size limit (should be the maximum of all image types)
 * @returns {string} Server body size limit in format 'Xmb'
 */
export const getSizeLimitForServer = () => {
  return `${Math.max(NORMAL_IMAGE_MAX_SIZE_MB, MASTER_PLAN_IMAGE_MAX_SIZE_MB)}mb`;
};
