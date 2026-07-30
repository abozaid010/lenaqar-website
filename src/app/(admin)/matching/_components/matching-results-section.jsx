"use client";

import { useI18n } from "@/hooks/useI18n";
import { LoadingSpinner } from "@/components/ui/loading-states";
import LeadMatchCard from "./lead-match-card";

export default function MatchingResultsSection({
  phase,
  progress,
  results = [],
  onDismissUnit,
}) {
  const { translate } = useI18n();

  if (phase === "idle") {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
        <p className="text-sm text-gray-500">
          {translate("matching.empty.noResults")}
        </p>
      </div>
    );
  }

  if (phase === "matching") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center space-y-3">
        <LoadingSpinner />
        <p className="text-sm text-gray-700">
          {translate("matching.progress.matching")
            .replace("{done}", String(progress?.done ?? 0))
            .replace("{total}", String(progress?.total ?? 0))}
        </p>
      </div>
    );
  }

  if (phase === "sending") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center space-y-3">
        <LoadingSpinner />
        <p className="text-sm text-gray-700">
          {translate("matching.progress.sending")
            .replace("{done}", String(progress?.done ?? 0))
            .replace("{total}", String(progress?.total ?? 0))}
        </p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
        <p className="text-sm text-gray-500">
          {translate("matching.empty.noResults")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-900">
        {translate("matching.sections.results")}
      </h2>
      {results.map((result) => (
        <LeadMatchCard
          key={result.leadId}
          result={result}
          onDismissUnit={onDismissUnit}
        />
      ))}
    </div>
  );
}
