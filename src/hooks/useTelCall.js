"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  getCallPhoneValue,
  getTelHref,
  markAndroidCallTipSeen,
  shouldShowAndroidCallTip,
} from "@/components/phone/tel-link";

/**
 * How long to wait after initiating a `tel:` navigation before deciding the
 * phone app failed to open. If the tab is backgrounded/hidden/blurred (the OS
 * handed off to the dialer) within this window we treat the call as placed.
 */
const CALL_HANDOFF_TIMEOUT_MS = 1500;

/**
 * Shared tel: click handling.
 *
 * Responsibilities:
 * - Build the E.164 `tel:` href.
 * - Drive the navigation ourselves (inside the user gesture) so a concurrent
 *   SPA navigation triggered by the same tap can't cancel the OS handoff.
 * - Optionally show the one-time Android "pick your dialer" tip.
 * - Detect when the phone app did not open and surface a copy-number fallback.
 */
export function useTelCall(rawPhone, defaultCountry = "EG") {
  const phoneValue = useMemo(
    () => getCallPhoneValue(rawPhone, defaultCountry),
    [rawPhone, defaultCountry]
  );
  const telHref = useMemo(
    () => getTelHref(rawPhone, defaultCountry),
    [rawPhone, defaultCountry]
  );
  const [tipOpen, setTipOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const watchdogRef = useRef(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      watchdogRef.current();
      watchdogRef.current = null;
    }
  }, []);

  /**
   * Initiate the phone call. Must run synchronously inside the user gesture
   * (iOS Safari requires the navigation to be user-activated). Arms a watchdog
   * that opens the fallback dialog if the OS never took over.
   */
  const placeCall = useCallback(() => {
    if (!telHref || typeof window === "undefined") return;

    setFallbackOpen(false);
    clearWatchdog();

    let handedOff = false;
    const markHandedOff = () => {
      handedOff = true;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") handedOff = true;
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", markHandedOff);
    window.addEventListener("blur", markHandedOff);

    const cleanupListeners = () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", markHandedOff);
      window.removeEventListener("blur", markHandedOff);
    };

    const startedAt = Date.now();

    try {
      // User-activated navigation to the dialer. Assigning location.href keeps
      // this reliable even while the app performs its own soft navigation.
      window.location.href = telHref;
    } catch {
      cleanupListeners();
      setFallbackOpen(true);
      return;
    }

    const timer = window.setTimeout(() => {
      cleanupListeners();
      watchdogRef.current = null;

      // Large timer drift means the tab was frozen while another app was
      // foregrounded (the dialer opened). A real hand-off freezes the tab for
      // seconds, so a wide margin keeps slow-but-foregrounded desktops from
      // being misread as a successful call.
      const elapsed = Date.now() - startedAt;
      const backgrounded =
        handedOff ||
        document.visibilityState === "hidden" ||
        elapsed > CALL_HANDOFF_TIMEOUT_MS + 1000;

      const stillFocused =
        typeof document.hasFocus !== "function" || document.hasFocus();

      if (!backgrounded && stillFocused) {
        setFallbackOpen(true);
      }
    }, CALL_HANDOFF_TIMEOUT_MS);

    watchdogRef.current = () => {
      window.clearTimeout(timer);
      cleanupListeners();
    };
  }, [telHref, clearWatchdog]);

  /**
   * Anchor/button tap handler. Always prevents the default navigation and
   * drives the call itself. `onAfterTap` (e.g. selecting the lead) is deferred
   * to the next tick so its SPA navigation can't preempt the OS handoff.
   */
  const onTelClick = useCallback(
    (e, onAfterTap) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();

      if (typeof onAfterTap === "function") {
        window.setTimeout(() => onAfterTap(e), 0);
      }

      if (!telHref) return false;

      if (shouldShowAndroidCallTip()) {
        setTipOpen(true);
        return false;
      }

      placeCall();
      return false;
    },
    [telHref, placeCall]
  );

  const dismissTip = useCallback(() => {
    markAndroidCallTipSeen();
    setTipOpen(false);
  }, []);

  const continueFromTip = useCallback(() => {
    markAndroidCallTipSeen();
    setTipOpen(false);
    placeCall();
  }, [placeCall]);

  const dismissFallback = useCallback(() => {
    clearWatchdog();
    setFallbackOpen(false);
  }, [clearWatchdog]);

  const retryCall = useCallback(() => {
    setFallbackOpen(false);
    placeCall();
  }, [placeCall]);

  return {
    phoneValue,
    telHref,
    tipOpen,
    fallbackOpen,
    onTelClick,
    dismissTip,
    continueFromTip,
    dismissFallback,
    retryCall,
  };
}
