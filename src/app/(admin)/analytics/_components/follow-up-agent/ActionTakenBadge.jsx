"use client";

import React from "react";
import { useI18n } from "@/hooks/useI18n";
import { ACTION_LABELS, resolveActionBadgeKey } from "@/constants/follow-up-agent";

export default function ActionTakenBadge({ actionTaken, followupKind }) {
  const { translate } = useI18n();
  const key = resolveActionBadgeKey(actionTaken, followupKind);
  const config = ACTION_LABELS[key] || ACTION_LABELS.unknown;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${config.className}`}
    >
      {translate(`analytics.followUpAgent.actions.${config.labelKey}`)}
    </span>
  );
}
