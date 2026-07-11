"use client";

import {
  Activity,
  CheckCircle2,
  MessageSquareText,
  Users,
  XCircle,
  Layers,
  Clock,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useI18n } from "@/hooks/useI18n";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useSocialMediaDashboardSummary } from "@/hooks/social-media/useSocialMediaDashboardSummary";
import { KpiCard } from "@/components/social-media/KpiCard";
import { SocialMediaHeader } from "@/components/social-media/SocialMediaHeader";
import { KpiGridSkeleton } from "@/components/social-media/Skeletons";

export default function SocialMediaDashboardClient() {
  const { translate, localeUtils } = useI18n();
  const { canView, isReady } = useModuleActions("social-media");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSocialMediaDashboardSummary();

  const title = translate("socialMedia.dashboard.title");

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
        title={title}
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["social-media"] });
          await refetch();
        }}
        isRefreshing={isFetching}
        showSearch={false}
      />

      {isLoading ? (
        <KpiGridSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="font-semibold">{translate("common.error")}</div>
          <div className="mt-1">
            {error instanceof Error ? error.message : translate("socialMedia.dashboard.loadError")}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <KpiCard
            icon={<Activity className="h-5 w-5" />}
            label={translate("socialMedia.kpi.totalPosts")}
            value={localeUtils.formatNumber(data?.total_posts ?? 0)}
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={translate("socialMedia.kpi.publishedPosts")}
            value={localeUtils.formatNumber(data?.published_posts ?? 0)}
          />
          <KpiCard
            icon={<XCircle className="h-5 w-5" />}
            label={translate("socialMedia.kpi.failedPosts")}
            value={localeUtils.formatNumber(data?.failed_posts ?? 0)}
          />
          <KpiCard
            icon={<MessageSquareText className="h-5 w-5" />}
            label={translate("socialMedia.kpi.totalComments")}
            value={localeUtils.formatNumber(data?.total_comments ?? 0)}
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={translate("socialMedia.kpi.publishedComments")}
            value={localeUtils.formatNumber(data?.published_comments ?? 0)}
          />
          <KpiCard
            icon={<XCircle className="h-5 w-5" />}
            label={translate("socialMedia.kpi.failedComments")}
            value={localeUtils.formatNumber(data?.failed_comments ?? 0)}
          />
          <KpiCard
            icon={<Users className="h-5 w-5" />}
            label={translate("socialMedia.kpi.accounts")}
            value={localeUtils.formatNumber(data?.accounts ?? 0)}
          />
          <KpiCard
            icon={<Layers className="h-5 w-5" />}
            label={translate("socialMedia.kpi.groups")}
            value={localeUtils.formatNumber(data?.groups ?? 0)}
          />
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label={translate("socialMedia.kpi.todayPosts")}
            value={localeUtils.formatNumber(data?.today_posts ?? 0)}
          />
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label={translate("socialMedia.kpi.todayComments")}
            value={localeUtils.formatNumber(data?.today_comments ?? 0)}
          />
        </div>
      )}
    </div>
  );
}

