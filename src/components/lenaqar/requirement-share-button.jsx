"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { SITE } from "@/config/site";
import { copyToClipboard } from "@/utils/phone-utils";
import { actionButtonClass } from "@/components/ui/action-button-class";
import {
  requirementShareUrl,
  whatsappShareHref,
} from "@/lib/lenaqar/requirement-public";

const FALLBACK_BUTTON_CLASS =
  "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border text-center border-primary/20 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.04]";

/**
 * Share one public buyer request: the phone's share sheet first; where it is missing
 * (most desktops) or fails, Copy link + WhatsApp.
 */
export default function RequirementShareButton({ publicId, shareText, className = "" }) {
  const { translate } = useI18n();
  const [fallbackOpen, setFallbackOpen] = useState(false);
  if (!publicId) return null;

  const url = requirementShareUrl(publicId, SITE.url);
  const title = translate("lenaqar.share.requestTitle");

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return; // the user closed the sheet
      }
    }
    setFallbackOpen((open) => !open);
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleShare}
        aria-expanded={fallbackOpen}
        data-share-method="native"
        data-share-item={publicId}
        className={actionButtonClass({ variant: "secondary", className: "w-full !text-sm" })}
      >
        <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        {translate("lenaqar.share.button")}
      </button>
      {fallbackOpen ? (
        <div className="flex gap-2">
          <button
            type="button"
            data-share-method="copy"
            data-share-item={publicId}
            onClick={() =>
              copyToClipboard(
                url,
                () => toast.success(translate("lenaqar.share.copied")),
                () => toast.error(translate("lenaqar.share.copyFailed")),
              )
            }
            className={FALLBACK_BUTTON_CLASS}
          >
            {translate("lenaqar.share.copyLink")}
          </button>
          <a
            href={whatsappShareHref(shareText, url)}
            target="_blank"
            rel="noopener noreferrer"
            data-share-method="whatsapp"
            data-share-item={publicId}
            className={FALLBACK_BUTTON_CLASS}
          >
            {translate("lenaqar.share.whatsapp")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
