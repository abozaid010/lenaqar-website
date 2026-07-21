"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";

import { useI18n } from "@/hooks/useI18n";
import type { SocialComment } from "@/types/socialMedia";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useSocialMediaComments } from "@/hooks/social-media/useSocialMediaComments";
import { setDiscoveredPostReview } from "@/services/socialMedia";
import { SocialMediaHeader } from "@/components/social-media/SocialMediaHeader";
import { AiHandleCommentsButton } from "@/components/social-media/AiHandleCommentsButton";
import { DataTable } from "@/components/social-media/DataTable";
import { StatusBadge } from "@/components/social-media/StatusBadge";
import { Drawer } from "@/components/social-media/Drawer";
import { TableSkeleton } from "@/components/social-media/Skeletons";
import { SocialMediaPagination } from "@/components/social-media/SocialMediaPagination";
import { UrlLinkCell } from "@/components/social-media/UrlLinkCell";
import { CommentDetailPanel } from "@/components/social-media/CommentDetailPanel";
import { ViewPostPanel } from "@/components/social-media/ViewPostPanel";
import { ViewPostHeaderLinks } from "@/components/social-media/ViewPostHeaderLinks";

const PAGE_SIZE = 50;

type ReviewFilter = "all" | "not_reviewed" | "reviewed";

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "20 July, 2:00 am" (EN) / localized AR equivalent */
function formatCreatedDateTime(value: string | Date | null, locale: string) {
  if (!value) return "—";
  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return "—";

  const isAr = String(locale || "").toLowerCase().startsWith("ar");
  const loc = isAr ? "ar-EG" : "en-GB";
  const day = dateObj.toLocaleDateString(loc, { day: "numeric" });
  const month = dateObj.toLocaleDateString(loc, { month: "long" });

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? (isAr ? "م" : "pm") : isAr ? "ص" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const separator = isAr ? "،" : ",";

  return `${day} ${month}${separator} ${hours}:${minutes} ${ampm}`;
}

function matchesSearch(item: SocialComment, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    item.id.toLowerCase().includes(s) ||
    item.account_name.toLowerCase().includes(s) ||
    item.group_name.toLowerCase().includes(s) ||
    item.comment_text.toLowerCase().includes(s) ||
    (item.post_content || "").toLowerCase().includes(s) ||
    (item.post_url || "").toLowerCase().includes(s) ||
    item.group_url.toLowerCase().includes(s) ||
    (item.phone_number || "").toLowerCase().includes(s)
  );
}

function isCommentReviewed(
  comment: SocialComment,
  overrides: Record<string, boolean>,
): boolean {
  if (comment.post_id && comment.post_id in overrides) {
    return overrides[comment.post_id];
  }
  if (comment.id in overrides) return overrides[comment.id];
  return Boolean(comment.is_reviewed);
}

