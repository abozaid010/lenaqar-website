"use client";

import { ExternalLink, Link2, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { useSocialMediaCommentDetail } from "@/hooks/social-media/useSocialMediaCommentDetail";
import { StatusBadge } from "@/components/social-media/StatusBadge";
import { CopyIdButton } from "@/components/social-media/UrlLinkCell";
import { DetailSkeleton } from "@/components/social-media/Skeletons";

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function CommentDetailPanel({ commentId }: { commentId: string }) {
  const { translate, localeUtils } = useI18n();
  const { data, isLoading, isError, error, refetch } =
    useSocialMediaCommentDetail(commentId);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <div className="font-semibold">{translate("common.error")}</div>
        <div className="mt-1">
          {error instanceof Error ? error.message : translate("socialMedia.comments.loadError")}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800"
        >
          {translate("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <CopyIdButton id={data.id} />
        <StatusBadge status={data.status} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">
          {translate("socialMedia.comments.text")}
        </div>
        <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
          {data.comment_text}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">
          {translate("socialMedia.table.postContent")}
        </div>
        <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {data.post_content?.trim()
            ? data.post_content
            : translate("socialMedia.comments.postContentUnavailable")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-600">
            {translate("socialMedia.table.account")}
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{data.account_name}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-600">
            {translate("socialMedia.table.groupName")}
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{data.group_name}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-600">
              {translate("socialMedia.table.createdAt")}
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {data.created_at
                ? localeUtils.formatDate(safeDate(data.created_at) ?? data.created_at)
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600">
              {translate("socialMedia.table.publishedAt")}
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {data.published_at
                ? localeUtils.formatDate(safeDate(data.published_at) ?? data.published_at)
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {data.post_url ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-600">
            {translate("socialMedia.table.postUrl")}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href={data.post_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              {translate("socialMedia.actions.openUrl")}
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              onClick={() => {
                copyText(data.post_url!)
                  .then(() => toast.success(translate("common.copied")))
                  .catch(() => toast.error(translate("common.operationFailed")));
              }}
            >
              <Copy className="h-4 w-4" />
              {translate("socialMedia.actions.copyUrl")}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600 break-all">{data.post_url}</div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-xs font-semibold text-gray-600">
          {translate("socialMedia.table.groupUrl")}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <a
            href={data.group_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            <Link2 className="h-4 w-4" />
            {translate("socialMedia.actions.openGroup")}
          </a>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            onClick={() => {
              copyText(data.group_url)
                .then(() => toast.success(translate("common.copied")))
                .catch(() => toast.error(translate("common.operationFailed")));
            }}
          >
            <Copy className="h-4 w-4" />
            {translate("socialMedia.actions.copyUrl")}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600 break-all">{data.group_url}</div>
      </div>
    </div>
  );
}
