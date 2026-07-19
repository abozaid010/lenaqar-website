"use client";

import { useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import { useMarketHistory, useMarketVersion } from "@/hooks/use-market-index";
import ReferenceUnitsTable from "./reference-units-table";

function formatDate(value, locale) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function compactSummary(summary, translate) {
  if (!summary) return "";
  if (summary.initial_publication) {
    return translate("marketIndex.publish.initialPublication");
  }
  const parts = [
    translate("marketIndex.publish.unitsAdded").replace(
      "{n}",
      String(summary.units_added ?? 0)
    ),
    translate("marketIndex.publish.unitsChanged").replace(
      "{n}",
      String(summary.units_changed ?? 0)
    ),
  ];
  return parts.join(" · ");
}

export default function VersionHistoryDialog({
  isOpen,
  onClose,
  locationId,
}) {
  const { translate, locale } = useI18n();
  const [selectedVersion, setSelectedVersion] = useState(null);

  const historyQuery = useMarketHistory(locationId, isOpen);
  const versionQuery = useMarketVersion(
    locationId,
    selectedVersion,
    isOpen && selectedVersion != null
  );

  const versions = Array.isArray(historyQuery.data?.versions)
    ? historyQuery.data.versions
    : [];

  const snapshot = versionQuery.data;

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={() => {
        setSelectedVersion(null);
        onClose?.();
      }}
      title={
        selectedVersion != null
          ? translate("marketIndex.history.snapshotTitle").replace(
              "{n}",
              String(selectedVersion)
            )
          : translate("marketIndex.history.title")
      }
      cancelLabel={
        selectedVersion != null
          ? translate("marketIndex.history.backToList")
          : translate("common.cancel")
      }
      onCancel={() => {
        if (selectedVersion != null) {
          setSelectedVersion(null);
          return;
        }
        onClose?.();
      }}
      headerTrailing={null}
      dialogClassName="max-w-4xl"
      bodyClassName="p-4 overflow-y-auto"
    >
      {selectedVersion == null ? (
        historyQuery.isLoading ? (
          <LoadingSpinner
            size={40}
            containerClassName="flex items-center justify-center h-40"
          />
        ) : historyQuery.isError ? (
          <p className="text-sm text-red-600">
            {historyQuery.error?.message ||
              translate("marketIndex.errors.loadFailed")}
          </p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-500">
            {translate("marketIndex.history.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {versions.map((v) => (
              <li key={v.id || v.version}>
                <button
                  type="button"
                  onClick={() => setSelectedVersion(v.version)}
                  className="w-full text-start px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {translate("marketIndex.table.versionLabel").replace(
                        "{n}",
                        String(v.version)
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(v.published_at, locale)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {v.published_by?.email ||
                      translate("marketIndex.history.unknownPublisher")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {compactSummary(v.changes_summary, translate)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : versionQuery.isLoading ? (
        <LoadingSpinner
          size={40}
          containerClassName="flex items-center justify-center h-40"
        />
      ) : versionQuery.isError ? (
        <p className="text-sm text-red-600">
          {versionQuery.error?.message ||
            translate("marketIndex.errors.loadFailed")}
        </p>
      ) : !snapshot ? (
        <p className="text-sm text-gray-500">
          {translate("marketIndex.history.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">
                {translate("marketIndex.fields.publicListingCount")}:{" "}
              </span>
              <span className="text-gray-900">
                {snapshot.general?.public_listing_count ?? 0}
              </span>
            </div>
            <div>
              <span className="text-gray-500">
                {translate("marketIndex.fields.locationAvgPrice")}:{" "}
              </span>
              <span className="text-gray-900">
                {snapshot.general?.location_avg_price_per_sqm ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">
                {translate("marketIndex.fields.defaultRangePct")}:{" "}
              </span>
              <span className="text-gray-900">
                {snapshot.general?.default_range_pct != null
                  ? `${(snapshot.general.default_range_pct * 100).toFixed(2)}%`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">
                {translate("marketIndex.evidence.title")}:{" "}
              </span>
              <span className="text-gray-900">
                {Array.isArray(snapshot.general?.evidence)
                  ? snapshot.general.evidence.length
                  : 0}
              </span>
            </div>
          </div>
          <ReferenceUnitsTable
            locationId={locationId}
            units={Array.isArray(snapshot.units) ? snapshot.units : []}
            canEdit={false}
            readOnly
          />
        </div>
      )}
    </UnifiedDialog>
  );
}
