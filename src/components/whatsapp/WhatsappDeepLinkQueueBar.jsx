"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  clearWhatsappDeepLinkQueue,
  getWhatsappDeepLinkQueue,
  openNextQueuedWhatsappDeepLink,
  skipNextQueuedWhatsappDeepLink,
  subscribeWhatsappDeepLinkQueue,
} from "@/lib/whatsapp-deeplink-queue";
import toast from "react-hot-toast";

/**
 * Sticky bottom bar for sequential WhatsApp sends on phones / tablets / iPad.
 * Each “Open next” tap is a fresh user gesture (required by iOS/Android).
 */
export default function WhatsappDeepLinkQueueBar() {
  const { translate, locale } = useI18n();
  const isRTL = locale === "ar";
  const [queue, setQueue] = useState(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    setQueue(getWhatsappDeepLinkQueue());
    return subscribeWhatsappDeepLinkQueue(setQueue);
  }, []);

  // When the user returns from WhatsApp, draw attention to “Open next”.
  useEffect(() => {
    if (!queue?.remaining?.length) return undefined;

    let highlightTimer;

    const pulse = () => {
      setQueue(getWhatsappDeepLinkQueue());
      setHighlight(true);
      window.clearTimeout(highlightTimer);
      highlightTimer = window.setTimeout(() => setHighlight(false), 1800);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") pulse();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", pulse);
    window.addEventListener("focus", pulse);

    return () => {
      window.clearTimeout(highlightTimer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", pulse);
      window.removeEventListener("focus", pulse);
    };
  }, [queue?.remaining?.length]);

  if (!queue?.remaining?.length) return null;

  const total = queue.total || queue.openedCount + queue.remaining.length;
  const current = Math.min((queue.openedCount || 0) + 1, total);
  const nextPhone = queue.remaining[0]?.phone
    ? `+${queue.remaining[0].phone}`
    : "";

  const handleOpenNext = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
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
    clearWhatsappDeepLinkQueue();
  };

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
              className="flex-1 min-w-[8.5rem] px-3 py-2.5 min-h-11 rounded-md bg-primary text-white text-sm font-semibold hover:opacity-90 inline-flex items-center justify-center"
            >
              {translate("whatsappSend.deeplinkQueueOpenNext", "Open next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
