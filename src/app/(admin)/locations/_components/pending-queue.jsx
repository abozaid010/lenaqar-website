"use client";

import { Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { locationLabel } from "./location-label";

export default function PendingQueue({
  pending,
  isLoading,
  onApprove,
  onReject,
  busyId = null,
}) {
  const { translate, locale } = useI18n();
  const locations = Array.isArray(pending?.locations) ? pending.locations : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {translate("common.loading")}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        {translate("locations.pending.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-start font-medium">
              {translate("locations.pending.columns.name")}
            </th>
            <th className="px-4 py-3 text-start font-medium">
              {translate("locations.pending.columns.level")}
            </th>
            <th className="px-4 py-3 text-start font-medium">
              {translate("locations.pending.columns.parent")}
            </th>
            <th className="px-4 py-3 text-start font-medium">
              {translate("locations.pending.columns.proposedBy")}
            </th>
            <th className="px-4 py-3 text-end font-medium">
              {translate("locations.pending.columns.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {locations.map((node) => {
            const busy = busyId === node.id;
            return (
              <tr key={node.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {locationLabel(node, locale)}
                  </div>
                  <div className="text-xs text-gray-500">{node.id}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {translate(`locations.levels.${node.level}`)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {node.parent_id || "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {node.proposed_by || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onApprove(node)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        translate("locations.actions.approve")
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onReject(node)}
                      className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {translate("locations.actions.reject")}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
