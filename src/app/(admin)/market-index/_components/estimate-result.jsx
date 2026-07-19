"use client";

import { useI18n } from "@/hooks/useI18n";
import { formatEgp, formatIsoDate } from "@/lib/market-index/format";
import {
  ConfidenceBadge,
  OptionalMoneyRow,
  OptionalRoiRow,
} from "./market-snapshot";

function adjustmentLabel(item, translate) {
  if (item.note || item.pct === 0) {
    return translate("marketEvaluate.result.noAdjustment").replace(
      "{value}",
      item.value
    );
  }
  const sign = item.pct > 0 ? "+" : "";
  const pct = `${sign}${(item.pct * 100).toFixed(0)}%`;
  return `${item.value} (${pct})`;
}

export default function EstimateResult({ result }) {
  const { translate } = useI18n();
  if (!result) {
    return (
      <div
        className="rounded-lg border border-dashed border-gray-200 bg-white/60 p-4 min-h-[8rem] flex items-center justify-center text-sm text-gray-500"
        aria-hidden={!result}
      >
        {translate("marketEvaluate.result.placeholder")}
      </div>
    );
  }

  const hasRentBlock =
    result.monthly_rent != null ||
    result.monthly_furnished_rent != null ||
    result.roi != null ||
    result.furnished_roi != null ||
    result.developer_price != null;

  const matched = result.matched_reference;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {translate("marketEvaluate.result.estimatedValue")}
          </p>
          <p className="text-3xl md:text-4xl font-semibold text-primary tracking-tight mt-1">
            {formatEgp(result.estimated_value)}
          </p>
          {result.price_range && (
            <p className="text-sm text-gray-600 mt-2">
              {translate("marketEvaluate.result.likelyRange")}:{" "}
              <span className="font-medium text-gray-900">
                {formatEgp(result.price_range.low)} –{" "}
                {formatEgp(result.price_range.high)}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ConfidenceBadge band={result.confidence} />
          {result.match_level && (
            <span className="text-xs text-gray-500">
              {translate(`marketEvaluate.matchLevel.${result.match_level}`) ||
                result.match_level}
            </span>
          )}
        </div>
      </div>

      {Array.isArray(result.confidence_drivers) &&
        result.confidence_drivers.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-primary">
              {translate("marketEvaluate.result.whyConfidence")}
            </summary>
            <ul className="mt-2 list-disc ps-5 text-gray-600 space-y-1">
              {result.confidence_drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </details>
        )}

      {result.explanation && (
        <p className="text-sm text-gray-700 leading-relaxed border-s-2 border-primary/30 ps-3">
          {result.explanation}
        </p>
      )}

      {hasRentBlock && (
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {translate("marketEvaluate.result.rentRoi")}
          </h3>
          <OptionalMoneyRow
            label={translate("marketEvaluate.result.developerPrice")}
            value={result.developer_price}
          />
          <OptionalMoneyRow
            label={translate("marketEvaluate.result.monthlyRent")}
            value={result.monthly_rent}
          />
          <OptionalMoneyRow
            label={translate("marketEvaluate.result.furnishedRent")}
            value={result.monthly_furnished_rent}
          />
          <OptionalRoiRow
            label={translate("marketEvaluate.result.roi")}
            value={result.roi}
          />
          <OptionalRoiRow
            label={translate("marketEvaluate.result.furnishedRoi")}
            value={result.furnished_roi}
          />
        </div>
      )}

      {Array.isArray(result.adjustments_applied) &&
        result.adjustments_applied.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {translate("marketEvaluate.result.adjustments")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.adjustments_applied.map((item) => (
                <span
                  key={`${item.type}-${item.value}`}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-800"
                >
                  <span className="text-gray-500 me-1">
                    {translate(`marketEvaluate.result.adjType.${item.type}`) ||
                      item.type}
                    :
                  </span>
                  {adjustmentLabel(item, translate)}
                </span>
              ))}
            </div>
          </div>
        )}

      {matched && (
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {translate("marketEvaluate.result.basedOn")}
          </h3>
          <p className="text-sm text-gray-700">
            {matched.property_type} · {matched.area_sqm}{" "}
            {translate("marketEvaluate.result.sqm")} · {matched.bedrooms}
            {translate("marketEvaluate.result.bedsShort")} /{" "}
            {matched.bathrooms}
            {translate("marketEvaluate.result.bathsShort")} —{" "}
            {formatEgp(matched.estimated_avg_price)}
          </p>
          {Array.isArray(matched.evidence) && matched.evidence.length > 0 && (
            <ul className="flex flex-col gap-2">
              {matched.evidence.map((ev, i) => (
                <li
                  key={`${ev.source}-${ev.date}-${i}`}
                  className="text-sm text-gray-600 flex flex-wrap gap-x-2 gap-y-1"
                >
                  <span className="font-medium text-gray-800">{ev.source}</span>
                  <span>{ev.date}</span>
                  {ev.url ? (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {translate("marketEvaluate.result.evidenceLink")}
                    </a>
                  ) : null}
                  {ev.notes ? (
                    <span className="text-gray-500">— {ev.notes}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
        {translate("marketEvaluate.provenance")
          .replace("{version}", String(result.version ?? ""))
          .replace(
            "{date}",
            formatIsoDate(result.published_at) || "—"
          )}
      </p>
    </section>
  );
}
