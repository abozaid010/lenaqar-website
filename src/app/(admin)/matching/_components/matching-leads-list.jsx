"use client";

import { useI18n } from "@/hooks/useI18n";
import { getOwnerTypeLabel } from "@/constants/owner-type";
import { LoadingSpinner } from "@/components/ui/loading-states";

export default function MatchingLeadsList({
  leads = [],
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}) {
  const { translate } = useI18n();

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {translate("matching.sections.loadedLeads")}
          </h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {translate("matching.sections.loadedLeads")}
          </h2>
        </div>
        <p className="px-4 py-10 text-center text-sm text-gray-500">
          {translate("matching.empty.noLeads")}
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {translate("matching.sections.loadedLeads")}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {translate("matching.leadsLoaded", "{count} leads loaded").replace(
              "{count}",
              String(leads.length),
            )}
          </p>
        </div>
        {hasNextPage && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="text-sm font-medium text-primary disabled:opacity-50"
          >
            {isFetchingNextPage
              ? translate("common.loading", "Loading...")
              : translate("matching.actions.loadMore")}
          </button>
        )}
      </div>
      <ul className="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto">
        {leads.map((lead) => {
          const id = lead.user_id || lead.id;
          return (
            <li key={id} className="px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {lead.name || lead.phone_number || id}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {lead.phone_number || ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-600">
                {getOwnerTypeLabel(lead.owner_type, translate) || "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
