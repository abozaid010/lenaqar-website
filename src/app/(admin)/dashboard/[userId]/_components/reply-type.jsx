"use client";

import { useI18n } from "@/hooks/useI18n";
import { toggleAutoReply } from "@/utils/api";
import { Ban, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/** Only accept an explicit boolean from the API — never invent on/off. */
function toReplyMode(enabled) {
  if (enabled === true) return "auto_reply";
  if (enabled === false) return "manual_reply";
  return null;
}

export default function ToggleReplyType({
  userId,
  clientID,
  initialEnabled,
  onEnabledChange,
}) {
  const [autoReply, setAutoReply] = useState(() => toReplyMode(initialEnabled));
  const [isLoading, setIsLoading] = useState(false);
  const { translate } = useI18n();
  const isAiOn = autoReply === "auto_reply";
  const hasKnownStatus = autoReply !== null;

  useEffect(() => {
    const next = toReplyMode(initialEnabled);
    // Keep prior known status only while a new lead's value is still loading —
    // never coerce undefined/null into on or off.
    if (next !== null) {
      setAutoReply(next);
    } else if (userId) {
      setAutoReply(null);
    }
  }, [userId, initialEnabled]);

  const handleToggle = async () => {
    if (isLoading || !hasKnownStatus) return;
    const nextValue = isAiOn ? "manual_reply" : "auto_reply";
    const nextEnabled = nextValue === "auto_reply";
    const previous = autoReply;
    setAutoReply(nextValue);
    setIsLoading(true);

    try {
      const result = await toggleAutoReply(userId, clientID, nextEnabled);

      if (result.success) {
        onEnabledChange?.(nextEnabled);
        toast.success(
          nextEnabled
            ? translate("leadDetail.aiAutoReply.toastOn")
            : translate("leadDetail.aiAutoReply.toastOff"),
        );
      } else {
        setAutoReply(previous);
        toast.error(translate("common.failedToToggleAutoReply"));
      }
    } catch {
      setAutoReply(previous);
      toast.error(translate("common.failedToToggleAutoReply"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasKnownStatus) {
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        aria-label={translate("leadDetail.aiAutoReply.ariaLabel")}
        className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 bg-gray-50 text-gray-400 cursor-wait"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
        <span>{translate("leadDetail.aiAutoReply.switching")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAiOn}
      aria-busy={isLoading}
      aria-label={translate("leadDetail.aiAutoReply.ariaLabel")}
      title={
        isAiOn
          ? translate("leadDetail.aiAutoReply.onTitle")
          : translate("leadDetail.aiAutoReply.offTitle")
      }
      disabled={isLoading}
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        isLoading ? "opacity-70 cursor-wait" : "cursor-pointer"
      } ${
        isAiOn
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-white text-red-600 border-red-200 hover:bg-red-50"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
          <span>{translate("leadDetail.aiAutoReply.switching")}</span>
        </>
      ) : (
        <>
          {isAiOn ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Ban className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
          )}
          <span className="whitespace-nowrap">
            {isAiOn
              ? translate("leadDetail.aiAutoReply.onLabel")
              : translate("leadDetail.aiAutoReply.offLabel")}
          </span>
        </>
      )}
    </button>
  );
}
