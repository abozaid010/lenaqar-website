'use client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const AnalyticsErrorFallback = () => {
  // Silently fail for analytics errors - don't break the UI
  return null;
};

export default function AnalyticsErrorBoundary({ children }) {
  const handleAnalyticsError = (error, errorInfo) => {
    // Log analytics errors but don't disrupt user experience
    console.warn('Analytics error caught:', error.message);
    
    // Optionally send to error reporting service
    if (typeof window.gtag !== 'undefined') {
      try {
        window.gtag('event', 'analytics_error', {
          error_message: error.message,
          error_stack: error.stack?.substring(0, 500) // Limit stack trace length
        });
      } catch (e) {
        // Avoid infinite loops if gtag itself is broken
        console.warn('Failed to report analytics error:', e);
      }
    }
  };

  return (
    <ErrorBoundary
      fallback={<AnalyticsErrorFallback />}
      onError={handleAnalyticsError}
    >
      {children}
    </ErrorBoundary>
  );
}
