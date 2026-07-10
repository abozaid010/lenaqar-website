"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import type { ChatTurn } from "@/hooks/useConversation";
import { useI18n } from "@/hooks/useI18n";
import { useUpdateUnit } from "@/hooks/use-unit-mutations";
import ImageWithLoader from "@/components/ui/image-with-loader";
import type { RawUnit } from "@/lib/units/unit-types";
import type { UseMutationResult } from "@tanstack/react-query";
import { MAX_UNIT_IMAGES } from "@/components/ui/unit-forms/unit-form-constants";
import {
  conversationImagesToUnitImages,
  extractConversationImages,
  isConversationImageAttached,
  mergeUnitImages,
  type ConversationImage,
} from "@/utils/conversation-images";
import { buildUnitImagesUpdatePayload } from "@/utils/unit-image-update";

interface ChatImagesToUnitProps {
  messages: ChatTurn[];
  rawUnit: RawUnit;
}

export default function ChatImagesToUnit({
  messages,
  rawUnit,
}: ChatImagesToUnitProps) {
  const { translate, locale } = useI18n();
  const router = useRouter();
  const updateUnitMutation = useUpdateUnit() as unknown as UseMutationResult<
    Record<string, unknown>,
    Error,
    Record<string, unknown>,
    unknown
  >;
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const unitImages = useMemo(
    () => (Array.isArray(rawUnit.images) ? rawUnit.images : []),
    [rawUnit.images],
  );

  const conversationImages = useMemo(
    () => extractConversationImages(messages),
    [messages],
  );

  if (conversationImages.length === 0) {
    return null;
  }

  const currentImageCount = unitImages.length;
  const selectedCount = selectedKeys.size;
  const isUpdating = updateUnitMutation.isPending;

  const toggleSelection = (image: ConversationImage) => {
    if (isConversationImageAttached(image, unitImages) || isUpdating) return;

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(image.key)) {
        next.delete(image.key);
        return next;
      }

      const maxSelectable = Math.max(0, MAX_UNIT_IMAGES - currentImageCount);
      if (next.size >= maxSelectable) {
        toast.error(
          translate(
            "unitInquiry.chatImages.maxImagesReached",
            locale === "ar"
              ? `الحد الأقصى للصور هو ${MAX_UNIT_IMAGES}`
              : `Maximum of ${MAX_UNIT_IMAGES} images allowed per unit`,
          ),
        );
        return prev;
      }

      next.add(image.key);
      return next;
    });
  };

  const handleAddToUnit = async () => {
    if (selectedCount === 0 || isUpdating) return;

    const selectedImages = conversationImages.filter((image) =>
      selectedKeys.has(image.key),
    );

    if (selectedImages.length === 0) return;

    const newUnitImages = conversationImagesToUnitImages(selectedImages);
    const mergedImages = mergeUnitImages(unitImages, newUnitImages);

    if (mergedImages.length === currentImageCount) {
      toast.error(
        translate(
          "unitInquiry.chatImages.duplicateOnly",
          locale === "ar"
            ? "الصور المحددة مرتبطة بالوحدة بالفعل"
            : "Selected images are already attached to this unit",
        ),
      );
      setSelectedKeys(new Set());
      return;
    }

    try {
      const payload = buildUnitImagesUpdatePayload(rawUnit, mergedImages);
      await updateUnitMutation.mutateAsync(payload);

      toast.success(
        translate(
          "unitInquiry.chatImages.success",
          locale === "ar"
            ? "تمت إضافة الصور إلى الوحدة بنجاح"
            : "Images added to unit successfully",
        ),
      );

      setSelectedKeys(new Set());
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : translate(
              "toasts.errorProcessing",
              locale === "ar" ? "حدث خطأ أثناء معالجة الطلب" : "Failed to process request",
            );
      toast.error(message);
    }
  };

  const addButtonLabel =
    selectedCount === 1
      ? translate(
          "unitInquiry.chatImages.addOne",
          locale === "ar" ? "إضافة صورة إلى الوحدة" : "Add 1 Image to Unit",
        )
      : translate(
          "unitInquiry.chatImages.addMany",
          locale === "ar"
            ? `إضافة ${selectedCount} صور إلى الوحدة`
            : `Add ${selectedCount} Images to Unit`,
        ).replace("{{count}}", String(selectedCount));

  const attachedLabel = translate(
    "unitInquiry.chatImages.alreadyAttached",
    locale === "ar" ? "مرفقة" : "Attached",
  );

  return (
    <div className="shrink-0 border-t border-gray-100 pt-3 space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {conversationImages.map((image) => {
          const isAttached = isConversationImageAttached(image, unitImages);
          const isSelected = selectedKeys.has(image.key);

          return (
            <button
              key={image.key}
              type="button"
              onClick={() => toggleSelection(image)}
              disabled={isAttached || isUpdating}
              aria-pressed={isSelected}
              aria-label={
                isAttached
                  ? attachedLabel
                  : isSelected
                    ? translate(
                        "unitInquiry.chatImages.deselect",
                        locale === "ar" ? "إلغاء تحديد الصورة" : "Deselect image",
                      )
                    : translate(
                        "unitInquiry.chatImages.select",
                        locale === "ar" ? "تحديد الصورة" : "Select image",
                      )
              }
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                isAttached
                  ? "border-gray-200 opacity-70 cursor-default"
                  : isSelected
                    ? "border-primary"
                    : "border-transparent hover:border-gray-300"
              } ${isUpdating ? "pointer-events-none opacity-60" : ""}`}
            >
              <ImageWithLoader
                src={image.displayUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => {}}
                onLoadComplete={() => {}}
              />

              {!isAttached && (
                <span
                  className={`absolute top-1 start-1 flex h-4 w-4 items-center justify-center rounded border ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white/90"
                  }`}
                  aria-hidden
                >
                  {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
              )}

              {isAttached ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 px-1 text-center text-[10px] font-medium leading-tight text-white">
                  {attachedLabel}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedCount > 0 ? (
        <button
          type="button"
          onClick={() => {
            void handleAddToUnit();
          }}
          disabled={isUpdating}
          className="w-full rounded-lg bg-primary py-2 px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdating
            ? translate(
                "unitInquiry.chatImages.adding",
                locale === "ar" ? "جارٍ الإضافة..." : "Adding...",
              )
            : addButtonLabel}
        </button>
      ) : null}
    </div>
  );
}
