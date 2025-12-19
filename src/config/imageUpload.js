/**
 * Image Upload Size Configuration
 * 
 * Centralized configuration for image upload size limits.
 * Separate limits for normal images (units, properties, projects) and master plan images.
 */

// Maximum file sizes in MB
export const NORMAL_IMAGE_MAX_SIZE_MB = 6;
export const MASTER_PLAN_IMAGE_MAX_SIZE_MB = 10;

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
