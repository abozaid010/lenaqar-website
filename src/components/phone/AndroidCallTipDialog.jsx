"use client";

import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import { copyToClipboard } from "@/utils/phone-utils";

/**
 * One-time Android tip: pick Phone → Always, plus copy-number fallback.
 */
export default function AndroidCallTipDialog({
  isOpen,
  phoneValue,
  onContinue,
  onDismiss,
}) {
  const { translate } = useI18n();

  const handleCopy = async () => {
    if (!phoneValue) {
      toast.error(
        translate("common.failedToCopyPhone", "Failed to copy phone number")
      );
      return;
    }
    await copyToClipboard(
      phoneValue,
      () =>
        toast.success(
          translate("common.phoneCopied", "Phone number copied")
        ),
      () =>
        toast.error(
          translate("common.failedToCopyPhone", "Failed to copy phone number")
        )
    );
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onDismiss}
      title={translate("common.androidCallTipTitle", "Calling from this phone")}
      cancelLabel={translate("common.androidCallTipDismiss", "Got it")}
      onCancel={onDismiss}
      submitLabel={translate("common.androidCallTipContinue", "Continue call")}
      onSubmit={onContinue}
      submitDisabled={!phoneValue}
      closeOnEscape
      dialogClassName="max-w-md"
      bodyClassName="space-y-4"
    >
      <p className="text-sm text-gray-700 leading-relaxed">
        {translate(
          "common.androidCallTipBody",
          "If Android asks which app to use, choose Phone (or your dialer) and tap Always so calls open directly next time."
        )}
      </p>
      {phoneValue ? (
        <div className="flex flex-col gap-2">
          <p
            dir="ltr"
            className="text-sm font-mono tabular-nums text-gray-900 text-start bg-gray-50 rounded-md px-3 py-2 border border-gray-100"
          >
            {phoneValue}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md px-3 py-2 transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden />
            {translate("common.copyPhoneNumber", "Copy number")}
          </button>
        </div>
      ) : null}
    </UnifiedDialog>
  );
}
