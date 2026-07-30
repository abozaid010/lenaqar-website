"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";
import { useI18n } from "@/hooks/useI18n";
import { buildAdminUnitDetailPath } from "@/lib/units/unit-share-links";
import { appendUnitsSourcePendingQuery } from "@/utils/units-navigation-source";

export default function EditUnitClient({
  rawUnit,
  unitCode,
  clientId,
  fromPendingApproval = false,
}) {
  const router = useRouter();
  const { locale, translate } = useI18n();
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const detailPath = appendUnitsSourcePendingQuery(
    buildAdminUnitDetailPath(unitCode, clientId),
    fromPendingApproval
  );

  /** Cancel / back: return to unit detail. Do not clear list origin — filters stay intact. */
  const handleClose = () => {
    router.push(detailPath);
  };

  /** Successful save: keep edit context and show a lightweight success overlay. */
  const handleSaveSuccess = () => {
    setShowSaveSuccess(true);
  };

  const handleContinueEditing = () => {
    setShowSaveSuccess(false);
  };

  const handlePreviewUnit = () => {
    setShowSaveSuccess(false);
    router.push(detailPath);
  };

  useEffect(() => {
    if (!showSaveSuccess) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleContinueEditing();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showSaveSuccess]);

  return (
    <>
      <EditUnitForm
        unitData={rawUnit}
        isEdit={true}
        isPageMode={true}
        onClose={handleClose}
        onSaveSuccess={handleSaveSuccess}
        onUnitsExtracted={handleClose}
      />

      {showSaveSuccess ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unit-save-success-title"
          onClick={handleContinueEditing}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="unit-save-success-title"
              className="text-lg font-semibold text-gray-900"
            >
              {translate(
                "unitPage.saveSuccessTitle",
                locale === "ar" ? "تم الحفظ" : "Unit saved"
              )}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {translate(
                "unitPage.saveSuccessMessage",
                locale === "ar"
                  ? "تم حفظ التعديلات بنجاح."
                  : "Your changes have been saved successfully."
              )}
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={handleContinueEditing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-h-11 sm:min-h-0"
              >
                {translate(
                  "unitPage.continueEditing",
                  locale === "ar" ? "متابعة التعديل" : "Continue Editing"
                )}
              </button>
              <button
                type="button"
                onClick={handlePreviewUnit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors min-h-11 sm:min-h-0 inline-flex items-center justify-center gap-2"
              >
                {translate(
                  "unitPage.previewUnit",
                  locale === "ar" ? "معاينة الوحدة" : "Preview Unit"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
