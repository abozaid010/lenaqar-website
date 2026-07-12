"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getCallPhoneValue,
  getTelHref,
  markAndroidCallTipSeen,
  shouldShowAndroidCallTip,
} from "@/components/phone/tel-link";

/**
 * Shared tel: click handling: E.164 href + optional Android first-use tip.
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

  const onTelClick = useCallback(
    (e) => {
      if (!telHref) {
        e.preventDefault();
        return false;
      }
      if (shouldShowAndroidCallTip()) {
        e.preventDefault();
        setTipOpen(true);
        return false;
      }
      return true;
    },
    [telHref]
  );

  const dismissTip = useCallback(() => {
    markAndroidCallTipSeen();
    setTipOpen(false);
  }, []);

  const continueFromTip = useCallback(() => {
    markAndroidCallTipSeen();
    setTipOpen(false);
    if (telHref) {
      window.location.href = telHref;
    }
  }, [telHref]);

  return {
    phoneValue,
    telHref,
    tipOpen,
    onTelClick,
    dismissTip,
    continueFromTip,
    setTipOpen,
  };
}
