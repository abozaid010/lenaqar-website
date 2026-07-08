"use client";

import { Copy, ExternalLink, Link2 } from "lucide-react";
import type { MouseEvent } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function UrlLinkCell({
  url,
  variant = "post",
  onClickStop,
}: {
  url: string | null | undefined;
  variant?: "post" | "group";
  onClickStop?: (e: MouseEvent) => void;
}) {
  const { translate } = useI18n();

  if (!url) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const OpenIcon = variant === "group" ? Link2 : ExternalLink;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        onClick={(e) => {
          onClickStop?.(e);
          e.stopPropagation();
          copyText(url)
            .then(() => toast.success(translate("common.copied")))
            .catch(() => toast.error(translate("common.operationFailed")));
        }}
        aria-label={translate("socialMedia.actions.copyUrl")}
      >
        <Copy className="h-4 w-4" />
      </button>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        onClick={(e) => {
          onClickStop?.(e);
          e.stopPropagation();
        }}
        aria-label={
          variant === "group"
            ? translate("socialMedia.actions.openGroup")
            : translate("socialMedia.actions.openUrl")
        }
      >
        <OpenIcon className="h-4 w-4" />
      </a>
      <span className="max-w-[180px] truncate text-xs text-gray-600" title={url}>
        {url}
      </span>
    </div>
  );
}

export function CopyIdButton({ id }: { id: string }) {
  const { translate } = useI18n();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
      onClick={() => {
        copyText(id)
          .then(() => toast.success(translate("common.copied")))
          .catch(() => toast.error(translate("common.operationFailed")));
      }}
    >
      <Copy className="h-3.5 w-3.5" />
      <span className="font-mono truncate max-w-[160px]">{id}</span>
    </button>
  );
}
