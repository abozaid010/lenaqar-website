"use client";

import { DeleteButton } from "@/components/ui/action-button";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import ImageWithLoader from "@/components/ui/image-with-loader";
import LoadingSpinner from "@/components/ui/loading-spinner";
import QueryErrorState from "@/components/ui/query-error-state";
import { useI18n } from "@/hooks/useI18n";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";
import { deleteCampaign, fetchCampaigns } from "@/utils/api";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { useLocaleConstants } from "@/utils/localeConstants";
import { campaignKeys } from "@/utils/query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import CampaignDialog from "./CampaignDialog";

function CampaignCard({ campaign, onEdit, onDelete, canDelete }) {
  const { t, translate, locale } = useI18n();
  const { formatDateTimeAmPmShort } = useLocaleConstants();
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

  const previewLabel = t?.uploadExcel?.preview || (locale === "ar" ? "معاينة" : "Preview");
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!campaignId) return;
    const text = `https://chat.lenaai.net/?campaign=${campaignId}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // If copy fails, do nothing (avoid breaking the UI)
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header (type + link + actions) */}
      <div className="flex items-center justify-between gap-3 bg-[#F6F7FB] border-b border-[#E6E6E6] px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs font-mono text-gray-600 break-all">
            {campaignHref ? (
              <button
                type="button"
                onClick={handleCopyLink}
                className="hover:underline text-left"
                title={
                  copied
                    ? translate("common.copied", locale === "ar" ? "تم النسخ" : "Copied")
                    : translate(
                        "common.clickToCopy",
                        locale === "ar" ? "انقر للنسخ" : "Click to copy"
                      )
                }
              >
                {campaignUrlText}
                {copied ? (
                  <span className="ms-2 inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
                    {translate("common.copied", locale === "ar" ? "تم النسخ" : "Copied")}
                  </span>
                ) : null}
              </button>
            ) : (
              campaignUrlText
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {campaignHref ? (
            <a
              href={campaignHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-10 px-3 py-2 rounded-md border border-[#E6E6E6] bg-white text-[#494A4B] hover:bg-gray-50 transition-colors text-sm"
            >
              {previewLabel}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center h-10 px-3 py-2 rounded-md border border-[#E6E6E6] bg-gray-50 text-gray-400 cursor-not-allowed text-sm"
            >
              {previewLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit?.(campaign)}
            className="inline-flex items-center gap-2 h-10 px-3 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
          >
            <Pencil size={16} />
            {translate("campaigns.edit", locale === "ar" ? "تعديل" : "Edit")}
          </button>

          {canDelete ? (
            <DeleteButton
              size="lg"
              onClick={() => onDelete?.(campaign)}
              title={translate("campaigns.delete")}
              ariaLabel={translate("campaigns.delete")}
            >
              {translate("campaigns.delete")}
            </DeleteButton>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="space-y-1 text-sm text-gray-800">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="text-gray-500">
                {translate("campaigns.campaignManager")}:
              </span>{" "}
              <span className="font-mono">{campaign?.client_phone_number || "—"}</span>
            </span>
            {campaign?.project_id && (
              <span>
                <span className="text-gray-500">
                  {translate("campaigns.project", "Project")}:
                </span>{" "}
                <span className="font-medium">{campaign?.project_name || "—"}</span>
              </span>
            )}
          </div>

          {!isUnitMode ? (
            <div className="text-gray-800">
              <span className="text-gray-500">{translate("campaigns.text")}:</span>{" "}
              <span className="font-medium">{campaign?.text ? String(campaign.text) : "—"}</span>
            </div>
          ) : (
            <div className="text-gray-800">
              <span className="text-gray-500">{translate("campaigns.unit")}:</span>{" "}
              <span className="font-medium">
                {campaign?.unit?.unitTitle ||
                  campaign?.unit?.title ||
                  campaign?.unit?.unitId ||
                  campaign?.unit?.id ||
                  translate("campaigns.unit")}
              </span>
            </div>
          )}
        </div>

      {/* Images */}
      {!isUnitMode && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-600 mb-2">
            {translate("campaigns.images")} ({images.length})
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
                    src={getDisplayImageUrl(img?.url) || "/images/property_placeholder.jpg"}
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
              {translate("campaigns.noImages")}
            </div>
          )}
        </div>
      )}

      {/* Suggested answers */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-600 mb-2">
          {translate("campaigns.suggestedAnswers")} ({suggestedAns.length})
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
            {translate("campaigns.noSuggestedAnswers")}
          </div>
        )}
      </div>

      {/* Created/Updated */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-800">
        <span>
          <span className="text-gray-500">{translate("campaigns.createdAt")}:</span>{" "}
          {formatDateTimeAmPmShort(campaign?.created_at) || "—"}
        </span>
        <span>
          <span className="text-gray-500">{translate("campaigns.updatedAt")}:</span>{" "}
          {formatDateTimeAmPmShort(campaign?.updated_at) || "—"}
        </span>
      </div>

      {/* Link clicked */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-600 mb-2">
            {translate("campaigns.linkClicks")}: {linkClicked.length}
        </div>
        {lastClick ? (
          <div className="text-sm text-gray-700">
            {translate("campaigns.lastClick")}:{" "}
            <span className="font-mono">
              {formatDateTimeAmPmShort(lastClick?.date) || "—"}
            </span>{" "}
            {lastClick?.device ? (
              <span className="text-gray-500">({String(lastClick.device)})</span>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {translate("campaigns.noClicks")}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function CampaignsPageClient() {
  const { t, translate } = useI18n();
  const queryClient = useQueryClient();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Dialog wiring (implemented next)
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDeleteCampaign = useMemo(() => {
    const role = getRoleFromToken();
    return ["admin", "owner"].includes(String(role || "").toLowerCase());
  }, []);

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
  const sortedCampaigns = useMemo(() => {
    if (!campaigns.length) return [];
    return [...campaigns].sort((a, b) => {
      const dateA = new Date(a?.created_at || 0).getTime();
      const dateB = new Date(b?.created_at || 0).getTime();
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });
  }, [campaigns]);
  const totalCount = data?.total_count ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < totalCount;

  const handleConfirmDelete = async () => {
    const campaignId = campaignToDelete?.id;
    if (!campaignId || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await deleteCampaign(campaignId);
      if (res?.error || res?.status === false) {
        toast.error(
          res?.error || translate("campaigns.errors.deleteFailed")
        );
        return;
      }

      toast.success(
        translate("campaigns.toasts.deleted") ||
          translate("common.campaignDeleted")
      );
      setCampaignToDelete(null);
      await queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    } catch (err) {
      console.error("Error deleting campaign:", err?.message);
      toast.error(translate("campaigns.errors.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={translate("common.loadingData")} />;
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col">
        <QueryErrorState
          error={error}
          refetch={refetch}
          isFetching={isFetching}
          title={translate("common.error")}
          message={translate("common.operationFailed")}
          retryLabel={translate("common.retry")}
        />
      </div>
    );
  }

  const campaignsTitle = t?.sidebar?.campaigns ?? "Campaigns";
  const newCampaignLabel = t?.campaigns?.newCampaign ?? "New Campaign";
  const showingLabel = t?.campaigns?.showing ?? "Showing";
  const ofLabel = t?.campaigns?.of ?? "of";

  return (
    <div className="h-full flex flex-col">
      {/* Header Container */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          {/* Campaign Info */}
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <span className="text-sm text-gray-600">
              {translate("campaigns.total")}:{" "}
              <span className="font-medium text-gray-900">{totalCount}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null);
                setIsCampaignDialogOpen(true);
              }}
              className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              <Plus size={18} className="shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{newCampaignLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Margin Separator */}
      <div className="h-4 bg-gray-100"></div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
          className="h-10 px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
          label={translate("common.previous")}
        />
        <div className="text-sm text-gray-600">
          {showingLabel}{" "}
          <span className="font-medium">{Math.min(offset + 1, totalCount)}</span>-
          <span className="font-medium">
            {Math.min(offset + limit, totalCount)}
          </span>{" "}
          {ofLabel} <span className="font-medium">{totalCount}</span>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setOffset((prev) => prev + limit)}
          className="h-10 px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
          label={translate("common.next")}
        />
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {sortedCampaigns.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
            {translate("common.noCampaignsFound")}
          </div>
        ) : (
          sortedCampaigns.map((c) => (
            <CampaignCard
              key={c?.id || JSON.stringify(c)}
              campaign={c}
              canDelete={canDeleteCampaign}
              onEdit={(campaign) => {
                setEditingCampaign(campaign);
                setIsCampaignDialogOpen(true);
              }}
              onDelete={(campaign) => setCampaignToDelete(campaign)}
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

      {campaignToDelete ? (
        <DeleteConfirmDialog
          isOpen={!!campaignToDelete}
          onClose={() => {
            if (isDeleting) return;
            setCampaignToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title={translate("campaigns.deleteTitle")}
          message={translate("campaigns.deleteMessage")}
          confirmLabel={
            isDeleting
              ? translate("common.deleting")
              : translate("campaigns.delete")
          }
          cancelLabel={translate("cancelButton") || translate("common.cancel")}
        />
      ) : null}
    </div>
  );
}
