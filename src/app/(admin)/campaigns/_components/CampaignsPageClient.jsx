"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import LoadingSpinner from "@/components/ui/loading-spinner";
import QueryErrorState from "@/components/ui/query-error-state";
import { useI18n } from "@/context/translate-api";
import { fetchCampaigns } from "@/utils/api";
import { formatDateTimeAmPmShort } from "@/utils/formateDate";
import { campaignKeys } from "@/utils/query-utils";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import CampaignDialog from "./CampaignDialog";

function CampaignCard({ campaign, onEdit }) {
  const { t } = useI18n();
  const isUnitMode = !!campaign?.unit;
  const images = Array.isArray(campaign?.images) ? campaign.images : [];
  const suggestedAns = Array.isArray(campaign?.suggested_ans)
    ? campaign.suggested_ans
    : [];
  const linkClicked = Array.isArray(campaign?.link_clicked)
    ? campaign.link_clicked
    : [];
  const lastClick = linkClicked.length ? linkClicked[linkClicked.length - 1] : null;

  const campaignId = campaign?.id || "";
  const campaignUrlText = campaignId
    ? `https://chat.lenaai.net/?campaign=${campaignId}`
    : "—";
  const campaignHref = campaignId
    ? `https://chat.lenaai.net/?campaign=${campaignId}`
    : undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
              {isUnitMode ? t?.campaigns?.typeUnit || "Unit" : t?.campaigns?.typeText || "Text"}
            </span>
            <span className="text-xs font-mono text-gray-500 truncate">
              {campaignHref ? (
                <a
                  href={campaignHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {campaignUrlText}
                </a>
              ) : (
                campaignUrlText
              )}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-sm text-gray-800">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <span className="text-gray-500">
                  {t?.campaigns?.campaignManager || "Campaign manager"}:
                </span>{" "}
                <span className="font-mono">
                  {campaign?.client_phone_number || "—"}
                </span>
              </span>
            </div>

            {!isUnitMode ? (
              <div className="text-gray-800">
                <span className="text-gray-500">{t?.campaigns?.text || "Text"}:</span>{" "}
                <span className="font-medium">
                  {campaign?.text ? String(campaign.text) : "—"}
                </span>
              </div>
            ) : (
              <div className="text-gray-800">
                <span className="text-gray-500">{t?.campaigns?.unit || "Unit"}:</span>{" "}
                <span className="font-medium">
                  {campaign?.unit?.unitTitle ||
                    campaign?.unit?.title ||
                    campaign?.unit?.unitId ||
                    campaign?.unit?.id ||
                    "Selected unit"}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit?.(campaign)}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
        >
          <Pencil size={16} />
          {t?.campaigns?.edit || "Edit"}
        </button>
      </div>

      {/* Images */}
      {!isUnitMode && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-600 mb-2">
            {t?.campaigns?.images || "Images"} ({images.length})
          </div>
          {images.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <div
                  key={`${img?.fileId || idx}`}
                  className="relative w-24 h-16 rounded-md overflow-hidden border bg-gray-50 flex-shrink-0"
                  title={img?.fileId || ""}
                >
                  <ImageWithLoader
                    src={img?.url || "/placeholder.svg"}
                    alt={`campaign_image_${idx}`}
                    className="w-full h-full object-cover"
                    priority={false}
                    loadingVariant="minimal"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {t?.campaigns?.noImages || "No images"}
            </div>
          )}
        </div>
      )}

      {/* Suggested answers */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-600 mb-2">
          {t?.campaigns?.suggestedAnswers || "Suggested answers"} ({suggestedAns.length})
        </div>
        {suggestedAns.length ? (
          <div className="flex flex-wrap gap-2">
            {suggestedAns.map((s, idx) => (
              <span
                key={`${idx}_${s}`}
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
              >
                {String(s)}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {t?.campaigns?.noSuggestedAnswers || "No suggested answers"}
          </div>
        )}
      </div>

      {/* Created/Updated */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-800">
        <span>
          <span className="text-gray-500">{t?.campaigns?.createdAt || "Created"}:</span>{" "}
          {formatDateTimeAmPmShort(campaign?.created_at) || "—"}
        </span>
        <span>
          <span className="text-gray-500">{t?.campaigns?.updatedAt || "Updated"}:</span>{" "}
          {formatDateTimeAmPmShort(campaign?.updated_at) || "—"}
        </span>
      </div>

      {/* Link clicked */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-600 mb-2">
          {t?.campaigns?.linkClicks || "Link clicks"}: {linkClicked.length}
        </div>
        {lastClick ? (
          <div className="text-sm text-gray-700">
            {t?.campaigns?.lastClick || "Last"}:{" "}
            <span className="font-mono">
              {formatDateTimeAmPmShort(lastClick?.date) || "—"}
            </span>{" "}
            {lastClick?.device ? (
              <span className="text-gray-500">({String(lastClick.device)})</span>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {t?.campaigns?.noClicks || "No clicks"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignsPageClient() {
  const { t } = useI18n();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Dialog wiring (implemented next)
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const queryParams = useMemo(() => ({ limit, offset }), [limit, offset]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: campaignKeys.list(queryParams),
    queryFn: () => fetchCampaigns(queryParams),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const campaigns = data?.campaigns || [];
  const totalCount = data?.total_count ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < totalCount;

  if (isLoading) {
    return <LoadingSpinner message="Loading campaigns..." />;
  }

  if (isError) {
    return (
      <div className="container">
        <QueryErrorState
          error={error}
          refetch={refetch}
          isFetching={isFetching}
          title="Error loading campaigns"
          message="Failed to load campaigns data. Please try again."
          retryLabel="Retry Campaigns"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t?.sidebar?.campaigns || "Campaigns"}
          </h1>
          <p className="text-sm text-gray-600">
            Total: <span className="font-medium">{totalCount}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCampaign(null);
              setIsCampaignDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
          >
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
          className="px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
        >
          {t?.previous || "Previous"}
        </button>
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-medium">{Math.min(offset + 1, totalCount)}</span>-
          <span className="font-medium">
            {Math.min(offset + limit, totalCount)}
          </span>{" "}
          of <span className="font-medium">{totalCount}</span>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setOffset((prev) => prev + limit)}
          className="px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
        >
          {t?.next || "Next"}
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {campaigns.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
            No campaigns found.
          </div>
        ) : (
          campaigns.map((c) => (
            <CampaignCard
              key={c?.id || JSON.stringify(c)}
              campaign={c}
              onEdit={(campaign) => {
                setEditingCampaign(campaign);
                setIsCampaignDialogOpen(true);
              }}
            />
          ))
        )}
      </div>

      <CampaignDialog
        isOpen={isCampaignDialogOpen}
        onClose={() => setIsCampaignDialogOpen(false)}
        campaign={editingCampaign}
        onSuccess={() => {
          // Query invalidation is handled in the dialog; this keeps UI snappy.
          setIsCampaignDialogOpen(false);
        }}
      />
    </div>
  );
}

