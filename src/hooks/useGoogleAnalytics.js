'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ANALYTICS, getGAScriptUrl, getGAConfig } from '@/constants/analytics';

export function useGoogleAnalytics() {
  const isInitializedRef = useRef(false);
  const isScriptLoadingRef = useRef(false);

  const initializeGA = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Skip if already initialized or currently loading
      if (isInitializedRef.current || isScriptLoadingRef.current) {
        resolve();
        return;
      }

      // Skip if gtag is already available
      if (typeof window.gtag !== 'undefined') {
        isInitializedRef.current = true;
        resolve();
        return;
      }

      isScriptLoadingRef.current = true;

      try {
        // Load GA script
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = getGAScriptUrl();
        
        script1.onload = () => {
          // Initialize GA configuration
          const script2 = document.createElement('script');
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${getGAConfig()}');
          `;
          document.head.appendChild(script2);
          
          isInitializedRef.current = true;
          isScriptLoadingRef.current = false;
          resolve();
        };

        script1.onerror = () => {
          isScriptLoadingRef.current = false;
          reject(new Error('Failed to load Google Analytics script'));
        };

        document.head.appendChild(script1);
      } catch (error) {
        isScriptLoadingRef.current = false;
        reject(error);
      }
    });
  }, []);

  const trackEvent = useCallback(async (eventName, eventParams = {}) => {
    try {
      await initializeGA();
      
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', eventName, {
          ...eventParams,
          page_location: window.location.href,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to track analytics event:', error?.message ?? error);
    }
  }, [initializeGA]);

  const trackPageView = useCallback(async (pagePath = null) => {
    try {
      await initializeGA();
      
      if (typeof window.gtag !== 'undefined') {
        window.gtag('config', getGAConfig(), {
          page_path: pagePath || window.location.pathname
        });
      }
    } catch (error) {
      console.warn('Failed to track page view:', error?.message ?? error);
    }
  }, [initializeGA]);

  return {
    initializeGA,
    trackEvent,
    trackPageView,
    isInitialized: isInitializedRef.current
  };
}
