/**
 * API retry utilities with exponential backoff
 * Provides retry mechanisms for failed API requests
 */

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry configuration options
 * @typedef {Object} RetryOptions
 * @property {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @property {number} initialDelay - Initial delay in milliseconds (default: 2000)
 * @property {number} backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @property {number} maxDelay - Maximum delay in milliseconds (default: 10000)
 * @property {Function} shouldRetry - Function to determine if error should be retried
 * @property {Function} onRetry - Callback called before each retry attempt
 */

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelay: 2000, // 2 seconds as requested
  backoffMultiplier: 2,
  maxDelay: 10000,
  shouldRetry: (error) => {
    // Retry on network errors, 5xx server errors, and specific retryable errors
    if (!error.response) {
      // Network errors (no response)
      return true;
    }
    
    const status = error.response.status;
    const errorMessage = error.response?.data?.error_message || error.message;
    
    // Retry on 5xx server errors
    if (status >= 500) {
      return true;
    }
    
    // Retry on 429 rate limiting
    if (status === 429) {
      return true;
    }
    
    // Retry on specific service unavailable errors
    if (errorMessage.includes('Service temporarily unavailable') || 
        errorMessage.includes('ClientsCache')) {
      return true;
    }
    
    // Don't retry on 4xx client errors (except 429)
    if (status >= 400 && status < 500 && status !== 429) {
      return false;
    }
    
    return true;
  },
  onRetry: (attempt, error, delay) => {
    console.warn(`API retry attempt ${attempt}/${DEFAULT_RETRY_OPTIONS.maxRetries} after ${delay}ms delay:`, error.message);
  }
};

/**
 * Wraps an API function with retry logic
 * @param {Function} apiFunction - The API function to wrap
 * @param {RetryOptions} options - Retry configuration options
 * @returns {Function} Wrapped API function with retry logic
 */
export function withRetry(apiFunction, options = {}) {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  return async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        const result = await apiFunction(...args);
        
        // If successful and this was a retry, log the success
        if (attempt > 0) {
          console.log(`API request succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // If this is the last attempt, throw the error
        if (attempt === retryOptions.maxRetries) {
          console.error(`API request failed after ${retryOptions.maxRetries + 1} attempts:`, error.message);
          throw error;
        }
        
        // Check if we should retry this error
        if (!retryOptions.shouldRetry(error)) {
          console.error('API request failed with non-retryable error:', error.message);
          throw error;
        }
        
        // Calculate delay for this attempt
        const delay = Math.min(
          retryOptions.initialDelay * Math.pow(retryOptions.backoffMultiplier, attempt),
          retryOptions.maxDelay
        );
        
        // Call retry callback if provided
        if (retryOptions.onRetry) {
          retryOptions.onRetry(attempt + 1, error, delay);
        }
        
        // Wait before retrying
        await sleep(delay);
      }
    }
    
    // This should never be reached, but just in case
    throw lastError;
  };
}

/**
 * Creates a retry wrapper specifically for API calls with 2-second delay
 * @param {Function} apiFunction - The API function to wrap
 * @param {number} maxRetries - Maximum retry attempts (default: 2)
 * @returns {Function} Wrapped API function with 2-second retry delay
 */
export function with2SecondRetry(apiFunction, maxRetries = 2) {
  return withRetry(apiFunction, {
    maxRetries,
    initialDelay: 2000,
    backoffMultiplier: 1, // Fixed 2-second delay as requested
    maxDelay: 2000,
    shouldRetry: (error) => {
      // Retry on network errors and server errors
      if (!error.response) return true;
      
      const status = error.response.status;
      const errorMessage = error.response?.data?.error_message || error.message;
      
      // Retry on 5xx errors
      if (status >= 500) return true;
      
      // Retry on specific service errors
      if (errorMessage.includes('Service temporarily unavailable') || 
          errorMessage.includes('ClientsCache')) {
        return true;
      }
      
      return false;
    }
  });
}

/**
 * Batch retry utility for multiple API calls
 * @param {Array<Function>} apiFunctions - Array of API functions to execute
 * @param {RetryOptions} options - Retry configuration options
 * @returns {Promise<Array>} Array of results
 */
export async function batchRetry(apiFunctions, options = {}) {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const results = [];
  
  for (const apiFunction of apiFunctions) {
    try {
      const result = await withRetry(apiFunction, retryOptions)();
      results.push({ success: true, data: result, error: null });
    } catch (error) {
      results.push({ success: false, data: null, error });
    }
  }
  
  return results;
}

/**
 * Retry with circuit breaker pattern
 * @param {Function} apiFunction - The API function to wrap
 * @param {Object} circuitOptions - Circuit breaker options
 * @param {RetryOptions} retryOptions - Retry configuration options
 * @returns {Function} Wrapped API function with circuit breaker and retry
 */
export function withCircuitBreaker(apiFunction, circuitOptions = {}, retryOptions = {}) {
  const {
    failureThreshold = 5,
    recoveryTimeout = 60000, // 1 minute
    monitoringPeriod = 300000, // 5 minutes
  } = circuitOptions;
  
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  let failureCount = 0;
  let lastFailureTime = 0;
  let successCount = 0;
  
  return async (...args) => {
    const now = Date.now();
    
    // Check if circuit should be half-open
    if (state === 'OPEN' && now - lastFailureTime > recoveryTimeout) {
      state = 'HALF_OPEN';
      successCount = 0;
      console.log('Circuit breaker moving to HALF_OPEN state');
    }
    
    // If circuit is open, fail fast
    if (state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
    }
    
    try {
      const result = await withRetry(apiFunction, retryOptions)(...args);
      
      // Reset failure count on success
      failureCount = 0;
      
      // If in half-open, track successes
      if (state === 'HALF_OPEN') {
        successCount++;
        if (successCount >= 3) {
          state = 'CLOSED';
          console.log('Circuit breaker moving to CLOSED state');
        }
      }
      
      return result;
    } catch (error) {
      failureCount++;
      lastFailureTime = now;
      
      // Open circuit if threshold reached
      if (failureCount >= failureThreshold) {
        state = 'OPEN';
        console.error('Circuit breaker OPEN due to repeated failures');
      }
      
      throw error;
    }
  };
}
