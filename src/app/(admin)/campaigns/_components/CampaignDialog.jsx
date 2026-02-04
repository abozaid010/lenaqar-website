"use client";

import Dialog from "@/components/ui/Dialog";
import ImageUploader from "@/components/ui/inputs/image-uploader";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import { useI18n } from "@/context/translate-api";
import { createCampaign, updateCampaign } from "@/utils/api";
import { campaignKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import UnitSelectorDialog from "./UnitSelectorDialog";

function normalizeSuggestedAnswers(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const v = arr.map((x) => (x == null ? "" : String(x)));
  return [v[0] || "", v[1] || "", v[2] || ""];
}

export default function CampaignDialog({
  isOpen,
  onClose,
  campaign, // null for create, object for update
  onSuccess,
}) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const c = t?.campaigns || {};

  const editMode = !!campaign?.id;
  const didInitRef = useRef(false);

  const [mode, setMode] = useState("text"); // 'text' | 'unit'
  const [clientPhoneNumber, setClientPhoneNumber] = useState("");

  // Preserve state between toggles
  const [textValue, setTextValue] = useState("");
  const [textImages, setTextImages] = useState([]); // [{url,fileId}]
  const [selectedUnit, setSelectedUnit] = useState(null); // full unit object
  const [suggestedAns, setSuggestedAns] = useState(["", "", ""]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState(false);

  const title = useMemo(() => {
    return editMode
      ? c.updateTitle || "Update Campaign"
      : c.createTitle || "New Campaign";
  }, [editMode]);

  // Initialize only once per open, so toggling preserves edits
  useEffect(() => {
    if (!isOpen) {
      didInitRef.current = false;
      setIsSubmitting(false);
      setIsUploadingImages(false);
      setIsUnitSelectorOpen(false);
      return;
    }

    if (didInitRef.current) return;
    didInitRef.current = true;

    if (campaign?.id) {
      const isUnitMode = !!campaign?.unit;
      setMode(isUnitMode ? "unit" : "text");
      setClientPhoneNumber(campaign?.client_phone_number || "");
      setTextValue(campaign?.text || "");
      setTextImages(Array.isArray(campaign?.images) ? campaign.images : []);
      setSelectedUnit(campaign?.unit || null);
      setSuggestedAns(normalizeSuggestedAnswers(campaign?.suggested_ans));
    } else {
      setMode("text");
      setClientPhoneNumber("");
      setTextValue("");
      setTextImages([]);
      setSelectedUnit(null);
      setSuggestedAns(["", "", ""]);
    }
  }, [isOpen, campaign]);

  const payload = useMemo(() => {
    const cleanSuggested = suggestedAns
      .map((x) => (x || "").trim())
      .filter(Boolean);

    const base = {
      client_phone_number: (clientPhoneNumber || "").trim(),
      suggested_ans: cleanSuggested,
    };

    if (mode === "unit") {
      return {
        ...base,
        unit: selectedUnit,
      };
    }

    return {
      ...base,
      text: (textValue || "").trim(),
      images: Array.isArray(textImages) ? textImages : [],
    };
  }, [clientPhoneNumber, mode, selectedUnit, suggestedAns, textImages, textValue]);

  const validate = () => {
    if (!payload.client_phone_number) {
      toast.error(c.errors?.clientPhoneRequired || "Client phone number is required.");
      return false;
    }

    if (mode === "unit") {
      if (!selectedUnit) {
        toast.error(c.errors?.unitRequired || "Please select a unit.");
        return false;
      }
      return true;
    }

    if (!payload.text) {
      toast.error(c.errors?.textRequired || "Text is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (isUploadingImages) {
      toast.error(c.errors?.waitForImages || "Please wait for images to finish uploading.");
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = editMode
        ? await updateCampaign(campaign.id, payload)
        : await createCampaign(payload);

      if (res?.error) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      const isOk = res?.status === true || res?.code === 200;
      if (!isOk) {
        toast.error(res?.message || c.errors?.requestFailed || "Request failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        editMode
          ? c.toasts?.updated || "Campaign updated successfully"
          : c.toasts?.created || "Campaign created successfully"
      );

      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      onSuccess?.(res?.data || null);
      onClose?.();
    } catch (e) {
      toast.error(e?.message || c.errors?.somethingWentWrong || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      headerLeading={
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm"
          disabled={isSubmitting}
        >
          {t?.buttons?.cancel || "Cancel"}
        </button>
      }
      headerActions={
        <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm disabled:opacity-70 disabled:pointer-events-none"
            disabled={isSubmitting || isUploadingImages}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {editMode ? c.updating || "Updating..." : c.creating || "Creating..."}
              </span>
            ) : editMode ? (
              c.updateButton || "Update"
            ) : (
              c.createButton || "Create"
            )}
        </button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4">
          <LenaTextField
            label={c.clientPhoneNumber || "Client phone number"}
            name="client_phone_number"
            value={clientPhoneNumber}
            onChange={(e) => setClientPhoneNumber(e.target.value)}
            dir={locale === "ar" ? "rtl" : "ltr"}
            required
          />

          {/* Mode selector */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-sm font-medium text-gray-800 mb-2">
              {c.campaignType || "Campaign type"}
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="campaign_mode"
                  checked={mode === "text"}
                  onChange={() => setMode("text")}
                />
                <span className="text-sm text-gray-800">{c.typeText || "Text"}</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="campaign_mode"
                  checked={mode === "unit"}
                  onChange={() => setMode("unit")}
                />
                <span className="text-sm text-gray-800">{c.typeUnit || "Unit"}</span>
              </label>
            </div>
          </div>

          {/* Text mode */}
          {mode === "text" && (
            <div className="space-y-4">
              <LenaTextarea
                label={c.text || "Text"}
                name="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={5}
                dir={locale === "ar" ? "rtl" : "ltr"}
                required
              />

              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {c.imagesLabel || "Images (max 4, up to 10MB each)"}
                </div>
                <ImageUploader
                  maxImages={4}
                  initialImages={textImages}
                  onImagesChange={(imgs) => setTextImages(imgs)}
                  imageType="masterPlan"
                  isUploading={isUploadingImages}
                  setIsUploading={setIsUploadingImages}
                />
              </div>
            </div>
          )}

          {/* Unit mode */}
          {mode === "unit" && (
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="text-sm font-medium text-gray-800 mb-1">
                  {c.selectedUnit || "Selected unit"}
                </div>
                {selectedUnit ? (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">
                      {selectedUnit?.unitTitle ||
                        selectedUnit?.title ||
                        selectedUnit?.unitId ||
                        selectedUnit?.id ||
                        "Unit"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedUnit?.project
                        ? `${c.project || "Project"}: ${selectedUnit.project}`
                        : null}
                      {selectedUnit?.city
                        ? ` • ${c.city || "City"}: ${selectedUnit.city}`
                        : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    {c.noUnitSelected || "No unit selected."}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsUnitSelectorOpen(true)}
                className="px-4 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
              >
                {c.chooseUnit || "Choose unit"}
              </button>

              <div className="text-xs text-gray-500">
                {c.unitModeNote || "Note: images are hidden when unit is selected."}
              </div>
            </div>
          )}

          {/* Suggested answers */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-800">
              {c.suggestedAnswersLabel || "Suggested answers (up to 3)"}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[0, 1, 2].map((i) => (
                <LenaTextField
                  key={i}
                  label={`${c.suggested || "Suggested"} ${i + 1}`}
                  name={`suggested_${i}`}
                  value={suggestedAns[i] || ""}
                  onChange={(e) =>
                    setSuggestedAns((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  dir={locale === "ar" ? "rtl" : "ltr"}
                />
              ))}
            </div>
          </div>

          <UnitSelectorDialog
            isOpen={isUnitSelectorOpen}
            onClose={() => setIsUnitSelectorOpen(false)}
            onSelect={(unit) => {
              setSelectedUnit(unit);
              setIsUnitSelectorOpen(false);
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}

