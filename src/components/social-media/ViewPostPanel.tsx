"use client";

import { useI18n } from "@/hooks/useI18n";
import { PostCommunicationActions } from "@/components/social-media/PostCommunicationActions";

export function ViewPostPanel({ postContent }: { postContent: string }) {
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
    </div>
  );
}
