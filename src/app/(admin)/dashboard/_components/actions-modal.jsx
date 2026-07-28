"use client";

import { useI18n } from "@/hooks/useI18n";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import NewActionForm from "./new-action-form";
import ActionsHistoryPanel from "./actions-history-panel";

/**
 * Full actions sheet used by clients table / schedule (history + composer).
 * Lead detail Actions tab uses inline history + AddActionOverlay instead.
 */
export default function ActionsModal({
  actions,
  onClose,
  userId,
  phoneNumber,
  name,
  ownerType = null,
  onActionUpdate,
  /** Raise when opened above another modal (e.g. schedule user details). */
  overlayClassName = "z-50",
}) {
  const { locale, translate } = useI18n();
  const [actionItems, setActionItems] = useState(() =>
    Array.isArray(actions) ? actions : []
  );

  useEffect(() => {
    setActionItems(Array.isArray(actions) ? actions : []);
  }, [actions]);

  const modalTitle = translate(
    "actionForm.title",
    locale === "ar" ? "الإجراءات" : "Actions"
  );
  const closeLabel = translate(
    "buttons.close",
    locale === "ar" ? "إغلاق" : "Close"
  );

  const handleActionSaved = (createdAction) => {
    if (createdAction && createdAction.action) {
      setActionItems((prev) => [...prev, createdAction]);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center bg-black/50 sm:items-center sm:p-4 ${overlayClassName}`}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="actions-modal-title"
        className="relative flex h-[min(92dvh,100%)] w-full flex-col overflow-hidden bg-white shadow-xl sm:h-[min(85dvh,720px)] sm:max-w-4xl sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3
              id="actions-modal-title"
              className="truncate text-lg font-semibold text-gray-900"
            >
              {modalTitle}
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="order-1 flex shrink-0 flex-col border-b border-gray-100 md:order-2 md:h-full md:min-h-0 md:shrink md:border-b-0">
            <NewActionForm
              userId={userId}
              phoneNumber={phoneNumber}
              name={name}
              ownerType={ownerType}
              onSuccess={handleActionSaved}
              onActionUpdate={onActionUpdate}
              showHeading
              stickySubmit
              fieldPriority="action"
              composerLayout
            />
          </section>

          <div className="order-2 flex min-h-0 flex-1 flex-col md:order-1 md:border-e md:border-gray-100">
            <ActionsHistoryPanel
              actions={actionItems}
              userId={userId}
              phoneNumber={phoneNumber}
              name={name}
              ownerType={ownerType}
              onActionUpdate={onActionUpdate}
              onActionsChange={setActionItems}
              fillHeight
            />
          </div>
        </div>
      </div>
    </div>
  );
}
