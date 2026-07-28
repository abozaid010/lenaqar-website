"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";

/**
 * Confirm before submitting a terminal action (opts lead out of follow-up).
 */
export default function TerminalActionDialog({
  isOpen,
  onClose,
  onConfirm,
  actionLabel = "",
}) {
  const { translate } = useI18n();

  const title = translate(
    "actionCatalog.terminalConfirm.title",
    "Confirm terminal action"
  );
  const message = translate(
    "actionCatalog.terminalConfirm.message",
    "This action will opt the lead out of follow-up. Continue?"
  ).replace("{action}", actionLabel || "");
  const confirmLabel = translate(
    "actionCatalog.terminalConfirm.confirm",
    "Continue"
  );
  const cancelLabel = translate("buttons.cancel", "Cancel");

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onClose}
      title={title}
      cancelLabel={cancelLabel}
      submitLabel={confirmLabel}
      onSubmit={onConfirm}
      closeOnEscape
      dialogClassName="max-w-md"
    >
      <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
    </UnifiedDialog>
  );
}
