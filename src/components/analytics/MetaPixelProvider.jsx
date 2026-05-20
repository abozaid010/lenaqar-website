'use client';

import { META_PIXEL, isMetaPixelEnabled } from '@/constants/analytics';
import {
  initMetaPixel,
  isWhatsAppClickTarget,
  trackMetaContact,
  trackMetaPageView,
  trackMetaViewContent,
} from '@/lib/meta-pixel';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

function pathnameMatchesViewContent(pathname) {
  return META_PIXEL.VIEW_CONTENT_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default function MetaPixelProvider({ children }) {
  const pathname = usePathname();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    if (!isMetaPixelEnabled()) return;
    initMetaPixel();
  }, []);

  useEffect(() => {
    if (!isMetaPixelEnabled() || !pathname) return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    trackMetaPageView();

    if (pathnameMatchesViewContent(pathname)) {
      trackMetaViewContent({ content_name: pathname });
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMetaPixelEnabled()) return;

    const handleClick = (event) => {
      if (!isWhatsAppClickTarget(event.target)) return;
      trackMetaContact();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return children;
}
