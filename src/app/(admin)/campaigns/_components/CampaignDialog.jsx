"use client";

import Dialog from "@/components/ui/Dialog";
import ImageUploader from "@/components/ui/inputs/image-uploader";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import { useI18n } from "@/hooks/useI18n";
import { createCampaign, updateCampaign } from "@/utils/api";
import { campaignKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import UnitSelectorDialog from "./UnitSelectorDialog";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";

function normalizeSuggestedAnswers(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const v = arr.map((x) => (x == null ? "" : String(x)));
  return [v[0] || "", v[1] || "", v[2] || ""];
}

/**
 * Convert Arabic numerals (٠-٩) to English numerals (0-9)
 * Allows users to type in Arabic numerals and converts for API compatibility
 */
function convertArabicToEnglishNumerals(str) {
  if (!str) return str;
  const arabicToEnglish = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return String(str).replace(/[٠-٩]/g, (match) => arabicToEnglish[match] || match);
}

export default function CampaignDialog({
  isOpen,
  onClose,
  campaign, // null for create, object for update
  onSuccess,
}) {
  const { t, translate, locale } = useI18n();
  const queryClient = useQueryClient();
  const c = t?.campaigns || {};

  const editMode = !!campaign?.id;
  const didInitRef = useRef(false);
  const lastCampaignIdToastAtRef = useRef(0);
  const lastClientPhoneToastAtRef = useRef(0);

  const [mode, setMode] = useState("text"); // 'text' | 'unit'
  const [campaignIdInput, setCampaignIdInput] = useState(""); // create only: user-defined campaign_id (4–16 chars, no spaces)
  const [clientPhoneNumber, setClientPhoneNumber] = useState("");

  // Preserve state between toggles
  const [textValue, setTextValue] = useState("");
  const [textImages, setTextImages] = useState([]); // [{url,fileId}]
  const [selectedUnit, setSelectedUnit] = useState(null); // full unit object
  const [suggestedAns, setSuggestedAns] = useState(["", "", ""]);
  const [signupForum, setSignupForum] = useState("");
  const SIGNUP_FORUM_OPTIONS = useMemo(() => ([
    { value: "hidden", label: c.signupForumOptions?.hidden || "Hidden" },
    { value: "optional", label: c.signupForumOptions?.optional || "Optional" },
    { value: "required", label: c.signupForumOptions?.required || "Required" },
  ]), [c]);

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
      setCampaignIdInput(""); // not editable in edit mode
      setClientPhoneNumber(convertArabicToEnglishNumerals(campaign?.client_phone_number || ""));
      setTextValue(campaign?.text || "");
      // Normalize images to { url, fileId } for ImageUploader (API may return file_id)
      const rawImages = Array.isArray(campaign?.images) ? campaign.images : [];
      const normalizedImages = rawImages.map((img) => ({
        url: img?.url || img?.image_url || "",
        fileId: img?.fileId ?? img?.file_id ?? img?.id ?? "",
      })).filter((img) => img.url && img.fileId);
      setTextImages(normalizedImages);
      setSelectedUnit(campaign?.unit || null);
      setSuggestedAns(normalizeSuggestedAnswers(campaign?.suggested_ans));
      setSignupForum((campaign?.signup_forum || "optional").toLowerCase());
    } else {
      setMode("text");
      setCampaignIdInput("");
      setClientPhoneNumber("");
      setTextValue("");
      setTextImages([]);
      setSelectedUnit(null);
      setSuggestedAns(["", "", ""]);
      setSignupForum("optional");
    }
  }, [isOpen, campaign]);

  const payload = useMemo(() => {
    const cleanSuggested = suggestedAns
      .map((x) => (x || "").trim())
      .filter(Boolean);

    // Convert any Arabic numerals to English before sending to API
    const normalizedPhone = convertArabicToEnglishNumerals(clientPhoneNumber || "").trim();

    const base = {
      client_phone_number: normalizedPhone,
      suggested_ans: cleanSuggested,
      signup_forum: (signupForum || "optional").toLowerCase(),
    };

    // Include campaign_id only when creating (cannot be updated)
    if (!editMode && campaignIdInput.trim()) {
      base.campaign_id = campaignIdInput.trim();
    }

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
  }, [editMode, campaignIdInput, clientPhoneNumber, mode, selectedUnit, suggestedAns, textImages, textValue, signupForum]);

  const validate = () => {
    if (!editMode) {
      const raw = (campaignIdInput || "").trim();
      if (!raw) {
        toast.error(t?.campaigns?.errors?.campaignIdRequired);
        return false;
      }
      if (raw.length < 4 || raw.length > 16) {
        toast.error(t?.campaigns?.errors?.campaignIdLength);
        return false;
      }
      if (/\s/.test(raw)) {
        toast.error(t?.campaigns?.errors?.campaignIdNoSpaces);
        return false;
      }
    }

    if (!payload.client_phone_number) {
      toast.error(t?.campaigns?.errors?.clientPhoneRequired);
      return false;
    }
    {
      // Phone number is already normalized (Arabic numerals converted to English)
      const digits = String(payload.client_phone_number || "").replace(/[^\d]/g, "");
      if (!digits.startsWith("20")) {
        toast.error(translate("campaigns.errors.clientPhoneMustStartWith20"));
        return false;
      }
    }

    if (mode === "unit") {
      if (!selectedUnit) {
        toast.error(t?.campaigns?.errors?.unitRequired);
        return false;
      }
      return true;
    }

    if (!payload.text) {
      toast.error(t?.campaigns?.errors?.textRequired);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (mode === "text" && isUploadingImages) {
      toast.error(t?.campaigns?.errors?.waitForImages);
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
        toast.error(res?.message || t?.campaigns?.errors?.requestFailed);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        editMode
          ? t?.campaigns?.toasts?.updated
          : t?.campaigns?.toasts?.created
      );

      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      onSuccess?.(res?.data || null);
      onClose?.();
    } catch (e) {
      toast.error(e?.message || t?.common?.somethingWentWrong);
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
        locale === "ar" ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm disabled:opacity-70 disabled:pointer-events-none"
            disabled={isSubmitting || (mode === "text" && isUploadingImages)}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {editMode ? translate("common.updating") : translate("common.creating")}
              </span>
            ) : editMode ? (
              translate("common.update")
            ) : (
              translate("common.create")
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm"
            disabled={isSubmitting}
          >
            {translate("common.cancel")}
          </button>
        )
      }
      headerActions={
        locale === "ar" ? (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm"
            disabled={isSubmitting}
          >
            {translate("common.cancel")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm disabled:opacity-70 disabled:pointer-events-none"
            disabled={isSubmitting || (mode === "text" && isUploadingImages)}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {editMode ? translate("common.updating") : translate("common.creating")}
              </span>
            ) : editMode ? (
              translate("common.update")
            ) : (
              translate("common.create")
            )}
          </button>
        )
      }
    >
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4">
          {!editMode && (
            <LenaTextField
              label={t.campaigns.campaignIdLabel}
              name="campaign_id"
              value={campaignIdInput}
              onChange={(e) => {
                const raw = String(e.target.value || "");
                // campaign_id must be English-only (no Arabic/Unicode letters)
                const sanitized = raw
                  .normalize("NFKD")
                  .replace(/[^\x00-\x7F]/g, "") // strip non-ASCII (e.g. Arabic)
                  .replace(/\s/g, ""); // no spaces
                if (sanitized !== raw) {
                  const now = Date.now();
                  if (now - lastCampaignIdToastAtRef.current >= 3000) {
                    lastCampaignIdToastAtRef.current = now;
                    toast.error(translate("campaigns.errors.campaignIdEnglishOnly"));
                  }
                }
                setCampaignIdInput(sanitized);
              }}
              dir="ltr"
              placeholder={t.campaigns.signupForumPlaceholder}
              required
              maxLength={16}
              helperText={t.campaigns.campaignIdHelp}
            />
          )}

          <LenaTextField
            label={t.campaigns.clientPhoneNumber}
            name="client_phone_number"
            value={clientPhoneNumber}
            onChange={(e) => {
              const raw = String(e.target.value || "");
              // Convert Arabic numerals to English numerals first
              const withEnglishNumerals = convertArabicToEnglishNumerals(raw);
              // Then keep only digits (English numerals now)
              const digitsOnly = withEnglishNumerals.replace(/[^\d]/g, "");
              if (digitsOnly !== withEnglishNumerals) {
                const now = Date.now();
                if (now - lastClientPhoneToastAtRef.current >= 3000) {
                  lastClientPhoneToastAtRef.current = now;
                  toast.error(translate("campaigns.errors.clientPhoneNumbersOnly"));
                }
              }
              setClientPhoneNumber(digitsOnly);
            }}
            dir="ltr"
            placeholder={translate("campaigns.clientPhonePlaceholder")}
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />

          <div>
            <div className="text-sm font-medium text-gray-800 mb-2">
              {t.campaigns.campaignType}
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="campaign_mode"
                  checked={mode === "text"}
                  onChange={() => setMode("text")}
                />
                <span className="text-sm text-gray-800 ml-2">{t.campaigns.typeText}</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="campaign_mode"
                  checked={mode === "unit"}
                  onChange={() => setMode("unit")}
                />
                <span className="text-sm text-gray-800">{t.campaigns.typeUnit}</span>
              </label>
            </div>
          </div>

          {/* Text mode */}
          {mode === "text" && (
            <div className="space-y-4">
              <LenaTextarea
                label={t.campaigns.text}
                name="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={5}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />

              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {t.campaigns.imagesLabel}
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
                  {t.campaigns.selectedUnit}
                </div>
                {selectedUnit ? (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">
                      {selectedUnit.unitTitle ||
                        selectedUnit.title ||
                        selectedUnit.unitId ||
                        selectedUnit.id ||
                        t.campaigns.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedUnit.project
                        ? `${t.campaigns.project}: ${selectedUnit.project}`
                        : null}
                      {selectedUnit.city
                        ? ` • ${t.campaigns.city}: ${selectedUnit.city}`
                        : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    {t.campaigns.noUnitSelected}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsUnitSelectorOpen(true)}
                className="px-4 py-2 rounded-md bg-primary text-white hover:opacity-95 transition-opacity text-sm"
              >
                {t.campaigns.chooseUnit}
              </button>

              <div className="text-xs text-gray-500">
                {t.campaigns.unitModeNote}
              </div>
            </div>
          )}

          {/* Suggested answers */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-800">
              {t.campaigns.suggestedAnswersLabel}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[0, 1, 2].map((i) => (
                <LenaTextField
                  key={i}
                  label={t.campaigns.suggested + ' ' + (i + 1)}
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
