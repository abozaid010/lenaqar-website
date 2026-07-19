"use client";

import { useI18n } from "@/hooks/useI18n";
import {
  formatEgp,
  formatIsoDate,
  formatRoiPercent,
} from "@/lib/market-index/format";
import { locationLabel } from "./location-label";

function confidenceClass(band) {
  if (band === "high") return "bg-emerald-100 text-emerald-800";
  if (band === "medium") return "bg-amber-100 text-amber-900";
  return "bg-gray-100 text-gray-700";
}

function moneyOrDash(value) {
  return formatEgp(value) ?? "—";
}

function sortUnits(units) {
  return [...units].sort((a, b) => {
    const typeCmp = String(a.property_type || "").localeCompare(
      String(b.property_type || "")
    );
    if (typeCmp !== 0) return typeCmp;
    return Number(a.area_sqm || 0) - Number(b.area_sqm || 0);
  });
}

/**
 * Compact market reference summary: one row per published unit
 * so prices/rents are scannable by category.
 */
export default function MarketSnapshot({ card, locale }) {
  const { translate } = useI18n();
  if (!card) return null;

  const locName = locationLabel(card.location, locale) || card.location_id;
  const units = sortUnits(Array.isArray(card.units) ? card.units : []);

  return (
    <aside className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-100">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {translate("marketEvaluate.summary.title")}
          </h2>
          <p className="text-xs text-gray-500 truncate">{locName}</p>
        </div>
        {card.confidence && (
          <span
            className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${confidenceClass(card.confidence)}`}
          >
            {translate(`marketEvaluate.confidence.${card.confidence}`)}
          </span>
        )}
      </div>

      {units.length === 0 ? (
        <p className="px-3 py-4 text-sm text-gray-500">
          {translate("marketEvaluate.summary.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm text-start">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  {translate("marketEvaluate.summary.type")}
                </th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  {translate("marketEvaluate.summary.area")}
                </th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  {translate("marketEvaluate.summary.bedsBaths")}
                </th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  {translate("marketEvaluate.summary.price")}
                </th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  {translate("marketEvaluate.summary.rent")}
                </th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">
                  {translate("marketEvaluate.summary.furnishedRent")}
                </th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => {
                const typeLabel =
                  translate(
                    `marketEvaluate.propertyTypes.${unit.property_type}`
                  ) || unit.property_type;
                return (
                  <tr
                    key={unit.id}
                    className="border-t border-gray-100 text-gray-900"
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {typeLabel}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {unit.area_sqm != null
                        ? `${new Intl.NumberFormat("en-US").format(unit.area_sqm)} ${translate("marketEvaluate.result.sqm")}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {unit.bedrooms ?? "—"}
                      {translate("marketEvaluate.result.bedsShort")} /{" "}
                      {unit.bathrooms ?? "—"}
                      {translate("marketEvaluate.result.bathsShort")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {moneyOrDash(unit.estimated_avg_price)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {moneyOrDash(unit.monthly_rent)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {moneyOrDash(unit.monthly_furnished_rent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500 px-3 py-2 border-t border-gray-100">
        {translate("marketEvaluate.provenance")
          .replace("{version}", String(card.version ?? ""))
          .replace(
            "{date}",
            formatIsoDate(card.last_reviewed_at || card.published_at) || "—"
          )}
      </p>
    </aside>
  );
}

export function ConfidenceBadge({ band }) {
  const { translate } = useI18n();
  if (!band) return null;
  return (
    <span
      className={`inline-flex text-xs font-medium px-2 py-1 rounded ${confidenceClass(band)}`}
    >
      {translate(`marketEvaluate.confidence.${band}`)}
    </span>
  );
}

export function OptionalMoneyRow({ label, value }) {
  const formatted = formatEgp(value);
  if (!formatted) return null;
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{formatted}</span>
    </div>
  );
}

export function OptionalRoiRow({ label, value }) {
  const formatted = formatRoiPercent(value);
  if (!formatted) return null;
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{formatted}</span>
    </div>
  );
}
