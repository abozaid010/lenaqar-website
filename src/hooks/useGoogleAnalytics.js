'use client';

import { trackGa } from '@/lib/analytics';

/**
 * Kept so existing call sites (`const { trackEvent } = useGoogleAnalytics()`) keep working.
 * gtag.js is loaded once in src/app/layout.jsx; this hook no longer loads scripts.
 * trackGa is a module-level function, so its identity is stable across renders.
 */
export function useGoogleAnalytics() {
  return { trackEvent: trackGa };
}
