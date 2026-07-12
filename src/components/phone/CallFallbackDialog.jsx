"use client";

import { Copy, Phone } from "lucide-react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import { copyToClipboard } from "@/utils/phone-utils";

/**
 * Shown when a `tel:` call could not be handed off to a phone app
 * (unsupported browser/OS/device). Lets the user copy the number and place the
 * call manually, or retry the automatic call.
 */
export default function CallFallbackDialog({
  isOpen,
  phoneValue,
  telHref,
  onRetry,
  onClose,
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
        toast.success(translate("common.phoneCopied", "Phone number copied")),
      () =>
        toast.error(
          translate("common.failedToCopyPhone", "Failed to copy phone number")
        )
    );
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("common.callFallbackTitle", "Couldn't open the phone app")}
      cancelLabel={translate("common.close", "Close")}
      onCancel={onClose}
      submitLabel={telHref ? translate("common.callFallbackRetry", "Try again") : undefined}
      onSubmit={telHref ? onRetry : undefined}
      closeOnEscape
      dialogClassName="max-w-md"
      bodyClassName="space-y-4"
    >
      <p className="text-sm text-gray-700 leading-relaxed">
        {translate(
          "common.callFallbackBody",
          "We couldn't open your phone app automatically. Copy the number below and dial it manually to place the call."
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md px-3 py-2 transition-colors"
            >
              <Copy className="w-4 h-4" aria-hidden />
              {translate("common.copyPhoneNumber", "Copy number")}
            </button>
            {telHref ? (
              <a
                href={telHref}
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md px-3 py-2 transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden />
                {translate("common.callFallbackDial", "Open dialer")}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </UnifiedDialog>
  );
}
