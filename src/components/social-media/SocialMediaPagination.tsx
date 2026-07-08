"use client";

import { useI18n } from "@/hooks/useI18n";

export function SocialMediaPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const { translate, localeUtils } = useI18n();

  const canPrev = page > 1;
  const canNext = page * pageSize < total;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="text-xs text-gray-500">
        {translate("socialMedia.pagination.showing")}{" "}
        <span className="font-semibold text-gray-700">
          {localeUtils.formatNumber(from)}-{localeUtils.formatNumber(to)}
        </span>{" "}
        {translate("socialMedia.pagination.of")}{" "}
        <span className="font-semibold text-gray-700">
          {localeUtils.formatNumber(total)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="h-10 px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {translate("common.previous")}
        </button>
        <div className="min-w-[86px] text-center text-xs font-semibold text-gray-700">
          {translate("socialMedia.pagination.page")} {localeUtils.formatNumber(page)}
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="h-10 px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {translate("common.next")}
        </button>
      </div>
    </div>
  );
}
