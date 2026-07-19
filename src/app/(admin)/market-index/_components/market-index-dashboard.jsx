"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { useMarketCards } from "@/hooks/use-market-index";
import LoadingSpinner from "@/components/ui/loading-spinner";
import LocationPickerDialog from "./location-picker-dialog";

const FILTERS = [
  { key: "all", status: undefined },
  { key: "draft", status: "draft" },
  { key: "published", status: "published" },
];

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

export default function MarketIndexDashboard({
  canEdit = false,
  unavailable = false,
  initialCards = null,
}) {
  const { translate, locale } = useI18n();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [pickerOpen, setPickerOpen] = useState(false);

  const statusParam = FILTERS.find((f) => f.key === filter)?.status;
  const { data, isLoading, isFetching, isError } = useMarketCards(
    statusParam,
    filter === "all" && initialCards && !initialCards.unavailable
      ? initialCards
      : undefined,
    !unavailable
  );

  const cards = useMemo(() => {
    if (unavailable) return [];
    return Array.isArray(data?.cards) ? data.cards : [];
  }, [data, unavailable]);

  const clientId = getClientIdFromToken() || "";
  const hrefFor = (locationId) =>
    `/${clientId}/market-index/${encodeURIComponent(locationId)}`;

  if (unavailable) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          {translate("marketIndex.title")}
        </h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-start">
          <p className="text-amber-900 font-medium">
            {translate("marketIndex.unavailable.title")}
          </p>
          <p className="text-amber-800 mt-2 text-sm">
            {translate("marketIndex.unavailable.message")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 h-full min-h-0">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {translate("marketIndex.title")}
        </h1>
        {canEdit && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            {translate("marketIndex.actions.newCard")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              filter === f.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {translate(`marketIndex.filters.${f.key}`)}
          </button>
        ))}
      </div>

      {isLoading && !data ? (
        <LoadingSpinner message={translate("common.loading")} />
      ) : isError ? (
        <p className="text-red-600 text-sm">{translate("marketIndex.errors.loadFailed")}</p>
      ) : cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
          {translate("marketIndex.empty.cards")}
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-gray-200 bg-white relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/40 pointer-events-none" />
          )}
          <table className="min-w-full text-sm text-start">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">
                  {translate("marketIndex.table.location")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  {translate("marketIndex.table.status")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  {translate("marketIndex.table.version")}
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  {translate("marketIndex.table.updatedAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.location_id || card.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(hrefFor(card.location_id || card.id))}
                >
                  <td className="px-4 py-3 text-gray-900">
                    {card.location_en_name || card.location_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        card.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {translate(`marketIndex.status.${card.status || "draft"}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {translate("marketIndex.table.versionLabel").replace(
                      "{n}",
                      String(card.active_version ?? 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(card.updated_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <LocationPickerDialog
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onConfirm={(leafId) => {
            setPickerOpen(false);
            router.push(hrefFor(leafId));
          }}
        />
      )}
    </div>
  );
}