export default function CommentsPageClient() {
  const { translate, locale } = useI18n();
  const { canView, canEdit, isReady } = useModuleActions("social_media");
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const accountId = searchParams.get("account_id") || "";
  const postId = searchParams.get("post_id") || "";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const reviewFilter = (searchParams.get("is_reviewed") || "all") as ReviewFilter;

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewPostComment, setViewPostComment] = useState<SocialComment | null>(null);
  const [localAccountId, setLocalAccountId] = useState(accountId);
  const [localPostId, setLocalPostId] = useState(postId);
  const [reviewedOverrides, setReviewedOverrides] = useState<Record<string, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLocalAccountId(accountId);
  }, [accountId]);

  useEffect(() => {
    setLocalPostId(postId);
  }, [postId]);

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const { data, isLoading, isError, error, isFetching, refetch } = useSocialMediaComments({
    page,
    page_size: PAGE_SIZE,
    account_id: accountId || undefined,
    post_id: postId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const next = items.filter((c) => {
      if (!matchesSearch(c, search)) return false;
      const reviewed = isCommentReviewed(c, reviewedOverrides);
      if (reviewFilter === "reviewed") return reviewed;
      if (reviewFilter === "not_reviewed") return !reviewed;
      return true;
    });
    next.sort((a, b) => {
      const da = safeDate(a.created_at)?.getTime() ?? 0;
      const db = safeDate(b.created_at)?.getTime() ?? 0;
      return db - da;
    });
    return next;
  }, [items, search, reviewFilter, reviewedOverrides]);

  const total = data?.total ?? 0;

  const activeFilterCount = [
    accountId,
    postId,
    dateFrom,
    dateTo,
    reviewFilter !== "all" ? reviewFilter : "",
  ].filter(Boolean).length;

  const markCommentHandled = useCallback(
    async (comment: SocialComment) => {
      const discoveredPostId = (comment.post_id || "").trim();
      if (!discoveredPostId) {
        toast.error(
          translate(
            "socialMedia.actions.missingPostId",
            "Cannot mark handled: linked post id is missing.",
          ),
        );
        return;
      }
      if (isCommentReviewed(comment, reviewedOverrides)) return;

      await setDiscoveredPostReview(discoveredPostId, true);
      setReviewedOverrides((prev) => ({
        ...prev,
        [discoveredPostId]: true,
        [comment.id]: true,
      }));
      setViewPostComment((current) =>
        current && current.id === comment.id
          ? { ...current, is_reviewed: true }
          : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["social-media", "comments"] });
    },
    [queryClient, reviewedOverrides, translate],
  );

  if (isReady && !canView) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <div className="text-sm font-semibold text-amber-900">
          {translate("common.unauthorized")}
        </div>
        <div className="mt-2 text-sm text-amber-800">
          {translate("common.noPermissionToView")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SocialMediaHeader
        title={translate("socialMedia.comments.title")}
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["social-media", "comments"] });
          await refetch();
        }}
        isRefreshing={isFetching}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        activeFilterCount={activeFilterCount}
        extraActions={canEdit ? <AiHandleCommentsButton /> : null}
      />

      <div
        className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${
          filtersOpen ? "block" : "hidden"
        } lg:block`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {translate("socialMedia.filters.account")}
            </label>
            <input
              type="text"
              value={localAccountId}
              onChange={(e) => setLocalAccountId(e.target.value)}
              onBlur={() => {
                if (localAccountId === accountId) return;
                pushParams({
                  account_id: localAccountId.trim() || null,
                  page: "1",
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  pushParams({
                    account_id: localAccountId.trim() || null,
                    page: "1",
                  });
                }
              }}
              placeholder={translate("socialMedia.filters.accountPlaceholder")}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {translate("socialMedia.filters.post")}
            </label>
            <input
              type="text"
              value={localPostId}
              onChange={(e) => setLocalPostId(e.target.value)}
              onBlur={() => {
                if (localPostId === postId) return;
                pushParams({
                  post_id: localPostId.trim() || null,
                  page: "1",
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  pushParams({
                    post_id: localPostId.trim() || null,
                    page: "1",
                  });
                }
              }}
              placeholder={translate("socialMedia.filters.postPlaceholder")}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {translate("socialMedia.filters.reviewStatus", "Review")}
            </label>
            <select
              value={reviewFilter === "all" ? "all" : reviewFilter}
              onChange={(e) => {
                const value = e.target.value as ReviewFilter;
                pushParams({
                  is_reviewed: value === "all" ? null : value,
                  page: "1",
                });
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">
                {translate("socialMedia.filters.reviewAll", "All")}
              </option>
              <option value="not_reviewed">
                {translate("socialMedia.filters.notReviewed", "Not reviewed")}
              </option>
              <option value="reviewed">
                {translate("socialMedia.filters.reviewed", "Reviewed")}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {translate("socialMedia.filters.dateFrom")}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                pushParams({ date_from: e.target.value || null, page: "1" });
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {translate("socialMedia.filters.dateTo")}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                pushParams({ date_to: e.target.value || null, page: "1" });
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {(accountId || postId || dateFrom || dateTo || reviewFilter !== "all") && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setLocalAccountId("");
                setLocalPostId("");
                pushParams({
                  account_id: null,
                  post_id: null,
                  date_from: null,
                  date_to: null,
                  is_reviewed: null,
                  page: "1",
                });
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {translate("common.clear")}
            </button>
          </div>
        )}
      </div>

      <SocialMediaPagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(nextPage) => pushParams({ page: String(nextPage) })}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
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
      ) : (
        <DataTable
          columns={[
            { key: "account", header: translate("socialMedia.table.account") },
            { key: "status", header: translate("socialMedia.table.status") },
            { key: "createdAt", header: translate("socialMedia.table.createdAt") },
            { key: "text", header: translate("socialMedia.table.commentText") },
            { key: "viewPost", header: translate("socialMedia.actions.viewPost") },
            { key: "postUrl", header: translate("socialMedia.table.postUrl") },
            { key: "groupUrl", header: translate("socialMedia.table.groupUrl") },
          ]}
          rows={filtered.map((c) => {
            const reviewed = isCommentReviewed(c, reviewedOverrides);
            return {
              key: c.id,
              rowClassName: reviewed
                ? "bg-emerald-50 hover:bg-emerald-100/80"
                : "hover:bg-gray-50/70",
              cells: {
                account: <div className="font-medium text-gray-900">{c.account_name}</div>,
                status: <StatusBadge status={c.status} />,
                createdAt: (
                  <div className="text-xs text-gray-700 whitespace-nowrap">
                    {formatCreatedDateTime(safeDate(c.created_at) ?? c.created_at, locale)}
                  </div>
                ),
                text: (
                  <div className="max-w-[360px] line-clamp-2 text-gray-700" title={c.comment_text}>
                    {c.comment_text}
                  </div>
                ),
                viewPost: (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 whitespace-nowrap"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      setSelectedId(null);
                      setViewPostComment(c);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {translate("socialMedia.actions.viewPost")}
                  </button>
                ),
                postUrl: <UrlLinkCell url={c.post_url} variant="post" />,
                groupUrl: <UrlLinkCell url={c.group_url} variant="group" />,
              },
            };
          })}
          onRowClick={(id) => {
            setViewPostComment(null);
            setSelectedId(id);
          }}
          empty={
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-gray-900">
                {translate("socialMedia.emptyComments.title")}
              </div>
              <div className="text-gray-600">{translate("socialMedia.empty.subtitle")}</div>
            </div>
          }
        />
      )}

      <Drawer
        isOpen={selectedId != null}
        onClose={() => setSelectedId(null)}
        title={translate("socialMedia.comments.detailsTitle")}
      >
        {selectedId ? <CommentDetailPanel commentId={selectedId} /> : null}
      </Drawer>

      <Drawer
        isOpen={viewPostComment != null}
        onClose={() => setViewPostComment(null)}
        title={translate("socialMedia.comments.viewPostTitle")}
        fillHeight
        headerTrailing={
          viewPostComment ? (
            <ViewPostHeaderLinks
              groupName={viewPostComment.group_name}
              groupUrl={viewPostComment.group_url}
              postUrl={viewPostComment.post_url}
            />
          ) : null
        }
      >
        {viewPostComment ? (
          <ViewPostPanel
            postContent={viewPostComment.post_content || ""}
            phoneNumber={viewPostComment.phone_number}
            isReviewed={isCommentReviewed(viewPostComment, reviewedOverrides)}
            onHandled={() => markCommentHandled(viewPostComment)}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
