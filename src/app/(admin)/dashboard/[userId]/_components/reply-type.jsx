"use client";

import { useI18n } from "@/hooks/useI18n";
import { toggleAutoReply } from "@/utils/api";
import {
  Bot,
  Check,
  CircleSlash,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function toReplyMode(enabled) {
  return enabled === false ? "manual_reply" : "auto_reply";
}

export default function ToggleReplyType({
  userId,
  clientID,
  source,
  initialEnabled,
}) {
  const [autoReply, setAutoReply] = useState(() => toReplyMode(initialEnabled));
  const [isLoading, setIsLoading] = useState(false);
  const { translate } = useI18n();
  const isAiOn = autoReply === "auto_reply";

  useEffect(() => {
    setAutoReply(toReplyMode(initialEnabled));
  }, [userId, initialEnabled]);

  const handleToggle = async () => {
    if (isLoading) return;
    const nextValue = isAiOn ? "manual_reply" : "auto_reply";
    const previous = autoReply;
    setAutoReply(nextValue);
    setIsLoading(true);

    try {
      const result = await toggleAutoReply(
        userId,
        clientID,
        nextValue === "auto_reply",
        source,
      );

      if (result.success) {
        toast.success(
          nextValue === "auto_reply"
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
      className={`inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        isLoading ? "opacity-70 cursor-wait" : "cursor-pointer"
      } ${
        isAiOn
          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
          <span>{translate("leadDetail.aiAutoReply.switching")}</span>
        </>
      ) : (
        <>
          <Bot
            className={`h-3.5 w-3.5 shrink-0 ${isAiOn ? "text-emerald-700" : "text-gray-400"}`}
            aria-hidden
          />
          {isAiOn ? (
            <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <CircleSlash className="h-3 w-3 shrink-0 text-gray-500" aria-hidden />
          )}
          <span className="whitespace-nowrap">
            {isAiOn
              ? translate("leadDetail.aiAutoReply.onLabel")
              : translate("leadDetail.aiAutoReply.offLabel")}
          </span>
          {isAiOn ? (
            <ToggleRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          ) : (
            <ToggleLeft className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          )}
        </>
      )}
    </button>
  );
}
