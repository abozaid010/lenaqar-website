'use client';

import { useCallback, useEffect } from 'react';
import {
  initMetaPixel,
  trackMetaContact,
  trackMetaLead,
  trackMetaPageView,
  trackMetaViewContent,
} from '@/lib/meta-pixel';
import { isMetaPixelEnabled } from '@/constants/analytics';

/**
 * Client hook for Meta Pixel — script init + event helpers.
 * Route PageView / ViewContent are handled by MetaPixelProvider in the root layout.
 */
export function useMetaPixel() {
  useEffect(() => {
    if (isMetaPixelEnabled()) {
      initMetaPixel();
    }
  }, []);

  const trackPageView = useCallback(() => trackMetaPageView(), []);
  const trackViewContent = useCallback((params) => trackMetaViewContent(params), []);
  const trackContact = useCallback((params) => trackMetaContact(params), []);
  const trackLead = useCallback((params) => trackMetaLead(params), []);

  return {
    isEnabled: isMetaPixelEnabled(),
    trackPageView,
    trackViewContent,
    trackContact,
    trackLead,
  };
}
