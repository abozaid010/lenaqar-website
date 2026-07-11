/**
 * Standardized API error handling utilities
 * Provides consistent error response structures across all API functions
 */

// Error types for classification
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  SERVER: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP status code mappings
const STATUS_CODE_MAPPINGS = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.AUTHORIZATION,
  404: ERROR_TYPES.NOT_FOUND,
  408: ERROR_TYPES.TIMEOUT,
  422: ERROR_TYPES.VALIDATION,
  429: ERROR_TYPES.SERVER,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.TIMEOUT
};

/**
 * Creates a standardized API response object
 * @param {boolean} success - Whether the operation was successful
 * @param {any} data - The response data
 * @param {string|null} error - Error message if any
 * @param {string|null} errorType - Type of error
 * @param {number|null} statusCode - HTTP status code
 * @param {object|null} metadata - Additional metadata
 * @returns {object} Standardized response object
 */
export function createApiResponse({
  success = false,
  data = null,
  error = null,
  errorType = null,
  statusCode = null,
  metadata = {}
} = {}) {
  return {
    success,
    data,
    error,
    errorType,
    statusCode,
    metadata,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} type - Error type
 * @param {number|null} statusCode - HTTP status code
 * @param {object|null} details - Additional error details
 * @returns {object} Standardized error response
 */
export function createApiError(message, type = ERROR_TYPES.UNKNOWN, statusCode = null, details = null) {
  return createApiResponse({
    success: false,
    error: message,
    errorType: type,
    statusCode,
    metadata: { details }
  });
}

/**
 * Extracts error information from axios error object
 * @param {Error} error - The error object from axios
 * @returns {object} Standardized error information
 */
export function extractErrorInfo(error) {
  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout. Please try again.',
        type: ERROR_TYPES.TIMEOUT,
        statusCode: null,
        details: { originalError: error.message }
      };
    }
    
    if (error.message === 'Network Error') {
      return {
        message: 'Network connection failed. Please check your internet connection.',
        type: ERROR_TYPES.NETWORK,
        statusCode: null,
        details: { originalError: error.message }
      };
    }

    return {
      message: error.message || 'An unknown error occurred',
      type: ERROR_TYPES.UNKNOWN,
      statusCode: null,
      details: { originalError: error.message }
    };
  }

  // HTTP errors
  const statusCode = error.response.status;
  const responseData = error.response.data;
  
  // Extract error message from response
  let errorMessage = responseData?.error_message || 
                    responseData?.message || 
                    responseData?.error || 
                    `HTTP ${statusCode} Error`;
  
  // Special handling for 500 errors that might be ClientsCache related
  if (statusCode === 500 && errorMessage.includes('ClientsCache')) {
    errorMessage = 'Service temporarily unavailable. Please try again.';
    return {
      message: errorMessage,
      type: ERROR_TYPES.SERVER,
      statusCode,
      details: { 
        responseData,
        originalError: error.message,
        isRetryable: true,
        originalErrorType: 'ClientsCache undefined'
      }
    };
  }
  
  // Handle validation errors with field details
  if (statusCode === 422 && responseData?.errors) {
    errorMessage = 'Validation failed';
    return {
      message: errorMessage,
      type: ERROR_TYPES.VALIDATION,
      statusCode,
      details: { 
        validationErrors: responseData.errors,
        originalError: error.message
      }
    };
  }

  // Map status code to error type
  const errorType = STATUS_CODE_MAPPINGS[statusCode] || ERROR_TYPES.UNKNOWN;

  return {
    message: errorMessage,
    type: errorType,
    statusCode,
    details: { 
      responseData,
      originalError: error.message
    }
  };
}

/**
 * Wraps API function calls with standardized error handling
 * @param {Function} apiFunction - The API function to wrap
 * @param {object} options - Configuration options
 * @returns {Function} Wrapped API function
 */
export function withErrorHandling(apiFunction, options = {}) {
  return async (...args) => {
    try {
      const result = await apiFunction(...args);
      
      // Handle successful responses
      if (result?.status === true || result?.code === 200) {
        return createApiResponse({
          success: true,
          data: result.data || result,
          statusCode: result.code || 200,
          metadata: { originalResponse: result }
        });
      }
      
      // Handle API-level errors (status: false)
      if (result?.status === false) {
        let errorMessage = result?.error_message || result?.message || 'API request failed';
        
        // Special handling for ClientsCache undefined errors
        if (errorMessage.includes('ClientsCache') && errorMessage.includes('not defined')) {
          errorMessage = 'Service temporarily unavailable. Please try again.';
          return createApiError(
            errorMessage,
            ERROR_TYPES.SERVER,
            result.code || 503,
            { 
              apiResponse: result,
              isRetryable: true,
              originalError: 'ClientsCache undefined'
            }
          );
        }
        
        return createApiError(
          errorMessage,
          ERROR_TYPES.SERVER,
          result.code || 400,
          { apiResponse: result }
        );
      }
      
      // Handle unexpected successful response formats
      return createApiResponse({
        success: true,
        data: result,
        metadata: { warning: 'Unexpected response format' }
      });
      
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`API Error [${errorInfo.type}]:`, {
          message: errorInfo.message,
          statusCode: errorInfo.statusCode,
        });
      }
      
      return createApiError(
        errorInfo.message,
        errorInfo.type,
        errorInfo.statusCode,
        errorInfo.details
      );
    }
  };
}

/**
 * Checks if an error is retryable based on its type
 * @param {object} errorResponse - Standardized error response
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(errorResponse) {
  const retryableTypes = [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.SERVER
  ];
  
  return retryableTypes.includes(errorResponse.errorType) && 
         (errorResponse.statusCode === null || errorResponse.statusCode >= 500);
}

/**
 * Gets a user-friendly error message based on error type
 * @param {object} errorResponse - Standardized error response
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(errorResponse) {
  const { errorType, message } = errorResponse;
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'Connection failed. Please check your internet connection and try again.';
    case ERROR_TYPES.TIMEOUT:
      return 'Request timed out. Please try again.';
    case ERROR_TYPES.AUTHENTICATION:
      return 'Please log in to continue.';
    case ERROR_TYPES.AUTHORIZATION:
      return 'You don\'t have permission to perform this action.';
    case ERROR_TYPES.NOT_FOUND:
      return 'The requested resource was not found.';
    case ERROR_TYPES.VALIDATION:
      return message || 'Please check your input and try again.';
    case ERROR_TYPES.SERVER:
      return 'Server error occurred. Please try again later.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
}
