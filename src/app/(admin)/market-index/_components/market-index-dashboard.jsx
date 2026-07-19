"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Loader2, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useI18n } from "@/hooks/useI18n";
import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { useMarketCards } from "@/hooks/use-market-index";
import LoadingSpinner from "@/components/ui/loading-spinner";

const dialogLoading = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
  </div>
);

const LocationPickerDialog = dynamic(() => import("./location-picker-dialog"), {
  ssr: false,
  loading: dialogLoading,
});

const EvaluateUnitDialog = dynamic(() => import("./evaluate-unit-dialog"), {
  ssr: false,
  loading: dialogLoading,
});

const FILTERS = [
  { key: "all", status: undefined },
  { key: "draft", status: "draft" },
  { key: "published", status: "published" },
];

const PUBLISHED_HIGHLIGHT_MS = 1800;

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

function cardId(card) {
  return card?.location_id || card?.id || "";
}

function DashboardHeader({ canEdit, onEvaluate, onNewCard }) {
  const { translate } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-3 justify-between">
      <h1 className="text-xl font-semibold text-gray-900">
        {translate("marketIndex.title")}
      </h1>
      <div className="flex flex-wrap items-center gap-2 ms-auto">
        <button
          type="button"
          onClick={onEvaluate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary bg-white text-sm font-medium hover:bg-primary/5 transition-colors"
        >
          <Calculator className="h-4 w-4" />
          {translate("marketIndex.actions.evaluate")}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={onNewCard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            {translate("marketIndex.actions.newCard")}
          </button>
        )}
      </div>
    </div>
  );
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
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [justPublishedId, setJustPublishedId] = useState(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("published");
  });
  const [insertReady, setInsertReady] = useState(false);

  const clientId = getClientIdFromToken() || "";
  const listHref = `/${clientId}/market-index`;
  const hrefFor = (locationId) =>
    `/${clientId}/market-index/${encodeURIComponent(locationId)}`;

  const statusParam = FILTERS.find((f) => f.key === filter)?.status;
  const skipInitialData = Boolean(justPublishedId);
  const { data, isLoading, isFetching, isError, refetch } = useMarketCards(
    statusParam,
    !skipInitialData &&
      filter === "all" &&
      initialCards &&
      !initialCards.unavailable
      ? initialCards
      : undefined,
    !unavailable
  );

  useEffect(() => {
    if (unavailable || !justPublishedId) return undefined;

    setPickerOpen(false);
    setFilter("all");
    setInsertReady(false);

    let cancelled = false;
    refetch().then(() => {
      if (!cancelled) setInsertReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [unavailable, justPublishedId, refetch]);

  const cards = useMemo(() => {
    if (unavailable) return [];
    const list = Array.isArray(data?.cards) ? [...data.cards] : [];
    if (!justPublishedId) return list;

    const index = list.findIndex((card) => cardId(card) === justPublishedId);
    if (index < 0) return list;
    if (index === 0) return list;
    const [item] = list.splice(index, 1);
    return [item, ...list];
  }, [data, unavailable, justPublishedId]);

  const publishedCardVisible =
    Boolean(justPublishedId) &&
    insertReady &&
    cards.some((card) => cardId(card) === justPublishedId);

  useEffect(() => {
    if (!publishedCardVisible) return undefined;

    const clearTimer = window.setTimeout(() => {
      setJustPublishedId(null);
      setInsertReady(false);
      router.replace(listHref, { scroll: false });
    }, PUBLISHED_HIGHLIGHT_MS);

    return () => window.clearTimeout(clearTimer);
  }, [publishedCardVisible, router, listHref]);

  if (unavailable) {
    return (
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <DashboardHeader
          canEdit={false}
          onEvaluate={() => setEvaluateOpen(true)}
          onNewCard={() => {}}
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-start">
          <p className="text-amber-900 font-medium">
            {translate("marketIndex.unavailable.title")}
          </p>
          <p className="text-amber-800 mt-2 text-sm">
            {translate("marketIndex.unavailable.message")}
          </p>
        </div>
        {evaluateOpen && (
          <EvaluateUnitDialog
            isOpen={evaluateOpen}
            onClose={() => setEvaluateOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 h-full min-h-0">
      <style>{`
        @keyframes market-index-row-insert {
          0% {
            opacity: 0;
            transform: translateY(-12px);
            background-color: rgb(236 253 245);
          }
          55% {
            opacity: 1;
            transform: translateY(0);
            background-color: rgb(236 253 245);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            background-color: transparent;
          }
        }
        .market-index-row-just-published {
          animation: market-index-row-insert 0.75s ease-out both;
        }
      `}</style>

      <DashboardHeader
        canEdit={canEdit}
        onEvaluate={() => setEvaluateOpen(true)}
        onNewCard={() => setPickerOpen(true)}
      />

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
        <p className="text-red-600 text-sm">
          {translate("marketIndex.errors.loadFailed")}
        </p>
      ) : cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
          {translate("marketIndex.empty.cards")}
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-gray-200 bg-white relative">
          {isFetching && !justPublishedId && (
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
              {cards.map((card) => {
                const id = cardId(card);
                const isJustPublished =
                  publishedCardVisible && id === justPublishedId;
                return (
                  <tr
                    key={id}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      isJustPublished ? "market-index-row-just-published" : ""
                    }`}
                    onClick={() => router.push(hrefFor(id))}
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
                        {translate(
                          `marketIndex.status.${card.status || "draft"}`
                        )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && pickerOpen && (
        <LocationPickerDialog
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onConfirm={(leafId) => {
            setPickerOpen(false);
            router.push(hrefFor(leafId));
          }}
        />
      )}

      {evaluateOpen && (
        <EvaluateUnitDialog
          isOpen={evaluateOpen}
          onClose={() => setEvaluateOpen(false)}
        />
      )}
    </div>
  );
}
