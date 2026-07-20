"use client";

import { useI18n } from "@/hooks/useI18n";
import { PostCommunicationActions } from "@/components/social-media/PostCommunicationActions";

export function ViewPostPanel({
  postContent,
  phoneNumber = null,
  isReviewed = false,
  onHandled,
}: {
  postContent: string;
  phoneNumber?: string | null;
  isReviewed?: boolean;
  onHandled?: () => void | Promise<void>;
}) {
  const { translate } = useI18n();
  const hasContent = Boolean(postContent?.trim());

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shrink-0 max-h-[40%] overflow-y-auto">
        <div className="text-sm font-semibold text-gray-900">
          {translate("socialMedia.table.postContent")}
        </div>
        <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {hasContent
            ? postContent
            : translate("socialMedia.comments.postContentUnavailable")}
        </div>
      </div>

      {hasContent || onHandled ? (
        <PostCommunicationActions
          postContent={postContent}
          phoneNumber={phoneNumber}
          isReviewed={isReviewed}
          onHandled={onHandled}
          className="flex-1 min-h-0"
        />
      ) : null}
    </div>
  );
}
