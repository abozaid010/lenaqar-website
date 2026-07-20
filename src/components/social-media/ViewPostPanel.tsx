"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { PostCommunicationActions } from "@/components/social-media/PostCommunicationActions";

export function ViewPostPanel({
  postContent,
  postUrl,
  groupName,
  groupUrl,
}: {
  postContent: string;
  postUrl: string | null;
  groupName: string;
  groupUrl: string;
}) {
  const { translate } = useI18n();
  const hasContent = Boolean(postContent?.trim());

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">
          {translate("socialMedia.table.postContent")}
        </div>
        <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {hasContent
            ? postContent
            : translate("socialMedia.comments.postContentUnavailable")}
        </div>
      </div>

      {hasContent ? <PostCommunicationActions postContent={postContent} /> : null}

      {groupName ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-600">
            {translate("socialMedia.table.groupName")}
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{groupName}</div>
          {groupUrl ? (
            <a
              href={groupUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <Link2 className="h-4 w-4" />
              {translate("socialMedia.actions.openGroup")}
            </a>
          ) : null}
        </div>
      ) : null}

      {postUrl ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-600">
            {translate("socialMedia.table.postUrl")}
          </div>
          <a
            href={postUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            {translate("socialMedia.actions.openUrl")}
          </a>
          <div className="mt-2 text-xs text-gray-600 break-all">{postUrl}</div>
        </div>
      ) : null}
    </div>
  );
}
