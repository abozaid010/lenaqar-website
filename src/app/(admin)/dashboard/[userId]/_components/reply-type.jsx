"use client";

import { useI18n } from "@/context/translate-api";
import { toggleAutoReply } from "@/utils/api";
import { useState } from "react";
import toast from "react-hot-toast";

const REPLY_OPTIONS = [
  { value: "auto_reply", labelKey: "Ai" },
  { value: "manual_reply", labelKey: "manual" },
];

export default function ToggleReplyType({ userId, clientID, source }) {
  const [autoReply, setAutoReply] = useState("auto_reply");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const handleChange = async (value) => {
    if (isLoading || value === autoReply) return;
    const previous = autoReply;
    setAutoReply(value);
    setIsLoading(true);

    const result = await toggleAutoReply(
      userId,
      clientID,
      value === "auto_reply",
      source,
    );

    if (result.success) {
      toast.success(t?.common?.autoReplyToggled);
    } else {
      setAutoReply(previous);
      toast.error(t?.common?.failedToToggleAutoReply);
    }
    setIsLoading(false);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t?.common?.autoReplyToggled || "Reply type"}
      aria-busy={isLoading}
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-md border border-gray-200 bg-gray-50 text-[11px] font-medium ${
        isLoading ? "opacity-70 pointer-events-none" : ""
      }`}
    >
      {REPLY_OPTIONS.map((option) => {
        const isActive = autoReply === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isLoading}
            onClick={() => handleChange(option.value)}
            className={`px-2 py-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
              isActive
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t?.[option.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
