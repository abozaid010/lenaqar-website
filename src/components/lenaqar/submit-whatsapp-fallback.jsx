"use client";

import { useEffect, useRef, useState } from "react";
import { trackMetaContact } from "@/lib/meta-pixel";
import { getWhatsAppFallbackDelayMs } from "@/lib/lenaqar/whatsapp-fallback";

/**
 * Inline failure panel: shows error, WhatsApp CTA, and auto-opens WhatsApp after delay.
 */
export default function SubmitWhatsAppFallback({
  href,
  title,
  body,
  countdownLabel,
  ctaLabel,
  delayMs = getWhatsAppFallbackDelayMs(),
  onRedirect,
}) {
  const panelRef = useRef(null);
  const redirectedRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(1, Math.ceil(delayMs / 1000)),
  );

  useEffect(() => {
    panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [href]);

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
      onRedirect?.();
      window.location.assign(href);
    }, delayMs);

    return () => {
      window.clearInterval(tickId);
      window.clearTimeout(redirectId);
    };
  }, [href, delayMs, onRedirect]);

  if (!href) return null;

  return (
    <div
      ref={panelRef}
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-3"
    >
      <div className="space-y-1.5">
        <p className="font-semibold text-red-900">{title}</p>
        <p className="leading-relaxed text-red-800/90">{body}</p>
        <p className="text-red-700/90">
          {countdownLabel.replace("{seconds}", String(secondsLeft))}
        </p>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium px-4 py-2.5 text-sm shadow-sm transition-colors"
        onClick={() => {
          redirectedRef.current = true;
          trackMetaContact();
          onRedirect?.();
        }}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
