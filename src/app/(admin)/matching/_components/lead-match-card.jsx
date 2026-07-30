"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { getOwnerTypeLabel } from "@/constants/owner-type";
import {
  requirementToFilterChips,
} from "@/lib/match/requirement-to-units-filter";
import {
  MATCHING_STATUS,
  matchingStatusTranslateKey,
} from "@/lib/matching/matching-statuses";
import { getMatchingUnitId } from "@/lib/matching/unit-recommendation-service";
import MatchingUnitRow from "./matching-unit-row";

function statusBadgeClass(status) {
  switch (status) {
    case MATCHING_STATUS.READY:
    case MATCHING_STATUS.READY_TO_SEND:
      return "bg-emerald-50 text-emerald-800";
    case MATCHING_STATUS.SENT:
      return "bg-sky-50 text-sky-800";
    case MATCHING_STATUS.FAILED:
    case MATCHING_STATUS.REQUIREMENT_ERROR:
    case MATCHING_STATUS.UNITS_ERROR:
      return "bg-red-50 text-red-800";
    case MATCHING_STATUS.MISSING_PRICE:
    case MATCHING_STATUS.MISSING_REQUIREMENT:
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function LeadMatchCard({
  result,
  onDismissUnit,
}) {
  const { translate } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const requirementChips = useMemo(() => {
    const r = result?.requirement;
    if (!r || r.error) return [];
    return requirementToFilterChips(r, (key, fb) => translate(key, fb));
  }, [result?.requirement, translate]);

  const recommendedUnits = useMemo(() => {
    const ids = new Set(result?.recommendedUnitIds || []);
    return (result?.allUnits || []).filter((u) =>
      ids.has(getMatchingUnitId(u)),
    );
  }, [result]);

  const lead = result?.lead;
  const name = lead?.name || lead?.phone_number || result?.leadId;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        className="w-full text-start px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {name}
            </h3>
            <span className="text-xs text-gray-500">
              {getOwnerTypeLabel(lead?.owner_type, translate)}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(result.status)}`}
            >
              {translate(matchingStatusTranslateKey(result.status))}
            </span>
          </div>
          {result.status === MATCHING_STATUS.MISSING_PRICE && (
            <p className="text-xs text-amber-700">
              {translate("matching.warning.missingPrice")}
            </p>
          )}
          {(result.status === MATCHING_STATUS.REQUIREMENT_ERROR ||
            result.status === MATCHING_STATUS.UNITS_ERROR) && (
            <p className="text-xs text-red-700">
              {translate(
                result.errorMessage ||
                  (result.status === MATCHING_STATUS.REQUIREMENT_ERROR
                    ? "matching.errors.requirementFetch"
                    : "matching.errors.unitsFetch"),
              )}
            </p>
          )}
          {requirementChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {requirementChips.slice(0, 8).map((chip, index) => (
                <span
                  key={`${chip.label}-${chip.value}-${index}`}
                  className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                >
                  {chip.label ? `${chip.label}: ` : ""}
                  {chip.value ?? chip.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-600">
            {translate("matching.card.matchingUnits", "{count} Matching Units").replace(
              "{count}",
              String(result?.allUnits?.length || 0),
            )}
            {recommendedUnits.length > 0
              ? ` · ${recommendedUnits.length} ${translate("matching.card.recommended")}`
              : ""}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400 mt-1" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-4">
          {recommendedUnits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {translate("matching.card.recommended")}
              </h4>
              {recommendedUnits.map((unit) => (
                <MatchingUnitRow
                  key={getMatchingUnitId(unit)}
                  unit={unit}
                  showDismiss
                  onDismiss={(unitId) =>
                    onDismissUnit?.(result.leadId, unitId)
                  }
                />
              ))}
            </div>
          )}

          {(result?.allUnits?.length || 0) > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {translate("matching.card.allUnits")}
              </h4>
              {result.allUnits.map((unit) => {
                const id = getMatchingUnitId(unit);
                const isRecommended = (result.recommendedUnitIds || []).includes(
                  id,
                );
                return (
                  <MatchingUnitRow
                    key={id}
                    unit={unit}
                    showDismiss={isRecommended}
                    onDismiss={(unitId) =>
                      onDismissUnit?.(result.leadId, unitId)
                    }
                  />
                );
              })}
            </div>
          )}

          {(result?.allUnits?.length || 0) === 0 &&
            result.status === MATCHING_STATUS.NO_MATCHING_UNITS && (
              <p className="text-sm text-gray-500">
                {translate("matching.empty.noMatchingUnits")}
              </p>
            )}
        </div>
      )}
    </div>
  );
}
