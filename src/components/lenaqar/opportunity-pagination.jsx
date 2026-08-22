"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";

/**
 * Pagination for /opportunities.
 *
 * Real `<a href>` links, not buttons: these are the only path a crawler has to
 * the units below the first page. Active filters are carried through so a
 * filtered result set stays filtered across pages.
 */
export default function OpportunityPagination({ page, totalPages, total }) {
  const { translate } = useI18n();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefFor = (target) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  };

  const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-md border border-black/15 px-4 py-3 text-sm font-medium text-primary";

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-between gap-3"
      aria-label={translate("lenaqar.opportunities.pagePosition")
        .replace("{page}", page)
        .replace("{total}", totalPages)}
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          {translate("lenaqar.opportunities.prevPage")}
        </Link>
      ) : (
        <span />
      )}

      <p className="text-sm text-black/60 tabular-nums">
        {translate("lenaqar.opportunities.pagePosition")
          .replace("{page}", page)
          .replace("{total}", totalPages)}
        {" · "}
        {translate("lenaqar.opportunities.resultsCount").replace("{count}", total)}
      </p>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
          {translate("lenaqar.opportunities.nextPage")}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
