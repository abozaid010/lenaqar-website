"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  clearWhatsappDeepLinkQueue,
  getWhatsappDeepLinkQueue,
  openNextQueuedWhatsappDeepLink,
  skipNextQueuedWhatsappDeepLink,
  subscribeWhatsappDeepLinkQueue,
} from "@/lib/whatsapp-deeplink-queue";
import { WHATSAPP_DEEPLINK_DELAY_MS } from "@/lib/whatsapp-deeplink-send";
import toast from "react-hot-toast";

/**
 * Sticky bottom bar for sequential WhatsApp sends on phones / tablets / iPad.
 * Each “Open next” tap is a fresh user gesture (required by iOS/Android).
 * After returning from WhatsApp, a short countdown prevents accidental mash-taps.
 */
export default function WhatsappDeepLinkQueueBar() {
  const { translate, locale } = useI18n();
  const isRTL = locale === "ar";
  const [queue, setQueue] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const cooldownTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    setQueue(getWhatsappDeepLinkQueue());
    return subscribeWhatsappDeepLinkQueue(setQueue);
  }, []);

  const clearCooldown = () => {
    if (cooldownTimerRef.current) {
      window.clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setCooldownSec(0);
  };

  const startCooldown = () => {
    clearCooldown();
    const totalSec = Math.max(
      1,
      Math.round(WHATSAPP_DEEPLINK_DELAY_MS / 1000),
    );
    setCooldownSec(totalSec);
    setHighlight(false);

    cooldownTimerRef.current = window.setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            window.clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          setHighlight(true);
          window.clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = window.setTimeout(
            () => setHighlight(false),
            1800,
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // When the user returns from WhatsApp, start the 5s ready countdown.
  useEffect(() => {
    if (!queue?.remaining?.length) {
      clearCooldown();
      return undefined;
    }

    let wasHidden = document.visibilityState === "hidden";

    const onReturnFromBackground = () => {
      setQueue(getWhatsappDeepLinkQueue());
      startCooldown();
    };

    const onVisible = () => {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        return;
      }
      if (wasHidden) {
        wasHidden = false;
        onReturnFromBackground();
      }
    };

    const onPageShow = (event) => {
      // bfcache restore after OS suspended the tab during app handoff
      if (event?.persisted) {
        wasHidden = false;
        onReturnFromBackground();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      clearCooldown();
      window.clearTimeout(highlightTimerRef.current);
    };
    // Only rebind when queue presence changes — not every cooldown tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue?.remaining?.length]);

  if (!queue?.remaining?.length) return null;

  const total = queue.total || queue.openedCount + queue.remaining.length;
  const current = Math.min((queue.openedCount || 0) + 1, total);
  const nextPhone = queue.remaining[0]?.phone
    ? `+${queue.remaining[0].phone}`
    : "";
  const openNextDisabled = cooldownSec > 0;

  const handleOpenNext = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (openNextDisabled) return;
    const result = openNextQueuedWhatsappDeepLink();
    if (!result) return;
    if (result.done) {
      toast.success(
        translate(
          "whatsappSend.deeplinkSequentialDone",
          "All WhatsApp chats opened. Send each message manually.",
        ),
      );
    }
  };

  const handleSkip = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    clearCooldown();
    const result = skipNextQueuedWhatsappDeepLink();
    if (!result || result.done) {
      toast.success(
        translate(
          "whatsappSend.deeplinkSequentialDone",
          "All WhatsApp chats opened. Send each message manually.",
        ),
      );
    }
  };

  const handleDismiss = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    clearCooldown();
    clearWhatsappDeepLinkQueue();
  };

  const openNextLabel = openNextDisabled
    ? translate(
        "whatsappSend.deeplinkQueueCooldown",
        "Ready in {seconds}…",
      ).replace("{seconds}", String(cooldownSec))
    : translate("whatsappSend.deeplinkQueueOpenNext", "Open next");

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] pointer-events-none"
      dir={isRTL ? "rtl" : "ltr"}
      role="region"
      aria-label={translate(
        "whatsappSend.deeplinkQueueRegion",
        "WhatsApp send queue",
      )}
    >
      <div
        className={`pointer-events-auto mx-auto w-full max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 transition-transform duration-300 ${
          highlight ? "-translate-y-1" : ""
        }`}
      >
        <div
          className={`rounded-xl border bg-white shadow-lg p-3 sm:p-4 space-y-3 ${
            highlight
              ? "border-primary ring-2 ring-primary/30"
              : "border-gray-200"
          }`}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              {translate(
                "whatsappSend.deeplinkQueueTitle",
                "WhatsApp {current} of {total}",
              )
                .replace("{current}", String(current))
                .replace("{total}", String(total))}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {translate(
                "whatsappSend.deeplinkQueueHint",
                "Send the open chat in WhatsApp, then come back and tap Open next. Each chat needs its own tap on phone and tablet.",
              )}
            </p>
            {nextPhone ? (
              <p className="text-xs font-medium text-gray-800 truncate" dir="ltr">
                {translate(
                  "whatsappSend.deeplinkQueueNext",
                  "Next: {phone}",
                ).replace("{phone}", nextPhone)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="shrink-0 px-3 py-2.5 min-h-11 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {translate("whatsappSend.deeplinkQueueSkip", "Skip")}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 px-3 py-2.5 min-h-11 rounded-md text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            >
              {translate("whatsappSend.deeplinkQueueDismiss", "Done")}
            </button>
            <button
              type="button"
              onClick={handleOpenNext}
              disabled={openNextDisabled}
              aria-disabled={openNextDisabled}
              className="flex-1 min-w-[8.5rem] px-3 py-2.5 min-h-11 rounded-md bg-primary text-white text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
            >
              {openNextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
