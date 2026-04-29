/**
 * API Response Handler Utilities
 *
 * Standard API response format:
 * {
 *   status: boolean,
 *   code: number,        // Business logic code (may differ from HTTP status)
 *   message: string|null,
 *   data: any|null,
 *   error_message: string|null
 * }
 *
 * Common patterns:
 * - HTTP 200 with code 200 = Success
 * - HTTP 200 with code 409 = Business logic error (e.g., project has units)
 * - HTTP 4xx/5xx = Network/server error (goes to catch block)
 */

/**
 * Check if API response indicates success
 * @param {Object} response - API response object
 * @returns {boolean}
 */
export function isSuccessResponse(response) {
  if (!response) return false;
  return response.code === 200 || (response.status === true && !response.error_message);
}

/**
 * Check if API response indicates an error
 * @param {Object} response - API response object
 * @returns {boolean}
 */
export function isErrorResponse(response) {
  if (!response) return true;
  return response.code >= 400 || response.status === false || !!response.error_message;
}

/**
 * Get error message from API response
 * Prefers error_message, falls back to message, then default
 *
 * @param {Object} response - API response object
 * @param {string} defaultMessage - Fallback message if none in response
 * @returns {string}
 */
export function getErrorMessage(response, defaultMessage = "Operation failed") {
  if (!response) return defaultMessage;

  // Priority: error_message > message > default
  return response.error_message || response.message || defaultMessage;
}

/**
 * Handle API response with callbacks
 * Usage:
 *   handleApiResponse(
 *     await deleteProject(id),
 *     {
 *       onSuccess: () => toast.success("Deleted"),
 *       onError: (msg) => toast.error(msg),
 *       fallbackError: "Failed to delete"
 *     }
 *   );
 *
 * @param {Object} response - API response
 * @param {Object} handlers - Callback handlers
 * @param {Function} handlers.onSuccess - Called when code === 200
 * @param {Function} handlers.onError - Called with error message when code >= 400
 * @param {string} handlers.fallbackError - Default error message
 */
export function handleApiResponse(response, handlers = {}) {
  const { onSuccess, onError, fallbackError = "Operation failed" } = handlers;

  if (isSuccessResponse(response)) {
    onSuccess?.(response.data, response);
    return { success: true, data: response.data, response };
  }

  const errorMsg = getErrorMessage(response, fallbackError);
  onError?.(errorMsg, response.code, response);
  return { success: false, error: errorMsg, code: response?.code, response };
}

/**
 * Async wrapper that handles both HTTP errors and API response codes
 * Usage:
 *   const result = await handleApiCall(
 *     () => deleteProject(id),
 *     { fallbackError: "Failed to delete project" }
 *   );
 *   if (result.success) { ... }
 *
 * @param {Function} apiCall - Async function that makes the API call
 * @param {Object} options - Handler options
 * @returns {Object} { success: boolean, data?, error?, code?, response? }
 */
export async function handleApiCall(apiCall, options = {}) {
  const { fallbackError = "Operation failed", onSuccess, onError } = options;

  try {
    const response = await apiCall();

    if (isSuccessResponse(response)) {
      onSuccess?.(response.data, response);
      return { success: true, data: response.data, response };
    }

    const errorMsg = getErrorMessage(response, fallbackError);
    onError?.(errorMsg, response?.code, response);
    return {
      success: false,
      error: errorMsg,
      code: response?.code,
      response
    };

  } catch (networkError) {
    // HTTP errors (4xx, 5xx) or network failures
    const errorMsg = networkError?.message || fallbackError;
    onError?.(errorMsg, networkError?.response?.status, networkError);
    return {
      success: false,
      error: errorMsg,
      code: networkError?.response?.status,
      isNetworkError: true
    };
  }
}
