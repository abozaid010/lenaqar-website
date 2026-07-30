"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

/**
 * Post save/add success overlay — Preview Unit or return to list.
 * Mobile: bottom sheet; desktop: centered modal.
 */
export default function UnitSaveSuccessDialog({
  isOpen,
  onDismiss,
  onPreview,
  title,
  message,
  dismissLabel,
  previewLabel,
  canPreview = true,
}) {
  const { locale, translate } = useI18n();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onDismiss?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const resolvedTitle =
    title ||
    translate(
      "unitPage.saveSuccessTitle",
      locale === "ar" ? "تم حفظ الوحدة بنجاح" : "Unit saved successfully"
    );
  const resolvedMessage =
    message ||
    translate(
      "unitPage.saveSuccessMessage",
      locale === "ar"
        ? "تم حفظ جميع التعديلات. يمكنك معاينة الوحدة أو العودة إلى القائمة."
        : "All changes were saved. Preview the unit or return to your list."
    );
  const resolvedDismiss =
    dismissLabel ||
    translate(
      "unitPage.backToUnits",
      locale === "ar" ? "العودة إلى الوحدات" : "Back to Units"
    );
  const resolvedPreview =
    previewLabel ||
    translate(
      "unitPage.previewUnit",
      locale === "ar" ? "معاينة الوحدة" : "Preview Unit"
    );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-save-success-title"
      aria-describedby="unit-save-success-message"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
          aria-hidden="true"
        >
          <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={2} />
        </div>
        <h3
          id="unit-save-success-title"
          className="text-xl font-semibold text-gray-900"
        >
          {resolvedTitle}
        </h3>
        <p id="unit-save-success-message" className="mt-2 text-sm text-gray-600">
          {resolvedMessage}
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-h-11 sm:min-h-0"
          >
            {resolvedDismiss}
          </button>
          {canPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors min-h-11 sm:min-h-0 inline-flex items-center justify-center gap-2"
            >
              {resolvedPreview}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
