"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { SITE } from "@/config/site";
import { copyToClipboard } from "@/utils/phone-utils";
import {
  requirementShareUrl,
  whatsappShareHref,
} from "@/lib/lenaqar/requirement-public";

const MENU_ITEM_CLASS =
  "block w-full whitespace-nowrap rounded-md px-3 py-2 text-start text-sm font-semibold text-primary hover:bg-primary/[0.05]";

/**
 * Small share icon for one public buyer request: the phone's share sheet first; where
 * it is missing (most desktops) or fails, a menu with Copy link + WhatsApp.
 */
export default function RequirementShareButton({ publicId, shareText, className = "" }) {
  const { translate } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!publicId) return null;

  const url = requirementShareUrl(publicId, SITE.url);
  const title = translate("lenaqar.share.requestTitle");
  const label = translate("lenaqar.share.button");

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return; // the user closed the sheet
      }
    }
    setMenuOpen((open) => !open);
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleShare}
        title={label}
        aria-label={label}
        aria-expanded={menuOpen}
        data-share-method="native"
        data-share-item={publicId}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/[0.06] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </button>
      {menuOpen ? (
        <div className="absolute end-0 top-full z-20 mt-1 min-w-44 rounded-lg border border-primary/10 bg-white p-1 shadow-lg">
          <button
            type="button"
            data-share-method="copy"
            data-share-item={publicId}
            onClick={() =>
              copyToClipboard(
                url,
                () => {
                  toast.success(translate("lenaqar.share.copied"));
                  setMenuOpen(false);
                },
                () => toast.error(translate("lenaqar.share.copyFailed")),
              )
            }
            className={MENU_ITEM_CLASS}
          >
            {translate("lenaqar.share.copyLink")}
          </button>
          <a
            href={whatsappShareHref(shareText, url)}
            target="_blank"
            rel="noopener noreferrer"
            data-share-method="whatsapp"
            data-share-item={publicId}
            onClick={() => setMenuOpen(false)}
            className={MENU_ITEM_CLASS}
          >
            {translate("lenaqar.share.whatsapp")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
