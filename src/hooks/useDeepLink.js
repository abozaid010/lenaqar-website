'use client';

import { useEffect, useRef } from 'react';
import { validateDeepLinkParams, createSafeDeepLinkUrl } from '@/utils/validation';

// Constants for configuration
const DEEP_LINK_TIMEOUT = 2000;
const FALLBACK_URL = '/download';
const VALID_TYPES = ['project', 'unit'];

// Enhanced app detection using multiple methods
const detectAppOpen = () => {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    let appOpened = false;
    
    // Method 1: Page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed < 1000) { // Likely app switch
          appOpened = true;
          cleanup();
          resolve(true);
        }
      }
    };
    
    // Method 2: Page hide event
    const handlePageHide = () => {
      appOpened = true;
      cleanup();
      resolve(true);
    };
    
    // Method 3: Window focus/blur
    const handleBlur = () => {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed < 1000) {
        appOpened = true;
        cleanup();
        resolve(true);
      }
    };
    
    // Method 4: Check if window is still focused after timeout
    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);
    
    // Fallback timeout
    setTimeout(() => {
      if (!appOpened) {
        cleanup();
        resolve(false);
      }
    }, DEEP_LINK_TIMEOUT);
  });
};

export function useDeepLink(type, id) {
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous deep link attempts
    if (isProcessingRef.current) {
      return;
    }

    // Validate and sanitize parameters
    const validation = validateDeepLinkParams({ type, id }, VALID_TYPES);
    
    if (!validation.isValid) {
      console.warn('Invalid deep link parameters');
      window.location.href = FALLBACK_URL;
      return;
    }

    isProcessingRef.current = true;

    const attemptDeepLink = async () => {
      try {
        // Create safe deep link URL
        const deepLinkUrl = createSafeDeepLinkUrl(validation.type, validation.id, VALID_TYPES);
        
        if (!deepLinkUrl) {
          throw new Error('Failed to create safe deep link URL');
        }
        
        // Attempt to open the app
        window.location.href = deepLinkUrl;
        
        // Wait to see if app opens
        const appOpened = await detectAppOpen();
        
        if (!appOpened) {
          window.location.href = FALLBACK_URL;
        }
      } catch (error) {
        console.error('Deep link error:', error instanceof Error ? error.message : String(error));
        window.location.href = FALLBACK_URL;
      } finally {
        isProcessingRef.current = false;
      }
    };

    attemptDeepLink();
  }, [type, id]);

  return {
    isValidType: VALID_TYPES.includes(type),
    fallbackUrl: FALLBACK_URL,
    isProcessing: isProcessingRef.current
  };
}
