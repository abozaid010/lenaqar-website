"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditUnitForm from "@/components/ui/unit-forms/add-unit-Modal";
import UnitSaveSuccessDialog from "@/components/ui/unit-forms/unit-save-success-dialog";
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

      <UnitSaveSuccessDialog
        isOpen={showSaveSuccess}
        onDismiss={handleDismissToList}
        onPreview={handlePreviewUnit}
        dismissLabel={dismissLabel}
      />
    </>
  );
}
