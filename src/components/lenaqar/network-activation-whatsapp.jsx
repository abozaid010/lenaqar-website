"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { trackMetaContact } from "@/lib/meta-pixel";
import { ANALYTICS } from "@/constants/analytics";
import { getWhatsAppFallbackDelayMs } from "@/lib/lenaqar/whatsapp-fallback";
import {
  composeNetworkActivationMessage,
  networkActivationHref,
  readNetworkActivationName,
} from "@/lib/lenaqar/network-activation";

export default function NetworkActivationWhatsApp({ name = "" }) {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const [storedName, setStoredName] = useState(null);
  const redirectedRef = useRef(false);
  const delayMs = getWhatsAppFallbackDelayMs();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(1, Math.ceil(delayMs / 1000)),
  );

  useEffect(() => {
    setStoredName(readNetworkActivationName());
  }, []);

  const resolvedName = String(name || storedName || "").trim();
  const storageReady = Boolean(name) || storedName !== null;
  const message = composeNetworkActivationMessage(resolvedName, {
    withName: translate("lenaqar.network.pending.whatsappMessage"),
    withoutName: translate("lenaqar.network.pending.whatsappMessageAnonymous"),
  });
  const href = storageReady ? networkActivationHref(message) : "";

  useEffect(() => {
    if (!href) return undefined;
    redirectedRef.current = false;
    const totalSeconds = Math.max(1, Math.ceil(delayMs / 1000));
    setSecondsLeft(totalSeconds);

    const startedAt = Date.now();
    const tickId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, Math.ceil((delayMs - elapsed) / 1000));
      setSecondsLeft(left);
    }, 250);

    const redirectId = window.setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      trackMetaContact();
      trackEvent(ANALYTICS.EVENTS.NETWORK_ACTIVATION_WHATSAPP_CLICKED);
      window.location.assign(href);
    }, delayMs);

    return () => {
      window.clearInterval(tickId);
      window.clearTimeout(redirectId);
    };
  }, [href, delayMs, trackEvent]);

  const markOpened = () => {
    redirectedRef.current = true;
    trackMetaContact();
    trackEvent(ANALYTICS.EVENTS.NETWORK_ACTIVATION_WHATSAPP_CLICKED);
  };

  if (!href) return null;

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-black/65">
        {translate("lenaqar.network.pending.countdown").replace(
          "{seconds}",
          String(secondsLeft),
        )}
      </p>
      <a
        href={href}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#20BA5A] min-h-11"
        onClick={markOpened}
      >
        {translate("lenaqar.network.pending.whatsappCta")}
      </a>
    </div>
  );
}
