"use client";

import { useI18n } from "@/hooks/useI18n";
import BuyRequestCta from "./buy-request-cta";

/**
 * Shared "no units" state for the opportunities feed — used on both `/` and
 * `/opportunities` so a bare feed always offers the buy-request CTA instead
 * of a dead end.
 */
export default function OpportunitiesEmpty({
  hasActiveFilters = false,
  cash = "",
  className = "",
}) {
  const { translate } = useI18n();
  const emptyKey = hasActiveFilters
    ? "lenaqar.opportunities.emptyFiltered"
    : "lenaqar.opportunities.empty";

  return (
    <div className={`rounded-lg border border-black/10 bg-white p-6 ${className}`}>
      <p className="text-black/70 mb-2">{translate(emptyKey)}</p>
      <p className="text-sm text-black/60 mb-4">
        {translate("lenaqar.opportunities.buyRequestHint")}
      </p>
      <BuyRequestCta
        className="w-full sm:w-auto"
        initialValues={cash ? { downPayment: cash } : undefined}
        label={translate("lenaqar.actions.buyUnit", "Buy Unit")}
      />
    </div>
  );
}
