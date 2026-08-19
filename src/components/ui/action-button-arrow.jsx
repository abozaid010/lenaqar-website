"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

/** Direction-aware arrow for the shared Buy/Sell action buttons. */
export default function ActionButtonArrow({ size = "default" }) {
  const { isRTL } = useI18n();
  if (size === "compact") return null;
  const Icon = isRTL ? ArrowLeft : ArrowRight;
  return (
    <Icon
      aria-hidden="true"
      className={`size-4 shrink-0 transition-transform duration-200 ${
        isRTL ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"
      }`}
    />
  );
}
