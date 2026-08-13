"use client";

import { useEffect } from "react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";

export default function UnitViewTracker({ code }) {
  const { trackEvent } = useGoogleAnalytics();

  useEffect(() => {
    if (!code) return;
    trackEvent(ANALYTICS.EVENTS.UNIT_VIEWED, { unit_code: code });
  }, [code, trackEvent]);

  return null;
}
