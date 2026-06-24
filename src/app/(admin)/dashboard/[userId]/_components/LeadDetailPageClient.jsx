"use client";

import LeadDetailPane from "@/app/(admin)/dashboard/_components/split-view/LeadDetailPane";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { DashboardLeadsBulkProvider } from "@/context/dashboard-leads-bulk-context";
import { useLgViewport } from "@/hooks/use-lg-viewport";
import {
  buildDashboardListHref,
  buildDashboardSplitHref,
} from "@/utils/dashboard-navigation";
import { userKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function LeadDetailPageClient({ userId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isLg = useLgViewport();

  useEffect(() => {
    if (!isLg) return;
    router.replace(buildDashboardSplitHref(userId, searchParams));
  }, [isLg, router, searchParams, userId]);

  const onInvalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  }, [queryClient]);

  const onLeadRemoved = useCallback(() => {
    router.push(buildDashboardListHref(searchParams));
  }, [router, searchParams]);

  const onBack = useCallback(() => {
    router.push(buildDashboardListHref(searchParams));
  }, [router, searchParams]);

  if (isLg) {
    return (
      <LoadingSpinner
        message="Loading..."
        containerClassName="flex items-center justify-center min-h-[200px]"
      />
    );
  }

  return (
    <DashboardLeadsBulkProvider>
      <div className="flex flex-col min-h-0 flex-1 h-full border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
        <LeadDetailPane
          userId={userId}
          onInvalidateList={onInvalidateList}
          onLeadRemoved={onLeadRemoved}
          showBackButton
          onBack={onBack}
        />
      </div>
    </DashboardLeadsBulkProvider>
  );
}
