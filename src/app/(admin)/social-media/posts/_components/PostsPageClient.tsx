"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useI18n } from "@/hooks/useI18n";
import type { SocialMediaStatus, SocialPost } from "@/types/socialMedia";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useSocialMediaPosts } from "@/hooks/social-media/useSocialMediaPosts";
import { SocialMediaHeader } from "@/components/social-media/SocialMediaHeader";
import { DataTable } from "@/components/social-media/DataTable";
import { StatusBadge, SocialMediaStatusOptions } from "@/components/social-media/StatusBadge";
import { Drawer } from "@/components/social-media/Drawer";
import { TableSkeleton } from "@/components/social-media/Skeletons";
import { SocialMediaPagination } from "@/components/social-media/SocialMediaPagination";
import { UrlLinkCell } from "@/components/social-media/UrlLinkCell";
import { PostDetailPanel } from "@/components/social-media/PostDetailPanel";

const PAGE_SIZE = 50;

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchesSearch(post: SocialPost, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    post.id.toLowerCase().includes(s) ||
    post.account_name.toLowerCase().includes(s) ||
    post.group_name.toLowerCase().includes(s) ||
    post.post_content.toLowerCase().includes(s) ||
    (post.post_url || "").toLowerCase().includes(s) ||
    post.group_url.toLowerCase().includes(s)
  );
}

export default function PostsPageClient() {
  const { translate, localeUtils } = useI18n();
  const { canView, isReady } = useModuleActions("social-media");
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const status = (searchParams.get("status") || "all") as SocialMediaStatus | "all";
  const accountId = searchParams.get("account_id") || "";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localAccountId, setLocalAccountId] = useState(accountId);

  useEffect(() => {
    setLocalAccountId(accountId);
  }, [accountId]);

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

  const { data, isLoading, isError, error, isFetching, refetch } = useSocialMediaPosts({
    page,
    page_size: PAGE_SIZE,
    status,
    account_id: accountId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const next = items.filter((p) => matchesSearch(p, search));
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
        title={translate("socialMedia.posts.title")}
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["social-media", "posts"] });
          await refetch();
        }}
        isRefreshing={isFetching}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {translate("socialMedia.filters.status")}
            </label>
            <select
              value={status}
              onChange={(e) => {
                pushParams({ status: e.target.value === "all" ? null : e.target.value, page: "1" });
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <SocialMediaStatusOptions includeAll />
            </select>
          </div>
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
        {(status !== "all" || accountId || dateFrom || dateTo) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setLocalAccountId("");
                pushParams({
                  status: null,
                  account_id: null,
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
            {error instanceof Error ? error.message : translate("socialMedia.posts.loadError")}
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
            { key: "content", header: translate("socialMedia.table.postContent") },
            { key: "groupUrl", header: translate("socialMedia.table.groupUrl") },
            { key: "postUrl", header: translate("socialMedia.table.postUrl") },
          ]}
          rows={filtered.map((p) => ({
            key: p.id,
            cells: {
              account: <div className="font-medium text-gray-900">{p.account_name}</div>,
              group: (
                <div className="max-w-[220px] truncate text-gray-800" title={p.group_name}>
                  {p.group_name}
                </div>
              ),
              status: <StatusBadge status={p.status} />,
              createdAt: (
                <div className="text-xs text-gray-700 whitespace-nowrap">
                  {p.created_at
                    ? localeUtils.formatDate(safeDate(p.created_at) ?? p.created_at)
                    : "—"}
                </div>
              ),
              publishedAt: (
                <div className="text-xs text-gray-700 whitespace-nowrap">
                  {p.published_at
                    ? localeUtils.formatDate(safeDate(p.published_at) ?? p.published_at)
                    : "—"}
                </div>
              ),
              content: (
                <div className="max-w-[320px] line-clamp-2 text-gray-700" title={p.post_content}>
                  {p.post_content}
                </div>
              ),
              groupUrl: <UrlLinkCell url={p.group_url} variant="group" />,
              postUrl: <UrlLinkCell url={p.post_url} variant="post" />,
            },
          }))}
          onRowClick={(id) => setSelectedId(id)}
          empty={
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-gray-900">
                {translate("socialMedia.empty.title")}
              </div>
              <div className="text-gray-600">{translate("socialMedia.empty.subtitle")}</div>
            </div>
          }
        />
      )}

      <Drawer
        isOpen={selectedId != null}
        onClose={() => setSelectedId(null)}
        title={translate("socialMedia.posts.detailsTitle")}
      >
        {selectedId ? <PostDetailPanel postId={selectedId} /> : null}
      </Drawer>
    </div>
  );
}
