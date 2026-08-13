"use client";

import { useI18n } from "@/hooks/useI18n";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AddUnitModal from "./add-unit-Modal";
import UnitSaveSuccessDialog from "./unit-save-success-dialog";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  buildAdminUnitDetailPath,
  buildUnitDetailHrefFromListItem,
} from "@/lib/units/unit-share-links";
import { buildAdminUnitsListPath } from "@/utils/units-navigation-source";
import { actionButtonClass } from "@/components/ui/action-button-class";

export default function AddUnitButton({
  isEdit = false,
  unitData,
  disabled = false,
  label,
  className = "",
  variant = "primary",
  tone = "default",
  size = "default",
  showIcon,
}) {
  const { t, locale, translate } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [extractedQueue, setExtractedQueue] = useState([]);
  const [initialUnitData, setInitialUnitData] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [savedUnit, setSavedUnit] = useState(null);
  const isLabeledCta = Boolean(label) && !isEdit;

  const openModal = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (disabled) return;
    setInitialUnitData(null);
    setExtractedQueue([]);
    setShowSaveSuccess(false);
    setSavedUnit(null);
    setIsOpen(true);
  };

  const closeModalFully = () => {
    setInitialUnitData(null);
    setExtractedQueue([]);
    setIsOpen(false);
  };

  const closeModal = () => {
    if (extractedQueue.length > 0) {
      setInitialUnitData(extractedQueue[0]);
      setExtractedQueue((q) => q.slice(1));
      setIsOpen(true);
    } else {
      closeModalFully();
    }
  };

  const handleUnitsExtracted = (units) => {
    setInitialUnitData(units[0]);
    setExtractedQueue(units.slice(1));
    setIsOpen(true);
  };

  const handleSaveSuccess = (unit) => {
    setSavedUnit(unit && typeof unit === "object" ? unit : null);
    setExtractedQueue([]);
    setInitialUnitData(null);
    setIsOpen(false);
    setShowSaveSuccess(true);
  };

  const handleDismissToList = () => {
    setShowSaveSuccess(false);
    setSavedUnit(null);
    // Stay on the current units list URL so filters/search/cache stay intact.
  };

  const handlePreviewUnit = () => {
    setShowSaveSuccess(false);
    const clientId = LenaCookiesManager.getClientId();
    const href =
      buildUnitDetailHrefFromListItem(savedUnit, { clientId }) ||
      (savedUnit?.code
        ? buildAdminUnitDetailPath(savedUnit.code, clientId)
        : null);
    setSavedUnit(null);
    if (href) {
      router.push(href);
      return;
    }
    router.push(buildAdminUnitsListPath(clientId));
  };

  const unitDataToPass = isEdit ? unitData : initialUnitData ?? unitData;
  const canPreview = Boolean(
    savedUnit &&
      (savedUnit.code ||
        savedUnit.unitId ||
        savedUnit.unit_id ||
        savedUnit.id)
  );
  const includeIcon = showIcon ?? !isLabeledCta;
  const labeledClass = actionButtonClass({
    variant,
    tone,
    size,
    className: `${t.dir === "rtl" ? "flex-row-reverse" : ""} ${
      disabled ? "opacity-40 cursor-not-allowed" : ""
    } ${className}`,
  });

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={disabled}
        title={
          disabled
            ? "You can only edit your own units"
            : isLabeledCta
              ? label
              : undefined
        }
        aria-label={isLabeledCta ? label : undefined}
        className={
          isLabeledCta
            ? labeledClass
            : `flex-shrink-0 sm:w-auto min-h-11 h-11 min-w-11 lg:min-h-[40px] lg:h-[40px] lg:min-w-0 px-3 sm:px-4 bg-primary text-white rounded-[5px] flex items-center justify-center transition duration-300 ${
                t.dir === "rtl" ? "flex-row-reverse" : ""
              } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"} ${className}`
        }
      >
        {isEdit ? (
          <span className="flex items-center gap-2">
            <Edit size={18} />{" "}
            <span className="hidden sm:block">{t.units.addButton.edit}</span>
          </span>
        ) : isLabeledCta ? (
          <span className="flex items-center gap-2">
            {includeIcon ? <Plus width={20} height={20} aria-hidden /> : null}
            <span>{label}</span>
          </span>
        ) : (
          <Plus width={24} height={24} />
        )}
      </button>

      {isOpen && (
        <AddUnitModal
          isEdit={isEdit}
          unitData={unitDataToPass}
          onClose={closeModal}
          onUnitsExtracted={handleUnitsExtracted}
          onSaveSuccess={isEdit ? undefined : handleSaveSuccess}
        />
      )}

      <UnitSaveSuccessDialog
        isOpen={showSaveSuccess}
        onDismiss={handleDismissToList}
        onPreview={handlePreviewUnit}
        canPreview={canPreview}
        title={translate(
          "unitPage.addSuccessTitle",
          locale === "ar" ? "تمت إضافة الوحدة بنجاح" : "Unit added successfully"
        )}
        message={translate(
          "unitPage.addSuccessMessage",
          locale === "ar"
            ? "تم إنشاء الوحدة. يمكنك معاينتها أو العودة إلى القائمة."
            : "Your unit was created. Preview it or return to your list."
        )}
      />
    </>
  );
}
