"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

export default function NetworkBrokerCta({
  compact = false,
  className = "",
  onNavigate,
}) {
  const { translate } = useI18n();

  return (
    <div
      className={`rounded-xl border border-primary/15 bg-primary/[0.04] ${
        compact ? "p-3.5" : "p-4 sm:p-5"
      } ${className}`}
    >
      <p className="font-semibold text-primary">
        {translate("lenaqar.network.brokerCta.title")}
      </p>
      <p
        className={`mt-1.5 leading-relaxed text-black/70 ${
          compact ? "text-sm" : "text-sm sm:text-base"
        }`}
      >
        {translate("lenaqar.network.brokerCta.body")}
      </p>
      <Link
        href="/network"
        onClick={onNavigate}
        className={`${actionButtonClass({
          variant: "secondary",
          size: compact ? "compact" : "default",
        })} mt-3`}
      >
        {translate("lenaqar.header.joinNetwork")}
        <ActionButtonArrow size={compact ? "compact" : "default"} />
      </Link>
    </div>
  );
}
