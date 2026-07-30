"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";
import { useI18n } from "@/hooks/useI18n";
import { buildAdminUnitDetailPath } from "@/lib/units/unit-share-links";
import {
  appendUnitsSourcePendingQuery,
  buildUnitsListPathForSection,
  consumeUnitsListOrigin,
} from "@/utils/units-navigation-source";

export default function EditUnitClient({
  rawUnit,
  unitCode,
  clientId,
  fromPendingApproval = false,
}) {
  const router = useRouter();
  const { locale, translate } = useI18n();
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const section = fromPendingApproval ? "pending_approval" : "units";

  const detailPath = appendUnitsSourcePendingQuery(
    buildAdminUnitDetailPath(unitCode, clientId),
    fromPendingApproval
  );

  /** Cancel / back from the form: return to unit detail. */
  const handleClose = () => {
    router.push(detailPath);
  };

  /** Successful save: stay put and show a clear success overlay. */
  const handleSaveSuccess = () => {
    setShowSaveSuccess(true);
  };

  /**
   * Same as the previous post-save dismiss: return to the originating list
   * (hidden/pending units or units) with filters/search preserved.
   */
  const handleDismissToList = () => {
    setShowSaveSuccess(false);
    const origin = consumeUnitsListOrigin(section);
    const returnPath =
      origin ?? buildUnitsListPathForSection(section, clientId);
    router.push(returnPath);
  };

  const handlePreviewUnit = () => {
    setShowSaveSuccess(false);
    router.push(detailPath);
  };

  useEffect(() => {
    if (!showSaveSuccess) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleDismissToList();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showSaveSuccess]);

  const dismissLabel = fromPendingApproval
    ? translate(
        "unitPage.backToHiddenUnits",
        locale === "ar" ? "العودة إلى الوحدات المخفية" : "Back to Hidden Units"
      )
    : translate(
        "unitPage.backToUnits",
        locale === "ar" ? "العودة إلى الوحدات" : "Back to Units"
      );

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
          aria-describedby="unit-save-success-message"
          onClick={handleDismissToList}
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
              {translate(
                "unitPage.saveSuccessTitle",
                locale === "ar" ? "تم حفظ الوحدة بنجاح" : "Unit saved successfully"
              )}
            </h3>
            <p
              id="unit-save-success-message"
              className="mt-2 text-sm text-gray-600"
            >
              {translate(
                "unitPage.saveSuccessMessage",
                locale === "ar"
                  ? "تم حفظ جميع التعديلات. يمكنك معاينة الوحدة أو العودة إلى القائمة."
                  : "All changes were saved. Preview the unit or return to your list."
              )}
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center gap-2">
              <button
                type="button"
                onClick={handleDismissToList}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors min-h-11 sm:min-h-0"
              >
                {dismissLabel}
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
