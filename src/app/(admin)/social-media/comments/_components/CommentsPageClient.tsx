"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useI18n } from "@/hooks/useI18n";
import type { SocialComment } from "@/types/socialMedia";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useSocialMediaComments } from "@/hooks/social-media/useSocialMediaComments";
import { SocialMediaHeader } from "@/components/social-media/SocialMediaHeader";
import { DataTable } from "@/components/social-media/DataTable";
import { StatusBadge } from "@/components/social-media/StatusBadge";
import { Drawer } from "@/components/social-media/Drawer";
import { TableSkeleton } from "@/components/social-media/Skeletons";
import { SocialMediaPagination } from "@/components/social-media/SocialMediaPagination";
import { UrlLinkCell } from "@/components/social-media/UrlLinkCell";
import { CommentDetailPanel } from "@/components/social-media/CommentDetailPanel";

const PAGE_SIZE = 50;

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchesSearch(item: SocialComment, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    item.id.toLowerCase().includes(s) ||
    item.account_name.toLowerCase().includes(s) ||
    item.group_name.toLowerCase().includes(s) ||
    item.comment_text.toLowerCase().includes(s) ||
    (item.post_url || "").toLowerCase().includes(s) ||
    item.group_url.toLowerCase().includes(s)
  );
}

export default function CommentsPageClient() {
  const { translate, localeUtils } = useI18n();
  const { canView, isReady } = useModuleActions("social-media");
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const accountId = searchParams.get("account_id") || "";
  const postId = searchParams.get("post_id") || "";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localAccountId, setLocalAccountId] = useState(accountId);
  const [localPostId, setLocalPostId] = useState(postId);

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
        if (!value) params.delete(key);
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
    const next = items.filter((c) => matchesSearch(c, search));
    next.sort((a, b) => {
      const da = safeDate(a.created_at)?.getTime() ?? 0;
      const db = safeDate(b.created_at)?.getTime() ?? 0;
      return db - da;
    });
    return next;
  }, [items, search]);

  const total = data?.total ?? 0;

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
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        {(accountId || postId || dateFrom || dateTo) && (
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
            { key: "group", header: translate("socialMedia.table.groupName") },
            { key: "status", header: translate("socialMedia.table.status") },
            { key: "createdAt", header: translate("socialMedia.table.createdAt") },
            { key: "publishedAt", header: translate("socialMedia.table.publishedAt") },
            { key: "text", header: translate("socialMedia.table.commentText") },
            { key: "postUrl", header: translate("socialMedia.table.postUrl") },
            { key: "groupUrl", header: translate("socialMedia.table.groupUrl") },
          ]}
          rows={filtered.map((c) => ({
            key: c.id,
            cells: {
              account: <div className="font-medium text-gray-900">{c.account_name}</div>,
              group: (
                <div className="max-w-[220px] truncate text-gray-800" title={c.group_name}>
                  {c.group_name}
                </div>
              ),
              status: <StatusBadge status={c.status} />,
              createdAt: (
                <div className="text-xs text-gray-700 whitespace-nowrap">
                  {c.created_at
                    ? localeUtils.formatDate(safeDate(c.created_at) ?? c.created_at)
                    : "—"}
                </div>
              ),
              publishedAt: (
                <div className="text-xs text-gray-700 whitespace-nowrap">
                  {c.published_at
                    ? localeUtils.formatDate(safeDate(c.published_at) ?? c.published_at)
                    : "—"}
                </div>
              ),
              text: (
                <div className="max-w-[360px] line-clamp-2 text-gray-700" title={c.comment_text}>
                  {c.comment_text}
                </div>
              ),
              postUrl: <UrlLinkCell url={c.post_url} variant="post" />,
              groupUrl: <UrlLinkCell url={c.group_url} variant="group" />,
            },
          }))}
          onRowClick={(id) => setSelectedId(id)}
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
    </div>
  );
}
