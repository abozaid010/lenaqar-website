"use client";

import { useI18n } from "@/hooks/useI18n";
import { X } from "lucide-react";
import NewActionForm from "./new-action-form";

/**
 * Lightweight overlay for adding a single action (form only).
 * History stays on the Actions tab underneath.
 */
export default function AddActionOverlay({
  userId,
  phoneNumber = "",
  name = "",
  ownerType = null,
  onClose,
  onSuccess,
  onActionUpdate,
  onAdvanceAfterAction,
  overlayClassName = "z-50",
}) {
  const { locale, translate } = useI18n();

  const title = translate(
    "actionForm.addNewAction",
    locale === "ar" ? "إضافة إجراء جديد" : "Add New Action"
  );
  const closeLabel = translate(
    "buttons.close",
    locale === "ar" ? "إغلاق" : "Close"
  );

  const handleSuccess = (createdAction) => {
    onSuccess?.(createdAction);
    onClose?.();
  };

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center bg-black/50 sm:items-center sm:p-4 ${overlayClassName}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-action-overlay-title"
        className="relative flex h-[min(92dvh,100%)] w-full flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[min(85dvh,720px)] sm:max-w-lg sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3
              id="add-action-overlay-title"
              className="truncate text-base font-semibold text-gray-900 sm:text-lg"
            >
              {title}
            </h3>
            {name ? (
              <p className="truncate text-xs text-gray-500">{name}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <NewActionForm
            userId={userId}
            phoneNumber={phoneNumber}
            name={name}
            ownerType={ownerType}
            onSuccess={handleSuccess}
            onActionUpdate={onActionUpdate}
            onAdvanceAfterAction={onAdvanceAfterAction}
            stickySubmit
            fieldPriority="action"
            composerLayout
          />
        </div>
      </div>
    </div>
  );
}
