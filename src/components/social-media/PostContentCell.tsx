"use client";

import type { MouseEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function PostContentCell({
  content,
  isExpanded,
  onToggle,
}: {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { translate } = useI18n();

  if (!content?.trim()) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 max-w-[320px]">
      {!isExpanded ? (
        <div className="line-clamp-2 text-gray-700 break-words" title={content}>
          {content}
        </div>
      ) : null}
      <button
        type="button"
        className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            {translate("socialMedia.actions.hideContent")}
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            {translate("socialMedia.actions.viewContent")}
          </>
        )}
      </button>
    </div>
  );
}

export function PostContentExpanded({ content }: { content: string }) {
  const { translate } = useI18n();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 max-w-full">
      <div className="text-xs font-semibold text-gray-600 mb-2">
        {translate("socialMedia.posts.content")}
      </div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {content}
      </div>
    </div>
  );
}
