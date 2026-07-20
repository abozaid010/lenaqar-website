"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

const headerLinkClass =
  "inline-flex items-center gap-1.5 h-9 max-w-[140px] sm:max-w-[180px] rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-900 hover:bg-gray-50";

/** Compact group / post URL actions for the View Post drawer header. */
export function ViewPostHeaderLinks({
  groupName,
  groupUrl,
  postUrl,
}: {
  groupName?: string | null;
  groupUrl?: string | null;
  postUrl?: string | null;
}) {
  const { translate } = useI18n();

  return (
    <>
      {groupName ? (
        groupUrl ? (
          <a
            href={groupUrl}
            target="_blank"
            rel="noreferrer"
            className={headerLinkClass}
            title={groupName}
            aria-label={translate("socialMedia.actions.openGroup")}
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{groupName}</span>
          </a>
        ) : (
          <span className={`${headerLinkClass} opacity-80`} title={groupName}>
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{groupName}</span>
          </span>
        )
      ) : null}

      {postUrl ? (
        <a
          href={postUrl}
          target="_blank"
          rel="noreferrer"
          className={headerLinkClass}
          title={postUrl}
          aria-label={translate("socialMedia.actions.openUrl")}
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {translate("socialMedia.actions.openUrl")}
          </span>
        </a>
      ) : null}
    </>
  );
}
