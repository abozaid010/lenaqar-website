"use client";

import {
  SOCIAL_MEDIA_STATUSES,
  normalizeSocialMediaStatus,
  type SocialMediaStatus,
} from "@/types/socialMedia";
import { useI18n } from "@/hooks/useI18n";

const styles: Record<SocialMediaStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  publishing: "bg-sky-50 text-sky-700 ring-sky-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  deleted: "bg-gray-100 text-gray-600 ring-gray-200",
};

const labelKeys: Record<SocialMediaStatus, string> = {
  published: "socialMedia.status.published",
  pending: "socialMedia.status.pending",
  publishing: "socialMedia.status.publishing",
  failed: "socialMedia.status.failed",
  deleted: "socialMedia.status.deleted",
};

export function StatusBadge({ status }: { status: string }) {
  const { translate } = useI18n();
  const normalized = normalizeSocialMediaStatus(status);
  const label = translate(labelKeys[normalized]);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[normalized]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}

export function SocialMediaStatusOptions({
  includeAll = false,
}: {
  includeAll?: boolean;
}) {
  const { translate } = useI18n();

  return (
    <>
      {includeAll ? (
        <option value="all">{translate("socialMedia.filters.allStatuses")}</option>
      ) : null}
      {SOCIAL_MEDIA_STATUSES.map((status) => (
        <option key={status} value={status}>
          {translate(labelKeys[status])}
        </option>
      ))}
    </>
  );
}
